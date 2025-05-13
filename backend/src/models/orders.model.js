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
        SELECT COALESCE(SUM(ABS(d.precio_unitario) * d.cantidad), 0)
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
    `SELECT o.*, p.reg_name AS nombre_preso, c.codigo AS codigo_promocional_aplicado
     FROM ordenes o
     LEFT JOIN presos p ON o.preso_id = p.id
     LEFT JOIN codigos_promocionales c ON o.codigo_descuento_id = c.id
     WHERE o.orden_id = $1`,
    [orden_id]
  );

  if (orden.rows.length === 0) return null;

  // Traemos los productos incluidos en la orden
  // Asegúrate de que esta consulta traiga todos los campos relevantes, incluyendo los de sentencia
  const detalles = await pool.query(
    `SELECT 
        d.*, 
        p.nombre AS nombre_producto, 
        p.categoria AS categoria_producto,
        s.nombre AS sabor_nombre, 
        s.precio_adicional AS sabor_precio_adicional,
        cv.nombre AS sabor_categoria,
        t.nombre AS tamano_nombre, 
        t.precio_adicional AS tamano_precio_adicional,
        i.nombre AS ingrediente_nombre, 
        i.precio_adicional AS ingrediente_precio_adicional,
        cvi.nombre AS ingrediente_categoria
        -- Los campos de sentencia como d.sentencia_id, d.es_sentencia_principal, 
        -- d.sentencia_detalle_orden_padre_id, d.nombre_sentencia, d.descripcion_sentencia
        -- ya están en d.* si existen en la tabla detalles_orden
     FROM detalles_orden d
     LEFT JOIN productos p ON d.producto_id = p.id -- LEFT JOIN por si producto_id es NULL (para sentencia principal)
     LEFT JOIN sabores s ON d.sabor_id = s.id
     LEFT JOIN categorias_variantes cv ON s.categoria_id = cv.id
     LEFT JOIN sabores t ON d.tamano_id = t.id
     LEFT JOIN sabores i ON d.ingrediente_id = i.id
     LEFT JOIN categorias_variantes cvi ON i.categoria_id = cvi.id
     WHERE d.orden_id = $1
     ORDER BY d.id ASC`,
    [orden_id]
  );

  return { ...orden.rows[0], detalles: detalles.rows };
};

