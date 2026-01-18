/**
 * Rutas para gestión de unidades de medida
 */

import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
  fetchUnidades,
  fetchUnidadById,
  addUnidad,
  editUnidad,
  removeUnidad
} from '../controllers/unidades.controller.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Rutas para unidades de medida
router.get('/', fetchUnidades);
router.get('/:id', fetchUnidadById);
router.post('/', addUnidad);
router.put('/:id', editUnidad);
router.delete('/:id', removeUnidad);

export default router;
