import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";

export default function HistorialCocina() {
  const [pedidosAgrupados, setPedidosAgrupados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pedidosEnProceso, setPedidosEnProceso] = useState({});

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Usamos el endpoint para historial de cocina (ya filtra por día actual)
      const res = await fetch(`${API_URL}/orders/cocina/historial`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar historial");
      }
      
      // Organizamos los datos por bloques de tiempo y productos similares
      const historicoOrganizado = organizarHistorialPorBloques(data);
      setPedidosAgrupados(historicoOrganizado);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudo cargar el historial. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para organizar el historial en bloques de 10 minutos
  const organizarHistorialPorBloques = (data) => {
    // Ordenamos por tiempo de preparación
    const preparadosOrdenados = [...data].sort((a, b) => 
      new Date(b.tiempo_preparacion) - new Date(a.tiempo_preparacion)
    );
    
    // Separamos productos por bloques de 10 minutos (según tiempo de preparación)
    const bloquesTiempo = {};
    
    preparadosOrdenados.forEach(item => {
      // Obtenemos la fecha de preparación y redondeamos a bloques de 10 minutos
      const fecha = new Date(item.tiempo_preparacion);
      const minutos = fecha.getMinutes();
      const bloqueMinutos = Math.floor(minutos / 10) * 10;
      fecha.setMinutes(bloqueMinutos, 0, 0);
      
      const bloqueKey = fecha.toISOString();
      
      if (!bloquesTiempo[bloqueKey]) {
        bloquesTiempo[bloqueKey] = {
          hora: fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          productos: []
        };
      }
      
      // Añadir el producto al bloque
      bloquesTiempo[bloqueKey].productos.push(item);
    });
    
    // Agrupamos productos similares dentro de cada bloque
    Object.keys(bloquesTiempo).forEach(bloqueKey => {
      const bloque = bloquesTiempo[bloqueKey];
      const productosAgrupados = {};
      
      bloque.productos.forEach(producto => {
        // Creamos una clave única por producto con sus variantes
        const clave = `${producto.producto_id}_${producto.sabor_id || 'sin'}_${producto.tamano_id || 'sin'}_${producto.ingrediente_id || 'sin'}`;
        
        if (!productosAgrupados[clave]) {
          productosAgrupados[clave] = {
            detalle_ids: [producto.detalle_id], // Guardamos todos los IDs para despreparar
            producto_id: producto.producto_id,
            nombre: producto.nombre,
            categoria: producto.categoria,
            cantidad_total: producto.cantidad,
            tiempo_preparacion: producto.tiempo_preparacion,
            hora_preparacion: new Date(producto.tiempo_preparacion).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            sabor_id: producto.sabor_id,
            sabor_nombre: producto.sabor_nombre,
            sabor_categoria: producto.sabor_categoria,
            tamano_id: producto.tamano_id,
            tamano_nombre: producto.tamano_nombre,
            ingrediente_id: producto.ingrediente_id,
            ingrediente_nombre: producto.ingrediente_nombre,
            notas: producto.notas ? [producto.notas] : [],
            ordenes: [`#${producto.orden_id}`], // Guardamos números de orden para referencia
            es_para_llevar: producto.es_para_llevar,
            cliente: producto.cliente
          };
        } else {
          // Actualizamos los datos del producto existente
          productosAgrupados[clave].detalle_ids.push(producto.detalle_id);
          productosAgrupados[clave].cantidad_total += producto.cantidad;
          
          // Solo agregamos órdenes y notas si no están ya presentes
          if (!productosAgrupados[clave].ordenes.includes(`#${producto.orden_id}`)) {
            productosAgrupados[clave].ordenes.push(`#${producto.orden_id}`);
          }
          
          if (producto.notas && !productosAgrupados[clave].notas.includes(producto.notas)) {
            productosAgrupados[clave].notas.push(producto.notas);
          }
          
          // Si algún producto es para llevar, marcamos el grupo como para llevar
          if (producto.es_para_llevar) {
            productosAgrupados[clave].es_para_llevar = true;
          }
        }
      });
      
      // Actualizamos los productos del bloque con los productos agrupados
      bloque.productos = Object.values(productosAgrupados);
    });
    
    // Convertimos el objeto a un array, ordenado por tiempo (más reciente primero)
    return Object.keys(bloquesTiempo)
      .sort()
      .reverse() // Para mostrar los más recientes primero
      .map(key => ({
        ...bloquesTiempo[key],
        bloque_key: key
      }));
  };
  
  // Función para "despreparar" un producto (marcar como no preparado)
  const desprepararProducto = async (detalleIds) => {
    // Si no es un array, lo convertimos
    if (!Array.isArray(detalleIds)) {
      detalleIds = [detalleIds];
    }
    
    // Confirmación solo si hay múltiples productos
    const mensaje = detalleIds.length > 1 
      ? `¿Seguro que deseas marcar ${detalleIds.length} productos como no preparados?` 
      : "¿Seguro que deseas marcar este producto como no preparado?";
    
    const confirmar = window.confirm(mensaje);
    if (!confirmar) return;
    
    try {
      // Marcamos los productos como "en proceso" para la animación
      const nuevosEnProceso = detalleIds.reduce((obj, id) => {
        obj[id] = true;
        return obj;
      }, {});
      
      setPedidosEnProceso(prev => ({
        ...prev,
        ...nuevosEnProceso
      }));

      // Para cada detalle_id, enviamos la petición al servidor
      const promesas = detalleIds.map(detalle_id => 
        fetch(`${API_URL}/orders/detalle/${detalle_id}/despreparar`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({})
        })
      );
      
      // Esperamos a que todas las peticiones se completen
      const resultados = await Promise.all(promesas);
      
      // Verificamos si hubo errores
      if (resultados.some(res => !res.ok)) {
        throw new Error("Error al despreparar uno o más productos");
      }
      
      // Después de 2 segundos, recargamos todos los pedidos
      setTimeout(() => {
        cargarHistorial();
        
        // Y limpiamos la lista de "en proceso"
        setPedidosEnProceso({});
      }, 2000);
      
      alert("Productos marcados como no preparados correctamente");
    } catch (error) {
      console.error("Error al despreparar productos:", error);
      alert("Error: " + error.message);
      
      // Si hay error, quitamos el estado "en proceso"
      setPedidosEnProceso({});
    }
  };

  // Función para verificar si un producto está en proceso
  const estaEnProceso = (detalleIds) => {
    if (!Array.isArray(detalleIds)) {
      detalleIds = [detalleIds];
    }
    return detalleIds.some(id => pedidosEnProceso[id]);
  };

  if (loading) {
    return <p className="text-center text-gray-400">Cargando historial...</p>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={cargarHistorial}
          className="mt-4 bg-vino px-4 py-2 rounded"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-subtitulo">Historial del día de hoy</h2>
        <button
          onClick={cargarHistorial}
          className="bg-vino text-white px-3 py-1 rounded text-sm hover:bg-amarillo hover:text-negro transition-colors"
        >
          Actualizar
        </button>
      </div>
      
      {pedidosAgrupados.length === 0 ? (
        <p className="text-center text-gray-400 py-8">
          No hay pedidos preparados para hoy
        </p>
      ) : (
        <div className="space-y-8">
          {pedidosAgrupados.map((bloque) => (
            <div key={bloque.bloque_key} className="bg-negro/20 rounded-xl p-4">
              <h3 className="text-lg font-bold text-amarillo border-b border-amarillo/40 pb-2 mb-3">
                Preparados a las {bloque.hora}
              </h3>
              
              <div className="space-y-3">
                {bloque.productos.map((producto) => {
                  const estaProcesando = estaEnProceso(producto.detalle_ids);
                  
                  return (
                    <div
                      key={producto.detalle_ids.join('-')}
                      className={`bg-vino/80 rounded-xl p-4 shadow-md 
                        ${estaProcesando ? 'animate-pulse opacity-60 bg-red-800/70 pointer-events-none' : ''}`}
                    >
                      {/* Producto y Cantidad */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">
                          {producto.nombre}
                          {producto.es_para_llevar && (
                            <span className="text-sm bg-amarillo text-negro px-2 py-1 rounded ml-2 font-normal">
                              🛍️ Para llevar
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-amarillo">
                            {producto.cantidad_total}x
                          </span>
                          <span className="text-xs text-amarillo">{producto.categoria}</span>
                        </div>
                      </div>
                      
                      {/* Variantes */}
                      <div className="mt-2 space-y-1">
                        {producto.sabor_nombre && (
                          <div className="flex items-center">
                            <span className="text-xs font-semibold w-20">Sabor:</span>
                            <span className="bg-vino/70 px-2 py-0.5 rounded text-xl">{producto.sabor_nombre}</span>
                          </div>
                        )}
                        
                        {producto.tamano_nombre && (
                          <div className="flex items-center">
                            <span className="text-xs font-semibold w-20">Tamaño:</span>
                            <span className="bg-vino/70 px-2 py-0.5 rounded text-xl">{producto.tamano_nombre}</span>
                          </div>
                        )}
                        
                        {producto.ingrediente_nombre && (
                          <div className="flex items-center">
                            <span className="text-xs font-semibold w-20">Ingrediente:</span>
                            <span className="bg-vino/70 px-2 py-0.5 rounded text-xl">{producto.ingrediente_nombre}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Información del cliente y órdenes */}
                      <div className="mt-2 text-sm">
                        <span className="text-gray-300">Cliente: </span>
                        <span className="text-white font-semibold">{producto.cliente}</span>
                        <span className="text-xs text-gray-400 ml-2">({producto.ordenes.join(', ')})</span>
                      </div>
                      
                      {/* Notas */}
                      {producto.notas && producto.notas.length > 0 && (
                        <div className="mt-2 text-sm text-gray-300 italic">
                          <span className="font-semibold">Notas:</span> {producto.notas.join(' | ')}
                        </div>
                      )}
                      
                      {/* Botón de acción */}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => desprepararProducto(producto.detalle_ids)}
                          className="bg-red-800 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-md flex items-center justify-center"
                          disabled={estaProcesando}
                        >
                          {estaProcesando ? (
                            <span className="mr-1">Procesando...</span>
                          ) : (
                            <span className="mr-1">Despreparar</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 