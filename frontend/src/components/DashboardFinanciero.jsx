import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";

export default function DashboardFinanciero() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodo, setPeriodo] = useState("mes"); // semana, mes, trimestre
  const [fechaInicio, setFechaInicio] = useState(obtenerPrimerDiaMes());
  const [fechaFin, setFechaFin] = useState(obtenerFechaActual());
  const [vistaPersonalizada, setVistaPersonalizada] = useState(false);

  function obtenerFechaActual() {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function obtenerPrimerDiaMes() {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  }

  // Función para cambiar el período
  const cambiarPeriodo = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    setVistaPersonalizada(false);
    
    const hoy = new Date();
    let inicio = new Date();
    
    switch(nuevoPeriodo) {
      case "semana":
        // Restar 7 días
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 7);
        break;
      case "mes":
        // Primer día del mes actual
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case "trimestre":
        // Restar 3 meses
        inicio = new Date(hoy);
        inicio.setMonth(hoy.getMonth() - 3);
        break;
    }
    
    const formatearFecha = (fecha) => {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setFechaInicio(formatearFecha(inicio));
    setFechaFin(formatearFecha(hoy));
  };

  useEffect(() => {
    cargarEstadisticas();
  }, [periodo, fechaInicio, fechaFin]);

  const cargarEstadisticas = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/reports/financiero?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar estadísticas");
      }
      
      setStats(data);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las estadísticas financieras. Intenta de nuevo.");
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

  const formatearFecha = (fechaStr) => {
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-gray-400">Cargando estadísticas financieras...</p>
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

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => cambiarPeriodo("semana")}
          className={`py-2 px-4 rounded-full text-sm font-bold ${
            periodo === "semana" && !vistaPersonalizada ? "bg-amarillo text-negro" : "bg-vino text-white"
          }`}
        >
          Última Semana
        </button>
        <button
          onClick={() => cambiarPeriodo("mes")}
          className={`py-2 px-4 rounded-full text-sm font-bold ${
            periodo === "mes" && !vistaPersonalizada ? "bg-amarillo text-negro" : "bg-vino text-white"
          }`}
        >
          Mes Actual
        </button>
        <button
          onClick={() => cambiarPeriodo("trimestre")}
          className={`py-2 px-4 rounded-full text-sm font-bold ${
            periodo === "trimestre" && !vistaPersonalizada ? "bg-amarillo text-negro" : "bg-vino text-white"
          }`}
        >
          Último Trimestre
        </button>
        <button
          onClick={() => setVistaPersonalizada(true)}
          className={`py-2 px-4 rounded-full text-sm font-bold ${
            vistaPersonalizada ? "bg-amarillo text-negro" : "bg-vino text-white"
          }`}
        >
          Personalizado
        </button>
      </div>

      {/* Selector de fechas personalizado */}
      {vistaPersonalizada && (
        <div className="bg-vino/70 p-4 rounded-xl flex flex-col gap-4 mb-6">
          <h3 className="text-amarillo font-bold">Seleccionar período</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Fecha inicio:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-negro text-white px-3 py-2 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-2">Fecha fin:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-negro text-white px-3 py-2 rounded"
              />
            </div>
          </div>
        </div>
      )}

      <h2 className="text-xl text-amarillo font-bold">
        Período: {formatearFecha(fechaInicio)} - {formatearFecha(fechaFin)}
      </h2>

      {!stats ? (
        <p>No hay datos disponibles para este período</p>
      ) : (
        <>
          {/* Resumen financiero */}
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-lg text-amarillo font-bold mb-4">Resumen Financiero</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-negro/30 p-3 rounded text-center">
                <p className="text-sm text-gray-300">Ventas Totales</p>
                <p className="text-xl font-bold">{formatearDinero(stats.ventas_totales)}</p>
              </div>
              
              <div className="bg-negro/30 p-3 rounded text-center">
                <p className="text-sm text-gray-300">Propinas</p>
                <p className="text-xl font-bold">{formatearDinero(stats.propinas_total)}</p>
              </div>
              
              <div className="bg-negro/30 p-3 rounded text-center">
                <p className="text-sm text-gray-300">Efectivo</p>
                <p className="text-xl font-bold">{formatearDinero(stats.pagos_efectivo)}</p>
              </div>
              
              <div className="bg-negro/30 p-3 rounded text-center">
                <p className="text-sm text-gray-300">Tarjeta</p>
                <p className="text-xl font-bold">{formatearDinero(stats.pagos_tarjeta)}</p>
              </div>
            </div>
            
            <div className="mt-4 bg-negro/30 p-3 rounded text-center">
              <p className="text-sm text-gray-300">Número de Transacciones</p>
              <p className="text-xl font-bold">{stats.total_transacciones}</p>
            </div>
          </div>

          {/* Ventas por categoría */}
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-lg text-amarillo font-bold mb-4">Ventas por Categoría</h3>
            
            <div className="space-y-2">
              {stats.ventas_categoria.map((categoria, index) => (
                <div key={index} className="flex justify-between items-center bg-negro/30 p-3 rounded">
                  <p className="font-bold">{categoria.nombre}</p>
                  <div className="text-right">
                    <p className="text-amarillo font-bold">{formatearDinero(categoria.total)}</p>
                    <p className="text-xs text-gray-300">{categoria.porcentaje}% del total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparativa con período anterior */}
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-lg text-amarillo font-bold mb-4">Comparativa</h3>
            
            <div className="space-y-4">
              <div className="bg-negro/30 p-3 rounded">
                <div className="flex justify-between items-center">
                  <p className="font-bold">Ventas vs período anterior</p>
                  <p className={`font-bold ${stats.comparativa.ventas_vs_anterior >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.comparativa.ventas_vs_anterior >= 0 ? '+' : ''}{stats.comparativa.ventas_vs_anterior}%
                  </p>
                </div>
              </div>
              
              <div className="bg-negro/30 p-3 rounded">
                <div className="flex justify-between items-center">
                  <p className="font-bold">Transacciones vs período anterior</p>
                  <p className={`font-bold ${stats.comparativa.transacciones_vs_anterior >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.comparativa.transacciones_vs_anterior >= 0 ? '+' : ''}{stats.comparativa.transacciones_vs_anterior}%
                  </p>
                </div>
              </div>
              
              <div className="bg-negro/30 p-3 rounded">
                <div className="flex justify-between items-center">
                  <p className="font-bold">Ticket promedio vs período anterior</p>
                  <p className={`font-bold ${stats.comparativa.ticket_vs_anterior >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.comparativa.ticket_vs_anterior >= 0 ? '+' : ''}{stats.comparativa.ticket_vs_anterior}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acceso rápido */}
          <div className="flex flex-col gap-3 mt-6">
            <a 
              href="/reportes/financiero/balance" 
              className="bg-amarillo text-negro text-center py-3 px-6 rounded-full font-bold"
            >
              Ver Balance Completo
            </a>
            <a 
              href="/reportes/financiero/ingresos" 
              className="bg-vino text-white text-center py-3 px-6 rounded-full font-bold"
            >
              Detalle de Ingresos
            </a>
          </div>
        </>
      )}
    </div>
  );
} 