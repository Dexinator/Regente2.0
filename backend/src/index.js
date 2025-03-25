import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import ordersRoutes from "./routes/orders.route.js";
import productsRoutes from "./routes/products.route.js";
import clientsRoutes from "./routes/clients.route.js";
import employeesRoutes from "./routes/employees.route.js";
import reportsRoutes from "./routes/reports.route.js";


dotenv.config();
const app = express();

// Configuraciones de seguridad y CORS
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rutas

app.use("/orders", ordersRoutes);
app.use("/products", productsRoutes);
app.use("/clients", clientsRoutes);
app.use("/employees", employeesRoutes);
app.use("/reports", reportsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
