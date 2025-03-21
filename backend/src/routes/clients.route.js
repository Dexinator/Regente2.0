import express from "express";
import { fetchClients } from "../controllers/clients.controller.js";

const router = express.Router();

// Ruta para obtener todos los clientes (presos)
router.get("/", fetchClients);

// Puedes agregar más rutas aquí, como POST, PUT, DELETE en el futuro
// router.post("/", createClient);
// router.put("/:id", updateClient);
// router.delete("/:id", deleteClient);

export default router; // ✅ Exportación por defecto (obligatoria para usar `import clientsRoutes from ...`)
