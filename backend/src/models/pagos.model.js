import pool from "../config/db.js";

// Métodos de pago aceptados (debe coincidir con CHECK constraint en DB)
export const METODOS_PAGO_VALIDOS = ["efectivo", "tarjeta", "transferencia", "otro"];

// Cambia el método de un pago ya registrado (sin tocar monto ni propina).
export const actualizarMetodoPago = async (pago_id, nuevo_metodo) => {
  if (!METODOS_PAGO_VALIDOS.includes(nuevo_metodo)) {
    return { ok: false, reason: "metodo_invalido" };
  }
  const result = await pool.query(
    `UPDATE pagos SET metodo = $1 WHERE id = $2
     RETURNING id, orden_id, metodo, monto, propina, porcentaje_propina, fecha, empleado_id`,
    [nuevo_metodo, pago_id]
  );
  if (result.rowCount === 0) return { ok: false, reason: "not_found" };
  return { ok: true, pago: result.rows[0] };
};

// Registrar un nuevo pago
export const registrarPago = async ({ orden_id, metodo, monto, propina, porcentaje_propina, empleado_id }) => {
  const result = await pool.query(
    `INSERT INTO pagos (orden_id, metodo, monto, propina, porcentaje_propina, empleado_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [orden_id, metodo, monto, propina || 0, porcentaje_propina || null, empleado_id]
  );
  return result.rows[0];
};

// Calcular total pagado de una orden
export const getTotalPagado = async (orden_id) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(monto), 0) AS pagado, COALESCE(SUM(propina), 0) AS propina
     FROM pagos
     WHERE orden_id = $1`,
    [orden_id]
  );
  return {
    monto: parseFloat(result.rows[0].pagado),
    propina: parseFloat(result.rows[0].propina)
  };
};


// Obtener detalle de pagos de una orden y comparar con total
export const getPagosDeOrden = async (orden_id) => {
    const pagos = await pool.query(
      `SELECT id, metodo, monto, propina, fecha, empleado_id
       FROM pagos
       WHERE orden_id = $1
       ORDER BY fecha ASC`,
      [orden_id]
    );
  
    const totalPagadoRes = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS pagado, COALESCE(SUM(propina), 0) AS total_propina
       FROM pagos
       WHERE orden_id = $1`,
      [orden_id]
    );
  
    const ordenRes = await pool.query(
      `SELECT total FROM ordenes WHERE orden_id = $1`,
      [orden_id]
    );
  
    if (ordenRes.rows.length === 0) {
      throw new Error("Orden no encontrada.");
    }
  
    const total_orden = parseFloat(ordenRes.rows[0].total);
    const total_pagado = parseFloat(totalPagadoRes.rows[0].pagado);
    const total_propina = parseFloat(totalPagadoRes.rows[0].total_propina);
    const total_con_propina = total_pagado + total_propina;
    const diferencia = total_pagado - total_orden;
  
    return {
      orden_id,
      total_orden,
      total_pagado,
      total_propina,
      total_con_propina,
      diferencia,
      estado: diferencia < 0 ? "pendiente" : "pagado",
      pagos: pagos.rows
    };
  };
  