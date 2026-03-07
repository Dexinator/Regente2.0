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
    WHERE o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
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
    WHERE o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
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
    WHERE fecha >= $1::date AND fecha < ($2::date + interval '1 day')
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

// ==========================================
// REPORTES AVANZADOS - Dashboard Ejecutivo
// ==========================================

// KPIs principales para un rango de fechas (fuente de verdad: pagos)
export const getDashboardKPIs = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    WITH ordenes_periodo AS (
      SELECT DISTINCT o.orden_id, o.preso_id
      FROM ordenes o
      WHERE o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
        AND o.estado = 'cerrada'
    )
    SELECT
      COALESCE(SUM(p.monto), 0) as ventas_totales,
      COUNT(DISTINCT op.orden_id) as total_ordenes,
      CASE WHEN COUNT(DISTINCT op.orden_id) > 0
        THEN COALESCE(SUM(p.monto), 0) / COUNT(DISTINCT op.orden_id)
        ELSE 0
      END as ticket_promedio,
      COUNT(DISTINCT op.preso_id) as clientes_unicos,
      COALESCE(SUM(p.propina), 0) as propinas_totales
    FROM ordenes_periodo op
    LEFT JOIN pagos p ON op.orden_id = p.orden_id
  `, [fechaInicio, fechaFin]);
  return result.rows[0];
};

// Tendencia de ventas por día (fuente de verdad: pagos)
export const getSalesTrend = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    SELECT
      DATE(o.fecha) as fecha,
      COALESCE(SUM(p.monto), 0) as ventas,
      COUNT(DISTINCT o.orden_id) as ordenes
    FROM ordenes o
    JOIN pagos p ON o.orden_id = p.orden_id
    WHERE o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
      AND o.estado = 'cerrada'
    GROUP BY DATE(o.fecha)
    ORDER BY fecha
  `, [fechaInicio, fechaFin]);
  return result.rows;
};

// ==========================================
// REPORTES AVANZADOS - Desempeño Empleados
// ==========================================

// Desempeño de meseros (ventas y propinas)
export const getMeserosPerformance = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    SELECT
      e.id as empleado_id,
      e.nombre,
      COUNT(DISTINCT p.orden_id) as ordenes_cobradas,
      COALESCE(SUM(p.monto), 0) as total_ventas,
      COALESCE(SUM(p.propina), 0) as total_propinas,
      COALESCE(AVG(p.porcentaje_propina), 0) as propina_promedio_pct
    FROM empleados e
    LEFT JOIN pagos p ON e.id = p.empleado_id
    LEFT JOIN ordenes o ON p.orden_id = o.orden_id
      AND o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
      AND o.estado = 'cerrada'
    WHERE e.rol = 'mesero' AND e.activo = true
    GROUP BY e.id, e.nombre
    ORDER BY total_ventas DESC
  `, [fechaInicio, fechaFin]);
  return result.rows;
};

// Órdenes creadas por empleado
export const getOrdenesCreatedByEmpleado = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    SELECT
      e.id as empleado_id,
      e.nombre,
      COUNT(DISTINCT o.orden_id) as ordenes_creadas,
      COALESCE(SUM(o.total), 0) as total_ventas,
      COUNT(DISTINCT o.preso_id) as clientes_atendidos
    FROM empleados e
    LEFT JOIN ordenes o ON e.id = o.empleado_id
      AND o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
      AND o.estado = 'cerrada'
    WHERE e.rol = 'mesero' AND e.activo = true
    GROUP BY e.id, e.nombre
    ORDER BY ordenes_creadas DESC
  `, [fechaInicio, fechaFin]);
  return result.rows;
};

