import {
  getAllOrders,
  getOrderWithDetails,
  createOrder,
  closeOrder,
  getOpenOrdersWithPayments,
  getProductosPorPreparar,
  getHistorialProductosPreparados,
  marcarProductoComoPreparado,
  desprepararProducto,
  cancelarProductoOrden
} from "../models/orders.model.js";

export const fetchOrders = async (req, res) => {
  const orders = await getAllOrders();
  res.json(orders);
};

export const fetchOpenOrders = async (req, res) => {
  try {
    const ordenes = await getOpenOrdersWithPayments();
    res.json(ordenes);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo órdenes abiertas", detail: err.message });
  }
};


export const fetchOrderById = async (req, res) => {
  const order = await getOrderWithDetails(req.params.id);
  if (!order) return res.status(404).json({ error: "Orden no encontrada" });
  res.json(order);
};

export const addOrder = async (req, res) => {
  const { preso_id, nombre_cliente, empleado_id, productos, num_personas } = req.body;

  if (!empleado_id || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: "Faltan datos obligatorios: productos o empleado_id" });
  }

  if (!preso_id && !nombre_cliente) {
    return res.status(400).json({ error: "Debe enviarse 'preso_id' o 'nombre_cliente'" });
  }

  // Validar que cada producto tenga la información correcta
  for (const producto of productos) {
    if (!producto.producto_id || !producto.cantidad) {
      return res.status(400).json({ error: "Cada producto debe tener producto_id y cantidad" });
    }
    // sabor_id es opcional
  }

  try {
    const newOrder = await createOrder({ preso_id, nombre_cliente, empleado_id, productos, num_personas });
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: "Error creando la orden", detail: err.message });
  }
};


export const closeOrderById = async (req, res) => {
  const updated = await closeOrder(req.params.id);
  if (!updated) return res.status(404).json({ error: "Orden no encontrada" });
  res.json(updated);
};

import { addProductsToOrder } from "../models/orders.model.js";

// Agregar productos a una orden abierta
export const addProducts = async (req, res) => {
  const orden_id = req.params.id;
  const { productos, empleado_id } = req.body;

  if (!productos || !empleado_id) {
    return res.status(400).json({ error: "Faltan datos: productos o empleado_id" });
  }

  // Validar que cada producto tenga la información correcta
  for (const producto of productos) {
    if (!producto.producto_id || !producto.cantidad) {
      return res.status(400).json({ error: "Cada producto debe tener producto_id y cantidad" });
    }
    // sabor_id y notas son opcionales
  }

  try {
    const result = await addProductsToOrder(orden_id, productos, empleado_id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Error al agregar productos", detail: err.message });
  }
};

//Resumen de orden
import { getOrderResumen } from "../models/orders.model.js";

export const getOrderSummary = async (req, res) => {
  try {
    const resumen = await getOrderResumen(req.params.id);
    res.json(resumen);
  } catch (err) {
    res.status(500).json({ error: "Error generando resumen", detail: err.message });
  }
};

// Obtener productos pendientes por preparar para cocina
export const fetchProductosPorPreparar = async (req, res) => {
  try {
    const productos = await getProductosPorPreparar();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo productos por preparar", detail: err.message });
  }
};

// Obtener historial de productos preparados por fecha
export const fetchHistorialProductosPreparados = async (req, res) => {
  try {
    const { fecha } = req.query;
    const historial = await getHistorialProductosPreparados(fecha);
    res.json(historial);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo historial de productos", detail: err.message });
  }
};

// Marcar un producto como preparado
export const updateEstadoProducto = async (req, res) => {
  try {
    const detalle_id = req.params.id;
    const producto = await marcarProductoComoPreparado(detalle_id);
    
    if (!producto) {
      return res.status(404).json({ error: "Detalle de producto no encontrado" });
    }
    
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: "Error al marcar producto como preparado", detail: err.message });
  }
};

// Marcar un producto como NO preparado (despreparar)
export const revertirEstadoProducto = async (req, res) => {
  try {
    const detalle_id = req.params.id;
    const producto = await desprepararProducto(detalle_id);
    
    if (!producto) {
      return res.status(404).json({ error: "Detalle de producto no encontrado" });
    }
    
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: "Error al marcar producto como no preparado", detail: err.message });
  }
};

// Cancelar productos de una orden
export const cancelarProducto = async (req, res) => {
  try {
    const orden_id = req.params.id;
    const { producto_id, cantidad, empleado_id, razon_cancelacion, sabor_id, tamano_id, ingrediente_id } = req.body;

    if (!producto_id || !cantidad || !empleado_id) {
      return res.status(400).json({ 
        error: "Datos incompletos", 
        detail: "Se requiere producto_id, cantidad y empleado_id" 
      });
    }

    // Si la cantidad es positiva, convertirla a negativa para indicar cancelación
    const cantidadFinal = cantidad < 0 ? cantidad : -Math.abs(cantidad);
    
    console.log("Recibiendo cancelación:", {
      orden_id,
      producto_id,
      cantidad: cantidadFinal, 
      empleado_id,
      razon_cancelacion,
      sabor_id,
      tamano_id,
      ingrediente_id
    });

    const resultado = await cancelarProductoOrden(
      orden_id, 
      producto_id, 
      cantidadFinal, 
      empleado_id, 
      razon_cancelacion,
      sabor_id || null,
      tamano_id || null,
      ingrediente_id || null
    );

    res.status(200).json(resultado);
  } catch (err) {
    res.status(500).json({ 
      error: "Error al cancelar el producto", 
      detail: err.message 
    });
  }
};
