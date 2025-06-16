/**
 * Controlador para gestionar requisiciones
 */

import {
  getAllRequisiciones,
  getRequisicionById,
  createRequisicion,
  updateRequisicion,
  deleteRequisicion,
  addItemToRequisicion,
  updateItemRequisicion,
  deleteItemRequisicion
} from "../models/requisiciones.model.js";

/**
 * Obtiene todas las requisiciones
 */
export const fetchRequisiciones = async (req, res) => {
  try {
    const { completada } = req.query;
    const completadaBoolean = completada === 'true' ? true : 
                              completada === 'false' ? false : null;
    
    const requisiciones = await getAllRequisiciones(completadaBoolean);
    res.json(requisiciones);
  } catch (error) {
    console.error('Error al obtener requisiciones:', error);
    res.status(500).json({ error: 'Error al obtener requisiciones' });
  }
};

/**
 * Obtiene una requisición por ID con sus items
 */
export const fetchRequisicionById = async (req, res) => {
  const { id } = req.params;

  try {
    const requisicion = await getRequisicionById(id);

    if (!requisicion) {
      return res.status(404).json({ error: 'Requisición no encontrada' });
    }

    res.json(requisicion);
  } catch (error) {
    console.error('Error al obtener requisición:', error);
    res.status(500).json({ error: 'Error al obtener requisición' });
  }
};

/**
 * Crea una nueva requisición
 */
export const addRequisicion = async (req, res) => {
  const { usuario_id, items, notas } = req.body;

  // Validar campos requeridos
  if (!usuario_id) {
    return res.status(400).json({ error: 'El ID de usuario es obligatorio' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un item' });
  }

  try {
    const nuevaRequisicion = await createRequisicion({
      usuario_id,
      items,
      notas
    });
    
    res.status(201).json(nuevaRequisicion);
  } catch (error) {
    console.error('Error al crear requisición:', error);
    res.status(500).json({ error: 'Error al crear requisición' });
  }
};

/**
 * Actualiza una requisición existente
 */
export const editRequisicion = async (req, res) => {
  const { id } = req.params;
  const { notas, completada } = req.body;

  try {
    const requisicionActualizada = await updateRequisicion(id, {
      notas,
      completada
    });

    res.json(requisicionActualizada);
  } catch (error) {
    if (error.message === 'Requisición no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'No se proporcionaron campos para actualizar') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al actualizar requisición:', error);
    res.status(500).json({ error: 'Error al actualizar requisición' });
  }
};

/**
 * Elimina una requisición
 */
export const removeRequisicion = async (req, res) => {
  const { id } = req.params;

  try {
    const requisicionEliminada = await deleteRequisicion(id);
    
    res.json({ 
      message: 'Requisición eliminada correctamente', 
      requisicion: requisicionEliminada 
    });
  } catch (error) {
    if (error.message === 'Requisición no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'No se puede eliminar la requisición porque ya tiene compras asociadas') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al eliminar requisición:', error);
    res.status(500).json({ error: 'Error al eliminar requisición' });
  }
};

/**
 * Agrega un item a una requisición existente
 */
export const addItemRequisicion = async (req, res) => {
  const { id } = req.params;
  const { insumo_id, cantidad, unidad, urgencia } = req.body;

  // Validar campos requeridos
  if (!insumo_id || !cantidad || !unidad) {
    return res.status(400).json({ 
      error: 'insumo_id, cantidad y unidad son obligatorios' 
    });
  }

  try {
    const nuevoItem = await addItemToRequisicion(id, {
      insumo_id,
      cantidad,
      unidad,
      urgencia
    });
    
    res.status(201).json(nuevoItem);
  } catch (error) {
    if (error.message === 'Requisición no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'No se pueden agregar items a una requisición completada') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al agregar item a requisición:', error);
    res.status(500).json({ error: 'Error al agregar item a requisición' });
  }
};

/**
 * Actualiza un item de requisición
 */
export const editItemRequisicion = async (req, res) => {
  const { id, itemId } = req.params;
  const { cantidad, unidad, urgencia, completado } = req.body;

  try {
    const itemActualizado = await updateItemRequisicion(id, itemId, {
      cantidad,
      unidad,
      urgencia,
      completado
    });
    
    res.json(itemActualizado);
  } catch (error) {
    if (error.message === 'Item no encontrado en la requisición') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'No se proporcionaron campos para actualizar') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al actualizar item de requisición:', error);
    res.status(500).json({ error: 'Error al actualizar item de requisición' });
  }
};

/**
 * Elimina un item de requisición
 */
export const removeItemRequisicion = async (req, res) => {
  const { id, itemId } = req.params;

  try {
    const itemEliminado = await deleteItemRequisicion(id, itemId);
    
    res.json({ 
      message: 'Item eliminado correctamente', 
      item: itemEliminado 
    });
  } catch (error) {
    if (error.message === 'Item no encontrado en la requisición') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'No se puede eliminar el item porque ya tiene compras asociadas') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al eliminar item de requisición:', error);
    res.status(500).json({ error: 'Error al eliminar item de requisición' });
  }
}; 