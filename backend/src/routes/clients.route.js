import express from "express";
import {
  fetchClients,
  fetchClientById,
  addClient,
  editClient,
  removeClient
} from "../controllers/clients.controller.js";

const router = express.Router();

router.get("/", fetchClients);
router.get("/:id", fetchClientById);
router.post("/", addClient);
router.put("/:id", editClient);
router.delete("/:id", removeClient);

export default router;
