import { useState } from "react";
import ProveedoresPanel from "./ProveedoresPanel";
import InsumosPanel from "./InsumosPanel";
import RequisicionesPanel from "./RequisicionesPanel";
import RegistroCompras from "./RegistroCompras";
import ComprasDelDia from "./ComprasDelDia";
import RecetasPanel from "./RecetasPanel";
import InventarioPanel from "./InventarioPanel";

export default function ComprasPanel() {
  const [seccionActiva, setSeccionActiva] = useState("proveedores");

  const secciones = [
    { id: "proveedores", nombre: "Proveedores" },
    { id: "insumos", nombre: "Insumos" },
    { id: "requisiciones", nombre: "Requisiciones" },
    { id: "compras-del-dia", nombre: "Compras del Día" },
    { id: "registro-compras", nombre: "Registro de Compras" },
    { id: "inventario", nombre: "Inventario" },
    { id: "recetas", nombre: "Recetas" },
  ];

  return (
    <div className="w-full max-w-full px-2 lg:px-4">
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
        {seccionActiva === "inventario" && <InventarioPanel />}
        {seccionActiva === "recetas" && <RecetasPanel />}
        {seccionActiva === "registro-compras" && <RegistroCompras />}
        {seccionActiva === "compras-del-dia" && <ComprasDelDia />}
        {seccionActiva === "requisiciones" && <RequisicionesPanel />}
        {seccionActiva === "insumos" && <InsumosPanel />}
        {seccionActiva === "proveedores" && <ProveedoresPanel />}
      </div>
    </div>
  );
} 