import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from "../models/clients.model.js";

export const fetchClients = async (req, res) => {
  const clients = await getAllClients();
  res.json(clients);
};

export const fetchClientById = async (req, res) => {
  const client = await getClientById(req.params.id);
  if (!client) return res.status(404).json({ error: "Cliente no encontrado" });
  res.json(client);
};

export const addClient = async (req, res) => {
  const newClient = await createClient(req.body);
  res.status(201).json(newClient);
};

export const editClient = async (req, res) => {
  const updatedClient = await updateClient(req.params.id, req.body);
  if (!updatedClient) return res.status(404).json({ error: "Cliente no encontrado" });
  res.json(updatedClient);
};

export const removeClient = async (req, res) => {
  const deletedClient = await deleteClient(req.params.id);
  if (!deletedClient) return res.status(404).json({ error: "Cliente no encontrado" });
  res.json({ message: "Cliente eliminado", deletedClient });
};
