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
      // Adaptamos para usar un endpoint general de orders filtrando por fecha
      const res = await fetch(`http://localhost:3000/orders?fecha=${fecha}&estado=preparado`);
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
          mesa: item.mesa || "Sin mesa",
          cliente: item.cliente || "Cliente sin nombre",
          hora: new Date(item.tiempo_orden).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          productos: []
        };
      }
      
      // Si el item tiene productos, los añadimos
      if (item.productos) {
        // Solo incluimos productos ya preparados
        const productosPreparados = item.productos.filter(p => p.estado_cocina === "preparado");
        
        productosPreparados.forEach(prod => {
          historicoMap[item.orden_id].productos.push({
            producto_id: prod.producto_id,
            detalle_id: prod.detalle_id,
            nombre: prod.nombre,
            cantidad: prod.cantidad,
            notas: prod.notas,
            hora_preparacion: prod.tiempo_preparacion ? 
              new Date(prod.tiempo_preparacion).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              }) : 'N/A'
          });
        });
      }
    });
    
    // Convertimos el objeto a un array y ordenamos por hora (más reciente primero)
    return Object.values(historicoMap)
      .filter(orden => orden.productos.length > 0) // Solo órdenes con productos preparados
      .sort((a, b) => {
        const horaA = a.hora.split(':').map(Number);
        const horaB = b.hora.split(':').map(Number);
        
        // Comparar hora y luego minutos
        if (horaA[0] !== horaB[0]) return horaB[0] - horaA[0];
        return horaB[1] - horaA[1];
      });
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
                {pedido.cliente} - Mesa: {pedido.mesa}
              </p>
              
              <div className="space-y-2">
                {pedido.productos.map((producto) => (
                  <div
                    key={producto.detalle_id}
                    className="flex justify-between items-center bg-negro/30 p-3 rounded"
                  >
                    <div>
                      <p className="font-bold">
                        {producto.cantidad}x {producto.nombre}
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