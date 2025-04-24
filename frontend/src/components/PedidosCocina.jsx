import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";

export default function PedidosCocina() {
  const [pedidosAgrupados, setPedidosAgrupados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intervalId, setIntervalId] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [pedidosEnProceso, setPedidosEnProceso] = useState({});

  // Mapeo de categorías a tipo (Alimentos/Bebidas)
  const categoriasTipo = {
    "Antojitos": "Alimentos",
    "Cenas": "Alimentos",
    "Pulque": "Bebidas",
    "Otras Bebidas": "Bebidas",
    "Sin Alcohol": "Bebidas",
    "Mezcal": "Bebidas",
    "Sentencias": "Alimentos, Bebidas",
    "Cerveza Artesanal": "Bebidas",
    "Cerveza": "Bebidas"
  };

  useEffect(() => {
    // Al montar el componente, cargamos los pedidos iniciales
    cargarPedidos();
    
    // Configuramos recarga automática cada 30 segundos
    const id = setInterval(cargarPedidos, 30000);
    setIntervalId(id);
    
    // Al desmontar, limpiamos el intervalo
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const cargarPedidos = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/orders/cocina`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar pedidos");
      }
      
      // Organizamos los pedidos en bloques de 10 minutos y agrupamos productos similares
      const pedidosOrganizados = organizarPedidosPorTiempoYProducto(data);
      setPedidosAgrupados(pedidosOrganizados);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los pedidos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para organizar los pedidos en bloques de 10 minutos y agrupar productos
  const organizarPedidosPorTiempoYProducto = (data) => {
    // Primero, separamos productos por bloques de 10 minutos
    const bloquesTiempo = {};
    
    data.forEach(item => {
      // Determinamos si es cancelación por cantidad negativa
      const esCancelacion = item.cantidad < 0;
      if (esCancelacion) return; // Ignoramos cancelaciones para la agrupación inicial

      // Obtenemos la fecha del pedido y redondeamos a bloques de 10 minutos
      const fecha = new Date(item.tiempo_creacion);
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
    
    // Procesamos las cancelaciones y agrupamos productos similares dentro de cada bloque
    Object.keys(bloquesTiempo).forEach(bloqueKey => {
      const bloque = bloquesTiempo[bloqueKey];
      const productosAgrupados = {};
      
      // Primero agrupamos los productos normales
      bloque.productos.forEach(producto => {
        // Creamos una clave única por producto con sus variantes
        const clave = `${producto.producto_id}_${producto.sabor_id || 'sin'}_${producto.tamano_id || 'sin'}_${producto.ingrediente_id || 'sin'}`;
        
        if (!productosAgrupados[clave]) {
          productosAgrupados[clave] = {
            detalle_ids: [producto.detalle_id], // Guardamos todos los IDs para marcar como preparados
            producto_id: producto.producto_id,
            nombre: producto.nombre,
            categoria: producto.categoria,
            cantidad_total: producto.cantidad,
            tiempo_creacion: producto.tiempo_creacion,
            sabor_id: producto.sabor_id,
            sabor_nombre: producto.sabor_nombre,
            sabor_categoria: producto.sabor_categoria,
            tamano_id: producto.tamano_id,
            tamano_nombre: producto.tamano_nombre,
            ingrediente_id: producto.ingrediente_id,
            ingrediente_nombre: producto.ingrediente_nombre,
            notas: producto.notas ? [producto.notas] : [],
            ordenes: [`#${producto.orden_id}`] // Guardamos números de orden para referencia
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
        }
      });
      
      // Ahora procesamos las cancelaciones
      data.forEach(item => {
        if (item.cantidad >= 0) return; // Solo nos interesan cancelaciones
        
        // Verificamos si esta cancelación pertenece a este bloque de tiempo
        const fechaCancel = new Date(item.tiempo_creacion);
        const minutosCancel = fechaCancel.getMinutes();
        const bloqueMinutosCancel = Math.floor(minutosCancel / 10) * 10;
        fechaCancel.setMinutes(bloqueMinutosCancel, 0, 0);
        
        if (fechaCancel.toISOString() !== bloqueKey) return;
        
        // Buscamos el producto correspondiente
        const clave = `${item.producto_id}_${item.sabor_id || 'sin'}_${item.tamano_id || 'sin'}_${item.ingrediente_id || 'sin'}`;
        
        if (productosAgrupados[clave]) {
          // Actualizamos la cantidad y añadimos nota de cancelación
          productosAgrupados[clave].cantidad_total += item.cantidad; // Restamos porque la cantidad es negativa
          
          if (productosAgrupados[clave].cantidad_total <= 0) {
            // Si se canceló todo, quitamos el producto de la lista
            delete productosAgrupados[clave];
          } else if (item.notas) {
            // Añadimos nota de cancelación si existe
            const notaCancelacion = item.notas.includes('CANCELACIÓN:') ? 
              item.notas : `CANCELACIÓN: ${item.notas}`;
            
            if (!productosAgrupados[clave].cancelaciones) {
              productosAgrupados[clave].cancelaciones = [];
            }
            
            productosAgrupados[clave].cancelaciones.push({
              cantidad: Math.abs(item.cantidad),
              nota: notaCancelacion
            });
          }
        }
      });
      
      // Actualizamos los productos del bloque con los productos agrupados y filtrados
      bloque.productos = Object.values(productosAgrupados);
    });
    
    // Convertimos el objeto a un array, ordenado por tiempo
    return Object.keys(bloquesTiempo)
      .sort()
      .map(key => ({
        ...bloquesTiempo[key],
        bloque_key: key
      }))
      .filter(bloque => bloque.productos.length > 0); // Solo bloques con productos
  };

  const marcarComoPreparado = async (detalleIds) => {
    // Si no es un array, lo convertimos
    if (!Array.isArray(detalleIds)) {
      detalleIds = [detalleIds];
    }

    try {
      // Marcamos todos los productos como "en proceso" para la animación
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
        fetch(`${API_URL}/orders/detalle/${detalle_id}/preparar`, {
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
        throw new Error("Error al actualizar uno o más productos");
      }
      
      // Después de 2 segundos, recargamos todos los pedidos
      setTimeout(() => {
        cargarPedidos();
        
        // Y limpiamos la lista de "en proceso"
        setPedidosEnProceso({});
      }, 2000);
      
    } catch (error) {
      console.error("Error al marcar como preparado:", error);
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

  // Función para filtrar los bloques de tiempo según el tipo seleccionado
  const bloquesFiltrados = pedidosAgrupados
    .map(bloque => ({
      ...bloque,
      productos: bloque.productos.filter(producto => {
        if (filtroTipo === "todos") return true;
        const tipoProducto = categoriasTipo[producto.categoria];
        return tipoProducto && tipoProducto.includes(filtroTipo);
      })
    }))
    .filter(bloque => bloque.productos.length > 0); // Solo mostrar bloques con productos después del filtro

  if (loading && pedidosAgrupados.length === 0) {
    return <p className="text-center text-gray-400">Cargando pedidos...</p>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={cargarPedidos}
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
        <h2 className="text-xl font-subtitulo">Pedidos por preparar</h2>
        <div className="flex items-center gap-4">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-vino text-white px-3 py-1 rounded text-sm hover:bg-amarillo hover:text-negro transition-colors"
          >
            <option value="todos">Todos los pedidos</option>
            <option value="Alimentos">Solo Alimentos</option>
            <option value="Bebidas">Solo Bebidas</option>
          </select>
          <button
            onClick={cargarPedidos}
            className="bg-vino text-white px-3 py-1 rounded text-sm hover:bg-amarillo hover:text-negro transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>
      
      {bloquesFiltrados.length === 0 ? (
        <p className="text-center text-gray-400 py-8">
          ¡No hay pedidos pendientes! 🎉
        </p>
      ) : (
        <div className="space-y-8">
          {bloquesFiltrados.map((bloque) => (
            <div key={bloque.bloque_key} className="bg-negro/20 rounded-xl p-4">
              <h3 className="text-lg font-bold text-amarillo border-b border-amarillo/40 pb-2 mb-3">
                Pedidos de {bloque.hora}
              </h3>
              
              <div className="space-y-3">
                {bloque.productos.map((producto) => {
                  const estaProcesando = estaEnProceso(producto.detalle_ids);
                  
                  return (
                    <div
                      key={producto.detalle_ids.join('-')}
                      className={`bg-vino/80 rounded-xl p-4 shadow-md 
                        ${producto.cancelaciones ? 'border-l-4 border-red-500' : ''}
                        ${estaProcesando ? 'animate-pulse opacity-60 bg-green-800/70 pointer-events-none' : ''}`}
                    >
                      {/* Producto y Cantidad */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">
                          {producto.nombre}
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
                      
                      {/* Información de órdenes (opcional, podemos ocultarlo) */}
                      <div className="mt-2 text-xs text-gray-400">
                        Órdenes: {producto.ordenes.join(', ')}
                      </div>
                      
                      {/* Alertas de Cancelación */}
                      {producto.cancelaciones && producto.cancelaciones.length > 0 && (
                        <div className="mt-2 px-2 py-1 bg-amarillo text-negro text-xs font-bold rounded animate-pulse text-center">
                          {producto.cancelaciones.reduce((sum, c) => sum + c.cantidad, 0)} cancelado(s)
                        </div>
                      )}
                      
                      {/* Notas */}
                      {producto.notas && producto.notas.length > 0 && (
                        <div className="mt-2 text-sm text-gray-300 italic">
                          <span className="font-semibold">Notas:</span> {producto.notas.join(' | ')}
                        </div>
                      )}
                      
                      {/* Cancelaciones */}
                      {producto.cancelaciones && producto.cancelaciones.length > 0 && (
                        <div className="mt-2 text-sm text-red-300 italic">
                          <span className="font-semibold">Motivos de cancelación:</span>
                          <ul className="ml-2">
                            {producto.cancelaciones.map((c, i) => (
                              <li key={i}>• {c.cantidad}x: {c.nota}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Botón de acción */}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => marcarComoPreparado(producto.detalle_ids)}
                          className="bg-green-700 hover:bg-green-600 text-black font-bold px-4 py-2 rounded-lg transition-colors shadow-md flex items-center justify-center"
                          disabled={estaProcesando}
                        >
                          {estaProcesando ? (
                            <span className="mr-1">✓ Procesando...</span>
                          ) : (
                            <span className="mr-1">✓ Marcar como preparado</span>
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