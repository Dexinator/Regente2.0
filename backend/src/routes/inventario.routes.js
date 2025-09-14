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
  fetchEstadisticasInventario,
  updateNiveles,
  fetchAlertas,
  markAlertaAtendida,
  fetchMovimientos,
  fetchSugerenciasReorden
} from '../controllers/inventario.controller.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Rutas especiales (deben ir antes de las rutas con parámetros)
router.get('/estadisticas', fetchEstadisticasInventario);
router.get('/alertas', fetchAlertas);
router.put('/alertas/:id/atender', markAlertaAtendida);
router.get('/movimientos', fetchMovimientos);
router.get('/sugerencias-reorden', fetchSugerenciasReorden);
router.get('/proveedor/:proveedor_id/bajo-minimo', fetchInventarioBajoPorProveedor);

// Rutas para inventario
router.get('/', fetchInventario);
router.get('/insumo/:insumo_id', fetchInventarioByInsumo);
router.put('/', editInventario);
router.post('/ajustar', adjustInventario);
router.put('/:insumo_id/:unidad/niveles', updateNiveles);

export default router;