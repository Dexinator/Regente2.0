import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const createEmployee = async (nombre, usuario, password, rol) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO empleados (nombre, usuario, password, rol) VALUES ($1, $2, $3, $4) RETURNING *",
    [nombre, usuario, hashedPassword, rol]
  );
  return result.rows[0];
};
