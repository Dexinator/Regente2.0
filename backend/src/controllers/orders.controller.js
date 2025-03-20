import { getAllOrders, createOrder } from "../models/orders.model.js";

export const fetchOrders = async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
};

export const addOrder = async (req, res) => {
  try {
    const { presoId, nombreCliente, total, estado, empleadoId } = req.body;
    const newOrder = await createOrder(presoId, nombreCliente, total, estado, empleadoId);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(500).json({ error: "Error creando la orden" });
  }
};
