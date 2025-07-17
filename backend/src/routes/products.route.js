import { Router } from "express";
import {
  fetchProducts,
  fetchProductById,
  addProduct,
  editProduct,
  removeProduct,
  fetchSaboresByProductoId,
  fetchSaboresByCategoria,
  fetchCategoriaVariantes,
  fetchAllSabores,
  fetchSaborById,
  fetchVariantesProducto,
  saveVariantesProducto,
  fetchTiposVariantesPorCategoria
} from "../controllers/products.controller.js";

const router = Router();

// Rutas de productos - ORDEN IMPORTANTE: rutas específicas antes de rutas con parámetros
router.get("/", fetchProducts);
router.get("/categoria-tipos", fetchTiposVariantesPorCategoria);
router.get("/sabores/todos", fetchAllSabores);
router.get("/sabores/categorias", fetchCategoriaVariantes);
router.get("/sabores/producto/:id", fetchSaboresByProductoId);
router.get("/sabores/categoria/:categoria", fetchSaboresByCategoria);
router.get("/sabores/:id", fetchSaborById);
router.get("/:id/variantes", fetchVariantesProducto);
router.get("/:id", fetchProductById);
router.post("/", addProduct);
router.post("/:id/variantes", saveVariantesProducto);
router.put("/:id", editProduct);
router.delete("/:id", removeProduct);

export default router;
