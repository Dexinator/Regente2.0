import { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import { API_URL } from "../utils/api.js";
import { getToken } from "../utils/auth.js";

// Sitio público donde la gente se registra (proyecto talleres-palacio en Vercel)
const TALLERES_URL = (import.meta.env.PUBLIC_TALLERES_URL || "https://talleres-palacio.vercel.app").replace(/\/$/, "");

const FORM_VACIO = { slug: "", nombre: "", descripcion: "", cupo_max: 20, fecha_evento: "" };

const formatoFecha = (iso) =>
  new Date(iso).toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const urlPublica = (slug) => `${TALLERES_URL}/taller/${slug}`;

const slugDesdeNombre = (nombre) =>
  nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export default function TalleresPanel() {
  const [talleres, setTalleres] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [filtro, setFiltro] = useState("todos");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState(FORM_VACIO);
  const [slugEditado, setSlugEditado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const api = async (path, options = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Error ${res.status}`);
    }
    return res;
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: "", texto: "" }), 4000);
  };

  const cargarDatos = async () => {
    try {
      const [t, r] = await Promise.all([
        api("/talleres").then((res) => res.json()),
        api("/talleres/registros").then((res) => res.json()),
      ]);
      setTalleres(t);
      setRegistros(r);
    } catch (err) {
      mostrarMensaje("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const registrosFiltrados = useMemo(
    () => (filtro === "todos" ? registros : registros.filter((r) => r.taller_id === Number(filtro))),
    [registros, filtro]
  );

  const handleNombre = (nombre) => {
    setFormData((f) => ({ ...f, nombre, slug: slugEditado ? f.slug : slugDesdeNombre(nombre) }));
  };

  const crearTaller = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api("/talleres", {
        method: "POST",
        body: JSON.stringify({
          slug: formData.slug.trim(),
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || null,
          cupo_max: Number(formData.cupo_max),
          fecha_evento: formData.fecha_evento ? new Date(formData.fecha_evento).toISOString() : null,
        }),
      });
      setFormData(FORM_VACIO);
      setSlugEditado(false);
      setMostrarFormulario(false);
      mostrarMensaje("exito", "Taller creado");
      await cargarDatos();
    } catch (err) {
      mostrarMensaje("error", err.message);
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (t) => {
    try {
      await api(`/talleres/${t.id}`, { method: "PATCH", body: JSON.stringify({ activo: !t.activo }) });
      await cargarDatos();
    } catch (err) {
      mostrarMensaje("error", err.message);
    }
  };

  const borrarTaller = async (t) => {
    if (!window.confirm(`¿Borrar el taller "${t.nombre}" y sus ${t.inscritos} registros?`)) return;
    try {
      await api(`/talleres/${t.id}`, { method: "DELETE" });
      mostrarMensaje("exito", "Taller borrado");
      await cargarDatos();
    } catch (err) {
      mostrarMensaje("error", err.message);
    }
  };

  const borrarRegistro = async (r) => {
    if (!window.confirm(`¿Borrar el registro de ${r.nombre}?`)) return;
    try {
      await api(`/talleres/registros/${r.id}`, { method: "DELETE" });
      await cargarDatos();
    } catch (err) {
      mostrarMensaje("error", err.message);
    }
  };

  const copiarLink = async (t) => {
    try {
      await navigator.clipboard.writeText(urlPublica(t.slug));
      mostrarMensaje("exito", "Link copiado");
    } catch {
      window.prompt("Copia el link:", urlPublica(t.slug));
    }
  };

  const descargar = (href, nombreArchivo) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const descargarQR = async (t) => {
    try {
      const dataUrl = await QRCode.toDataURL(urlPublica(t.slug), {
        width: 1024,
        margin: 2,
        errorCorrectionLevel: "M",
      });
      descargar(dataUrl, `qr-${t.slug}.png`);
    } catch (err) {
      mostrarMensaje("error", "No se pudo generar el QR");
    }
  };

  const exportarCSV = async () => {
    try {
      const qs = filtro === "todos" ? "" : `&taller_id=${filtro}`;
      const res = await api(`/talleres/registros?formato=csv${qs}`);
      const url = URL.createObjectURL(await res.blob());
      descargar(url, `registros_talleres_${new Date().toISOString().slice(0, 10)}.csv`);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      mostrarMensaje("error", err.message);
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Cargando talleres...</div>;

  return (
    <div className="space-y-8">
      {mensaje.texto && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg font-bold shadow-lg ${
            mensaje.tipo === "error" ? "bg-red-600 text-white" : "bg-amarillo text-negro"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Talleres */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Talleres</h2>
          <button
            onClick={() => setMostrarFormulario((v) => !v)}
            className="bg-amarillo text-negro px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition"
          >
            {mostrarFormulario ? "Cancelar" : "+ Nuevo"}
          </button>
        </div>

        {mostrarFormulario && (
          <form onSubmit={crearTaller} className="bg-vino/30 border border-vino rounded-lg p-4 mb-4 space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Nombre</label>
              <input
                required
                minLength={2}
                value={formData.nombre}
                onChange={(e) => handleNombre(e.target.value)}
                className="w-full px-4 py-2 rounded bg-negro text-white"
                placeholder="Taller de barro navideño"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Link</label>
              <div className="flex items-center rounded bg-negro">
                <span className="pl-3 text-xs text-gray-500 whitespace-nowrap">/taller/</span>
                <input
                  required
                  pattern="[a-z0-9-]{3,60}"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugEditado(true);
                    setFormData((f) => ({ ...f, slug: e.target.value }));
                  }}
                  className="w-full px-1 py-2 rounded bg-negro text-white"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Minúsculas, números y guiones.</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Descripción</label>
              <textarea
                rows={2}
                value={formData.descripcion}
                onChange={(e) => setFormData((f) => ({ ...f, descripcion: e.target.value }))}
                className="w-full px-4 py-2 rounded bg-negro text-white"
              />
            </div>
            <div className="flex gap-3">
              <div className="w-28">
                <label className="block text-sm font-bold mb-2">Cupo</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.cupo_max}
                  onChange={(e) => setFormData((f) => ({ ...f, cupo_max: e.target.value }))}
                  className="w-full px-4 py-2 rounded bg-negro text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold mb-2">Fecha y hora</label>
                <input
                  type="datetime-local"
                  value={formData.fecha_evento}
                  onChange={(e) => setFormData((f) => ({ ...f, fecha_evento: e.target.value }))}
                  className="w-full px-4 py-2 rounded bg-negro text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-amarillo text-negro py-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-50"
            >
              {guardando ? "Creando..." : "Crear taller"}
            </button>
          </form>
        )}

        {talleres.length === 0 ? (
          <p className="text-center py-8 text-gray-400">Todavía no hay talleres.</p>
        ) : (
          <div className="space-y-3">
            {talleres.map((t) => (
              <div key={t.id} className="bg-vino/20 border border-vino rounded-lg p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white">{t.nombre}</p>
                    <p className="text-xs text-gray-400 truncate">/taller/{t.slug}</p>
                    <p className="text-sm text-gray-300 mt-1">
                      {t.fecha_evento ? formatoFecha(t.fecha_evento) : "Sin fecha"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-bold ${t.disponibles === 0 ? "text-red-400" : "text-amarillo"}`}>
                      {t.inscritos}/{t.cupo_max}
                    </p>
                    <button
                      onClick={() => toggleActivo(t)}
                      className={`text-xs px-2 py-1 rounded mt-1 ${
                        t.activo ? "bg-green-700 text-white" : "bg-gray-600 text-gray-200"
                      }`}
                      title={t.activo ? "Pausar registros" : "Reactivar registros"}
                    >
                      {t.activo ? "Activo" : "Pausado"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 text-sm">
                  <button onClick={() => copiarLink(t)} className="flex-1 bg-negro rounded py-2 hover:bg-gray-800">
                    🔗 Copiar link
                  </button>
                  <button onClick={() => descargarQR(t)} className="flex-1 bg-negro rounded py-2 hover:bg-gray-800">
                    ⬇ QR
                  </button>
                  <button onClick={() => borrarTaller(t)} className="px-3 bg-negro rounded py-2 text-red-400 hover:bg-gray-800">
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Registros */}
      <section>
        <div className="flex justify-between items-center mb-4 gap-2">
          <h2 className="text-2xl font-bold">Registros</h2>
          <button
            onClick={exportarCSV}
            disabled={registrosFiltrados.length === 0}
            className="bg-vino px-3 py-2 rounded-lg text-sm font-bold hover:bg-vino/80 disabled:opacity-40"
          >
            ⬇ CSV
          </button>
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full px-4 py-2 rounded bg-negro text-white border border-vino mb-3"
        >
          <option value="todos">Todos los talleres ({registros.length})</option>
          {talleres.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} ({t.inscritos})
            </option>
          ))}
        </select>

        {registrosFiltrados.length === 0 ? (
          <p className="text-center py-8 text-gray-400">Todavía no hay registros.</p>
        ) : (
          <div className="space-y-2">
            {registrosFiltrados.map((r) => (
              <div key={r.id} className="bg-negro border border-vino/50 rounded-lg p-3 flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-white">
                    {r.nombre}
                    {r.edad ? <span className="text-gray-400 font-normal"> · {r.edad} años</span> : null}
                  </p>
                  <p className="text-sm">
                    <a href={`tel:${r.telefono}`} className="text-amarillo">
                      {r.telefono}
                    </a>
                    {r.instagram && (
                      <a
                        href={`https://instagram.com/${r.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amarillo ml-3"
                      >
                        @{r.instagram}
                      </a>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {filtro === "todos" ? `${r.taller_nombre} · ` : ""}
                    {formatoFecha(r.creado_en)}
                  </p>
                </div>
                <button onClick={() => borrarRegistro(r)} className="text-xs text-red-400 self-start">
                  Borrar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
