import { useState, useEffect } from "react";

export default function DashboardGerente() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodo, setPeriodo] = useState("hoy"); // hoy, semana, mes

  useEffect(() => {
    cargarEstadisticas();
  }, [periodo]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`http://localhost:3000/reports/manager?periodo=${periodo}`);
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

  const periodoLabel = {
    "hoy": "Hoy",
    "semana": "Esta semana",
    "mes": "Este mes"
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
      {/* Selector de período */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setPeriodo("hoy")}
          className={`flex-1 py-2 px-4 rounded-full font-bold ${
            periodo === "hoy" ? "bg-amarillo text-negro" : "bg-vino text-white"
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => setPeriodo("semana")}
          className={`flex-1 py-2 px-4 rounded-full font-bold ${
            periodo === "semana" ? "bg-amarillo text-negro" : "bg-vino text-white"
          }`}
        >
          Semana
        </button>
        <button
          onClick={() => setPeriodo("mes")}
          className={`flex-1 py-2 px-4 rounded-full font-bold ${
            periodo === "mes" ? "bg-amarillo text-negro" : "bg-vino text-white"
          }`}
        >
          Mes
        </button>
      </div>

      <h2 className="text-xl text-amarillo font-bold">
        Estadísticas: {periodoLabel[periodo]}
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

      {/* Productos más vendidos */}
      <div className="bg-vino rounded-xl p-4">
        <h3 className="text-lg text-amarillo font-bold mb-4">Productos más vendidos</h3>
        
        <div className="space-y-2">
          {stats.productos_top.map((producto, index) => (
            <div key={index} className="flex justify-between items-center bg-negro/30 p-3 rounded">
              <div className="flex-1">
                <p className="font-bold">{producto.nombre}</p>
                <p className="text-sm text-gray-300">{producto.categoria}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{producto.cantidad} unid.</p>
                <p className="text-sm text-amarillo">{formatearDinero(producto.total)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rendimiento por mesero */}
      <div className="bg-vino rounded-xl p-4">
        <h3 className="text-lg text-amarillo font-bold mb-4">Rendimiento de meseros</h3>
        
        <div className="space-y-2">
          {stats.meseros.map((mesero, index) => (
            <div key={index} className="flex justify-between items-center bg-negro/30 p-3 rounded">
              <p className="font-bold">{mesero.nombre}</p>
              <div className="text-right">
                <p className="font-bold">{mesero.ordenes} órdenes</p>
                <p className="text-sm text-amarillo">{formatearDinero(mesero.ventas)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de acceso rápido */}
      <div className="flex flex-col gap-3 mt-6">
        <a 
          href="/reportes/gerente/ventas" 
          className="bg-amarillo text-negro text-center py-3 px-6 rounded-full font-bold"
        >
          Ver reporte detallado
        </a>
        <a 
          href="/reportes/gerente/empleados" 
          className="bg-vino text-white text-center py-3 px-6 rounded-full font-bold"
        >
          Gestionar empleados
        </a>
      </div>
    </div>
  );
} 