import { useState, useEffect } from "react";
import { getUserRole, getUserName, decodeToken } from "../utils/auth";
import { API_URL } from "../utils/api.js";

export default function NavMenu() {
  const [userRole, setUserRole] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Obtener información del usuario del token
    const payload = decodeToken();
    
    if (payload) {
      setUserRole(payload.rol);
      setUserName(getUserName());
      
      // Redireccionar si está en una ruta no permitida
      checkRoutePermission(payload.rol);
    } else {
      // Si no hay token o no se pudo decodificar, redirigir al login
      window.location.href = "/login";
    }
  }, []);

  const checkRoutePermission = (role) => {
    const path = window.location.pathname;
    const validRoutes = {
      "mesero": ["/ordenes", "/entregar", "/cocina"],
      "cocinero": ["/cocina", "/entregar", "/cocinero/compras"],
      "gerente": ["/reportes/gerente", "/reportes/avanzado", "/gerente/compras", "/gerente/productos", "/gerente/sentencias", "/gerente/variantes"],
      "financiero": ["/reportes/financiero", "/reportes/avanzado"],
      "admin": ["/admin", "/admin/compras", "/reportes/avanzado"],
      "administrador": ["/admin", "/admin/compras", "/reportes/avanzado"]
    };

    // Verificar si el usuario está en una ruta permitida para su rol
    const userValidRoutes = validRoutes[role] || [];
    const isValidRoute = userValidRoutes.some(route => path.startsWith(route));
    
    if (!isValidRoute && path !== "/login") {
      // Redirigir a la primera ruta válida para su rol
      if (userValidRoutes.length > 0) {
        window.location.href = userValidRoutes[0];
      } else {
        window.location.href = "/login";
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  if (!userRole) return null;

  return (
    <div className="relative">
      {/* Botón de menú hamburguesa */}
      <button 
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 bg-vino p-2 rounded-full shadow-lg"
        aria-label="Menú"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Menú desplegable */}
      <nav className={`fixed inset-0 bg-negro/95 z-40 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="flex justify-end p-4">
          <button onClick={toggleMenu} className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center gap-6 p-4">
          <div className="text-center mb-8">
            <p className="text-amarillo text-xl font-bold">{userName}</p>
            <p className="text-white text-sm capitalize">{userRole}</p>
          </div>

          {/* Menú para Mesero */}
          {userRole === "mesero" && (
            <>
              <a href="/ordenes" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Órdenes Activas
              </a>
              <a href="/ordenes/nueva" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Nueva Orden
              </a>
              <a href="/entregar" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Por Entregar
              </a>
              <a href="/cocina" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Vista de Cocina
              </a>
            </>
          )}

          {/* Menú para Cocinero */}
          {userRole === "cocinero" && (
            <>
              <a href="/cocina" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Pedidos Pendientes
              </a>
              <a href="/cocina/historial" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Historial
              </a>
              <a href="/entregar" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Por Entregar
              </a>
              <a href="/cocinero/compras" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Sistema de Compras
              </a>
            </>
          )}

          {/* Menú para Gerente */}
          {userRole === "gerente" && (
            <>
              <a href="/reportes/gerente" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Dashboard del Dia
              </a>
              <a href="/reportes/avanzado" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-amarillo text-negro w-full max-w-xs text-center">
                Reportes Avanzados
              </a>
              <a href="/gerente/productos" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Gestion de Productos
              </a>
              <a href="/gerente/compras" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Sistema de Compras
              </a>
            </>
          )}

          {/* Menú para Financiero */}
          {userRole === "financiero" && (
            <>
              <a href="/reportes/financiero" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Dashboard Financiero
              </a>
              <a href="/reportes/financiero/balance" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Balance
              </a>
              <a href="/reportes/financiero/ingresos" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Ingresos
              </a>
            </>
          )}

          {/* Menú para Admin */}
          {(userRole === "admin" || userRole === "administrador") && (
            <>
              <a href="/admin" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Panel Principal
              </a>
              <a href="/admin/usuarios" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Gestión de Usuarios
              </a>
              <a href="/admin/productos" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Gestión de Productos
              </a>
              <a href="/admin/compras" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Sistema de Compras
              </a>
              <a href="/admin/configuracion" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
                Configuración
              </a>
            </>
          )}

          <button 
            onClick={handleLogout} 
            className="text-negro text-xl font-bold py-3 px-6 rounded-full bg-amarillo w-full max-w-xs mt-8"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>
    </div>
  );
} 