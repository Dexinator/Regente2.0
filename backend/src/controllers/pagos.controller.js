import { registrarPago } from "../models/pagos.model.js";

export const postPago = async (req, res) => {
  const { orden_id, metodo, monto, empleado_id } = req.body;

  if (!orden_id || !metodo || !monto || !empleado_id) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    const pago = await registrarPago({ orden_id, metodo, monto, empleado_id });
    res.status(201).json(pago);
  } catch (err) {
    res.status(500).json({ error: "Error al registrar el pago", detail: err.message });
  }
};


import { getPagosDeOrden } from "../models/pagos.model.js";

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
