import { useEffect, useState } from "react";

export default function GestionOrden({ id }) {
  const [orden, setOrden] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [nuevoPago, setNuevoPago] = useState("");

  const cargarDatos = async () => {
    try {
      const resOrden = await fetch(`http://localhost:3000/orders/${id}/resumen`);
      const resPagos = await fetch(`http://localhost:3000/pagos/orden/${id}`);
      const datosOrden = await resOrden.json();
      console.log("ORDEN:", datosOrden); 
      const datosPagos = await resPagos.json();
      console.log("PAGOS:", datosPagos);
      setOrden(datosOrden);
      setPagos(datosPagos);
    } catch (err) {
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

    const body = {
      orden_id: parseInt(id),
      monto: parseFloat(nuevoPago),
    };

    const res = await fetch("http://localhost:3000/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setNuevoPago("");
      await cargarDatos();
    } else {
      const data = await res.json();
      alert(data.error || "No se pudo registrar el pago");
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

  if (!orden) return <p className="text-center">Cargando orden...</p>;

  return (
    <section className="space-y-6">
      <div className="bg-vino p-4 rounded shadow">
        <h2 className="font-subtitulo text-xl mb-2">{orden.cliente}</h2>
        <p>Total: ${orden.total.toFixed(2)}</p>
        <p>Pagado: ${orden.total_pagado.toFixed(2)}</p>
        {orden.diferencia > 0 && (
          <p className="text-green-400">Propina: +${orden.diferencia.toFixed(2)}</p>
        )}
        {orden.diferencia < 0 && (
          <p className="text-red-400">Faltan: ${Math.abs(orden.diferencia).toFixed(2)}</p>
        )}
        <p className="text-sm mt-2">Estado de pago: <strong>{orden.estado_pago}</strong></p>
      </div>

      <div>
        <h3 className="text-amarillo font-bold mb-2">Productos</h3>
        <ul className="space-y-1 text-sm">
          {orden.productos.map((p, i) => (
            <li key={i}>
              {p.nombre} x{p.cantidad} — ${p.precio_unitario}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-amarillo font-bold mb-2">Pagos</h3>
        <ul className="space-y-1 text-sm">
          {pagos.length === 0 && <li>No hay pagos registrados.</li>}
          {pagos.map((pago) => (
            <li key={pago.id}>💳 ${pago.monto} — {new Date(pago.fecha).toLocaleTimeString()}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <input
          type="number"
          value={nuevoPago}
          onChange={(e) => setNuevoPago(e.target.value)}
          placeholder="Monto del nuevo pago"
          className="w-full p-2 rounded bg-negro text-white border border-amarillo placeholder:text-white/60"
        />
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
