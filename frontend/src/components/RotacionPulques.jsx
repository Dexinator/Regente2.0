import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";
import { getToken } from "../utils/auth.js";

// Misma normalización que el backend para comparar nombres de sabores
const normalizarNombre = (nombre) => nombre.trim().replace(/\s+/g, " ");
const claveNombre = (nombre) => normalizarNombre(nombre).toLocaleLowerCase("es");

const formatearFecha = (fecha) => {
  if (!fecha) return "sin pedidos";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
};

export default function RotacionPulques() {
  const [pulques, setPulques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lista final de sabores activos por producto, mientras se edita
  const [borrador, setBorrador] = useState({});
  const [nuevoSabor, setNuevoSabor] = useState({});

  // Resumen simulado esperando confirmación
  const [resumen, setResumen] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_URL}/variantes/pulques`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error al cargar los sabores de pulque");
      }

      const data = await response.json();
      setPulques(data);
      setBorrador(Object.fromEntries(data.map(p => [p.producto_id, p.activos.map(s => s.nombre)])));
      setNuevoSabor({});
      setResumen(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: "", texto: "" }), 6000);
  };

  const agregarSabor = (productoId, nombre) => {
    const limpio = normalizarNombre(nombre || "");
    if (!limpio) return;

    const actuales = borrador[productoId] || [];
    if (actuales.some(s => claveNombre(s) === claveNombre(limpio))) {
      mostrarMensaje("error", `"${limpio}" ya está en la lista`);
      return;
    }

    setBorrador({ ...borrador, [productoId]: [...actuales, limpio] });
    setNuevoSabor({ ...nuevoSabor, [productoId]: "" });
    setResumen(null);
  };

  const quitarSabor = (productoId, nombre) => {
    setBorrador({
      ...borrador,
      [productoId]: (borrador[productoId] || []).filter(s => s !== nombre)
    });
    setResumen(null);
  };

  // Qué le pasará a cada sabor de la lista al aplicar
  const estadoSabor = (pulque, nombre) => {
    const activo = pulque.activos.find(s => claveNombre(s.nombre) === claveNombre(nombre));
    if (activo && !activo.historico) return { texto: "sigue", clase: "bg-gray-600" };
    if (activo?.historico) return { texto: "registro nuevo", clase: "bg-green-700" };
    if (pulque.anteriores.some(s => claveNombre(s.nombre) === claveNombre(nombre))) {
      return { texto: "regresa", clase: "bg-amarillo text-negro" };
    }
    return { texto: "nuevo", clase: "bg-green-700" };
  };

  const tieneCambios = (pulque) => {
    const lista = borrador[pulque.producto_id] || [];
    if (pulque.activos.some(s => s.historico)) return true;
    if (lista.length !== pulque.activos.length) return true;
    return lista.some(nombre => !pulque.activos.some(s => claveNombre(s.nombre) === claveNombre(nombre)));
  };

  const pulquesConCambios = pulques.filter(tieneCambios);

  const enviarRotacion = async (simular) => {
    const sinSabores = pulquesConCambios.find(p => (borrador[p.producto_id] || []).length === 0);
    if (sinSabores) {
      mostrarMensaje("error", `${sinSabores.producto_nombre} necesita al menos un sabor`);
      return;
    }

    try {
      setProcesando(true);
      const response = await fetch(`${API_URL}/variantes/pulques/rotacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          simular,
          cambios: pulquesConCambios.map(p => ({
            producto_id: p.producto_id,
            sabores: borrador[p.producto_id]
          }))
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Error al aplicar los sabores");

      if (simular) {
        setResumen(data.resumen);
      } else {
        await cargarDatos();
        mostrarMensaje("exito", "Sabores de la semana actualizados");
      }
    } catch (err) {
      mostrarMensaje("error", err.message);
    } finally {
      setProcesando(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amarillo mx-auto"></div>
        <p className="mt-4 text-gray-400">Cargando sabores de pulque...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="text-center py-8">
      <p className="text-red-500 mb-4">{error}</p>
      <button onClick={cargarDatos} className="bg-vino px-4 py-2 rounded hover:bg-vino/80">
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {mensaje.texto && (
        <div className={`mb-4 p-4 rounded-lg ${
          mensaje.tipo === 'exito' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {mensaje.texto}
        </div>
      )}

      <p className="text-gray-400 mb-6">
        Arma la lista de sabores de cada pulque para esta semana. Los que quites dejan de aparecer
        al tomar pedidos, pero se conservan en el historial.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {pulques.map(pulque => {
          const lista = borrador[pulque.producto_id] || [];
          const sugerencias = pulque.anteriores.filter(
            s => !lista.some(nombre => claveNombre(nombre) === claveNombre(s.nombre))
          );

          return (
            <div
              key={pulque.producto_id}
              className={`bg-vino rounded-lg p-4 border-2 ${tieneCambios(pulque) ? 'border-amarillo' : 'border-transparent'}`}
            >
              <h2 className="text-xl font-bold text-amarillo mb-3">{pulque.producto_nombre}</h2>

              <div className="space-y-2 mb-4">
                {lista.length === 0 && (
                  <p className="text-sm text-red-300">Sin sabores: agrega al menos uno</p>
                )}
                {lista.map(nombre => {
                  const estado = estadoSabor(pulque, nombre);
                  return (
                    <div key={nombre} className="flex items-center justify-between bg-negro rounded px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold truncate">{nombre}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${estado.clase}`}>
                          {estado.texto}
                        </span>
                      </div>
                      <button
                        onClick={() => quitarSabor(pulque.producto_id, nombre)}
                        className="text-red-400 hover:text-red-300 text-xl leading-none px-2"
                        aria-label={`Quitar ${nombre}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  agregarSabor(pulque.producto_id, nuevoSabor[pulque.producto_id]);
                }}
                className="flex gap-2 mb-3"
              >
                <input
                  type="text"
                  list={`anteriores-${pulque.producto_id}`}
                  value={nuevoSabor[pulque.producto_id] || ""}
                  onChange={(e) => setNuevoSabor({ ...nuevoSabor, [pulque.producto_id]: e.target.value })}
                  placeholder="Nuevo sabor..."
                  maxLength={255}
                  className="flex-1 min-w-0 px-3 py-2 rounded bg-negro text-white"
                />
                <datalist id={`anteriores-${pulque.producto_id}`}>
                  {sugerencias.map(s => <option key={s.id} value={s.nombre} />)}
                </datalist>
                <button type="submit" className="bg-amarillo text-negro font-bold px-4 py-2 rounded hover:bg-yellow-500">
                  +
                </button>
              </form>

              {sugerencias.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Semanas pasadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {sugerencias.slice(0, 8).map(s => (
                      <button
                        key={s.id}
                        onClick={() => agregarSabor(pulque.producto_id, s.nombre)}
                        title={`Último pedido: ${formatearFecha(s.ultimo_uso)}`}
                        className="text-xs bg-negro hover:bg-gray-700 px-2 py-1 rounded-full"
                      >
                        + {s.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pulques.length === 0 && (
        <p className="text-center text-gray-400 py-8">No hay pulques configurados para rotar sabores</p>
      )}

      {resumen ? (
        <div className="bg-negro border-2 border-amarillo rounded-lg p-4">
          <h2 className="text-xl font-bold text-amarillo mb-3">Revisa los cambios</h2>
          <div className="space-y-3 mb-4">
            {resumen.map(r => (
              <div key={r.producto_id}>
                <p className="font-bold">{r.producto_nombre}</p>
                <ul className="text-sm ml-4 space-y-0.5">
                  {r.salen.map(s => <li key={`sale-${s.id}`} className="text-red-400">− Sale {s.nombre}</li>)}
                  {r.nuevos.map(s => <li key={`nuevo-${s.nombre}`} className="text-green-400">+ Entra {s.nombre} (nuevo)</li>)}
                  {r.regresan.map(s => <li key={`regresa-${s.id}`} className="text-amarillo">+ Regresa {s.nombre}</li>)}
                  {r.quedan.map(s => <li key={`queda-${s.id}`} className="text-gray-400">= Sigue {s.nombre}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => enviarRotacion(false)}
              disabled={procesando}
              className="bg-amarillo text-negro font-bold px-6 py-3 rounded hover:bg-yellow-500 disabled:opacity-50"
            >
              {procesando ? "Aplicando..." : "Confirmar sabores"}
            </button>
            <button
              onClick={() => setResumen(null)}
              disabled={procesando}
              className="bg-gray-700 px-6 py-3 rounded hover:bg-gray-600"
            >
              Seguir editando
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => enviarRotacion(true)}
            disabled={procesando || pulquesConCambios.length === 0}
            className="bg-amarillo text-negro font-bold px-6 py-3 rounded hover:bg-yellow-500 disabled:opacity-50"
          >
            {pulquesConCambios.length === 0 ? "Sin cambios" : "Revisar cambios"}
          </button>
          {pulquesConCambios.length > 0 && (
            <button
              onClick={cargarDatos}
              disabled={procesando}
              className="bg-gray-700 px-6 py-3 rounded hover:bg-gray-600"
            >
              Descartar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
