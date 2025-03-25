import {
  getAllOrders,
  getOpenOrders,
  getOrderWithDetails,
  createOrder,
  closeOrder
} from "../models/orders.model.js";

export const fetchOrders = async (req, res) => {
  const orders = await getAllOrders();
  res.json(orders);
};

export const fetchOpenOrders = async (req, res) => {
  const orders = await getOpenOrders();
  res.json(orders);
};

export const fetchOrderById = async (req, res) => {
  const order = await getOrderWithDetails(req.params.id);
  if (!order) return res.status(404).json({ error: "Orden no encontrada" });
  res.json(order);
};

export const addOrder = async (req, res) => {
  try {
    const newOrder = await createOrder(req.body);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: "Error al crear la orden", detail: err.message });
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
