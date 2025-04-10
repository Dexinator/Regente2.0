import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import {
  createEmployee,
  getEmployeeByUsername,
  getEmployeeById,
  getAdminCount
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
    { id: empleado.id, rol: empleado.rol, nombre: empleado.nombre, usuario: empleado.usuario },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};

export const getProfile = async (req, res) => {
  const empleado = await getEmployeeById(req.user.id);
  res.json(empleado);
};

// Función para configuración inicial en producción
export const setupInitialAdmin = async (req, res) => {
  try {
    const { usuario, password, nombre, setupCode } = req.body;
    
    // 1. Verificar que se proporcione el código secreto
    if (!setupCode || setupCode !== process.env.SETUP_CODE) {
      return res.status(401).json({ 
        error: "Código de configuración inválido o no proporcionado",
        debug: {
          receivedCode: setupCode,
          expectedCode: process.env.SETUP_CODE ? "[configurado]" : "[no configurado]"
        }
      });
    }
    
    // 2. Verificar si ya existe un administrador
    const adminCount = await getAdminCount();
    if (adminCount > 0) {
      return res.status(400).json({ 
        error: "Ya existe al menos un administrador en el sistema",
        count: adminCount 
      });
    }
    
    // 3. Validar datos requeridos
    if (!usuario || !password || !nombre) {
      return res.status(400).json({ 
        error: "Se requieren los campos: usuario, password y nombre" 
      });
    }
    
    // 4. Crear el administrador
    const adminData = {
      nombre,
      usuario,
      password,
      rol: 'admin'
    };
    
    const admin = await createEmployee(adminData);
    
    // 5. Generar token para que pueda iniciar sesión inmediatamente
    const token = jwt.sign(
      { id: admin.id, rol: admin.rol, nombre: admin.nombre, usuario: admin.usuario },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // 6. Responder con éxito
    res.status(201).json({
      message: "Administrador inicial creado con éxito",
      admin: {
        id: admin.id,
        nombre: admin.nombre,
        usuario: admin.usuario,
        rol: admin.rol
      },
      token
    });
    
  } catch (error) {
    console.error("Error en setup inicial:", error);
    res.status(500).json({ 
      error: "Error al crear administrador inicial",
      details: error.message,
      stack: error.stack
    });
  }
};
