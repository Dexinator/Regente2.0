import { getOrderResumen } from "../models/orders.model.js";
import { crearTrabajo, tomarPendientes, confirmarTrabajo, contarPendientes } from "../models/impresion.model.js";
import { generarTicketCuenta } from "../utils/escpos.js";
import pool from "../config/db.js";

// Última vez que el puente consultó la cola (en memoria; con un dyno basta).
// Si no ha consultado en 60 s, la impresora se reporta fuera de línea.
let ultimaConsultaPuente = null;
const PUENTE_TIMEOUT_MS = 60 * 1000;
const puenteEnLinea = () =>
  ultimaConsultaPuente !== null && Date.now() - ultimaConsultaPuente < PUENTE_TIMEOUT_MS;

// POST /impresion/cuenta/:ordenId  (mesera/admin, con JWT)
// body opcional: { tipo: 'cuenta' | 'recibo' }
export const imprimirCuenta = async (req, res) => {
  try {
    const ordenId = parseInt(req.params.ordenId, 10);
    if (Number.isNaN(ordenId)) {
      return res.status(400).json({ error: "Orden inválida" });
    }

    const resumen = await getOrderResumen(ordenId);

    // Datos extra: mesero que abrió la orden y fecha
    const infoQuery = await pool.query(
      `SELECT o.fecha, e.nombre AS mesero
       FROM ordenes o
       LEFT JOIN empleados e ON o.empleado_id = e.id
       WHERE o.orden_id = $1`,
      [ordenId]
    );
    const info = infoQuery.rows[0] || {};

    const tipo = req.body?.tipo === "recibo" ? "recibo" : "cuenta";
    const bytes = generarTicketCuenta(resumen, {
      mesero: info.mesero,
      fecha: info.fecha,
      tipo,
      metodoPago: req.body?.metodo_pago
    });

    const trabajo = await crearTrabajo({
      orden_id: ordenId,
      tipo,
      contenido: bytes.toString("base64"),
      empleado_id: req.user?.id ?? null
    });

    res.status(201).json({
      trabajo_id: trabajo.id,
      estado: trabajo.estado,
      impresora_en_linea: puenteEnLinea()
    });
  } catch (err) {
    console.error("Error creando trabajo de impresión:", err);
    if (err.message === "Orden no encontrada") {
      return res.status(404).json({ error: "Orden no encontrada" });
    }
    res.status(500).json({ error: "Error generando la cuenta", detail: err.message });
  }
};

// GET /impresion/pendientes  (puente, con X-Printer-Token)
export const obtenerPendientes = async (req, res) => {
  try {
    ultimaConsultaPuente = Date.now();
    const trabajos = await tomarPendientes();
    res.json(trabajos);
  } catch (err) {
    console.error("Error obteniendo trabajos pendientes:", err);
    res.status(500).json({ error: "Error consultando la cola", detail: err.message });
  }
};

// POST /impresion/trabajos/:id/confirmar  (puente, con X-Printer-Token)
// body: { exito: true | false }
export const confirmarImpresion = async (req, res) => {
  try {
    const exito = req.body?.exito !== false;
    const trabajo = await confirmarTrabajo(parseInt(req.params.id, 10), exito);
    if (!trabajo) return res.status(404).json({ error: "Trabajo no encontrado" });
    res.json(trabajo);
  } catch (err) {
    console.error("Error confirmando impresión:", err);
    res.status(500).json({ error: "Error confirmando el trabajo", detail: err.message });
  }
};

// GET /impresion/estado  (frontend, con JWT)
export const estadoImpresora = async (req, res) => {
  try {
    res.json({
      en_linea: puenteEnLinea(),
      pendientes: await contarPendientes()
    });
  } catch (err) {
    res.status(500).json({ error: "Error consultando estado", detail: err.message });
  }
};
