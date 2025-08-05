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
  revertirEstadoProducto,
  cancelarProducto,
  fetchProductosPorEntregar,
  marcarComoEntregado,
  revertirEntrega
} from "../controllers/orders.controller.js";

// Importamos las funciones para códigos promocionales
import { 
  applyCodigoToOrder, 
  removeCodigoFromOrder 
} from "../controllers/promociones.controller.js";

import { verifyToken, authorizeRoles } from "../middlewares/auth.js"; // ✅ IMPORTANTE

const router = express.Router();

// Rutas específicas para cocina (deben ir ANTES de las rutas con :id)
router.get("/cocina", fetchProductosPorPreparar);  // Productos por preparar (nueva ruta principal)
router.get("/cocina/pendientes", fetchProductosPorPreparar);  // Mantener la ruta anterior por compatibilidad
router.get("/cocina/historial", fetchHistorialProductosPreparados); // Historial
router.get("/entregar", fetchProductosPorEntregar); // Nueva ruta para pedidos por entregar

// Rutas para preparar/despreparar productos
router.put("/detalle/:id/preparar", updateEstadoProducto);  // Marcar como preparado
router.put("/detalle/:id/despreparar", revertirEstadoProducto);  // Marcar como NO preparado
router.put("/detalle/:id", updateEstadoProducto);  // Mantener la ruta anterior por compatibilidad

// Rutas para entregar productos
router.put("/detalle/:id/entregar", marcarComoEntregado);
router.put("/detalle/:id/revertir-entrega", revertirEntrega);

// Rutas generales
router.get("/", fetchOrders);              // Todas las órdenes
router.get("/open", fetchOpenOrders);      // Solo órdenes abiertas
router.post("/", addOrder);                // Crear orden

// Rutas para códigos promocionales
router.post("/:id/promocion", applyCodigoToOrder);   // Aplicar código promocional
router.delete("/:id/promocion", removeCodigoFromOrder);   // Remover código promocional

// Rutas específicas con ID
router.get("/:id/resumen", getOrderSummary);
router.put("/:id/close", closeOrderById);
router.post("/:id/productos", addProducts);
router.post("/:id/cancelar", cancelarProducto); // Cancelar productos
router.post("/:id/cancelar-sentencia", cancelarProducto); // Cancelar sentencia completa
router.get("/:id", fetchOrderById);        // Una orden con detalles (debe ir AL FINAL)

/*
router.put("/:id/close",
  verifyToken,                          // Primero verificamos el token
  authorizeRoles("admin", "mesero"),   // Luego verificamos el rol
  closeOrderById
);
*/

export default router;
