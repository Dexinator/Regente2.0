import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";

export default function PedidosPorEntregar() {
  const [pedidosAgrupados, setPedidosAgrupados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intervalId, setIntervalId] = useState(null);
  const [pedidosEnProceso, setPedidosEnProceso] = useState({});
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Mapeo de categorías a tipos (Alimentos/Bebidas/Barra)
  const categoriasTipo = {
    "Antojitos": ["Alimentos"],
    "Cenas": ["Alimentos"],
    "Pulque": ["Bebidas"],
    "Preparados": ["Bebidas"],
    "Cerveza": ["Barra"],
    "Cerveza Artesanal": ["Barra"],
    "Mezcal": ["Bebidas", "Barra"],
    "Otras Bebidas": ["Bebidas", "Barra"],
    "Botana": ["Barra"],
    "Sentencias": ["Alimentos", "Bebidas", "Barra"]
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
      const res = await fetch(`${API_URL}/orders/entregar`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar pedidos por entregar");
      }
      
      // Organizamos los datos por orden/cliente para facilitar la entrega
      const pedidosOrganizados = organizarPedidosPorOrden(data);
      setPedidosAgrupados(pedidosOrganizados);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los pedidos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Organizar por orden y cliente (conveniente para meseros)
  const organizarPedidosPorOrden = (data) => {
    // Agrupamos por orden
    const ordenes = {};
    
    data.forEach(item => {
      const ordenKey = item.orden_id;
      
      if (!ordenes[ordenKey]) {
        // Inicializamos los datos de la orden
        ordenes[ordenKey] = {
          orden_id: item.orden_id,
          cliente: item.cliente || "Cliente sin nombre",
          preso_id: item.preso_id,
          tiempo_preparacion: new Date(item.tiempo_preparacion),
          productos: []
        };
      }
      
      // Añadimos el producto a la orden
      ordenes[ordenKey].productos.push({
        detalle_id: item.detalle_id,
        producto_id: item.producto_id,
        nombre: item.nombre,
        categoria: item.categoria,
        cantidad: item.cantidad,
        sabor_id: item.sabor_id,
        sabor_nombre: item.sabor_nombre,
        tamano_id: item.tamano_id,
        tamano_nombre: item.tamano_nombre,
        ingrediente_id: item.ingrediente_id,
        ingrediente_nombre: item.ingrediente_nombre,
        notas: item.notas,
        tiempo_preparacion: new Date(item.tiempo_preparacion).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      });
      
      // Actualizamos el tiempo de preparación más reciente
      if (new Date(item.tiempo_preparacion) > ordenes[ordenKey].tiempo_preparacion) {
        ordenes[ordenKey].tiempo_preparacion = new Date(item.tiempo_preparacion);
      }
    });
    
    // Para cada orden, calculamos cuánto tiempo ha pasado desde la preparación
    Object.values(ordenes).forEach(orden => {
      const ahora = new Date();
      const tiempoEsperaMs = ahora - orden.tiempo_preparacion;
      const tiempoEsperaMin = Math.floor(tiempoEsperaMs / 60000);
      
      orden.tiempo_espera = tiempoEsperaMin;
      orden.hora_preparacion = orden.tiempo_preparacion.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    });
    
    // Convertimos a array y ordenamos por tiempo de espera (mayor primero)
    return Object.values(ordenes)
      .sort((a, b) => b.tiempo_espera - a.tiempo_espera);
  };

  // Función para marcar producto como entregado
  const marcarComoEntregado = async (detalle_id) => {
    try {
      // Primero marcamos el pedido como "en proceso" para la animación
      setPedidosEnProceso(prev => ({
        ...prev,
        [detalle_id]: true
      }));

      // Enviamos la petición al servidor
      const res = await fetch(`${API_URL}/orders/detalle/${detalle_id}/entregar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al marcar como entregado");
      }
      
      // Esperamos 1 segundo antes de quitar el pedido de la vista
      setTimeout(() => {
        // Actualizamos la lista de pedidos localmente
        setPedidosAgrupados(prevOrdenes => {
          // Creamos una copia profunda para trabajar
          const nuevasOrdenes = JSON.parse(JSON.stringify(prevOrdenes));
          
          // Para cada orden, filtramos el producto entregado
          const ordenesActualizadas = nuevasOrdenes.map(orden => {
            orden.productos = orden.productos.filter(
              producto => producto.detalle_id !== detalle_id
            );
            return orden;
          });
          
          // Filtramos órdenes que ya no tienen productos
          return ordenesActualizadas.filter(orden => orden.productos.length > 0);
        });
        
        // Y también lo quitamos de la lista de "en proceso"
        setPedidosEnProceso(prev => {
          const newState = {...prev};
          delete newState[detalle_id];
          return newState;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error al marcar como entregado:", error);
      alert("Error: " + error.message);
      
      // Si hay error, quitamos el estado "en proceso"
      setPedidosEnProceso(prev => {
        const newState = {...prev};
        delete newState[detalle_id];
        return newState;
      });
    }
  };

  // Marcar todos los productos de una orden como entregados
  const entregarOrdenCompleta = async (orden) => {
    const confirmar = window.confirm(
      `¿Deseas marcar como entregados todos los productos de la orden #${orden.orden_id}?`
    );
    
    if (!confirmar) return;
    
    // Extraemos todos los IDs de detalle de la orden
    const detalleIds = orden.productos.map(p => p.detalle_id);
    
    // Marcamos todos como en proceso
    const nuevosEnProceso = detalleIds.reduce((obj, id) => {
      obj[id] = true;
      return obj;
    }, {});
    
    setPedidosEnProceso(prev => ({
      ...prev,
      ...nuevosEnProceso
    }));
    
    try {
      // Enviamos todas las peticiones en paralelo
      const promesas = detalleIds.map(id => 
        fetch(`${API_URL}/orders/detalle/${id}/entregar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        })
      );
      
      await Promise.all(promesas);
      
      // Esperamos un segundo y eliminamos la orden completa
      setTimeout(() => {
        setPedidosAgrupados(prevOrdenes => 
          prevOrdenes.filter(o => o.orden_id !== orden.orden_id)
        );
        
        // Limpiamos el estado de proceso
        setPedidosEnProceso(prev => {
          const newState = {...prev};
          detalleIds.forEach(id => delete newState[id]);
          return newState;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error al entregar orden completa:", error);
      alert("Error: " + error.message);
      
      // Limpiamos el estado de proceso en caso de error
      setPedidosEnProceso(prev => {
        const newState = {...prev};
        detalleIds.forEach(id => delete newState[id]);
        return newState;
      });
    }
  };

  // Función para formatear detalles del producto
  const formatearDetallesProducto = (producto) => {
    let detalles = producto.nombre;
    
    if (producto.sabor_nombre) {
      detalles += ` - ${producto.sabor_nombre}`;
    }
    
    if (producto.tamano_nombre) {
      detalles += ` (${producto.tamano_nombre})`;
    }
    
    if (producto.ingrediente_nombre) {
      detalles += ` + ${producto.ingrediente_nombre}`;
    }

    return detalles;
  };

  // Función para obtener clase de urgencia según tiempo de espera
  const getClaseUrgencia = (tiempoEspera) => {
    if (tiempoEspera >= 10) return "bg-red-700 animate-pulse";
    if (tiempoEspera >= 5) return "bg-orange-600";
    return "bg-blue-800";
  };

  // Filtramos las órdenes según el tipo seleccionado
  const ordenesFiltradas = pedidosAgrupados
    .map(orden => ({
      ...orden,
      productos: orden.productos.filter(producto => {
        if (filtroTipo === "todos") return true;
        const tiposProducto = categoriasTipo[producto.categoria];
        return tiposProducto && tiposProducto.includes(filtroTipo);
      })
    }))
    .filter(orden => orden.productos.length > 0);

  if (loading && pedidosAgrupados.length === 0) {
    return <p className="text-center text-gray-400">Cargando pedidos por entregar...</p>;
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
        <h2 className="text-xl font-subtitulo">Pedidos listos para entregar</h2>
        <div className="flex items-center gap-4">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-vino text-white px-3 py-1 rounded text-sm hover:bg-amarillo hover:text-negro transition-colors"
          >
            <option value="todos">Todos los pedidos</option>
            <option value="Alimentos">Solo Alimentos</option>
            <option value="Bebidas">Solo Bebidas</option>
            <option value="Barra">Solo Barra</option>
          </select>
          <button
            onClick={cargarPedidos}
            className="bg-vino text-white px-3 py-1 rounded text-sm hover:bg-amarillo hover:text-negro transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>
      
      {ordenesFiltradas.length === 0 ? (
        <p className="text-center text-gray-400 py-8">
          No hay pedidos pendientes por entregar 🎉
        </p>
      ) : (
        <div className="space-y-6">
          {ordenesFiltradas.map((orden) => (
            <div
              key={orden.orden_id}
              className={`${getClaseUrgencia(orden.tiempo_espera)} rounded-xl p-4 shadow-md`}
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-lg font-bold text-white">
                    Orden #{orden.orden_id} - {orden.cliente}
                  </span>
                  {orden.preso_id && (
                    <span className="ml-2 bg-vino/80 text-white text-xs px-2 py-1 rounded">
                      Preso #{orden.preso_id}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-negro px-2 py-1 rounded">
                    Preparado: {orden.hora_preparacion}
                  </span>
                  <span className="text-sm bg-negro px-2 py-1 rounded font-bold">
                    {orden.tiempo_espera} min. espera
                  </span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {orden.productos.map((producto) => (
                  <div
                    key={producto.detalle_id}
                    className={`flex justify-between items-center bg-negro/30 p-3 rounded
                      ${pedidosEnProceso[producto.detalle_id] ? 'animate-pulse opacity-60 pointer-events-none' : ''}`}
                  >
                    <div>
                      <p className="font-bold">
                        {producto.cantidad}x {formatearDetallesProducto(producto)}
                      </p>
                      {producto.notas && (
                        <p className="text-sm text-gray-300 italic">
                          {producto.notas}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => marcarComoEntregado(producto.detalle_id)}
                        className="bg-green-700 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
                        disabled={pedidosEnProceso[producto.detalle_id]}
                      >
                        {pedidosEnProceso[producto.detalle_id] ? 'Procesando...' : 'Entregado'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => entregarOrdenCompleta(orden)}
                  className="bg-verde hover:bg-verde/80 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                >
                  Entregar orden completa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 