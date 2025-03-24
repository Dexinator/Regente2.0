import pool from "../config/db.js";

export const getAllProducts = async () => {
  const result = await pool.query("SELECT * FROM productos ORDER BY id DESC");
  return result.rows;
};

export const getProductById = async (id) => {
  const result = await pool.query("SELECT * FROM productos WHERE id = $1", [id]);
  return result.rows[0];
};

export const createProduct = async ({ nombre, precio, categoria }) => {
  const result = await pool.query(
    `INSERT INTO productos (nombre, precio, categoria)
     VALUES ($1, $2, $3) RETURNING *`,
    [nombre, precio, categoria]
  );
  return result.rows[0];
};

export const updateProduct = async (id, { nombre, precio, categoria }) => {
  const result = await pool.query(
    `UPDATE productos SET nombre = $1, precio = $2, categoria = $3
     WHERE id = $4 RETURNING *`,
    [nombre, precio, categoria, id]
  );
  return result.rows[0];
};

export const deleteProduct = async (id) => {
  const result = await pool.query("DELETE FROM productos WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};
