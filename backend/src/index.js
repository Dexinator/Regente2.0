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
import sentenciasRoutes from "./routes/sentencias.route.js";
import proveedoresRoutes from "./routes/proveedores.routes.js";
import insumosRoutes from "./routes/insumos.routes.js";
import requisicionesRoutes from "./routes/requisiciones.routes.js";
import comprasRoutes from "./routes/compras.routes.js";
import inventarioRoutes from "./routes/inventario.routes.js";
import variantesRoutes from "./routes/variantes.route.js";


dotenv.config();
const app = express();

// Configuraciones de seguridad y CORS
app.use(helmet());

// Configuración de CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://regente2-0.vercel.app'] // Dominios de producción
    : process.env.NODE_ENV === 'staging'
      ? ['https://regente2-0-staging.vercel.app'] // Dominio de staging
      : 'http://localhost:4321', // Dominio de desarrollo (puerto por defecto de Astro)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rutas

app.use("/orders", ordersRoutes);
app.use("/products", productsRoutes);
app.use("/clients", clientsRoutes);
app.use("/employees", employeesRoutes);
app.use("/reports", reportsRoutes);
app.use("/pagos", pagosRoutes);
app.use("/promociones", promocionesRoutes);
app.use("/sentencias", sentenciasRoutes);
app.use("/proveedores", proveedoresRoutes);
app.use("/insumos", insumosRoutes);
app.use("/requisiciones", requisicionesRoutes);
app.use("/compras", comprasRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/variantes", variantesRoutes);

// Ruta base
app.get("/", (req, res) => {
  res.json({ message: "Bienvenido a la API del Penitenciario" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
