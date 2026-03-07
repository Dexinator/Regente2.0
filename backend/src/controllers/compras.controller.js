/**
 * Controlador para gestionar compras
 */

import {
  getAllCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra,
  addItemToCompra,
  updateItemCompra,
  deleteItemCompra,
  getAnalisisPrecios,
  getItemsRequisicionPendientes,
  getComprasDelDia
} from "../models/compras.model.js";

/**
 * Obtiene todas las compras
 */
export const fetchCompras = async (req, res) => {
  try {
    const { proveedor_id, fecha_inicio, fecha_fin, metodo_pago } = req.query;

    const filters = {
      proveedor_id: proveedor_id ? parseInt(proveedor_id) : null,
      fecha_inicio,
      fecha_fin,
      metodo_pago: metodo_pago || null
    };

    const compras = await getAllCompras(filters);
    res.json(compras);
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
};

/**
 * Obtiene una compra por ID con sus items
 */
export const fetchCompraById = async (req, res) => {
  const { id } = req.params;

  try {
    const compra = await getCompraById(id);

    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    res.json(compra);
  } catch (error) {
    console.error('Error al obtener compra:', error);
    res.status(500).json({ error: 'Error al obtener compra' });
  }
};

/**
 * Crea una nueva compra
 */
export const addCompra = async (req, res) => {
  const {
    proveedor_id,
    origen_compra,
    usuario_id,
    total,
    metodo_pago,
    solicito_factura,
    numero_factura,
    notas,
    fecha_compra,
    items
  } = req.body;

  // Validar campos requeridos - proveedor_id ya no es obligatorio
  if (!usuario_id || !total || !metodo_pago) {
    return res.status(400).json({
      error: 'usuario_id, total y metodo_pago son obligatorios'
    });
  }

  // Validar que se proporcione proveedor_id u origen_compra
  if (!proveedor_id && !origen_compra) {
    return res.status(400).json({
      error: 'Debe especificar un proveedor o el origen de la compra'
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un item' });
  }

  try {
    const nuevaCompra = await createCompra({
      proveedor_id,
      origen_compra,
      usuario_id,
      total,
      metodo_pago,
      solicito_factura,
      numero_factura,
      notas,
      fecha_compra,
      items
    });

    res.status(201).json(nuevaCompra);
  } catch (error) {
    console.error('Error al crear compra:', error);
    res.status(500).json({ error: 'Error al crear compra' });
  }
};

/**
 * Actualiza una compra existente
 */
export const editCompra = async (req, res) => {
  const { id } = req.params;
  const {
    proveedor_id,
    origen_compra,
    total,
    metodo_pago,
    solicito_factura,
    numero_factura,
    notas,
    fecha_compra,
    items
  } = req.body;

  try {
    const compraActualizada = await updateCompra(id, {
      proveedor_id,
      origen_compra,
      total,
      metodo_pago,
      solicito_factura,
      numero_factura,
      notas,
      fecha_compra,
      items
    });

    res.json(compraActualizada);
  } catch (error) {
    if (error.message === 'Compra no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'No se proporcionaron campos para actualizar') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al actualizar compra:', error);
    res.status(500).json({ error: 'Error al actualizar compra' });
  }
};

/**
 * Elimina una compra
 */
export const removeCompra = async (req, res) => {
  const { id } = req.params;

  try {
    const compraEliminada = await deleteCompra(id);
    
    res.json({ 
      message: 'Compra eliminada correctamente', 
      compra: compraEliminada 
    });
  } catch (error) {
    if (error.message === 'Compra no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al eliminar compra:', error);
    res.status(500).json({ error: 'Error al eliminar compra' });
  }
};

/**
 * Agrega un item a una compra existente
 */
export const addItemCompra = async (req, res) => {
  const { id } = req.params;
  const { insumo_id, requisicion_item_id, precio_unitario, cantidad, unidad } = req.body;

  // Validar campos requeridos
  if (!insumo_id || !precio_unitario || !cantidad || !unidad) {
    return res.status(400).json({ 
      error: 'insumo_id, precio_unitario, cantidad y unidad son obligatorios' 
    });
  }

  try {
    const nuevoItem = await addItemToCompra(id, {
      insumo_id,
      requisicion_item_id,
      precio_unitario,
      cantidad,
      unidad
    });
    
    res.status(201).json(nuevoItem);
  } catch (error) {
    if (error.message === 'Compra no encontrada') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al agregar item a compra:', error);
    res.status(500).json({ error: 'Error al agregar item a compra' });
  }
};

/**
 * Actualiza un item de compra
 */
export const editItemCompra = async (req, res) => {
  const { id, itemId } = req.params;
  const { precio_unitario, cantidad, unidad } = req.body;

  try {
    const itemActualizado = await updateItemCompra(id, itemId, {
      precio_unitario,
      cantidad,
      unidad
    });
    
    res.json(itemActualizado);
  } catch (error) {
    if (error.message === 'Item no encontrado en la compra') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'No se proporcionaron campos para actualizar') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al actualizar item de compra:', error);
    res.status(500).json({ error: 'Error al actualizar item de compra' });
  }
};

/**
 * Elimina un item de compra
 */
export const removeItemCompra = async (req, res) => {
  const { id, itemId } = req.params;

  try {
    const itemEliminado = await deleteItemCompra(id, itemId);
    
    res.json({ 
      message: 'Item eliminado correctamente', 
      item: itemEliminado 
    });
  } catch (error) {
    if (error.message === 'Item no encontrado en la compra') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error al eliminar item de compra:', error);
    res.status(500).json({ error: 'Error al eliminar item de compra' });
  }
};

/**
 * Obtiene el análisis de precios de insumos
 */
export const fetchAnalisisPrecios = async (req, res) => {
  try {
    const { insumo_id, proveedor_id } = req.query;
    
    const filters = {
      insumo_id: insumo_id ? parseInt(insumo_id) : null,
      proveedor_id: proveedor_id ? parseInt(proveedor_id) : null
    };
    
    const analisis = await getAnalisisPrecios(filters);
    res.json(analisis);
  } catch (error) {
    console.error('Error al obtener análisis de precios:', error);
    res.status(500).json({ error: 'Error al obtener análisis de precios' });
  }
};

/**
 * Obtiene los items de requisición pendientes por comprar
 */
export const fetchItemsRequisicionPendientes = async (req, res) => {
  try {
    const { proveedor_id } = req.query;
    const proveedorId = proveedor_id ? parseInt(proveedor_id) : null;
    
    const items = await getItemsRequisicionPendientes(proveedorId);
    res.json(items);
  } catch (error) {
    console.error('Error al obtener items de requisición pendientes:', error);
    res.status(500).json({ error: 'Error al obtener items de requisición pendientes' });
  }
};

/**
 * Obtiene qué comprar hoy por día y proveedor
 */
export const fetchComprasDelDia = async (req, res) => {
  try {
    const { dia } = req.params;
    const { proveedor_id } = req.query;
    
    const proveedorId = proveedor_id ? parseInt(proveedor_id) : null;
    
    const compras = await getComprasDelDia(dia, proveedorId);
    res.json(compras);
  } catch (error) {
    console.error('Error al obtener compras del día:', error);
    res.status(500).json({ error: 'Error al obtener compras del día' });
  }
}; 