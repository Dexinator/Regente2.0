import pool from "../config/db.js";

export const getAllOrders = async () => {
  const result = await pool.query("SELECT * FROM ordenes");
  return result.rows;
};

export const createOrder = async (presoId, nombreCliente, total, estado, empleadoId) => {
  const result = await pool.query(
    "INSERT INTO ordenes (preso_id, nombre_cliente, total, estado, empleado_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [presoId, nombreCliente, total, estado, empleadoId]
  );
  return result.rows[0];
};
