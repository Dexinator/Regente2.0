import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";

// ========================================
// Componentes graficos inline
// ========================================

function BarChart({ data, valueKey, labelKey, height = 140, color = "#DC9D00" }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d[valueKey]));
  const gap = 2;
  const barW = Math.max(6, Math.floor(300 / data.length) - gap);
  const totalW = data.length * (barW + gap);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${totalW} ${height + 24}`}
        className="w-full min-w-[280px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {data.map((d, i) => {
          const h = maxVal > 0 ? (d[valueKey] / maxVal) * height : 0;
          const isHovered = hoveredIdx === i;
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={i * (barW + gap)}
                y={height - h}
                width={barW}
                height={Math.max(h, 1)}
                fill={isHovered ? "#f5c518" : color}
                rx="2"
                opacity={isHovered ? 1 : 0.85}
              />
              {isHovered && (
                <>
                  <rect
                    x={Math.max(0, Math.min(i * (barW + gap) - 30, totalW - 80))}
                    y={Math.max(0, height - h - 36)}
                    width="80"
                    height="32"
                    fill="#1a1a1a"
                    rx="4"
                    stroke="#DC9D00"
                    strokeWidth="1"
                  />
                  <text
                    x={Math.max(40, Math.min(i * (barW + gap) + barW / 2, totalW - 40))}
                    y={Math.max(12, height - h - 22)}
                    fill="#fff"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {d[labelKey]}
                  </text>
                  <text
                    x={Math.max(40, Math.min(i * (barW + gap) + barW / 2, totalW - 40))}
                    y={Math.max(24, height - h - 10)}
                    fill="#DC9D00"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ${formatCompact(d[valueKey])}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HBar({ value, max, label, sublabel, rightLabel, rightSub, rank, color = "bg-amarillo" }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="bg-negro/30 p-3 rounded">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {rank != null && (
            <span className="text-xs font-bold text-amarillo bg-amarillo/20 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
              {rank}
            </span>
          )}
          <div>
            <span className="font-bold text-sm">{label}</span>
            {sublabel && <span className="block text-xs text-gray-400">{sublabel}</span>}
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <span className="font-bold text-amarillo text-sm">{rightLabel}</span>
          {rightSub && <span className="block text-xs text-gray-400">{rightSub}</span>}
        </div>
      </div>
      <div className="w-full bg-negro/50 rounded-full h-2">
        <div
          className={`${color} rounded-full h-2 transition-all duration-500`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
    </div>
  );
}

function DonutChart({ segments, size = 120 }) {
  if (!segments || segments.length === 0) return null;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const gradientParts = segments.map((seg) => {
    const start = (cumulative / total) * 360;
    cumulative += seg.value;
    const end = (cumulative / total) * 360;
    return `${seg.color} ${start}deg ${end}deg`;
  });

  return (
    <div className="flex items-center gap-4">
      <div
        className="rounded-full shrink-0"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradientParts.join(", ")})`,
          mask: `radial-gradient(circle at center, transparent 40%, black 41%)`,
          WebkitMask: `radial-gradient(circle at center, transparent 40%, black 41%)`,
        }}
      />
      <div className="space-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-300">{seg.label}</span>
            <span className="font-bold">{total > 0 ? Math.round((seg.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, variant }) {
  const colorMap = {
    default: "bg-vino",
    green: "bg-green-800/80",
    blue: "bg-blue-800/80",
    red: "bg-red-900/80",
  };
  return (
    <div className={`${colorMap[variant] || colorMap.default} rounded-xl p-3 text-center`}>
      <h3 className="text-xs uppercase text-amarillo font-bold tracking-wide">{title}</h3>
      <p className="text-xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-300 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ========================================
// Helpers
// ========================================

function formatCompact(val) {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + "M";
  if (val >= 1000) return (val / 1000).toFixed(1) + "k";
  return val?.toFixed(0) || "0";
}

const formatearDinero = (valor) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(valor || 0);

const formatearFechaDisplay = (fechaStr) => {
  if (!fechaStr) return "-";
  const [year, month, day] = fechaStr.split("-");
  return `${day}/${month}`;
};

const formatearFechaCompleta = (fechaStr) => {
  if (!fechaStr) return "-";
  const [year, month, day] = fechaStr.split("-");
  return `${day}/${month}/${year}`;
};

// ========================================
// Componente principal
// ========================================

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
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
  }

  function obtenerPrimerDiaMes() {
    const h = new Date();
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-01`;
  }

  const cambiarPeriodo = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    setVistaPersonalizada(false);
    const hoy = new Date();
    let inicio = new Date();
    switch (nuevoPeriodo) {
      case "semana":
        inicio.setDate(hoy.getDate() - 7);
        break;
      case "mes":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case "trimestre":
        inicio.setMonth(hoy.getMonth() - 3);
        break;
    }
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setFechaInicio(fmt(inicio));
    setFechaFin(fmt(hoy));
  };

  useEffect(() => {
    cargarDatos();
  }, [seccionActiva, fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const params = `fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      let res, data;
      switch (seccionActiva) {
        case "dashboard":
          res = await fetch(`${API_URL}/reports/dashboard?${params}`);
          data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setDashboardData(data);
          break;
        case "empleados":
          res = await fetch(`${API_URL}/reports/empleados/desempeno?${params}`);
          data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setEmpleadosData(data);
          break;
        case "clientes":
          res = await fetch(`${API_URL}/reports/clientes/analisis?${params}&limite=10`);
          data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setClientesData(data);
          break;
        case "productos":
          res = await fetch(`${API_URL}/reports/productos/analisis?${params}&limite=10`);
          data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setProductosData(data);
          break;
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError(err.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // TAB: Dashboard
  // ========================================
  const renderDashboard = () => {
    if (!dashboardData) return null;
    const { periodo_actual: pa, comparativa: cmp, tendencia, metodos_pago, ventas_por_dia } = dashboardData;

    // Mejor y peor dia
    let mejorDia = null, peorDia = null;
    if (tendencia && tendencia.length > 1) {
      mejorDia = tendencia.reduce((a, b) => (b.ventas > a.ventas ? b : a), tendencia[0]);
      peorDia = tendencia.reduce((a, b) => (b.ventas < a.ventas ? b : a), tendencia[0]);
    }

    // Labels cortos para bar chart
    const trendLabels = tendencia?.map(t => ({
      ...t,
      label: formatearFechaDisplay(t.fecha?.split("T")[0]),
    })) || [];

    const cambioColor = (val) => (val >= 0 ? "text-green-400" : "text-red-400");
    const cambioFlecha = (val) => (val >= 0 ? "+" : "");

    return (
      <div className="space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-vino rounded-xl p-3 text-center">
            <h3 className="text-xs uppercase text-amarillo font-bold">Ventas Totales</h3>
            <p className="text-xl font-bold mt-1">{formatearDinero(pa.ventas_totales)}</p>
            <p className={`text-xs mt-0.5 ${cambioColor(cmp.ventas_vs_anterior)}`}>
              {cambioFlecha(cmp.ventas_vs_anterior)}{cmp.ventas_vs_anterior}%
            </p>
          </div>
          <div className="bg-vino rounded-xl p-3 text-center">
            <h3 className="text-xs uppercase text-amarillo font-bold">Ordenes</h3>
            <p className="text-xl font-bold mt-1">{pa.total_ordenes}</p>
            <p className={`text-xs mt-0.5 ${cambioColor(cmp.ordenes_vs_anterior)}`}>
              {cambioFlecha(cmp.ordenes_vs_anterior)}{cmp.ordenes_vs_anterior}%
            </p>
          </div>
          <div className="bg-vino rounded-xl p-3 text-center">
            <h3 className="text-xs uppercase text-amarillo font-bold">Ticket Promedio</h3>
            <p className="text-xl font-bold mt-1">{formatearDinero(pa.ticket_promedio)}</p>
            <p className={`text-xs mt-0.5 ${cambioColor(cmp.ticket_vs_anterior)}`}>
              {cambioFlecha(cmp.ticket_vs_anterior)}{cmp.ticket_vs_anterior}%
            </p>
          </div>
          <div className="bg-vino rounded-xl p-3 text-center">
            <h3 className="text-xs uppercase text-amarillo font-bold">Propinas</h3>
            <p className="text-xl font-bold mt-1">{formatearDinero(pa.propinas_totales)}</p>
            <p className="text-xs mt-0.5 text-gray-400">
              {pa.ventas_totales > 0 ? ((pa.propinas_totales / pa.ventas_totales) * 100).toFixed(1) : 0}% de ventas
            </p>
          </div>
        </div>

        {/* Tendencia de ventas - grafico */}
        {trendLabels.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm text-amarillo font-bold uppercase">Tendencia de Ventas</h3>
              <span className="text-xs text-gray-400">{trendLabels.length} dias</span>
            </div>
            <BarChart data={trendLabels} valueKey="ventas" labelKey="label" />
            {/* Mejor / Peor dia */}
            {mejorDia && peorDia && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-green-900/30 border border-green-700/40 rounded-lg p-2 text-center">
                  <span className="text-xs text-green-400 uppercase font-bold block">Mejor dia</span>
                  <span className="text-sm font-bold">{formatearDinero(mejorDia.ventas)}</span>
                  <span className="text-xs text-gray-400 block">{formatearFechaDisplay(mejorDia.fecha?.split("T")[0])}</span>
                </div>
                <div className="bg-red-900/30 border border-red-700/40 rounded-lg p-2 text-center">
                  <span className="text-xs text-red-400 uppercase font-bold block">Menor dia</span>
                  <span className="text-sm font-bold">{formatearDinero(peorDia.ventas)}</span>
                  <span className="text-xs text-gray-400 block">{formatearFechaDisplay(peorDia.fecha?.split("T")[0])}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metodos de pago */}
        {metodos_pago && metodos_pago.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Metodos de Pago</h3>
            <div className="flex gap-4 items-start">
              <DonutChart
                size={100}
                segments={metodos_pago.map((m) => ({
                  label: m.metodo.charAt(0).toUpperCase() + m.metodo.slice(1),
                  value: m.total_ventas,
                  color: m.metodo === "efectivo" ? "#22c55e" : m.metodo === "tarjeta" ? "#3b82f6" : "#a855f7",
                }))}
              />
            </div>
            <div className="space-y-2 mt-3">
              {metodos_pago.map((m, i) => (
                <div key={i} className="flex justify-between items-center bg-negro/30 p-2 rounded text-sm">
                  <span className="capitalize font-bold">{m.metodo}</span>
                  <div className="text-right">
                    <span className="font-bold">{formatearDinero(m.total_ventas)}</span>
                    <span className="text-xs text-gray-400 ml-2">({m.total_ordenes} ord.)</span>
                  </div>
                </div>
              ))}
              {/* Total propinas desglosado */}
              <div className="border-t border-gray-600 pt-2 mt-1">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Propinas por metodo</p>
                {metodos_pago.map((m, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-300">
                    <span className="capitalize">{m.metodo}</span>
                    <span>{formatearDinero(m.total_propinas)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ventas por dia de la semana */}
        {ventas_por_dia && ventas_por_dia.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Ventas por Dia de la Semana</h3>
            <div className="space-y-2">
              {(() => {
                const maxVenta = Math.max(...ventas_por_dia.map(d => d.promedio_ventas));
                return ventas_por_dia.map((d, i) => (
                  <div key={i} className="bg-negro/30 p-2 rounded">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm w-10">{d.dia_nombre}</span>
                      <span className="text-xs text-gray-400">{d.dias_operados} dias | {d.total_ordenes} ord.</span>
                      <span className="text-amarillo font-bold text-sm">{formatearDinero(d.promedio_ventas)}<span className="text-xs text-gray-400 font-normal">/dia</span></span>
                    </div>
                    <div className="w-full bg-negro/50 rounded-full h-2">
                      <div
                        className="bg-amarillo rounded-full h-2 transition-all duration-500"
                        style={{ width: `${maxVenta > 0 ? (d.promedio_ventas / maxVenta) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========================================
  // TAB: Empleados
  // ========================================
  const renderEmpleados = () => {
    if (!empleadosData) return null;
    const { meseros, cocineros } = empleadosData;
    const maxVentas = meseros.length > 0 ? Math.max(...meseros.map(m => m.total_ventas)) : 0;
    const maxPrep = cocineros.length > 0 ? Math.max(...cocineros.map(c => c.productos_preparados)) : 0;

    return (
      <div className="space-y-5">
        {/* Meseros */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Meseros</h3>
          {meseros.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin datos para este periodo</p>
          ) : (
            <div className="space-y-3">
              {meseros.map((m, idx) => (
                <HBar
                  key={idx}
                  value={m.total_ventas}
                  max={maxVentas}
                  rank={idx + 1}
                  label={m.nombre}
                  sublabel={`${m.ordenes_cobradas} cobradas | ${m.clientes_atendidos} clientes`}
                  rightLabel={formatearDinero(m.total_ventas)}
                  rightSub={`Propinas: ${formatearDinero(m.total_propinas)} (${m.propina_promedio_pct?.toFixed(1) || 0}%)`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Cocineros */}
        {cocineros.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Cocineros</h3>
            <div className="space-y-3">
              {cocineros.map((c, idx) => (
                <HBar
                  key={idx}
                  value={c.productos_preparados}
                  max={maxPrep}
                  rank={idx + 1}
                  label={c.nombre}
                  sublabel={`${c.tiempo_promedio_minutos} min promedio`}
                  rightLabel={`${c.productos_preparados} productos`}
                  color="bg-orange-500"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========================================
  // TAB: Clientes
  // ========================================
  const renderClientes = () => {
    if (!clientesData) return null;
    const { segmentacion: seg, top_clientes, frecuencia_visitas, distribucion_grados } = clientesData;
    const maxGasto = top_clientes.length > 0 ? Math.max(...top_clientes.map(c => c.total_gastado)) : 0;
    const maxFreq = frecuencia_visitas.length > 0 ? Math.max(...frecuencia_visitas.map(f => f.num_clientes)) : 0;

    return (
      <div className="space-y-5">
        {/* Segmentacion */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Segmentacion de Clientes</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <DonutChart
              size={110}
              segments={[
                { label: "Nuevos", value: seg.clientes_nuevos, color: "#22c55e" },
                { label: "Recurrentes", value: seg.clientes_recurrentes, color: "#3b82f6" },
              ]}
            />
            <div className="grid grid-cols-3 gap-2 flex-1 w-full">
              <StatCard title="Total" value={seg.clientes_totales} />
              <StatCard title="Nuevos" value={seg.clientes_nuevos} variant="green" />
              <StatCard title="Recurrentes" value={seg.clientes_recurrentes} variant="blue" />
            </div>
          </div>
        </div>

        {/* Top clientes */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Top Clientes por Gasto</h3>
          {top_clientes.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin datos para este periodo</p>
          ) : (
            <div className="space-y-2">
              {top_clientes.map((c, idx) => (
                <HBar
                  key={idx}
                  value={c.total_gastado}
                  max={maxGasto}
                  rank={idx + 1}
                  label={c.nombre}
                  sublabel={`${c.total_visitas} visitas | Ticket: ${formatearDinero(c.ticket_promedio)}`}
                  rightLabel={formatearDinero(c.total_gastado)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Frecuencia de visitas */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Frecuencia de Visitas</h3>
          <div className="space-y-2">
            {frecuencia_visitas.map((f, idx) => (
              <HBar
                key={idx}
                value={f.num_clientes}
                max={maxFreq}
                label={f.frecuencia}
                rightLabel={`${f.num_clientes} clientes`}
                color="bg-blue-500"
              />
            ))}
          </div>
        </div>

        {/* Grados de lealtad */}
        {distribucion_grados.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Niveles de Lealtad</h3>
            <div className="space-y-2">
              {distribucion_grados.map((g, idx) => (
                <div key={idx} className="flex justify-between items-center bg-negro/30 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{g.grado}</span>
                    <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">{g.descuento}% desc.</span>
                  </div>
                  <span className="font-bold text-sm">{g.num_clientes} clientes</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========================================
  // TAB: Productos
  // ========================================
  const renderProductos = () => {
    if (!productosData) return null;
    const { top_productos, por_categoria, bajo_desempeno, sentencias } = productosData;
    const maxIngreso = top_productos.length > 0 ? Math.max(...top_productos.map(p => p.ingresos_totales)) : 0;
    const maxCatIngreso = por_categoria.length > 0 ? Math.max(...por_categoria.map(c => c.ingresos_totales)) : 0;

    return (
      <div className="space-y-5">
        {/* Top productos */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Top Productos por Ingresos</h3>
          {top_productos.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin datos para este periodo</p>
          ) : (
            <div className="space-y-2">
              {top_productos.map((p, idx) => (
                <HBar
                  key={idx}
                  value={p.ingresos_totales}
                  max={maxIngreso}
                  rank={idx + 1}
                  label={p.nombre}
                  sublabel={p.categoria}
                  rightLabel={formatearDinero(p.ingresos_totales)}
                  rightSub={`${p.unidades_vendidas} uds.`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Por categoria */}
        <div className="bg-vino rounded-xl p-4">
          <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Ventas por Categoria</h3>
          <div className="space-y-2">
            {por_categoria.map((cat, idx) => (
              <div key={idx} className="bg-negro/30 p-3 rounded">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm">{cat.categoria}</span>
                  <div className="text-right">
                    <span className="font-bold text-amarillo text-sm">{formatearDinero(cat.ingresos_totales)}</span>
                    <span className="text-xs text-gray-400 ml-1">({cat.porcentaje_total}%)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-negro/50 rounded-full h-3">
                    <div
                      className="bg-amarillo rounded-full h-3 transition-all duration-500 flex items-center justify-end pr-1"
                      style={{ width: `${Math.max(cat.porcentaje_total, 2)}%` }}
                    >
                      {cat.porcentaje_total >= 15 && (
                        <span className="text-[9px] font-bold text-negro">{cat.porcentaje_total}%</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 w-14 text-right">{cat.unidades_vendidas} uds.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bajo desempeno */}
        {bajo_desempeno.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Productos con Bajo Desempeno</h3>
            <div className="space-y-2">
              {bajo_desempeno.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center bg-negro/30 p-3 rounded border-l-3 border-red-500">
                  <div>
                    <span className="font-bold text-sm">{p.nombre}</span>
                    <span className="text-xs text-gray-400 block">{p.categoria} | Precio: {formatearDinero(p.precio)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-red-400 font-bold text-sm">{p.unidades_vendidas} uds.</span>
                    <span className="text-xs text-gray-400 block">{formatearDinero(p.ingresos_totales)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Combos */}
        {sentencias.length > 0 && (
          <div className="bg-vino rounded-xl p-4">
            <h3 className="text-sm text-amarillo font-bold uppercase mb-3">Combos (Sentencias)</h3>
            <div className="space-y-2">
              {sentencias.map((s, idx) => {
                const maxSent = Math.max(...sentencias.map(x => x.veces_vendida));
                return (
                  <HBar
                    key={idx}
                    value={s.veces_vendida}
                    max={maxSent}
                    label={s.nombre}
                    sublabel={`Precio: ${formatearDinero(s.precio)}`}
                    rightLabel={`${s.veces_vendida} vendidas`}
                    rightSub={formatearDinero(s.ingresos_totales)}
                    color="bg-purple-500"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ========================================
  // Layout principal
  // ========================================
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Selector de periodo */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {[
          { key: "semana", label: "Semana" },
          { key: "mes", label: "Mes" },
          { key: "trimestre", label: "Trimestre" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => cambiarPeriodo(key)}
            className={`py-2 px-4 rounded-full text-sm font-bold transition-colors ${
              periodo === key && !vistaPersonalizada ? "bg-amarillo text-negro" : "bg-vino text-white hover:bg-vino/80"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setVistaPersonalizada(true)}
          className={`py-2 px-4 rounded-full text-sm font-bold transition-colors ${
            vistaPersonalizada ? "bg-amarillo text-negro" : "bg-vino text-white hover:bg-vino/80"
          }`}
        >
          Personalizado
        </button>
      </div>

      {/* Fechas personalizadas */}
      {vistaPersonalizada && (
        <div className="bg-vino/70 p-4 rounded-xl flex flex-col gap-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1 text-gray-300">Desde:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full bg-negro text-white px-3 py-2 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs mb-1 text-gray-300">Hasta:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full bg-negro text-white px-3 py-2 rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Indicador de periodo */}
      <p className="text-center text-gray-400 text-xs mb-4">
        {formatearFechaCompleta(fechaInicio)} - {formatearFechaCompleta(fechaFin)}
      </p>

      {/* Tabs de seccion */}
      <div className="flex justify-center gap-1 mb-5 overflow-x-auto">
        {secciones.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeccionActiva(s.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${
              seccionActiva === s.id ? "bg-amarillo text-negro" : "bg-vino/60 text-white hover:bg-vino"
            }`}
          >
            {s.nombre}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="min-h-96">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-amarillo border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Cargando datos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8">
            <p>{error}</p>
            <button onClick={cargarDatos} className="mt-4 bg-vino px-4 py-2 rounded text-white text-sm">
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
