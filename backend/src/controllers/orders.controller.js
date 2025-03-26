import {
  getAllOrders,
  getOrderWithDetails,
  createOrder,
  closeOrder,
  getOpenOrdersWithPayments
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
  const { preso_id, nombre_cliente, empleado_id, productos } = req.body;

  if (!empleado_id || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: "Faltan datos obligatorios: productos o empleado_id" });
  }

  if (!preso_id && !nombre_cliente) {
    return res.status(400).json({ error: "Debe enviarse 'preso_id' o 'nombre_cliente'" });
  }

  try {
    const newOrder = await createOrder({ preso_id, nombre_cliente, empleado_id, productos });
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
