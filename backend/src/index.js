import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import ordersRoutes from "./routes/orders.route.js";
import productsRoutes from "./routes/products.route.js";
import clientsRoutes from "./routes/clients.route.js";
import employeesRoutes from "./routes/employees.route.js";
import reportsRoutes from "./routes/reports.route.js";
import pagosRoutes from "./routes/pagos.route.js";
import promocionesRoutes from "./routes/promociones.route.js";


dotenv.config();
const app = express();

// Configuraciones de seguridad y CORS
app.use(helmet());

// Configuración de CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://regente2-0.vercel.app'] // Dominios de producción
    : 'http://localhost:4321', // Dominio de desarrollo (puerto por defecto de Astro)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());

// Rutas

app.use("/orders", ordersRoutes);
app.use("/products", productsRoutes);
app.use("/clients", clientsRoutes);
app.use("/employees", employeesRoutes);
app.use("/reports", reportsRoutes);
app.use("/pagos", pagosRoutes);
app.use("/promociones", promocionesRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
