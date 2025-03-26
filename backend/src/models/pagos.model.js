import pool from "../config/db.js";

// Registrar un nuevo pago
export const registrarPago = async ({ orden_id, metodo, monto, empleado_id }) => {
  const result = await pool.query(
    `INSERT INTO pagos (orden_id, metodo, monto, empleado_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [orden_id, metodo, monto, empleado_id]
  );
  return result.rows[0];
};

// Calcular total pagado de una orden
export const getTotalPagado = async (orden_id) => {
  const result = await pool.query(
    `SELECT COALESCE(SUM(monto), 0) AS pagado
     FROM pagos
     WHERE orden_id = $1`,
    [orden_id]
  );
  return parseFloat(result.rows[0].pagado);
};


// Obtener detalle de pagos de una orden y comparar con total
export const getPagosDeOrden = async (orden_id) => {
    const pagos = await pool.query(
      `SELECT id, metodo, monto, fecha, empleado_id
       FROM pagos
       WHERE orden_id = $1
       ORDER BY fecha ASC`,
      [orden_id]
    );
  
    const totalPagadoRes = await pool.query(
      `SELECT COALESCE(SUM(monto), 0) AS pagado
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
    const diferencia = total_pagado - total_orden;
  
    return {
      orden_id,
      total_orden,
      total_pagado,
      diferencia,
      estado: diferencia < 0 ? "pendiente" : diferencia > 0 ? "propina" : "pagado",
      pagos: pagos.rows
    };
  };
  