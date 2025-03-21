import { getAllClients } from "../models/clients.model.js";

export const fetchClients = async (req, res) => {
  try {
    const clients = await getAllClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo clientes" });
  }
};
