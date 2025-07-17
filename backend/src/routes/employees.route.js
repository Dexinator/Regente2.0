import express from "express";
import {
  register,
  login,
  getProfile,
  setupInitialAdmin
} from "../controllers/employees.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", register);        // Registrar empleado
router.post("/login", login);      // Login
router.get("/me", verifyToken, getProfile); // Perfil autenticado
router.post("/setup-initial-admin", setupInitialAdmin); // Configuración inicial (solo para producción)

export default router;
