import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("http://localhost:3000/reports/gerente?vista=admin");
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

  if (loading) {
    return <p className="text-center text-gray-400 p-12">Cargando estadísticas...</p>;
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
    <div className="space-y-8">
      {/* Tarjetas de Acceso Rápido */}
      <div className="grid grid-cols-2 gap-4">
        <a 
          href="/admin/usuarios" 
          className="bg-vino p-6 rounded-xl text-center hover:bg-vino/80 transition-colors"
        >
          <h3 className="text-amarillo font-bold mb-2">Usuarios</h3>
          <p className="text-3xl font-bold">{stats?.total_usuarios || 0}</p>
        </a>
        
        <a 
          href="/admin/productos" 
          className="bg-vino p-6 rounded-xl text-center hover:bg-vino/80 transition-colors"
        >
          <h3 className="text-amarillo font-bold mb-2">Productos</h3>
          <p className="text-3xl font-bold">{stats?.total_productos || 0}</p>
        </a>
        
        <a 
          href="/reportes/gerente" 
          className="bg-vino p-6 rounded-xl text-center hover:bg-vino/80 transition-colors"
        >
          <h3 className="text-amarillo font-bold mb-2">Reportes</h3>
          <p className="text-3xl font-bold">Dashboard</p>
        </a>
        
        <a 
          href="/admin/configuracion" 
          className="bg-vino p-6 rounded-xl text-center hover:bg-vino/80 transition-colors"
        >
          <h3 className="text-amarillo font-bold mb-2">Configuración</h3>
          <p className="text-3xl font-bold">Sistema</p>
        </a>
      </div>

      {/* Resumen de Estado del Sistema */}
      <div className="bg-vino rounded-xl p-4">
        <h3 className="text-lg text-amarillo font-bold mb-4">Estado del Sistema</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-negro/30 p-3 rounded">
            <p>Órdenes activas</p>
            <p className="font-bold">{stats?.ordenes_activas || 0}</p>
          </div>
          
          <div className="flex justify-between items-center bg-negro/30 p-3 rounded">
            <p>Pedidos en cocina</p>
            <p className="font-bold">{stats?.pedidos_cocina || 0}</p>
          </div>
          
          <div className="flex justify-between items-center bg-negro/30 p-3 rounded">
            <p>Usuarios conectados</p>
            <p className="font-bold">{stats?.usuarios_activos || 0}</p>
          </div>
          
          <div className="flex justify-between items-center bg-negro/30 p-3 rounded">
            <p>Versión del sistema</p>
            <p className="font-bold">{stats?.version || "1.0.0"}</p>
          </div>
        </div>
      </div>

      {/* Últimas Actividades */}
      <div className="bg-vino rounded-xl p-4">
        <h3 className="text-lg text-amarillo font-bold mb-4">Actividad Reciente</h3>
        
        <div className="space-y-3">
          {stats?.actividades && stats.actividades.length > 0 ? (
            stats.actividades.map((actividad, index) => (
              <div key={index} className="bg-negro/30 p-3 rounded">
                <div className="flex justify-between">
                  <p className="font-bold">{actividad.tipo}</p>
                  <p className="text-sm text-gray-300">{actividad.fecha}</p>
                </div>
                <p className="text-sm mt-1">{actividad.descripcion}</p>
                <p className="text-xs text-amarillo mt-1">Por: {actividad.usuario}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-4">No hay actividades recientes</p>
          )}
        </div>
      </div>

      {/* Botones de Gestión */}
      <div className="mt-8 space-y-3">
        <a 
          href="/admin/usuarios/nuevo" 
          className="block bg-amarillo text-negro text-center py-3 px-6 rounded-full font-bold"
        >
          Crear Nuevo Usuario
        </a>
        
        <a 
          href="/admin/productos/nuevo" 
          className="block bg-vino text-white text-center py-3 px-6 rounded-full font-bold"
        >
          Crear Nuevo Producto
        </a>
        
        <a 
          href="/admin/configuracion" 
          className="block bg-vino text-white text-center py-3 px-6 rounded-full font-bold"
        >
          Configurar Sistema
        </a>
      </div>
    </div>
  );
} 