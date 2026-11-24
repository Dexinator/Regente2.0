import {
  registrarPago,
  actualizarMetodoPago,
  METODOS_PAGO_VALIDOS,
  getPagosDeOrden,
} from "../models/pagos.model.js";

export const postPago = async (req, res) => {
  const { orden_id, metodo, monto, propina, porcentaje_propina, empleado_id } = req.body;

  if (!orden_id || !metodo || !monto || !empleado_id) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const pago = await registrarPago({ orden_id, metodo, monto, propina, porcentaje_propina, empleado_id });
    res.status(201).json(pago);
  } catch (err) {
    res.status(500).json({ error: "Error al registrar el pago", detail: err.message });
  }
};

// Cambia el método de un pago (efectivo ↔ tarjeta ↔ transferencia ↔ otro).
// No modifica monto ni propina. Usado para corregir errores de captura.
export const patchMetodoPago = async (req, res) => {
  const { metodo } = req.body;
  if (!metodo || !METODOS_PAGO_VALIDOS.includes(metodo)) {
    return res.status(400).json({
      error: `Método inválido. Debe ser uno de: ${METODOS_PAGO_VALIDOS.join(", ")}`,
    });
  }
  try {
    const r = await actualizarMetodoPago(req.params.id, metodo);
    if (!r.ok && r.reason === "not_found") {
      return res.status(404).json({ error: "Pago no encontrado" });
    }
    if (!r.ok) {
      return res.status(400).json({ error: "Método inválido" });
    }
    res.json(r.pago);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar método de pago", detail: err.message });
  }
};

// Consultar pagos de una orden
export const getPagosPorOrden = async (req, res) => {
  const orden_id = req.params.id;

  try {
    const resumen = await getPagosDeOrden(orden_id);
    res.json(resumen);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener pagos", detail: err.message });
  }
};
