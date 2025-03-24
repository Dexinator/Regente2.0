import pool from "../config/db.js";

// Obtener todas las órdenes
export const getAllOrders = async () => {
  const result = await pool.query("SELECT * FROM ordenes ORDER BY fecha DESC");
  return result.rows;
};

// Obtener solo órdenes abiertas
export const getOpenOrders = async () => {
  const result = await pool.query("SELECT * FROM ordenes WHERE estado = 'abierta' ORDER BY fecha DESC");
  return result.rows;
};

// Obtener una orden con sus productos
export const getOrderWithDetails = async (orden_id) => {
  // Traemos los datos de la orden y el nombre del preso (si hay)
  const orden = await pool.query(
    `SELECT o.*, p.reg_name AS nombre_preso
     FROM ordenes o
     LEFT JOIN presos p ON o.preso_id = p.id
     WHERE o.orden_id = $1`,
    [orden_id]
  );

  if (orden.rows.length === 0) return null;

  // Traemos los productos incluidos en la orden
  const detalles = await pool.query(
    `SELECT d.*, p.nombre AS nombre_producto, p.categoria
     FROM detalles_orden d
     JOIN productos p ON d.producto_id = p.id
     WHERE d.orden_id = $1`,
    [orden_id]
  );

  return { ...orden.rows[0], detalles: detalles.rows };
};


// Crear nueva orden con detalles
export const createOrder = async ({ preso_id, nombre_cliente, total, empleado_id, productos }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ordenRes = await client.query(
      `INSERT INTO ordenes (preso_id, nombre_cliente, total, empleado_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        preso_id || null,
        preso_id ? null : nombre_cliente,
        total,
        empleado_id
      ]
    );

    const orden_id = ordenRes.rows[0].orden_id;

    for (const { producto_id, cantidad } of productos) {
      const precioRes = await client.query(
        `SELECT precio FROM productos WHERE id = $1`,
        [producto_id]
      );
      const precio_unitario = precioRes.rows[0]?.precio;

      if (!precio_unitario) {
        throw new Error(`Producto con id ${producto_id} no encontrado`);
      }

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

// Cerrar una orden
export const closeOrder = async (orden_id) => {
  const result = await pool.query(
    `UPDATE ordenes SET estado = 'cerrada' WHERE orden_id = $1 RETURNING *`,
    [orden_id]
  );
  return result.rows[0];
};
