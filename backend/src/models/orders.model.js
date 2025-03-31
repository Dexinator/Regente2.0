import pool from "../config/db.js";

// Obtener todas las órdenes
export const getAllOrders = async () => {
  const result = await pool.query("SELECT * FROM ordenes ORDER BY fecha DESC");
  return result.rows;
};

// Obtener solo órdenes abiertas
export const getOpenOrdersWithPayments = async () => {
  const result = await pool.query(`
    SELECT
      o.orden_id,
      o.fecha,
      COALESCE(p.reg_name, o.nombre_cliente) AS cliente,
      (
        SELECT COALESCE(SUM(d.precio_unitario * d.cantidad), 0)
        FROM detalles_orden d
        WHERE d.orden_id = o.orden_id
      ) AS total_calculado,
      (
        SELECT COALESCE(SUM(monto), 0)
        FROM pagos
        WHERE orden_id = o.orden_id
      ) AS total_pagado,
      (
        SELECT COALESCE(SUM(propina), 0)
        FROM pagos
        WHERE orden_id = o.orden_id
      ) AS total_propina
    FROM ordenes o
    LEFT JOIN presos p ON o.preso_id = p.id
    WHERE o.estado = 'abierta'
    ORDER BY o.fecha DESC
  `);

  return result.rows.map((orden) => {
    const diferencia = orden.total_pagado - orden.total_calculado;
    let estado_pago = "pendiente";
    if (diferencia >= 0) estado_pago = "pagado";

    return {
      orden_id: orden.orden_id,
      cliente: orden.cliente,
      total: parseFloat(orden.total_calculado),
      total_pagado: parseFloat(orden.total_pagado),
      total_propina: parseFloat(orden.total_propina),
      diferencia: parseFloat(diferencia.toFixed(2)),
      estado_pago,
    };
  });
};

// Obtener una orden con sus productos
export const getOrderWithDetails = async (orden_id) => {
  // Traemos los datos de la orden y el nombre del preso (si hay)
  const orden = await pool.query(
    `SELECT o.*, p.reg_name AS nombre_preso
     FROM ordenes o
     LEFT JOIN presos p ON o.preso_id = p.id
     WHERE o.orden_id = $1`,
    [orden_id]
  );

  if (orden.rows.length === 0) return null;

  // Traemos los productos incluidos en la orden con información de sabores
  const detalles = await pool.query(
    `SELECT d.*, p.nombre AS nombre_producto, p.categoria,
            s.nombre AS sabor_nombre, s.precio_adicional AS sabor_precio_adicional,
            cv.nombre AS sabor_categoria
     FROM detalles_orden d
     JOIN productos p ON d.producto_id = p.id
     LEFT JOIN sabores s ON d.sabor_id = s.id
     LEFT JOIN categorias_variantes cv ON s.categoria_id = cv.id
     WHERE d.orden_id = $1`,
    [orden_id]
  );

  return { ...orden.rows[0], detalles: detalles.rows };
};