// Crear nueva orden con detalles
export const createOrder = async ({ preso_id, nombre_cliente, empleado_id, productos, num_personas = 1, codigo_promocional = null }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 0. Si hay código promocional, validarlo primero
    let codigo_id = null;
    let porcentaje_descuento = 0;
    
    if (codigo_promocional) {
      const codigoResult = await client.query(`
        SELECT * FROM codigos_promocionales 
        WHERE 
          codigo = $1 AND 
          activo = true AND 
          fecha_inicio <= CURRENT_DATE AND 
          fecha_fin >= CURRENT_DATE AND
          (usos_maximos = -1 OR usos_actuales < usos_maximos)`,
        [codigo_promocional]
      );
      
      if (codigoResult.rows.length > 0) {
        codigo_id = codigoResult.rows[0].id;
        porcentaje_descuento = parseFloat(codigoResult.rows[0].porcentaje_descuento);
        
        // Incrementar usos del código
        await client.query(`
          UPDATE codigos_promocionales 
          SET usos_actuales = usos_actuales + 1 
          WHERE id = $1`,
          [codigo_id]
        );
      }
    }
    
    // 1. Crear la orden (total y total_bruto inician en 0)
    const ordenRes = await client.query(
      `INSERT INTO ordenes (preso_id, nombre_cliente, total, total_bruto, empleado_id, num_personas, codigo_descuento_id, estado)
       VALUES ($1, $2, 0, 0, $3, $4, $5, 'abierta')
       RETURNING orden_id`,
      [
        preso_id || null,
        preso_id ? null : nombre_cliente,
        empleado_id,
        num_personas,
        codigo_id
      ]
    );

    const orden_id = ordenRes.rows[0].orden_id;
    
    let descuento_grado = 0;
    if (preso_id) {
      const gradoResult = await client.query(`
        SELECT g.descuento
        FROM preso_grado pg
        JOIN grados g ON pg.grado_id = g.id
        WHERE pg.preso_id = $1`,
        [preso_id]
      );
      
      if (gradoResult.rows.length > 0) {
        descuento_grado = parseFloat(gradoResult.rows[0].descuento);
      }
    }
    
    const porcentaje_descuento_total = porcentaje_descuento + descuento_grado;
    const factor_descuento = (100 - porcentaje_descuento_total) / 100;

    let total_bruto = 0;
    const mapaSentenciasCreadas = {}; // Key: payload sentencia_id, Value: detalles_orden.id de la sentencia principal

    // 2. Primera pasada: Insertar Sentencias Principales
    const sentenciasPrincipalesItems = productos.filter(p => p.es_sentencia_principal);
    for (const spItem of sentenciasPrincipalesItems) {
      total_bruto += (spItem.precio_unitario || 0) * (spItem.cantidad || 1);

      const qDetalleSentencia = `
        INSERT INTO detalles_orden (
            orden_id, producto_id, cantidad, precio_unitario, empleado_id, notas,
            sentencia_id, es_sentencia_principal, nombre_sentencia, descripcion_sentencia
        )
        VALUES ($1, NULL, $2, $3, $4, $5, $6, TRUE, $7, $8)
        RETURNING id;
      `;
      const rDetalleSentencia = await client.query(qDetalleSentencia, [
        orden_id,
        spItem.cantidad,
        spItem.precio_unitario,
        empleado_id, // Asumimos que el mismo empleado_id de la orden aplica a los detalles
        spItem.notas,
        spItem.sentencia_id,
        spItem.nombre_sentencia,
        spItem.descripcion_sentencia
      ]);
      mapaSentenciasCreadas[spItem.sentencia_id] = rDetalleSentencia.rows[0].id;
    }

    // 3. Segunda pasada: Insertar Productos Normales y Componentes de Sentencia
    for (const prodItem of productos) {
      if (prodItem.es_sentencia_principal) {
        continue; // Ya procesada
      }

      total_bruto += (prodItem.precio_unitario || 0) * (prodItem.cantidad || 1);
      let sentenciaDetalleOrdenPadreId = null;

      if (prodItem.es_parte_sentencia && prodItem.sentencia_id) {
        sentenciaDetalleOrdenPadreId = mapaSentenciasCreadas[prodItem.sentencia_id];
        if (!sentenciaDetalleOrdenPadreId) {
          console.error(`Error de consistencia: No se encontró el detalle padre para la sentencia_id ${prodItem.sentencia_id} del producto ${prodItem.producto_id || 'N/A'} en orden ${orden_id}`);
          // Considera si lanzar un error aquí es apropiado o si hay un manejo alternativo
          // throw new Error(`Error de consistencia: Detalle padre no encontrado para sentencia_id ${prodItem.sentencia_id}.`);
        }
      }

      const qDetalleProducto = `
        INSERT INTO detalles_orden (
            orden_id, producto_id, cantidad, precio_unitario, empleado_id,
            sabor_id, tamano_id, ingrediente_id, notas,
            sentencia_id, es_sentencia_principal, sentencia_detalle_orden_padre_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, $11);
      `;
      await client.query(qDetalleProducto, [
        orden_id,
        prodItem.producto_id,
        prodItem.cantidad,
        prodItem.precio_unitario,
        empleado_id,
        prodItem.sabor_id,
        prodItem.tamano_id,
        prodItem.ingrediente_id,
        prodItem.notas,
        prodItem.es_parte_sentencia ? prodItem.sentencia_id : null, // sentencia_id de la tabla 'sentencias'
        sentenciaDetalleOrdenPadreId
      ]);
    }
    
    // 4. Actualizar totales en la orden
    const total_final_con_descuento = porcentaje_descuento_total > 0 
      ? Math.round((total_bruto * factor_descuento) * 100) / 100
      : total_bruto;
      
    await client.query(
      `UPDATE ordenes SET total_bruto = $1, total = $2 WHERE orden_id = $3`,
      [total_bruto, total_final_con_descuento, orden_id]
    );

    await client.query("COMMIT");
    return await getOrderWithDetails(orden_id);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en createOrder (models/orders.model.js):", err);
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
      total_bruto += Math.abs(det.precio_unitario) * det.cantidad;
    }

    // Obtener información de la orden incluyendo descuentos
    const ordenInfo = await client.query(`
      SELECT 
        o.preso_id,
        cp.porcentaje_descuento,
        g.descuento AS descuento_grado
      FROM ordenes o
      LEFT JOIN codigos_promocionales cp ON o.codigo_descuento_id = cp.id
      LEFT JOIN presos pr ON o.preso_id = pr.id
      LEFT JOIN preso_grado pg ON pr.id = pg.preso_id
      LEFT JOIN grados g ON pg.grado_id = g.id
      WHERE o.orden_id = $1
    `, [orden_id]);
    
    // Definir las variables de descuento
    const porcentaje_descuento_codigo = parseFloat(ordenInfo.rows[0]?.porcentaje_descuento || 0);
    const porcentaje_descuento_grado = parseFloat(ordenInfo.rows[0]?.descuento_grado || 0);
    
    // Calcular el descuento total (acumulativo)
    const porcentaje_descuento_total = porcentaje_descuento_codigo + porcentaje_descuento_grado;
    
    // Calcular total con descuento
    const total_con_descuento = total_bruto * (1 - porcentaje_descuento_total / 100);

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
      `SELECT o.estado, o.codigo_descuento_id, cp.porcentaje_descuento,
              p.id AS preso_id, pg.grado_id, g.descuento AS descuento_grado
       FROM ordenes o
       LEFT JOIN codigos_promocionales cp ON o.codigo_descuento_id = cp.id
       LEFT JOIN presos p ON o.preso_id = p.id
       LEFT JOIN preso_grado pg ON p.id = pg.preso_id
       LEFT JOIN grados g ON pg.grado_id = g.id
       WHERE o.orden_id = $1`,
      [orden_id]
    );
    
    if (ordenCheck.rows.length === 0) throw new Error("Orden no encontrada.");
    if (ordenCheck.rows[0].estado !== "abierta") {
      throw new Error("La orden ya está cerrada.");
    }

    // Calcular descuentos si existen
    let porcentaje_descuento_codigo = 0;
    let porcentaje_descuento_grado = 0;
    
    if (ordenCheck.rows[0].porcentaje_descuento) {
      porcentaje_descuento_codigo = parseFloat(ordenCheck.rows[0].porcentaje_descuento);
    }
    
    if (ordenCheck.rows[0].descuento_grado) {
      porcentaje_descuento_grado = parseFloat(ordenCheck.rows[0].descuento_grado);
    }
    
    // Calcular el descuento total (acumulativo)
    const porcentaje_descuento_total = porcentaje_descuento_codigo + porcentaje_descuento_grado;
    const factor_descuento = (100 - porcentaje_descuento_total) / 100;

    // Insertar cada producto
    for (const { producto_id, cantidad, sabor_id, tamano_id, ingrediente_id, notas, precio_unitario } of productos) {
      // Insertar con el precio original (sin descuento)
      await client.query(
        `INSERT INTO detalles_orden (orden_id, producto_id, cantidad, precio_unitario, empleado_id, sabor_id, tamano_id, ingrediente_id, notas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [orden_id, producto_id, cantidad, precio_unitario, empleado_id, sabor_id || null, tamano_id || null, ingrediente_id || null, notas || null]
      );
    }

    // Recalcular el total bruto de la orden (siempre suma todos los productos)
    await client.query(`
      WITH totales AS (
        SELECT 
          SUM(ABS(precio_unitario) * cantidad) AS total_bruto
        FROM detalles_orden 
        WHERE orden_id = $1
      )
      UPDATE ordenes 
      SET total_bruto = totales.total_bruto
      FROM totales
      WHERE orden_id = $1`,
      [orden_id]
    );
    
    // Calcular el total con el descuento aplicado
    await client.query(`
      UPDATE ordenes 
      SET total = ROUND(total_bruto * $2, 2)
      WHERE orden_id = $1`,
      [orden_id, factor_descuento]
    );

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
  // 1. Obtener productos de la orden con detalle de cancelaciones
  const productosQuery = await pool.query(`
    SELECT 
      d.id AS detalle_orden_id, -- Alias para claridad
      d.producto_id, -- Puede ser NULL para la sentencia principal
      COALESCE(p.nombre, d.nombre_sentencia) AS nombre, -- Nombre del producto o de la sentencia
      d.cantidad, 
      d.precio_unitario,
      (d.cantidad * d.precio_unitario) AS subtotal, -- No usar ABS aquí todavía para el subtotal individual
      d.preparado,
      d.entregado, -- Añadido para saber el estado de entrega
      d.sabor_id,
      s.nombre AS sabor_nombre,
      cv.nombre AS sabor_categoria,
      s.precio_adicional AS sabor_precio,
      d.tamano_id,
      t.nombre AS tamano_nombre,
      t.precio_adicional AS tamano_precio,
      d.ingrediente_id,
      i.nombre AS ingrediente_nombre,
      i.precio_adicional AS ingrediente_precio,
      cvi.nombre AS ingrediente_categoria,
      d.notas,
      d.sentencia_id AS promocion_id, -- ID de la tabla sentencias
      d.es_sentencia_principal,
      d.sentencia_detalle_orden_padre_id,
      d.nombre_sentencia AS nombre_promocion, 
      d.descripcion_sentencia AS descripcion_promocion,
      p.categoria AS categoria_producto -- Categoría del producto si existe
    FROM detalles_orden d
    LEFT JOIN productos p ON d.producto_id = p.id
    LEFT JOIN sabores s ON d.sabor_id = s.id
    LEFT JOIN categorias_variantes cv ON s.categoria_id = cv.id
    LEFT JOIN sabores t ON d.tamano_id = t.id
    LEFT JOIN sabores i ON d.ingrediente_id = i.id
    LEFT JOIN categorias_variantes cvi ON i.categoria_id = cvi.id
    WHERE d.orden_id = $1
    ORDER BY d.id ASC -- Ordenar por el ID del detalle para mantener un orden consistente
  `, [orden_id]);

  // Procesar productos para agrupar cancelaciones y calcular cantidades netas
  const productosProcesados = [];
  const mapaProductos = new Map(); // Para agrupar por item único (producto+variantes o sentencia)

  for (const row of productosQuery.rows) {
    // Crear una clave única para agrupar: para sentencias principales, su propio d.id;
    // para productos y componentes, producto_id + variantes.
    // Las sentencias principales son únicas por su d.id.
    // Los componentes de sentencia se tratan como productos individuales con variantes.
    let claveUnica;
    if (row.es_sentencia_principal) {
        claveUnica = `sentencia_principal_${row.detalle_orden_id}`;
    } else if (row.producto_id) { // Productos normales o componentes de sentencia
        claveUnica = `prod_${row.producto_id}_sabor_${row.sabor_id || 'null'}_tam_${row.tamano_id || 'null'}_ing_${row.ingrediente_id || 'null'}`;
    } else {
        // Caso inesperado, podría ser un error de datos si no es sentencia principal y no tiene producto_id
        claveUnica = `detalle_directo_${row.detalle_orden_id}`;
    }

    if (!mapaProductos.has(claveUnica)) {
      mapaProductos.set(claveUnica, {
        // Usar detalle_orden_id como id único para la lista en el frontend si es necesario
        id_detalle_original: row.detalle_orden_id, 
        producto_id: row.producto_id,
        nombre: row.nombre, // Ya toma nombre_sentencia si p.nombre es null
        cantidad_neta: 0,
        precio_unitario: parseFloat(row.precio_unitario),
        subtotal_neto: 0,
        preparado: row.preparado, // Asumimos que una sentencia principal no se marca como preparada individualmente
        entregado: row.entregado,
        sabor_id: row.sabor_id, sabor_nombre: row.sabor_nombre, sabor_categoria: row.sabor_categoria, sabor_precio: row.sabor_precio ? parseFloat(row.sabor_precio) : 0,
        tamano_id: row.tamano_id, tamano_nombre: row.tamano_nombre, tamano_precio: row.tamano_precio ? parseFloat(row.tamano_precio) : 0,
        ingrediente_id: row.ingrediente_id, ingrediente_nombre: row.ingrediente_nombre, ingrediente_precio: row.ingrediente_precio ? parseFloat(row.ingrediente_precio) : 0, ingrediente_categoria: row.ingrediente_categoria,
        notas: row.notas,
        promocion_id: row.promocion_id,
        es_sentencia_principal: row.es_sentencia_principal,
        sentencia_detalle_orden_padre_id: row.sentencia_detalle_orden_padre_id,
        nombre_promocion: row.nombre_promocion,
        descripcion_promocion: row.descripcion_promocion,
        categoria_producto: row.categoria_producto,
        es_cancelacion_item: false // Para marcar si el item agrupado es en sí una cancelación total
      });
    }

    const prodAgrupado = mapaProductos.get(claveUnica);
    prodAgrupado.cantidad_neta += row.cantidad; // Suma cantidades (positivas y negativas)
    // El preparado se considera true si alguna de sus instancias está preparada (esto podría necesitar revisión según la lógica de negocio)
    if(row.preparado) prodAgrupado.preparado = true;
    if(row.entregado) prodAgrupado.entregado = true; 
  }
  
  mapaProductos.forEach(prod => {
    prod.subtotal_neto = prod.cantidad_neta * prod.precio_unitario;
    // Un item es una "cancelación" a mostrar si su cantidad neta final es <= 0 Y ERA una sentencia principal o un producto.
    // Los productos con precio_unitario < 0 son registros de cancelación y no deberían aparecer como items principales.
    if (prod.cantidad_neta <= 0 && prod.precio_unitario > 0) {
        prod.es_cancelacion_item = true; // El item en sí ha sido completamente cancelado o más
    }
    // Solo añadir a productos procesados si la cantidad neta es diferente de cero, o si es una sentencia principal (para mostrarla incluso si sus items se cancelan)
    // O si es un registro de cancelación que queremos mostrar (esto último depende de la UI deseada)
    // Por ahora, mostramos todo lo que tenga cantidad neta != 0 o sea sentencia principal.
    if (prod.cantidad_neta !== 0 || prod.es_sentencia_principal) {
        productosProcesados.push(prod);
    }
  });

  // Calcular subtotal general de la orden basado en las cantidades netas y precios unitarios
  const subtotal_orden = productosProcesados.reduce(
    (acc, prod) => acc + prod.subtotal_neto,
    0
  );

  // 2. Obtener información general de la orden, incluyendo los totales y descuentos
  const ordenQuery = await pool.query(`
    SELECT 
      o.*,
      cp.codigo AS codigo_promocional,
      cp.porcentaje_descuento,
      g.descuento AS descuento_grado,
      g.nombre AS nombre_grado,
      COALESCE(pr.reg_name, o.nombre_cliente) AS cliente,
      o.num_personas
    FROM ordenes o
    LEFT JOIN codigos_promocionales cp ON o.codigo_descuento_id = cp.id
    LEFT JOIN presos pr ON o.preso_id = pr.id
    LEFT JOIN preso_grado pg ON pr.id = pg.preso_id
    LEFT JOIN grados g ON pg.grado_id = g.id
    WHERE o.orden_id = $1
  `, [orden_id]);

  if (ordenQuery.rows.length === 0) {
    throw new Error("Orden no encontrada");
  }

  const ordenInfo = ordenQuery.rows[0];
  const cliente = ordenInfo.cliente || "Cliente desconocido";
  const num_personas = ordenInfo.num_personas || 1;
  const total_bruto = parseFloat(ordenInfo.total_bruto || subtotal_orden);
  const total = parseFloat(ordenInfo.total || subtotal_orden);

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
  
  // Usar el total con descuento para calcular la diferencia
  const diferencia = parseFloat((total_pagado - total).toFixed(2));

  let estado_pago = "pendiente";
  if (diferencia >= 0) estado_pago = "pagado";

  return {
    orden_id,
    cliente,
    num_personas,
    productos: productosProcesados,
    total_bruto,
    total,
    total_pagado,
    total_propina,
    diferencia,
    estado_pago,
    codigo_promocional: ordenInfo.codigo_promocional,
    porcentaje_descuento: ordenInfo.porcentaje_descuento,
    descuento_grado: ordenInfo.descuento_grado,
    nombre_grado: ordenInfo.nombre_grado
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
      d.ingrediente_id,
      p.nombre,
      p.categoria,
      COALESCE(pr.reg_name, o.nombre_cliente) AS cliente,
      s.nombre AS sabor_nombre,
      s.precio_adicional AS sabor_precio,
      cv.nombre AS sabor_categoria,
      t.nombre AS tamano_nombre,
      t.precio_adicional AS tamano_precio,
      i.nombre AS ingrediente_nombre,
      i.precio_adicional AS ingrediente_precio,
      cvi.nombre AS ingrediente_categoria,
      sp.nombre_sentencia AS nombre_sentencia_padre -- Nombre de la sentencia a la que pertenece
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id -- Componentes de sentencia o productos normales SIEMPRE tienen producto_id
    JOIN ordenes o ON d.orden_id = o.orden_id
    LEFT JOIN presos pr ON o.preso_id = pr.id
    LEFT JOIN sabores s ON d.sabor_id = s.id
    LEFT JOIN categorias_variantes cv ON s.categoria_id = cv.id
    LEFT JOIN sabores t ON d.tamano_id = t.id
    LEFT JOIN sabores i ON d.ingrediente_id = i.id
    LEFT JOIN categorias_variantes cvi ON i.categoria_id = cvi.id
    LEFT JOIN detalles_orden sp ON d.sentencia_detalle_orden_padre_id = sp.id AND sp.es_sentencia_principal = TRUE
    WHERE d.preparado = FALSE 
      AND d.cantidad > 0 -- Solo items con cantidad positiva (no cancelaciones directas)
      AND d.es_sentencia_principal = FALSE -- Muy importante: Excluir las sentencias principales como items a preparar
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
      d.ingrediente_id,
      p.nombre,
      p.categoria,
      COALESCE(pr.reg_name, o.nombre_cliente) AS cliente,
      s.nombre AS sabor_nombre,
      s.precio_adicional AS sabor_precio,
      cv.nombre AS sabor_categoria,
      t.nombre AS tamano_nombre,
      t.precio_adicional AS tamano_precio,
      i.nombre AS ingrediente_nombre,
      i.precio_adicional AS ingrediente_precio,
      cvi.nombre AS ingrediente_categoria
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    LEFT JOIN presos pr ON o.preso_id = pr.id
    LEFT JOIN sabores s ON d.sabor_id = s.id
    LEFT JOIN categorias_variantes cv ON s.categoria_id = cv.id
    LEFT JOIN sabores t ON d.tamano_id = t.id
    LEFT JOIN sabores i ON d.ingrediente_id = i.id
    LEFT JOIN categorias_variantes cvi ON i.categoria_id = cvi.id
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
        tiempo_preparacion = CURRENT_TIMESTAMP,
        entregado = FALSE,
        tiempo_entrega = NULL
    WHERE id = $1
    RETURNING *
  `;
  
  const result = await pool.query(query, [detalle_id]);
  return result.rows[0];
};

// Marcar un producto como NO preparado (despreparar)
export const desprepararProducto = async (detalle_id) => {
  const query = `
    UPDATE detalles_orden
    SET preparado = FALSE,
        tiempo_preparacion = NULL
    WHERE id = $1
    RETURNING *
  `;
  
  const result = await pool.query(query, [detalle_id]);
  return result.rows[0];
};

// Cancelar producto de una orden (registrar como precio negativo)
export const cancelarProductoOrden = async (orden_id, producto_id, cantidad, empleado_id, razon_cancelacion = null, sabor_id = null, tamano_id = null, ingrediente_id = null) => {
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

    // Verificar que el producto exista en la orden y obtener su precio unitario
    // Agregamos las variantes a la consulta
    const productoCheck = await client.query(
      `SELECT d.*, p.nombre 
       FROM detalles_orden d
       JOIN productos p ON d.producto_id = p.id
       WHERE d.orden_id = $1 
       AND d.producto_id = $2 
       AND d.precio_unitario > 0 
       AND d.preparado = FALSE
       AND (d.sabor_id = $3 OR ($3 IS NULL AND d.sabor_id IS NULL))
       AND (d.tamano_id = $4 OR ($4 IS NULL AND d.tamano_id IS NULL))
       AND (d.ingrediente_id = $5 OR ($5 IS NULL AND d.ingrediente_id IS NULL))`,
      [orden_id, producto_id, sabor_id, tamano_id, ingrediente_id]
    );

    if (productoCheck.rows.length === 0) {
      // Verificar si está preparado para dar un mensaje específico
      const preparadoCheck = await client.query(
        `SELECT COUNT(*) as count
         FROM detalles_orden 
         WHERE orden_id = $1 
         AND producto_id = $2 
         AND precio_unitario > 0 
         AND preparado = TRUE
         AND (sabor_id = $3 OR ($3 IS NULL AND sabor_id IS NULL))
         AND (tamano_id = $4 OR ($4 IS NULL AND tamano_id IS NULL))
         AND (ingrediente_id = $5 OR ($5 IS NULL AND ingrediente_id IS NULL))`,
        [orden_id, producto_id, sabor_id, tamano_id, ingrediente_id]
      );
      
      if (parseInt(preparadoCheck.rows[0].count) > 0) {
        throw new Error("No se puede cancelar un producto que ya está preparado.");
      } else {
        throw new Error("El producto con esas características no está en la orden o ya fue cancelado.");
      }
    }

    // Verificar que la cantidad a cancelar no sea mayor que la cantidad ordenada
    const cantidadTotal = productoCheck.rows.reduce((total, row) => total + row.cantidad, 0);
    
    // Obtener cantidad ya cancelada
    const canceladosCheck = await client.query(
      `SELECT SUM(cantidad) as cantidad_cancelada
       FROM detalles_orden 
       WHERE orden_id = $1 
       AND producto_id = $2 
       AND precio_unitario < 0
       AND (sabor_id = $3 OR ($3 IS NULL AND sabor_id IS NULL))
       AND (tamano_id = $4 OR ($4 IS NULL AND tamano_id IS NULL))
       AND (ingrediente_id = $5 OR ($5 IS NULL AND ingrediente_id IS NULL))`,
      [orden_id, producto_id, sabor_id, tamano_id, ingrediente_id]
    );
    
    const cantidadYaCancelada = parseInt(canceladosCheck.rows[0]?.cantidad_cancelada || 0);
    const cantidadDisponible = cantidadTotal - cantidadYaCancelada;

    if (Math.abs(cantidad) > cantidadDisponible) {
      throw new Error(`No se pueden cancelar ${Math.abs(cantidad)} unidades. Solo hay ${cantidadDisponible} disponibles.`);
    }

    // Registrar la cancelación como un nuevo detalle con precio negativo
    const precioUnitario = Math.abs(productoCheck.rows[0].precio_unitario) * -1; // Convertir a negativo
    
    await client.query(
      `INSERT INTO detalles_orden (orden_id, producto_id, cantidad, precio_unitario, empleado_id, notas, sabor_id, tamano_id, ingrediente_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        orden_id, 
        producto_id, 
        cantidad, 
        precioUnitario, 
        empleado_id, 
        razon_cancelacion ? `CANCELACIÓN: ${razon_cancelacion}` : 'CANCELACIÓN',
        sabor_id,
        tamano_id,
        ingrediente_id
      ]
    );

    await client.query("COMMIT");
    // Agregamos los IDs de las variantes a la respuesta
    return { 
      mensaje: "Producto cancelado correctamente",
      producto: productoCheck.rows[0].nombre,
      cantidad: cantidad,
      precio_unitario: precioUnitario,
      sabor_id,
      tamano_id,
      ingrediente_id
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// Obtener productos preparados pero no entregados (por entregar a clientes)
export const getProductosPorEntregar = async () => {
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
      d.ingrediente_id,
      p.nombre,
      p.categoria,
      COALESCE(pr.reg_name, o.nombre_cliente) AS cliente,
      pr.id AS preso_id,
      s.nombre AS sabor_nombre,
      s.precio_adicional AS sabor_precio,
      cv.nombre AS sabor_categoria,
      t.nombre AS tamano_nombre,
      t.precio_adicional AS tamano_precio,
      i.nombre AS ingrediente_nombre,
      i.precio_adicional AS ingrediente_precio,
      cvi.nombre AS ingrediente_categoria
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    LEFT JOIN presos pr ON o.preso_id = pr.id
    LEFT JOIN sabores s ON d.sabor_id = s.id
    LEFT JOIN categorias_variantes cv ON s.categoria_id = cv.id
    LEFT JOIN sabores t ON d.tamano_id = t.id
    LEFT JOIN sabores i ON d.ingrediente_id = i.id
    LEFT JOIN categorias_variantes cvi ON i.categoria_id = cvi.id
    WHERE d.preparado = TRUE 
    AND d.entregado = FALSE
    AND d.cantidad > 0
    ORDER BY d.tiempo_preparacion ASC
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

// Marcar un producto como entregado
export const marcarProductoComoEntregado = async (detalle_id) => {
  const query = `
    UPDATE detalles_orden
    SET entregado = TRUE,
        tiempo_entrega = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *
  `;
  
  const result = await pool.query(query, [detalle_id]);
  return result.rows[0];
};

// Marcar un producto como NO entregado (revertir)
export const revertirEntregaProducto = async (detalle_id) => {
  const query = `
    UPDATE detalles_orden
    SET entregado = FALSE,
        tiempo_entrega = NULL
    WHERE id = $1
    RETURNING *
  `;
  
  const result = await pool.query(query, [detalle_id]);
  return result.rows[0];
};

