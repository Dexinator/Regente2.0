/**
 * Controlador para gestión de recetas
 */

import {
  getAllRecetas,
  getRecetaById,
  getRecetaByProductoId,
  createReceta,
  updateReceta,
  deleteReceta,
  calcularCostoReceta,
  verificarDisponibilidadReceta
} from "../models/recetas.model.js";

/**
 * Obtiene todas las recetas
 */
export const fetchRecetas = async (req, res) => {
  try {
    const { activa, categoria_id } = req.query;

    const filters = {
      activa: activa !== undefined ? activa === 'true' : undefined,
      categoria_id: categoria_id ? parseInt(categoria_id) : null
    };

    const recetas = await getAllRecetas(filters);
    res.json(recetas);
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    res.status(500).json({ error: 'Error al obtener recetas' });
  }
};

/**
 * Obtiene una receta por ID
 */
export const fetchRecetaById = async (req, res) => {
  const { id } = req.params;

  try {
    const receta = await getRecetaById(id);

    if (!receta) {
      return res.status(404).json({ error: 'Receta no encontrada' });
    }

    res.json(receta);
  } catch (error) {
    console.error('Error al obtener receta:', error);
    res.status(500).json({ error: 'Error al obtener receta' });
  }
};

/**
 * Obtiene la receta de un producto
 */
export const fetchRecetaByProducto = async (req, res) => {
  const { productoId } = req.params;

  try {
    const receta = await getRecetaByProductoId(productoId);

    if (!receta) {
      return res.status(404).json({ error: 'No hay receta para este producto' });
    }

    res.json(receta);
  } catch (error) {
    console.error('Error al obtener receta del producto:', error);
    res.status(500).json({ error: 'Error al obtener receta del producto' });
  }
};

/**
 * Crea una nueva receta
 */
export const addReceta = async (req, res) => {
  const {
    producto_id,
    nombre_receta,
    descripcion,
    rendimiento,
    ingredientes
  } = req.body;

  // Validar campos requeridos
  if (!producto_id || !ingredientes || !Array.isArray(ingredientes) || ingredientes.length === 0) {
    return res.status(400).json({
      error: 'producto_id e ingredientes son obligatorios'
    });
  }

  // Validar cada ingrediente
  for (const ingrediente of ingredientes) {
    if (!ingrediente.insumo_id || !ingrediente.cantidad || !ingrediente.unidad) {
      return res.status(400).json({
        error: 'Cada ingrediente debe tener insumo_id, cantidad y unidad'
      });
    }
  }

  try {
    const nuevaReceta = await createReceta({
      producto_id,
      nombre_receta,
      descripcion,
      rendimiento,
      ingredientes
    });

    res.status(201).json(nuevaReceta);
  } catch (error) {
    console.error('Error al crear receta:', error);
    res.status(500).json({ error: 'Error al crear receta' });
  }
};

/**
 * Actualiza una receta
 */
export const editReceta = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_receta,
    descripcion,
    rendimiento,
    activa,
    ingredientes
  } = req.body;

  // Validar ingredientes si se proporcionan
  if (ingredientes !== undefined) {
    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      return res.status(400).json({
        error: 'Los ingredientes deben ser un array no vacío'
      });
    }

    for (const ingrediente of ingredientes) {
      if (!ingrediente.insumo_id || !ingrediente.cantidad || !ingrediente.unidad) {
        return res.status(400).json({
          error: 'Cada ingrediente debe tener insumo_id, cantidad y unidad'
        });
      }
    }
  }

  try {
    const recetaActualizada = await updateReceta(id, {
      nombre_receta,
      descripcion,
      rendimiento,
      activa,
      ingredientes
    });

    res.json(recetaActualizada);
  } catch (error) {
    if (error.message === 'Receta no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al actualizar receta:', error);
    res.status(500).json({ error: 'Error al actualizar receta' });
  }
};

/**
 * Elimina una receta
 */
export const removeReceta = async (req, res) => {
  const { id } = req.params;

  try {
    const recetaEliminada = await deleteReceta(id);

    res.json({
      message: 'Receta eliminada correctamente',
      receta: recetaEliminada
    });
  } catch (error) {
    if (error.message === 'Receta no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al eliminar receta:', error);
    res.status(500).json({ error: 'Error al eliminar receta' });
  }
};

/**
 * Calcula el costo de una receta
 */
export const fetchCostoReceta = async (req, res) => {
  const { id } = req.params;

  try {
    const costo = await calcularCostoReceta(id);
    res.json(costo);
  } catch (error) {
    console.error('Error al calcular costo:', error);
    res.status(500).json({ error: 'Error al calcular costo de receta' });
  }
};

/**
 * Verifica disponibilidad de ingredientes
 */
export const checkDisponibilidadReceta = async (req, res) => {
  const { id } = req.params;
  const { cantidad = 1 } = req.query;

  try {
    const disponibilidad = await verificarDisponibilidadReceta(id, parseInt(cantidad));
    res.json(disponibilidad);
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    res.status(500).json({ error: 'Error al verificar disponibilidad' });
  }
};