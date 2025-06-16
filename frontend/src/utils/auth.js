/**
 * Decodifica el token JWT almacenado en localStorage
 * @returns {Object|null} Payload del token o null si no existe/es inválido
 */
export const decodeToken = () => {
  try {
    // Verificar si estamos en el cliente
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    // Decodificar el payload del token
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch (error) {
    console.error("Error al decodificar el token", error);
    return null;
  }
};

/**
 * Obtiene el ID del empleado desde el token JWT
 * @returns {number} ID del empleado o 1 como valor predeterminado
 */
export const getEmpleadoId = () => {
  const payload = decodeToken();
  return payload?.id || 1; // Retornar 1 como fallback si no hay ID
};

/**
 * Obtiene el rol del usuario desde el token JWT
 * @returns {string|null} Rol del usuario o null si no existe
 */
export const getUserRole = () => {
  const payload = decodeToken();
  return payload?.rol;
};

/**
 * Obtiene el nombre del usuario desde el token JWT
 * @returns {string} Nombre del usuario o "Usuario" como valor predeterminado
 */
export const getUserName = () => {
  const payload = decodeToken();
  return payload?.nombre || payload?.usuario || "Usuario";
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} true si hay un token válido
 */
export const isAuthenticated = () => {
  // Verificar si estamos en el cliente
  if (typeof window === 'undefined') return false;
  return decodeToken() !== null;
}; 