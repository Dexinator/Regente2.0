/**
 * Controlador para gestionar inventario
 */

import {
  getAllInventario,
  getInventarioByInsumo,
  updateInventario,
  ajustarInventario,
  getInventarioBajoPorProveedor,
  getEstadisticasInventario,
  updateNivelesInventario,
  getAlertasInventario,
  atenderAlerta,
  getMovimientosInventario,
  getSugerenciasReorden
} from "../models/inventario.model.js";

/**
 * Obtiene todo el inventario actual
 */
export const fetchInventario = async (req, res) => {
  try {
    const { categoria, bajo_minimo, estado_stock, con_alertas } = req.query;

    const filters = {
      categoria,
      bajo_minimo: bajo_minimo === 'true',
      estado_stock,
      con_alertas
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

/**
 * Actualiza niveles de inventario (stock mínimo, máximo, punto de reorden)
 */
export const updateNiveles = async (req, res) => {
  const { insumo_id, unidad } = req.params;
  const { stock_minimo, stock_maximo, punto_reorden, tiempo_entrega_dias } = req.body;

  try {
    const inventarioActualizado = await updateNivelesInventario(
      insumo_id,
      unidad,
      { stock_minimo, stock_maximo, punto_reorden, tiempo_entrega_dias }
    );

    res.json(inventarioActualizado);
  } catch (error) {
    console.error('Error al actualizar niveles:', error);
    res.status(500).json({ error: 'Error al actualizar niveles de inventario' });
  }
};

/**
 * Obtiene alertas de inventario
 */
export const fetchAlertas = async (req, res) => {
  try {
    const { atendidas = 'false' } = req.query;
    const alertas = await getAlertasInventario(atendidas === 'true');
    res.json(alertas);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    res.status(500).json({ error: 'Error al obtener alertas de inventario' });
  }
};

/**
 * Marca una alerta como atendida
 */
export const markAlertaAtendida = async (req, res) => {
  const { id } = req.params;
  const { usuario_id } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ error: 'usuario_id es obligatorio' });
  }

  try {
    const alertaActualizada = await atenderAlerta(id, usuario_id);
    res.json(alertaActualizada);
  } catch (error) {
    if (error.message === 'Alerta no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al atender alerta:', error);
    res.status(500).json({ error: 'Error al atender alerta' });
  }
};

/**
 * Obtiene movimientos de inventario
 */
export const fetchMovimientos = async (req, res) => {
  try {
    const { insumo_id, tipo_movimiento, fecha_inicio, fecha_fin, limit } = req.query;

    const filters = {
      insumo_id: insumo_id ? parseInt(insumo_id) : null,
      tipo_movimiento,
      fecha_inicio,
      fecha_fin,
      limit: limit ? parseInt(limit) : null
    };

    const movimientos = await getMovimientosInventario(filters);
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener movimientos de inventario' });
  }
};

/**
 * Obtiene sugerencias de reorden
 */
export const fetchSugerenciasReorden = async (req, res) => {
  try {
    const sugerencias = await getSugerenciasReorden();
    res.json(sugerencias);
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({ error: 'Error al obtener sugerencias de reorden' });
  }
};