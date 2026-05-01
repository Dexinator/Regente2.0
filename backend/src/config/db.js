import pkg from "pg";
const { Pool, types } = pkg;
import dotenv from "dotenv";

dotenv.config();

// El DB guarda timestamps en hora local CDMX (UTC-6, sin DST desde 2022) en columnas
// `timestamp without time zone`. Por default el driver `pg` los parsea como UTC, lo que
// hace que el frontend vea las horas con -6h de diferencia. Forzamos el parser a tratar
// esos valores como CDMX para que los Date de JS reflejen el instante real.
const TIMESTAMP_OID = 1114;
types.setTypeParser(TIMESTAMP_OID, (value) => {
  if (!value) return value;
  return new Date(value.replace(' ', 'T') + '-06:00');
});

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
