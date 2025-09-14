import pool from "../config/db.js";

/**
 * Obtiene todo el inventario actual con niveles de stock
 */
export const getAllInventario = async (filters = {}) => {
  const { categoria, bajo_minimo, estado_stock, con_alertas } = filters;

  let query = `
    SELECT
      inv.*,
      i.nombre as insumo_nombre,
      i.categoria as insumo_categoria,
      i.marca,
      i.unidad_medida_default,
      inv.punto_reorden,
      inv.tiempo_entrega_dias,
      CASE
        WHEN inv.stock_minimo > 0 AND inv.cantidad_actual <= inv.stock_minimo THEN true
        ELSE false
      END as necesita_reposicion,
      CASE
        WHEN inv.cantidad_actual <= 0 THEN 'sin_stock'
        WHEN inv.cantidad_actual <= inv.stock_minimo THEN 'critico'
        WHEN inv.cantidad_actual <= inv.punto_reorden THEN 'reordenar'
        WHEN inv.cantidad_actual >= inv.stock_maximo AND inv.stock_maximo > 0 THEN 'exceso'
        ELSE 'normal'
      END as estado_stock,
      (
        SELECT COUNT(*)
        FROM alertas_inventario ai
        WHERE ai.insumo_id = inv.insumo_id
        AND ai.atendida = false
      ) as alertas_activas,
      (
        SELECT AVG(precio_unitario) FROM (
          SELECT precio_unitario
          FROM items_compra ic
          WHERE ic.insumo_id = inv.insumo_id
          ORDER BY ic.id DESC
          LIMIT 3
        ) ultimos_precios
      ) as precio_promedio
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

  // Filtrar por estado de stock
  if (estado_stock) {
    switch (estado_stock) {
      case 'sin_stock':
        query += ` AND inv.cantidad_actual <= 0`;
        break;
      case 'critico':
        query += ` AND inv.cantidad_actual > 0 AND inv.cantidad_actual <= inv.stock_minimo`;
        break;
      case 'reordenar':
        query += ` AND inv.cantidad_actual > inv.stock_minimo AND inv.cantidad_actual <= inv.punto_reorden`;
        break;
      case 'exceso':
        query += ` AND inv.stock_maximo > 0 AND inv.cantidad_actual >= inv.stock_maximo`;
        break;
      case 'normal':
        query += ` AND inv.cantidad_actual > inv.punto_reorden AND (inv.stock_maximo = 0 OR inv.cantidad_actual < inv.stock_maximo)`;
        break;
    }
  }

  // Filtrar por items con alertas activas
  if (con_alertas === 'true') {
    query += ` AND EXISTS (
      SELECT 1 FROM alertas_inventario ai
      WHERE ai.insumo_id = inv.insumo_id
      AND ai.atendida = false
    )`;
  }

  query += ` ORDER BY
    CASE
      WHEN inv.cantidad_actual <= 0 THEN 1
      WHEN inv.cantidad_actual <= inv.stock_minimo THEN 2
      ELSE 3
    END,
    i.nombre, inv.unidad`;

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
      COUNT(DISTINCT inv.insumo_id) as total_insumos,
      COUNT(CASE WHEN inv.cantidad_actual = 0 THEN 1 END) as sin_stock,
      COUNT(CASE WHEN inv.stock_minimo > 0 AND inv.cantidad_actual > 0 AND inv.cantidad_actual <= inv.stock_minimo THEN 1 END) as stock_critico,
      COUNT(CASE WHEN inv.punto_reorden > 0 AND inv.cantidad_actual > inv.stock_minimo AND inv.cantidad_actual <= inv.punto_reorden THEN 1 END) as para_reordenar,
      COUNT(CASE WHEN inv.stock_maximo > 0 AND inv.cantidad_actual >= inv.stock_maximo THEN 1 END) as stock_exceso,
      (
        SELECT COUNT(*)
        FROM alertas_inventario
        WHERE atendida = false
      ) as alertas_activas,
      (
        SELECT SUM(inv2.cantidad_actual * COALESCE(
          (
            SELECT AVG(precio_unitario) FROM (
              SELECT precio_unitario
              FROM items_compra ic
              WHERE ic.insumo_id = inv2.insumo_id
              ORDER BY ic.id DESC
              LIMIT 3
            ) ultimos_precios
          ), 0
        ))
        FROM inventario inv2
      ) as valor_total_inventario
    FROM inventario inv
    JOIN insumos i ON inv.insumo_id = i.id
    WHERE i.activo = true
  `;

  const result = await pool.query(query);
  return result.rows[0];
};

