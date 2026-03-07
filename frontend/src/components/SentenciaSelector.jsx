import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";

/**
 * Componente para seleccionar y procesar sentencias
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onAddProducts - Función para agregar productos al carrito
 * @param {Function} props.onClose - Función para cerrar el selector
 */
export default function SentenciaSelector({ onAddProducts, onClose }) {
  const [sentencias, setSentencias] = useState([]);
  const [sentenciaSeleccionada, setSentenciaSeleccionada] = useState(null);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paso, setPaso] = useState(1); // 1: Selección de sentencia, 2: Opciones, 3: Confirmación
  const [opcionesSeleccionadas, setOpcionesSeleccionadas] = useState({});
  const [productosFinales, setProductosFinales] = useState([]);
  const [precioTotal, setPrecioTotal] = useState(0);

  // Cargar sentencias al montar el componente
  useEffect(() => {
    cargarSentencias();
    cargarProductos();
  }, []);

  // Cuando se selecciona una sentencia, cargar sus productos
  useEffect(() => {
    if (sentenciaSeleccionada) {
      cargarProductosSentencia(sentenciaSeleccionada.id);
    }
  }, [sentenciaSeleccionada]);

  // Cargar todas las sentencias disponibles
  const cargarSentencias = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("Solicitando sentencias al API:", `${API_URL}/sentencias`);
      const res = await fetch(`${API_URL}/sentencias`);
      const data = await res.json();
      
      console.log("Respuesta de sentencias:", data);
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar sentencias");
      }
      
      if (!Array.isArray(data)) {
        console.warn("Formato inesperado en respuesta de sentencias:", data);
        if (data && typeof data === 'object') {
          // Intento de adaptación si la API devuelve objeto en lugar de array
          const sentenciasArray = Object.values(data);
          if (Array.isArray(sentenciasArray) && sentenciasArray.length > 0) {
            setSentencias(sentenciasArray);
          } else {
            throw new Error("Formato de respuesta de sentencias no válido");
          }
        } else {
          throw new Error("Formato de respuesta de sentencias no válido");
        }
      } else {
        // Asegurarnos de que los precios sean números
        const sentenciasConPreciosNumericos = data.map(sentencia => ({
          ...sentencia,
          precio: parseFloat(sentencia.precio)
        }));
        setSentencias(sentenciasConPreciosNumericos);
      }
    } catch (error) {
      console.error("Error en cargarSentencias:", error);
      setError("No se pudieron cargar las sentencias. Intenta de nuevo. " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar todos los productos disponibles (para opciones)
  const cargarProductos = async () => {
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
    }
  };

  // Cargar productos de una sentencia específica
  const cargarProductosSentencia = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/sentencias/${id}/productos`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar productos de la sentencia");
      }
      
      console.log("Datos de la sentencia recibidos:", data);
      console.log("Productos fijos recibidos:", data.productos?.fijos);
      console.log("Productos opcionales recibidos:", data.productos?.opcionales);
      
      // Si no hay estructura esperada, mostrar error
      if (!data || typeof data !== 'object') {
        throw new Error("Formato de respuesta inesperado");
      }
      
      // Obtener la sentencia
      const sentenciaInfo = {
        ...sentenciaSeleccionada,
        precio: parseFloat(sentenciaSeleccionada.precio)
      };
      
      // Ver la estructura de los datos para adaptarnos a lo que viene del backend
      if (Array.isArray(data)) {
        // Si es un array, asumimos que son directamente los productos
        setProductosFinales(data);
      } else if (data.productos) {
        // Si viene dentro de un objeto "productos"
        if (Array.isArray(data.productos)) {
          setProductosFinales(data.productos);
        } else if (data.productos.fijos) {
          // Separar productos fijos y opciones como se esperaba originalmente
          const fijos = data.productos.fijos || [];
          const grupos = data.productos.opcionales || [];
          
          // Establecer productos fijos
      setProductosFinales(fijos);
      
      // Si hay opciones, pasar al paso 2 para que el usuario elija
          if (grupos && grupos.length > 0) {
            sentenciaSeleccionada.productos = data.productos;
        setPaso(2);
      } else {
        // Si no hay opciones, procesar directamente sin confirmación
            setPrecioTotal(sentenciaInfo.precio);
            // Procesar directamente con los productos fijos
            procesarSentenciaDirectamente(fijos, sentenciaInfo);
          }
        }
      } else {
        // Si no hay estructura clara, intentar usar lo que tengamos
        setProductosFinales(data);
        setPrecioTotal(sentenciaInfo.precio);
        // Procesar directamente con los datos recibidos
        procesarSentenciaDirectamente(data, sentenciaInfo);
      }
    } catch (error) {
      console.error("Error al cargar productos de la sentencia:", error);
      setError("Error al cargar los productos de la sentencia. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Manejar la selección de opciones
  const seleccionarOpcion = (grupoIndex, producto) => {
    console.log("Opción seleccionada para grupo", grupoIndex, ":", producto);
    
    // Asegurarnos de convertir todos los precios a números
    const productoConPreciosNumericos = {
      ...producto,
      precio_adicional: parseFloat(producto.precio_adicional || 0),
      tamano_precio: parseFloat(producto.tamano_precio || 0),
      ingrediente_precio: parseFloat(producto.ingrediente_precio || 0),
      // Conservar estos atributos que son importantes para la detección de variantes
      requiere_sabor: producto.requiere_sabor,
      requiere_tamano: producto.requiere_tamano,
      requiere_ingrediente: producto.requiere_ingrediente
    };
    
    setOpcionesSeleccionadas(prev => ({
      ...prev,
      [grupoIndex]: productoConPreciosNumericos
    }));
  };

  // Función para procesar sentencia directamente con productos
  const procesarSentenciaDirectamente = (productos, sentenciaInfo) => {
    console.log("Procesando sentencia directamente sin confirmación");

    // Generar ID único de instancia para esta sentencia
    const sentencia_instance_id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Agregar la sentencia como producto principal
    const sentenciaProducto = {
      id: -1,
      sentencia_id: sentenciaInfo.id,
      sentencia_instance_id: sentencia_instance_id,
      nombre: sentenciaInfo.nombre,
      descripcion: sentenciaInfo.descripcion || "Sentencia",
      precio: sentenciaInfo.precio,
      categoria: "Sentencia",
      cantidad: 1,
      esSentencia: true
    };
    
    // Preparar array para productos que necesitan selección de variantes
    const productosConVariantesPendientes = [];
    
    // Evaluar cada producto de la sentencia
    productos.forEach(producto => {
      const necesitaSeleccionVariante = 
        (producto.sabor_id === null && producto.requiere_sabor) || 
        (producto.tamano_id === null && producto.requiere_tamano) || 
        (producto.ingrediente_id === null && producto.requiere_ingrediente);
      
      if (necesitaSeleccionVariante) {
        productosConVariantesPendientes.push({
          ...producto,
          precio: 0,
          precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
          categoria: producto.producto_categoria || producto.categoria,
          nombre: producto.producto_nombre || producto.nombre,
          es_parte_sentencia: true,
          sentencia_id: sentenciaInfo.id,
          sentencia_instance_id: sentencia_instance_id,
          cantidad: producto.cantidad || 1,
          pendiente_seleccion_variante: true,
          precio_adicional: parseFloat(producto.precio_adicional || 0),
          tamano_precio: parseFloat(producto.tamano_precio || 0),
          ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
        });
      } else {
        // Enviar el producto directamente
        const productoParaAgregar = {
          ...producto,
          id: producto.producto_id || producto.id,
          nombre: producto.producto_nombre || producto.nombre,
          categoria: producto.producto_categoria || producto.categoria,
          precio: 0,
          precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
          es_parte_sentencia: true,
          sentencia_id: sentenciaInfo.id,
          sentencia_instance_id: sentencia_instance_id,
          cantidad: producto.cantidad || 1,
          precio_adicional: parseFloat(producto.precio_adicional || 0),
          tamano_precio: parseFloat(producto.tamano_precio || 0),
          ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
        };
        
        onAddProducts(productoParaAgregar);
      }
    });
    
    // Agregar el producto principal
    onAddProducts(sentenciaProducto);
    
    // Si hay productos con variantes pendientes, procesarlos
    if (productosConVariantesPendientes.length > 0) {
      onAddProducts({
        tipo: "grupo_variantes_pendientes",
        productos: productosConVariantesPendientes,
        sentencia_id: sentenciaInfo.id,
        sentencia_instance_id: sentencia_instance_id
      });
    }
    
    // NO cerrar aquí - el cierre se manejará cuando se completen todas las variantes
    onClose();
  };

  // Función para procesar sentencia con opciones seleccionadas
  const procesarSentenciaConOpciones = () => {
    console.log("Procesando sentencia con opciones seleccionadas");

    // Generar ID único de instancia para esta sentencia
    const sentencia_instance_id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Agregar la sentencia como producto principal
    const sentenciaProducto = {
      id: -1,
      sentencia_id: sentenciaSeleccionada.id,
      sentencia_instance_id: sentencia_instance_id,
      nombre: sentenciaSeleccionada.nombre,
      descripcion: sentenciaSeleccionada.descripcion || "Sentencia",
      precio: sentenciaSeleccionada.precio,
      categoria: "Sentencia",
      cantidad: 1,
      esSentencia: true
    };
    
    // Preparar array para productos que necesitan selección de variantes
    const productosConVariantesPendientes = [];
    
    // Procesar productos fijos
    productosFinales.forEach(producto => {
      const necesitaSeleccionVariante = 
        (producto.sabor_id === null && producto.requiere_sabor) || 
        (producto.tamano_id === null && producto.requiere_tamano) || 
        (producto.ingrediente_id === null && producto.requiere_ingrediente);
      
      if (necesitaSeleccionVariante) {
        productosConVariantesPendientes.push({
          ...producto,
          precio: 0,
          precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
          categoria: producto.producto_categoria || producto.categoria,
          nombre: producto.producto_nombre || producto.nombre,
          es_parte_sentencia: true,
          sentencia_id: sentenciaSeleccionada.id,
          sentencia_instance_id: sentencia_instance_id,
          cantidad: producto.cantidad || 1,
          pendiente_seleccion_variante: true,
          precio_adicional: parseFloat(producto.precio_adicional || 0),
          tamano_precio: parseFloat(producto.tamano_precio || 0),
          ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
        });
      } else {
        const productoParaAgregar = {
          ...producto,
          id: producto.producto_id || producto.id,
          nombre: producto.producto_nombre || producto.nombre,
          categoria: producto.producto_categoria || producto.categoria,
          precio: 0,
          precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
          es_parte_sentencia: true,
          sentencia_id: sentenciaSeleccionada.id,
          sentencia_instance_id: sentencia_instance_id,
          cantidad: producto.cantidad || 1,
          precio_adicional: parseFloat(producto.precio_adicional || 0),
          tamano_precio: parseFloat(producto.tamano_precio || 0),
          ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
        };

        onAddProducts(productoParaAgregar);
      }
    });

    // Procesar opciones seleccionadas
    Object.values(opcionesSeleccionadas).forEach(producto => {
      const necesitaSeleccionVariante =
        (producto.sabor_id === null && producto.requiere_sabor) ||
        (producto.tamano_id === null && producto.requiere_tamano) ||
        (producto.ingrediente_id === null && producto.requiere_ingrediente);

      if (necesitaSeleccionVariante) {
        productosConVariantesPendientes.push({
          ...producto,
          id: producto.producto_id || producto.id,
          nombre: producto.producto_nombre || producto.nombre,
          categoria: producto.producto_categoria || producto.categoria,
          precio: 0,
          precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
          es_parte_sentencia: true,
          sentencia_id: sentenciaSeleccionada.id,
          sentencia_instance_id: sentencia_instance_id,
          cantidad: producto.cantidad || 1,
          pendiente_seleccion_variante: true,
          precio_adicional: parseFloat(producto.precio_adicional || 0),
          tamano_precio: parseFloat(producto.tamano_precio || 0),
          ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
        });
      } else {
        const opcionParaAgregar = {
          ...producto,
          id: producto.producto_id || producto.id,
          nombre: producto.producto_nombre || producto.nombre,
          categoria: producto.producto_categoria || producto.categoria,
          precio: 0,
          precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
          es_parte_sentencia: true,
          sentencia_id: sentenciaSeleccionada.id,
          sentencia_instance_id: sentencia_instance_id,
          cantidad: producto.cantidad || 1,
          precio_adicional: parseFloat(producto.precio_adicional || 0),
          tamano_precio: parseFloat(producto.tamano_precio || 0),
          ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
        };

        onAddProducts(opcionParaAgregar);
      }
    });
    
    // Agregar el producto principal
    onAddProducts(sentenciaProducto);

    // Si hay productos con variantes pendientes, procesarlos
    if (productosConVariantesPendientes.length > 0) {
      onAddProducts({
        tipo: "grupo_variantes_pendientes",
        productos: productosConVariantesPendientes,
        sentencia_id: sentenciaSeleccionada.id,
        sentencia_instance_id: sentencia_instance_id
      });
    }

    onClose();
  };

  // Función para procesar sentencia sin pasar por confirmación
  const procesarSentenciaSinConfirmacion = () => {
    console.log("Procesando sentencia sin confirmación");

    // Generar ID único de instancia para esta sentencia
    const sentencia_instance_id = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Agregar la sentencia como producto principal
    const sentenciaProducto = {
      id: -1,
      sentencia_id: sentenciaSeleccionada.id,
      sentencia_instance_id: sentencia_instance_id,
      nombre: sentenciaSeleccionada.nombre,
      descripcion: sentenciaSeleccionada.descripcion || "Sentencia",
      precio: sentenciaSeleccionada.precio,
      categoria: "Sentencia",
      cantidad: 1,
      esSentencia: true
    };
    
    // Preparar array para productos que necesitan selección de variantes
    const productosConVariantesPendientes = [];
    
    // Evaluar cada producto de la sentencia
    productosFinales.forEach(producto => {
      const necesitaSeleccionVariante = 
        (producto.sabor_id === null && producto.requiere_sabor) || 
        (producto.tamano_id === null && producto.requiere_tamano) || 
        (producto.ingrediente_id === null && producto.requiere_ingrediente);
      
      if (necesitaSeleccionVariante) {
        productosConVariantesPendientes.push({
          ...producto,
          precio: 0,
          precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
          categoria: producto.producto_categoria || producto.categoria,
          nombre: producto.producto_nombre || producto.nombre,
          es_parte_sentencia: true,
          sentencia_id: sentenciaSeleccionada.id,
          sentencia_instance_id: sentencia_instance_id,
          cantidad: producto.cantidad || 1,
          pendiente_seleccion_variante: true,
          precio_adicional: parseFloat(producto.precio_adicional || 0),
          tamano_precio: parseFloat(producto.tamano_precio || 0),
          ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
        });
      } else {
        // Enviar el producto directamente
        const productoParaAgregar = {
          ...producto,
          id: producto.producto_id || producto.id,
          nombre: producto.producto_nombre || producto.nombre,
          categoria: producto.producto_categoria || producto.categoria,
          precio: 0,
          precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
          es_parte_sentencia: true,
          sentencia_id: sentenciaSeleccionada.id,
          sentencia_instance_id: sentencia_instance_id,
          cantidad: producto.cantidad || 1,
          precio_adicional: parseFloat(producto.precio_adicional || 0),
          tamano_precio: parseFloat(producto.tamano_precio || 0),
          ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
        };

        onAddProducts(productoParaAgregar);
      }
    });

    // Agregar el producto principal
    onAddProducts(sentenciaProducto);

    // Si hay productos con variantes pendientes, procesarlos
    if (productosConVariantesPendientes.length > 0) {
      onAddProducts({
        tipo: "grupo_variantes_pendientes",
        productos: productosConVariantesPendientes,
        sentencia_id: sentenciaSeleccionada.id,
        sentencia_instance_id: sentencia_instance_id
      });
    }
    
    onClose();
  };

  // Continuar al siguiente paso
  const continuar = () => {
    if (paso === 2) {
      // Evitar duplicar productos - solo agregar productos fijos
      // No incluir las opciones seleccionadas en productosFinales
      console.log("Opciones seleccionadas antes de continuar:", opcionesSeleccionadas);
      
      // Verificar que las opciones tienen los atributos de variantes
      Object.entries(opcionesSeleccionadas).forEach(([key, opcion]) => {
        console.log(`Opción ${key} - requiere_sabor:`, opcion.requiere_sabor);
        console.log(`Opción ${key} - requiere_tamano:`, opcion.requiere_tamano);
        console.log(`Opción ${key} - requiere_ingrediente:`, opcion.requiere_ingrediente);
        console.log(`Opción ${key} - sabor_nombre:`, opcion.sabor_nombre);
        console.log(`Opción ${key} - tamano_nombre:`, opcion.tamano_nombre);
        console.log(`Opción ${key} - ingrediente_nombre:`, opcion.ingrediente_nombre);
        console.log(`Opción ${key} - precio_adicional:`, opcion.precio_adicional);
        console.log(`Opción ${key} - tamano_precio:`, opcion.tamano_precio);
        console.log(`Opción ${key} - ingrediente_precio:`, opcion.ingrediente_precio);
      });
      
      // Mantener productosFinales como está (solo productos fijos)
      // No agregamos las opciones seleccionadas aquí
      console.log("Productos finales para paso 3:", productosFinales);
      
      // Calcular el precio total incluyendo los costos adicionales de variantes
      let precioVariantes = 0;
      Object.values(opcionesSeleccionadas).forEach(opcion => {
        if (opcion.precio_adicional && !isNaN(parseFloat(opcion.precio_adicional))) {
          precioVariantes += parseFloat(opcion.precio_adicional);
        }
        if (opcion.tamano_precio && !isNaN(parseFloat(opcion.tamano_precio))) {
          precioVariantes += parseFloat(opcion.tamano_precio);
        }
        if (opcion.ingrediente_precio && !isNaN(parseFloat(opcion.ingrediente_precio))) {
          precioVariantes += parseFloat(opcion.ingrediente_precio);
        }
      });
      
      setPrecioTotal(sentenciaSeleccionada.precio + precioVariantes);
      
      // En lugar de ir al paso 3, procesar directamente
      procesarSentenciaConOpciones();
    } else if (paso === 3) {
      console.log("Continuando desde paso 3 - Confirmación");
      
      // Finalizar y agregar la sentencia como producto principal
      const sentenciaProducto = {
        id: -1, // ID temporal para identificar que es una sentencia
        sentencia_id: sentenciaSeleccionada.id,
        nombre: sentenciaSeleccionada.nombre,
        descripcion: sentenciaSeleccionada.descripcion || "Sentencia",
        precio: sentenciaSeleccionada.precio,
        categoria: "Sentencia",
        cantidad: 1,
        esSentencia: true
      };
      
      console.log("Producto principal de sentencia a agregar:", sentenciaProducto);
      
      // Preparar array para productos que necesitan selección de variantes
      const productosConVariantesPendientes = [];
      
      // Evaluar cada producto de la sentencia para determinar si necesita selección de variantes
      productosFinales.forEach(producto => {
        // Determinar si el producto necesita selección de variante
        const necesitaSeleccionVariante = 
          // Si tiene sabor_id definido, no necesita selección
          (producto.sabor_id === null && producto.requiere_sabor) || 
          // Si tiene tamano_id definido, no necesita selección
          (producto.tamano_id === null && producto.requiere_tamano) || 
          // Si tiene ingrediente_id definido, no necesita selección
          (producto.ingrediente_id === null && producto.requiere_ingrediente);
        
        if (necesitaSeleccionVariante) {
          // Guardar para procesamiento posterior
          productosConVariantesPendientes.push({
            ...producto,
            precio: 0, // Precio base 0 por ser parte de la sentencia
            precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
            categoria: producto.producto_categoria || producto.categoria,
            nombre: producto.producto_nombre || producto.nombre,
            es_parte_sentencia: true,
            sentencia_id: sentenciaSeleccionada.id,
            cantidad: producto.cantidad || 1,
            pendiente_seleccion_variante: true,
            // Asegurar que los precios estén en formato numérico
            precio_adicional: parseFloat(producto.precio_adicional || 0),
            tamano_precio: parseFloat(producto.tamano_precio || 0),
            ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
          });
        } else {
          // Enviar el producto como parte de una sentencia inmediatamente
          const productoParaAgregar = {
            ...producto,
            id: producto.producto_id || producto.id,
            nombre: producto.producto_nombre || producto.nombre,
            categoria: producto.producto_categoria || producto.categoria,
            precio: 0, // Precio base 0 por ser parte de la sentencia
            precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
            es_parte_sentencia: true,
            sentencia_id: sentenciaSeleccionada.id,
            cantidad: producto.cantidad || 1,
            // Asegurar que los precios están en formato numérico
            precio_adicional: parseFloat(producto.precio_adicional || 0),
            tamano_precio: parseFloat(producto.tamano_precio || 0),
            ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
          };
          
          console.log("Agregando producto fijo de sentencia:", productoParaAgregar);
          onAddProducts(productoParaAgregar);
        }
      });

      // También revisar las opciones seleccionadas para variantes pendientes
      Object.values(opcionesSeleccionadas).forEach(producto => {
        const necesitaSeleccionVariante = 
          (producto.sabor_id === null && producto.requiere_sabor) || 
          (producto.tamano_id === null && producto.requiere_tamano) || 
          (producto.ingrediente_id === null && producto.requiere_ingrediente);
        
        if (necesitaSeleccionVariante) {
          productosConVariantesPendientes.push({
            ...producto,
            id: producto.producto_id || producto.id,
            nombre: producto.producto_nombre || producto.nombre,
            categoria: producto.producto_categoria || producto.categoria,
            precio: 0, // Precio base 0 por ser parte de la sentencia
            precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
            es_parte_sentencia: true,
            sentencia_id: sentenciaSeleccionada.id,
            cantidad: producto.cantidad || 1,
            pendiente_seleccion_variante: true,
            // Asegurar que los precios estén en formato numérico
            precio_adicional: parseFloat(producto.precio_adicional || 0),
            tamano_precio: parseFloat(producto.tamano_precio || 0),
            ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
          });
        } else {
          // Agregar opción directamente
          const opcionParaAgregar = {
            ...producto,
            id: producto.producto_id || producto.id,
            nombre: producto.producto_nombre || producto.nombre,
            categoria: producto.producto_categoria || producto.categoria,
            precio: 0, // Precio base 0 por ser parte de la sentencia
            precio_original: producto.producto_precio_original || producto.precio_original || producto.precio || 0,
            es_parte_sentencia: true,
            sentencia_id: sentenciaSeleccionada.id,
            cantidad: producto.cantidad || 1,
            // Asegurar que los precios estén en formato numérico
            precio_adicional: parseFloat(producto.precio_adicional || 0),
            tamano_precio: parseFloat(producto.tamano_precio || 0),
            ingrediente_precio: parseFloat(producto.ingrediente_precio || 0)
          };
          
          console.log("Agregando opción de sentencia:", opcionParaAgregar);
          onAddProducts(opcionParaAgregar);
        }
      });
      
      // Agregar el producto principal de la sentencia
      console.log("Agregando el producto principal de la sentencia");
      onAddProducts(sentenciaProducto);
      
      // Si hay productos que necesitan selección de variantes, los enviamos primero
      if (productosConVariantesPendientes.length > 0) {
        console.log("Productos con variantes pendientes:", productosConVariantesPendientes);
        // Enviar los productos con variantes pendientes como un grupo
        onAddProducts({
          tipo: "grupo_variantes_pendientes",
          productos: productosConVariantesPendientes,
          sentencia_id: sentenciaSeleccionada.id
        });
      }
      
      onClose();
    }
  };

  // Volver al paso anterior
  const volver = () => {
    if (paso === 2) {
      setPaso(1);
      setSentenciaSeleccionada(null);
      setOpcionesSeleccionadas({});
    } else if (paso === 3) {
      if (productosFinales.some(p => p.es_opcional)) {
      setPaso(2);
      } else {
        setPaso(1);
        setSentenciaSeleccionada(null);
      }
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
      <div className="bg-vino rounded-xl p-6 space-y-6 shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Selecciona una Sentencia</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>
        
        {loading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amarillo"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/50 p-3 rounded text-red-200 text-sm">
            {error}
            <button
              onClick={cargarSentencias}
              className="ml-2 underline hover:text-white"
            >
              Reintentar
            </button>
          </div>
        )}
        
        {sentencias.length === 0 && !loading && !error ? (
          <p className="text-center text-gray-300">No hay sentencias disponibles</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sentencias.map((sentencia) => (
              <button
                key={sentencia.id}
                onClick={() => setSentenciaSeleccionada(sentencia)}
              className="bg-negro p-4 rounded-lg text-left hover:bg-gray-800 transition-colors"
            >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-amarillo">{sentencia.nombre}</h3>
                  <span className="text-amarillo font-bold">${sentencia.precio.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-300">{sentencia.descripcion}</p>
            </button>
          ))}
        </div>
        )}
      </div>
    );
  }

  // Paso 2: Selección de opciones
  if (paso === 2) {
    return (
      <div className="bg-vino rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Personaliza tu {sentenciaSeleccionada.nombre}</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>
        
        {sentenciaSeleccionada.productos?.opcionales?.map((grupo, index) => (
          <div key={index} className="space-y-3">
            <h3 className="font-bold text-amarillo">Selecciona una opción:</h3>
            
            <div className="grid grid-cols-1 gap-2">
              {grupo.map((producto, prodIndex) => (
                  <button
                  key={`${index}-${prodIndex}-${producto.producto_id}`}
                  onClick={() => seleccionarOpcion(index, producto)}
                    className={`p-3 rounded text-left ${
                    opcionesSeleccionadas[index]?.producto_id === producto.producto_id
                        ? 'bg-amarillo text-negro'
                        : 'bg-negro hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-bold">{producto.producto_nombre || producto.nombre}</p>
                      <p className="text-xs text-gray-400">{producto.producto_categoria || producto.categoria}</p>
                      {producto.sabor_nombre && (
                        <div className="flex justify-between text-xs text-gray-300">
                          <span>Sabor: {producto.sabor_nombre}</span>
                          {parseFloat(producto.precio_adicional) > 0 && (
                            <span className="text-amarillo">+${parseFloat(producto.precio_adicional).toFixed(2)}</span>
                          )}
                        </div>
                      )}
                      {producto.tamano_nombre && (
                        <div className="flex justify-between text-xs text-gray-300">
                          <span>Tamaño: {producto.tamano_nombre}</span>
                          {parseFloat(producto.tamano_precio) > 0 && (
                            <span className="text-amarillo">+${parseFloat(producto.tamano_precio).toFixed(2)}</span>
                          )}
                        </div>
                      )}
                      {producto.ingrediente_nombre && (
                        <div className="flex justify-between text-xs text-gray-300">
                          <span>Ingrediente: {producto.ingrediente_nombre}</span>
                          {parseFloat(producto.ingrediente_precio) > 0 && (
                            <span className="text-amarillo">+${parseFloat(producto.ingrediente_precio).toFixed(2)}</span>
                          )}
                        </div>
                      )}
                      </div>
                      <span className="text-sm">
                      {producto.cantidad || 1}x
                      </span>
                    </div>
                  </button>
              ))}
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
            disabled={Object.keys(opcionesSeleccionadas).length < sentenciaSeleccionada.productos?.opcionales?.length}
            className={`px-4 py-2 rounded font-bold ${
              Object.keys(opcionesSeleccionadas).length < sentenciaSeleccionada.productos?.opcionales?.length
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
    return (
      <div className="bg-vino rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Confirmar {sentenciaSeleccionada.nombre}</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white">✕</button>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-bold text-amarillo">Productos incluidos:</h3>
          
          {/* Productos fijos de la sentencia */}
          {productosFinales.map((producto, index) => (
            <div key={`fijo-${index}`} className="bg-negro p-3 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold">{producto.producto_nombre || producto.nombre}</p>
                  <p className="text-xs text-gray-400">{producto.producto_categoria || producto.categoria}</p>
                  {producto.sabor_nombre && (
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Sabor: {producto.sabor_nombre}</span>
                      {parseFloat(producto.precio_adicional) > 0 && (
                        <span className="text-amarillo">+${parseFloat(producto.precio_adicional).toFixed(2)}</span>
                      )}
                    </div>
                  )}
                  {producto.tamano_nombre && (
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Tamaño: {producto.tamano_nombre}</span>
                      {parseFloat(producto.tamano_precio) > 0 && (
                        <span className="text-amarillo">+${parseFloat(producto.tamano_precio).toFixed(2)}</span>
                      )}
                    </div>
                  )}
                  {producto.ingrediente_nombre && (
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Ingrediente: {producto.ingrediente_nombre}</span>
                      {parseFloat(producto.ingrediente_precio) > 0 && (
                        <span className="text-amarillo">+${parseFloat(producto.ingrediente_precio).toFixed(2)}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold">{producto.cantidad || 1}x</p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Opciones seleccionadas por el usuario */}
          {Object.entries(opcionesSeleccionadas).length > 0 && (
            <h3 className="font-bold text-amarillo mt-4">Opciones seleccionadas:</h3>
          )}
          
          {Object.values(opcionesSeleccionadas).map((producto, index) => (
            <div key={`opcion-${index}`} className="bg-negro p-3 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-bold">{producto.producto_nombre || producto.nombre}</p>
                  <p className="text-xs text-gray-400">{producto.producto_categoria || producto.categoria}</p>
                  {producto.sabor_nombre && (
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Sabor: {producto.sabor_nombre}</span>
                      {parseFloat(producto.precio_adicional) > 0 && (
                        <span className="text-amarillo">+${parseFloat(producto.precio_adicional).toFixed(2)}</span>
                      )}
                    </div>
                  )}
                  {producto.tamano_nombre && (
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Tamaño: {producto.tamano_nombre}</span>
                      {parseFloat(producto.tamano_precio) > 0 && (
                        <span className="text-amarillo">+${parseFloat(producto.tamano_precio).toFixed(2)}</span>
                      )}
                    </div>
                  )}
                  {producto.ingrediente_nombre && (
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Ingrediente: {producto.ingrediente_nombre}</span>
                      {parseFloat(producto.ingrediente_precio) > 0 && (
                        <span className="text-amarillo">+${parseFloat(producto.ingrediente_precio).toFixed(2)}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold">{producto.cantidad || 1}x</p>
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