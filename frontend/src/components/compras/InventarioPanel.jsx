import { useState, useEffect } from "react";
import {
  getInventario,
  updateNivelesInventario,
  getEstadisticasInventario,
  getAlertasInventario,
  atenderAlerta,
  getMovimientosInventario,
  getSugerenciasReorden,
  ajustarInventario
} from "../../utils/inventario-api";
import { getEmpleadoId } from "../../utils/auth";

export default function InventarioPanel() {
  const [inventario, setInventario] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vistaActiva, setVistaActiva] = useState("inventario");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [mostrarEditarNiveles, setMostrarEditarNiveles] = useState(null);
  const [mostrarAjustarInventario, setMostrarAjustarInventario] = useState(null);
  const [usuarioId, setUsuarioId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUsuarioId(getEmpleadoId());
    }
  }, []);

  useEffect(() => {
    if (usuarioId) {
      cargarDatos();
    }
  }, [usuarioId, vistaActiva]);

  useEffect(() => {
    if (vistaActiva === "inventario") {
      cargarInventario();
    }
  }, [filtroEstado]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      // Cargar estadísticas siempre
      const stats = await getEstadisticasInventario();
      setEstadisticas(stats);

      // Cargar datos según la vista activa
      switch (vistaActiva) {
        case "inventario":
          await cargarInventario();
          break;
        case "alertas":
          await cargarAlertas();
          break;
        case "movimientos":
          await cargarMovimientos();
          break;
        case "sugerencias":
          await cargarSugerencias();
          break;
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los datos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const cargarInventario = async () => {
    try {
      const data = await getInventario({ estado_stock: filtroEstado });
      setInventario(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar el inventario");
    }
  };

  const cargarAlertas = async () => {
    try {
      const data = await getAlertasInventario(false);
      setAlertas(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar las alertas");
    }
  };

  const cargarMovimientos = async () => {
    try {
      const data = await getMovimientosInventario({ limit: 100 });
      setMovimientos(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los movimientos");
    }
  };

  const cargarSugerencias = async () => {
    try {
      const data = await getSugerenciasReorden();
      setSugerencias(data);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar las sugerencias");
    }
  };

  const handleEditarNiveles = async (item, niveles) => {
    try {
      await updateNivelesInventario(item.insumo_id, item.unidad, niveles);
      setMostrarEditarNiveles(null);
      await cargarInventario();
      await cargarDatos();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al actualizar niveles");
    }
  };

  const handleAjustarInventario = async (item, nuevaCantidad, motivo) => {
    try {
      await ajustarInventario({
        insumo_id: item.insumo_id,
        unidad: item.unidad,
        nueva_cantidad: nuevaCantidad,
        motivo: motivo,
        usuario_id: usuarioId
      });
      setMostrarAjustarInventario(null);
      await cargarInventario();
      await cargarDatos();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al ajustar inventario");
    }
  };

  const handleAtenderAlerta = async (alertaId) => {
    try {
      await atenderAlerta(alertaId, usuarioId);
      await cargarAlertas();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al atender alerta");
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'sin_stock': return 'bg-red-900 text-red-200';
      case 'critico': return 'bg-orange-900 text-orange-200';
      case 'reordenar': return 'bg-yellow-900 text-yellow-200';
      case 'normal': return 'bg-green-900 text-green-200';
      case 'exceso': return 'bg-blue-900 text-blue-200';
      default: return 'bg-gray-900 text-gray-200';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'sin_stock': return 'Sin Stock';
      case 'critico': return 'Crítico';
      case 'reordenar': return 'Reordenar';
      case 'normal': return 'Normal';
      case 'exceso': return 'Exceso';
      default: return estado;
    }
  };

  const getTipoMovimientoColor = (tipo) => {
    switch (tipo) {
      case 'entrada': return 'text-green-400';
      case 'salida': return 'text-red-400';
      case 'venta': return 'text-yellow-400';
      case 'ajuste': return 'text-blue-400';
      case 'merma': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  if (typeof window === 'undefined' || !usuarioId) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  return (
    <div className="w-full">
      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-negro/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Total Insumos</p>
            <p className="text-2xl font-bold text-white">{estadisticas.total_insumos}</p>
          </div>
          <div className="bg-red-900/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Sin Stock</p>
            <p className="text-2xl font-bold text-red-200">{estadisticas.sin_stock}</p>
          </div>
          <div className="bg-orange-900/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Stock Crítico</p>
            <p className="text-2xl font-bold text-orange-200">{estadisticas.stock_critico}</p>
          </div>
          <div className="bg-yellow-900/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Para Reordenar</p>
            <p className="text-2xl font-bold text-yellow-200">{estadisticas.para_reordenar}</p>
          </div>
          <div className="bg-blue-900/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Alertas Activas</p>
            <p className="text-2xl font-bold text-blue-200">{estadisticas.alertas_activas}</p>
          </div>
          <div className="bg-green-900/50 p-4 rounded-lg text-center">
            <p className="text-gray-400 text-sm">Valor Total</p>
            <p className="text-xl font-bold text-green-200">
              ${(estadisticas.valor_total_inventario || 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Navegación de vistas */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {['inventario', 'alertas', 'movimientos', 'sugerencias'].map((vista) => (
            <button
              key={vista}
              onClick={() => setVistaActiva(vista)}
              className={`px-4 py-2 rounded-full font-bold ${
                vistaActiva === vista
                  ? "bg-amarillo text-negro"
                  : "bg-vino text-white"
              }`}
            >
              {vista.charAt(0).toUpperCase() + vista.slice(1)}
            </button>
          ))}
        </div>

        {vistaActiva === "inventario" && (
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-negro border border-gray-700 rounded p-2 text-white"
          >
            <option value="">Todos los estados</option>
            <option value="sin_stock">Sin Stock</option>
            <option value="critico">Crítico</option>
            <option value="reordenar">Para Reordenar</option>
            <option value="normal">Normal</option>
            <option value="exceso">Exceso</option>
          </select>
        )}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">Cargando...</div>
      ) : (
        <>
          {/* Vista de Inventario */}
          {vistaActiva === "inventario" && (
            <div className="overflow-x-auto">
              <table className="w-full bg-negro/50 rounded-lg">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-amarillo">Insumo</th>
                    <th className="text-left p-3 text-amarillo">Marca</th>
                    <th className="text-center p-3 text-amarillo">Cantidad</th>
                    <th className="text-center p-3 text-amarillo">Unidad</th>
                    <th className="text-center p-3 text-amarillo">Stock Min</th>
                    <th className="text-center p-3 text-amarillo">Punto Reorden</th>
                    <th className="text-center p-3 text-amarillo">Stock Max</th>
                    <th className="text-center p-3 text-amarillo">Estado</th>
                    <th className="text-center p-3 text-amarillo">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((item) => (
                    <tr key={`${item.insumo_id}-${item.unidad}`} className="border-b border-gray-800">
                      <td className="p-3 text-white">{item.insumo_nombre}</td>
                      <td className="p-3 text-gray-400">{item.marca || "-"}</td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${
                          item.cantidad_actual <= 0 ? 'text-red-400' :
                          item.cantidad_actual <= item.stock_minimo ? 'text-orange-400' :
                          'text-white'
                        }`}>
                          {item.cantidad_actual}
                        </span>
                      </td>
                      <td className="p-3 text-center text-gray-400">{item.unidad}</td>
                      <td className="p-3 text-center text-gray-400">{item.stock_minimo || 0}</td>
                      <td className="p-3 text-center text-gray-400">{item.punto_reorden || 0}</td>
                      <td className="p-3 text-center text-gray-400">{item.stock_maximo || 0}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${getEstadoColor(item.estado_stock)}`}>
                          {getEstadoTexto(item.estado_stock)}
                        </span>
                        {item.alertas_activas > 0 && (
                          <span className="ml-2 bg-red-900 text-red-200 px-2 py-1 rounded text-xs">
                            {item.alertas_activas} alertas
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setMostrarEditarNiveles(item)}
                          className="bg-vino text-white px-2 py-1 rounded text-sm mr-2"
                        >
                          Niveles
                        </button>
                        <button
                          onClick={() => setMostrarAjustarInventario(item)}
                          className="bg-blue-900 text-white px-2 py-1 rounded text-sm"
                        >
                          Ajustar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vista de Alertas */}
          {vistaActiva === "alertas" && (
            <div className="space-y-4">
              {alertas.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No hay alertas activas</p>
              ) : (
                alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`p-4 rounded-lg border ${
                      alerta.urgencia === 'critica' ? 'bg-red-900/30 border-red-500' :
                      alerta.urgencia === 'alta' ? 'bg-orange-900/30 border-orange-500' :
                      alerta.urgencia === 'normal' ? 'bg-yellow-900/30 border-yellow-500' :
                      'bg-blue-900/30 border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-bold">
                          {alerta.insumo_nombre}
                          {alerta.marca && <span className="text-gray-400 ml-2">({alerta.marca})</span>}
                        </h3>
                        <p className="text-gray-300 mt-1">
                          Tipo: {alerta.tipo_alerta === 'sin_stock' ? 'Sin Stock' :
                                alerta.tipo_alerta === 'stock_minimo' ? 'Stock Mínimo' :
                                'Punto de Reorden'}
                        </p>
                        <p className="text-gray-300">
                          Nivel actual: {alerta.nivel_actual} | Requerido: {alerta.nivel_requerido}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                          {new Date(alerta.fecha_alerta).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAtenderAlerta(alerta.id)}
                        className="bg-green-900 text-white px-3 py-1 rounded"
                      >
                        Atender
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Vista de Movimientos */}
          {vistaActiva === "movimientos" && (
            <div className="overflow-x-auto">
              <table className="w-full bg-negro/50 rounded-lg">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-amarillo">Fecha</th>
                    <th className="text-left p-3 text-amarillo">Insumo</th>
                    <th className="text-center p-3 text-amarillo">Tipo</th>
                    <th className="text-center p-3 text-amarillo">Cantidad</th>
                    <th className="text-left p-3 text-amarillo">Notas</th>
                    <th className="text-left p-3 text-amarillo">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov) => (
                    <tr key={mov.id} className="border-b border-gray-800">
                      <td className="p-3 text-gray-400">
                        {new Date(mov.fecha_movimiento).toLocaleString()}
                      </td>
                      <td className="p-3 text-white">
                        {mov.insumo_nombre}
                        {mov.marca && <span className="text-gray-400 ml-1">({mov.marca})</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className={getTipoMovimientoColor(mov.tipo_movimiento)}>
                          {mov.tipo_movimiento}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={mov.cantidad > 0 ? 'text-green-400' : 'text-red-400'}>
                          {mov.cantidad > 0 ? '+' : ''}{mov.cantidad} {mov.unidad}
                        </span>
                      </td>
                      <td className="p-3 text-gray-400 text-sm">{mov.notas || '-'}</td>
                      <td className="p-3 text-gray-400">{mov.usuario_nombre || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vista de Sugerencias */}
          {vistaActiva === "sugerencias" && (
            <div className="space-y-4">
              {sugerencias.length === 0 ? (
                <p className="text-center text-gray-400 py-10">No hay sugerencias de reorden</p>
              ) : (
                sugerencias.map((sug) => (
                  <div key={`${sug.insumo_id}-${sug.unidad}`} className="bg-negro/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-bold">
                          {sug.insumo_nombre}
                          {sug.marca && <span className="text-gray-400 ml-2">({sug.marca})</span>}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                          <div>
                            <p className="text-gray-400 text-sm">Stock Actual</p>
                            <p className="text-white">{sug.cantidad_actual} {sug.unidad}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Consumo Diario</p>
                            <p className="text-white">
                              {sug.consumo_diario_promedio?.toFixed(2) || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Días Restantes</p>
                            <p className={`font-bold ${
                              sug.dias_inventario_restante <= 3 ? 'text-red-400' :
                              sug.dias_inventario_restante <= 7 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {sug.dias_inventario_restante || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Punto Reorden Sugerido</p>
                            <p className="text-amarillo font-bold">
                              {sug.punto_reorden_sugerido}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const item = inventario.find(
                            i => i.insumo_id === sug.insumo_id && i.unidad === sug.unidad
                          );
                          if (item) {
                            setMostrarEditarNiveles({
                              ...item,
                              punto_reorden_sugerido: sug.punto_reorden_sugerido,
                              stock_maximo_sugerido: sug.stock_maximo_sugerido
                            });
                          }
                        }}
                        className="bg-amarillo text-negro px-3 py-1 rounded font-bold"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Modal de Editar Niveles */}
      {mostrarEditarNiveles && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-negro/95 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-subtitulo text-amarillo mb-4">
              Editar Niveles de Inventario
            </h3>
            <p className="text-white mb-4">
              {mostrarEditarNiveles.insumo_nombre} ({mostrarEditarNiveles.unidad})
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleEditarNiveles(mostrarEditarNiveles, {
                  stock_minimo: parseFloat(formData.get('stock_minimo')),
                  punto_reorden: parseFloat(formData.get('punto_reorden')),
                  stock_maximo: parseFloat(formData.get('stock_maximo')),
                  tiempo_entrega_dias: parseInt(formData.get('tiempo_entrega_dias'))
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-white mb-1">Stock Mínimo</label>
                <input
                  type="number"
                  name="stock_minimo"
                  defaultValue={mostrarEditarNiveles.stock_minimo}
                  min="0"
                  step="0.01"
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white mb-1">Punto de Reorden</label>
                <input
                  type="number"
                  name="punto_reorden"
                  defaultValue={mostrarEditarNiveles.punto_reorden_sugerido || mostrarEditarNiveles.punto_reorden}
                  min="0"
                  step="0.01"
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />
                {mostrarEditarNiveles.punto_reorden_sugerido && (
                  <p className="text-amarillo text-sm mt-1">
                    Sugerido: {mostrarEditarNiveles.punto_reorden_sugerido}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-white mb-1">Stock Máximo</label>
                <input
                  type="number"
                  name="stock_maximo"
                  defaultValue={mostrarEditarNiveles.stock_maximo_sugerido || mostrarEditarNiveles.stock_maximo}
                  min="0"
                  step="0.01"
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />
                {mostrarEditarNiveles.stock_maximo_sugerido && (
                  <p className="text-amarillo text-sm mt-1">
                    Sugerido: {mostrarEditarNiveles.stock_maximo_sugerido}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-white mb-1">Tiempo de Entrega (días)</label>
                <input
                  type="number"
                  name="tiempo_entrega_dias"
                  defaultValue={mostrarEditarNiveles.tiempo_entrega_dias || 1}
                  min="1"
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setMostrarEditarNiveles(null)}
                  className="bg-gray-700 text-white px-4 py-2 rounded-full"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amarillo text-negro px-6 py-2 rounded-full font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ajustar Inventario */}
      {mostrarAjustarInventario && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-negro/95 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-subtitulo text-amarillo mb-4">
              Ajustar Inventario
            </h3>
            <p className="text-white mb-2">
              {mostrarAjustarInventario.insumo_nombre} ({mostrarAjustarInventario.unidad})
            </p>
            <p className="text-gray-400 mb-4">
              Cantidad actual: {mostrarAjustarInventario.cantidad_actual}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAjustarInventario(
                  mostrarAjustarInventario,
                  parseFloat(formData.get('nueva_cantidad')),
                  formData.get('motivo')
                );
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-white mb-1">Nueva Cantidad *</label>
                <input
                  type="number"
                  name="nueva_cantidad"
                  defaultValue={mostrarAjustarInventario.cantidad_actual}
                  min="0"
                  step="0.01"
                  required
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white mb-1">Motivo del Ajuste *</label>
                <textarea
                  name="motivo"
                  required
                  rows="3"
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                  placeholder="Explica la razón del ajuste..."
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setMostrarAjustarInventario(null)}
                  className="bg-gray-700 text-white px-4 py-2 rounded-full"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amarillo text-negro px-6 py-2 rounded-full font-bold"
                >
                  Ajustar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}