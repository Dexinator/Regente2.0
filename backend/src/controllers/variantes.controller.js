import {
  getAllVariantes,
  getVarianteById,
  createVariante,
  updateVariante,
  deleteVariante,
  getAllCategoriasVariantes,
  getCategoriaVarianteById,
  createCategoriaVariante,
  updateCategoriaVariante,
  deleteCategoriaVariante
} from "../models/variantes.model.js";

// Controladores para variantes (sabores)
export const fetchVariantes = async (req, res) => {
  try {
    const variantes = await getAllVariantes();
    res.json(variantes);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo variantes", detail: err.message });
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

export const addVariante = async (req, res) => {
  try {
    const newVariante = await createVariante(req.body);
    res.status(201).json(newVariante);
  } catch (err) {
    res.status(500).json({ error: "Error creando variante", detail: err.message });
  }
};

export const editVariante = async (req, res) => {
  try {
    const updated = await updateVariante(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Variante no encontrada" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando variante", detail: err.message });
  }
};

export const removeVariante = async (req, res) => {
  try {
    const deleted = await deleteVariante(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Variante no encontrada" });
    res.json({ message: "Variante eliminada", deleted });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando variante", detail: err.message });
  }
};

// Controladores para categorías de variantes
export const fetchCategoriasVariantes = async (req, res) => {
  try {
    const categorias = await getAllCategoriasVariantes();
    res.json(categorias);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo categorías", detail: err.message });
  }
};

export const fetchCategoriaVarianteById = async (req, res) => {
  try {
    const categoria = await getCategoriaVarianteById(req.params.id);
    if (!categoria) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo categoría", detail: err.message });
  }
};

export const addCategoriaVariante = async (req, res) => {
  try {
    const newCategoria = await createCategoriaVariante(req.body);
    res.status(201).json(newCategoria);
  } catch (err) {
    res.status(500).json({ error: "Error creando categoría", detail: err.message });
  }
};

export const editCategoriaVariante = async (req, res) => {
  try {
    const updated = await updateCategoriaVariante(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando categoría", detail: err.message });
  }
};

export const removeCategoriaVariante = async (req, res) => {
  try {
    const deleted = await deleteCategoriaVariante(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Categoría no encontrada" });
    res.json({ message: "Categoría eliminada", deleted });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando categoría", detail: err.message });
  }
};