import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";

export default function PedidosCocina() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [intervalId, setIntervalId] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("todos");

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
      
      // Organizamos los datos y procesamos cancelaciones
      const productosOrganizados = organizarProductosPorTiempo(data);
      setPedidos(productosOrganizados);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los pedidos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Organizar productos estrictamente por tiempo de creación
  const organizarProductosPorTiempo = (data) => {
    // 1. Agrupar por orden_id, producto_id, y variantes (sabor, tamaño, ingrediente)
    const productosMap = {};
    
    // Primero, procesamos todos los productos y separamos originales y cancelaciones
    data.forEach(item => {
      // Crear una clave única para cada variante de producto en cada orden
      const clave = `${item.orden_id}_${item.producto_id}_${item.sabor_id || 'sin'}_${item.tamano_id || 'sin'}_${item.ingrediente_id || 'sin'}`;
      
      // Determinar si es una cancelación por el signo del precio o cantidad negativa
      const esCancelacion = item.cantidad < 0;
      
      if (!productosMap[clave]) {
        // Inicializamos el registro para este producto
        productosMap[clave] = {
          detalle_id: item.detalle_id,
          orden_id: item.orden_id,
          cliente: item.cliente || "Cliente sin nombre",
          producto_id: item.producto_id,
          nombre: item.nombre,
          categoria: item.categoria,
          cantidad_original: esCancelacion ? 0 : item.cantidad,
          cantidad_final: esCancelacion ? 0 : item.cantidad,
          notas: item.notas,
          notas_originales: esCancelacion ? "" : item.notas, // Guardamos las notas originales
          tiempo_creacion: item.tiempo_creacion,
          hora: new Date(item.tiempo_creacion).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          sabor_id: item.sabor_id,
          sabor_nombre: item.sabor_nombre,
          sabor_categoria: item.sabor_categoria,
          tamano_id: item.tamano_id,
          tamano_nombre: item.tamano_nombre,
          ingrediente_id: item.ingrediente_id,
          ingrediente_nombre: item.ingrediente_nombre,
          cancelaciones: [],
          tiene_cancelaciones: false,
          notas_cancelacion: "",
          total_cancelado: 0,
          cancelacion_completa: false
        };
      } else if (!esCancelacion) {
        // Si es un producto adicional (adición posterior), actualizamos la cantidad
        productosMap[clave].cantidad_original += item.cantidad;
        productosMap[clave].cantidad_final += item.cantidad;
        
        // Actualizamos notas originales si no existían
        if (!productosMap[clave].notas_originales && item.notas) {
          productosMap[clave].notas_originales = item.notas;
        }
      }
      
      // Si es una cancelación, la registramos
      if (esCancelacion) {
        productosMap[clave].tiene_cancelaciones = true;
        productosMap[clave].cantidad_final += item.cantidad; // Resta porque cantidad es negativa
        productosMap[clave].total_cancelado += Math.abs(item.cantidad);
        
        // Si la cantidad final es 0 o menos, marcamos como cancelación completa
        if (productosMap[clave].cantidad_final <= 0) {
          productosMap[clave].cancelacion_completa = true;
          productosMap[clave].cantidad_final = 0; // Aseguramos que nunca sea negativo
        }
        
        // Guardamos registro de la cancelación
        const notaCancelacion = item.notas ? item.notas.replace('CANCELACIÓN:', '').trim() : '';
        productosMap[clave].cancelaciones.push({
          cantidad: Math.abs(item.cantidad),
          tiempo: new Date(item.tiempo_creacion).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          notas: notaCancelacion
        });
        
        // Guardamos la última nota de cancelación para mostrarla en la tarjeta
        if (notaCancelacion && !productosMap[clave].notas_cancelacion) {
          productosMap[clave].notas_cancelacion = notaCancelacion;
        }
      }
    });
    
    // Convertimos el mapa a un array incluyendo también los que tienen cantidad cero
    // pero que tienen cancelaciones (para que los cocineros estén informados)
    const productos = Object.values(productosMap)
      .filter(producto => {
        // Incluimos productos con cantidad > 0 O productos cancelados completamente
        return producto.cantidad_final > 0 || producto.cancelacion_completa;
      })
      .sort((a, b) => new Date(a.tiempo_creacion) - new Date(b.tiempo_creacion));
    
    console.log("Productos procesados:", productos);
    return productos;
  };

  const marcarComoPreparado = async (detalle_id) => {
    try {
      const res = await fetch(`${API_URL}/orders/detalle/${detalle_id}/preparar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar estado");
      }
      
      // Actualizamos el estado local eliminando el producto preparado
      setPedidos(prevPedidos => 
        prevPedidos.filter(producto => producto.detalle_id !== detalle_id)
      );
    } catch (error) {
      console.error("Error al marcar como preparado:", error);
      alert("Error: " + error.message);
    }
  };

  // Función para mostrar detalles del producto incluyendo sabor, tamaño e ingrediente
  const formatearDetallesProducto = (producto) => {
    let detalles = producto.nombre;
 // Añadir sabor si existe
    if (producto.sabor_nombre) {
      detalles += ` - ${producto.sabor_nombre}`;
    }
    
    // Añadir tamaño para pulques
    if (producto.tamano_nombre) {
      detalles += ` (${producto.tamano_nombre})`;
    }
    
    // Añadir ingrediente extra para cenas
    if (producto.ingrediente_nombre) {
      detalles += ` + ${producto.ingrediente_nombre}`;
    }

    return detalles;
  };

  // Función para filtrar los pedidos según el tipo seleccionado
  const pedidosFiltrados = pedidos.filter(producto => {
    if (filtroTipo === "todos") return true;
    const tipoProducto = categoriasTipo[producto.categoria];
    return tipoProducto && tipoProducto.includes(filtroTipo);
  });

  if (loading && pedidos.length === 0) {
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
      
      {pedidosFiltrados.length === 0 ? (
        <p className="text-center text-gray-400 py-8">
          ¡No hay pedidos pendientes! 🎉
        </p>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((producto) => (
            <div
              key={producto.detalle_id}
              className={`flex flex-col bg-vino/80 rounded-xl p-4 shadow-md 
                ${producto.cancelacion_completa ? 'border-l-8 border-red-500' : 
                  producto.tiene_cancelaciones ? 'border-l-4 border-red-500' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-amarillo font-bold">
                  Orden #{producto.orden_id}
                </span>
                <span className="text-sm bg-negro px-2 py-1 rounded">
                  {producto.hora}
                </span>
              </div>
              
              <p className="text-lg font-subtitulo mb-2">
                {producto.cliente}
              </p>
              
              {/* Producto con toda la información */}
              <div className={`flex justify-between items-center p-3 rounded ${producto.cancelacion_completa ? 'bg-red-900/40' : 'bg-negro/30'}`}>
                <div className="flex-1">
                  <div className="flex items-center flex-wrap">
                    <p className="font-bold">
                      {producto.cantidad_final === 0 ? "0" : producto.cantidad_final}x {formatearDetallesProducto(producto)}
                    </p>
                    {producto.cancelacion_completa ? (
                      <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full animate-pulse">
                        CANCELADO COMPLETAMENTE
                      </span>
                    ) : producto.tiene_cancelaciones && (
                      <span className="ml-2 px-2 py-0.5 bg-amarillo text-negro text-xs rounded-full animate-pulse">
                        Cancelación parcial, cantidad cancelada: {producto.total_cancelado}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-amarillo">
                    {producto.categoria}
                    {producto.sabor_categoria ? ` - ${producto.sabor_categoria}`: ''}
                  </p>
                  
                  {/* Mostrar variantes para facilitar identificación */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {producto.sabor_nombre && (
                      <span className="text-xs bg-vino/70 px-2 py-0.5 rounded">
                        Sabor: {producto.sabor_nombre}
                      </span>
                    )}
                    {producto.tamano_nombre && (
                      <span className="text-xs bg-vino/70 px-2 py-0.5 rounded">
                        Tamaño: {producto.tamano_nombre}
                      </span>
                    )}
                    {producto.ingrediente_nombre && (
                      <span className="text-xs bg-vino/70 px-2 py-0.5 rounded">
                        Ingrediente: {producto.ingrediente_nombre}
                      </span>
                    )}
                  </div>
                  
                  {producto.tiene_cancelaciones && producto.notas_cancelacion && (
                    <p className="text-sm text-red-300 italic mt-1">
                      <span className="font-semibold">Motivo:</span> {producto.notas_cancelacion}
                    </p>
                  )}
                  
                  {/* Siempre mostrar las notas originales si existen */}
                  {producto.notas_originales && (
                    <p className="text-sm text-gray-300 italic mt-1">
                      <span className="font-semibold">Notas originales:</span> {producto.notas_originales}
                    </p>
                  )}
                </div>
                
                {!producto.cancelacion_completa && (
                  <button
                    onClick={() => marcarComoPreparado(producto.detalle_id)}
                    className="bg-green-700 hover:bg-green-600 text-black font-bold px-4 py-2 rounded-lg transition-colors shadow-md flex items-center justify-center"
                  >
                    <span className="mr-1">✓</span> Preparado
                  </button>
                )}
                
                {producto.cancelacion_completa && (
                  <button
                    onClick={() => marcarComoPreparado(producto.detalle_id)}
                    className="bg-red-700 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-md flex items-center justify-center"
                  >
                    <span className="mr-1">✓</span> Enterado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 