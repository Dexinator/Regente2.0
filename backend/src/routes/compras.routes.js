/**
 * Rutas para gestión de compras
 */

import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
  fetchCompras,
  fetchAnalisisPrecios,
  fetchItemsRequisicionPendientes,
  fetchCompraById,
  addCompra,
  editCompra,
  removeCompra,
  addItemCompra,
  editItemCompra,
  removeItemCompra,
  fetchComprasDelDia
} from '../controllers/compras.controller.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Rutas especiales (deben ir antes de las rutas con parámetros)
router.get('/analisis-precios', fetchAnalisisPrecios);
router.get('/items-requisicion-pendientes', fetchItemsRequisicionPendientes);
router.get('/dia/:dia', fetchComprasDelDia);

// Rutas para compras
router.get('/', fetchCompras);
router.get('/:id', fetchCompraById);
router.post('/', addCompra);
router.put('/:id', editCompra);
router.delete('/:id', removeCompra);

// Rutas para items de compras
router.post('/:id/items', addItemCompra);
router.put('/:id/items/:itemId', editItemCompra);
router.delete('/:id/items/:itemId', removeItemCompra);

export default router; 