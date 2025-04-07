import pool from "../config/db.js";

export const getAllProducts = async () => {
  const result = await pool.query("SELECT * FROM productos ORDER BY categoria, nombre");
  return result.rows;
};

export const getProductById = async (id) => {
  const result = await pool.query("SELECT * FROM productos WHERE id = $1", [id]);
  return result.rows[0];
};

export const createProduct = async (product) => {
  const { nombre, precio, categoria, costo = 0 } = product;
  const result = await pool.query(
    "INSERT INTO productos (nombre, precio, categoria, costo) VALUES ($1, $2, $3, $4) RETURNING *",
    [nombre, precio, categoria, costo]
  );
  return result.rows[0];
};

export const updateProduct = async (id, product) => {
  const { nombre, precio, categoria, costo } = product;
  const result = await pool.query(
    "UPDATE productos SET nombre = $1, precio = $2, categoria = $3, costo = $4 WHERE id = $5 RETURNING *",
    [nombre, precio, categoria, costo, id]
  );
  return result.rows[0];
};

export const deleteProduct = async (id) => {
  const result = await pool.query("DELETE FROM productos WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

// Funciones para variantes (anteriormente sabores)
export const getVariantesByProductoId = async (producto_id, tipo) => {
  // Primero verificamos la categoría del producto
  const productoCatQuery = await pool.query(`
    SELECT categoria
    FROM productos
    WHERE id = $1
  `, [producto_id]);
  
  const categoriaProducto = productoCatQuery.rows[0]?.categoria;
  console.log(`Producto ID: ${producto_id}, Categoría: ${categoriaProducto}, Tipo solicitado: ${tipo}`);
  
  // Construimos la consulta base
  let query = `
    SELECT v.id, v.nombre, v.descripcion, v.disponible, 
           v.precio_adicional,
           cv.nombre as categoria_nombre, cv.tipo as categoria_tipo
    FROM variantes v
    JOIN producto_variante pv ON v.id = pv.variante_id
    JOIN categorias_variantes cv ON v.categoria_id = cv.id
    WHERE pv.producto_id = $1 AND v.disponible = true
  `;
  
  // Aplicamos filtro según el tipo solicitado y categoría del producto
  if (categoriaProducto === 'Cenas' || categoriaProducto === 'Cena') {
    if (tipo === 'sabor') {
      // Para cenas, cuando pedimos "sabor", mostramos los sabores base (no ingredientes extra)
      query += " AND cv.tipo = 'sabor_comida'";
    } else if (tipo === 'ingredientes') {
      // Para cenas, cuando pedimos "ingredientes", mostramos solo ingredientes extra
      query += " AND cv.tipo = 'ingrediente_extra'";
    }
  } else if (categoriaProducto === 'Pulque' || categoriaProducto === 'Pulques') {
    // Para pulque, el comportamiento para sabores
    if (tipo === 'sabor') {
      query += " AND cv.tipo = 'pulque_sabor'";
    } else if (tipo === 'tamano') {
      query += " AND cv.tipo = 'tamaño'";
    }
  } else {
    // Para otros productos, verificamos si tienen variantes de sabor genéricas
    if (tipo === 'sabor') {
      // Buscamos cualquier tipo de sabor (genérico, o específico según categoría)
      query += " AND (cv.tipo LIKE '%sabor%')";
    } else if (tipo) {
      // Para otros tipos específicos
      query += ` AND cv.tipo = '${tipo}'`;
    }
  }
  
  query += " ORDER BY cv.nombre, v.nombre";
  
  console.log("Query final:", query);
  const result = await pool.query(query, [producto_id]);
  console.log(`Encontrados ${result.rows.length} resultados`);
  return result.rows;
};

export const getVariantesByCategoria = async (categoria_producto) => {
  const result = await pool.query(`
    SELECT v.id, v.nombre, v.descripcion, v.disponible, v.precio_adicional,
           cv.nombre as categoria_nombre, cv.id as categoria_id
    FROM variantes v
    JOIN categorias_variantes cv ON v.categoria_id = cv.id
    JOIN categoria_producto_tipo_variante cptv ON cv.tipo = cptv.tipo_variante
    WHERE cptv.categoria_producto = $1 AND v.disponible = true
    ORDER BY cv.nombre, v.nombre
  `, [categoria_producto]);
  
  return result.rows;
};

export const getAllCategoriaVariantes = async () => {
  const result = await pool.query(`
    SELECT cv.id, cv.nombre, cv.tipo, COUNT(v.id) as total_variantes
    FROM categorias_variantes cv
    LEFT JOIN variantes v ON cv.id = v.categoria_id
    GROUP BY cv.id, cv.nombre, cv.tipo
    ORDER BY cv.nombre
  `);
  
  return result.rows;
};

export const getAllVariantes = async () => {
  const result = await pool.query(`
    SELECT v.*, cv.nombre as categoria_nombre
    FROM variantes v
    JOIN categorias_variantes cv ON v.categoria_id = cv.id
    ORDER BY cv.nombre, v.nombre
  `);
  
  return result.rows;
};

export const getVarianteById = async (id) => {
  const result = await pool.query(`
    SELECT v.*, cv.nombre as categoria_nombre
    FROM variantes v
    JOIN categorias_variantes cv ON v.categoria_id = cv.id
    WHERE v.id = $1
  `, [id]);
  
  return result.rows[0];
};
