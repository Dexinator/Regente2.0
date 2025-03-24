import express from "express";
import {
  register,
  login,
  getProfile
} from "../controllers/employees.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = express.Router();

router.post("/", register);        // Registrar empleado
router.post("/login", login);      // Login
router.get("/me", verifyToken, getProfile); // Perfil autenticado

export default router;
