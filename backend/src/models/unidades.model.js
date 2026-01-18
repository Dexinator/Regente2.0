import pool from "../config/db.js";

/**
 * Obtiene todas las unidades de medida activas
 */
export const getAllUnidades = async () => {
  const query = `
    SELECT id, nombre, abreviatura, categoria
    FROM unidades_medida
    WHERE activo = true
    ORDER BY categoria, nombre
  `;
  const result = await pool.query(query);
  return result.rows;
};

/**
 * Obtiene una unidad por ID
 */
export const getUnidadById = async (id) => {
  const query = 'SELECT * FROM unidades_medida WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

/**
 * Crea una nueva unidad de medida
 */
export const createUnidad = async (data) => {
  const { nombre, abreviatura, categoria } = data;

  const query = `
    INSERT INTO unidades_medida (nombre, abreviatura, categoria)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const result = await pool.query(query, [nombre, abreviatura, categoria]);
  return result.rows[0];
};

/**
 * Actualiza una unidad de medida
 */
export const updateUnidad = async (id, data) => {
  const { nombre, abreviatura, categoria, activo } = data;

  const query = `
    UPDATE unidades_medida
    SET nombre = $1, abreviatura = $2, categoria = $3, activo = $4
    WHERE id = $5
    RETURNING *
  `;

  const result = await pool.query(query, [nombre, abreviatura, categoria, activo, id]);
  return result.rows[0] || null;
};

/**
 * Elimina una unidad de medida (desactivación lógica)
 */
export const deleteUnidad = async (id) => {
  const query = 'UPDATE unidades_medida SET activo = false WHERE id = $1 RETURNING *';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};
