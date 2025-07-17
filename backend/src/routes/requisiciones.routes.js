/**
 * Rutas para gestión de requisiciones
 */

import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
  fetchRequisiciones,
  fetchRequisicionById,
  addRequisicion,
  editRequisicion,
  removeRequisicion,
  addItemRequisicion,
  editItemRequisicion,
  removeItemRequisicion
} from '../controllers/requisiciones.controller.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Rutas para requisiciones
router.get('/', fetchRequisiciones);
router.get('/:id', fetchRequisicionById);
router.post('/', addRequisicion);
router.put('/:id', editRequisicion);
router.delete('/:id', removeRequisicion);

// Rutas para items de requisiciones
router.post('/:id/items', addItemRequisicion);
router.put('/:id/items/:itemId', editItemRequisicion);
router.delete('/:id/items/:itemId', removeItemRequisicion);

export default router; 