// Desempeño de cocineros
export const getCocinerosPerformance = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    SELECT
      e.id as empleado_id,
      e.nombre,
      COUNT(d.id) as productos_preparados,
      COALESCE(AVG(EXTRACT(EPOCH FROM (d.tiempo_preparacion - d.tiempo_creacion)) / 60), 0) as tiempo_promedio_minutos
    FROM empleados e
    LEFT JOIN detalles_orden d ON e.id = d.empleado_id AND d.preparado = true
    LEFT JOIN ordenes o ON d.orden_id = o.orden_id
      AND o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
    WHERE e.rol = 'cocinero' AND e.activo = true
    GROUP BY e.id, e.nombre
    ORDER BY productos_preparados DESC
  `, [fechaInicio, fechaFin]);
  return result.rows;
};

// ==========================================
// REPORTES AVANZADOS - Análisis de Clientes
// ==========================================

// Top clientes por gasto total
export const getTopCustomersBySpending = async (fechaInicio, fechaFin, limite = 10) => {
  const result = await pool.query(`
    SELECT
      p.id as preso_id,
      p.reg_name as nombre,
      COUNT(DISTINCT o.orden_id) as total_visitas,
      COALESCE(SUM(o.total), 0) as total_gastado,
      COALESCE(AVG(o.total), 0) as ticket_promedio,
      MAX(o.fecha) as ultima_visita
    FROM presos p
    JOIN ordenes o ON p.id = o.preso_id
    WHERE o.estado = 'cerrada'
      AND o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
    GROUP BY p.id, p.reg_name
    ORDER BY total_gastado DESC
    LIMIT $3
  `, [fechaInicio, fechaFin, limite]);
  return result.rows;
};

// Segmentación: clientes nuevos vs recurrentes
export const getCustomerSegmentation = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    WITH primera_visita AS (
      SELECT preso_id, MIN(fecha) as primera
      FROM ordenes
      WHERE estado = 'cerrada' AND preso_id IS NOT NULL
      GROUP BY preso_id
    )
    SELECT
      COUNT(DISTINCT CASE WHEN pv.primera >= $1::date AND pv.primera < ($2::date + interval '1 day') THEN o.preso_id END) as clientes_nuevos,
      COUNT(DISTINCT CASE WHEN pv.primera < $1::date THEN o.preso_id END) as clientes_recurrentes,
      COUNT(DISTINCT o.preso_id) as clientes_totales
    FROM ordenes o
    LEFT JOIN primera_visita pv ON o.preso_id = pv.preso_id
    WHERE o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
      AND o.estado = 'cerrada'
      AND o.preso_id IS NOT NULL
  `, [fechaInicio, fechaFin]);
  return result.rows[0];
};

// Distribución de frecuencia de visitas
export const getVisitFrequency = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    SELECT
      CASE
        WHEN visitas = 1 THEN '1 visita'
        WHEN visitas BETWEEN 2 AND 3 THEN '2-3 visitas'
        WHEN visitas BETWEEN 4 AND 5 THEN '4-5 visitas'
        ELSE '6+ visitas'
      END as frecuencia,
      COUNT(*) as num_clientes
    FROM (
      SELECT preso_id, COUNT(*) as visitas
      FROM ordenes
      WHERE estado = 'cerrada'
        AND fecha >= $1::date AND fecha < ($2::date + interval '1 day')
        AND preso_id IS NOT NULL
      GROUP BY preso_id
    ) subq
    GROUP BY frecuencia
    ORDER BY
      CASE frecuencia
        WHEN '1 visita' THEN 1
        WHEN '2-3 visitas' THEN 2
        WHEN '4-5 visitas' THEN 3
        ELSE 4
      END
  `, [fechaInicio, fechaFin]);
  return result.rows;
};

// Distribución de clientes por grado (nivel de lealtad)
export const getGradesDistribution = async () => {
  const result = await pool.query(`
    SELECT
      g.nombre as grado,
      g.descuento,
      COUNT(DISTINCT pg.preso_id) as num_clientes
    FROM grados g
    LEFT JOIN preso_grado pg ON g.id = pg.grado_id
    GROUP BY g.id, g.nombre, g.descuento
    ORDER BY g.descuento DESC
  `);
  return result.rows;
};

// ==========================================
// REPORTES AVANZADOS - Análisis de Productos
// ==========================================

// Top productos por ingresos
export const getTopProductsByRevenue = async (fechaInicio, fechaFin, limite = 10) => {
  const result = await pool.query(`
    SELECT
      p.id as producto_id,
      p.nombre,
      p.categoria,
      SUM(ABS(d.cantidad)) as unidades_vendidas,
      SUM(ABS(d.cantidad) * d.precio_unitario) as ingresos_totales,
      p.costo,
      SUM((d.precio_unitario - COALESCE(p.costo, 0)) * ABS(d.cantidad)) as margen_bruto
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    WHERE o.estado = 'cerrada'
      AND o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
      AND d.cantidad > 0
    GROUP BY p.id, p.nombre, p.categoria, p.costo
    ORDER BY ingresos_totales DESC
    LIMIT $3
  `, [fechaInicio, fechaFin, limite]);
  return result.rows;
};

// Ventas por categoría con porcentaje
export const getCategorySales = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    WITH total_ventas AS (
      SELECT COALESCE(SUM(total), 1) as total
      FROM ordenes
      WHERE estado = 'cerrada' AND fecha >= $1::date AND fecha < ($2::date + interval '1 day')
    )
    SELECT
      p.categoria,
      SUM(ABS(d.cantidad)) as unidades_vendidas,
      SUM(ABS(d.cantidad) * d.precio_unitario) as ingresos_totales,
      COUNT(DISTINCT d.orden_id) as ordenes_con_categoria,
      ROUND(SUM(ABS(d.cantidad) * d.precio_unitario) * 100.0 / tv.total, 2) as porcentaje_total
    FROM detalles_orden d
    JOIN productos p ON d.producto_id = p.id
    JOIN ordenes o ON d.orden_id = o.orden_id
    CROSS JOIN total_ventas tv
    WHERE o.estado = 'cerrada'
      AND o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
      AND d.cantidad > 0
    GROUP BY p.categoria, tv.total
    ORDER BY ingresos_totales DESC
  `, [fechaInicio, fechaFin]);
  return result.rows;
};

