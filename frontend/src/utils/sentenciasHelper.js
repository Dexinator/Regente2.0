import SENTENCIAS from './sentencias';
import { API_URL } from './api';

/**
 * Busca productos que coincidan con los criterios especificados
 * @param {Array} productos - Lista de productos disponibles
 * @param {Object} criterios - Criterios de búsqueda (categoria, filtro, etc.)
 * @returns {Array} - Productos que coinciden con los criterios
 */
export const buscarProductos = (productos, criterios) => {
  if (!productos || !productos.length) return [];

  return productos.filter(producto => {
    // Filtrar por categoría
    if (criterios.categoria && producto.categoria !== criterios.categoria) {
      return false;
    }

    // Filtrar por nombre (si hay un filtro específico)
    if (criterios.filtro && !producto.nombre.toLowerCase().includes(criterios.filtro.toLowerCase())) {
      return false;
    }

    // Filtrar por variantes específicas si es necesario
    if (criterios.variantes && criterios.variantes.length) {
      // Si el producto no tiene sabores disponibles, no coincide
      if (!producto.sabores_disponibles || !producto.sabores_disponibles.length) {
        return false;
      }
      // Verificar si alguna de las variantes coincide
      return true; // Esto se refinará más al cargar los sabores reales
    }

    return true;
  });
};

/**
 * Obtiene los componentes de una sentencia específica
 * @param {String} nombreSentencia - Nombre de la sentencia
 * @returns {Array|null} - Componentes de la sentencia o null si no existe
 */
export const obtenerComponentesSentencia = (nombreSentencia) => {
  const sentencia = SENTENCIAS[nombreSentencia];
  return sentencia ? sentencia.componentes : null;
};

/**
 * Genera los productos para una sentencia
 * @param {String} nombreSentencia - Nombre de la sentencia
 * @param {Array} productosDisponibles - Lista de productos disponibles
 * @returns {Promise<Array>} - Productos seleccionados para la sentencia
 */
export const generarProductosSentencia = async (nombreSentencia, productosDisponibles) => {
  const componentes = obtenerComponentesSentencia(nombreSentencia);
  if (!componentes) return [];

  const productosSeleccionados = [];

  for (const componente of componentes) {
    if (componente.tipo === 'fijo') {
      // Para componentes fijos, buscamos el producto directamente
      const productosCandidatos = buscarProductos(productosDisponibles, componente);
      
      if (productosCandidatos.length > 0) {
        const producto = productosCandidatos[0];
        
        // Agregar el producto con la cantidad especificada
        productosSeleccionados.push({
          ...producto,
          cantidad: componente.cantidad || 1,
          // Si hay tamaño específico, intentamos buscarlo
          tamano_id: componente.tamano ? await buscarTamanoId(producto.id, componente.tamano) : null,
          // Si se requiere ingrediente, lo dejamos para selección del usuario
          requiereIngrediente: componente.ingrediente || false
        });
      }
    } else if (componente.tipo === 'opcion') {
      // Para componentes de opción, presentamos las opciones al usuario
      // Esto se manejará en la interfaz, aquí solo preparamos los datos
      productosSeleccionados.push({
        tipo: 'opcion',
        opciones: componente.opciones,
        cantidad: componente.cantidad || 1
      });
    }
  }

  return productosSeleccionados;
};

/**
 * Busca el ID de un tamaño específico para un producto
 * @param {String} productoId - ID del producto
 * @param {String} nombreTamano - Nombre del tamaño a buscar
 * @returns {Promise<String|null>} - ID del tamaño o null si no se encuentra
 */
export const buscarTamanoId = async (productoId, nombreTamano) => {
  try {
    const res = await fetch(`${API_URL}/products/sabores/producto/${productoId}?tipo=tamano`);
    if (!res.ok) return null;
    
    const tamanos = await res.json();
    const tamanoEncontrado = tamanos.find(t => 
      t.nombre.toLowerCase().includes(nombreTamano.toLowerCase())
    );
    
    return tamanoEncontrado ? tamanoEncontrado.id : null;
  } catch (error) {
    console.error("Error buscando tamaño:", error);
    return null;
  }
};

/**
 * Busca el ID de un sabor específico para un producto
 * @param {String} productoId - ID del producto
 * @param {String} nombreSabor - Nombre del sabor a buscar
 * @returns {Promise<String|null>} - ID del sabor o null si no se encuentra
 */
export const buscarSaborId = async (productoId, nombreSabor) => {
  try {
    const res = await fetch(`${API_URL}/products/sabores/producto/${productoId}?tipo=sabor_comida`);
    if (!res.ok) return null;
    
    const sabores = await res.json();
    const saborEncontrado = sabores.find(s => 
      s.nombre.toLowerCase().includes(nombreSabor.toLowerCase())
    );
    
    return saborEncontrado ? saborEncontrado.id : null;
  } catch (error) {
    console.error("Error buscando sabor:", error);
    return null;
  }
};

/**
 * Procesa una sentencia y agrega sus productos al carrito
 * @param {String} nombreSentencia - Nombre de la sentencia
 * @param {Array} productosDisponibles - Lista de productos disponibles
 * @param {Function} agregarProducto - Función para agregar productos al carrito
 * @returns {Promise<Boolean>} - True si se procesó correctamente
 */
export const procesarSentencia = async (nombreSentencia, productosDisponibles, agregarProducto) => {
  const productos = await generarProductosSentencia(nombreSentencia, productosDisponibles);
  
  // Aquí se manejaría la lógica para permitir al usuario elegir entre opciones
  // y completar la información necesaria para cada producto
  
  // Por ahora, simplemente agregamos los productos fijos al carrito
  for (const producto of productos) {
    if (producto.tipo !== 'opcion') {
      agregarProducto(producto);
    }
  }
  
  return true;
};

export default {
  buscarProductos,
  obtenerComponentesSentencia,
  generarProductosSentencia,
  buscarTamanoId,
  buscarSaborId,
  procesarSentencia
}; 