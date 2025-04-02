import { useState, useEffect } from "react";

export default function PedidosCocina() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPedidos();
    
    // Configurar actualización automática cada 30 segundos
    const intervalo = setInterval(cargarPedidos, 30000);
    
    return () => clearInterval(intervalo);
  }, []);

  const cargarPedidos = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Usamos el nuevo endpoint específico para cocina
      const res = await fetch("http://localhost:3000/orders/cocina/pendientes");
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
          cliente: item.cliente || "Cliente sin nombre",
          tiempo: item.tiempo_creacion,
          productos: []
        };
      }
      
      // Añadimos el producto pendiente con información de sabor, tamaño e ingrediente
      pedidosMap[item.orden_id].productos.push({
        producto_id: item.producto_id,
        detalle_id: item.detalle_id,
        nombre: item.nombre,
        categoria: item.categoria,
        cantidad: item.cantidad,
        notas: item.notas,
        sabor_id: item.sabor_id,
        sabor_nombre: item.sabor_nombre,
        sabor_categoria: item.sabor_categoria,
        tamano_id: item.tamano_id,
        tamano_nombre: item.tamano_nombre,
        ingrediente_id: item.ingrediente_id,
        ingrediente_nombre: item.ingrediente_nombre
      });
    });
    
    // Convertimos el objeto a un array y ordenamos por tiempo (más antiguo primero)
    return Object.values(pedidosMap)
      .sort((a, b) => new Date(a.tiempo) - new Date(b.tiempo));
  };

  const marcarProductoComoPreparado = async (detalle_id) => {
    try {
      // Usamos el nuevo endpoint para marcar como preparado
      const res = await fetch(`http://localhost:3000/orders/detalle/${detalle_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({}) // El estado se cambia automáticamente en el backend
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar estado");
      }
      
      // Actualizamos el estado localmente (quitamos el producto de la lista)
      setPedidos(prevPedidos => {
        const nuevoPedidos = prevPedidos.map(pedido => {
          // Filtramos el producto que se acaba de marcar como preparado
          const productosFiltrados = pedido.productos.filter(
            producto => producto.detalle_id !== detalle_id
          );
          
          return {
            ...pedido,
            productos: productosFiltrados
          };
        });
        
        // Filtramos pedidos que ya no tienen productos pendientes
        return nuevoPedidos.filter(pedido => pedido.productos.length > 0);
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

  // Función para mostrar detalles del producto incluyendo sabor, tamaño e ingrediente
  const formatearDetallesProducto = (producto) => {
    let detalles = producto.nombre;
    const esPulque = producto.categoria === 'Pulque' || producto.categoria === 'Pulques';
    const esCena = producto.categoria === 'Cena' || producto.categoria === 'Cenas';
    
    // Añadir sabor si existe
    if (producto.sabor_nombre) {
      detalles += ` - ${producto.sabor_nombre}`;
    }
    
    // Añadir tamaño para pulques
    if (esPulque && producto.tamano_nombre) {
      detalles += ` (${producto.tamano_nombre})`;
    }
    
    // Añadir ingrediente extra para cenas
    if (esCena && producto.ingrediente_nombre) {
      detalles += ` + ${producto.ingrediente_nombre}`;
    }

    return detalles;
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
            {pedido.cliente}
          </p>
          
          <div className="space-y-2">
            {pedido.productos.map((producto) => (
              <div
                key={producto.detalle_id}
                className="flex justify-between items-center bg-negro/30 p-3 rounded"
              >
                <div className="flex-1">
                  <p className="font-bold">
                    {producto.cantidad}x {formatearDetallesProducto(producto)}
                  </p>
                  <p className="text-xs text-amarillo">
                    {producto.categoria}
                    {producto.sabor_categoria ? ` - ${producto.sabor_categoria}`: ''}
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
          </div>
        </div>
      ))}
    </div>
  );
} 