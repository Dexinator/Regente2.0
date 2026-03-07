import {
    getMonthlySalesByProduct,
    getMonthlySalesByCategory,
    getMonthlyTotals
  } from "../models/reports.model.js";
  
  export const getFinancialReport = async (req, res) => {
    try {
      const [productos, categorias, totales] = await Promise.all([
        getMonthlySalesByProduct(),
        getMonthlySalesByCategory(),
        getMonthlyTotals()
      ]);
      
      res.json({
        total_bruto: parseFloat(totales.total_bruto),
        total_neto: parseFloat(totales.total_neto),
        descuento_total: parseFloat(totales.descuento_total),
        por_producto: productos,
        por_categoria: categorias
      });
    } catch (err) {
      res.status(500).json({ error: "Error generando reporte financiero", detail: err.message });
    }
  };


  import {
    getDailySalesWithPaymentMethods,
    getDailySalesByCategory,
    getDailyTotalOrders
  } from "../models/reports.model.js";
  
  export const getManagerReport = async (req, res) => {
    try {
      const [ventasPorMetodo, ventasPorCategoria, totalOrdenes] = await Promise.all([
        getDailySalesWithPaymentMethods(),
        getDailySalesByCategory(),
        getDailyTotalOrders()
      ]);
  
      // Calcular totales
      const totalVentas = ventasPorMetodo.reduce((sum, item) => sum + parseFloat(item.total_ventas), 0);
      const totalPropinas = ventasPorMetodo.reduce((sum, item) => sum + parseFloat(item.total_propinas), 0);
      
      // Para depuración
      console.log("totalOrdenes:", totalOrdenes);
      console.log("ventasPorMetodo:", ventasPorMetodo);
      
      const responseData = {
        ventas_totales: totalVentas,
        propinas_total: totalPropinas,
        total_ordenes: totalOrdenes,
        ticket_promedio: totalOrdenes > 0 ? totalVentas / totalOrdenes : 0,
        ventas_por_metodo: ventasPorMetodo,
        ventas_por_categoria: ventasPorCategoria
      };
      
      console.log("Enviando respuesta:", responseData);
      
      res.json(responseData);
    } catch (err) {
      console.error("Error en getManagerReport:", err);
      res.status(500).json({ error: "Error generando reporte de gerente", detail: err.message });
    }
  };
  

  import {
    getSalesByProductInRange,
    getSalesByCategoryInRange,
    getTotalsInRange
  } from "../models/reports.model.js";
  
  export const getCustomRangeReport = async (req, res) => {
    const { desde, hasta } = req.query;
  
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' requeridos" });
    }
  
    try {
      const [productos, categorias, totales] = await Promise.all([
        getSalesByProductInRange(desde, hasta),
        getSalesByCategoryInRange(desde, hasta),
        getTotalsInRange(desde, hasta)
      ]);
      
      res.json({
        total_bruto: parseFloat(totales.total_bruto),
        total_neto: parseFloat(totales.total_neto),
        descuento_total: parseFloat(totales.descuento_total),
        por_producto: productos,
        por_categoria: categorias
      });
    } catch (err) {
      res.status(500).json({ error: "Error generando reporte por rango", detail: err.message });
    }
  };
  
  import { getTopSellingProducts } from "../models/reports.model.js";

export const getPopularProducts = async (req, res) => {
  const limite = parseInt(req.query.limite) || 10;

  try {
    const populares = await getTopSellingProducts(limite);
    res.json({ populares });
  } catch (err) {
    res.status(500).json({ error: "Error generando reporte de productos populares", detail: err.message });
  }
};


import { getDailySalesDetails } from "../models/reports.model.js";

// Detalle de ventas por día
export const getDailyReport = async (req, res) => {
  const { fecha } = req.query;
  if (!fecha) {
    return res.status(400).json({ error: "El parámetro 'fecha' es requerido (YYYY-MM-DD)" });
  }

  try {
    const detalles = await getDailySalesDetails(fecha);
    res.json({ fecha, detalles });
  } catch (err) {
    res.status(500).json({ error: "Error generando detalle del día", detail: err.message });
  }
};


import { getTopClients } from "../models/reports.model.js";

// Clientes con más órdenes (clientes frecuentes)
export const getTopClientsReport = async (req, res) => {
  const limite = parseInt(req.query.limite) || 10;

  try {
    const clientes = await getTopClients(limite);
    res.json({ clientes });
  } catch (err) {
    res.status(500).json({ error: "Error generando reporte de clientes frecuentes", detail: err.message });
  }
};

// ==========================================
// REPORTES AVANZADOS
// ==========================================

import {
  getDashboardKPIs,
  getSalesTrend,
  getPaymentMethodsInRange,
  getDayOfWeekSales,
  getMeserosPerformance,
  getOrdenesCreatedByEmpleado,
  getCocinerosPerformance,
  getTopCustomersBySpending,
  getCustomerSegmentation,
  getVisitFrequency,
  getGradesDistribution,
  getTopProductsByRevenue,
  getCategorySales,
  getLowPerformingProducts,
  getSentenciasPerformance
} from "../models/reports.model.js";

