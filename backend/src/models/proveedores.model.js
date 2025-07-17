import pool from "../config/db.js";

/**
 * Obtiene todos los proveedores activos
 */
export const getAllProveedores = async () => {
  const query = 'SELECT * FROM proveedores WHERE activo = true ORDER BY nombre';
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Obtiene un proveedor por ID
 */
export const getProveedorById = async (id) => {
  const query = 'SELECT * FROM proveedores WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

/**
 * Crea un nuevo proveedor
 */
export const createProveedor = async (data) => {
  const { nombre, rfc, direccion, telefono, email, contacto_nombre, dias_compra } = data;
  
  // Verificar si ya existe un proveedor con el mismo RFC (solo si se proporciona RFC)
  if (rfc) {
    const existingRFC = await pool.query(
      'SELECT id FROM proveedores WHERE rfc = $1',
      [rfc]
    );

    if (existingRFC.rows.length > 0) {
      throw new Error('Ya existe un proveedor con este RFC');
    }
  }

  const query = `
    INSERT INTO proveedores 
    (nombre, rfc, direccion, telefono, email, contacto_nombre, dias_compra) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING *
  `;
  
  const values = [nombre, rfc, direccion, telefono, email, contacto_nombre, JSON.stringify(dias_compra || [])];
  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Actualiza un proveedor existente
 */
export const updateProveedor = async (id, data) => {
  const { nombre, rfc, direccion, telefono, email, contacto_nombre, activo, dias_compra } = data;
  
  // Verificar si ya existe otro proveedor con el mismo RFC (solo si se proporciona RFC)
  if (rfc) {
    const existingRFC = await pool.query(
      'SELECT id FROM proveedores WHERE rfc = $1 AND id != $2',
      [rfc, id]
    );

    if (existingRFC.rows.length > 0) {
      throw new Error('Ya existe otro proveedor con este RFC');
    }
  }

  const query = `
    UPDATE proveedores 
    SET nombre = $1, rfc = $2, direccion = $3, 
        telefono = $4, email = $5, contacto_nombre = $6, activo = $7, dias_compra = $8
    WHERE id = $9 
    RETURNING *
  `;
  
  const values = [nombre, rfc, direccion, telefono, email, contacto_nombre, activo, JSON.stringify(dias_compra), id];
  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

/**
 * Elimina un proveedor (desactivación lógica o eliminación física)
 */
export const deleteProveedor = async (id) => {
  // Verificar si el proveedor está siendo utilizado en compras
  const comprasRelacionadas = await pool.query(
    'SELECT COUNT(*) FROM compras WHERE proveedor_id = $1',
    [id]
  );

  if (parseInt(comprasRelacionadas.rows[0].count) > 0) {
    // Si hay compras relacionadas, solo desactivar
    const query = 'UPDATE proveedores SET activo = false WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return { desactivado: true, proveedor: result.rows[0] || null };
  }

  // Si no hay compras relacionadas, eliminar físicamente
  const query = 'DELETE FROM proveedores WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [id]);
  return { desactivado: false, proveedor: result.rows[0] || null };
};

/**
 * Obtiene los insumos asociados a un proveedor
 */
export const getInsumosByProveedor = async (id) => {
  const query = `
    SELECT i.*, ip.precio_referencia 
    FROM insumos i
    JOIN insumo_proveedor ip ON i.id = ip.insumo_id
    WHERE ip.proveedor_id = $1 AND i.activo = true
    ORDER BY i.nombre
  `;
  
  const result = await pool.query(query, [id]);
  return result.rows;
};

/**
 * Obtiene proveedores que compran en un día específico
 */
export const getProveedoresPorDia = async (dia) => {
  const query = `
    SELECT * FROM proveedores 
    WHERE activo = true 
    AND dias_compra::jsonb ? $1
    ORDER BY nombre
  `;
  const result = await pool.query(query, [dia]);
  return result.rows;
};

/**
 * Obtiene la lista de días de compra disponibles
 */
export const getDiasCompraDisponibles = () => {
  return [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];
}; 