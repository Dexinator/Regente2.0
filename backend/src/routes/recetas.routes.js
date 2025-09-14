/**
 * Rutas para gestión de recetas
 */

import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
  fetchRecetas,
  fetchRecetaById,
  fetchRecetaByProducto,
  addReceta,
  editReceta,
  removeReceta,
  fetchCostoReceta,
  checkDisponibilidadReceta
} from '../controllers/recetas.controller.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Rutas especiales (deben ir antes de las rutas con parámetros)
router.get('/producto/:productoId', fetchRecetaByProducto);
router.get('/:id/costo', fetchCostoReceta);
router.get('/:id/disponibilidad', checkDisponibilidadReceta);

// Rutas CRUD básicas
router.get('/', fetchRecetas);
router.get('/:id', fetchRecetaById);
router.post('/', addReceta);
router.put('/:id', editReceta);
router.delete('/:id', removeReceta);

export default router;