// Crear nueva orden con detalles
export const createOrder = async ({ preso_id, nombre_cliente, empleado_id, productos }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Crear la orden (total y total_bruto inician en 0)
    const ordenRes = await client.query(
      `INSERT INTO ordenes (preso_id, nombre_cliente, total, total_bruto, empleado_id)
       VALUES ($1, $2, 0, 0, $3)
       RETURNING *`,
      [
        preso_id || null,
        preso_id ? null : nombre_cliente,
        empleado_id
      ]
    );

    const orden_id = ordenRes.rows[0].orden_id;

    // 2. Agregar productos
    for (const { producto_id, cantidad, sabor_id, tamano_id, notas, precio_unitario } of productos) {
      // Usar el precio_unitario enviado por el frontend
      await client.query(
        `INSERT INTO detalles_orden (orden_id, producto_id, cantidad, precio_unitario, empleado_id, sabor_id, tamano_id, notas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orden_id, producto_id, cantidad, precio_unitario, empleado_id, sabor_id || null, tamano_id || null, notas || null]
      );
    }

    await client.query("COMMIT");
    return ordenRes.rows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// Cerrar una orden con cálculo de descuento automático
import { getTotalPagado } from "./pagos.model.js";

export const closeOrder = async (orden_id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Traer los detalles de la orden
    const detalles = await client.query(`
      SELECT d.*, p.costo
      FROM detalles_orden d
      JOIN productos p ON d.producto_id = p.id
      WHERE d.orden_id = $1
    `, [orden_id]);

    if (detalles.rows.length === 0) {
      throw new Error("La orden no tiene productos.");
    }

    // Calcular total bruto (sin descuento)
    let total_bruto = 0;
    for (const det of detalles.rows) {
      total_bruto += det.precio_unitario * det.cantidad;
    }

    // Obtener preso_id
    const ordenRes = await client.query(
      `SELECT preso_id FROM ordenes WHERE orden_id = $1`,
      [orden_id]
    );
    const preso_id = ordenRes.rows[0]?.preso_id;

    let descuento_aplicable = 0;

    // Si hay preso, verificar grados activos
    if (preso_id) {
      const grados = await client.query(`
        SELECT g.descuento, pg.fecha_otorgado
        FROM preso_grado pg
        JOIN grados g ON g.id = pg.grado_id
        WHERE pg.preso_id = $1
      `, [preso_id]);

      const hoy = new Date();
      for (const grado of grados.rows) {
        const fecha = new Date(grado.fecha_otorgado);
        const siguienteMes = fecha.getMonth() + 1;
        const ahora = hoy.getMonth();

        // Si fue otorgado el mes pasado y estamos en el siguiente, aplica
        if (
          fecha.getFullYear() === hoy.getFullYear() &&
          siguienteMes === ahora + 1
        ) {
          descuento_aplicable = Math.max(descuento_aplicable, parseFloat(grado.descuento));
        }
      }
    }

    // Calcular total con descuento
    const total_con_descuento = total_bruto * (1 - descuento_aplicable / 100);

    // Obtener pagos realizados
    const pagos = await getTotalPagado(orden_id);
    
    // Verificar si se ha pagado lo suficiente
    if (pagos.monto < total_con_descuento) {
      throw new Error(`Pago insuficiente. Total: $${total_con_descuento.toFixed(2)}, Pagado: $${pagos.monto.toFixed(2)}`);
    }

    // Actualizar orden
    await client.query(
      `UPDATE ordenes 
       SET estado = 'cerrada', 
           total = $1, 
           total_bruto = $2
       WHERE orden_id = $3`,
      [total_con_descuento, total_bruto, orden_id]
    );

    await client.query("COMMIT");
    return {
      total_bruto,
      total_neto: total_con_descuento,
      descuento: total_bruto - total_con_descuento,
      pagado: pagos.monto,
      propina: pagos.propina,
      propina_calculada: pagos.monto - total_con_descuento,
      estado: "cerrada"
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// Agregar productos a una orden abierta
export const addProductsToOrder = async (orden_id, productos, empleado_id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar que la orden esté abierta
    const ordenCheck = await client.query(
      `SELECT estado FROM ordenes WHERE orden_id = $1`,
      [orden_id]
    );
    if (ordenCheck.rows.length === 0) throw new Error("Orden no encontrada.");
    if (ordenCheck.rows[0].estado !== "abierta") {
      throw new Error("La orden ya está cerrada.");
    }

    // Insertar cada producto
    for (const { producto_id, cantidad, sabor_id, tamano_id, notas, precio_unitario } of productos) {
      // Usar el precio_unitario enviado por el frontend
      await client.query(
        `INSERT INTO detalles_orden (orden_id, producto_id, cantidad, precio_unitario, empleado_id, sabor_id, tamano_id, notas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orden_id, producto_id, cantidad, precio_unitario, empleado_id, sabor_id || null, tamano_id || null, notas || null]
      );
    }


    await client.query("COMMIT");
    return { mensaje: "Productos agregados correctamente" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

//Obtener resumen de orden
export const getOrderResumen = async (orden_id) => {
  // 1. Obtener productos de la orden
  const productosQuery = await pool.query(`
    SELECT p.nombre, d.cantidad, d.precio_unitario,
           (d.cantidad * d.precio_unitario) AS subtotal
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    WHERE d.orden_id = $1
  `, [orden_id]);

  const productos = productosQuery.rows;

  const total = productos.reduce(
    (acc, prod) => acc + parseFloat(prod.subtotal),
    0
  );

  // 2. Obtener nombre del cliente
  const clienteQuery = await pool.query(`
    SELECT COALESCE(pr.reg_name, o.nombre_cliente) AS cliente
    FROM ordenes o
    LEFT JOIN presos pr ON o.preso_id = pr.id
    WHERE o.orden_id = $1
  `, [orden_id]);

  const cliente = clienteQuery.rows[0]?.cliente || "Cliente desconocido";

  // 3. Obtener pagos
  const pagosQuery = await pool.query(`
    SELECT 
      COALESCE(SUM(monto), 0) AS total_pagado,
      COALESCE(SUM(propina), 0) AS total_propina
    FROM pagos
    WHERE orden_id = $1
  `, [orden_id]);

  const total_pagado = parseFloat(pagosQuery.rows[0].total_pagado);
  const total_propina = parseFloat(pagosQuery.rows[0].total_propina);
  const diferencia = parseFloat((total_pagado - total).toFixed(2));

  let estado_pago = "pendiente";
  if (diferencia >= 0) estado_pago = "pagado";

  return {
    orden_id,
    cliente,
    productos,
    total: parseFloat(total.toFixed(2)),
    total_pagado,
    total_propina,
    diferencia,
    estado_pago
  };
};

// Obtener productos pendientes por preparar
export const getProductosPorPreparar = async () => {
  const query = `
    SELECT 
      d.id AS detalle_id, 
      d.orden_id, 
      d.producto_id, 
      d.cantidad, 
      d.notas,
      d.tiempo_creacion,
      d.sabor_id,
      d.tamano_id,
      p.nombre,
      p.categoria,
      COALESCE(pr.reg_name, o.nombre_cliente) AS cliente,
      s.nombre AS sabor_nombre,
      s.precio_adicional AS sabor_precio,
      cv.nombre AS sabor_categoria,
      t.nombre AS tamano_nombre,
      t.precio_adicional AS tamano_precio
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    LEFT JOIN presos pr ON o.preso_id = pr.id
    LEFT JOIN sabores s ON d.sabor_id = s.id
    LEFT JOIN categorias_variantes cv ON s.categoria_id = cv.id
    LEFT JOIN sabores t ON d.tamano_id = t.id
    WHERE d.preparado = FALSE 
    AND o.estado = 'abierta'
    ORDER BY d.tiempo_creacion ASC
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

// Obtener historial de productos preparados por fecha
export const getHistorialProductosPreparados = async (fecha) => {
  // Si no se proporciona una fecha, se usa la fecha actual
  const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
  
  const query = `
    SELECT 
      d.id AS detalle_id, 
      d.orden_id, 
      d.producto_id, 
      d.cantidad, 
      d.notas,
      d.tiempo_creacion,
      d.tiempo_preparacion,
      d.sabor_id,
      d.tamano_id,
      p.nombre,
      p.categoria,
      COALESCE(pr.reg_name, o.nombre_cliente) AS cliente,
      s.nombre AS sabor_nombre,
      s.precio_adicional AS sabor_precio,
      cv.nombre AS sabor_categoria,
      t.nombre AS tamano_nombre,
      t.precio_adicional AS tamano_precio
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    LEFT JOIN presos pr ON o.preso_id = pr.id
    LEFT JOIN sabores s ON d.sabor_id = s.id
    LEFT JOIN categorias_variantes cv ON s.categoria_id = cv.id
    LEFT JOIN sabores t ON d.tamano_id = t.id
    WHERE d.preparado = TRUE 
    AND DATE(d.tiempo_preparacion) = $1
    ORDER BY d.tiempo_preparacion DESC
  `;
  
  const result = await pool.query(query, [fechaConsulta]);
  return result.rows;
};

// Marcar un producto como preparado
export const marcarProductoComoPreparado = async (detalle_id) => {
  const query = `
    UPDATE detalles_orden
    SET preparado = TRUE,
        tiempo_preparacion = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  
  const result = await pool.query(query, [detalle_id]);
  return result.rows[0];
};
