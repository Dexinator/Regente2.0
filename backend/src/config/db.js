import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

// Configurar opciones de conexión según el entorno
const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === 'staging';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? {
    rejectUnauthorized: false // Necesario para conexiones a Heroku PostgreSQL
  } : false
});

// Log para depuración
console.log(`Database connection configured. Environment: ${isProduction ? 'Production' : 'Development'}, SSL: ${isProduction ? 'Enabled' : 'Disabled'}`);

export default pool;
