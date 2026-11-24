import { useState, useEffect, useRef } from "react";
import { API_URL } from "../utils/api.js";

// Genera un idempotency key único por clic; el backend lo usa para no duplicar
// una preparación si el cliente reintenta por red intermitente.
const nuevoIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `prep-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export default function PedidosCocina() {
  const [pedidosAgrupados, setPedidosAgrupados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intervalId, setIntervalId] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [pedidosEnProceso, setPedidosEnProceso] = useState({});
  // Set síncrono de claves en vuelo (sobrevive a re-renders rápidos y
  // rechaza el 2º clic antes de que el useState se refleje).
  const envíosEnVuelo = useRef(new Set());

  // Mapeo de categorías a tipos (Alimentos/Bebidas/Barra)
  const categoriasTipo = {
    "Antojitos": ["Alimentos"],
    "Cenas": ["Alimentos"],
    "Pulque": ["Bebidas"],
    "Preparados": ["Bebidas"],
    "Cerveza": ["Barra"],
    "Cerveza Artesanal": ["Barra"],
    "Mezcal": ["Barra"],
    "Otras Bebidas": ["Barra"],
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

  // Nueva función para organizar los pedidos en bloques de 10 minutos
  const organizarPedidosPorTiempoYProducto = (data) => {
    const bloquesTiempo = {};
    
    data.forEach(item => {
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
      
      // Procesar el producto con datos ya calculados del backend
      const productoProcessado = {
        ...item,
        // Mantener el tiempo original para ordenamiento estable
        tiempo_original: item.tiempo_creacion,
        // Convertir detalle_ids de string PostgreSQL array a JS array
        detalle_ids: item.detalle_ids ? 
          (typeof item.detalle_ids === 'string' ? 
            item.detalle_ids.replace(/[{}]/g, '').split(',').filter(id => id).map(id => parseInt(id)) : 
            item.detalle_ids) : 
          [item.detalle_id],
        // Procesar cancelaciones JSON
        cancelaciones: item.cancelaciones ? 
          (typeof item.cancelaciones === 'string' ? 
            JSON.parse(item.cancelaciones) : 
            item.cancelaciones).filter(c => c !== null) : 
          [],
        // Procesar notas múltiples
        notas: item.notas ? item.notas.split('; ').filter(n => n) : [],
        // Crear estructura de clientes compatible
        clientes: [item.cliente],
        clientes_por_orden: [{orden: item.orden_id, cliente: item.cliente}],
        cantidad_total: item.cantidad
      };
      
      // Añadir el producto al bloque correspondiente
      bloquesTiempo[bloqueKey].productos.push(productoProcessado);
    });
    
    // Ordenar productos dentro de cada bloque por tiempo original y detalle_id
    Object.keys(bloquesTiempo).forEach(key => {
      bloquesTiempo[key].productos.sort((a, b) => {
        // Primero ordenar por tiempo original
        const tiempoComparacion = new Date(a.tiempo_original) - new Date(b.tiempo_original);
        if (tiempoComparacion !== 0) return tiempoComparacion;
        // Si tienen el mismo tiempo, ordenar por el primer detalle_id para mantener orden estable
        return a.detalle_ids[0] - b.detalle_ids[0];
      });
    });
    
    // Convertimos el objeto a un array, ordenado por tiempo
    return Object.keys(bloquesTiempo)
      .sort()
      .map(key => ({
        ...bloquesTiempo[key],
        bloque_key: key
      }))
      .filter(bloque => bloque.productos.length > 0);
  };

  const marcarComoPreparado = async (producto) => {
    const claveProducto = producto.detalle_ids.join('-');

    // Rechazo síncrono del doble clic: si ya está en vuelo, salimos.
    if (envíosEnVuelo.current.has(claveProducto)) return;
    envíosEnVuelo.current.add(claveProducto);

    setPedidosEnProceso(prev => ({ ...prev, [claveProducto]: true }));

    // Idempotency key único por clic. Si la red falla y reintentamos,
    // el backend deduplica y no se prepara dos veces.
    const idempotencyKey = nuevoIdempotencyKey();
    const body = JSON.stringify({ cantidad: 1, idempotency_key: idempotencyKey });
    const url = `${API_URL}/orders/detalle/${producto.detalle_ids[0]}/preparar`;

    const intentarPreparar = async () => {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    };

    try {
      try {
        await intentarPreparar();
      } catch (primerError) {
        // Un reintento con el MISMO idempotency_key cubre el caso típico
        // de conexión intermitente sin arriesgar doble preparación.
        console.warn("Reintentando preparación tras fallo:", primerError);
        await new Promise(r => setTimeout(r, 1500));
        await intentarPreparar();
      }

      // Recargar inmediatamente; el estado "en proceso" se limpia al
      // confirmar que el detalle ya no está pendiente.
      await cargarPedidos();
    } catch (error) {
      console.error("Error al marcar como preparado:", error);
      alert(
        "No se pudo marcar como preparado tras reintentar. " +
        "Revisa la conexión y vuelve a intentarlo. " +
        "(El sistema evita duplicados si el servidor sí lo había recibido.)"
      );
    } finally {
      envíosEnVuelo.current.delete(claveProducto);
      setPedidosEnProceso(prev => {
        const copia = { ...prev };
        delete copia[claveProducto];
        return copia;
      });
    }
  };

  // Función para verificar si un producto está en proceso
  const estaEnProceso = (producto) => {
    const claveProducto = producto.detalle_ids.join('-');
    return pedidosEnProceso[claveProducto];
  };

  // Función para filtrar los bloques de tiempo según el tipo seleccionado
  const bloquesFiltrados = pedidosAgrupados
    .map(bloque => ({
      ...bloque,
      productos: bloque.productos.filter(producto => {
        if (filtroTipo === "todos") return true;
        const tiposProducto = categoriasTipo[producto.categoria];
        return tiposProducto && tiposProducto.includes(filtroTipo);
      })
    }))
    .filter(bloque => bloque.productos.length > 0);

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
        <h2 className="text-4xl font-subtitulo">Pedidos por preparar</h2>
        <div className="flex items-center gap-4">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-vino text-white px-6 py-3 rounded text-xl hover:bg-amarillo hover:text-negro transition-colors"
          >
            <option value="todos">Todos los pedidos</option>
            <option value="Alimentos">Solo Alimentos</option>
            <option value="Bebidas">Solo Bebidas</option>
            <option value="Barra">Solo Barra</option>
          </select>
          <button
            onClick={cargarPedidos}
            className="bg-vino text-white px-6 py-3 rounded text-xl hover:bg-amarillo hover:text-negro transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>
      
      {bloquesFiltrados.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-2xl">
          ¡No hay pedidos pendientes! 🎉
        </p>
      ) : (
        <div className="space-y-8">
          {bloquesFiltrados.map((bloque) => (
            <div key={bloque.bloque_key} className="bg-negro/20 rounded-xl p-4">
              <h3 className="text-3xl font-bold text-amarillo border-b border-amarillo/40 pb-2 mb-3">
                Pedidos de {bloque.hora}
              </h3>
              
              <div className="space-y-3">
                {bloque.productos.map((producto) => {
                  const estaProcesando = estaEnProceso(producto);
                  const estaCanceladoCompleto = producto.cancelado_completo || false;
                  
                  // Para productos completamente cancelados, mostrar un formato especial
                  if (estaCanceladoCompleto) {
                    // Calcular tiempo transcurrido desde la cancelación
                    const tiempoCancelacion = producto.ultima_cancelacion ? new Date(producto.ultima_cancelacion) : new Date();
                    const minutosTranscurridos = Math.floor((new Date() - tiempoCancelacion) / 60000);
                    
                    return (
                      <div
                        key={producto.detalle_ids.join('-')}
                        className="bg-red-950/50 rounded-xl p-4 shadow-md border-2 border-red-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-bold text-2xl text-red-300 line-through">
                              ❌ CANCELADO - {producto.nombre}
                              {producto.sabor_nombre && ` ${producto.sabor_nombre}`}
                              {producto.ingrediente_nombre && ` ${producto.ingrediente_nombre}`}
                              {producto.tamano_nombre && ` ${producto.tamano_nombre}`}
                            </p>
                            {producto.cancelaciones && producto.cancelaciones.length > 0 && (
                              <div className="mt-2">
                                {producto.cancelaciones.map((c, i) => (
                                  <p key={i} className="text-lg text-red-200 italic">
                                    Razón: {c.razon.replace('CANCELACIÓN:', '').trim()} 
                                    <span className="text-sm ml-2">
                                      (hace {minutosTranscurridos} min)
                                    </span>
                                  </p>
                                ))}
                              </div>
                            )}
                            <p className="text-sm text-gray-400 mt-1">
                              Cliente: {producto.cliente}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Construir la primera línea del producto normal. Si hay un 2do
                  // ingrediente extra (molletes con 2), se muestra como "ing1 + ing2".
                  const ingredientesStr = producto.ingrediente_nombre
                    ? (producto.ingrediente_extra_2_nombre
                        ? `${producto.ingrediente_nombre} + ${producto.ingrediente_extra_2_nombre}`
                        : producto.ingrediente_nombre)
                    : null;
                  const lineaProducto = [
                    `${producto.cantidad_total}`,
                    "X",
                    producto.nombre,
                    producto.sabor_nombre,
                    ingredientesStr,
                    producto.tamano_nombre
                  ].filter(Boolean).join(" ");
                  
                  return (
                    <div
                      key={producto.detalle_ids.join('-')}
                      className={`bg-vino/80 rounded-xl p-4 shadow-md 
                        ${producto.cancelaciones && producto.cancelaciones.length > 0 ? 'border-l-4 border-red-500' : ''}
                        ${estaProcesando ? 'animate-pulse opacity-60 bg-green-800/70 pointer-events-none' : ''}`}
                    >
                      {/* Primera línea: Cantidad X Nombre Sabor Ingrediente Tamaño */}
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-3xl leading-tight">
                          {lineaProducto}
                          {producto.es_para_llevar && (
                            <span className="text-lg bg-amarillo text-negro px-2 py-1 rounded ml-2">
                              🛍️ Para llevar
                            </span>
                          )}
                          {producto.nombre_sentencia_padre && (
                            <span className="text-lg text-cyan-400 italic ml-2">
                              (Parte de: {producto.nombre_sentencia_padre})
                            </span>
                          )}
                        </p>
                      </div>
                      
                      {/* Notas enumeradas a la izquierda */}
                      {producto.notas && producto.notas.length > 0 && (
                        <div className="mb-2">
                          {producto.notas.map((nota, index) => (
                            <p key={index} className="text-xl text-gray-300 italic">
                              {index + 1}. {nota}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {/* Cancelaciones si existen */}
                      {producto.cancelaciones && producto.cancelaciones.length > 0 && (
                        <div className="mb-2">
                          {producto.cancelaciones.map((c, i) => (
                            <p key={i} className="text-xl text-red-300 italic">
                              {producto.cancelaciones.length > 1 ? `${i + 1}. ` : ''}
                              Cancelado {c.cantidad}x: {c.razon.replace('CANCELACIÓN:', '').trim()}
                            </p>
                          ))}
                        </div>
                      )}
                      
                      {/* Botón más pequeño y nombres de clientes */}
                      <div className="flex justify-between items-end">
                        <div className="text-lg flex-1">
                          <span className="text-gray-400">Clientes: </span>
                          {producto.clientes_por_orden.map((item, index) => (
                            <span key={index} className={`${index > 0 ? 'ml-1' : ''} text-white`}>
                              {item.cliente}{index < producto.clientes_por_orden.length - 1 ? ',' : ''}
                            </span>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => marcarComoPreparado(producto)}
                          className="bg-green-700 hover:bg-green-600 text-white px-8 py-4 rounded text-xl font-bold transition-colors ml-2"
                          disabled={estaProcesando}
                        >
                          {estaProcesando ? "⏳" : "✓"}
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