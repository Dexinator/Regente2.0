/**
 * Guía para actualizar las referencias a localhost:3000 en todos los componentes
 * 
 * Para cada componente en src/components, debes:
 * 
 * 1. Importar la utilidad API_URL:
 *    import { API_URL } from "../utils/api.js";
 * 
 * 2. Reemplazar todas las ocurrencias de:
 *    "http://localhost:3000/path/to/endpoint"
 *    por:
 *    `${API_URL}/path/to/endpoint`
 * 
 * 3. Opcional: Para mayor robustez, puedes usar la función fetchApi:
 *    import { fetchApi } from "../utils/api.js";
 * 
 *    Y reemplazar:
 *    const res = await fetch(`${API_URL}/endpoint`, { method: "POST", ... });
 *    por:
 *    const res = await fetchApi("/endpoint", { method: "POST", ... });
 * 
 * Lista de componentes a actualizar:
 * - CrearOrden.jsx
 * - GestionOrden.jsx
 * - AgregarProducto.jsx
 * - DashboardGerente.jsx
 * - DashboardFinanciero.jsx
 * - AdminDashboard.jsx
 */

// Este es un archivo de documentación, no un script ejecutable 