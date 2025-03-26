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
    getSalesByCategoryAndRange,
    getTotalByRange
  } from "../models/reports.model.js";
  
  export const getManagerReport = async (req, res) => {
    try {
      const [dia, semana, mes] = await Promise.all([
        Promise.all([
          getTotalByRange("day"),
          getSalesByCategoryAndRange("day")
        ]),
        Promise.all([
          getTotalByRange("week"),
          getSalesByCategoryAndRange("week")
        ]),
        Promise.all([
          getTotalByRange("month"),
          getSalesByCategoryAndRange("month")
        ])
      ]);
  
      res.json({
        dia: {
          total: dia[0],
          por_categoria: dia[1]
        },
        semana: {
          total: semana[0],
          por_categoria: semana[1]
        },
        mes: {
          total: mes[0],
          por_categoria: mes[1]
        }
      });
    } catch (err) {
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
