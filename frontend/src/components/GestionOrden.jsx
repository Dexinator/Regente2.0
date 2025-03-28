import { useEffect, useState } from "react";

export default function GestionOrden({ id }) {
  const [orden, setOrden] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [nuevoPago, setNuevoPago] = useState("");
  const [nuevaPropina, setNuevaPropina] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [tipoPropina, setTipoPropina] = useState("fija"); // "fija" o "porcentaje"
  const [porcentajePropina, setPorcentajePropina] = useState(null);
  
  const cargarDatos = async () => {
    try {
      const resOrden = await fetch(`http://localhost:3000/orders/${id}/resumen`);
      const resPagos = await fetch(`http://localhost:3000/pagos/orden/${id}`);
      const datosOrden = await resOrden.json();
      console.log("ORDEN:", datosOrden); 
      const datosPagos = await resPagos.json();
      console.log("PAGOS:", datosPagos);
      // Asegurarse que datosPagos sea un array
      const pagosList = Array.isArray(datosPagos) ? datosPagos : 
                        (datosPagos.pagos && Array.isArray(datosPagos.pagos)) ? datosPagos.pagos : [];
      console.log("PAGOS PROCESADOS:", pagosList);
      setOrden(datosOrden);
      setPagos(pagosList);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      alert("Error cargando la orden");
    }
  };
  
  useEffect(() => {
    cargarDatos();
  }, [id]);
  
  const registrarPago = async () => {
    if (!nuevoPago || isNaN(nuevoPago)) {
      alert("Ingresa un monto válido");
      return;
    }
    
    // Obtener el ID del empleado desde el token JWT
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sesión no válida. Por favor, inicia sesión nuevamente.");
      window.location.href = "/login";
      return;
    }
    
    try {
      // Decodificar el token para obtener el ID del empleado
      const payload = JSON.parse(atob(token.split(".")[1]));
      const empleadoId = payload.id;
      
      // Calcular valores finales
      const montoFinal = parseFloat(nuevoPago);
      const propinaFinal = parseFloat(nuevaPropina || 0);
      
      const body = {
        orden_id: parseInt(id),
        monto: montoFinal,
        propina: propinaFinal,
        porcentaje_propina: tipoPropina === "porcentaje" ? porcentajePropina : null,
        empleado_id: empleadoId,
        metodo: metodoPago
      };
      
      const res = await fetch("http://localhost:3000/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (res.ok) {
        setNuevoPago("");
        setNuevaPropina("");
        setPorcentajePropina(null);
        await cargarDatos();
      } else {
        const data = await res.json();
        alert(data.error || "No se pudo registrar el pago");
      }
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      alert("Error al procesar el pago. Inicia sesión nuevamente.");
    }
  };
  
  const cerrarOrden = async () => {
    const confirmar = confirm("¿Deseas cerrar esta orden?");
    if (!confirmar) return;
    
    const res = await fetch(`http://localhost:3000/orders/${id}/close`, {
      method: "PUT",
    });
    
    if (res.ok) {
      alert("Orden cerrada");
      window.location.href = "/ordenes";
    } else {
      const data = await res.json();
      alert(data.error || "No se pudo cerrar la orden");
    }
  };
  
  const calcularPropinaPorcentaje = (porcentaje) => {
    if (!nuevoPago || isNaN(nuevoPago) || parseFloat(nuevoPago) <= 0) {
      alert("Primero ingresa un monto de pago válido");
      return;
    }
    
    const montoPago = parseFloat(nuevoPago);
    const propina = (montoPago * porcentaje / 100).toFixed(2);
    setNuevaPropina(propina);
    setPorcentajePropina(porcentaje);
    setTipoPropina("porcentaje");
  };
  
  const establecerPropinaFija = (monto) => {
    setNuevaPropina(monto.toString());
    setPorcentajePropina(null);
    setTipoPropina("fija");
  };
  
  if (!orden) return <p className="text-center">Cargando orden...</p>;
  
  return (
    <section className="space-y-6">
    <div className="bg-vino p-4 rounded shadow">
    <h2 className="font-subtitulo text-xl mb-2">{orden.cliente}</h2>
    <p>Total: ${orden.total.toFixed(2)}</p>
    <p>Pagado: ${orden.total_pagado.toFixed(2)}</p>
    {orden.total_propina > 0 && (
      <p className="text-green-400">Propina: ${orden.total_propina.toFixed(2)}</p>
    )}
    {orden.diferencia < 0 && (
      <p className="text-red-400">Faltan: ${Math.abs(orden.diferencia).toFixed(2)}</p>
    )}
    <p className="text-sm mt-2">Estado de pago: <strong>{orden.estado_pago}</strong></p>
    </div>
    
    <div>
    <h3 className="text-amarillo font-bold mb-2">Productos</h3>
    <ul className="space-y-1 text-sm">
    {Array.isArray(orden.productos) ? (
      <ul className="space-y-1 text-sm">
      {orden.productos.map((p, i) => (
        <li key={i}>
        {p.nombre} x{p.cantidad} — ${p.precio_unitario}
        </li>
      ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-400">No hay productos registrados.</p>
    )}
    
    </ul>
    </div>
    
    <div>
    <h3 className="text-amarillo font-bold mb-2">Pagos</h3>
    {console.log("Renderizando pagos:", pagos)}
    <p className="text-xs text-gray-400 mb-2">
      Estado: {Array.isArray(pagos) ? `Array con ${pagos.length} items` : typeof pagos}
    </p>
    <ul className="space-y-1 text-sm">
    {Array.isArray(pagos) && pagos.length > 0 ? (
      pagos.map((pago, index) => (
        <li key={pago.id || index} className="p-2 border-b border-gray-700">
          <div className="flex justify-between">
            <div>
              <span className="mr-1">
                {pago.metodo === 'efectivo' ? '💵' : pago.metodo === 'tarjeta' ? '💳' : '📲'}
              </span>
              <span className="font-bold">${pago.monto ? Number(pago.monto).toFixed(2) : 'N/A'}</span>
              {pago.propina > 0 && (
                <span className="text-green-400 ml-1">
                  + ${Number(pago.propina).toFixed(2)} propina
                  {pago.porcentaje_propina && ` (${pago.porcentaje_propina}%)`}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {pago.fecha ? new Date(pago.fecha).toLocaleTimeString() : 'Sin fecha'}
            </div>
          </div>
        </li>
      ))
    ) : (
      <li>No hay pagos registrados.</li>
    )}
    </ul>
    </div>
    
    <div className="space-y-2">
    <div className="grid grid-cols-2 gap-2">
      <input
        type="number"
        value={nuevoPago}
        onChange={(e) => setNuevoPago(e.target.value)}
        placeholder="Monto para la cuenta"
        className="p-2 rounded bg-negro text-white border border-amarillo placeholder:text-white/60"
      />
      <input
        type="number"
        value={nuevaPropina}
        onChange={(e) => {
          setNuevaPropina(e.target.value);
          setPorcentajePropina(null);
          setTipoPropina("fija");
        }}
        placeholder="Propina (cualquier monto)"
        className="p-2 rounded bg-negro text-white border border-amarillo placeholder:text-white/60"
      />
    </div>
    
    {/* Opciones de propina */}
    <div className="mb-4">
      <h4 className="text-amarillo font-bold mb-2 text-sm">Propina rápida por porcentaje:</h4>
      
      <div className="flex mb-2">
        <div className="flex gap-1 flex-1">
          {[5, 10, 15, 20].map(porcentaje => (
            <button
              key={porcentaje}
              onClick={() => calcularPropinaPorcentaje(porcentaje)}
              className="flex-1 bg-negro text-white border border-amarillo rounded-md py-2 text-sm hover:bg-amarillo hover:text-negro transition-colors"
            >
              {porcentaje}%
            </button>
          ))}
        </div>
      </div>
    </div>
    
    <div className="flex gap-2 mb-2">
      <button
        type="button"
        onClick={() => setMetodoPago("efectivo")}
        className={`flex-1 py-3 rounded-md flex flex-col items-center justify-center transition-colors ${
          metodoPago === "efectivo" 
            ? "bg-amarillo text-negro" 
            : "bg-negro text-white border border-amarillo"
        }`}
      >
        <span className="text-xl mb-1">💵</span>
        <span className="text-sm">Efectivo</span>
      </button>
      
      <button
        type="button"
        onClick={() => setMetodoPago("tarjeta")}
        className={`flex-1 py-3 rounded-md flex flex-col items-center justify-center transition-colors ${
          metodoPago === "tarjeta" 
            ? "bg-amarillo text-negro" 
            : "bg-negro text-white border border-amarillo"
        }`}
      >
        <span className="text-xl mb-1">💳</span>
        <span className="text-sm">Tarjeta</span>
      </button>
      
      <button
        type="button"
        onClick={() => setMetodoPago("transferencia")}
        className={`flex-1 py-3 rounded-md flex flex-col items-center justify-center transition-colors ${
          metodoPago === "transferencia" 
            ? "bg-amarillo text-negro" 
            : "bg-negro text-white border border-amarillo"
        }`}
      >
        <span className="text-xl mb-1">📲</span>
        <span className="text-sm">Transfer.</span>
      </button>
    </div>
    
    <button
    onClick={registrarPago}
    className="w-full bg-amarillo text-negro py-2 rounded font-bold"
    >
    Registrar pago
    </button>
    </div>
    
    <div className="flex gap-2">
    <button
    onClick={() => window.location.href = `/ordenes/${id}/agregar`}
    className="flex-1 bg-black/30 py-2 rounded font-bold"
    >
    ➕ Agregar productos
    </button>
    <button
    onClick={cerrarOrden}
    className="flex-1 bg-green-600 py-2 rounded font-bold"
    >
    ✅ Cerrar orden
    </button>
    </div>
    </section>
  );
}
