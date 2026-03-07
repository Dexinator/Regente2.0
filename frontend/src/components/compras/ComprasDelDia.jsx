import { useState, useEffect } from "react";
import { 
  getComprasDelDia, 
  getDiasCompraDisponibles,
  createCompra 
} from "../../utils/compras-api";
import { getEmpleadoId } from "../../utils/auth";

export default function ComprasDelDia() {
  const [comprasDelDia, setComprasDelDia] = useState([]);
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mostrarFormularioCompra, setMostrarFormularioCompra] = useState(null);
  const [itemsSeleccionados, setItemsSeleccionados] = useState({});
  const [usuarioId, setUsuarioId] = useState(null);

  useEffect(() => {
    // Solo ejecutar en el cliente (después del hydrate)
    if (typeof window !== 'undefined') {
      // Obtener ID del usuario
      setUsuarioId(getEmpleadoId());
      
      cargarDiasDisponibles();
      // Configurar día actual por defecto
      const hoy = new Date();
      const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaHoy = diasSemana[hoy.getDay()];
      setDiaSeleccionado(diaHoy);
    }
  }, []);

  useEffect(() => {
    if (diaSeleccionado) {
      cargarComprasDelDia();
    }
  }, [diaSeleccionado]);

  const cargarDiasDisponibles = async () => {
    try {
      const dias = await getDiasCompraDisponibles();
      setDiasDisponibles(dias);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar días disponibles");
    }
  };

  const cargarComprasDelDia = async () => {
    setLoading(true);
    setError("");
    
    try {
      const data = await getComprasDelDia(diaSeleccionado);
      setComprasDelDia(data);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las compras del día. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemSeleccionado = (proveedorId, itemIndex, checked) => {
    setItemsSeleccionados(prev => {
      const key = `${proveedorId}_${itemIndex}`;
      if (checked) {
        return { ...prev, [key]: true };
      } else {
        const newItems = { ...prev };
        delete newItems[key];
        return newItems;
      }
    });
  };

  const registrarCompra = async (proveedor) => {
    if (!usuarioId) {
      alert("Error: No se pudo obtener el ID del usuario");
      return;
    }

    const itemsParaComprar = proveedor.items.filter((_, index) => 
      itemsSeleccionados[`${proveedor.proveedor_id}_${index}`]
    );

    if (itemsParaComprar.length === 0) {
      alert("Selecciona al menos un item para comprar");
      return;
    }

    try {
      // Calcular total provisional (luego se puede ajustar)
      const total = itemsParaComprar.reduce((sum, item) => {
        const precio = item.precio_referencia || 0;
        const cantidad = item.cantidad || 1;
        return sum + (precio * cantidad);
      }, 0);

      const compraData = {
        proveedor_id: proveedor.proveedor_id,
        usuario_id: usuarioId,
        total: total,
        metodo_pago: "efectivo", // Por defecto
        solicito_factura: false,
        notas: `Compra del día ${diaSeleccionado}`,
        items: itemsParaComprar.map(item => ({
          insumo_id: item.insumo_id,
          requisicion_item_id: item.requisicion_item_id,
          precio_unitario: item.precio_referencia || 0,
          cantidad: item.cantidad || 1,
          unidad: item.unidad
        }))
      };

      await createCompra(compraData);
      
      // Limpiar selecciones
      setItemsSeleccionados(prev => {
        const newItems = { ...prev };
        proveedor.items.forEach((_, index) => {
          delete newItems[`${proveedor.proveedor_id}_${index}`];
        });
        return newItems;
      });

      // Recargar datos
      await cargarComprasDelDia();
      
      alert("Compra registrada exitosamente");
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al registrar la compra");
    }
  };

  const getUrgenciaColor = (urgencia) => {
    switch (urgencia) {
      case 'urgente': return 'bg-red-900/50 text-red-200';
      case 'alta': return 'bg-yellow-900/50 text-yellow-200';
      case 'normal': return 'bg-green-900/50 text-green-200';
      case 'baja': return 'bg-blue-900/50 text-blue-200';
      default: return 'bg-gray-900/50 text-gray-200';
    }
  };

  // Mostrar loading inicial si estamos en el servidor o aún no se ha cargado el usuario
  if (typeof window === 'undefined' || !usuarioId) {
    return <div className="text-center py-10">Cargando...</div>;
  }

  if (loading && comprasDelDia.length === 0) {
    return <div className="text-center py-10">Cargando compras del día...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-subtitulo text-amarillo">Compras del Día</h2>
        <div className="flex gap-4 items-center">
          <select
            value={diaSeleccionado}
            onChange={(e) => setDiaSeleccionado(e.target.value)}
            className="bg-negro border border-gray-700 rounded p-2 text-white"
          >
            <option value="">Seleccionar día</option>
            {diasDisponibles.map((dia) => (
              <option key={dia.value} value={dia.value}>
                {dia.label}
              </option>
            ))}
          </select>
          <button
            onClick={cargarComprasDelDia}
            className="bg-vino text-white px-4 py-2 rounded-full font-bold"
          >
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      {!diaSeleccionado ? (
        <div className="text-center py-10 text-gray-400">
          Selecciona un día para ver las compras programadas
        </div>
      ) : comprasDelDia.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No hay compras programadas para {diasDisponibles.find(d => d.value === diaSeleccionado)?.label || diaSeleccionado}
        </div>
      ) : (
        <div className="space-y-6">
          {comprasDelDia.map((proveedor) => (
            <div key={proveedor.proveedor_id} className="bg-negro/50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl text-amarillo font-bold">
                  {proveedor.proveedor_nombre}
                </h3>
                <div className="flex gap-2">
                  {proveedor.items.some((_, index) => 
                    itemsSeleccionados[`${proveedor.proveedor_id}_${index}`]
                  ) && (
                    <button
                      onClick={() => registrarCompra(proveedor)}
                      className="bg-green-700 text-white px-4 py-2 rounded font-bold"
                    >
                      Registrar Compra
                    </button>
                  )}
                </div>
              </div>

              {proveedor.items.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No hay items pendientes para este proveedor
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-white">
                    <thead className="bg-vino/70 text-white">
                      <tr>
                        <th className="p-2 text-center">Seleccionar</th>
                        <th className="p-2 text-left">Insumo</th>
                        <th className="p-2 text-center">Cantidad</th>
                        <th className="p-2 text-center">Tipo</th>
                        <th className="p-2 text-center">Urgencia</th>
                        <th className="p-2 text-center">Stock Actual</th>
                        <th className="p-2 text-center">Precio Ref.</th>
                        <th className="p-2 text-left">Solicitante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proveedor.items.map((item, index) => (
                        <tr key={`${item.insumo_id}_${index}`} className="border-b border-gray-700">
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={itemsSeleccionados[`${proveedor.proveedor_id}_${index}`] || false}
                              onChange={(e) => 
                                toggleItemSeleccionado(proveedor.proveedor_id, index, e.target.checked)
                              }
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="p-2">
                            <div>
                              <div className="font-semibold">{item.insumo_nombre}</div>
                              <div className="text-sm text-gray-400">{item.insumo_categoria}</div>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            {item.cantidad} {item.unidad}
                          </td>
                          <td className="p-2 text-center">
                            <span className={`
                              px-2 py-1 rounded text-xs
                              ${item.es_requisicion ? 'bg-blue-900/50 text-blue-200' : 'bg-orange-900/50 text-orange-200'}
                            `}>
                              {item.es_requisicion ? "Requisición" : "Stock Bajo"}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            {item.urgencia && (
                              <span className={`px-2 py-1 rounded text-xs ${getUrgenciaColor(item.urgencia)}`}>
                                {item.urgencia}
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            <span className={item.necesita_reposicion ? 'text-red-400' : 'text-white'}>
                              {item.stock_actual || 0} {item.unidad}
                            </span>
                            {item.stock_minimo && (
                              <div className="text-xs text-gray-400">
                                Min: {item.stock_minimo}
                              </div>
                            )}
                          </td>
                          <td className="p-2 text-center">
                            {item.precio_referencia ? `$${item.precio_referencia}` : "Sin precio"}
                          </td>
                          <td className="p-2">
                            <div>
                              {item.solicitante_nombre && (
                                <div className="text-sm">{item.solicitante_nombre}</div>
                              )}
                              {item.fecha_solicitud && (
                                <div className="text-xs text-gray-400">
                                  {new Date(item.fecha_solicitud).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}