/**
 * Actualiza niveles de inventario (stock mínimo, máximo, punto de reorden)
 */
export const updateNivelesInventario = async (insumoId, unidad, niveles) => {
  const updateFields = [];
  const updateValues = [];
  let paramCount = 1;

  if (niveles.stock_minimo !== undefined) {
    updateFields.push(`stock_minimo = $${paramCount}`);
    updateValues.push(niveles.stock_minimo);
    paramCount++;
  }

  if (niveles.stock_maximo !== undefined) {
    updateFields.push(`stock_maximo = $${paramCount}`);
    updateValues.push(niveles.stock_maximo);
    paramCount++;
  }

  if (niveles.punto_reorden !== undefined) {
    updateFields.push(`punto_reorden = $${paramCount}`);
    updateValues.push(niveles.punto_reorden);
    paramCount++;
  }

  if (niveles.tiempo_entrega_dias !== undefined) {
    updateFields.push(`tiempo_entrega_dias = $${paramCount}`);
    updateValues.push(niveles.tiempo_entrega_dias);
    paramCount++;
  }

  if (updateFields.length === 0) {
    throw new Error('No se proporcionaron campos para actualizar');
  }

  updateValues.push(insumoId, unidad);
  const query = `
    UPDATE inventario
    SET ${updateFields.join(', ')}
    WHERE insumo_id = $${paramCount} AND unidad = $${paramCount + 1}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, updateValues);

    if (result.rows.length === 0) {
      // Si no existe, crear el registro
      const insertQuery = `
        INSERT INTO inventario (
          insumo_id, unidad, cantidad_actual,
          stock_minimo, stock_maximo, punto_reorden, tiempo_entrega_dias
        ) VALUES ($1, $2, 0, $3, $4, $5, $6)
        RETURNING *
      `;
      const insertResult = await pool.query(insertQuery, [
        insumoId,
        unidad,
        niveles.stock_minimo || 0,
        niveles.stock_maximo || 0,
        niveles.punto_reorden || 0,
        niveles.tiempo_entrega_dias || 1
      ]);
      return insertResult.rows[0];
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error al actualizar niveles de inventario:', error);
    throw error;
  }
};

/**
 * Obtiene alertas de inventario
 */
export const getAlertasInventario = async (atendidas = false) => {
  const query = `
    SELECT
      ai.*,
      i.nombre as insumo_nombre,
      i.marca,
      i.categoria,
      e.nombre as usuario_atendio_nombre
    FROM alertas_inventario ai
    JOIN insumos i ON ai.insumo_id = i.id
    LEFT JOIN empleados e ON ai.usuario_atendio_id = e.id
    WHERE ai.atendida = $1
    ORDER BY
      CASE ai.urgencia
        WHEN 'critica' THEN 1
        WHEN 'alta' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'baja' THEN 4
      END,
      ai.fecha_alerta DESC
  `;
  const result = await pool.query(query, [atendidas]);
  return result.rows;
};

/**
 * Marca una alerta como atendida
 */
export const atenderAlerta = async (alertaId, usuarioId) => {
  const query = `
    UPDATE alertas_inventario
    SET atendida = true,
        fecha_atendida = CURRENT_TIMESTAMP,
        usuario_atendio_id = $2
    WHERE id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [alertaId, usuarioId]);

  if (result.rows.length === 0) {
    throw new Error('Alerta no encontrada');
  }

  return result.rows[0];
};

