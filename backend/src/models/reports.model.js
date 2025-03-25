import pool from "../config/db.js";

// Ventas del mes actual por producto
export const getMonthlySalesByProduct = async () => {
  const result = await pool.query(`
    SELECT
      p.nombre,
      SUM(d.cantidad) AS cantidad,
      SUM(d.cantidad * d.precio_unitario) AS total_vendido,
      p.costo,
      SUM((d.precio_unitario - p.costo) * d.cantidad) AS margen
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE DATE_TRUNC('month', o.fecha) = DATE_TRUNC('month', CURRENT_DATE)
      AND o.estado = 'cerrada'
    GROUP BY p.nombre, p.costo
    ORDER BY total_vendido DESC;
  `);
  return result.rows;
};

// Ventas del mes actual por categoría
export const getMonthlySalesByCategory = async () => {
  const result = await pool.query(`
    SELECT
      p.categoria,
      SUM(d.cantidad) AS cantidad,
      SUM(d.cantidad * d.precio_unitario) AS total_vendido
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE DATE_TRUNC('month', o.fecha) = DATE_TRUNC('month', CURRENT_DATE)
      AND o.estado = 'cerrada'
    GROUP BY p.categoria
    ORDER BY total_vendido DESC;
  `);
  return result.rows;
};

// Total vendido en el mes
export const getMonthlyTotal = async () => {
  const result = await pool.query(`
    SELECT COALESCE(SUM(total), 0) AS total
    FROM ordenes
    WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)
      AND estado = 'cerrada';
  `);
  return result.rows[0].total;
};

// Ventas por categoría para un rango de tiempo
export const getSalesByCategoryAndRange = async (range) => {
  const result = await pool.query(`
    SELECT
      p.categoria,
      SUM(d.cantidad) AS cantidad,
      SUM(d.cantidad * d.precio_unitario) AS total_vendido
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE DATE_TRUNC($1, o.fecha) = DATE_TRUNC($1, CURRENT_DATE)
      AND o.estado = 'cerrada'
    GROUP BY p.categoria
    ORDER BY total_vendido DESC
  `, [range]);
  return result.rows;
};

// Total en dinero vendido en un rango
export const getTotalByRange = async (range) => {
  const result = await pool.query(`
    SELECT COALESCE(SUM(total), 0) AS total
    FROM ordenes
    WHERE DATE_TRUNC($1, fecha) = DATE_TRUNC($1, CURRENT_DATE)
      AND estado = 'cerrada'
  `, [range]);
  return parseFloat(result.rows[0].total);
};
