import { useState } from "react";
import ProveedoresPanel from "./ProveedoresPanel";
import InsumosPanel from "./InsumosPanel";
import RequisicionesPanel from "./RequisicionesPanel";
import ComprasListado from "./ComprasListado";

export default function ComprasPanel() {
  const [seccionActiva, setSeccionActiva] = useState("compras");

  const secciones = [
    { id: "compras", nombre: "Compras" },
    { id: "requisiciones", nombre: "Requisiciones" },
    { id: "insumos", nombre: "Insumos" },
    { id: "proveedores", nombre: "Proveedores" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <h1 className="text-3xl font-titulo text-amarillo mb-6 text-center">
        Sistema de Compras
      </h1>

      {/* Navegación entre secciones */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
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

      {/* Contenido de la sección activa */}
      <div className="bg-negro/30 p-4 rounded-lg">
        {seccionActiva === "compras" && <ComprasListado />}
        {seccionActiva === "requisiciones" && <RequisicionesPanel />}
        {seccionActiva === "insumos" && <InsumosPanel />}
        {seccionActiva === "proveedores" && <ProveedoresPanel />}
      </div>
    </div>
  );
} 