/**
 * Obtiene movimientos de inventario
 */
export const getMovimientosInventario = async (filters = {}) => {
  let query = `
    SELECT
      mi.*,
      i.nombre as insumo_nombre,
      i.marca,
      i.categoria,
      e.nombre as usuario_nombre
    FROM movimientos_inventario mi
    JOIN insumos i ON mi.insumo_id = i.id
    LEFT JOIN empleados e ON mi.usuario_id = e.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;

  if (filters.insumo_id) {
    query += ` AND mi.insumo_id = $${paramCount}`;
    params.push(filters.insumo_id);
    paramCount++;
  }

  if (filters.tipo_movimiento) {
    query += ` AND mi.tipo_movimiento = $${paramCount}`;
    params.push(filters.tipo_movimiento);
    paramCount++;
  }

  if (filters.fecha_inicio) {
    query += ` AND mi.fecha_movimiento >= $${paramCount}`;
    params.push(filters.fecha_inicio);
    paramCount++;
  }

  if (filters.fecha_fin) {
    query += ` AND mi.fecha_movimiento <= $${paramCount}`;
    params.push(filters.fecha_fin);
    paramCount++;
  }

  query += ` ORDER BY mi.fecha_movimiento DESC`;

  if (filters.limit) {
    query += ` LIMIT $${paramCount}`;
    params.push(filters.limit);
  }

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Obtiene sugerencias de reorden basadas en consumo histórico
 */
export const getSugerenciasReorden = async () => {
  const query = `
    WITH consumo_promedio AS (
      SELECT
        insumo_id,
        unidad,
        AVG(ABS(cantidad)) as consumo_diario_promedio
      FROM movimientos_inventario
      WHERE tipo_movimiento = 'venta'
      AND fecha_movimiento >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY insumo_id, unidad
    )
    SELECT
      inv.insumo_id,
      i.nombre as insumo_nombre,
      i.marca,
      inv.cantidad_actual,
      inv.unidad,
      inv.stock_minimo,
      inv.punto_reorden,
      inv.tiempo_entrega_dias,
      cp.consumo_diario_promedio,
      CASE
        WHEN cp.consumo_diario_promedio > 0 THEN
          CEIL(inv.cantidad_actual / cp.consumo_diario_promedio)
        ELSE NULL
      END as dias_inventario_restante,
      CASE
        WHEN cp.consumo_diario_promedio > 0 THEN
          GREATEST(
            inv.stock_minimo,
            CEIL(cp.consumo_diario_promedio * (inv.tiempo_entrega_dias + 3))
          )
        ELSE inv.punto_reorden
      END as punto_reorden_sugerido,
      CASE
        WHEN cp.consumo_diario_promedio > 0 THEN
          CEIL(cp.consumo_diario_promedio * 30)
        ELSE inv.stock_maximo
      END as stock_maximo_sugerido
    FROM inventario inv
    JOIN insumos i ON inv.insumo_id = i.id
    LEFT JOIN consumo_promedio cp ON inv.insumo_id = cp.insumo_id AND inv.unidad = cp.unidad
    WHERE i.activo = true
    AND (
      inv.cantidad_actual <= inv.punto_reorden
      OR (cp.consumo_diario_promedio > 0 AND inv.cantidad_actual / cp.consumo_diario_promedio <= inv.tiempo_entrega_dias + 2)
    )
    ORDER BY
      CASE
        WHEN inv.cantidad_actual <= 0 THEN 1
        WHEN inv.cantidad_actual <= inv.stock_minimo THEN 2
        ELSE 3
      END,
      dias_inventario_restante ASC NULLS LAST
  `;
  const result = await pool.query(query);
  return result.rows;
};