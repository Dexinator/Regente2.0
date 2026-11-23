import express from "express";
import { verifyToken, authorizeRoles, verifyPrinterToken } from "../middlewares/auth.js";
import {
  imprimirCuenta,
  obtenerPendientes,
  confirmarImpresion,
  estadoImpresora
} from "../controllers/impresion.controller.js";

const router = express.Router();

// Meseras/admin/gerente mandan a imprimir la cuenta de una orden
router.post("/cuenta/:ordenId", verifyToken, authorizeRoles("admin", "mesero", "gerente"), imprimirCuenta);

// Estado de la impresora para el frontend
router.get("/estado", verifyToken, estadoImpresora);

// Endpoints que consume el puente (PC del bar) con X-Printer-Token
router.get("/pendientes", verifyPrinterToken, obtenerPendientes);
router.post("/trabajos/:id/confirmar", verifyPrinterToken, confirmarImpresion);

export default router;
