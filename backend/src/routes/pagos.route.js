import express from "express";
import {
  postPago,
  getPagosPorOrden,
  patchMetodoPago,
} from "../controllers/pagos.controller.js";

const router = express.Router();

router.post("/", postPago); // ✅ Registrar un pago
router.get("/orden/:id", getPagosPorOrden);
router.patch("/:id/metodo", patchMetodoPago); // Cambiar método (efectivo↔tarjeta↔…)

export default router;


