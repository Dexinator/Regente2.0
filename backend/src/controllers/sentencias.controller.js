import pool from "../config/db.js";

/**
 * Obtiene todas las sentencias activas
 */
export const fetchSentencias = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM sentencias WHERE activa = true ORDER BY nombre"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching sentencias:", error);
    res.status(500).json({ error: "Error al obtener sentencias" });
  }
};

/**
 * Obtiene una sentencia por su ID
 */
export const fetchSentenciaById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      "SELECT * FROM sentencias WHERE id = $1",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sentencia no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching sentencia:", error);
    res.status(500).json({ error: "Error al obtener la sentencia" });
  }
};

/**
 * Obtiene los productos de una sentencia
 */
export const fetchProductosSentencia = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar si la sentencia existe
    const sentenciaResult = await pool.query(
      "SELECT * FROM sentencias WHERE id = $1",
      [id]
    );
    
    if (sentenciaResult.rows.length === 0) {
      return res.status(404).json({ error: "Sentencia no encontrada" });
    }

    // Obtener productos de la sentencia
    const query = `
      SELECT 
        ps.*, 
        p.nombre AS producto_nombre, 
        p.categoria AS producto_categoria,
        p.precio AS producto_precio_original,
        s1.nombre AS sabor_nombre,
        s2.nombre AS tamano_nombre,
        s3.nombre AS ingrediente_nombre
      FROM 
        productos_sentencias ps
      JOIN 
        productos p ON ps.producto_id = p.id
      LEFT JOIN 
        sabores s1 ON ps.sabor_id = s1.id
      LEFT JOIN 
        sabores s2 ON ps.tamano_id = s2.id
      LEFT JOIN 
        sabores s3 ON ps.ingrediente_id = s3.id
      WHERE 
        ps.sentencia_id = $1
      ORDER BY
        ps.es_opcional, ps.grupo_opcion NULLS FIRST
    `;
    
    const productosResult = await pool.query(query, [id]);
    
    // Agrupar productos opcionales por grupo
    const productos = productosResult.rows;
    const sentencia = sentenciaResult.rows[0];
    
    // Organizar productos en fijos y opcionales
    const fijos = productos.filter(p => !p.es_opcional);
    
    // Agrupar opcionales por grupo_opcion
    const opcionales = {};
    productos
      .filter(p => p.es_opcional)
      .forEach(p => {
        if (!opcionales[p.grupo_opcion]) {
          opcionales[p.grupo_opcion] = [];
        }
        opcionales[p.grupo_opcion].push(p);
      });
    
    res.json({
      sentencia,
      productos: {
        fijos,
        opcionales: Object.values(opcionales)
      }
    });
  } catch (error) {
    console.error("Error fetching productos sentencia:", error);
    res.status(500).json({ error: "Error al obtener los productos de la sentencia" });
  }
};

/**
 * Crea una nueva sentencia
 */
export const addSentencia = async (req, res) => {
  const { nombre, descripcion, precio, productos } = req.body;
  
  if (!nombre || !precio || !productos || !Array.isArray(productos)) {
    return res.status(400).json({ error: "Datos incompletos o inválidos" });
  }
  
  // Iniciar transacción
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insertar sentencia
    const sentenciaResult = await client.query(
      "INSERT INTO sentencias (nombre, descripcion, precio) VALUES ($1, $2, $3) RETURNING id",
      [nombre, descripcion, precio]
    );
    
    const sentenciaId = sentenciaResult.rows[0].id;
    
    // Insertar productos
    for (const producto of productos) {
      await client.query(
        `INSERT INTO productos_sentencias 
         (sentencia_id, producto_id, cantidad, sabor_id, tamano_id, ingrediente_id, es_opcional, grupo_opcion, precio_unitario) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          sentenciaId,
          producto.producto_id,
          producto.cantidad || 1,
          producto.sabor_id || null,
          producto.tamano_id || null,
          producto.ingrediente_id || null,
          producto.es_opcional || false,
          producto.grupo_opcion || null,
          producto.precio_unitario || 0
        ]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      id: sentenciaId,
      message: "Sentencia creada correctamente" 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error creating sentencia:", error);
    res.status(500).json({ error: "Error al crear la sentencia" });
  } finally {
    client.release();
  }
};

/**
 * Actualiza una sentencia existente
 */
export const updateSentencia = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, activa, productos } = req.body;
  
  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: "Datos incompletos" });
  }
  
  // Iniciar transacción
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Actualizar sentencia
    const sentenciaResult = await client.query(
      "UPDATE sentencias SET nombre = $1, descripcion = $2, precio = $3, activa = $4 WHERE id = $5 RETURNING *",
      [nombre, descripcion, precio, activa !== undefined ? activa : true, id]
    );
    
    if (sentenciaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Sentencia no encontrada" });
    }
    
    // Si se proporcionaron productos, actualizar la relación
    if (productos && Array.isArray(productos)) {
      // Eliminar productos actuales
      await client.query(
        "DELETE FROM productos_sentencias WHERE sentencia_id = $1",
        [id]
      );
      
      // Insertar nuevos productos
      for (const producto of productos) {
        await client.query(
          `INSERT INTO productos_sentencias 
           (sentencia_id, producto_id, cantidad, sabor_id, tamano_id, ingrediente_id, es_opcional, grupo_opcion, precio_unitario) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id,
            producto.producto_id,
            producto.cantidad || 1,
            producto.sabor_id || null,
            producto.tamano_id || null,
            producto.ingrediente_id || null,
            producto.es_opcional || false,
            producto.grupo_opcion || null,
            producto.precio_unitario || 0
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({ 
      sentencia: sentenciaResult.rows[0],
      message: "Sentencia actualizada correctamente" 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error updating sentencia:", error);
    res.status(500).json({ error: "Error al actualizar la sentencia" });
  } finally {
    client.release();
  }
};

/**
 * Elimina una sentencia (desactivación lógica)
 */
export const deleteSentencia = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Desactivar en lugar de eliminar físicamente
    const result = await pool.query(
      "UPDATE sentencias SET activa = false WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sentencia no encontrada" });
    }
    
    res.json({ 
      message: "Sentencia desactivada correctamente",
      sentencia: result.rows[0]
    });
  } catch (error) {
    console.error("Error deleting sentencia:", error);
    res.status(500).json({ error: "Error al desactivar la sentencia" });
  }
}; 