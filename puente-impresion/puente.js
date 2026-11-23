/**
 * Puente de impresión Regente
 * ---------------------------
 * Corre en una PC del bar (o cualquier máquina en la misma red que la impresora).
 * Consulta la cola de impresión del backend y manda los bytes ESC/POS a la
 * impresora térmica, por red (puerto 9100) o por USB (/dev/usb/lp0 en Linux).
 *
 * Uso:  node puente.js [ruta/config.json]
 * Requiere Node 18+ (usa fetch global). Sin dependencias.
 */

const fs = require("fs");
const net = require("net");
const path = require("path");

// ── Configuración ──
const configPath = process.argv[2] || path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
  console.error(`No existe ${configPath}. Copia config.example.json a config.json y edítalo.`);
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));

const API_URL = (cfg.api_url || "").replace(/\/$/, "");
const TOKEN = cfg.printer_token;
const POLL_MS = cfg.poll_ms || 2000;
const IMPRESORA = cfg.impresora || {}; // { tipo: 'red', ip, puerto } | { tipo: 'usb', dispositivo }

if (!API_URL || !TOKEN) {
  console.error("config.json debe incluir api_url y printer_token");
  process.exit(1);
}

const log = (...args) => console.log(new Date().toISOString(), ...args);

// ── Envío a la impresora ──
const imprimirPorRed = (buffer) =>
  new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(10000);
    socket.on("error", reject);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Timeout conectando a la impresora"));
    });
    socket.connect(IMPRESORA.puerto || 9100, IMPRESORA.ip, () => {
      socket.end(buffer, () => resolve());
    });
  });

const imprimirPorUsb = (buffer) =>
  new Promise((resolve, reject) => {
    fs.writeFile(IMPRESORA.dispositivo, buffer, (err) => (err ? reject(err) : resolve()));
  });

const imprimir = (buffer) =>
  IMPRESORA.tipo === "usb" ? imprimirPorUsb(buffer) : imprimirPorRed(buffer);

// ── Comunicación con el backend ──
const api = async (ruta, opciones = {}) => {
  const res = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      "X-Printer-Token": TOKEN,
      ...opciones.headers
    }
  });
  if (!res.ok) throw new Error(`API ${ruta} respondió ${res.status}`);
  return res.json();
};

// ── Ciclo principal ──
let errorConsecutivos = 0;

const ciclo = async () => {
  let trabajos;
  try {
    trabajos = await api("/impresion/pendientes");
    if (errorConsecutivos > 0) log("Conexión con el backend restablecida");
    errorConsecutivos = 0;
  } catch (err) {
    errorConsecutivos++;
    if (errorConsecutivos === 1 || errorConsecutivos % 30 === 0) {
      log(`Sin conexión con el backend (${err.message})`);
    }
    return;
  }

  for (const trabajo of trabajos) {
    const bytes = Buffer.from(trabajo.contenido, "base64");
    try {
      await imprimir(bytes);
      await api(`/impresion/trabajos/${trabajo.id}/confirmar`, {
        method: "POST",
        body: JSON.stringify({ exito: true })
      });
      log(`✓ Trabajo #${trabajo.id} (${trabajo.tipo} orden ${trabajo.orden_id}) impreso`);
    } catch (err) {
      // No confirmamos: el backend lo volverá a entregar en 90 s (hasta 5 intentos)
      log(`✗ Trabajo #${trabajo.id} falló: ${err.message}`);
    }
  }
};

log(`Puente iniciado. Backend: ${API_URL}`);
log(`Impresora: ${IMPRESORA.tipo === "usb" ? IMPRESORA.dispositivo : `${IMPRESORA.ip}:${IMPRESORA.puerto || 9100}`}`);
setInterval(() => ciclo().catch((e) => log("Error inesperado:", e.message)), POLL_MS);
ciclo();
