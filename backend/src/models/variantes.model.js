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
  // Si ya hay pedidos con esta variante, borrarla dejaría esos pedidos sin sabor (ON DELETE SET NULL):
  // se desactiva en su lugar para conservar el historial
  const uso = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM detalles_orden
       WHERE sabor_id = $1 OR tamano_id = $1 OR ingrediente_id = $1
     ) AS en_uso`,
    [id]
  );
  if (uso.rows[0].en_uso) {
    const result = await pool.query(
      "UPDATE sabores SET disponible = false WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0] && { ...result.rows[0], desactivada: true };
  }

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

// Rotación semanal de sabores de pulque.
// Un pulque rota si tiene sabores vinculados de su categoría "Sabores de pulque <nombre>".
// Natural (sin vínculos) y Cadena perpetua (sin categoría propia) quedan fuera.
// Los sabores que salen se desactivan, nunca se renombran: renombrar reescribe el historial de pedidos.

// Slots que se renombraban cada semana antes de este módulo: sus pedidos mezclan varios sabores,
// así que nunca se reactivan; si siguen activos, la siguiente rotación los reemplaza por un registro nuevo.
export const MARCA_HISTORICO = "[histórico]";

const normalizarNombre = (nombre) => String(nombre ?? "").trim().replace(/\s+/g, " ");
const claveNombre = (nombre) => normalizarNombre(nombre).toLocaleLowerCase("es");

const errorValidacion = (mensaje) => {
  const error = new Error(mensaje);
  error.status = 400;
  return error;
};

export const getPulquesRotacion = async (db = pool) => {
  const pulquesResult = await db.query(`
    SELECT p.id AS producto_id, TRIM(p.nombre) AS producto_nombre, cv.id AS categoria_id
    FROM productos p
    JOIN categorias_variantes cv ON cv.nombre = 'Sabores de pulque ' || TRIM(p.nombre)
    WHERE p.categoria = 'Pulque' AND p.activo = true
      AND EXISTS (
        SELECT 1 FROM producto_sabor ps
        JOIN sabores s ON s.id = ps.sabor_id
        WHERE ps.producto_id = p.id AND s.categoria_id = cv.id
      )
    ORDER BY p.precio, p.id
  `);
  const pulques = pulquesResult.rows;
  if (pulques.length === 0) return [];

  const productoIds = pulques.map(p => p.producto_id);
  const saboresResult = await db.query(`
    SELECT ps.producto_id, s.id, s.nombre, s.disponible, s.categoria_id,
           COALESCE(s.descripcion, '') LIKE $2 || '%' AS historico,
           COALESCE(u.vendidos, 0)::int AS vendidos,
           u.ultimo_uso
    FROM producto_sabor ps
    JOIN sabores s ON s.id = ps.sabor_id
    LEFT JOIN (
      SELECT d.sabor_id, SUM(d.cantidad) AS vendidos, TO_CHAR(MAX(o.fecha), 'YYYY-MM-DD') AS ultimo_uso
      FROM detalles_orden d
      JOIN ordenes o ON o.orden_id = d.orden_id
      WHERE d.sabor_id IN (SELECT sabor_id FROM producto_sabor WHERE producto_id = ANY($1))
      GROUP BY d.sabor_id
    ) u ON u.sabor_id = s.id
    WHERE ps.producto_id = ANY($1)
    ORDER BY u.ultimo_uso DESC NULLS LAST, s.id DESC
  `, [productoIds, MARCA_HISTORICO]);

  return pulques.map(pulque => {
    const sabores = saboresResult.rows.filter(
      s => s.producto_id === pulque.producto_id && s.categoria_id === pulque.categoria_id
    );
    return {
      ...pulque,
      activos: sabores.filter(s => s.disponible),
      anteriores: sabores.filter(s => !s.disponible && !s.historico)
    };
  });
};

// cambios: [{ producto_id, sabores: ["Guayaba", ...] }] con la lista final de sabores activos de cada pulque.
// Con simular = true sólo calcula el resumen, sin escribir nada.
export const aplicarRotacionPulques = async (cambios, { simular = false } = {}) => {
  if (!Array.isArray(cambios) || cambios.length === 0) {
    throw errorValidacion("No hay cambios que aplicar");
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const pulques = await getPulquesRotacion(client);
    const productosVistos = new Set();
    const resumen = [];

    for (const cambio of cambios) {
      const pulque = pulques.find(p => p.producto_id === Number(cambio.producto_id));
      if (!pulque) {
        throw errorValidacion(`El producto ${cambio.producto_id} no está en la rotación de pulques`);
      }
      if (productosVistos.has(pulque.producto_id)) {
        throw errorValidacion(`${pulque.producto_nombre} viene repetido en los cambios`);
      }
      productosVistos.add(pulque.producto_id);

      const deseados = [];
      for (const nombre of cambio.sabores || []) {
        const limpio = normalizarNombre(nombre);
        if (limpio && !deseados.some(d => claveNombre(d) === claveNombre(limpio))) {
          deseados.push(limpio);
        }
      }
      if (deseados.length === 0) {
        throw errorValidacion(`${pulque.producto_nombre} necesita al menos un sabor activo`);
      }
      if (deseados.some(nombre => nombre.length > 255)) {
        throw errorValidacion("El nombre del sabor es demasiado largo");
      }

      const resultado = {
        producto_id: pulque.producto_id,
        producto_nombre: pulque.producto_nombre,
        quedan: [],
        regresan: [],
        nuevos: [],
        salen: []
      };
      const conservados = new Set();

      for (const nombre of deseados) {
        const activo = pulque.activos.find(s => !s.historico && claveNombre(s.nombre) === claveNombre(nombre));
        if (activo) {
          conservados.add(activo.id);
          resultado.quedan.push({ id: activo.id, nombre: activo.nombre });
          continue;
        }

        // anteriores viene ordenado por último uso: se reactiva el más reciente
        const anterior = pulque.anteriores.find(s => claveNombre(s.nombre) === claveNombre(nombre));
        if (anterior) {
          if (!simular) {
            await client.query("UPDATE sabores SET disponible = true WHERE id = $1", [anterior.id]);
          }
          conservados.add(anterior.id);
          resultado.regresan.push({ id: anterior.id, nombre: anterior.nombre });
          continue;
        }

        if (simular) {
          resultado.nuevos.push({ id: null, nombre });
          continue;
        }
        const nuevo = await client.query(
          `INSERT INTO sabores (nombre, categoria_id, precio_adicional, disponible)
           VALUES ($1, $2, 0, true) RETURNING id, nombre`,
          [nombre, pulque.categoria_id]
        );
        await client.query(
          "INSERT INTO producto_sabor (producto_id, sabor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [pulque.producto_id, nuevo.rows[0].id]
        );
        conservados.add(nuevo.rows[0].id);
        resultado.nuevos.push(nuevo.rows[0]);
      }

      for (const activo of pulque.activos) {
        if (conservados.has(activo.id)) continue;
        if (!simular) {
          await client.query("UPDATE sabores SET disponible = false WHERE id = $1", [activo.id]);
        }
        resultado.salen.push({ id: activo.id, nombre: activo.nombre });
      }

      resumen.push(resultado);
    }

    await client.query(simular ? 'ROLLBACK' : 'COMMIT');
    return resumen;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
