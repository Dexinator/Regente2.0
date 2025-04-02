import { useEffect, useState } from "react";

export default function GestionOrden({ id }) {
  const [orden, setOrden] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [nuevoPago, setNuevoPago] = useState("");
  const [nuevaPropina, setNuevaPropina] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [tipoPropina, setTipoPropina] = useState("fija"); // "fija" o "porcentaje"
  const [porcentajePropina, setPorcentajePropina] = useState(null);
  
  // Estado para manejo de cancelaciones
  const [mostrarCancelacion, setMostrarCancelacion] = useState(false);
  const [productoACancelar, setProductoACancelar] = useState(null);
  const [cantidadACancelar, setCantidadACancelar] = useState(1);
  const [razonCancelacion, setRazonCancelacion] = useState("");
  
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

  // Función para iniciar el proceso de cancelación de un producto
  const iniciarCancelacion = (producto) => {
    // Solo podemos cancelar productos reales, no cancelaciones, y no preparados
    if (!producto.es_cancelacion && !producto.preparado) {
      setProductoACancelar(producto);
      setCantidadACancelar(1);
      setMostrarCancelacion(true);
    } else if (producto.preparado) {
      alert("No se puede cancelar un producto que ya está preparado.");
    }
  };

  // Función para cancelar un producto
  const confirmarCancelacion = async () => {
    try {
      // Obtener el ID del empleado desde el token JWT
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Sesión no válida. Inicia sesión nuevamente.");
        window.location.href = "/login";
        return;
      }

      // Decodificar el token para obtener el ID del empleado
      const payload = JSON.parse(atob(token.split(".")[1]));
      const empleadoId = payload.id;

      const response = await fetch(`http://localhost:3000/orders/${id}/cancelar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          producto_id: productoACancelar.producto_id,
          cantidad: cantidadACancelar,
          empleado_id: empleadoId,
          razon_cancelacion: razonCancelacion
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al cancelar el producto");
      }

      const resultado = await response.json();
      alert(`Cancelación exitosa: ${resultado.cantidad} ${resultado.producto}`);
      
      // Cerrar modal y recargar datos
      setMostrarCancelacion(false);
      setProductoACancelar(null);
      setCantidadACancelar(1);
      setRazonCancelacion("");
      await cargarDatos();
      
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    }
  };
  
  if (!orden) return <p className="text-center">Cargando orden...</p>;
  
  return (
    <section className="space-y-6">
    <div className="bg-vino p-4 rounded shadow">
    <h2 className="font-subtitulo text-xl mb-2">{orden.cliente}</h2>
    <p>Total: ${orden.total.toFixed(2)}</p>
    <p>Pagado: ${orden.total_pagado.toFixed(2)}</p>
    {orden.num_personas > 1 && (
      <p>Personas: {orden.num_personas}</p>
    )}
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
      <ul className="space-y-2 text-sm">
      {orden.productos.map((p, i) => (
        <li key={i} className={`p-2 rounded ${p.es_cancelacion ? 'bg-red-950/30 line-through text-gray-400' : p.preparado ? 'bg-green-950/30' : 'bg-negro/30'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold">{p.nombre} x{p.cantidad} — ${parseFloat(p.precio_unitario).toFixed(2)}</p>
              
              {/* Información de sabor */}
              {p.sabor_nombre && (
                <p className="text-xs text-amarillo">
                  Sabor: {p.sabor_nombre} 
                  {p.sabor_categoria ? ` (${p.sabor_categoria})` : ''}
                  {p.sabor_precio > 0 && ` +$${p.sabor_precio}`}
                </p>
              )}
              
              {/* Información de tamaño */}
              {p.tamano_nombre && (
                <p className="text-xs text-amarillo">
                  Tamaño: {p.tamano_nombre}
                  {p.tamano_precio > 0 && ` +$${p.tamano_precio}`}
                </p>
              )}
              
              {/* Información de ingrediente extra */}
              {p.ingrediente_nombre && (
                <p className="text-xs text-amarillo">
                  Ingrediente Extra: {p.ingrediente_nombre}
                  {p.ingrediente_precio > 0 && ` +$${p.ingrediente_precio}`}
                </p>
              )}
              
              {/* Notas especiales */}
              {p.notas && (
                <p className="text-xs text-gray-400 mt-1 italic">
                  Notas: {p.notas}
                </p>
              )}
              
              {p.es_cancelacion && <span className="text-red-400 text-xs ml-2">CANCELACIÓN</span>}
              {p.preparado && !p.es_cancelacion && <span className="text-green-400 text-xs ml-2">PREPARADO</span>}
            </div>
            
            <div>
              {!p.es_cancelacion && !p.preparado && (
                <button 
                  onClick={() => iniciarCancelacion(p)}
                  className="bg-red-800 text-white text-xs px-2 py-1 rounded"
                >
                  Cancelar
                </button>
              )}
              {!p.es_cancelacion && p.preparado && (
                <span className="text-xs text-gray-400">No cancelable</span>
              )}
            </div>
          </div>
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

    {/* Modal de cancelación */}
    {mostrarCancelacion && productoACancelar && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
        <div className="bg-vino p-6 rounded-lg w-full max-w-md">
          <h3 className="text-xl font-bold mb-4 text-amarillo">Cancelar Producto</h3>
          
          <div className="mb-4">
            <p className="mb-2"><span className="font-bold">Producto:</span> {productoACancelar.nombre}</p>
            
            {/* Mostrar información de sabor en modal */}
            {productoACancelar.sabor_nombre && (
              <p className="text-sm mb-1">
                <span className="font-bold">Sabor:</span> {productoACancelar.sabor_nombre}
                {productoACancelar.sabor_categoria ? ` (${productoACancelar.sabor_categoria})` : ''}
              </p>
            )}
            
            {/* Mostrar información de tamaño en modal */}
            {productoACancelar.tamano_nombre && (
              <p className="text-sm mb-1">
                <span className="font-bold">Tamaño:</span> {productoACancelar.tamano_nombre}
              </p>
            )}
            
            {/* Mostrar información de ingrediente extra en modal */}
            {productoACancelar.ingrediente_nombre && (
              <p className="text-sm mb-1">
                <span className="font-bold">Ingrediente Extra:</span> {productoACancelar.ingrediente_nombre}
              </p>
            )}
            
            {/* Mostrar notas si existen */}
            {productoACancelar.notas && (
              <p className="text-sm mb-2 italic">
                <span className="font-bold">Notas:</span> {productoACancelar.notas}
              </p>
            )}
            
            <p className="mb-4"><span className="font-bold">Disponible:</span> {productoACancelar.cantidad} unidades</p>
            
            <label className="block mb-2 font-bold">Cantidad a cancelar:</label>
            <div className="flex items-center gap-3 bg-negro rounded p-2 w-full mb-4">
              <button 
                onClick={() => setCantidadACancelar(prev => Math.max(1, prev - 1))}
                className="bg-amarillo text-negro px-3 py-1 rounded-full font-bold"
              >
                -
              </button>
              <span className="flex-1 text-center text-xl font-bold">{cantidadACancelar}</span>
              <button 
                onClick={() => setCantidadACancelar(prev => Math.min(productoACancelar.cantidad, prev + 1))}
                className="bg-amarillo text-negro px-3 py-1 rounded-full font-bold"
              >
                +
              </button>
            </div>
            
            <label className="block mb-2 font-bold">Razón de cancelación:</label>
            <textarea
              value={razonCancelacion}
              onChange={(e) => setRazonCancelacion(e.target.value)}
              placeholder="Ej: Error en la orden, Cliente cambió de opinión..."
              className="w-full px-4 py-2 rounded bg-negro text-white placeholder:text-gray-400 border border-amarillo"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setMostrarCancelacion(false)}
              className="px-4 py-2 rounded bg-negro text-white"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarCancelacion}
              className="px-4 py-2 rounded bg-red-600 text-white font-bold"
              disabled={cantidadACancelar < 1 || cantidadACancelar > productoACancelar.cantidad}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    )}
    </section>
  );
}
