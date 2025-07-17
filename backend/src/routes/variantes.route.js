import { Router } from "express";
import {
  fetchVariantes,
  fetchVarianteById,
  addVariante,
  editVariante,
  removeVariante,
  fetchCategoriasVariantes,
  fetchCategoriaVarianteById,
  addCategoriaVariante,
  editCategoriaVariante,
  removeCategoriaVariante
} from "../controllers/variantes.controller.js";

const router = Router();

// Rutas para variantes
router.get("/", fetchVariantes);
router.get("/categorias", fetchCategoriasVariantes);
router.get("/categorias/:id", fetchCategoriaVarianteById);
router.get("/:id", fetchVarianteById);
router.post("/", addVariante);
router.post("/categorias", addCategoriaVariante);
router.put("/:id", editVariante);
router.put("/categorias/:id", editCategoriaVariante);
router.delete("/:id", removeVariante);
router.delete("/categorias/:id", removeCategoriaVariante);

export default router;