/**
 * Rutas para gestión de inventario
 */

import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
  fetchInventario,
  fetchInventarioByInsumo,
  editInventario,
  adjustInventario,
  fetchInventarioBajoPorProveedor,
  fetchEstadisticasInventario
} from '../controllers/inventario.controller.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Rutas especiales (deben ir antes de las rutas con parámetros)
router.get('/estadisticas', fetchEstadisticasInventario);
router.get('/proveedor/:proveedor_id/bajo-minimo', fetchInventarioBajoPorProveedor);

// Rutas para inventario
router.get('/', fetchInventario);
router.get('/insumo/:insumo_id', fetchInventarioByInsumo);
router.put('/', editInventario);
router.post('/ajustar', adjustInventario);

export default router;