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
  // Primero, obtenemos la categoría del producto
  const productoCatQuery = await pool.query(`
    SELECT categoria
    FROM productos
    WHERE id = $1
  `, [producto_id]);
  
  const categoriaProducto = productoCatQuery.rows[0]?.categoria;
  console.log(`Producto ID: ${producto_id}, Categoría: ${categoriaProducto}, Tipo solicitado: ${tipo}`);
  
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
  
  // Aplicamos filtro según el tipo solicitado y categoría del producto
  if (categoriaProducto === 'Cenas' || categoriaProducto === 'Cena') {
    if (tipo === 'sabor') {
      // Para cenas, cuando pedimos "sabor", mostramos solo los sabores base (no ingredientes extra)
      query += " AND cv.tipo = 'sabor_comida'";
    } else if (tipo === 'ingredientes') {
      // Para cenas, cuando pedimos "ingredientes", mostramos solo ingredientes extra
      query += " AND cv.tipo = 'ingrediente_extra'";
    }
  } else if (categoriaProducto === 'Pulque') {
    // Para pulque, el comportamiento actual es correcto
    if (tipo === 'sabor') {
      query += " AND cv.tipo = 'pulque_sabor'";
    } else if (tipo === 'tamano') {
      query += " AND cv.tipo = 'tamaño'";
    }
  } else {
    // Para otros productos, filtramos según el tipo solicitado
    if (tipo) {
      query += ` AND cv.tipo = '${tipo}'`;
    }
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
