import pool from "../config/db.js";

/**
 * Obtiene todas las compras, opcionalmente filtradas por proveedor y/o fecha
 */
export const getAllCompras = async (filters = {}) => {
  const { proveedor_id, fecha_inicio, fecha_fin } = filters;

  let query = `
    SELECT c.*,
    COALESCE(p.nombre, c.origen_compra, 'Sin especificar') as proveedor_nombre,
    e.nombre as usuario_nombre,
    (SELECT COUNT(*) FROM items_compra WHERE compra_id = c.id) as total_items,
    (SELECT SUM(subtotal) FROM items_compra WHERE compra_id = c.id) as total_calculado
    FROM compras c
    LEFT JOIN proveedores p ON c.proveedor_id = p.id
    LEFT JOIN empleados e ON c.usuario_id = e.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  // Filtrar por proveedor si se proporciona
  if (proveedor_id) {
    query += ` AND c.proveedor_id = $${paramIndex}`;
    params.push(proveedor_id);
    paramIndex++;
  }
  
  // Filtrar por fecha de inicio si se proporciona
  if (fecha_inicio) {
    query += ` AND c.fecha_compra >= $${paramIndex}`;
    params.push(fecha_inicio);
    paramIndex++;
  }
  
  // Filtrar por fecha de fin si se proporciona
  if (fecha_fin) {
    query += ` AND c.fecha_compra <= $${paramIndex}`;
    params.push(fecha_fin);
    paramIndex++;
  }
  
  query += ' ORDER BY c.fecha_compra DESC';
  
  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Obtiene una compra por ID con sus items
 */
export const getCompraById = async (id) => {
  // Obtener la compra
  const compraQuery = `
    SELECT c.*,
    COALESCE(p.nombre, c.origen_compra, 'Sin especificar') as proveedor_nombre,
    e.nombre as usuario_nombre
    FROM compras c
    LEFT JOIN proveedores p ON c.proveedor_id = p.id
    LEFT JOIN empleados e ON c.usuario_id = e.id
    WHERE c.id = $1
  `;
  
  const compraResult = await pool.query(compraQuery, [id]);
  
  if (compraResult.rows.length === 0) {
    return null;
  }
  
  const compra = compraResult.rows[0];
  
  // Obtener los items de la compra
  const itemsQuery = `
    SELECT ic.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria,
    CASE 
      WHEN ir.id IS NOT NULL THEN true
      ELSE false
    END as es_de_requisicion,
    ir.requisicion_id
    FROM items_compra ic
    JOIN insumos i ON ic.insumo_id = i.id
    LEFT JOIN items_requisicion ir ON ic.requisicion_item_id = ir.id
    WHERE ic.compra_id = $1
    ORDER BY ic.id
  `;
  
  const itemsResult = await pool.query(itemsQuery, [id]);
  
  // Combinar resultados
  return {
    ...compra,
    items: itemsResult.rows
  };
};

/**
 * Crea una nueva compra con sus items
 */
export const createCompra = async (data) => {
  const {
    proveedor_id,
    origen_compra,
    usuario_id,
    total,
    metodo_pago,
    solicito_factura,
    numero_factura,
    notas,
    fecha_compra,
    items
  } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insertar la compra
    const compraQuery = `
      INSERT INTO compras
      (proveedor_id, origen_compra, usuario_id, total, metodo_pago, solicito_factura, numero_factura, notas, fecha_compra)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const compraValues = [
      proveedor_id || null,
      origen_compra || null,
      usuario_id,
      total,
      metodo_pago,
      solicito_factura || false,
      numero_factura,
      notas,
      fecha_compra || new Date()
    ];

    const compraResult = await client.query(compraQuery, compraValues);
    const compraId = compraResult.rows[0].id;

    // Insertar los items de la compra
    for (const item of items) {
      // Si no se especificó requisicion_item_id, buscar automáticamente coincidencias
      let requisicionItemId = item.requisicion_item_id;

      if (!requisicionItemId && proveedor_id) {
        // Buscar items de requisición pendientes que coincidan con este insumo y proveedor
        const requisicionMatch = await client.query(`
          SELECT ir.id
          FROM items_requisicion ir
          JOIN requisiciones r ON ir.requisicion_id = r.id
          JOIN insumo_proveedor ip ON ip.insumo_id = ir.insumo_id
          WHERE ir.insumo_id = $1
            AND ip.proveedor_id = $2
            AND ir.completado = false
            AND ir.cantidad <= $3
          ORDER BY r.fecha_solicitud
          LIMIT 1
        `, [item.insumo_id, proveedor_id, item.cantidad]);

        if (requisicionMatch.rows.length > 0) {
          requisicionItemId = requisicionMatch.rows[0].id;
        }
      }

      // Insertar el item de compra
      const itemQuery = `
        INSERT INTO items_compra
        (compra_id, insumo_id, requisicion_item_id, precio_unitario, cantidad, unidad, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      const subtotal = item.precio_unitario * item.cantidad;
      const itemValues = [
        compraId,
        item.insumo_id,
        requisicionItemId,
        item.precio_unitario,
        item.cantidad,
        item.unidad,
        subtotal
      ];

      await client.query(itemQuery, itemValues);

      // Si se vinculó con una requisición, marcarla como completada
      if (requisicionItemId) {
        await client.query(
          'UPDATE items_requisicion SET completado = true WHERE id = $1',
          [requisicionItemId]
        );

        // Verificar si todos los items de la requisición están completados
        const checkRequisicion = await client.query(`
          SELECT r.id,
            COUNT(ir.id) as total_items,
            COUNT(CASE WHEN ir.completado THEN 1 END) as items_completados
          FROM requisiciones r
          JOIN items_requisicion ir ON ir.requisicion_id = r.id
          WHERE r.id = (SELECT requisicion_id FROM items_requisicion WHERE id = $1)
          GROUP BY r.id
        `, [requisicionItemId]);

        if (checkRequisicion.rows.length > 0) {
          const req = checkRequisicion.rows[0];
          if (req.total_items === req.items_completados) {
            // Marcar la requisición como completada
            await client.query(
              'UPDATE requisiciones SET completada = true, fecha_completada = NOW() WHERE id = $1',
              [req.id]
            );
          }
        }
      }

      // Actualizar inventario si existe
      await client.query(`
        INSERT INTO inventario (insumo_id, cantidad_actual, ultima_actualizacion)
        VALUES ($1, $2, NOW())
        ON CONFLICT (insumo_id)
        DO UPDATE SET
          cantidad_actual = inventario.cantidad_actual + $2,
          ultima_actualizacion = NOW()
      `, [item.insumo_id, item.cantidad]);
    }

    await client.query('COMMIT');

    // Obtener la compra completa con sus items
    return await getCompraById(compraId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Actualiza una compra existente
 */
export const updateCompra = async (id, data) => {
  const {
    proveedor_id,
    origen_compra,
    total,
    metodo_pago,
    solicito_factura,
    numero_factura,
    notas,
    fecha_compra,
    items
  } = data;
  
  // Verificar si la compra existe
  const existingCompra = await pool.query(
    'SELECT id FROM compras WHERE id = $1',
    [id]
  );
  
  if (existingCompra.rows.length === 0) {
    throw new Error('Compra no encontrada');
  }
  
  // Actualizar la compra
  let query = 'UPDATE compras SET';
  const params = [];
  let paramIndex = 1;
  const updates = [];
  
  if (proveedor_id !== undefined) {
    updates.push(` proveedor_id = $${paramIndex}`);
    params.push(proveedor_id || null);
    paramIndex++;
  }

  if (origen_compra !== undefined) {
    updates.push(` origen_compra = $${paramIndex}`);
    params.push(origen_compra || null);
    paramIndex++;
  }

  if (total !== undefined) {
    updates.push(` total = $${paramIndex}`);
    params.push(total);
    paramIndex++;
  }
  
  if (metodo_pago !== undefined) {
    updates.push(` metodo_pago = $${paramIndex}`);
    params.push(metodo_pago);
    paramIndex++;
  }
  
  if (solicito_factura !== undefined) {
    updates.push(` solicito_factura = $${paramIndex}`);
    params.push(solicito_factura);
    paramIndex++;
  }
  
  if (numero_factura !== undefined) {
    updates.push(` numero_factura = $${paramIndex}`);
    params.push(numero_factura);
    paramIndex++;
  }
  
  if (notas !== undefined) {
    updates.push(` notas = $${paramIndex}`);
    params.push(notas);
    paramIndex++;
  }

  if (fecha_compra !== undefined) {
    updates.push(` fecha_compra = $${paramIndex}`);
    params.push(fecha_compra);
    paramIndex++;
  }

  // Si se proporcionan items, actualizar los items de la compra
  if (items && Array.isArray(items)) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Primero actualizar los campos básicos de la compra si hay alguno
      if (updates.length > 0) {
        query += updates.join(',');
        query += ` WHERE id = $${paramIndex}`;
        params.push(id);
        await client.query(query, params);
      }

      // Eliminar items existentes de la compra
      await client.query('DELETE FROM items_compra WHERE compra_id = $1', [id]);

      // Insertar los nuevos items
      for (const item of items) {
        // Buscar automáticamente coincidencias con requisiciones si no se especificó
        let requisicionItemId = item.requisicion_item_id;

        if (!requisicionItemId && proveedor_id) {
          const requisicionMatch = await client.query(`
            SELECT ir.id
            FROM items_requisicion ir
            JOIN requisiciones r ON ir.requisicion_id = r.id
            JOIN insumo_proveedor ip ON ip.insumo_id = ir.insumo_id
            WHERE ir.insumo_id = $1
              AND ip.proveedor_id = $2
              AND ir.completado = false
              AND ir.cantidad <= $3
            ORDER BY r.fecha_solicitud
            LIMIT 1
          `, [item.insumo_id, proveedor_id, item.cantidad]);

          if (requisicionMatch.rows.length > 0) {
            requisicionItemId = requisicionMatch.rows[0].id;
          }
        }

        const itemQuery = `
          INSERT INTO items_compra
          (compra_id, insumo_id, requisicion_item_id, precio_unitario, cantidad, unidad, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        const subtotal = item.precio_unitario * item.cantidad;
        await client.query(itemQuery, [
          id,
          item.insumo_id,
          requisicionItemId,
          item.precio_unitario,
          item.cantidad,
          item.unidad,
          subtotal
        ]);

        // Marcar requisición como completada si aplica
        if (requisicionItemId) {
          await client.query(
            'UPDATE items_requisicion SET completado = true WHERE id = $1',
            [requisicionItemId]
          );
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } else if (updates.length > 0) {
    // Si no hay items pero sí otros campos para actualizar
    query += updates.join(',');
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);
    await pool.query(query, params);
  } else {
    throw new Error('No se proporcionaron campos para actualizar');
  }

  // Obtener la compra completa con sus items
  return await getCompraById(id);
};

/**
 * Elimina una compra y sus items
 */
export const deleteCompra = async (id) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar si la compra existe
    const existingCompra = await client.query(
      'SELECT id FROM compras WHERE id = $1',
      [id]
    );
    
    if (existingCompra.rows.length === 0) {
      throw new Error('Compra no encontrada');
    }
    
    // Obtener los items de requisición asociados a esta compra
    const itemsRequisicion = await client.query(
      `SELECT DISTINCT requisicion_item_id 
       FROM items_compra 
       WHERE compra_id = $1 AND requisicion_item_id IS NOT NULL`,
      [id]
    );
    
    // Marcar los items de requisición como no completados
    for (const item of itemsRequisicion.rows) {
      await client.query(
        'UPDATE items_requisicion SET completado = false WHERE id = $1',
        [item.requisicion_item_id]
      );
    }
    
    // Actualizar las requisiciones que ahora tienen items incompletos
    await client.query(
      `UPDATE requisiciones r
       SET completada = false, fecha_completada = NULL
       WHERE EXISTS (
         SELECT 1 FROM items_requisicion ir
         WHERE ir.requisicion_id = r.id
         AND ir.id IN (
           SELECT requisicion_item_id FROM items_compra
           WHERE compra_id = $1 AND requisicion_item_id IS NOT NULL
         )
       )`,
      [id]
    );
    
    // Eliminar los items de la compra
    await client.query(
      'DELETE FROM items_compra WHERE compra_id = $1',
      [id]
    );
    
    // Eliminar la compra
    const result = await client.query(
      'DELETE FROM compras WHERE id = $1 RETURNING *',
      [id]
    );
    
    await client.query('COMMIT');
    
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Agrega un item a una compra existente
 */
export const addItemToCompra = async (compraId, data) => {
  const { insumo_id, requisicion_item_id, precio_unitario, cantidad, unidad } = data;
  
  // Verificar si la compra existe
  const existingCompra = await pool.query(
    'SELECT id FROM compras WHERE id = $1',
    [compraId]
  );
  
  if (existingCompra.rows.length === 0) {
    throw new Error('Compra no encontrada');
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insertar el nuevo item
    const itemQuery = `
      INSERT INTO items_compra 
      (compra_id, insumo_id, requisicion_item_id, precio_unitario, cantidad, unidad) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const itemValues = [compraId, insumo_id, requisicion_item_id || null, precio_unitario, cantidad, unidad];
    const itemResult = await client.query(itemQuery, itemValues);
    
    // Obtener el item completo con datos del insumo
    const itemCompleto = await client.query(
      `SELECT ic.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria,
       CASE 
         WHEN ir.id IS NOT NULL THEN true
         ELSE false
       END as es_de_requisicion,
       ir.requisicion_id
       FROM items_compra ic
       JOIN insumos i ON ic.insumo_id = i.id
       LEFT JOIN items_requisicion ir ON ic.requisicion_item_id = ir.id
       WHERE ic.id = $1`,
      [itemResult.rows[0].id]
    );
    
    // Recalcular el total de la compra
    await recalcularTotalCompra(compraId, client);
    
    await client.query('COMMIT');
    
    return itemCompleto.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Actualiza un item de compra
 */
export const updateItemCompra = async (compraId, itemId, data) => {
  const { precio_unitario, cantidad, unidad } = data;
  
  // Verificar si el item existe y pertenece a la compra
  const existingItem = await pool.query(
    `SELECT ic.* FROM items_compra ic
     WHERE ic.id = $1 AND ic.compra_id = $2`,
    [itemId, compraId]
  );
  
  if (existingItem.rows.length === 0) {
    throw new Error('Item no encontrado en la compra');
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Actualizar el item
    let query = 'UPDATE items_compra SET';
    const params = [];
    let paramIndex = 1;
    const updates = [];
    
    if (precio_unitario !== undefined) {
      updates.push(` precio_unitario = $${paramIndex}`);
      params.push(precio_unitario);
      paramIndex++;
    }
    
    if (cantidad !== undefined) {
      updates.push(` cantidad = $${paramIndex}`);
      params.push(cantidad);
      paramIndex++;
    }
    
    if (unidad !== undefined) {
      updates.push(` unidad = $${paramIndex}`);
      params.push(unidad);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      throw new Error('No se proporcionaron campos para actualizar');
    }
    
    query += updates.join(',');
    query += ` WHERE id = $${paramIndex} AND compra_id = $${paramIndex + 1} RETURNING *`;
    params.push(itemId, compraId);
    
    const result = await client.query(query, params);
    
    // Obtener el item completo con datos del insumo
    const itemCompleto = await client.query(
      `SELECT ic.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria,
       CASE 
         WHEN ir.id IS NOT NULL THEN true
         ELSE false
       END as es_de_requisicion,
       ir.requisicion_id
       FROM items_compra ic
       JOIN insumos i ON ic.insumo_id = i.id
       LEFT JOIN items_requisicion ir ON ic.requisicion_item_id = ir.id
       WHERE ic.id = $1`,
      [itemId]
    );
    
    // Recalcular el total de la compra
    await recalcularTotalCompra(compraId, client);
    
    await client.query('COMMIT');
    
    return itemCompleto.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Elimina un item de compra
 */
export const deleteItemCompra = async (compraId, itemId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar si el item existe y pertenece a la compra
    const existingItem = await client.query(
      `SELECT ic.* FROM items_compra ic
       WHERE ic.id = $1 AND ic.compra_id = $2`,
      [itemId, compraId]
    );
    
    if (existingItem.rows.length === 0) {
      throw new Error('Item no encontrado en la compra');
    }
    
    // Si el item está asociado a un item de requisición, marcarlo como no completado
    if (existingItem.rows[0].requisicion_item_id) {
      await client.query(
        'UPDATE items_requisicion SET completado = false WHERE id = $1',
        [existingItem.rows[0].requisicion_item_id]
      );
      
      // Actualizar la requisición si es necesario
      await client.query(
        `UPDATE requisiciones r
         SET completada = false, fecha_completada = NULL
         WHERE id = (
           SELECT requisicion_id FROM items_requisicion
           WHERE id = $1
         )`,
        [existingItem.rows[0].requisicion_item_id]
      );
    }
    
    // Eliminar el item
    const result = await client.query(
      'DELETE FROM items_compra WHERE id = $1 RETURNING *',
      [itemId]
    );
    
    // Recalcular el total de la compra
    await recalcularTotalCompra(compraId, client);
    
    await client.query('COMMIT');
    
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Obtiene el análisis de precios de insumos
 */
export const getAnalisisPrecios = async (filters = {}) => {
  const { insumo_id, proveedor_id } = filters;
  
  let query = `SELECT * FROM analisis_precios_insumos WHERE 1=1`;
  const params = [];
  let paramIndex = 1;
  
  // Filtrar por insumo si se proporciona
  if (insumo_id) {
    query += ` AND insumo_id = $${paramIndex}`;
    params.push(insumo_id);
    paramIndex++;
  }
  
  // Filtrar por proveedor si se proporciona
  if (proveedor_id) {
    query += ` AND proveedor_id = $${paramIndex}`;
    params.push(proveedor_id);
    paramIndex++;
  }
  
  query += ' ORDER BY insumo_nombre, proveedor_nombre';
  
  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Obtiene los items de requisición pendientes por comprar
 */
export const getItemsRequisicionPendientes = async (proveedor_id = null) => {
  let query = `
    SELECT ir.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria,
    i.unidad_medida_default, r.fecha_solicitud,
    e.nombre as solicitante_nombre
    FROM items_requisicion ir
    JOIN insumos i ON ir.insumo_id = i.id
    JOIN requisiciones r ON ir.requisicion_id = r.id
    LEFT JOIN empleados e ON r.usuario_id = e.id
    WHERE ir.completado = false
  `;
  
  const params = [];
  let paramIndex = 1;
  
  // Filtrar por proveedor si se proporciona
  if (proveedor_id) {
    query += `
      AND EXISTS (
        SELECT 1 FROM insumo_proveedor ip
        WHERE ip.insumo_id = ir.insumo_id
        AND ip.proveedor_id = $${paramIndex}
      )
    `;
    params.push(proveedor_id);
    paramIndex++;
  }
  
  query += ' ORDER BY r.fecha_solicitud, ir.urgencia DESC';
  
  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Obtiene qué comprar hoy por día y proveedor
 */
export const getComprasDelDia = async (dia, proveedor_id = null) => {
  let query = `
    SELECT DISTINCT
      p.id as proveedor_id,
      p.nombre as proveedor_nombre,
      ir.id as requisicion_item_id,
      ir.insumo_id,
      i.nombre as insumo_nombre,
      i.categoria as insumo_categoria,
      ir.cantidad,
      ir.unidad,
      ir.urgencia,
      r.fecha_solicitud,
      e.nombre as solicitante_nombre,
      ip.precio_referencia,
      inv.cantidad_actual as stock_actual,
      inv.stock_minimo,
      CASE 
        WHEN inv.stock_minimo > 0 AND inv.cantidad_actual <= inv.stock_minimo THEN true
        ELSE false
      END as necesita_reposicion
    FROM proveedores p
    JOIN insumo_proveedor ip ON p.id = ip.proveedor_id
    JOIN insumos i ON ip.insumo_id = i.id
    LEFT JOIN items_requisicion ir ON i.id = ir.insumo_id AND ir.completado = false
    LEFT JOIN requisiciones r ON ir.requisicion_id = r.id
    LEFT JOIN empleados e ON r.usuario_id = e.id
    LEFT JOIN inventario inv ON i.id = inv.insumo_id AND ir.unidad = inv.unidad
    WHERE p.activo = true 
    AND p.dias_compra::jsonb ? $1
    AND i.activo = true
    AND (
      ir.id IS NOT NULL OR 
      (inv.stock_minimo > 0 AND inv.cantidad_actual <= inv.stock_minimo)
    )
  `;
  
  const params = [dia];
  let paramIndex = 2;
  
  // Filtrar por proveedor específico si se proporciona
  if (proveedor_id) {
    query += ` AND p.id = $${paramIndex}`;
    params.push(proveedor_id);
    paramIndex++;
  }
  
  query += ` ORDER BY p.nombre, ir.urgencia DESC, r.fecha_solicitud`;
  
  const result = await pool.query(query, params);
  
  // Agrupar por proveedor
  const comprasPorProveedor = {};
  
  result.rows.forEach(row => {
    if (!comprasPorProveedor[row.proveedor_id]) {
      comprasPorProveedor[row.proveedor_id] = {
        proveedor_id: row.proveedor_id,
        proveedor_nombre: row.proveedor_nombre,
        items: []
      };
    }
    
    // Solo agregar si hay datos del item (no es solo el proveedor)
    if (row.insumo_id) {
      comprasPorProveedor[row.proveedor_id].items.push({
        requisicion_item_id: row.requisicion_item_id,
        insumo_id: row.insumo_id,
        insumo_nombre: row.insumo_nombre,
        insumo_categoria: row.insumo_categoria,
        cantidad: row.cantidad,
        unidad: row.unidad,
        urgencia: row.urgencia,
        fecha_solicitud: row.fecha_solicitud,
        solicitante_nombre: row.solicitante_nombre,
        precio_referencia: row.precio_referencia,
        stock_actual: row.stock_actual,
        stock_minimo: row.stock_minimo,
        necesita_reposicion: row.necesita_reposicion,
        es_requisicion: row.requisicion_item_id !== null
      });
    }
  });
  
  return Object.values(comprasPorProveedor);
};

/**
 * Función auxiliar para recalcular el total de una compra
 */
const recalcularTotalCompra = async (compraId, clientParam = null) => {
  const client = clientParam || pool;
  
  // Calcular el nuevo total
  const totalResult = await client.query(
    `SELECT SUM(subtotal) as nuevo_total
     FROM items_compra
     WHERE compra_id = $1`,
    [compraId]
  );
  
  const nuevoTotal = totalResult.rows[0].nuevo_total || 0;
  
  // Actualizar el total de la compra
  await client.query(
    'UPDATE compras SET total = $1 WHERE id = $2',
    [nuevoTotal, compraId]
  );
  
  return nuevoTotal;
}; 