/**
 * Configuración para la API
 */

// Obtener la URL de la API desde las variables de entorno
export const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Realiza una petición a la API
 * @param {string} endpoint - Ruta de la API (sin la URL base)
 * @param {Object} options - Opciones para fetch
 * @returns {Promise<any>} Respuesta de la API en formato JSON
 */
export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  // Configurar headers por defecto
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Agregar token de autenticación si existe
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error en la petición a la API:', error);
    throw error;
  }
}; 