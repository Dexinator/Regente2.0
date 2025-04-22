import pool from "../config/db.js";

// Ventas del mes actual por producto
export const getMonthlySalesByProduct = async () => {
  const result = await pool.query(`
    SELECT 
      p.id, 
      p.nombre,
      SUM(d.cantidad) as cantidad_vendida,
      SUM(d.cantidad * d.precio_unitario) as total_ventas
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE DATE_TRUNC('month', o.fecha) = DATE_TRUNC('month', (NOW() AT TIME ZONE 'America/Mexico_City')::date)
      AND o.estado = 'cerrada'
    GROUP BY p.id, p.nombre
    ORDER BY total_ventas DESC
  `);
  return result.rows;
};

// Ventas del mes actual por categoría
export const getMonthlySalesByCategory = async () => {
  const result = await pool.query(`
    SELECT 
      p.categoria,
      SUM(d.cantidad) as cantidad_vendida,
      SUM(d.cantidad * d.precio_unitario) as total_ventas
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE DATE_TRUNC('month', o.fecha) = DATE_TRUNC('month', (NOW() AT TIME ZONE 'America/Mexico_City')::date)
      AND o.estado = 'cerrada'
    GROUP BY p.categoria
    ORDER BY total_ventas DESC
  `);
  return result.rows;
};

// Total vendido en el mes
export const getMonthlyTotals = async () => {
  const result = await pool.query(`
    SELECT 
      SUM(total) as ventas_totales,
      COUNT(*) as total_ordenes,
      CASE WHEN COUNT(*) > 0
        THEN SUM(total) / COUNT(*)
        ELSE 0
      END as ticket_promedio
    FROM ordenes
    WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', (NOW() AT TIME ZONE 'America/Mexico_City')::date)
      AND estado = 'cerrada'
  `);
  return result.rows[0];
};

// Ventas por categoría para un rango de tiempo
export const getSalesByCategoryAndRange = async (range) => {
  const result = await pool.query(`
    SELECT 
      p.categoria,
      SUM(d.cantidad) as cantidad_vendida,
      SUM(d.cantidad * d.precio_unitario) as total_ventas
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE DATE_TRUNC($1, o.fecha) = DATE_TRUNC($1, (NOW() AT TIME ZONE 'America/Mexico_City')::date)
      AND o.estado = 'cerrada'
    GROUP BY p.categoria
    ORDER BY total_ventas DESC
  `, [range]);
  return result.rows;
};

// Total en dinero vendido en un rango
export const getTotalByRange = async (range) => {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_ordenes,
      SUM(total) as ventas_totales
    FROM ordenes
    WHERE DATE_TRUNC($1, fecha) = DATE_TRUNC($1, (NOW() AT TIME ZONE 'America/Mexico_City')::date)
      AND estado = 'cerrada'
  `, [range]);
  return result.rows[0];
};

export const getSalesByProductInRange = async (desde, hasta) => {
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
    WHERE o.fecha BETWEEN $1 AND $2
      AND o.estado = 'cerrada'
    GROUP BY p.nombre, p.costo
    ORDER BY total_vendido DESC
  `, [desde, hasta]);
  return result.rows;
};

export const getSalesByCategoryInRange = async (desde, hasta) => {
  const result = await pool.query(`
    SELECT
      p.categoria,
      SUM(d.cantidad) AS cantidad,
      SUM(d.cantidad * d.precio_unitario) AS total_vendido
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE o.fecha BETWEEN $1 AND $2
      AND o.estado = 'cerrada'
    GROUP BY p.categoria
    ORDER BY total_vendido DESC
  `, [desde, hasta]);
  return result.rows;
};

export const getTotalsInRange = async (desde, hasta) => {
  const result = await pool.query(`
    SELECT
      COALESCE(SUM(total_bruto), 0) AS total_bruto,
      COALESCE(SUM(total), 0) AS total_neto,
      COALESCE(SUM(total_bruto - total), 0) AS descuento_total
    FROM ordenes
    WHERE fecha BETWEEN $1 AND $2
      AND estado = 'cerrada'
  `, [desde, hasta]);
  return result.rows[0];
};

export const getTopSellingProducts = async (limite = 10) => {
  const result = await pool.query(`
    SELECT
      p.nombre,
      p.categoria,
      SUM(d.cantidad) AS cantidad_vendida,
      SUM(d.cantidad * d.precio_unitario) AS total_vendido
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE o.estado = 'cerrada'
    GROUP BY p.nombre, p.categoria
    ORDER BY cantidad_vendida DESC
    LIMIT $1
  `, [limite]);
  return result.rows;
};

// Reporte detallado por día específico
export const getDailySalesDetails = async (fecha) => {
  const result = await pool.query(`
    SELECT
      p.nombre,
      p.categoria,
      SUM(d.cantidad) AS cantidad,
      SUM(d.cantidad * d.precio_unitario) AS total_vendido
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE DATE(o.fecha) = $1 AND o.estado = 'cerrada'
    GROUP BY p.nombre, p.categoria
    ORDER BY total_vendido DESC
  `, [fecha]);
  return result.rows;
};

// Top clientes con más órdenes realizadas
export const getTopClients = async (limite = 10) => {
  const result = await pool.query(`
    SELECT
      p.id,
      p.reg_name,
      COUNT(o.orden_id) AS total_ordenes,
      SUM(o.total) AS total_gastado
    FROM presos p
    JOIN ordenes o ON o.preso_id = p.id
    WHERE o.estado = 'cerrada'
    GROUP BY p.id, p.reg_name
    ORDER BY total_ordenes DESC
    LIMIT $1
  `, [limite]);
  return result.rows;
};

// Total de órdenes únicas del día
export const getDailyTotalOrders = async () => {
  const result = await pool.query(`
    SELECT COUNT(DISTINCT orden_id) as total_ordenes
    FROM ordenes
    WHERE fecha::date = (NOW())::date
      AND estado = 'cerrada'
  `);
  return parseInt(result.rows[0].total_ordenes || 0);
};

// Ventas del día con métodos de pago y propinas
export const getDailySalesWithPaymentMethods = async () => {
  const result = await pool.query(`
    WITH ordenes_del_dia AS (
      SELECT DISTINCT o.orden_id
      FROM ordenes o
      WHERE o.fecha::date = (NOW())::date
        AND o.estado = 'cerrada'
    )
    SELECT 
      p.metodo,
      COUNT(DISTINCT p.orden_id) as total_ordenes,
      SUM(p.monto) as total_ventas,
      SUM(p.propina) as total_propinas
    FROM pagos p
    JOIN ordenes_del_dia od ON p.orden_id = od.orden_id
    GROUP BY p.metodo
    ORDER BY total_ventas DESC
  `);
  return result.rows;
};

// Ventas por categoría del día
export const getDailySalesByCategory = async () => {
  const result = await pool.query(`
    SELECT 
      pr.categoria,
      SUM(d.cantidad) as cantidad,
      SUM(d.cantidad * d.precio_unitario) as total_ventas
    FROM detalles_orden d
    JOIN productos pr ON d.producto_id = pr.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE o.fecha::date = (NOW())::date
      AND o.estado = 'cerrada'
    GROUP BY pr.categoria
    ORDER BY total_ventas DESC
  `);
  return result.rows;
};
