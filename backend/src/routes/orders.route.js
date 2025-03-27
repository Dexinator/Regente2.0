import express from "express";
import {
  fetchOrders,
  fetchOpenOrders,
  fetchOrderById,
  addOrder,
  closeOrderById,
  addProducts,
  getOrderSummary
} from "../controllers/orders.controller.js";

import { verifyToken, authorizeRoles } from "../middlewares/auth.js"; // ✅ IMPORTANTE

const router = express.Router();


router.get("/", fetchOrders);              // Todas las órdenes
router.get("/open", fetchOpenOrders);      // Solo órdenes abiertas
router.get("/:id", fetchOrderById);        // Una orden con detalles
router.post("/", addOrder);                // Crear orden
router.put("/:id/close",closeOrderById);
router.post("/:id/productos", addProducts);
router.get("/:id/resumen", getOrderSummary);

/*
router.put("/:id/close",
  verifyToken,                          // Primero verificamos el token
  authorizeRoles("admin", "mesero"),   // Luego verificamos el rol
  closeOrderById
);

*/

 // Cerrar orden

export default router;
