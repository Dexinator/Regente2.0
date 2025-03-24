import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import {
  createEmployee,
  getEmployeeByUsername,
  getEmployeeById
} from "../models/employees.model.js";

dotenv.config();

export const register = async (req, res) => {
  const nuevo = await createEmployee(req.body);
  res.status(201).json(nuevo);
};

export const login = async (req, res) => {
  const { usuario, password } = req.body;
  const empleado = await getEmployeeByUsername(usuario);

  if (!empleado) return res.status(400).json({ error: "Credenciales inválidas" });

  const passwordValido = await bcrypt.compare(password, empleado.password);
  if (!passwordValido) return res.status(400).json({ error: "Credenciales inválidas" });

  const token = jwt.sign(
    { id: empleado.id, rol: empleado.rol },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};

export const getProfile = async (req, res) => {
  const empleado = await getEmployeeById(req.user.id);
  res.json(empleado);
};
