import pool from "../config/db.js";

/**
 * Verifica si una unidad de medida existe en la tabla, si no existe la crea
 * @param {object} client - Cliente de conexión a la BD (para transacciones)
 * @param {string} nombreUnidad - Nombre de la unidad a verificar/crear
 * @returns {string} - El nombre de la unidad (normalizado si se creó)
 */
const asegurarUnidadExiste = async (client, nombreUnidad) => {
  if (!nombreUnidad || nombreUnidad.trim() === '') {
    return 'Unidad'; // Valor por defecto
  }

  const nombreNormalizado = nombreUnidad.trim();

  // Verificar si la unidad ya existe
  const existeQuery = 'SELECT id FROM unidades_medida WHERE nombre = $1';
  const existeResult = await client.query(existeQuery, [nombreNormalizado]);

  if (existeResult.rows.length === 0) {
    // La unidad no existe, crearla
    await client.query(
      'INSERT INTO unidades_medida (nombre, categoria) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING',
      [nombreNormalizado, 'Personalizada']
    );
  }

  return nombreNormalizado;
};

/**
 * Obtiene todos los insumos activos, opcionalmente filtrados por categoría
 */
export const getAllInsumos = async (categoria = null) => {
  let query = `
    SELECT i.*,
           COUNT(ip.proveedor_id) as num_proveedores
    FROM insumos i
    LEFT JOIN insumo_proveedor ip ON i.id = ip.insumo_id
    WHERE i.activo = true
  `;
  const params = [];

  // Filtrar por categoría si se proporciona
  if (categoria) {
    query += ' AND i.categoria = $1';
    params.push(categoria);
  }

  query += ' GROUP BY i.id ORDER BY i.nombre';

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Obtiene un insumo por ID con sus proveedores asociados
 */
export const getInsumoById = async (id) => {
  // Obtener el insumo
  const insumoQuery = 'SELECT * FROM insumos WHERE id = $1';
  const insumoResult = await pool.query(insumoQuery, [id]);
  
  if (insumoResult.rows.length === 0) {
    return null;
  }
  
  const insumo = insumoResult.rows[0];
  
  // Obtener los proveedores asociados
  const proveedoresQuery = `
    SELECT p.*, ip.precio_referencia 
    FROM proveedores p
    JOIN insumo_proveedor ip ON p.id = ip.proveedor_id
    WHERE ip.insumo_id = $1 AND p.activo = true
    ORDER BY p.nombre
  `;
  
  const proveedoresResult = await pool.query(proveedoresQuery, [id]);
  
  // Combinar resultados
  return {
    ...insumo,
    proveedores: proveedoresResult.rows
  };
};

/**
 * Crea un nuevo insumo con sus proveedores asociados
 */
export const createInsumo = async (data) => {
  const {
    nombre,
    descripcion,
    categoria,
    marca,
    unidad_medida_default,
    cantidad_por_unidad,
    proveedores
  } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar si ya existe un insumo con el mismo nombre
    const existingInsumo = await client.query(
      'SELECT id FROM insumos WHERE nombre = $1',
      [nombre]
    );

    if (existingInsumo.rows.length > 0) {
      throw new Error('Ya existe un insumo con este nombre');
    }

    // Asegurar que la unidad de medida existe (la crea si no existe)
    const unidadFinal = await asegurarUnidadExiste(client, unidad_medida_default);

    // Insertar el insumo
    const insumoQuery = `
      INSERT INTO insumos
      (nombre, descripcion, categoria, marca, unidad_medida_default, cantidad_por_unidad)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const insumoValues = [nombre, descripcion, categoria, marca, unidadFinal, cantidad_por_unidad || 1];
    const insumoResult = await client.query(insumoQuery, insumoValues);
    const insumoId = insumoResult.rows[0].id;
    
    // Si se proporcionaron proveedores, asociarlos al insumo
    if (proveedores && Array.isArray(proveedores) && proveedores.length > 0) {
      for (const proveedor of proveedores) {
        await client.query(
          `INSERT INTO insumo_proveedor 
           (insumo_id, proveedor_id, precio_referencia) 
           VALUES ($1, $2, $3)`,
          [insumoId, proveedor.id, proveedor.precio_referencia || null]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Obtener el insumo completo con sus proveedores
    return await getInsumoById(insumoId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Actualiza un insumo existente y sus proveedores asociados
 */
export const updateInsumo = async (id, data) => {
  const {
    nombre,
    descripcion,
    categoria,
    marca,
    unidad_medida_default,
    cantidad_por_unidad,
    proveedores,
    activo
  } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificar si ya existe otro insumo con el mismo nombre
    const existingInsumo = await client.query(
      'SELECT id FROM insumos WHERE nombre = $1 AND id != $2',
      [nombre, id]
    );

    if (existingInsumo.rows.length > 0) {
      throw new Error('Ya existe otro insumo con este nombre');
    }

    // Asegurar que la unidad de medida existe (la crea si no existe)
    const unidadFinal = await asegurarUnidadExiste(client, unidad_medida_default);

    // Actualizar el insumo
    const insumoQuery = `
      UPDATE insumos
      SET nombre = $1, descripcion = $2, categoria = $3,
          marca = $4, unidad_medida_default = $5, cantidad_por_unidad = $6, activo = $7
      WHERE id = $8
      RETURNING *
    `;

    const insumoValues = [nombre, descripcion, categoria, marca, unidadFinal, cantidad_por_unidad || 1, activo, id];
    const insumoResult = await client.query(insumoQuery, insumoValues);
    
    if (insumoResult.rows.length === 0) {
      throw new Error('Insumo no encontrado');
    }
    
    // Si se proporcionaron proveedores, actualizar las asociaciones
    if (proveedores && Array.isArray(proveedores)) {
      // Eliminar asociaciones actuales
      await client.query(
        'DELETE FROM insumo_proveedor WHERE insumo_id = $1',
        [id]
      );
      
      // Crear nuevas asociaciones
      for (const proveedor of proveedores) {
        await client.query(
          `INSERT INTO insumo_proveedor 
           (insumo_id, proveedor_id, precio_referencia) 
           VALUES ($1, $2, $3)`,
          [id, proveedor.id, proveedor.precio_referencia || null]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Obtener el insumo completo con sus proveedores
    return await getInsumoById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Elimina un insumo (desactivación lógica o eliminación física)
 */
export const deleteInsumo = async (id) => {
  // Verificar si el insumo está siendo utilizado en requisiciones o compras
  const itemsRequisicion = await pool.query(
    'SELECT COUNT(*) FROM items_requisicion WHERE insumo_id = $1',
    [id]
  );
  
  const itemsCompra = await pool.query(
    'SELECT COUNT(*) FROM items_compra WHERE insumo_id = $1',
    [id]
  );
  
  const tieneRelaciones = 
    parseInt(itemsRequisicion.rows[0].count) > 0 || 
    parseInt(itemsCompra.rows[0].count) > 0;
  
  if (tieneRelaciones) {
    // Si tiene relaciones, solo desactivar
    const query = 'UPDATE insumos SET activo = false WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return { desactivado: true, insumo: result.rows[0] || null };
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Si no tiene relaciones, eliminar físicamente
    // Primero eliminar relaciones con proveedores
    await client.query(
      'DELETE FROM insumo_proveedor WHERE insumo_id = $1',
      [id]
    );
    
    // Luego eliminar el insumo
    const query = 'DELETE FROM insumos WHERE id = $1 RETURNING *';
    const result = await client.query(query, [id]);
    
    await client.query('COMMIT');
    
    return { desactivado: false, insumo: result.rows[0] || null };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Obtiene las categorías únicas de insumos
 */
export const getCategoriasInsumos = async () => {
  const query = `
    SELECT DISTINCT categoria 
    FROM insumos 
    WHERE categoria IS NOT NULL AND activo = true
    ORDER BY categoria
  `;
  
  const result = await pool.query(query);
  return result.rows.map(row => row.categoria);
}; 