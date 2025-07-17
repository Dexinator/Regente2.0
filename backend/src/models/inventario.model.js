import pool from "../config/db.js";

/**
 * Obtiene todo el inventario actual
 */
export const getAllInventario = async (filters = {}) => {
  const { categoria, bajo_minimo } = filters;
  
  let query = `
    SELECT inv.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria,
    i.unidad_medida_default,
    CASE 
      WHEN inv.stock_minimo > 0 AND inv.cantidad_actual <= inv.stock_minimo THEN true
      ELSE false
    END as necesita_reposicion
    FROM inventario inv
    JOIN insumos i ON inv.insumo_id = i.id
    WHERE i.activo = true
  `;
  
  const params = [];
  let paramIndex = 1;
  
  // Filtrar por categoría si se proporciona
  if (categoria) {
    query += ` AND i.categoria = $${paramIndex}`;
    params.push(categoria);
    paramIndex++;
  }
  
  // Filtrar por inventario bajo mínimo
  if (bajo_minimo) {
    query += ` AND inv.stock_minimo > 0 AND inv.cantidad_actual <= inv.stock_minimo`;
  }
  
  query += ' ORDER BY i.nombre, inv.unidad';
  
  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Obtiene inventario por insumo
 */
export const getInventarioByInsumo = async (insumo_id) => {
  const query = `
    SELECT inv.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria,
    i.unidad_medida_default,
    CASE 
      WHEN inv.stock_minimo > 0 AND inv.cantidad_actual <= inv.stock_minimo THEN true
      ELSE false
    END as necesita_reposicion
    FROM inventario inv
    JOIN insumos i ON inv.insumo_id = i.id
    WHERE inv.insumo_id = $1
    ORDER BY inv.unidad
  `;
  
  const result = await pool.query(query, [insumo_id]);
  return result.rows;
};

/**
 * Actualiza o crea un registro de inventario
 */
export const updateInventario = async (data) => {
  const { insumo_id, cantidad_actual, unidad, stock_minimo, stock_maximo } = data;
  
  const query = `
    INSERT INTO inventario (insumo_id, cantidad_actual, unidad, stock_minimo, stock_maximo)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (insumo_id, unidad)
    DO UPDATE SET 
      cantidad_actual = $2,
      stock_minimo = $4,
      stock_maximo = $5,
      ultima_actualizacion = CURRENT_TIMESTAMP
    RETURNING *
  `;
  
  const values = [insumo_id, cantidad_actual, unidad, stock_minimo || 0, stock_maximo || 0];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Ajusta inventario (suma o resta cantidad)
 */
export const ajustarInventario = async (insumo_id, unidad, cantidad_ajuste, motivo = null) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Obtener inventario actual
    const inventarioActual = await client.query(
      'SELECT * FROM inventario WHERE insumo_id = $1 AND unidad = $2',
      [insumo_id, unidad]
    );
    
    if (inventarioActual.rows.length === 0) {
      // Si no existe, crear nuevo registro
      await client.query(
        `INSERT INTO inventario (insumo_id, cantidad_actual, unidad) 
         VALUES ($1, $2, $3)`,
        [insumo_id, Math.max(0, cantidad_ajuste), unidad]
      );
    } else {
      // Actualizar cantidad existente
      const nuevaCantidad = Math.max(0, inventarioActual.rows[0].cantidad_actual + cantidad_ajuste);
      await client.query(
        `UPDATE inventario 
         SET cantidad_actual = $1, ultima_actualizacion = CURRENT_TIMESTAMP
         WHERE insumo_id = $2 AND unidad = $3`,
        [nuevaCantidad, insumo_id, unidad]
      );
    }
    
    // Registrar el movimiento en historial (si queremos llevar histórico)
    // TODO: Crear tabla de movimientos_inventario si se requiere
    
    await client.query('COMMIT');
    
    // Obtener y retornar el inventario actualizado
    const inventarioActualizado = await client.query(
      `SELECT inv.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria
       FROM inventario inv
       JOIN insumos i ON inv.insumo_id = i.id
       WHERE inv.insumo_id = $1 AND inv.unidad = $2`,
      [insumo_id, unidad]
    );
    
    return inventarioActualizado.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Obtiene insumos con inventario bajo mínimo por proveedor
 */
export const getInventarioBajoPorProveedor = async (proveedor_id) => {
  const query = `
    SELECT inv.*, i.nombre as insumo_nombre, i.categoria as insumo_categoria,
    i.unidad_medida_default, p.nombre as proveedor_nombre
    FROM inventario inv
    JOIN insumos i ON inv.insumo_id = i.id
    JOIN insumo_proveedor ip ON i.id = ip.insumo_id
    JOIN proveedores p ON ip.proveedor_id = p.id
    WHERE inv.stock_minimo > 0 
    AND inv.cantidad_actual <= inv.stock_minimo
    AND ip.proveedor_id = $1
    AND i.activo = true
    ORDER BY i.nombre, inv.unidad
  `;
  
  const result = await pool.query(query, [proveedor_id]);
  return result.rows;
};

/**
 * Obtiene estadísticas de inventario
 */
export const getEstadisticasInventario = async () => {
  const query = `
    SELECT 
      COUNT(*) as total_items,
      COUNT(CASE WHEN stock_minimo > 0 AND cantidad_actual <= stock_minimo THEN 1 END) as items_bajo_minimo,
      COUNT(CASE WHEN stock_maximo > 0 AND cantidad_actual >= stock_maximo THEN 1 END) as items_sobre_maximo,
      COUNT(CASE WHEN cantidad_actual = 0 THEN 1 END) as items_sin_stock
    FROM inventario inv
    JOIN insumos i ON inv.insumo_id = i.id
    WHERE i.activo = true
  `;
  
  const result = await pool.query(query);
  return result.rows[0];
};