import express from "express";
import {
  getFinancialReport,
  getManagerReport
} from "../controllers/reports.controller.js";

const router = express.Router();

router.get("/financiero", getFinancialReport);
router.get("/gerente", getManagerReport); // ✅ Nuevo endpoint

export default router;
