import pool from "../config/db.js";

// Funciones para variantes (sabores)
export const getAllVariantes = async () => {
  const result = await pool.query(`
    SELECT s.*, cv.nombre as categoria_nombre, cv.tipo as categoria_tipo
    FROM sabores s
    JOIN categorias_variantes cv ON s.categoria_id = cv.id
    ORDER BY cv.nombre, s.nombre
  `);
  return result.rows;
};

export const getVarianteById = async (id) => {
  const result = await pool.query(`
    SELECT s.*, cv.nombre as categoria_nombre, cv.tipo as categoria_tipo
    FROM sabores s
    JOIN categorias_variantes cv ON s.categoria_id = cv.id
    WHERE s.id = $1
  `, [id]);
  return result.rows[0];
};

export const createVariante = async ({ nombre, descripcion, categoria_id, precio_adicional, disponible }) => {
  const result = await pool.query(
    `INSERT INTO sabores (nombre, descripcion, categoria_id, precio_adicional, disponible)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nombre, descripcion, categoria_id, precio_adicional || 0, disponible !== false]
  );
  
  // Obtener la variante con su categoría
  const varianteCompleta = await getVarianteById(result.rows[0].id);
  return varianteCompleta;
};

export const updateVariante = async (id, { nombre, descripcion, categoria_id, precio_adicional, disponible }) => {
  const result = await pool.query(
    `UPDATE sabores 
     SET nombre = $1, descripcion = $2, categoria_id = $3, precio_adicional = $4, disponible = $5
     WHERE id = $6 RETURNING *`,
    [nombre, descripcion, categoria_id, precio_adicional || 0, disponible, id]
  );
  
  if (result.rows.length === 0) return null;
  
  // Obtener la variante con su categoría
  const varianteCompleta = await getVarianteById(result.rows[0].id);
  return varianteCompleta;
};

export const deleteVariante = async (id) => {
  // Primero eliminar las relaciones con productos
  await pool.query("DELETE FROM producto_sabor WHERE sabor_id = $1", [id]);
  
  // Luego eliminar la variante
  const result = await pool.query("DELETE FROM sabores WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

// Funciones para categorías de variantes
export const getAllCategoriasVariantes = async () => {
  const result = await pool.query(`
    SELECT cv.*, COUNT(s.id) as total_sabores
    FROM categorias_variantes cv
    LEFT JOIN sabores s ON cv.id = s.categoria_id
    GROUP BY cv.id
    ORDER BY cv.nombre
  `);
  return result.rows;
};

export const getCategoriaVarianteById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM categorias_variantes WHERE id = $1",
    [id]
  );
  return result.rows[0];
};

export const createCategoriaVariante = async ({ nombre, tipo }) => {
  const result = await pool.query(
    `INSERT INTO categorias_variantes (nombre, tipo)
     VALUES ($1, $2) RETURNING *`,
    [nombre, tipo]
  );
  return result.rows[0];
};

export const updateCategoriaVariante = async (id, { nombre }) => {
  // No permitimos cambiar el tipo una vez creado
  const result = await pool.query(
    `UPDATE categorias_variantes 
     SET nombre = $1
     WHERE id = $2 RETURNING *`,
    [nombre, id]
  );
  return result.rows[0];
};

export const deleteCategoriaVariante = async (id) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Primero eliminar todas las relaciones producto_sabor de las variantes de esta categoría
    await client.query(`
      DELETE FROM producto_sabor 
      WHERE sabor_id IN (SELECT id FROM sabores WHERE categoria_id = $1)
    `, [id]);
    
    // Luego eliminar todas las variantes de esta categoría
    await client.query("DELETE FROM sabores WHERE categoria_id = $1", [id]);
    
    // Finalmente eliminar la categoría
    const result = await client.query(
      "DELETE FROM categorias_variantes WHERE id = $1 RETURNING *",
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