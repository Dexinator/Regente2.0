import pool from "../config/db.js";

/**
 * Obtiene todas las requisiciones, opcionalmente filtradas por estado de completado
 */
export const getAllRequisiciones = async (completada = null) => {
  let query = `
    SELECT r.*, e.nombre as usuario_nombre,
    (SELECT COUNT(*) FROM items_requisicion WHERE requisicion_id = r.id) as total_items,
    (SELECT COUNT(*) FROM items_requisicion WHERE requisicion_id = r.id AND completado = true) as items_completados
    FROM requisiciones r
    LEFT JOIN empleados e ON r.usuario_id = e.id
  `;
  
  const params = [];
  
  // Filtrar por estado de completado si se proporciona
  if (completada !== null) {
    query += ' WHERE r.completada = $1';
    params.push(completada);
  }
  
  query += ' ORDER BY r.fecha_solicitud DESC';
  
  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Obtiene una requisición por ID con sus items
 */
export const getRequisicionById = async (id) => {
  // Obtener la requisición
  const requisicionQuery = `
    SELECT r.*, e.nombre as usuario_nombre
    FROM requisiciones r
    LEFT JOIN empleados e ON r.usuario_id = e.id
    WHERE r.id = $1
  `;
  
  const requisicionResult = await pool.query(requisicionQuery, [id]);
  
  if (requisicionResult.rows.length === 0) {
    return null;
  }
  
  const requisicion = requisicionResult.rows[0];
  
  // Obtener los items de la requisición
  const itemsQuery = `
    SELECT ir.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria,
    i.unidad_medida_default
    FROM items_requisicion ir
    JOIN insumos i ON ir.insumo_id = i.id
    WHERE ir.requisicion_id = $1
    ORDER BY ir.id
  `;
  
  const itemsResult = await pool.query(itemsQuery, [id]);
  
  // Combinar resultados
  return {
    ...requisicion,
    items: itemsResult.rows
  };
};

/**
 * Crea una nueva requisición con sus items
 */
export const createRequisicion = async (data) => {
  const { usuario_id, items, notas } = data;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insertar la requisición
    const requisicionQuery = `
      INSERT INTO requisiciones 
      (usuario_id, notas) 
      VALUES ($1, $2) 
      RETURNING *
    `;
    
    const requisicionValues = [usuario_id, notas];
    const requisicionResult = await client.query(requisicionQuery, requisicionValues);
    const requisicionId = requisicionResult.rows[0].id;
    
    // Insertar los items de la requisición
    for (const item of items) {
      const itemQuery = `
        INSERT INTO items_requisicion 
        (requisicion_id, insumo_id, cantidad, unidad, urgencia) 
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      const itemValues = [
        requisicionId, 
        item.insumo_id, 
        item.cantidad, 
        item.unidad,
        item.urgencia || 'normal'
      ];
      
      await client.query(itemQuery, itemValues);
    }
    
    await client.query('COMMIT');
    
    // Obtener la requisición completa con sus items
    return await getRequisicionById(requisicionId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Actualiza una requisición existente
 */
export const updateRequisicion = async (id, data) => {
  const { notas, completada } = data;
  
  // Verificar si la requisición existe
  const existingRequisicion = await pool.query(
    'SELECT id FROM requisiciones WHERE id = $1',
    [id]
  );
  
  if (existingRequisicion.rows.length === 0) {
    throw new Error('Requisición no encontrada');
  }
  
  // Actualizar la requisición
  let query = 'UPDATE requisiciones SET';
  const params = [];
  let paramIndex = 1;
  const updates = [];
  
  if (notas !== undefined) {
    updates.push(` notas = $${paramIndex}`);
    params.push(notas);
    paramIndex++;
  }
  
  if (completada !== undefined) {
    updates.push(` completada = $${paramIndex}`);
    params.push(completada);
    paramIndex++;
    
    if (completada) {
      updates.push(` fecha_completada = CURRENT_TIMESTAMP`);
    } else {
      updates.push(` fecha_completada = NULL`);
    }
  }
  
  if (updates.length === 0) {
    throw new Error('No se proporcionaron campos para actualizar');
  }
  
  query += updates.join(',');
  query += ` WHERE id = $${paramIndex} RETURNING *`;
  params.push(id);
  
  const result = await pool.query(query, params);
  
  // Obtener la requisición completa con sus items
  return await getRequisicionById(id);
};

/**
 * Elimina una requisición y sus items
 */
export const deleteRequisicion = async (id) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Verificar si la requisición existe
    const existingRequisicion = await client.query(
      'SELECT id FROM requisiciones WHERE id = $1',
      [id]
    );
    
    if (existingRequisicion.rows.length === 0) {
      throw new Error('Requisición no encontrada');
    }
    
    // Verificar si hay items de compra relacionados
    const itemsCompraRelacionados = await client.query(
      `SELECT COUNT(*) FROM items_compra ic
       JOIN items_requisicion ir ON ic.requisicion_item_id = ir.id
       WHERE ir.requisicion_id = $1`,
      [id]
    );
    
    if (parseInt(itemsCompraRelacionados.rows[0].count) > 0) {
      throw new Error('No se puede eliminar la requisición porque ya tiene compras asociadas');
    }
    
    // Eliminar los items de la requisición
    await client.query(
      'DELETE FROM items_requisicion WHERE requisicion_id = $1',
      [id]
    );
    
    // Eliminar la requisición
    const result = await client.query(
      'DELETE FROM requisiciones WHERE id = $1 RETURNING *',
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
 * Agrega un item a una requisición existente
 */
export const addItemToRequisicion = async (requisicionId, data) => {
  const { insumo_id, cantidad, unidad, urgencia } = data;
  
  // Verificar si la requisición existe
  const existingRequisicion = await pool.query(
    'SELECT id, completada FROM requisiciones WHERE id = $1',
    [requisicionId]
  );
  
  if (existingRequisicion.rows.length === 0) {
    throw new Error('Requisición no encontrada');
  }
  
  // Verificar si la requisición está completada
  if (existingRequisicion.rows[0].completada) {
    throw new Error('No se pueden agregar items a una requisición completada');
  }
  
  // Insertar el nuevo item
  const query = `
    INSERT INTO items_requisicion 
    (requisicion_id, insumo_id, cantidad, unidad, urgencia) 
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const values = [requisicionId, insumo_id, cantidad, unidad, urgencia || 'normal'];
  const result = await pool.query(query, values);
  
  // Obtener el item completo con datos del insumo
  const itemCompleto = await pool.query(
    `SELECT ir.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria,
     i.unidad_medida_default
     FROM items_requisicion ir
     JOIN insumos i ON ir.insumo_id = i.id
     WHERE ir.id = $1`,
    [result.rows[0].id]
  );
  
  return itemCompleto.rows[0];
};

/**
 * Actualiza un item de requisición
 */
export const updateItemRequisicion = async (requisicionId, itemId, data) => {
  const { cantidad, unidad, urgencia, completado } = data;
  
  // Verificar si el item existe y pertenece a la requisición
  const existingItem = await pool.query(
    `SELECT ir.* FROM items_requisicion ir
     WHERE ir.id = $1 AND ir.requisicion_id = $2`,
    [itemId, requisicionId]
  );
  
  if (existingItem.rows.length === 0) {
    throw new Error('Item no encontrado en la requisición');
  }
  
  // Actualizar el item
  let query = 'UPDATE items_requisicion SET';
  const params = [];
  let paramIndex = 1;
  const updates = [];
  
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
  
  if (urgencia !== undefined) {
    updates.push(` urgencia = $${paramIndex}`);
    params.push(urgencia);
    paramIndex++;
  }
  
  if (completado !== undefined) {
    updates.push(` completado = $${paramIndex}`);
    params.push(completado);
    paramIndex++;
  }
  
  if (updates.length === 0) {
    throw new Error('No se proporcionaron campos para actualizar');
  }
  
  query += updates.join(',');
  query += ` WHERE id = $${paramIndex} AND requisicion_id = $${paramIndex + 1} RETURNING *`;
  params.push(itemId, requisicionId);
  
  const result = await pool.query(query, params);
  
  // Si se marcó como completado, verificar si todos los items están completados
  if (completado === true) {
    const itemsPendientes = await pool.query(
      `SELECT COUNT(*) FROM items_requisicion 
       WHERE requisicion_id = $1 AND completado = false`,
      [requisicionId]
    );
    
    // Si no hay items pendientes, marcar la requisición como completada
    if (parseInt(itemsPendientes.rows[0].count) === 0) {
      await pool.query(
        `UPDATE requisiciones 
         SET completada = true, fecha_completada = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [requisicionId]
      );
    }
  } else if (completado === false) {
    // Si se marcó como no completado, asegurarse de que la requisición no esté marcada como completada
    await pool.query(
      `UPDATE requisiciones 
       SET completada = false, fecha_completada = NULL
       WHERE id = $1`,
      [requisicionId]
    );
  }
  
  // Obtener el item completo con datos del insumo
  const itemCompleto = await pool.query(
    `SELECT ir.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria,
     i.unidad_medida_default
     FROM items_requisicion ir
     JOIN insumos i ON ir.insumo_id = i.id
     WHERE ir.id = $1`,
    [itemId]
  );
  
  return itemCompleto.rows[0];
};

/**
 * Elimina un item de requisición
 */
export const deleteItemRequisicion = async (requisicionId, itemId) => {
  // Verificar si el item existe y pertenece a la requisición
  const existingItem = await pool.query(
    `SELECT ir.* FROM items_requisicion ir
     WHERE ir.id = $1 AND ir.requisicion_id = $2`,
    [itemId, requisicionId]
  );
  
  if (existingItem.rows.length === 0) {
    throw new Error('Item no encontrado en la requisición');
  }
  
  // Verificar si hay compras asociadas al item
  const comprasAsociadas = await pool.query(
    'SELECT COUNT(*) FROM items_compra WHERE requisicion_item_id = $1',
    [itemId]
  );
  
  if (parseInt(comprasAsociadas.rows[0].count) > 0) {
    throw new Error('No se puede eliminar el item porque ya tiene compras asociadas');
  }
  
  // Eliminar el item
  const result = await pool.query(
    'DELETE FROM items_requisicion WHERE id = $1 RETURNING *',
    [itemId]
  );
  
  return result.rows[0];
}; 