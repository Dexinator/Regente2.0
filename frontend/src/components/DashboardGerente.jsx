import { useState, useEffect } from "react";

export default function DashboardGerente() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`http://localhost:3000/reports/gerente`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar estadísticas");
      }
      
      setStats(data);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las estadísticas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const formatearDinero = (valor) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-gray-400">Cargando estadísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        <p>{error}</p>
        <button
          onClick={cargarEstadisticas}
          className="mt-4 bg-vino px-4 py-2 rounded"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!stats) {
    return <p>No hay datos disponibles</p>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl text-amarillo font-bold">
        Estadísticas del día
      </h2>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-vino rounded-xl p-4 text-center">
          <h3 className="text-sm uppercase text-amarillo font-bold">Ventas</h3>
          <p className="text-2xl font-bold mt-2">{formatearDinero(stats.ventas_totales)}</p>
        </div>
        
        <div className="bg-vino rounded-xl p-4 text-center">
          <h3 className="text-sm uppercase text-amarillo font-bold">Órdenes</h3>
          <p className="text-2xl font-bold mt-2">{stats.total_ordenes}</p>
        </div>
        
        <div className="bg-vino rounded-xl p-4 text-center">
          <h3 className="text-sm uppercase text-amarillo font-bold">Ticket Prom.</h3>
          <p className="text-2xl font-bold mt-2">{formatearDinero(stats.ticket_promedio)}</p>
        </div>
        
        <div className="bg-vino rounded-xl p-4 text-center">
          <h3 className="text-sm uppercase text-amarillo font-bold">Propinas</h3>
          <p className="text-2xl font-bold mt-2">{formatearDinero(stats.propinas_total)}</p>
        </div>
      </div>

      {/* Ventas por método de pago */}
      <div className="bg-vino rounded-xl p-4">
        <h3 className="text-lg text-amarillo font-bold mb-4">Ventas por método de pago</h3>
        
        <div className="space-y-2">
          {stats.ventas_por_metodo.map((metodo, index) => (
            <div key={index} className="flex justify-between items-center bg-negro/30 p-3 rounded">
              <div className="flex-1">
                <p className="font-bold capitalize">{metodo.metodo}</p>
                <p className="text-sm text-gray-300">{metodo.total_ordenes} órdenes</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatearDinero(metodo.total_ventas)}</p>
                <p className="text-sm text-amarillo">Propinas: {formatearDinero(metodo.total_propinas)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ventas por categoría */}
      <div className="bg-vino rounded-xl p-4">
        <h3 className="text-lg text-amarillo font-bold mb-4">Ventas por categoría</h3>
        
        <div className="space-y-2">
          {stats.ventas_por_categoria.map((categoria, index) => (
            <div key={index} className="flex justify-between items-center bg-negro/30 p-3 rounded">
              <div className="flex-1">
                <p className="font-bold">{categoria.categoria}</p>
                <p className="text-sm text-gray-300">{categoria.cantidad} unidades</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatearDinero(categoria.total_ventas)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 