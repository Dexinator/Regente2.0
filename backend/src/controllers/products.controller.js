import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getSaboresByProductoId,
  getSaboresByCategoria,
  getAllCategoriaVariantes,
  getAllSabores,
  getSaborById
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

// Nuevos controladores para sabores
export const fetchSaboresByProductoId = async (req, res) => {
  const { id } = req.params;
  const { tipo } = req.query; // Obtener el parámetro tipo
  
  try {
    const sabores = await getSaboresByProductoId(id, tipo);
    res.json(sabores);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo sabores", detail: err.message });
  }
};

export const fetchSaboresByCategoria = async (req, res) => {
  try {
    const sabores = await getSaboresByCategoria(req.params.categoria);
    res.json(sabores);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo sabores por categoría", detail: err.message });
  }
};

export const fetchCategoriaVariantes = async (req, res) => {
  try {
    const categorias = await getAllCategoriaVariantes();
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo categorías de variantes", detail: err.message });
  }
};

export const fetchAllSabores = async (req, res) => {
  try {
    const sabores = await getAllSabores();
    res.json(sabores);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo todos los sabores", detail: err.message });
  }
};

export const fetchSaborById = async (req, res) => {
  try {
    const sabor = await getSaborById(req.params.id);
    if (!sabor) return res.status(404).json({ error: "Sabor no encontrado" });
    res.json(sabor);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo sabor", detail: err.message });
  }
};

// Controladores para variantes de productos
export const fetchVariantesProducto = async (req, res) => {
  try {
    const { getVariantesProducto } = await import("../models/products.model.js");
    const variantes = await getVariantesProducto(req.params.id);
    res.json(variantes);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo variantes del producto", detail: err.message });
  }
};

export const saveVariantesProducto = async (req, res) => {
  try {
    const { saveVariantesProducto } = await import("../models/products.model.js");
    const { variantes } = req.body;
    await saveVariantesProducto(req.params.id, variantes);
    res.json({ message: "Variantes guardadas exitosamente" });
  } catch (err) {
    res.status(500).json({ error: "Error guardando variantes del producto", detail: err.message });
  }
};

// Controlador para obtener tipos de variantes por categoría
export const fetchTiposVariantesPorCategoria = async (req, res) => {
  try {
    const { getTiposVariantesPorCategoria } = await import("../models/products.model.js");
    const tipos = await getTiposVariantesPorCategoria();
    res.json(tipos);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo tipos de variantes", detail: err.message });
  }
};
