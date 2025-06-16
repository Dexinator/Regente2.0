/**
 * Controlador para gestionar inventario
 */

import {
  getAllInventario,
  getInventarioByInsumo,
  updateInventario,
  ajustarInventario,
  getInventarioBajoPorProveedor,
  getEstadisticasInventario
} from "../models/inventario.model.js";

/**
 * Obtiene todo el inventario actual
 */
export const fetchInventario = async (req, res) => {
  try {
    const { categoria, bajo_minimo } = req.query;
    
    const filters = {
      categoria,
      bajo_minimo: bajo_minimo === 'true'
    };
    
    const inventario = await getAllInventario(filters);
    res.json(inventario);
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
};

/**
 * Obtiene inventario por insumo
 */
export const fetchInventarioByInsumo = async (req, res) => {
  const { insumo_id } = req.params;

  try {
    const inventario = await getInventarioByInsumo(insumo_id);
    res.json(inventario);
  } catch (error) {
    console.error('Error al obtener inventario del insumo:', error);
    res.status(500).json({ error: 'Error al obtener inventario del insumo' });
  }
};

/**
 * Actualiza o crea inventario
 */
export const editInventario = async (req, res) => {
  const { insumo_id, cantidad_actual, unidad, stock_minimo, stock_maximo } = req.body;

  // Validar campos requeridos
  if (!insumo_id || cantidad_actual === undefined || !unidad) {
    return res.status(400).json({ 
      error: 'insumo_id, cantidad_actual y unidad son obligatorios' 
    });
  }

  try {
    const inventarioActualizado = await updateInventario({
      insumo_id,
      cantidad_actual,
      unidad,
      stock_minimo,
      stock_maximo
    });
    
    res.json(inventarioActualizado);
  } catch (error) {
    console.error('Error al actualizar inventario:', error);
    res.status(500).json({ error: 'Error al actualizar inventario' });
  }
};

/**
 * Ajusta inventario (suma o resta cantidad)
 */
export const adjustInventario = async (req, res) => {
  const { insumo_id, unidad, cantidad_ajuste, motivo } = req.body;

  // Validar campos requeridos
  if (!insumo_id || !unidad || cantidad_ajuste === undefined) {
    return res.status(400).json({ 
      error: 'insumo_id, unidad y cantidad_ajuste son obligatorios' 
    });
  }

  try {
    const inventarioActualizado = await ajustarInventario(
      insumo_id, 
      unidad, 
      cantidad_ajuste, 
      motivo
    );
    
    res.json(inventarioActualizado);
  } catch (error) {
    console.error('Error al ajustar inventario:', error);
    res.status(500).json({ error: 'Error al ajustar inventario' });
  }
};

/**
 * Obtiene inventario bajo mínimo por proveedor
 */
export const fetchInventarioBajoPorProveedor = async (req, res) => {
  const { proveedor_id } = req.params;

  try {
    const inventario = await getInventarioBajoPorProveedor(proveedor_id);
    res.json(inventario);
  } catch (error) {
    console.error('Error al obtener inventario bajo del proveedor:', error);
    res.status(500).json({ error: 'Error al obtener inventario bajo del proveedor' });
  }
};

/**
 * Obtiene estadísticas de inventario
 */
export const fetchEstadisticasInventario = async (req, res) => {
  try {
    const estadisticas = await getEstadisticasInventario();
    res.json(estadisticas);
  } catch (error) {
    console.error('Error al obtener estadísticas de inventario:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de inventario' });
  }
};