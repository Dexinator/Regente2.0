import pool from "../config/db.js";

export const getAllProducts = async () => {
  const result = await pool.query("SELECT * FROM productos ORDER BY id DESC");
  return result.rows;
};

export const getProductById = async (id) => {
  const result = await pool.query("SELECT * FROM productos WHERE id = $1", [id]);
  return result.rows[0];
};

export const createProduct = async ({ nombre, precio, categoria, costo }) => {
  const result = await pool.query(
    `INSERT INTO productos (nombre, precio, categoria, costo)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [nombre, precio, categoria, costo]
  );
  return result.rows[0];
};

export const updateProduct = async (id, { nombre, precio, categoria, costo }) => {
  const result = await pool.query(
    `UPDATE productos SET nombre = $1, precio = $2, categoria = $3, costo = $4
     WHERE id = $5 RETURNING *`,
    [nombre, precio, categoria, costo, id]
  );
  return result.rows[0];
};

export const deleteProduct = async (id) => {
  const result = await pool.query("DELETE FROM productos WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

// Nuevas funciones para sabores

export const getSaboresByProductoId = async (producto_id, tipo) => {

  // Construimos la consulta base
  let query = `
    SELECT s.id, s.nombre, s.descripcion, s.disponible, 
           s.precio_adicional,
           cv.nombre as categoria_nombre, cv.tipo as categoria_tipo
    FROM sabores s
    JOIN producto_sabor ps ON s.id = ps.sabor_id
    JOIN categorias_variantes cv ON s.categoria_id = cv.id
    WHERE ps.producto_id = $1 AND s.disponible = true
  `;
  
 
    if (tipo) {
      query += ` AND cv.tipo = '${tipo}'`;
    }
    else{
      return ["No llegó el parámetro tipo"];
    }
  
  query += " ORDER BY cv.nombre, s.nombre";
  
  console.log("Query final:", query);
  const result = await pool.query(query, [producto_id]);
  console.log(`Encontrados ${result.rows.length} resultados`);
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

// Funciones para manejar variantes de productos
export const getVariantesProducto = async (productoId) => {
  const result = await pool.query(`
    SELECT s.id, s.nombre, s.precio_adicional, cv.nombre as categoria_nombre
    FROM producto_sabor ps
    JOIN sabores s ON ps.sabor_id = s.id
    JOIN categorias_variantes cv ON s.categoria_id = cv.id
    WHERE ps.producto_id = $1
    ORDER BY cv.nombre, s.nombre
  `, [productoId]);
  
  return result.rows;
};

export const saveVariantesProducto = async (productoId, variantes) => {
  // Iniciar transacción
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Eliminar variantes existentes
    await client.query('DELETE FROM producto_sabor WHERE producto_id = $1', [productoId]);
    
    // Insertar nuevas variantes
    if (variantes && variantes.length > 0) {
      const values = variantes.map((varianteId, index) => 
        `($1, $${index + 2})`
      ).join(', ');
      
      const query = `INSERT INTO producto_sabor (producto_id, sabor_id) VALUES ${values}`;
      await client.query(query, [productoId, ...variantes]);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Función para obtener tipos de variantes por categoría de producto
export const getTiposVariantesPorCategoria = async () => {
  const result = await pool.query(`
    SELECT DISTINCT categoria_producto, tipo_variante
    FROM categoria_producto_tipo_variante
    ORDER BY categoria_producto, tipo_variante
  `);
  
  return result.rows;
};
