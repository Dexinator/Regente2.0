import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getVariantesByProductoId,
  getVariantesByCategoria,
  getAllCategoriaVariantes,
  getAllVariantes,
  getVarianteById
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

// Controladores para variantes (antes sabores)
export const getVariantesByProductoId = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo } = req.query;
    
    console.log(`Solicitud de variantes para producto ${id}, tipo: ${tipo || 'todas'}`);

    // Si es sabor, debemos asegurarnos de incluir todos los tipos de sabores (pulque_sabor o sabor_comida)
    let resultados;

    if (tipo === 'sabor') {
      // Para sabores, buscamos tanto pulque_sabor como sabor_comida
      resultados = await getVariantesByProductoId(id, tipo);
      console.log(`Encontradas ${resultados.length} variantes de sabor`);
    } else {
      // Para otros tipos (tamaño, ingredientes), comportamiento normal
      resultados = await getVariantesByProductoId(id, tipo);
      console.log(`Encontradas ${resultados.length} variantes de tipo ${tipo || 'todas'}`);
    }

    return res.status(200).json(resultados);
  } catch (error) {
    console.error('Error en getVariantesByProductoId:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const fetchVariantesByCategoria = async (req, res) => {
  try {
    const variantes = await getVariantesByCategoria(req.params.categoria);
    res.json(variantes);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo variantes por categoría", detail: err.message });
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

export const fetchAllVariantes = async (req, res) => {
  try {
    const variantes = await getAllVariantes();
    res.json(variantes);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo todas las variantes", detail: err.message });
  }
};

export const fetchVarianteById = async (req, res) => {
  try {
    const variante = await getVarianteById(req.params.id);
    if (!variante) return res.status(404).json({ error: "Variante no encontrada" });
    res.json(variante);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo variante", detail: err.message });
  }
};
