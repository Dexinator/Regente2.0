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
  fetchSaborById
} from "../controllers/products.controller.js";

const router = Router();

// Rutas de productos
router.get("/", fetchProducts);
router.get("/:id", fetchProductById);
router.post("/", addProduct);
router.put("/:id", editProduct);
router.delete("/:id", removeProduct);

// Nuevas rutas para sabores
router.get("/sabores/producto/:id", fetchSaboresByProductoId);
router.get("/sabores/categoria/:categoria", fetchSaboresByCategoria);
router.get("/sabores/categorias", fetchCategoriaVariantes);
router.get("/sabores/todos", fetchAllSabores);
router.get("/sabores/:id", fetchSaborById);

export default router;
