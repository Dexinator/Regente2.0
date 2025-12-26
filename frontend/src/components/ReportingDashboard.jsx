import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";

export default function ReportingDashboard() {
  const [seccionActiva, setSeccionActiva] = useState("dashboard");
  const [periodo, setPeriodo] = useState("mes");
  const [fechaInicio, setFechaInicio] = useState(obtenerPrimerDiaMes());
  const [fechaFin, setFechaFin] = useState(obtenerFechaActual());
  const [vistaPersonalizada, setVistaPersonalizada] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dashboardData, setDashboardData] = useState(null);
  const [empleadosData, setEmpleadosData] = useState(null);
  const [clientesData, setClientesData] = useState(null);
  const [productosData, setProductosData] = useState(null);

  const secciones = [
    { id: "dashboard", nombre: "Dashboard" },
    { id: "empleados", nombre: "Empleados" },
    { id: "clientes", nombre: "Clientes" },
    { id: "productos", nombre: "Productos" },
  ];

  function obtenerFechaActual() {
    const hoy = new Date();
    return formatearFechaISO(hoy);
  }

  function obtenerPrimerDiaMes() {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
  }

  function formatearFechaISO(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const cambiarPeriodo = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    setVistaPersonalizada(false);

    const hoy = new Date();
    let inicio = new Date();

    switch(nuevoPeriodo) {
      case "semana":
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 7);
        break;
      case "mes":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case "trimestre":
        inicio = new Date(hoy);
        inicio.setMonth(hoy.getMonth() - 3);
        break;
    }

    setFechaInicio(formatearFechaISO(inicio));
    setFechaFin(formatearFechaISO(hoy));
  };

  const formatearDinero = (valor) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  const formatearFechaDisplay = (fechaStr) => {
    if (!fechaStr) return '-';
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Cargar datos según la sección activa
  useEffect(() => {
    cargarDatos();
  }, [seccionActiva, fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      const params = `fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;

      switch(seccionActiva) {
        case "dashboard":
          const resDash = await fetch(`${API_URL}/reports/dashboard?${params}`);
          const dataDash = await resDash.json();
          if (!resDash.ok) throw new Error(dataDash.error);
          setDashboardData(dataDash);
          break;

        case "empleados":
          const resEmp = await fetch(`${API_URL}/reports/empleados/desempeno?${params}`);
          const dataEmp = await resEmp.json();
          if (!resEmp.ok) throw new Error(dataEmp.error);
          setEmpleadosData(dataEmp);
          break;

        case "clientes":
          const resCli = await fetch(`${API_URL}/reports/clientes/analisis?${params}&limite=10`);
          const dataCli = await resCli.json();
          if (!resCli.ok) throw new Error(dataCli.error);
          setClientesData(dataCli);
          break;

        case "productos":
          const resProd = await fetch(`${API_URL}/reports/productos/analisis?${params}&limite=10`);
          const dataProd = await resProd.json();
          if (!resProd.ok) throw new Error(dataProd.error);
          setProductosData(dataProd);
          break;
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError(err.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Componentes de contenido para cada sección
  const renderDashboard = () => {
    if (!dashboardData) return null;
    const { periodo_actual, comparativa } = dashboardData;

    return (
      <div className="space-y-6">
        {/* KPIs principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-vino rounded-xl p-4 text-center">
            <h3 className="text-sm uppercase text-amarillo font-bold">Ventas Totales</h3>
            <p className="text-2xl font-bold mt-2">{formatearDinero(periodo_actual.ventas_totales)}</p>
            <p className={`text-sm mt-1 ${comparativa.ventas_vs_anterior >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {comparativa.ventas_vs_anterior >= 0 ? '+' : ''}{comparativa.ventas_vs_anterior}% vs anterior
            </p>
          </div>

          <div className="bg-vino rounded-xl p-4 text-center">
            <h3 className="text-sm uppercase text-amarillo font-bold">Ordenes</h3>
            <p className="text-2xl font-bold mt-2">{periodo_actual.total_ordenes}</p>
            <p className={`text-sm mt-1 ${comparativa.ordenes_vs_anterior >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {comparativa.ordenes_vs_anterior >= 0 ? '+' : ''}{comparativa.ordenes_vs_anterior}% vs anterior
            </p>
          </div>

          <div className="bg-vino rounded-xl p-4 text-center">
            <h3 className="text-sm uppercase text-amarillo font-bold">Ticket Promedio</h3>
            <p className="text-2xl font-bold mt-2">{formatearDinero(periodo_actual.ticket_promedio)}</p>
            <p className={`text-sm mt-1 ${comparativa.ticket_vs_anterior >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {comparativa.ticket_vs_anterior >= 0 ? '+' : ''}{comparativa.ticket_vs_anterior}% vs anterior
            </p>
          </div>

          <div className="bg-vino rounded-xl p-4 text-center">
            <h3 className="text-sm uppercase text-amarillo font-bold">Clientes</h3>
            <p className="text-2xl font-bold mt-2">{periodo_actual.clientes_unicos}</p>
            <p className={`text-sm mt-1 ${comparativa.clientes_vs_anterior >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {comparativa.clientes_vs_anterior >= 0 ? '+' : ''}{comparativa.clientes_vs_anterior}% vs anterior
            </p>
          </div>
        </div>

        {/* Propinas */}
        <div className="bg-vino rounded-xl p-4 text-center">
          <h3 className="text-sm uppercase text-amarillo font-bold">Propinas Totales</h3>
          <p className="text-2xl font-bold mt-2">{formatearDinero(periodo_actual.propinas_totales)}</p>
        </div>

        {/* Tendencia */}
        {dashboardData.tendencia && dashboardData.tendencia.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-lg text-amarillo font-bold mb-4">Tendencia de Ventas</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dashboardData.tendencia.map((dia, idx) => (
                <div key={idx} className="flex justify-between items-center bg-negro/30 p-2 rounded">
                  <span>{formatearFechaDisplay(dia.fecha?.split('T')[0])}</span>
                  <span className="font-bold">{formatearDinero(dia.ventas)}</span>
                  <span className="text-gray-300 text-sm">{dia.ordenes} ordenes</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEmpleados = () => {
    if (!empleadosData) return null;

    return (
      <div className="space-y-6">
        {/* Meseros */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-lg text-amarillo font-bold mb-4">Desempeno de Meseros</h3>
          {empleadosData.meseros.length === 0 ? (
            <p className="text-gray-300">No hay datos de meseros para este periodo</p>
          ) : (
            <div className="space-y-3">
              {empleadosData.meseros.map((mesero, idx) => (
                <div key={idx} className="bg-negro/30 p-3 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg">{mesero.nombre}</span>
                    <span className="text-amarillo font-bold">{formatearDinero(mesero.total_ventas)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-gray-300">
                    <div>
                      <span className="block text-xs text-gray-400">Ordenes</span>
                      {mesero.ordenes_cobradas}
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400">Propinas</span>
                      {formatearDinero(mesero.total_propinas)}
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400">Clientes</span>
                      {mesero.clientes_atendidos}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cocineros */}
        {empleadosData.cocineros.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-lg text-amarillo font-bold mb-4">Desempeno de Cocineros</h3>
            <div className="space-y-3">
              {empleadosData.cocineros.map((cocinero, idx) => (
                <div key={idx} className="flex justify-between items-center bg-negro/30 p-3 rounded">
                  <span className="font-bold">{cocinero.nombre}</span>
                  <div className="text-right">
                    <span className="block text-amarillo font-bold">{cocinero.productos_preparados} productos</span>
                    <span className="text-sm text-gray-300">{cocinero.tiempo_promedio_minutos} min promedio</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClientes = () => {
    if (!clientesData) return null;

    return (
      <div className="space-y-6">
        {/* Segmentacion */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-vino rounded-xl p-4 text-center">
            <h3 className="text-xs uppercase text-amarillo font-bold">Totales</h3>
            <p className="text-2xl font-bold mt-2">{clientesData.segmentacion.clientes_totales}</p>
          </div>
          <div className="bg-green-800 rounded-xl p-4 text-center">
            <h3 className="text-xs uppercase text-green-300 font-bold">Nuevos</h3>
            <p className="text-2xl font-bold mt-2">{clientesData.segmentacion.clientes_nuevos}</p>
          </div>
          <div className="bg-blue-800 rounded-xl p-4 text-center">
            <h3 className="text-xs uppercase text-blue-300 font-bold">Recurrentes</h3>
            <p className="text-2xl font-bold mt-2">{clientesData.segmentacion.clientes_recurrentes}</p>
          </div>
        </div>

        {/* Top Clientes */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-lg text-amarillo font-bold mb-4">Top Clientes por Gasto</h3>
          {clientesData.top_clientes.length === 0 ? (
            <p className="text-gray-300">No hay datos de clientes para este periodo</p>
          ) : (
            <div className="space-y-2">
              {clientesData.top_clientes.map((cliente, idx) => (
                <div key={idx} className="flex justify-between items-center bg-negro/30 p-3 rounded">
                  <div>
                    <span className="font-bold">{cliente.nombre}</span>
                    <span className="text-sm text-gray-300 ml-2">({cliente.total_visitas} visitas)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amarillo font-bold">{formatearDinero(cliente.total_gastado)}</span>
                    <span className="block text-xs text-gray-300">Ticket: {formatearDinero(cliente.ticket_promedio)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Frecuencia de visitas */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-lg text-amarillo font-bold mb-4">Frecuencia de Visitas</h3>
          <div className="space-y-2">
            {clientesData.frecuencia_visitas.map((freq, idx) => (
              <div key={idx} className="flex justify-between items-center bg-negro/30 p-3 rounded">
                <span>{freq.frecuencia}</span>
                <span className="font-bold">{freq.num_clientes} clientes</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grados de lealtad */}
        {clientesData.distribucion_grados.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-lg text-amarillo font-bold mb-4">Niveles de Lealtad</h3>
            <div className="space-y-2">
              {clientesData.distribucion_grados.map((grado, idx) => (
                <div key={idx} className="flex justify-between items-center bg-negro/30 p-3 rounded">
                  <div>
                    <span className="font-bold">{grado.grado}</span>
                    <span className="text-sm text-green-400 ml-2">({grado.descuento}% descuento)</span>
                  </div>
                  <span className="font-bold">{grado.num_clientes} clientes</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProductos = () => {
    if (!productosData) return null;

    return (
      <div className="space-y-6">
        {/* Top Productos */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-lg text-amarillo font-bold mb-4">Top Productos por Ingresos</h3>
          {productosData.top_productos.length === 0 ? (
            <p className="text-gray-300">No hay datos de productos para este periodo</p>
          ) : (
            <div className="space-y-2">
              {productosData.top_productos.map((prod, idx) => (
                <div key={idx} className="bg-negro/30 p-3 rounded">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{prod.nombre}</span>
                    <span className="text-amarillo font-bold">{formatearDinero(prod.ingresos_totales)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>{prod.categoria}</span>
                    <span>{prod.unidades_vendidas} unidades</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por Categoria */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-lg text-amarillo font-bold mb-4">Ventas por Categoria</h3>
          <div className="space-y-2">
            {productosData.por_categoria.map((cat, idx) => (
              <div key={idx} className="bg-negro/30 p-3 rounded">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{cat.categoria}</span>
                  <span className="text-amarillo font-bold">{formatearDinero(cat.ingresos_totales)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{cat.unidades_vendidas} unidades</span>
                  <span>{cat.porcentaje_total}% del total</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bajo Desempeno */}
        {productosData.bajo_desempeno.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-lg text-amarillo font-bold mb-4">Productos con Bajo Desempeno</h3>
            <div className="space-y-2">
              {productosData.bajo_desempeno.map((prod, idx) => (
                <div key={idx} className="flex justify-between items-center bg-negro/30 p-3 rounded">
                  <div>
                    <span className="font-bold">{prod.nombre}</span>
                    <span className="text-sm text-gray-300 ml-2">({prod.categoria})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-red-400 font-bold">{prod.unidades_vendidas} vendidas</span>
                    <span className="block text-xs text-gray-300">Precio: {formatearDinero(prod.precio)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sentencias/Combos */}
        {productosData.sentencias.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-lg text-amarillo font-bold mb-4">Desempeno de Combos</h3>
            <div className="space-y-2">
              {productosData.sentencias.map((sent, idx) => (
                <div key={idx} className="flex justify-between items-center bg-negro/30 p-3 rounded">
                  <div>
                    <span className="font-bold">{sent.nombre}</span>
                    <span className="text-sm text-gray-300 ml-2">({formatearDinero(sent.precio)})</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amarillo font-bold">{sent.veces_vendida} vendidas</span>
                    <span className="block text-xs text-gray-300">{formatearDinero(sent.ingresos_totales)} total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Selector de periodo */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <button
          onClick={() => cambiarPeriodo("semana")}
          className={`py-2 px-4 rounded-full text-sm font-bold ${
            periodo === "semana" && !vistaPersonalizada ? "bg-amarillo text-negro" : "bg-vino text-white"
          }`}
        >
          Ultima Semana
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
          Ultimo Trimestre
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
          <h3 className="text-amarillo font-bold">Seleccionar periodo</h3>
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

      {/* Indicador de periodo */}
      <p className="text-center text-gray-300 mb-4">
        Periodo: {formatearFechaDisplay(fechaInicio)} - {formatearFechaDisplay(fechaFin)}
      </p>

      {/* Navegacion de secciones */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {secciones.map((seccion) => (
          <button
            key={seccion.id}
            onClick={() => setSeccionActiva(seccion.id)}
            className={`px-4 py-2 rounded-full text-lg font-bold ${
              seccionActiva === seccion.id
                ? "bg-amarillo text-negro"
                : "bg-vino text-white"
            }`}
          >
            {seccion.nombre}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="bg-negro/30 p-4 rounded-lg min-h-96">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-400">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8">
            <p>{error}</p>
            <button
              onClick={cargarDatos}
              className="mt-4 bg-vino px-4 py-2 rounded"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <>
            {seccionActiva === "dashboard" && renderDashboard()}
            {seccionActiva === "empleados" && renderEmpleados()}
            {seccionActiva === "clientes" && renderClientes()}
            {seccionActiva === "productos" && renderProductos()}
          </>
        )}
      </div>
    </div>
  );
}
