/**
 * Rutas para gestión de proveedores
 */

import express from 'express';
import { verifyToken } from '../middlewares/auth.js';
import {
  fetchProveedores,
  fetchProveedorById,
  addProveedor,
  editProveedor,
  removeProveedor,
  fetchInsumosByProveedor
} from '../controllers/proveedores.controller.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// Rutas para proveedores
router.get('/', fetchProveedores);
router.get('/:id', fetchProveedorById);
router.post('/', addProveedor);
router.put('/:id', editProveedor);
router.delete('/:id', removeProveedor);

// Ruta para obtener insumos de un proveedor
router.get('/:id/insumos', fetchInsumosByProveedor);

export default router; 