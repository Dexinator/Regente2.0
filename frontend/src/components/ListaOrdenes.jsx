import { useEffect, useState } from "react";

export default function ListaOrdenes() {
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/orders/open")
      .then((res) => res.json())
      .then((data) => setOrdenes(data))
      .catch((err) => console.error("Error cargando órdenes:", err));
  }, []);

  return (
    <section className="space-y-4">
      {ordenes.length === 0 && (
        <p className="text-center text-gray-400">No hay órdenes abiertas</p>
      )}

{ordenes.map((orden) => (
  <div
    key={orden.orden_id}
    className="bg-vino rounded-xl p-4 shadow-md text-white space-y-2"
  >
    <div className="flex justify-between items-center">
      <span className="text-sm text-amarillo font-bold">#{orden.orden_id}</span>
      <span
        className={`text-sm font-bold px-2 py-1 rounded ${
          orden.estado_pago === "pendiente"
            ? "bg-red-600"
            : orden.estado_pago === "pagado"
            ? "bg-green-600"
            : "bg-yellow-600"
        }`}
      >
        {orden.estado_pago}
      </span>
    </div>

    <p className="text-lg font-subtitulo">{orden.cliente}</p>

    <div className="text-sm">
      <p>Total: ${orden.total.toFixed(2)}</p>
      <p>Pagado: ${orden.total_pagado.toFixed(2)}</p>
      {orden.diferencia > 0 && (
        <p className="text-green-400">Propina: +${orden.diferencia.toFixed(2)}</p>
      )}
      {orden.diferencia < 0 && (
        <p className="text-red-400">Faltan: ${Math.abs(orden.diferencia).toFixed(2)}</p>
      )}
    </div>

    <div className="flex gap-2 text-sm font-bold">
      <button
        onClick={() => console.log("Agregar producto a", orden.orden_id)}
        className="flex-1 bg-amarillo text-negro py-1 rounded"
      >
        ➕ Producto
      </button>
      <button
        onClick={() => console.log("Resumen de", orden.orden_id)}
        className="flex-1 border border-white py-1 rounded"
      >
        👁 Resumen
      </button>
      <button
        onClick={() => (window.location.href = `/ordenes/${orden.orden_id}`)}
        className="flex-1 bg-black/50 py-1 rounded"
      >
        🔍 Detalle
      </button>
    </div>
  </div>
))}
    </section>
  );
}