// Productos con bajo desempeño
export const getLowPerformingProducts = async (fechaInicio, fechaFin, limite = 10) => {
  const result = await pool.query(`
    SELECT
      p.id as producto_id,
      p.nombre,
      p.categoria,
      p.precio,
      COALESCE(SUM(ABS(d.cantidad)), 0) as unidades_vendidas,
      COALESCE(SUM(ABS(d.cantidad) * d.precio_unitario), 0) as ingresos_totales
    FROM productos p
    LEFT JOIN detalles_orden d ON p.id = d.producto_id AND d.cantidad > 0
    LEFT JOIN ordenes o ON d.orden_id = o.orden_id
      AND o.estado = 'cerrada'
      AND o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
    WHERE p.precio > 0
    GROUP BY p.id, p.nombre, p.categoria, p.precio
    HAVING COALESCE(SUM(ABS(d.cantidad)), 0) > 0
    ORDER BY unidades_vendidas ASC
    LIMIT $3
  `, [fechaInicio, fechaFin, limite]);
  return result.rows;
};

// Desempeño de sentencias (combos)
export const getSentenciasPerformance = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    SELECT
      s.id as sentencia_id,
      s.nombre,
      s.precio,
      COUNT(DISTINCT d.id) as veces_vendida,
      COUNT(DISTINCT d.id) * s.precio as ingresos_totales
    FROM sentencias s
    LEFT JOIN detalles_orden d ON s.id = d.sentencia_id AND d.es_sentencia_principal = true
    LEFT JOIN ordenes o ON d.orden_id = o.orden_id
      AND o.estado = 'cerrada'
      AND o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
    WHERE s.activa = true
    GROUP BY s.id, s.nombre, s.precio
    ORDER BY veces_vendida DESC
  `, [fechaInicio, fechaFin]);
  return result.rows;
};

// ==========================================
// REPORTES AVANZADOS - Datos Complementarios
// ==========================================

// Desglose por método de pago en rango de fechas
export const getPaymentMethodsInRange = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    SELECT
      p.metodo,
      COUNT(DISTINCT p.orden_id) as total_ordenes,
      COALESCE(SUM(p.monto), 0) as total_ventas,
      COALESCE(SUM(p.propina), 0) as total_propinas
    FROM pagos p
    JOIN ordenes o ON p.orden_id = o.orden_id
    WHERE o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
      AND o.estado = 'cerrada'
    GROUP BY p.metodo
    ORDER BY total_ventas DESC
  `, [fechaInicio, fechaFin]);
  return result.rows;
};

// Ventas por día de la semana (ajustado a hora México UTC-6)
export const getDayOfWeekSales = async (fechaInicio, fechaFin) => {
  const result = await pool.query(`
    SELECT
      EXTRACT(DOW FROM (o.fecha - interval '6 hours')) as dia_num,
      CASE EXTRACT(DOW FROM (o.fecha - interval '6 hours'))
        WHEN 0 THEN 'Dom'
        WHEN 1 THEN 'Lun'
        WHEN 2 THEN 'Mar'
        WHEN 3 THEN 'Mie'
        WHEN 4 THEN 'Jue'
        WHEN 5 THEN 'Vie'
        WHEN 6 THEN 'Sab'
      END as dia_nombre,
      COUNT(DISTINCT o.orden_id) as total_ordenes,
      COALESCE(SUM(p.monto), 0) as total_ventas,
      COUNT(DISTINCT DATE(o.fecha - interval '6 hours')) as dias_operados
    FROM ordenes o
    JOIN pagos p ON o.orden_id = p.orden_id
    WHERE o.fecha >= $1::date AND o.fecha < ($2::date + interval '1 day')
      AND o.estado = 'cerrada'
    GROUP BY dia_num, dia_nombre
    ORDER BY dia_num
  `, [fechaInicio, fechaFin]);
  return result.rows;
};
