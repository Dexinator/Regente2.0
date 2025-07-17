import pool from "../config/db.js";

export const getAllClients = async () => {
  const result = await pool.query("SELECT * FROM presos ORDER BY id DESC");
  return result.rows;
};

export const getClientById = async (id) => {
  const result = await pool.query("SELECT * FROM presos WHERE id = $1", [id]);
  return result.rows[0];
};

export const createClient = async (client) => {
  const {
    reg_name, res_tel, IGname, Bday, mkt, cellmate, referidos
  } = client;

  const result = await pool.query(
    `INSERT INTO presos (reg_name, res_tel, IGname, Bday, mkt, cellmate, referidos)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [reg_name, res_tel, IGname, Bday, mkt, cellmate, referidos]
  );
  return result.rows[0];
};

export const updateClient = async (id, client) => {
  const {
    reg_name, res_tel, IGname, Bday, mkt, cellmate, referidos
  } = client;

  const result = await pool.query(
    `UPDATE presos SET reg_name = $1, res_tel = $2, IGname = $3, Bday = $4, mkt = $5, cellmate = $6, referidos = $7
     WHERE id = $8 RETURNING *`,
    [reg_name, res_tel, IGname, Bday, mkt, cellmate, referidos, id]
  );
  return result.rows[0];
};

export const deleteClient = async (id) => {
  const result = await pool.query("DELETE FROM presos WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};
