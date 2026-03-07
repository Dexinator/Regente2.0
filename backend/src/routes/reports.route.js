import express from "express";
import {
  getFinancialReport,
  getManagerReport,
  getCustomRangeReport,
  getPopularProducts,
  getDailyReport,
  getTopClientsReport,
  getDashboardReport,
  getEmpleadosReport,
  getClientesReport,
  getProductosReport
} from "../controllers/reports.controller.js";

const router = express.Router();

// Reportes existentes
router.get("/financiero", getFinancialReport);
router.get("/gerente", getManagerReport);
router.get("/ventas", getCustomRangeReport);
router.get("/productos/populares", getPopularProducts);
router.get("/detalle-dia", getDailyReport);
router.get("/presos/top", getTopClientsReport);

// Reportes avanzados
router.get("/dashboard", getDashboardReport);
router.get("/empleados/desempeno", getEmpleadosReport);
router.get("/clientes/analisis", getClientesReport);
router.get("/productos/analisis", getProductosReport);

export default router;
