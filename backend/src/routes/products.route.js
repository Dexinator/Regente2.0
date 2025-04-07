import { Router } from "express";
import {
  fetchProducts,
  fetchProductById,
  addProduct,
  editProduct,
  removeProduct,
  fetchVariantesByProductoId,
  fetchVariantesByCategoria,
  fetchCategoriaVariantes,
  fetchAllVariantes,
  fetchVarianteById
} from "../controllers/products.controller.js";

const router = Router();

// Rutas de productos
router.get("/", fetchProducts);
router.get("/:id", fetchProductById);
router.post("/", addProduct);
router.put("/:id", editProduct);
router.delete("/:id", removeProduct);

// Rutas para variantes (antes sabores)
router.get("/variantes/producto/:id", fetchVariantesByProductoId);
router.get("/variantes/categoria/:categoria", fetchVariantesByCategoria);
router.get("/variantes/categorias", fetchCategoriaVariantes);
router.get("/variantes/todas", fetchAllVariantes);
router.get("/variantes/:id", fetchVarianteById);

export default router;
