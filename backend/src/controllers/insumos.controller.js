/**
 * Controlador para gestionar insumos
 */

import {
  getAllInsumos,
  getInsumoById,
  createInsumo,
  updateInsumo,
  deleteInsumo,
  getCategoriasInsumos
} from "../models/insumos.model.js";

/**
 * Obtiene todos los insumos
 */
export const fetchInsumos = async (req, res) => {
  try {
    const { categoria } = req.query;
    const insumos = await getAllInsumos(categoria);
    res.json(insumos);
  } catch (error) {
    console.error('Error al obtener insumos:', error);
    res.status(500).json({ error: 'Error al obtener insumos' });
  }
};

/**
 * Obtiene un insumo por ID
 */
export const fetchInsumoById = async (req, res) => {
  const { id } = req.params;

  try {
    const insumo = await getInsumoById(id);

    if (!insumo) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    res.json(insumo);
  } catch (error) {
    console.error('Error al obtener insumo:', error);
    res.status(500).json({ error: 'Error al obtener insumo' });
  }
};

/**
 * Crea un nuevo insumo
 */
export const addInsumo = async (req, res) => {
  const { 
    nombre, 
    descripcion, 
    categoria, 
    marca,
    unidad_medida_default,
    cantidad_por_unidad,
    proveedores 
  } = req.body;

  // Validar campos requeridos
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const nuevoInsumo = await createInsumo({
      nombre,
      descripcion,
      categoria,
      marca,
      unidad_medida_default,
      cantidad_por_unidad,
      proveedores
    });
    
    res.status(201).json(nuevoInsumo);
  } catch (error) {
    if (error.message === 'Ya existe un insumo con este nombre') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al crear insumo:', error);
    res.status(500).json({ error: 'Error al crear insumo' });
  }
};

/**
 * Actualiza un insumo existente
 */
export const editInsumo = async (req, res) => {
  const { id } = req.params;
  const { 
    nombre, 
    descripcion, 
    categoria, 
    marca,
    unidad_medida_default,
    cantidad_por_unidad,
    proveedores,
    activo
  } = req.body;

  // Validar campos requeridos
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const insumoActualizado = await updateInsumo(id, {
      nombre,
      descripcion,
      categoria,
      marca,
      unidad_medida_default,
      cantidad_por_unidad,
      proveedores,
      activo
    });

    res.json(insumoActualizado);
  } catch (error) {
    if (error.message === 'Ya existe otro insumo con este nombre') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Insumo no encontrado') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al actualizar insumo:', error);
    res.status(500).json({ error: 'Error al actualizar insumo' });
  }
};

/**
 * Elimina un insumo (desactivación lógica)
 */
export const removeInsumo = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteInsumo(id);

    if (!result.insumo) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    if (result.desactivado) {
      return res.json({ 
        message: 'Insumo desactivado correctamente', 
        insumo: result.insumo 
      });
    } else {
      return res.json({ 
        message: 'Insumo eliminado correctamente', 
        insumo: result.insumo 
      });
    }
  } catch (error) {
    console.error('Error al eliminar insumo:', error);
    res.status(500).json({ error: 'Error al eliminar insumo' });
  }
};

/**
 * Obtiene las categorías únicas de insumos
 */
export const fetchCategoriasInsumos = async (req, res) => {
  try {
    const categorias = await getCategoriasInsumos();
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías de insumos:', error);
    res.status(500).json({ error: 'Error al obtener categorías de insumos' });
  }
}; 