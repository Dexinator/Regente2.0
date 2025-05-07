import { useState, useEffect } from "react";
import SENTENCIAS from "../utils/sentencias";
import { procesarSentencia, generarProductosSentencia } from "../utils/sentenciasHelper";
import { API_URL } from "../utils/api.js";

/**
 * Componente para seleccionar y procesar sentencias
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onAddProducts - Función para agregar productos al carrito
 * @param {Function} props.onClose - Función para cerrar el selector
 */
export default function SentenciaSelector({ onAddProducts, onClose }) {
  const [sentenciaSeleccionada, setSentenciaSeleccionada] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paso, setPaso] = useState(1); // 1: Selección de sentencia, 2: Opciones, 3: Confirmación
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState({});
  const [productosFinales, setProductosFinales] = useState([]);

  // Cargar productos al montar el componente
  useEffect(() => {
    cargarProductos();
  }, []);

  // Cuando se selecciona una sentencia, generar sus productos
  useEffect(() => {
    if (sentenciaSeleccionada) {
      prepararSentencia(sentenciaSeleccionada);
    }
  }, [sentenciaSeleccionada]);

  // Cargar todos los productos disponibles
  const cargarProductos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar productos");
      }
      
      // Asegurarse de que el precio sea un número
      const productosConPrecioNumerico = data.map(producto => ({
        ...producto,
        precio: Number(producto.precio)
      }));
      
      setProductos(productosConPrecioNumerico);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los productos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Preparar los productos de la sentencia seleccionada
  const prepararSentencia = async (nombreSentencia) => {
    setLoading(true);
    try {
      const productosSentencia = await generarProductosSentencia(nombreSentencia, productos);
      
      // Separar productos fijos y opciones
      const fijos = productosSentencia.filter(p => p.tipo !== 'opcion');
      const opciones = productosSentencia.filter(p => p.tipo === 'opcion');
      
      setProductosFinales(fijos);
      
      // Si hay opciones, pasar al paso 2 para que el usuario elija
      if (opciones.length > 0) {
        setPaso(2);
      } else {
        // Si no hay opciones, pasar directamente a la confirmación
        setPaso(3);
      }
    } catch (error) {
      console.error("Error al preparar sentencia:", error);
      setError("Error al preparar la sentencia. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Manejar la selección de opciones
  const seleccionarOpcion = (indiceOpcion, productoSeleccionado) => {
    setOpcionesSeleccionadas(prev => ({
      ...prev,
      [indiceOpcion]: productoSeleccionado
    }));
  };

  // Continuar al siguiente paso
  const continuar = () => {
    if (paso === 2) {
      // Agregar las opciones seleccionadas a los productos finales
      const productosConOpciones = [
        ...productosFinales,
        ...Object.values(opcionesSeleccionadas)
      ];
      
      setProductosFinales(productosConOpciones);
      setPaso(3);
    } else if (paso === 3) {
      // Finalizar y agregar todos los productos al carrito
      productosFinales.forEach(producto => {
        onAddProducts(producto);
      });
      
      onClose();
    }
  };

  // Volver al paso anterior
  const volver = () => {
    if (paso === 2) {
      setPaso(1);
      setSentenciaSeleccionada(null);
    } else if (paso === 3) {
      setPaso(2);
    }
  };

  if (loading) {
    return (
      <div className="bg-vino rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Cargando...</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amarillo"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-vino rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Error</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>
        <p className="text-red-400">{error}</p>
        <button 
          onClick={onClose}
          className="w-full bg-amarillo text-negro py-2 rounded font-bold"
        >
          Cerrar
        </button>
      </div>
    );
  }

  // Paso 1: Selección de sentencia
  if (paso === 1) {
    return (
      <div className="bg-vino rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Selecciona una Sentencia</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {Object.keys(SENTENCIAS).map((key) => (
            <button
              key={key}
              onClick={() => setSentenciaSeleccionada(key)}
              className="bg-negro p-4 rounded-lg text-left hover:bg-gray-800 transition-colors"
            >
              <h3 className="text-lg font-bold text-amarillo">{SENTENCIAS[key].nombre}</h3>
              <p className="text-sm text-gray-300">{SENTENCIAS[key].descripcion}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Paso 2: Selección de opciones
  if (paso === 2) {
    // Obtener las opciones de la sentencia seleccionada
    const sentencia = SENTENCIAS[sentenciaSeleccionada];
    const componentesOpcionales = sentencia.componentes.filter(c => c.tipo === 'opcion');
    
    return (
      <div className="bg-vino rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Personaliza tu {sentencia.nombre}</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>
        
        {componentesOpcionales.map((componente, index) => (
          <div key={index} className="space-y-3">
            <h3 className="font-bold text-amarillo">Selecciona una opción:</h3>
            
            <div className="grid grid-cols-1 gap-2">
              {componente.opciones.map((opcion, opIndex) => {
                // Buscar productos que coincidan con esta opción
                const productosFiltrados = productos.filter(p => 
                  p.categoria === opcion.categoria && 
                  (!opcion.filtro || p.nombre.toLowerCase().includes(opcion.filtro.toLowerCase()))
                );
                
                return productosFiltrados.map(producto => (
                  <button
                    key={`${index}-${opIndex}-${producto.id}`}
                    onClick={() => seleccionarOpcion(index, {
                      ...producto,
                      cantidad: opcion.cantidad || componente.cantidad || 1
                    })}
                    className={`p-3 rounded text-left ${
                      opcionesSeleccionadas[index]?.id === producto.id
                        ? 'bg-amarillo text-negro'
                        : 'bg-negro hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{producto.nombre}</p>
                        <p className="text-xs text-gray-400">{producto.categoria}</p>
                      </div>
                      <span className="text-sm">
                        {opcion.cantidad || componente.cantidad || 1}x
                      </span>
                    </div>
                  </button>
                ));
              })}
            </div>
          </div>
        ))}
        
        <div className="flex justify-between pt-4">
          <button
            onClick={volver}
            className="px-4 py-2 bg-negro rounded font-bold"
          >
            Volver
          </button>
          
          <button
            onClick={continuar}
            disabled={Object.keys(opcionesSeleccionadas).length < componentesOpcionales.length}
            className={`px-4 py-2 rounded font-bold ${
              Object.keys(opcionesSeleccionadas).length < componentesOpcionales.length
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-amarillo text-negro'
            }`}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // Paso 3: Confirmación
  if (paso === 3) {
    const sentencia = SENTENCIAS[sentenciaSeleccionada];
    const precioTotal = productosFinales.reduce(
      (total, p) => total + (p.precio * p.cantidad), 0
    );
    
    return (
      <div className="bg-vino rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Confirmar {sentencia.nombre}</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-bold text-amarillo">Productos incluidos:</h3>
          
          {productosFinales.map((producto, index) => (
            <div key={index} className="bg-negro p-3 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{producto.nombre}</p>
                  <p className="text-xs text-gray-400">{producto.categoria}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{producto.cantidad}x</p>
                  <p className="text-xs text-amarillo">${producto.precio.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="border-t border-gray-700 pt-3 flex justify-between">
            <p className="font-bold">Total:</p>
            <p className="font-bold text-amarillo">${precioTotal.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex justify-between pt-4">
          <button
            onClick={volver}
            className="px-4 py-2 bg-negro rounded font-bold"
          >
            Volver
          </button>
          
          <button
            onClick={continuar}
            className="px-4 py-2 bg-amarillo text-negro rounded font-bold"
          >
            Agregar a la Orden
          </button>
        </div>
      </div>
    );
  }

  // Por defecto
  return null;
} 