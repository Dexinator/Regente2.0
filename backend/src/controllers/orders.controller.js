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
