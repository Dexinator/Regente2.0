import {
  getTalleres,
  getTallerBySlug,
  createTaller,
  updateTaller,
  deleteTaller,
  registrarAsistente,
  getRegistros,
  deleteRegistro,
} from "../models/talleres.model.js";

const SLUG_RE = /^[a-z0-9-]{3,60}$/;
const TELEFONO_RE = /^[0-9+\s()-]{8,15}$/;

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// Lo que ve el público: sin timestamps internos.
const tallerPublico = (t) => ({
  slug: t.slug,
  nombre: t.nombre,
  descripcion: t.descripcion,
  fecha_evento: t.fecha_evento,
  cupo_max: t.cupo_max,
  disponibles: t.disponibles,
});

// ---------- Rate limit simple en memoria para el POST público ----------
// Un dyno, tráfico bajo: un Map basta. Ventana de 10 min, 10 intentos por IP.
const VENTANA_MS = 10 * 60 * 1000;
const MAX_INTENTOS = 10;
const intentosPorIp = new Map();

const ipCliente = (req) => {
  // El router de Heroku agrega la IP real al final de X-Forwarded-For;
  // las entradas previas las puede inventar el cliente.
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",").pop().trim();
  return req.socket.remoteAddress;
};

export const limitarRegistros = (req, res, next) => {
  const ahora = Date.now();
  const ip = ipCliente(req);
  const previos = (intentosPorIp.get(ip) || []).filter((t) => ahora - t < VENTANA_MS);
  if (previos.length >= MAX_INTENTOS) {
    return res.status(429).json({ error: "Demasiados intentos, espera unos minutos" });
  }
  previos.push(ahora);
  intentosPorIp.set(ip, previos);
  if (intentosPorIp.size > 5000) {
    for (const [key, ts] of intentosPorIp) {
      if (ts.every((t) => ahora - t >= VENTANA_MS)) intentosPorIp.delete(key);
    }
  }
  next();
};

// ---------- Notificación a Slack (opcional) ----------
const notificarSlack = (taller, registro, inscritos) => {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  const ig = registro.instagram ? ` (@${registro.instagram})` : "";
  const text = `📝 Nuevo registro a *${taller.nombre}*: ${registro.nombre}${ig} — ${inscritos}/${taller.cupo_max} lugares`;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => console.error("Slack webhook de talleres falló:", err.message));
};

// ---------- Públicos ----------

export const fetchTalleresPublicos = async (req, res) => {
  try {
    const talleres = await getTalleres(true);
    res.json(talleres.map(tallerPublico));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener talleres" });
  }
};

export const fetchTallerPublico = async (req, res) => {
  try {
    const taller = await getTallerBySlug(req.params.slug);
    if (!taller || !taller.activo) return res.status(404).json({ error: "Taller no encontrado" });
    res.json(tallerPublico(taller));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener taller" });
  }
};

export const registrar = async (req, res) => {
  const body = req.body || {};
  if (typeof body.nombre !== "string" || typeof body.telefono !== "string") {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const nombre = body.nombre.trim();
  const telefono = body.telefono.trim();
  if (nombre.length < 2 || nombre.length > 80) {
    return res.status(400).json({ error: "El nombre debe tener entre 2 y 80 caracteres" });
  }
  if (!TELEFONO_RE.test(telefono)) {
    return res.status(400).json({ error: "Teléfono inválido" });
  }
  const instagram =
    typeof body.instagram === "string" && body.instagram.trim()
      ? body.instagram.trim().replace(/^@/, "").slice(0, 60)
      : null;
  const edad =
    typeof body.edad === "number" && body.edad > 0 && body.edad < 130 ? Math.floor(body.edad) : null;

  try {
    const taller = await getTallerBySlug(req.params.slug);
    if (!taller) return res.status(404).json({ error: "Taller no encontrado" });

    const resultado = await registrarAsistente(taller.id, { nombre, telefono, instagram, edad });
    if (!resultado.ok) return res.status(resultado.status).json({ error: resultado.error });

    notificarSlack(taller, resultado.registro, resultado.inscritos);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo completar el registro" });
  }
};

// ---------- Admin (gerente) ----------

export const fetchTalleres = async (req, res) => {
  try {
    res.json(await getTalleres(false));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener talleres" });
  }
};

export const addTaller = async (req, res) => {
  const body = req.body || {};
  const slug = String(body.slug ?? "").trim();
  const nombre = String(body.nombre ?? "").trim();
  const cupo_max = Number(body.cupo_max);
  if (!SLUG_RE.test(slug)) {
    return res.status(400).json({ error: "Slug inválido (minúsculas, números y guiones, 3-60)" });
  }
  if (nombre.length < 2) return res.status(400).json({ error: "Nombre inválido" });
  if (!Number.isInteger(cupo_max) || cupo_max <= 0) {
    return res.status(400).json({ error: "Cupo inválido" });
  }
  try {
    const nuevo = await createTaller({
      slug,
      nombre,
      descripcion: body.descripcion ? String(body.descripcion).trim() : null,
      cupo_max,
      fecha_evento: body.fecha_evento ? String(body.fecha_evento) : null,
      activo: body.activo !== false,
    });
    res.status(201).json(nuevo);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Ya existe un taller con ese slug" });
    console.error(err);
    res.status(500).json({ error: "Error al crear taller" });
  }
};

export const updateTallerById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  const body = req.body || {};
  if ("slug" in body && !SLUG_RE.test(String(body.slug))) {
    return res.status(400).json({ error: "Slug inválido" });
  }
  if ("cupo_max" in body && !(Number.isInteger(body.cupo_max) && body.cupo_max > 0)) {
    return res.status(400).json({ error: "Cupo inválido" });
  }
  if ("activo" in body && typeof body.activo !== "boolean") {
    return res.status(400).json({ error: "activo debe ser booleano" });
  }
  try {
    const actualizado = await updateTaller(id, body);
    if (!actualizado) return res.status(404).json({ error: "Taller no encontrado" });
    res.json(actualizado);
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Ya existe un taller con ese slug" });
    console.error(err);
    res.status(500).json({ error: "Error al actualizar taller" });
  }
};

export const deleteTallerById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  try {
    if (!(await deleteTaller(id))) return res.status(404).json({ error: "Taller no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al borrar taller" });
  }
};

const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const fetchRegistros = async (req, res) => {
  const tallerId = req.query.taller_id ? parseId(req.query.taller_id) : null;
  try {
    const registros = await getRegistros(tallerId);
    if (req.query.formato !== "csv") return res.json(registros);

    const encabezados = ["taller", "slug", "nombre", "telefono", "instagram", "edad", "fecha_registro"];
    const filas = registros.map((r) =>
      [
        r.taller_nombre,
        r.taller_slug,
        r.nombre,
        r.telefono,
        r.instagram,
        r.edad,
        new Date(r.creado_en).toLocaleString("es-MX", { timeZone: "America/Mexico_City" }),
      ].map(csvCell).join(",")
    );
    const fecha = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="registros_talleres_${fecha}.csv"`);
    // BOM para que Excel abra bien los acentos
    res.send("﻿" + [encabezados.join(","), ...filas].join("\n"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener registros" });
  }
};

export const deleteRegistroById = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "ID inválido" });
  try {
    if (!(await deleteRegistro(id))) return res.status(404).json({ error: "Registro no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al borrar registro" });
  }
};
