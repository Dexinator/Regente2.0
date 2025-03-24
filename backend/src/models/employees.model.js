import pool from "../config/db.js";
import bcrypt from "bcrypt";

// Crear nuevo empleado con password hasheado
export const createEmployee = async ({ nombre, usuario, password, rol }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO empleados (nombre, usuario, password, rol)
     VALUES ($1, $2, $3, $4) RETURNING id, nombre, usuario, rol`,
    [nombre, usuario, hashedPassword, rol]
  );
  return result.rows[0];
};

// Buscar empleado por usuario (para login)
export const getEmployeeByUsername = async (usuario) => {
  const result = await pool.query(
    `SELECT * FROM empleados WHERE usuario = $1 AND activo = true`,
    [usuario]
  );
  return result.rows[0];
};

// Buscar empleado por ID (para /me)
export const getEmployeeById = async (id) => {
  const result = await pool.query(
    `SELECT id, nombre, usuario, rol FROM empleados WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};
