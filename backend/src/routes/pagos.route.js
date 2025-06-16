import express from "express";
import { postPago } from "../controllers/pagos.controller.js";
import { getPagosPorOrden } from "../controllers/pagos.controller.js";

const router = express.Router();

router.post("/", postPago); // ✅ Registrar un pago
router.get("/orden/:id", getPagosPorOrden);

export default router;


