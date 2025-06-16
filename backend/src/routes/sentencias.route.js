import express from "express";
import {
  fetchSentencias,
  fetchSentenciaById,
  fetchProductosSentencia,
  addSentencia,
  updateSentencia,
  deleteSentencia
} from "../controllers/sentencias.controller.js";

const router = express.Router();

// Rutas para sentencias
router.get("/", fetchSentencias);
router.get("/:id", fetchSentenciaById);
router.get("/:id/productos", fetchProductosSentencia);
router.post("/", addSentencia);
router.put("/:id", updateSentencia);
router.delete("/:id", deleteSentencia);

export default router; 