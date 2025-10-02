/**
 * Modelo para gestión de recetas
 */

import pool from "../config/db.js";

/**
 * Obtiene todas las recetas
 */
export const getAllRecetas = async (filters = {}) => {
  try {
    let query = `
      SELECT
        r.*,
        p.nombre as producto_nombre,
        p.categoria,
        COUNT(ri.id) as num_ingredientes
      FROM recetas r
      JOIN productos p ON r.producto_id = p.id
      LEFT JOIN receta_ingredientes ri ON r.id = ri.receta_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.activa !== undefined) {
      query += ` AND r.activa = $${paramCount}`;
      params.push(filters.activa);
      paramCount++;
    }

    if (filters.categoria) {
      query += ` AND p.categoria = $${paramCount}`;
      params.push(filters.categoria);
      paramCount++;
    }

    query += ` GROUP BY r.id, p.nombre, p.categoria ORDER BY p.nombre`;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    throw error;
  }
};

/**
 * Obtiene una receta por ID con sus ingredientes
 */
export const getRecetaById = async (id) => {
  try {
    // Obtener receta
    const recetaQuery = `
      SELECT
        r.*,
        p.nombre as producto_nombre,
        p.categoria
      FROM recetas r
      JOIN productos p ON r.producto_id = p.id
      WHERE r.id = $1
    `;
    const recetaResult = await pool.query(recetaQuery, [id]);

    if (recetaResult.rows.length === 0) {
      return null;
    }

    const receta = recetaResult.rows[0];

    // Obtener ingredientes
    const ingredientesQuery = `
      SELECT
        ri.*,
        i.nombre as insumo_nombre,
        i.marca,
        i.categoria as insumo_categoria,
        i.unidad_medida_default
      FROM receta_ingredientes ri
      JOIN insumos i ON ri.insumo_id = i.id
      WHERE ri.receta_id = $1
      ORDER BY i.nombre
    `;
    const ingredientesResult = await pool.query(ingredientesQuery, [id]);

    receta.ingredientes = ingredientesResult.rows;
    return receta;
  } catch (error) {
    console.error('Error al obtener receta:', error);
    throw error;
  }
};

/**
 * Obtiene la receta de un producto
 */
export const getRecetaByProductoId = async (productoId) => {
  try {
    const query = `
      SELECT
        r.*,
        p.nombre as producto_nombre
      FROM recetas r
      JOIN productos p ON r.producto_id = p.id
      WHERE r.producto_id = $1 AND r.activa = true
    `;
    const result = await pool.query(query, [productoId]);

    if (result.rows.length === 0) {
      return null;
    }

    const receta = result.rows[0];

    // Obtener ingredientes
    const ingredientesQuery = `
      SELECT
        ri.*,
        i.nombre as insumo_nombre,
        i.marca,
        i.categoria as insumo_categoria
      FROM receta_ingredientes ri
      JOIN insumos i ON ri.insumo_id = i.id
      WHERE ri.receta_id = $1
      ORDER BY i.nombre
    `;
    const ingredientesResult = await pool.query(ingredientesQuery, [receta.id]);

    receta.ingredientes = ingredientesResult.rows;
    return receta;
  } catch (error) {
    console.error('Error al obtener receta por producto:', error);
    throw error;
  }
};

/**
 * Crea una nueva receta
 */
export const createReceta = async (data) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Desactivar recetas anteriores del mismo producto
    await client.query(
      'UPDATE recetas SET activa = false WHERE producto_id = $1',
      [data.producto_id]
    );

    // Crear receta
    const recetaQuery = `
      INSERT INTO recetas (
        producto_id, nombre_receta, descripcion,
        rendimiento, activa
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const recetaResult = await client.query(recetaQuery, [
      data.producto_id,
      data.nombre_receta,
      data.descripcion,
      data.rendimiento || 1,
      true
    ]);

    const receta = recetaResult.rows[0];

    // Agregar ingredientes
    if (data.ingredientes && data.ingredientes.length > 0) {
      for (const ingrediente of data.ingredientes) {
        const ingredienteQuery = `
          INSERT INTO receta_ingredientes (
            receta_id, insumo_id, cantidad, unidad, notas
          ) VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(ingredienteQuery, [
          receta.id,
          ingrediente.insumo_id,
          ingrediente.cantidad,
          ingrediente.unidad,
          ingrediente.notas
        ]);
      }
    }

    await client.query('COMMIT');
    return await getRecetaById(receta.id);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear receta:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Actualiza una receta
 */
export const updateReceta = async (id, data) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar que existe
    const checkQuery = 'SELECT id FROM recetas WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      throw new Error('Receta no encontrada');
    }

    // Actualizar receta
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (data.nombre_receta !== undefined) {
      updateFields.push(`nombre_receta = $${paramCount}`);
      updateValues.push(data.nombre_receta);
      paramCount++;
    }

    if (data.descripcion !== undefined) {
      updateFields.push(`descripcion = $${paramCount}`);
      updateValues.push(data.descripcion);
      paramCount++;
    }

    if (data.rendimiento !== undefined) {
      updateFields.push(`rendimiento = $${paramCount}`);
      updateValues.push(data.rendimiento);
      paramCount++;
    }

    if (data.activa !== undefined) {
      updateFields.push(`activa = $${paramCount}`);
      updateValues.push(data.activa);
      paramCount++;
    }

    updateFields.push('fecha_actualizacion = CURRENT_TIMESTAMP');

    if (updateFields.length > 1) {
      updateValues.push(id);
      const updateQuery = `
        UPDATE recetas
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      await client.query(updateQuery, updateValues);
    }

    // Actualizar ingredientes si se proporcionan
    if (data.ingredientes !== undefined) {
      // Eliminar ingredientes actuales
      await client.query('DELETE FROM receta_ingredientes WHERE receta_id = $1', [id]);

      // Agregar nuevos ingredientes
      for (const ingrediente of data.ingredientes) {
        const ingredienteQuery = `
          INSERT INTO receta_ingredientes (
            receta_id, insumo_id, cantidad, unidad, notas
          ) VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(ingredienteQuery, [
          id,
          ingrediente.insumo_id,
          ingrediente.cantidad,
          ingrediente.unidad,
          ingrediente.notas
        ]);
      }
    }

    await client.query('COMMIT');
    return await getRecetaById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar receta:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Elimina una receta
 */
export const deleteReceta = async (id) => {
  try {
    const query = 'DELETE FROM recetas WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error('Receta no encontrada');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error al eliminar receta:', error);
    throw error;
  }
};

/**
 * Calcula el costo de una receta
 */
export const calcularCostoReceta = async (recetaId) => {
  try {
    const query = `
      SELECT
        ri.insumo_id,
        ri.cantidad,
        ri.unidad,
        i.nombre as insumo_nombre,
        COALESCE(
          (
            SELECT AVG(precio_unitario)
            FROM (
              SELECT ic.precio_unitario
              FROM items_compra ic
              WHERE ic.insumo_id = ri.insumo_id
              ORDER BY ic.id DESC
              LIMIT 3
            ) ultimas_compras
          ), 0
        ) as precio_promedio
      FROM receta_ingredientes ri
      JOIN insumos i ON ri.insumo_id = i.id
      WHERE ri.receta_id = $1
    `;
    const result = await pool.query(query, [recetaId]);

    const costoTotal = result.rows.reduce((sum, item) => {
      return sum + (item.cantidad * item.precio_promedio);
    }, 0);

    return {
      costo_total: costoTotal,
      detalles: result.rows
    };
  } catch (error) {
    console.error('Error al calcular costo de receta:', error);
    throw error;
  }
};

/**
 * Verifica disponibilidad de ingredientes para una receta
 */
export const verificarDisponibilidadReceta = async (recetaId, cantidad = 1) => {
  try {
    const query = `
      SELECT
        ri.insumo_id,
        i.nombre as insumo_nombre,
        ri.cantidad * $2 as cantidad_necesaria,
        ri.unidad,
        COALESCE(inv.cantidad_actual, 0) as cantidad_disponible,
        CASE
          WHEN COALESCE(inv.cantidad_actual, 0) >= ri.cantidad * $2 THEN true
          ELSE false
        END as disponible
      FROM receta_ingredientes ri
      JOIN insumos i ON ri.insumo_id = i.id
      LEFT JOIN inventario inv ON ri.insumo_id = inv.insumo_id
        AND ri.unidad = inv.unidad
      WHERE ri.receta_id = $1
    `;
    const result = await pool.query(query, [recetaId, cantidad]);

    const todoDisponible = result.rows.every(item => item.disponible);

    return {
      disponible: todoDisponible,
      ingredientes: result.rows
    };
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    throw error;
  }
};