import pool from "../config/db.js";

// Tablas en schema aislado `talleres` (registro público a talleres de El Palacio Negro).
// Columnas de fecha son TIMESTAMPTZ, así que no les aplica el parser CDMX de config/db.js.

const SELECT_CON_CONTEO = `
  SELECT t.*,
         COUNT(r.id)::int AS inscritos,
         GREATEST(t.cupo_max - COUNT(r.id), 0)::int AS disponibles
  FROM talleres.talleres t
  LEFT JOIN talleres.registros r ON r.taller_id = t.id
`;

export const getTalleres = async (soloActivos = false) => {
  const { rows } = await pool.query(`
    ${SELECT_CON_CONTEO}
    ${soloActivos ? "WHERE t.activo = true" : ""}
    GROUP BY t.id
    ORDER BY COALESCE(t.fecha_evento, t.creado_en) DESC, t.id DESC
  `);
  return rows;
};

export const getTallerBySlug = async (slug) => {
  const { rows } = await pool.query(
    `${SELECT_CON_CONTEO} WHERE t.slug = $1 GROUP BY t.id`,
    [slug]
  );
  return rows[0] ?? null;
};

export const createTaller = async ({ slug, nombre, descripcion, cupo_max, fecha_evento, activo }) => {
  const { rows } = await pool.query(
    `INSERT INTO talleres.talleres (slug, nombre, descripcion, cupo_max, fecha_evento, activo)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, true))
     RETURNING *`,
    [slug, nombre, descripcion ?? null, cupo_max, fecha_evento ?? null, activo ?? null]
  );
  return rows[0];
};

const CAMPOS_EDITABLES = ["slug", "nombre", "descripcion", "cupo_max", "fecha_evento", "activo"];

export const updateTaller = async (id, data) => {
  const sets = [];
  const values = [];
  for (const campo of CAMPOS_EDITABLES) {
    if (campo in data) {
      values.push(data[campo]);
      sets.push(`${campo} = $${values.length}`);
    }
  }
  if (sets.length === 0) {
    const { rows } = await pool.query("SELECT * FROM talleres.talleres WHERE id = $1", [id]);
    return rows[0] ?? null;
  }
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE talleres.talleres SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] ?? null;
};

export const deleteTaller = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM talleres.talleres WHERE id = $1", [id]);
  return rowCount > 0;
};

/**
 * Inscribe a un asistente respetando cupo. Bloquea la fila del taller (FOR UPDATE)
 * para que dos registros simultáneos no rebasen el cupo.
 * @returns {{ok: true, registro} | {ok: false, status, error}}
 */
export const registrarAsistente = async (tallerId, { nombre, telefono, instagram, edad }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: [taller] } = await client.query(
      "SELECT cupo_max, activo FROM talleres.talleres WHERE id = $1 FOR UPDATE",
      [tallerId]
    );
    if (!taller) {
      await client.query("ROLLBACK");
      return { ok: false, status: 404, error: "Taller no encontrado" };
    }
    if (!taller.activo) {
      await client.query("ROLLBACK");
      return { ok: false, status: 409, error: "Este taller ya no acepta registros" };
    }
    const { rows: [{ inscritos }] } = await client.query(
      "SELECT COUNT(*)::int AS inscritos FROM talleres.registros WHERE taller_id = $1",
      [tallerId]
    );
    if (inscritos >= taller.cupo_max) {
      await client.query("ROLLBACK");
      return { ok: false, status: 409, error: "Cupo agotado" };
    }
    const { rows: [registro] } = await client.query(
      `INSERT INTO talleres.registros (taller_id, nombre, telefono, instagram, edad)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tallerId, nombre, telefono, instagram ?? null, edad ?? null]
    );
    await client.query("COMMIT");
    return { ok: true, registro, inscritos: inscritos + 1, cupo_max: taller.cupo_max };
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return { ok: false, status: 409, error: "Ese teléfono ya está registrado en este taller" };
    }
    throw err;
  } finally {
    client.release();
  }
};

export const getRegistros = async (tallerId) => {
  const { rows } = await pool.query(
    `SELECT r.*, t.nombre AS taller_nombre, t.slug AS taller_slug
     FROM talleres.registros r
     JOIN talleres.talleres t ON t.id = r.taller_id
     ${tallerId ? "WHERE r.taller_id = $1" : ""}
     ORDER BY r.creado_en DESC`,
    tallerId ? [tallerId] : []
  );
  return rows;
};

export const deleteRegistro = async (id) => {
  const { rowCount } = await pool.query("DELETE FROM talleres.registros WHERE id = $1", [id]);
  return rowCount > 0;
};
