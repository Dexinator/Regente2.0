import { createEmployee } from "../models/employees.model.js";

export const addEmployee = async (req, res) => {
  try {
    const { nombre, usuario, password, rol } = req.body;
    const newEmployee = await createEmployee(nombre, usuario, password, rol);
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: "Error creando el empleado" });
  }
};
