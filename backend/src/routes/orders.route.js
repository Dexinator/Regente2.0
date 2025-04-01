import express from "express";
import {
  fetchOrders,
  fetchOpenOrders,
  fetchOrderById,
  addOrder,
  closeOrderById,
  addProducts,
  getOrderSummary,
  fetchProductosPorPreparar,
  fetchHistorialProductosPreparados,
  updateEstadoProducto,
  cancelarProducto
} from "../controllers/orders.controller.js";

import { verifyToken, authorizeRoles } from "../middlewares/auth.js"; // ✅ IMPORTANTE

const router = express.Router();


router.get("/", fetchOrders);              // Todas las órdenes
router.get("/open", fetchOpenOrders);      // Solo órdenes abiertas
router.get("/:id", fetchOrderById);        // Una orden con detalles
router.post("/", addOrder);                // Crear orden
router.put("/:id/close",closeOrderById);
router.post("/:id/productos", addProducts);
router.post("/:id/cancelar", cancelarProducto); // Cancelar productos
router.get("/:id/resumen", getOrderSummary);

// Nuevas rutas para la cocina
router.get("/cocina/pendientes", fetchProductosPorPreparar);  // Productos por preparar
router.get("/cocina/historial", fetchHistorialProductosPreparados); // Historial
router.put("/detalle/:id", updateEstadoProducto);  // Actualizar estado de un producto

/*
router.put("/:id/close",
  verifyToken,                          // Primero verificamos el token
  authorizeRoles("admin", "mesero"),   // Luego verificamos el rol
  closeOrderById
);

*/

export default router;
