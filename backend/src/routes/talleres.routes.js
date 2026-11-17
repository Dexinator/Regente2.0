import express from "express";
import { verifyToken, authorizeRoles } from "../middlewares/auth.js";
import {
  fetchTalleresPublicos,
  fetchTallerPublico,
  registrar,
  limitarRegistros,
  fetchTalleres,
  addTaller,
  updateTallerById,
  deleteTallerById,
  fetchRegistros,
  deleteRegistroById,
} from "../controllers/talleres.controller.js";

const router = express.Router();

// Públicas: las consume el sitio de registro a talleres (sin login)
router.get("/public", fetchTalleresPublicos);
router.get("/public/:slug", fetchTallerPublico);
router.post("/public/:slug/registrar", limitarRegistros, registrar);

// Admin: panel /gerente/talleres
const soloGerencia = [verifyToken, authorizeRoles("gerente", "admin", "administrador")];

router.get("/registros", soloGerencia, fetchRegistros);
router.delete("/registros/:id", soloGerencia, deleteRegistroById);

router.get("/", soloGerencia, fetchTalleres);
router.post("/", soloGerencia, addTaller);
router.patch("/:id", soloGerencia, updateTallerById);
router.delete("/:id", soloGerencia, deleteTallerById);

export default router;
