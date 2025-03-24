import pool from "../config/db.js";

// 1. Todas las órdenes (sin detalles)
export const getAllOrders = async () => {
  const result = await pool.query("SELECT * FROM ordenes ORDER BY fecha DESC");
  return result.rows;
};

// 2. Una orden con sus productos
export const getOrderWithDetails = async (orden_id) => {
  const orden = await pool.query("SELECT * FROM ordenes WHERE orden_id = $1", [orden_id]);
  const detalles = await pool.query(
    `SELECT d.*, p.nombre AS nombre_producto, p.categoria
     FROM detalles_orden d
     JOIN productos p ON d.producto_id = p.id
     WHERE d.orden_id = $1`,
    [orden_id]
  );
  return { ...orden.rows[0], detalles: detalles.rows };
};

// 3. Crear una nueva orden con productos
export const createOrder = async ({ preso_id, nombre_cliente, total, empleado_id, productos }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ordenRes = await client.query(
      `INSERT INTO ordenes (preso_id, nombre_cliente, total, empleado_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [preso_id || null, nombre_cliente || null, total, empleado_id]
    );

    const orden_id = ordenRes.rows[0].orden_id;

    for (const producto of productos) {
      const { producto_id, cantidad, precio_unitario } = producto;
      await client.query(
        `INSERT INTO detalles_orden (orden_id, producto_id, cantidad, precio_unitario, empleado_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [orden_id, producto_id, cantidad, precio_unitario, empleado_id]
      );
    }

    await client.query("COMMIT");
    return ordenRes.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// 4. Cerrar una orden
export const closeOrder = async (orden_id) => {
  const result = await pool.query(
    `UPDATE ordenes SET estado = 'cerrada' WHERE orden_id = $1 RETURNING *`,
    [orden_id]
  );
  return result.rows[0];
};
