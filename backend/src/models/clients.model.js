import pool from "../config/db.js";

export const getAllClients = async () => {
  const result = await pool.query("SELECT * FROM presos");
  return result.rows;
};
