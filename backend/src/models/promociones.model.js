import pool from "../config/db.js";

/**
 * Obtiene todos los códigos promocionales
 */
export const getAllCodigos = async () => {
  const query = `
    SELECT * FROM codigos_promocionales 
    ORDER BY id DESC
  `;
  
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Obtiene un código promocional por su ID
 */
export const getCodigoById = async (id) => {
  const query = `
    SELECT * FROM codigos_promocionales 
    WHERE id = $1
  `;
  
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

/**
 * Obtiene un código promocional por su texto de código
 */
export const getCodigoByCodigo = async (codigo) => {
  const query = `
    SELECT * FROM codigos_promocionales 
    WHERE codigo = $1
  `;
  
  const result = await pool.query(query, [codigo]);
  return result.rows[0] || null;
};

/**
 * Crea un nuevo código promocional
 */
export const createCodigo = async (data) => {
  const { 
    codigo, 
    porcentaje_descuento, 
    fecha_inicio, 
    fecha_fin, 
    activo = true, 
    usos_maximos = -1
  } = data;
  
  const query = `
    INSERT INTO codigos_promocionales (
      codigo, 
      porcentaje_descuento, 
      fecha_inicio, 
      fecha_fin, 
      activo, 
      usos_maximos, 
      usos_actuales
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, 0) 
    RETURNING *
  `;
  
  const values = [
    codigo, 
    porcentaje_descuento, 
    fecha_inicio, 
    fecha_fin, 
    activo, 
    usos_maximos
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Actualiza un código promocional existente
 */
export const updateCodigo = async (id, data) => {
  const { 
    codigo, 
    porcentaje_descuento, 
    fecha_inicio, 
    fecha_fin, 
    activo, 
    usos_maximos 
  } = data;
  
  const query = `
    UPDATE codigos_promocionales 
    SET 
      codigo = $1, 
      porcentaje_descuento = $2, 
      fecha_inicio = $3, 
      fecha_fin = $4, 
      activo = $5, 
      usos_maximos = $6
    WHERE id = $7 
    RETURNING *
  `;
  
  const values = [
    codigo, 
    porcentaje_descuento, 
    fecha_inicio, 
    fecha_fin, 
    activo, 
    usos_maximos, 
    id
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Elimina un código promocional
 */
export const deleteCodigo = async (id) => {
  const query = `
    DELETE FROM codigos_promocionales 
    WHERE id = $1 
    RETURNING *
  `;
  
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

/**
 * Valida si un código promocional es válido
 * Retorna el objeto del código si es válido, o null si no lo es
 */
export const validateCodigo = async (codigo) => {
  const query = `
    SELECT * FROM codigos_promocionales 
    WHERE 
      codigo = $1 AND 
      activo = true AND 
      fecha_inicio <= CURRENT_DATE AND 
      fecha_fin >= CURRENT_DATE AND
      (usos_maximos = -1 OR usos_actuales < usos_maximos)
  `;
  
  const result = await pool.query(query, [codigo]);
  return result.rows[0] || null;
};

/**
 * Aplica un código de descuento a una orden
 * 1. Actualiza el código de descuento en la orden
 * 2. Incrementa los usos del código
 */
export const aplicarCodigo = async (orden_id, codigo_id) => {
  try {
    // Iniciar transacción
    await pool.query('BEGIN');
    
    // 1. Actualizar la orden con el código de descuento
    const updateOrdenQuery = `
      UPDATE ordenes 
      SET codigo_descuento_id = $1 
      WHERE orden_id = $2 
      RETURNING *
    `;
    
    const ordenResult = await pool.query(updateOrdenQuery, [codigo_id, orden_id]);
    
    if (!ordenResult.rows[0]) {
      await pool.query('ROLLBACK');
      return null;
    }
    
    // 2. Incrementar uso del código
    const incrementUsoQuery = `
      UPDATE codigos_promocionales 
      SET usos_actuales = usos_actuales + 1 
      WHERE id = $1 
      RETURNING *
    `;
    
    await pool.query(incrementUsoQuery, [codigo_id]);
    
    // 3. Recalcular los totales de la orden con el descuento
    await recalcularOrdenConDescuento(orden_id);
    
    // Confirmar transacción
    await pool.query('COMMIT');
    
    // Retornar la orden actualizada con todos sus detalles
    return await getOrdenConDescuento(orden_id);
    
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

/**
 * Remueve un código de descuento de una orden
 */
export const removerCodigo = async (orden_id) => {
  try {
    // Iniciar transacción
    await pool.query('BEGIN');
    
    // 1. Obtener el código actual para restarle un uso
    const getOrdenQuery = `
      SELECT codigo_descuento_id FROM ordenes 
      WHERE orden_id = $1
    `;
    
    const ordenResult = await pool.query(getOrdenQuery, [orden_id]);
    
    if (!ordenResult.rows[0] || !ordenResult.rows[0].codigo_descuento_id) {
      await pool.query('ROLLBACK');
      return null;
    }
    
    const codigo_id = ordenResult.rows[0].codigo_descuento_id;
    
    // 2. Actualizar la orden removiendo el código
    const updateOrdenQuery = `
      UPDATE ordenes 
      SET codigo_descuento_id = NULL 
      WHERE orden_id = $1 
      RETURNING *
    `;
    
    await pool.query(updateOrdenQuery, [orden_id]);
    
    // 3. Decrementar el uso del código
    const decrementUsoQuery = `
      UPDATE codigos_promocionales 
      SET usos_actuales = GREATEST(0, usos_actuales - 1)
      WHERE id = $1
    `;
    
    await pool.query(decrementUsoQuery, [codigo_id]);
    
    // 4. Recalcular los totales de la orden sin el descuento
    await recalcularOrdenConDescuento(orden_id);
    
    // Confirmar transacción
    await pool.query('COMMIT');
    
    // Retornar la orden actualizada
    return await getOrdenConDescuento(orden_id);
    
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
};

/**
 * Recalcula los totales de la orden considerando descuentos
 */
export const recalcularOrdenConDescuento = async (orden_id) => {
  // Obtener información del descuento (si existe)
  const getDescuentoQuery = `
    SELECT o.codigo_descuento_id, cp.porcentaje_descuento,
           p.id AS preso_id, pg.grado_id, g.descuento AS descuento_grado
    FROM ordenes o
    LEFT JOIN codigos_promocionales cp ON o.codigo_descuento_id = cp.id
    LEFT JOIN presos p ON o.preso_id = p.id
    LEFT JOIN preso_grado pg ON p.id = pg.preso_id
    LEFT JOIN grados g ON pg.grado_id = g.id
    WHERE o.orden_id = $1
  `;
  
  const descuentoResult = await pool.query(getDescuentoQuery, [orden_id]);
  
  // Obtener información de descuento de cupón y grado
  let porcentaje_descuento_codigo = 0;
  let porcentaje_descuento_grado = 0;
  
  if (descuentoResult.rows[0]) {
    if (descuentoResult.rows[0].porcentaje_descuento) {
      porcentaje_descuento_codigo = parseFloat(descuentoResult.rows[0].porcentaje_descuento);
    }
    
    if (descuentoResult.rows[0].descuento_grado) {
      porcentaje_descuento_grado = parseFloat(descuentoResult.rows[0].descuento_grado);
    }
  }
  
  // Calcular el descuento total (acumulativo)
  const porcentaje_descuento_total = porcentaje_descuento_codigo + porcentaje_descuento_grado;
  const factor_descuento = (100 - porcentaje_descuento_total) / 100;
  
  // Actualizar los totales de la orden
  const updateTotalesQuery = `
    WITH totales AS (
      SELECT 
        SUM(ABS(precio_unitario) * cantidad) AS total_bruto
      FROM detalles_orden 
      WHERE orden_id = $1
    )
    UPDATE ordenes 
    SET 
      total_bruto = totales.total_bruto,
      total = ROUND(totales.total_bruto * $2, 2)
    FROM totales
    WHERE orden_id = $1
    RETURNING *
  `;
  
  await pool.query(updateTotalesQuery, [orden_id, factor_descuento]);
};

/**
 * Obtiene una orden con su información de descuentos
 */
export const getOrdenConDescuento = async (orden_id) => {
  const query = `
    SELECT 
      o.*,
      cp.codigo AS codigo_promocional,
      cp.porcentaje_descuento,
      g.descuento AS descuento_grado,
      g.nombre AS nombre_grado
    FROM ordenes o
    LEFT JOIN codigos_promocionales cp ON o.codigo_descuento_id = cp.id
    LEFT JOIN presos p ON o.preso_id = p.id
    LEFT JOIN preso_grado pg ON p.id = pg.preso_id
    LEFT JOIN grados g ON pg.grado_id = g.id
    WHERE o.orden_id = $1
  `;
  
  const result = await pool.query(query, [orden_id]);
  return result.rows[0];
}; 