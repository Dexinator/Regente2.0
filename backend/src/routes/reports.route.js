import express from "express";
import {
  getFinancialReport,
  getManagerReport,
  getCustomRangeReport,
  getPopularProducts,
  getDailyReport,
  getTopClientsReport
} from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/financiero", getFinancialReport);
router.get("/gerente", getManagerReport); // ✅ Nuevo endpoint
router.get("/ventas", getCustomRangeReport); 
router.get("/productos/populares", getPopularProducts);
router.get("/detalle-dia", getDailyReport);
router.get("/presos/top", getTopClientsReport);

export default router;