// Helper para calcular período anterior
const calcularPeriodoAnterior = (fechaInicio, fechaFin) => {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const duracion = fin - inicio;

  const anteriorFin = new Date(inicio.getTime() - 1); // día antes del inicio
  const anteriorInicio = new Date(anteriorFin.getTime() - duracion);

  return {
    fechaInicio: anteriorInicio.toISOString().split('T')[0],
    fechaFin: anteriorFin.toISOString().split('T')[0]
  };
};

// Dashboard Ejecutivo con KPIs y comparativas
export const getDashboardReport = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ error: "Parámetros 'fechaInicio' y 'fechaFin' requeridos" });
  }

  try {
    const periodoAnterior = calcularPeriodoAnterior(fechaInicio, fechaFin);

    const [kpisActual, kpisAnterior, tendencia, metodosPago, ventasPorDia] = await Promise.all([
      getDashboardKPIs(fechaInicio, fechaFin),
      getDashboardKPIs(periodoAnterior.fechaInicio, periodoAnterior.fechaFin),
      getSalesTrend(fechaInicio, fechaFin),
      getPaymentMethodsInRange(fechaInicio, fechaFin),
      getDayOfWeekSales(fechaInicio, fechaFin)
    ]);

    // Calcular porcentajes de cambio
    const calcularCambio = (actual, anterior) => {
      if (!anterior || anterior === 0) return actual > 0 ? 100 : 0;
      return parseFloat((((actual - anterior) / anterior) * 100).toFixed(2));
    };

    res.json({
      periodo_actual: {
        ventas_totales: parseFloat(kpisActual.ventas_totales) || 0,
        total_ordenes: parseInt(kpisActual.total_ordenes) || 0,
        ticket_promedio: parseFloat(kpisActual.ticket_promedio) || 0,
        clientes_unicos: parseInt(kpisActual.clientes_unicos) || 0,
        propinas_totales: parseFloat(kpisActual.propinas_totales) || 0
      },
      periodo_anterior: {
        ventas_totales: parseFloat(kpisAnterior.ventas_totales) || 0,
        total_ordenes: parseInt(kpisAnterior.total_ordenes) || 0,
        ticket_promedio: parseFloat(kpisAnterior.ticket_promedio) || 0,
        clientes_unicos: parseInt(kpisAnterior.clientes_unicos) || 0,
        propinas_totales: parseFloat(kpisAnterior.propinas_totales) || 0
      },
      comparativa: {
        ventas_vs_anterior: calcularCambio(
          parseFloat(kpisActual.ventas_totales),
          parseFloat(kpisAnterior.ventas_totales)
        ),
        ordenes_vs_anterior: calcularCambio(
          parseInt(kpisActual.total_ordenes),
          parseInt(kpisAnterior.total_ordenes)
        ),
        ticket_vs_anterior: calcularCambio(
          parseFloat(kpisActual.ticket_promedio),
          parseFloat(kpisAnterior.ticket_promedio)
        ),
        clientes_vs_anterior: calcularCambio(
          parseInt(kpisActual.clientes_unicos),
          parseInt(kpisAnterior.clientes_unicos)
        )
      },
      tendencia: tendencia.map(t => ({
        fecha: t.fecha,
        ventas: parseFloat(t.ventas) || 0,
        ordenes: parseInt(t.ordenes) || 0
      })),
      metodos_pago: metodosPago.map(m => ({
        metodo: m.metodo,
        total_ordenes: parseInt(m.total_ordenes) || 0,
        total_ventas: parseFloat(m.total_ventas) || 0,
        total_propinas: parseFloat(m.total_propinas) || 0
      })),
      ventas_por_dia: ventasPorDia.map(d => ({
        dia_num: parseInt(d.dia_num),
        dia_nombre: d.dia_nombre,
        total_ordenes: parseInt(d.total_ordenes) || 0,
        total_ventas: parseFloat(d.total_ventas) || 0,
        dias_operados: parseInt(d.dias_operados) || 1,
        promedio_ventas: parseFloat(d.total_ventas) / (parseInt(d.dias_operados) || 1)
      }))
    });
  } catch (err) {
    console.error("Error en getDashboardReport:", err);
    res.status(500).json({ error: "Error generando dashboard", detail: err.message });
  }
};

