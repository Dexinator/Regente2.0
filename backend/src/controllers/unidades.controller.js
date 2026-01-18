/**
 * Controlador para gestionar unidades de medida
 */

import {
  getAllUnidades,
  getUnidadById,
  createUnidad,
  updateUnidad,
  deleteUnidad
} from "../models/unidades.model.js";

/**
 * Obtiene todas las unidades de medida
 */
export const fetchUnidades = async (req, res) => {
  try {
    const unidades = await getAllUnidades();
    res.json(unidades);
  } catch (error) {
    console.error('Error al obtener unidades:', error);
    res.status(500).json({ error: 'Error al obtener unidades de medida' });
  }
};

/**
 * Obtiene una unidad por ID
 */
export const fetchUnidadById = async (req, res) => {
  const { id } = req.params;

  try {
    const unidad = await getUnidadById(id);

    if (!unidad) {
      return res.status(404).json({ error: 'Unidad no encontrada' });
    }

    res.json(unidad);
  } catch (error) {
    console.error('Error al obtener unidad:', error);
    res.status(500).json({ error: 'Error al obtener unidad' });
  }
};

/**
 * Crea una nueva unidad de medida
 */
export const addUnidad = async (req, res) => {
  const { nombre, abreviatura, categoria } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const nuevaUnidad = await createUnidad({ nombre, abreviatura, categoria });
    res.status(201).json(nuevaUnidad);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Ya existe una unidad con este nombre' });
    }
    console.error('Error al crear unidad:', error);
    res.status(500).json({ error: 'Error al crear unidad' });
  }
};

/**
 * Actualiza una unidad de medida
 */
export const editUnidad = async (req, res) => {
  const { id } = req.params;
  const { nombre, abreviatura, categoria, activo } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    const unidadActualizada = await updateUnidad(id, { nombre, abreviatura, categoria, activo });

    if (!unidadActualizada) {
      return res.status(404).json({ error: 'Unidad no encontrada' });
    }

    res.json(unidadActualizada);
  } catch (error) {
    console.error('Error al actualizar unidad:', error);
    res.status(500).json({ error: 'Error al actualizar unidad' });
  }
};

/**
 * Elimina una unidad de medida
 */
export const removeUnidad = async (req, res) => {
  const { id } = req.params;

  try {
    const unidadEliminada = await deleteUnidad(id);

    if (!unidadEliminada) {
      return res.status(404).json({ error: 'Unidad no encontrada' });
    }

    res.json({ message: 'Unidad desactivada correctamente', unidad: unidadEliminada });
  } catch (error) {
    console.error('Error al eliminar unidad:', error);
    res.status(500).json({ error: 'Error al eliminar unidad' });
  }
};
