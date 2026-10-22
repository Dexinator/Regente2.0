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
  removeCategoriaVariante,
  fetchPulquesRotacion,
  rotarSaboresPulque
} from "../controllers/variantes.controller.js";
import { verifyToken, authorizeRoles } from "../middlewares/auth.js";

const router = Router();

// Rotación semanal de sabores de pulque (antes de "/:id")
const rolesRotacion = authorizeRoles("cocinero", "gerente", "admin", "administrador");
router.get("/pulques", verifyToken, rolesRotacion, fetchPulquesRotacion);
router.post("/pulques/rotacion", verifyToken, rolesRotacion, rotarSaboresPulque);

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