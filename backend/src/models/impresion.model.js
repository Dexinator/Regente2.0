import pool from "../config/db.js";

// Crear un trabajo de impresión (contenido = bytes ESC/POS en base64)
export const crearTrabajo = async ({ orden_id, tipo = "cuenta", contenido, empleado_id = null }) => {
  const result = await pool.query(
    `INSERT INTO trabajos_impresion (orden_id, tipo, contenido, empleado_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, orden_id, tipo, estado, creado_en`,
    [orden_id, tipo, contenido, empleado_id]
  );
  return result.rows[0];
};

// El puente toma los trabajos pendientes. Se marcan como 'enviado' de forma atómica
// para que dos consultas seguidas no impriman doble. Si un trabajo se queda en
// 'enviado' más de 90 s (el puente murió a media impresión), se vuelve a entregar.
export const tomarPendientes = async (limite = 5) => {
  const result = await pool.query(
    `UPDATE trabajos_impresion
     SET estado = 'enviado', enviado_en = CURRENT_TIMESTAMP, intentos = intentos + 1
     WHERE id IN (
       SELECT id FROM trabajos_impresion
       WHERE (estado = 'pendiente'
              OR (estado = 'enviado' AND enviado_en < CURRENT_TIMESTAMP - INTERVAL '90 seconds'))
         AND intentos < 5
       ORDER BY id
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, orden_id, tipo, contenido`,
    [limite]
  );
  return result.rows;
};

// El puente confirma el resultado de un trabajo
export const confirmarTrabajo = async (id, exito = true) => {
  const result = await pool.query(
    `UPDATE trabajos_impresion
     SET estado = $2, impreso_en = CASE WHEN $2 = 'impreso' THEN CURRENT_TIMESTAMP ELSE impreso_en END
     WHERE id = $1
     RETURNING id, estado`,
    [id, exito ? "impreso" : "error"]
  );
  return result.rows[0] || null;
};

// Trabajos aún no impresos (para mostrar "en cola" en el frontend)
export const contarPendientes = async () => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS pendientes
     FROM trabajos_impresion
     WHERE estado IN ('pendiente', 'enviado')`
  );
  return result.rows[0].pendientes;
};
