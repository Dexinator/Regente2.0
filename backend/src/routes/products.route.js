import express from "express";
import {
  fetchProducts,
  fetchProductById,
  addProduct,
  editProduct,
  removeProduct
} from "../controllers/products.controller.js";

const router = express.Router();

router.get("/", fetchProducts);
router.get("/:id", fetchProductById);
router.post("/", addProduct);
router.put("/:id", editProduct);
router.delete("/:id", removeProduct);

export default router;