// Reporte de desempeño de empleados
export const getEmpleadosReport = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ error: "Parámetros 'fechaInicio' y 'fechaFin' requeridos" });
  }

  try {
    const [meseros, ordenesCreadas, cocineros] = await Promise.all([
      getMeserosPerformance(fechaInicio, fechaFin),
      getOrdenesCreatedByEmpleado(fechaInicio, fechaFin),
      getCocinerosPerformance(fechaInicio, fechaFin)
    ]);

    // Combinar datos de meseros
    const meserosCompletos = meseros.map(m => {
      const ordenesData = ordenesCreadas.find(o => o.empleado_id === m.empleado_id) || {};
      return {
        empleado_id: m.empleado_id,
        nombre: m.nombre,
        ordenes_creadas: parseInt(ordenesData.ordenes_creadas) || 0,
        ordenes_cobradas: parseInt(m.ordenes_cobradas) || 0,
        total_ventas: parseFloat(m.total_ventas) || 0,
        total_propinas: parseFloat(m.total_propinas) || 0,
        propina_promedio_pct: parseFloat(m.propina_promedio_pct) || 0,
        clientes_atendidos: parseInt(ordenesData.clientes_atendidos) || 0
      };
    });

    res.json({
      meseros: meserosCompletos,
      cocineros: cocineros.map(c => ({
        empleado_id: c.empleado_id,
        nombre: c.nombre,
        productos_preparados: parseInt(c.productos_preparados) || 0,
        tiempo_promedio_minutos: parseFloat(c.tiempo_promedio_minutos).toFixed(1) || "0.0"
      }))
    });
  } catch (err) {
    console.error("Error en getEmpleadosReport:", err);
    res.status(500).json({ error: "Error generando reporte de empleados", detail: err.message });
  }
};

// Reporte de análisis de clientes
export const getClientesReport = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const limite = parseInt(req.query.limite) || 10;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ error: "Parámetros 'fechaInicio' y 'fechaFin' requeridos" });
  }

  try {
    const [topClientes, segmentacion, frecuencia, grados] = await Promise.all([
      getTopCustomersBySpending(fechaInicio, fechaFin, limite),
      getCustomerSegmentation(fechaInicio, fechaFin),
      getVisitFrequency(fechaInicio, fechaFin),
      getGradesDistribution()
    ]);

    res.json({
      top_clientes: topClientes.map(c => ({
        preso_id: c.preso_id,
        nombre: c.nombre,
        total_visitas: parseInt(c.total_visitas) || 0,
        total_gastado: parseFloat(c.total_gastado) || 0,
        ticket_promedio: parseFloat(c.ticket_promedio) || 0,
        ultima_visita: c.ultima_visita
      })),
      segmentacion: {
        clientes_nuevos: parseInt(segmentacion?.clientes_nuevos) || 0,
        clientes_recurrentes: parseInt(segmentacion?.clientes_recurrentes) || 0,
        clientes_totales: parseInt(segmentacion?.clientes_totales) || 0
      },
      frecuencia_visitas: frecuencia.map(f => ({
        frecuencia: f.frecuencia,
        num_clientes: parseInt(f.num_clientes) || 0
      })),
      distribucion_grados: grados.map(g => ({
        grado: g.grado,
        descuento: parseFloat(g.descuento) || 0,
        num_clientes: parseInt(g.num_clientes) || 0
      }))
    });
  } catch (err) {
    console.error("Error en getClientesReport:", err);
    res.status(500).json({ error: "Error generando reporte de clientes", detail: err.message });
  }
};

// Reporte de análisis de productos
export const getProductosReport = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  const limite = parseInt(req.query.limite) || 10;

  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ error: "Parámetros 'fechaInicio' y 'fechaFin' requeridos" });
  }

  try {
    const [topProductos, categorias, bajoDesempeno, sentencias] = await Promise.all([
      getTopProductsByRevenue(fechaInicio, fechaFin, limite),
      getCategorySales(fechaInicio, fechaFin),
      getLowPerformingProducts(fechaInicio, fechaFin, limite),
      getSentenciasPerformance(fechaInicio, fechaFin)
    ]);

    res.json({
      top_productos: topProductos.map(p => ({
        producto_id: p.producto_id,
        nombre: p.nombre,
        categoria: p.categoria,
        unidades_vendidas: parseInt(p.unidades_vendidas) || 0,
        ingresos_totales: parseFloat(p.ingresos_totales) || 0,
        margen_bruto: parseFloat(p.margen_bruto) || 0
      })),
      por_categoria: categorias.map(c => ({
        categoria: c.categoria,
        unidades_vendidas: parseInt(c.unidades_vendidas) || 0,
        ingresos_totales: parseFloat(c.ingresos_totales) || 0,
        ordenes_con_categoria: parseInt(c.ordenes_con_categoria) || 0,
        porcentaje_total: parseFloat(c.porcentaje_total) || 0
      })),
      bajo_desempeno: bajoDesempeno.map(p => ({
        producto_id: p.producto_id,
        nombre: p.nombre,
        categoria: p.categoria,
        precio: parseFloat(p.precio) || 0,
        unidades_vendidas: parseInt(p.unidades_vendidas) || 0,
        ingresos_totales: parseFloat(p.ingresos_totales) || 0
      })),
      sentencias: sentencias.map(s => ({
        sentencia_id: s.sentencia_id,
        nombre: s.nombre,
        precio: parseFloat(s.precio) || 0,
        veces_vendida: parseInt(s.veces_vendida) || 0,
        ingresos_totales: parseFloat(s.ingresos_totales) || 0
      }))
    });
  } catch (err) {
    console.error("Error en getProductosReport:", err);
    res.status(500).json({ error: "Error generando reporte de productos", detail: err.message });
  }
};
