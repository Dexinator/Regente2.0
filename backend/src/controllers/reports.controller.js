import {
    getMonthlySalesByProduct,
    getMonthlySalesByCategory,
    getMonthlyTotal
  } from "../models/reports.model.js";
  
  export const getFinancialReport = async (req, res) => {
    try {
      const [productos, categorias, total] = await Promise.all([
        getMonthlySalesByProduct(),
        getMonthlySalesByCategory(),
        getMonthlyTotal()
      ]);
  
      res.json({
        total_mes: parseFloat(total),
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
  