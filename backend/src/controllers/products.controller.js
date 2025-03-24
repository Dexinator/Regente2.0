import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../models/products.model.js";

export const fetchProducts = async (req, res) => {
  const products = await getAllProducts();
  res.json(products);
};

export const fetchProductById = async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(product);
};

export const addProduct = async (req, res) => {
  const newProduct = await createProduct(req.body);
  res.status(201).json(newProduct);
};

export const editProduct = async (req, res) => {
  const updated = await updateProduct(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Producto no encontrado" });
  res.json(updated);
};

export const removeProduct = async (req, res) => {
  const deleted = await deleteProduct(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Producto no encontrado" });
  res.json({ message: "Producto eliminado", deleted });
};
