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

// Nuevas funciones para sabores

export const getSaboresByProductoId = async (producto_id, tipo) => {
  let query = `
    SELECT s.id, s.nombre, s.descripcion, s.disponible, 
           s.precio_adicional,
           cv.nombre as categoria_nombre, cv.tipo as categoria_tipo
    FROM sabores s
    JOIN producto_sabor ps ON s.id = ps.sabor_id
    JOIN categorias_variantes cv ON s.categoria_id = cv.id
    WHERE ps.producto_id = $1 AND s.disponible = true
  `;
  
  // Usar los valores exactos de la base de datos
  if (tipo === 'sabor') {
    query += " AND (cv.tipo = 'pulque_sabor' OR cv.tipo = 'ingredientes')";
  } else if (tipo === 'tamano') {
    query += " AND cv.tipo = 'tamaño'";
  }
  
  query += " ORDER BY cv.nombre, s.nombre";
  
  const result = await pool.query(query, [producto_id]);
  return result.rows;
};

export const getSaboresByCategoria = async (categoria_producto) => {
  const result = await pool.query(`
    SELECT s.id, s.nombre, s.descripcion, s.disponible, s.precio_adicional,
           cv.nombre as categoria_nombre, cv.id as categoria_id
    FROM sabores s
    JOIN categorias_variantes cv ON s.categoria_id = cv.id
    JOIN categoria_producto_tipo_variante cptv ON cv.tipo = cptv.tipo_variante
    WHERE cptv.categoria_producto = $1 AND s.disponible = true
    ORDER BY cv.nombre, s.nombre
  `, [categoria_producto]);
  
  return result.rows;
};

export const getAllCategoriaVariantes = async () => {
  const result = await pool.query(`
    SELECT cv.id, cv.nombre, cv.tipo, COUNT(s.id) as total_sabores
    FROM categorias_variantes cv
    LEFT JOIN sabores s ON cv.id = s.categoria_id
    GROUP BY cv.id, cv.nombre, cv.tipo
    ORDER BY cv.nombre
  `);
  
  return result.rows;
};

export const getAllSabores = async () => {
  const result = await pool.query(`
    SELECT s.*, cv.nombre as categoria_nombre
    FROM sabores s
    JOIN categorias_variantes cv ON s.categoria_id = cv.id
    ORDER BY cv.nombre, s.nombre
  `);
  
  return result.rows;
};

export const getSaborById = async (id) => {
  const result = await pool.query(`
    SELECT s.*, cv.nombre as categoria_nombre
    FROM sabores s
    JOIN categorias_variantes cv ON s.categoria_id = cv.id
    WHERE s.id = $1
  `, [id]);
  
  return result.rows[0];
};
