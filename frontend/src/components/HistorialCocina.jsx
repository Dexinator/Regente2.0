import { useState, useEffect } from "react";

export default function HistorialCocina() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fecha, setFecha] = useState(obtenerFechaActual());

  function obtenerFechaActual() {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    cargarHistorial();
  }, [fecha]);

  const cargarHistorial = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Usamos el nuevo endpoint para historial de cocina
      const res = await fetch(`http://localhost:3000/orders/cocina/historial?fecha=${fecha}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar historial");
      }
      
      // Organizamos los datos para mostrarlos agrupados por orden
      const historicoOrganizado = organizarHistorial(data);
      setHistorial(historicoOrganizado);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudo cargar el historial. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const organizarHistorial = (data) => {
    // Agrupamos los productos por orden_id
    const historicoMap = {};
    
    data.forEach(item => {
      if (!historicoMap[item.orden_id]) {
        historicoMap[item.orden_id] = {
          orden_id: item.orden_id,
          cliente: item.cliente || "Cliente sin nombre",
          hora: new Date(item.tiempo_creacion).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          productos: []
        };
      }
      
      // Añadimos el producto preparado con información de sabor, tamaño e ingrediente
      historicoMap[item.orden_id].productos.push({
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
        ingrediente_nombre: item.ingrediente_nombre,
        hora_preparacion: item.tiempo_preparacion ? 
          new Date(item.tiempo_preparacion).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }) : 'N/A'
      });
    });
    
    // Convertimos el objeto a un array y ordenamos por hora (más reciente primero)
    return Object.values(historicoMap)
      .sort((a, b) => {
        // Convierte hora en formato HH:MM a minutos para comparar
        const getMinutes = (time) => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };
        
        // Para ordenar descendente (más reciente primero)
        return getMinutes(b.hora) - getMinutes(a.hora);
      });
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

  const formatearFecha = (fechaStr) => {
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
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
      <div className="flex flex-col gap-4 mb-6">
        <label className="font-bold text-amarillo">Seleccionar fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="bg-vino text-white px-4 py-2 rounded w-full"
        />
      </div>
      
      <h2 className="text-xl font-subtitulo">
        Historial: {formatearFecha(fecha)}
      </h2>
      
      {historial.length === 0 ? (
        <p className="text-center text-gray-400 py-8">
          No hay pedidos preparados para esta fecha
        </p>
      ) : (
        <div className="space-y-6">
          {historial.map((pedido) => (
            <div
              key={pedido.orden_id}
              className="bg-vino/80 rounded-xl p-4 shadow-md"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-amarillo font-bold">
                  Orden #{pedido.orden_id}
                </span>
                <span className="text-sm bg-negro px-2 py-1 rounded">
                  {pedido.hora}
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
                    <div>
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
                    
                    <div className="text-verde text-sm font-bold">
                      {producto.hora_preparacion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 