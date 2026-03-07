/**
 * Rutas para gestión de insumos
 */

import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
  fetchInsumos,
  fetchCategoriasInsumos,
  fetchInsumoById,
  addInsumo,
  editInsumo,
  removeInsumo
} from '../controllers/insumos.controller.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Rutas para insumos
router.get('/', fetchInsumos);
router.get('/categorias', fetchCategoriasInsumos);
router.get('/:id', fetchInsumoById);
router.post('/', addInsumo);
router.put('/:id', editInsumo);
router.delete('/:id', removeInsumo);

export default router; 