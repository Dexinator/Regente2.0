import express from "express";
import {
  fetchOrders,
  fetchOpenOrders,
  fetchOrderById,
  addOrder,
  closeOrderById
} from "../controllers/orders.controller.js";

const router = express.Router();

router.get("/", fetchOrders);              // Todas las órdenes
router.get("/open", fetchOpenOrders);      // Solo órdenes abiertas
router.get("/:id", fetchOrderById);        // Una orden con detalles
router.post("/", addOrder);                // Crear orden
router.put("/:id/close", closeOrderById);  // Cerrar orden

export default router;
