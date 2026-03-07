import {
  getAllCodigos,
  getCodigoById,
  getCodigoByCodigo,
  createCodigo,
  updateCodigo,
  deleteCodigo,
  validateCodigo,
  aplicarCodigo,
  removerCodigo
} from "../models/promociones.model.js";

/**
 * Obtiene todos los códigos promocionales
 */
export const fetchCodigos = async (req, res) => {
  try {
    const codigos = await getAllCodigos();
    res.json(codigos);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo códigos promocionales", detail: err.message });
  }
};

/**
 * Obtiene un código promocional por su ID
 */
export const fetchCodigoById = async (req, res) => {
  try {
    const codigo = await getCodigoById(req.params.id);
    
    if (!codigo) {
      return res.status(404).json({ error: "Código promocional no encontrado" });
    }
    
    res.json(codigo);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo código promocional", detail: err.message });
  }
};

/**
 * Crea un nuevo código promocional
 */
export const addCodigo = async (req, res) => {
  try {
    const { codigo, porcentaje_descuento, fecha_inicio, fecha_fin, activo, usos_maximos } = req.body;
    
    // Validar campos requeridos
    if (!codigo || !porcentaje_descuento || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        error: "Faltan datos obligatorios", 
        detail: "Se requiere código, porcentaje_descuento, fecha_inicio y fecha_fin" 
      });
    }
    
    // Validar que el código no exista ya
    const existingCodigo = await getCodigoByCodigo(codigo);
    if (existingCodigo) {
      return res.status(400).json({ error: "El código promocional ya existe" });
    }
    
    // Validar porcentaje de descuento
    if (porcentaje_descuento <= 0 || porcentaje_descuento > 100) {
      return res.status(400).json({ 
        error: "Porcentaje de descuento inválido", 
        detail: "El porcentaje debe estar entre 0 y 100" 
      });
    }
    
    const newCodigo = await createCodigo({
      codigo,
      porcentaje_descuento,
      fecha_inicio,
      fecha_fin,
      activo,
      usos_maximos
    });
    
    res.status(201).json(newCodigo);
  } catch (err) {
    res.status(500).json({ error: "Error creando código promocional", detail: err.message });
  }
};

/**
 * Actualiza un código promocional existente
 */
export const updateCodigoById = async (req, res) => {
  try {
    const id = req.params.id;
    const { codigo, porcentaje_descuento, fecha_inicio, fecha_fin, activo, usos_maximos } = req.body;
    
    // Validar campos requeridos
    if (!codigo || !porcentaje_descuento || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ 
        error: "Faltan datos obligatorios", 
        detail: "Se requiere código, porcentaje_descuento, fecha_inicio y fecha_fin" 
      });
    }
    
    // Validar que el código exista
    const existingCodigo = await getCodigoById(id);
    if (!existingCodigo) {
      return res.status(404).json({ error: "Código promocional no encontrado" });
    }
    
    // Validar que el nuevo código no exista ya (si está cambiando)
    if (codigo !== existingCodigo.codigo) {
      const duplicateCodigo = await getCodigoByCodigo(codigo);
      if (duplicateCodigo) {
        return res.status(400).json({ error: "El código promocional ya existe" });
      }
    }
    
    // Validar porcentaje de descuento
    if (porcentaje_descuento <= 0 || porcentaje_descuento > 100) {
      return res.status(400).json({ 
        error: "Porcentaje de descuento inválido", 
        detail: "El porcentaje debe estar entre 0 y 100" 
      });
    }
    
    const updatedCodigo = await updateCodigo(id, {
      codigo,
      porcentaje_descuento,
      fecha_inicio,
      fecha_fin,
      activo,
      usos_maximos
    });
    
    res.json(updatedCodigo);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando código promocional", detail: err.message });
  }
};

/**
 * Elimina un código promocional
 */
export const deleteCodigoById = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Verificar que el código exista
    const existingCodigo = await getCodigoById(id);
    if (!existingCodigo) {
      return res.status(404).json({ error: "Código promocional no encontrado" });
    }
    
    const deletedCodigo = await deleteCodigo(id);
    res.json(deletedCodigo);
  } catch (err) {
    res.status(500).json({ error: "Error eliminando código promocional", detail: err.message });
  }
};

/**
 * Valida un código promocional
 */
export const validateCodigoPromo = async (req, res) => {
  try {
    const { codigo } = req.body;
    
    if (!codigo) {
      return res.status(400).json({ error: "Debe proporcionar un código" });
    }
    
    const validCodigo = await validateCodigo(codigo);
    
    if (!validCodigo) {
      return res.status(404).json({ 
        error: "Código inválido o expirado", 
        valid: false 
      });
    }
    
    res.json({
      valid: true,
      codigo: validCodigo
    });
  } catch (err) {
    res.status(500).json({ error: "Error validando código promocional", detail: err.message });
  }
};

/**
 * Aplica un código promocional a una orden
 */
export const applyCodigoToOrder = async (req, res) => {
  try {
    const orden_id = req.params.id;
    const { codigo } = req.body;
    
    if (!codigo) {
      return res.status(400).json({ error: "Debe proporcionar un código" });
    }
    
    // Validar el código
    const validCodigo = await validateCodigo(codigo);
    
    if (!validCodigo) {
      return res.status(404).json({ 
        error: "Código inválido o expirado" 
      });
    }
    
    // Aplicar el código a la orden
    const updatedOrder = await aplicarCodigo(orden_id, validCodigo.id);
    
    if (!updatedOrder) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: "Error aplicando código promocional", detail: err.message });
  }
};

/**
 * Remueve un código promocional de una orden
 */
export const removeCodigoFromOrder = async (req, res) => {
  try {
    const orden_id = req.params.id;
    
    const updatedOrder = await removerCodigo(orden_id);
    
    if (!updatedOrder) {
      return res.status(404).json({ 
        error: "Orden no encontrada o no tiene código de descuento" 
      });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: "Error removiendo código promocional", detail: err.message });
  }
}; 