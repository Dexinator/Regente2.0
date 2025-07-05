/**
 * Controlador para gestionar proveedores
 */

import {
  getAllProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  getInsumosByProveedor,
  getProveedoresPorDia,
  getDiasCompraDisponibles
} from "../models/proveedores.model.js";

/**
 * Obtiene todos los proveedores
 */
export const fetchProveedores = async (req, res) => {
  try {
    const proveedores = await getAllProveedores();
    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
};

/**
 * Obtiene un proveedor por ID
 */
export const fetchProveedorById = async (req, res) => {
  const { id } = req.params;

  try {
    const proveedor = await getProveedorById(id);

    if (!proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(proveedor);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ error: 'Error al obtener proveedor' });
  }
};

/**
 * Crea un nuevo proveedor
 */
export const addProveedor = async (req, res) => {
  const { nombre, rfc, direccion, telefono, email, contacto_nombre, dias_compra } = req.body;

  // Validar campos requeridos
  if (!nombre) {
    return res.status(400).json({ error: 'Nombre es obligatorio' });
  }

  try {
    const nuevoProveedor = await createProveedor({
      nombre, 
      rfc, 
      direccion, 
      telefono, 
      email, 
      contacto_nombre,
      dias_compra
    });
    
    res.status(201).json(nuevoProveedor);
  } catch (error) {
    if (error.message === 'Ya existe un proveedor con este RFC') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
};

/**
 * Actualiza un proveedor existente
 */
export const editProveedor = async (req, res) => {
  const { id } = req.params;
  const { nombre, rfc, direccion, telefono, email, contacto_nombre, activo, dias_compra } = req.body;

  // Validar campos requeridos
  if (!nombre) {
    return res.status(400).json({ error: 'Nombre es obligatorio' });
  }

  try {
    const proveedorActualizado = await updateProveedor(id, {
      nombre, 
      rfc, 
      direccion, 
      telefono, 
      email, 
      contacto_nombre, 
      activo,
      dias_compra
    });

    if (!proveedorActualizado) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    res.json(proveedorActualizado);
  } catch (error) {
    if (error.message === 'Ya existe otro proveedor con este RFC') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor' });
  }
};

/**
 * Elimina un proveedor (desactivación lógica)
 */
export const removeProveedor = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteProveedor(id);

    if (!result.proveedor) {
      return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    if (result.desactivado) {
      return res.json({ 
        message: 'Proveedor desactivado correctamente', 
        proveedor: result.proveedor 
      });
    } else {
      return res.json({ 
        message: 'Proveedor eliminado correctamente', 
        proveedor: result.proveedor 
      });
    }
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor' });
  }
};

/**
 * Obtiene los insumos asociados a un proveedor
 */
export const fetchInsumosByProveedor = async (req, res) => {
  const { id } = req.params;

  try {
    const insumos = await getInsumosByProveedor(id);
    res.json(insumos);
  } catch (error) {
    console.error('Error al obtener insumos del proveedor:', error);
    res.status(500).json({ error: 'Error al obtener insumos del proveedor' });
  }
};

/**
 * Obtiene proveedores que compran en un día específico
 */
export const fetchProveedoresPorDia = async (req, res) => {
  const { dia } = req.params;

  try {
    const proveedores = await getProveedoresPorDia(dia);
    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores por día:', error);
    res.status(500).json({ error: 'Error al obtener proveedores por día' });
  }
};

/**
 * Obtiene la lista de días disponibles para compras
 */
export const fetchDiasCompraDisponibles = async (req, res) => {
  try {
    const dias = getDiasCompraDisponibles();
    res.json(dias);
  } catch (error) {
    console.error('Error al obtener días de compra:', error);
    res.status(500).json({ error: 'Error al obtener días de compra' });
  }
}; 