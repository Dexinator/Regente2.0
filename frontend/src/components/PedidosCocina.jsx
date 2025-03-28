import { useState, useEffect } from "react";

export default function PedidosCocina() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Usamos el endpoint de órdenes abiertas y filtramos en frontend
      const res = await fetch("http://localhost:3000/orders/open");
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar pedidos");
      }
      
      // Organizamos los datos para mostrarlos agrupados por orden
      const pedidosOrganizados = organizarPedidos(data);
      setPedidos(pedidosOrganizados);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los pedidos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const organizarPedidos = (data) => {
    // Agrupamos los productos por orden_id
    const pedidosMap = {};
    
    data.forEach(item => {
      if (!pedidosMap[item.orden_id]) {
        pedidosMap[item.orden_id] = {
          orden_id: item.orden_id,
          mesa: item.mesa || "Sin mesa",
          cliente: item.cliente || "Cliente sin nombre",
          tiempo: item.tiempo_orden,
          productos: []
        };
      }
      
      // Si el item tiene productos, los añadimos
      if (item.productos) {
        item.productos.forEach(prod => {
          // Solo incluimos productos pendientes por preparar
          if (prod.estado_cocina !== "preparado") {
            pedidosMap[item.orden_id].productos.push({
              producto_id: prod.producto_id,
              detalle_id: prod.detalle_id,
              nombre: prod.nombre,
              cantidad: prod.cantidad,
              notas: prod.notas,
              estado: prod.estado_cocina
            });
          }
        });
      }
    });
    
    // Convertimos el objeto a un array y ordenamos por tiempo (más antiguo primero)
    return Object.values(pedidosMap)
      .filter(orden => orden.productos.length > 0) // Solo órdenes con productos pendientes
      .sort((a, b) => new Date(a.tiempo) - new Date(b.tiempo));
  };

  const marcarProductoComoPreparado = async (detalle_id) => {
    try {
      // Adaptamos para usar un endpoint general de órdenes
      const res = await fetch(`http://localhost:3000/orders/detalle/${detalle_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ estado_cocina: "preparado" })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar estado");
      }
      
      // Actualizamos el estado localmente
      setPedidos(prevPedidos => {
        return prevPedidos.map(pedido => {
          const productosActualizados = pedido.productos.map(producto => {
            if (producto.detalle_id === detalle_id) {
              return { ...producto, estado: "preparado" };
            }
            return producto;
          });
          
          return {
            ...pedido,
            productos: productosActualizados
          };
        }).filter(pedido => pedido.productos.some(p => p.estado !== "preparado"));
      });
      
    } catch (error) {
      console.error("Error al marcar como preparado:", error);
      alert("Error al actualizar el estado del producto");
    }
  };

  const calcularTiempoEspera = (tiempo) => {
    const fechaPedido = new Date(tiempo);
    const ahora = new Date();
    const diferencia = Math.floor((ahora - fechaPedido) / (1000 * 60)); // diferencia en minutos
    
    if (diferencia < 1) return "Menos de 1 minuto";
    if (diferencia === 1) return "1 minuto";
    return `${diferencia} minutos`;
  };

  if (loading) {
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

  if (pedidos.length === 0) {
    return (
      <div className="text-center">
        <p className="text-2xl mb-4">No hay pedidos pendientes</p>
        <p className="text-gray-400">Los nuevos pedidos aparecerán aquí</p>
        <button
          onClick={cargarPedidos}
          className="mt-6 bg-vino px-4 py-2 rounded"
        >
          Actualizar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <button
        onClick={cargarPedidos}
        className="bg-vino px-4 py-2 rounded mb-4 w-full"
      >
        Actualizar Pedidos
      </button>
      
      {pedidos.map((pedido) => (
        <div
          key={pedido.orden_id}
          className="bg-vino rounded-xl p-4 shadow-md"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-amarillo font-bold">Orden #{pedido.orden_id}</span>
            <span className="text-sm bg-negro px-2 py-1 rounded">
              {calcularTiempoEspera(pedido.tiempo)}
            </span>
          </div>
          
          <p className="text-lg font-subtitulo mb-4">
            {pedido.cliente} - Mesa: {pedido.mesa}
          </p>
          
          <div className="space-y-2">
            {pedido.productos
              .filter(producto => producto.estado !== "preparado")
              .map((producto) => (
                <div
                  key={producto.detalle_id}
                  className="flex justify-between items-center bg-negro/30 p-3 rounded"
                >
                  <div className="flex-1">
                    <p className="font-bold">
                      {producto.cantidad}x {producto.nombre}
                    </p>
                    {producto.notas && (
                      <p className="text-sm text-gray-300 italic">
                        {producto.notas}
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={() => marcarProductoComoPreparado(producto.detalle_id)}
                    className="bg-verde text-negro px-3 py-1 rounded-full font-bold"
                  >
                    Listo
                  </button>
                </div>
              ))}
              
            {/* Si todos los productos de este pedido están preparados, mostrar mensaje */}
            {pedido.productos.every(p => p.estado === "preparado") && (
              <p className="text-center text-verde font-bold py-2">
                ¡Todos los productos listos!
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 