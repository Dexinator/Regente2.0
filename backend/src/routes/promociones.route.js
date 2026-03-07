import express from "express";
import {
  fetchCodigos,
  fetchCodigoById,
  addCodigo,
  updateCodigoById,
  deleteCodigoById,
  validateCodigoPromo,
  applyCodigoToOrder,
  removeCodigoFromOrder
} from "../controllers/promociones.controller.js";

const router = express.Router();

// Rutas para administrar códigos promocionales
router.get("/", fetchCodigos);
router.get("/:id", fetchCodigoById);
router.post("/", addCodigo);
router.put("/:id", updateCodigoById);
router.delete("/:id", deleteCodigoById);

// Validar código
router.post("/validar", validateCodigoPromo);

// Aplicar/remover código a/de una orden
router.post("/orden/:id/aplicar", applyCodigoToOrder);
router.delete("/orden/:id/remover", removeCodigoFromOrder);

export default router; 