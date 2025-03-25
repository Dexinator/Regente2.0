import pool from "../config/db.js";

// Obtener todas las órdenes
export const getAllOrders = async () => {
  const result = await pool.query("SELECT * FROM ordenes ORDER BY fecha DESC");
  return result.rows;
};

// Obtener solo órdenes abiertas
export const getOpenOrders = async () => {
  const result = await pool.query("SELECT * FROM ordenes WHERE estado = 'abierta' ORDER BY fecha DESC");
  return result.rows;
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

  // Traemos los productos incluidos en la orden
  const detalles = await pool.query(
    `SELECT d.*, p.nombre AS nombre_producto, p.categoria
     FROM detalles_orden d
     JOIN productos p ON d.producto_id = p.id
     WHERE d.orden_id = $1`,
    [orden_id]
  );

  return { ...orden.rows[0], detalles: detalles.rows };
};


// Crear nueva orden con detalles
export const createOrder = async ({ preso_id, nombre_cliente, total, empleado_id, productos }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ordenRes = await client.query(
      `INSERT INTO ordenes (preso_id, nombre_cliente, total, empleado_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        preso_id || null,
        preso_id ? null : nombre_cliente,
        total,
        empleado_id
      ]
    );

    const orden_id = ordenRes.rows[0].orden_id;

    for (const { producto_id, cantidad } of productos) {
      const precioRes = await client.query(
        `SELECT precio FROM productos WHERE id = $1`,
        [producto_id]
      );
      const precio_unitario = precioRes.rows[0]?.precio;

      if (!precio_unitario) {
        throw new Error(`Producto con id ${producto_id} no encontrado`);
      }

      await client.query(
        `INSERT INTO detalles_orden (orden_id, producto_id, cantidad, precio_unitario, empleado_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [orden_id, producto_id, cantidad, precio_unitario, empleado_id]
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

    // Actualizar la orden con ambos totales y cerrar
    const result = await client.query(
      `UPDATE ordenes
       SET total = $1,
           total_bruto = $2,
           estado = 'cerrada'
       WHERE orden_id = $3
       RETURNING *`,
      [total_con_descuento.toFixed(2), total_bruto.toFixed(2), orden_id]
    );

    await client.query("COMMIT");
    return result.rows[0];

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
    for (const { producto_id, cantidad } of productos) {
      const precioRes = await client.query(
        `SELECT precio FROM productos WHERE id = $1`,
        [producto_id]
      );
      const precio_unitario = precioRes.rows[0]?.precio;
      if (!precio_unitario) {
        throw new Error(`Producto con id ${producto_id} no encontrado.`);
      }

      await client.query(
        `INSERT INTO detalles_orden (orden_id, producto_id, cantidad, precio_unitario, empleado_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [orden_id, producto_id, cantidad, precio_unitario, empleado_id]
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

