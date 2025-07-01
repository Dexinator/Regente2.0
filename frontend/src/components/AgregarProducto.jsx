import { useState, useEffect } from "react";
import { getEmpleadoId } from "../utils/auth";
import { API_URL } from "../utils/api.js";
import SentenciaSelector from "./SentenciaSelector";

export default function AgregarProducto({ orden_id }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ordenInfo, setOrdenInfo] = useState(null);
  
  // Estados originales
  const [saboresDisponibles, setSaboresDisponibles] = useState([]);
  const [loadingSabores, setLoadingSabores] = useState(false);
  const [seleccionSabores, setSeleccionSabores] = useState(false);
  const [productoEditandoNotas, setProductoEditandoNotas] = useState(null);
  const [mostrarSeleccionCantidad, setMostrarSeleccionCantidad] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  
  // Nuevos estados para tamaños
  const [saborSeleccionado, setSaborSeleccionado] = useState(null);
  const [tamanosDisponibles, setTamanosDisponibles] = useState([]);
  const [loadingTamanos, setLoadingTamanos] = useState(false);
  const [seleccionTamano, setSeleccionTamano] = useState(false);
  
  // Nuevos estados para ingredientes extra
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [loadingIngredientes, setLoadingIngredientes] = useState(false);
  const [seleccionIngrediente, setSeleccionIngrediente] = useState(false);

  // Nuevo estado para mostrar el selector de sentencias
  const [mostrarSelectorSentencias, setMostrarSelectorSentencias] = useState(false);

  useEffect(() => {
    cargarProductos();
    cargarOrdenInfo();
  }, []);

  const cargarOrdenInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${orden_id}/resumen`);
      const data = await res.json();
      if (res.ok) {
        setOrdenInfo(data);
      }
    } catch (error) {
      console.error("Error al cargar información de la orden:", error);
    }
  };

  useEffect(() => {
    if (productoSeleccionado) {
      setMostrarSeleccionCantidad(true);
      setCantidad(1);
    } else {
      setSaboresDisponibles([]);
      setTamanosDisponibles([]);
    }
  }, [productoSeleccionado]);

  const cargarProductos = async () => {
    setLoading(true);
    setError("");
    
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
      
      // Extraer categorías únicas
      const cats = ["todas", ...new Set(productosConPrecioNumerico.map(p => p.categoria))];
      setCategorias(cats);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los productos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const cargarSabores = async (productoId) => {
    
    setLoadingSabores(true);
    try {
      // Conseguir sabores con nuevo parámetro tipo=sabor
      console.log("Cargando sabores para producto:", productoId);
      const res = await fetch(`${API_URL}/products/sabores/producto/${productoId}?tipo=sabor_comida`);
      const data = await res.json();
      
      console.log("Sabores obtenidos:", data);
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar sabores");
      }
      
      // Confiamos en el backend para filtrar correctamente
      setSaboresDisponibles(data);
      setLoadingSabores(false);
      
      // Si no hay sabores disponibles, devolvemos false
      if (data.length === 0) {
        return false;
      }
      
      return data.length > 0;
    } catch (error) {
      console.error("Error cargando sabores:", error);
      setLoadingSabores(false);
      return false;
    }
  };
  
  const cargarTamanos = async (productoId) => {
    setLoadingTamanos(true);
    try {
      // Conseguir tamaños con nuevo parámetro tipo=tamano
      console.log("Cargando tamaños para producto:", productoId);
      const res = await fetch(`${API_URL}/products/sabores/producto/${productoId}?tipo=tamano`);
      const data = await res.json();
      
      console.log("Tamaños obtenidos:", data);
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar tamaños");
      }
      

      // Si no hay tamaños disponibles, devolvemos false
      if (data.length === 0) {
        return false;
      }

      // Filtrar tamaños según la categoría del producto si es pulque
      const producto = productos.find(p => p.id === parseInt(productoId));
      let tamanosAplicables = data;
      
      if (producto && producto.categoria === "Pulque") {
        // Para cada categoría, mostrar solo los tamaños aplicables
        const categoriaEnNombre = producto.nombre.toLowerCase();
        
        tamanosAplicables = data.filter(t => {
          const nombreTamano = t.nombre.toLowerCase();
          // Mostrar "Medio litro" para todos, y los tamaños específicos para cada categoría
          return nombreTamano === "medio litro" || 
                 (nombreTamano.includes("litro") && nombreTamano.includes(categoriaEnNombre.split(' ')[0]));
        });
      }
      
      console.log("Tamaños filtrados:", tamanosAplicables);
      setTamanosDisponibles(tamanosAplicables);
      setLoadingTamanos(false);
      return tamanosAplicables.length > 0;
    } catch (error) {
      console.error("Error cargando tamaños:", error);
      setLoadingTamanos(false);
      return false;
    }
  };

  // Nueva función para cargar ingredientes extra
  const cargarIngredientes = async (productoId) => {
    setLoadingIngredientes(true);
    try {
      console.log("Cargando ingredientes para producto:", productoId);
      const res = await fetch(`${API_URL}/products/sabores/producto/${productoId}?tipo=ingrediente_extra`);
      const data = await res.json();
      
      console.log("Ingredientes obtenidos:", data);
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar ingredientes");
      }
      

      // Si no hay ingredientes disponibles, devolvemos false
      if (data.length === 0) {
        return false;
      }

      setIngredientesDisponibles(data);
      setLoadingIngredientes(false);
      return data.length > 0;
    } catch (error) {
      console.error("Error cargando ingredientes:", error);
      setLoadingIngredientes(false);
      return false;
    }
  };

  const productosFiltrados = () => {
    let result = [...productos];
    
    // Filtrar por categoría
    if (categoriaSeleccionada !== "todas") {
      result = result.filter(p => p.categoria === categoriaSeleccionada);
    }
    
    // Filtrar por búsqueda
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase().trim();
      result = result.filter(p => 
        p.nombre.toLowerCase().includes(terminoBusqueda) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(terminoBusqueda))
      );
    }
    
    return result;
  };

  // Función para manejar la selección de un producto
  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setCantidad(1);
    setNotas("");
    setSaborSeleccionado(null);
  };

  // Función para continuar después de seleccionar la cantidad
  const continuar = async () => {
    console.log("Continuar");
    if (!productoSeleccionado) return;

    // Verificamos secuencialmente qué opciones tiene el producto
    const tieneSabores = await cargarSabores(productoSeleccionado.id);
    if (tieneSabores) {
      // Si tiene sabores, mostrar pantalla de selección de sabores
      setSeleccionSabores(true);
      setSeleccionTamano(false);
      setSeleccionIngrediente(false);
      setMostrarSeleccionCantidad(false);
    } else {
      // Si no tiene sabores, verificar si tiene tamaños
      const tieneTamanos = await cargarTamanos(productoSeleccionado.id);
      if (tieneTamanos) {
        setSeleccionTamano(true);
        setSeleccionSabores(false);
        setSeleccionIngrediente(false);
        setMostrarSeleccionCantidad(false);
      } else {
        // Si no tiene tamaños, verificar si tiene ingredientes
        const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
        if (tieneIngredientes) {
          setSeleccionIngrediente(true);
          setSeleccionSabores(false);
          setSeleccionTamano(false);
          setMostrarSeleccionCantidad(false);
        } else {
          // Si no tiene ninguna opción, ir directamente a notas
          mostrarPantallaNotas(productoSeleccionado, null);
          setMostrarSeleccionCantidad(false);
        }
      }
    }
  };

  // Modificar la función seleccionarSabor para manejar productos de sentencias
  const seleccionarSabor = async (sabor) => {
    // Si el producto seleccionado es parte de una sentencia, usar lógica específica
    if (productoSeleccionado && productoSeleccionado.es_parte_sentencia) {
      seleccionarSaborSentencia(sabor, productoSeleccionado);
      return;
    }

    // Lógica original para productos normales
    setSaborSeleccionado(sabor);
    console.log("Sabor seleccionado:", sabor);
    
    // Primero verificamos si hay tamaños disponibles
    const tieneTamanos = await cargarTamanos(productoSeleccionado.id);
    
    if (tieneTamanos) {
        setSeleccionTamano(true);
        setSeleccionIngrediente(false);
        setSeleccionSabores(false);
        return;
    }
    
    // Si no hay tamaños, verificamos si hay ingredientes
    const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
    
    if (tieneIngredientes) {
        setSeleccionIngrediente(true);
        setSeleccionTamano(false);
        setSeleccionSabores(false);
        return;
    }
    
    // Si no hay ni tamaños ni ingredientes, vamos directamente a notas
    mostrarPantallaNotas(productoSeleccionado, sabor);
    setSeleccionSabores(false);
  };

  // Función para manejar selección de tamaño
  const seleccionarTamano = (tamano) => {
    // Combinamos el producto con sabor y tamaño, y vamos a notas
    const datosCombinados = {
      ...saborSeleccionado,
      tamano_id: tamano.id,
      tamano_nombre: tamano.nombre,
      tamano_precio: parseFloat(tamano.precio_adicional || 0)
    };
    
    mostrarPantallaNotas(productoSeleccionado, datosCombinados);
    setSeleccionTamano(false);
  };

  // Función para manejar selección de ingrediente extra
  const seleccionarIngrediente = (ingrediente) => {
    // Si el ingrediente es nulo, significa "Sin ingrediente extra"
    if (!ingrediente) {
      // Pasamos directamente a notas con el sabor seleccionado pero sin ingrediente
      mostrarPantallaNotas(productoSeleccionado, {
        ...saborSeleccionado,
        ingrediente_id: null,
        ingrediente_nombre: null,
        ingrediente_precio: 0
      });
    } else {
      // Combinamos el producto con sabor e ingrediente, y vamos a notas
      const datosCombinados = {
        ...saborSeleccionado,
        ingrediente_id: ingrediente.id,
        ingrediente_nombre: ingrediente.nombre,
        ingrediente_precio: parseFloat(ingrediente.precio_adicional || 0)
      };
      
      mostrarPantallaNotas(productoSeleccionado, datosCombinados);
    }
    
    setSeleccionIngrediente(false);
  };

  // Función para mostrar la pantalla de notas con todas las selecciones
  const mostrarPantallaNotas = (producto, opcion) => {
    if (!producto) return;
    
    if (opcion && opcion.tamano_id) {
      // Si tenemos sabor y tamaño
      setProductoEditandoNotas({
        ...producto,
        sabor_id: opcion.id,
        sabor_nombre: opcion.nombre,
        sabor_categoria: opcion.categoria_nombre,
        precio_adicional: parseFloat(opcion.precio_adicional || 0),
        tamano_id: opcion.tamano_id,
        tamano_nombre: opcion.tamano_nombre,
        tamano_precio: opcion.tamano_precio,
        ingrediente_id: opcion.ingrediente_id || null,
        ingrediente_nombre: opcion.ingrediente_nombre || null,
        ingrediente_precio: opcion.ingrediente_precio || 0
      });
    } else if (opcion && opcion.ingrediente_id) {
      // Si tenemos sabor e ingrediente extra
      setProductoEditandoNotas({
        ...producto,
        sabor_id: opcion.id,
        sabor_nombre: opcion.nombre,
        sabor_categoria: opcion.categoria_nombre,
        precio_adicional: parseFloat(opcion.precio_adicional || 0),
        ingrediente_id: opcion.ingrediente_id,
        ingrediente_nombre: opcion.ingrediente_nombre,
        ingrediente_precio: opcion.ingrediente_precio
      });
    } else if (opcion) {
      // Solo sabor
      setProductoEditandoNotas({
        ...producto,
        sabor_id: opcion.id,
        sabor_nombre: opcion.nombre,
        sabor_categoria: opcion.categoria_nombre,
        precio_adicional: parseFloat(opcion.precio_adicional || 0),
        ingrediente_id: null,
        ingrediente_nombre: null,
        ingrediente_precio: 0
      });
    } else {
      // Sin opciones adicionales
      setProductoEditandoNotas({
        ...producto,
        sabor_id: null,
        sabor_nombre: null,
        sabor_categoria: null,
        precio_adicional: 0,
        ingrediente_id: null,
        ingrediente_nombre: null,
        ingrediente_precio: 0
      });
    }
    
    setNotas("");
  };

  // Función para cancelar y volver a la pantalla anterior
  const cancelarEditarNotas = async () => {
    setProductoEditandoNotas(null);
    setNotas("");
    
    // Verificamos secuencialmente qué opciones tiene el producto, en orden inverso
    const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
    if (tieneIngredientes) {
      setSeleccionIngrediente(true);
      setSeleccionTamano(false);
      setSeleccionSabores(false);
      return;
    }

    const tieneTamanos = await cargarTamanos(productoSeleccionado.id);
    if (tieneTamanos) {
      setSeleccionTamano(true);
      setSeleccionSabores(false);
      setSeleccionIngrediente(false);
      return;
    }

    const tieneSabores = await cargarSabores(productoSeleccionado.id);
    if (tieneSabores) {
      setSeleccionSabores(true);
      setSeleccionTamano(false);
      setSeleccionIngrediente(false);
      return;
    }

    // Si no tiene ninguna opción adicional, volvemos a la selección de cantidad
    setMostrarSeleccionCantidad(true);
    setSeleccionSabores(false);
    setSeleccionTamano(false);
    setSeleccionIngrediente(false);
  };

  const agregarProductoALista = () => {
    if (!productoEditandoNotas) return;
    
    const { 
      id, 
      sabor_id, 
      sabor_nombre, 
      sabor_categoria, 
      precio_adicional,
      tamano_id,
      tamano_nombre,
      tamano_precio,
      ingrediente_id,
      ingrediente_nombre,
      ingrediente_precio
    } = productoEditandoNotas;
    
    // Verificar si ya existe este producto con este sabor, tamaño, ingrediente y notas
    const yaExiste = productosSeleccionados.find(p => 
      p.id === id && 
      p.sabor_id === sabor_id && 
      p.tamano_id === tamano_id && 
      p.ingrediente_id === ingrediente_id &&
      ((p.notas || "") === (notas.trim() || ""))
    );
    
    if (yaExiste) {
      // Si ya existe, incrementar cantidad
      setProductosSeleccionados(prev => 
        prev.map(p => 
          p.id === id && 
          p.sabor_id === sabor_id && 
          p.tamano_id === tamano_id && 
          p.ingrediente_id === ingrediente_id &&
          ((p.notas || "") === (notas.trim() || ""))
            ? { ...p, cantidad: p.cantidad + cantidad } 
            : p
        )
      );
    } else {
      // Calcular precio total con adicionales
      let precioTotal = productoEditandoNotas.precio;
      
      if (precio_adicional) {
        precioTotal += precio_adicional;
      }
      
      if (tamano_precio) {
        precioTotal += tamano_precio;
      }
      
      if (ingrediente_precio) {
        precioTotal += ingrediente_precio;
      }
      
      // Agregar nuevo producto a la lista
      setProductosSeleccionados(prev => [
        ...prev, 
        { 
          ...productoEditandoNotas, 
          cantidad,
          precio_original: productoEditandoNotas.precio,
          precio: precioTotal,
          notas: notas.trim() || null
        }
      ]);
    }
    
    // Limpiar estados
    setProductoEditandoNotas(null);
    setProductoSeleccionado(null);
    setSaborSeleccionado(null);
    setNotas("");
    setCantidad(1);
  };

  const quitarProducto = (id, sabor_id, tamano_id, ingrediente_id, notas) => {
    setProductosSeleccionados(prev => 
      prev
      .map(p => (
        p.id === id && 
        p.sabor_id === sabor_id && 
        p.tamano_id === tamano_id &&
        p.ingrediente_id === ingrediente_id &&
        ((p.notas || "") === (notas || "")) 
          ? { ...p, cantidad: p.cantidad - 1 } 
          : p
      ))
      .filter(p => p.cantidad > 0)
    );
  };

  const aumentarCantidad = (id, sabor_id, tamano_id, ingrediente_id, notas) => {
    setProductosSeleccionados(prev =>
      prev.map(p => 
        p.id === id && 
        p.sabor_id === sabor_id && 
        p.tamano_id === tamano_id &&
        p.ingrediente_id === ingrediente_id &&
        ((p.notas || "") === (notas || ""))
          ? { ...p, cantidad: p.cantidad + 1 }
          : p
      )
    );
  };

  const agregarProducto = async () => {
    if (productosSeleccionados.length === 0) {
      alert("Agrega al menos un producto");
      return;
    }
    
    try {
      setEnviando(true);
      
      // Calcular el total incluyendo los costos adicionales de variantes
      const total = productosSeleccionados.reduce((sum, prod) => {
        return sum + (prod.precio * prod.cantidad);
      }, 0);
      
      console.log("Agregando productos a orden:", productosSeleccionados);
      
      const response = await fetch(`${API_URL}/orders/${orden_id}/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          empleado_id: getEmpleadoId(),
          productos: productosSeleccionados.map(p => {
            // Producto normal o de sentencia
            const productoData = {
              producto_id: p.esSentencia ? null : p.id, // null si es la sentencia principal
              cantidad: p.cantidad,
              precio_unitario: p.precio, // Precio del ítem (sentencia, componente o producto normal)
              sabor_id: p.sabor_id || null,
              tamano_id: p.tamano_id || null,
              ingrediente_id: p.ingrediente_id || null,
              notas: p.notas || null,
              
              // --- Campos específicos para Sentencias ---
              sentencia_id: p.sentencia_id || null, 
              es_sentencia_principal: p.esSentencia || false,
              es_parte_sentencia: p.es_parte_sentencia || false,
              nombre_sentencia: p.esSentencia ? p.nombre : null,
              descripcion_sentencia: p.esSentencia ? p.descripcion : null
            };
            
            console.log("Enviando producto:", productoData);
            return productoData;
          })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar productos');
      }

      const data = await response.json();
      alert("Productos agregados con éxito");
      window.location.href = `/ordenes/${orden_id}`;
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setEnviando(false);
    }
  };

  // Función para agregar productos de sentencias
  const agregarProductosDeSentencia = (producto) => {
    // Si recibimos un grupo de productos con variantes pendientes
    if (producto.tipo === "grupo_variantes_pendientes" && producto.productos) {
      console.log("Recibido grupo de productos con variantes pendientes:", producto);
      
      // Verificar cada producto pendiente
      producto.productos.forEach((prod, i) => {
        console.log(`Producto pendiente ${i}:`, prod);
        console.log(`  - requiere_sabor:`, prod.requiere_sabor);
        console.log(`  - requiere_tamano:`, prod.requiere_tamano);
        console.log(`  - requiere_ingrediente:`, prod.requiere_ingrediente);
        console.log(`  - sabor_id:`, prod.sabor_id);
        console.log(`  - tamano_id:`, prod.tamano_id);
        console.log(`  - ingrediente_id:`, prod.ingrediente_id);
      });
      
      // Iniciar el procesamiento del primer producto
      procesarProductoConVariantesPendientes(producto.productos, 0, producto.sentencia_id);
      return;
    }
    
    // Si es una sentencia principal (el producto con precio y nombre de la sentencia)
    if (producto.esSentencia) {
      // Verificar si ya existe esta sentencia
      const yaExiste = productosSeleccionados.find(p => 
        p.esSentencia && p.sentencia_id === producto.sentencia_id
      );
      
      if (yaExiste) {
        // Si ya existe, incrementar cantidad
        setProductosSeleccionados(prev => 
          prev.map(p => 
            p.esSentencia && p.sentencia_id === producto.sentencia_id
              ? { ...p, cantidad: p.cantidad + producto.cantidad } 
              : p
          )
        );
      } else {
        // Agregar la sentencia como un producto especial
        setProductosSeleccionados(prev => [
          ...prev, 
          { 
            ...producto,
            cantidad: producto.cantidad || 1
          }
        ]);
      }
      return;
    }
    
    // Si es un producto que forma parte de una sentencia
    if (producto.es_parte_sentencia) {
      // Verificar si ya existe este producto exacto
      const yaExiste = productosSeleccionados.find(p => 
        p.id === producto.id && 
        p.es_parte_sentencia &&
        p.sentencia_id === producto.sentencia_id &&
        p.sabor_id === producto.sabor_id && 
        p.tamano_id === producto.tamano_id && 
        p.ingrediente_id === producto.ingrediente_id &&
        ((p.notas || "") === (producto.notas || ""))
      );
      
      if (yaExiste) {
        // Si ya existe, incrementar cantidad
        setProductosSeleccionados(prev => 
          prev.map(p => 
            p.id === producto.id && 
            p.es_parte_sentencia &&
            p.sentencia_id === producto.sentencia_id &&
            p.sabor_id === producto.sabor_id && 
            p.tamano_id === producto.tamano_id && 
            p.ingrediente_id === producto.ingrediente_id &&
            ((p.notas || "") === (producto.notas || ""))
              ? { ...p, cantidad: p.cantidad + producto.cantidad } 
              : p
          )
        );
      } else {
        // Agregar producto de sentencia
        setProductosSeleccionados(prev => [
          ...prev, 
          { 
            ...producto,
            cantidad: producto.cantidad || 1
          }
        ]);
      }
      return;
    }
    
    // Para productos normales (no sentencias), usar el comportamiento existente
    // Verificar si ya existe este producto con este sabor, tamaño, ingrediente y notas
    const yaExiste = productosSeleccionados.find(p => 
      p.id === producto.id && 
      p.sabor_id === producto.sabor_id && 
      p.tamano_id === producto.tamano_id && 
      p.ingrediente_id === producto.ingrediente_id &&
      ((p.notas || "") === (producto.notas || ""))
    );
    
    if (yaExiste) {
      // Si ya existe, incrementar cantidad
      setProductosSeleccionados(prev => 
        prev.map(p => 
          p.id === producto.id && 
          p.sabor_id === producto.sabor_id && 
          p.tamano_id === producto.tamano_id && 
          p.ingrediente_id === producto.ingrediente_id &&
          ((p.notas || "") === (producto.notas || ""))
            ? { ...p, cantidad: p.cantidad + producto.cantidad } 
            : p
        )
      );
    } else {
      // Calcular precio total con adicionales
      let precioTotal = producto.precio;
      
      if (producto.precio_adicional) {
        precioTotal += producto.precio_adicional;
      }
      
      if (producto.tamano_precio) {
        precioTotal += producto.tamano_precio;
      }
      
      if (producto.ingrediente_precio) {
        precioTotal += producto.ingrediente_precio;
      }
      
      // Agregar nuevo producto a la lista
      setProductosSeleccionados(prev => [
        ...prev, 
        { 
          ...producto, 
          precio_original: producto.precio,
          precio: precioTotal
        }
      ]);
    }
  };

  // Nueva función para procesar secuencialmente productos con variantes pendientes
  const procesarProductoConVariantesPendientes = async (productos, indice, sentenciaId) => {
    // Si ya procesamos todos los productos, no hacemos nada
    if (indice >= productos.length) {
      console.log("Todos los productos con variantes pendientes han sido procesados");
      return;
    }
    
    const productoActual = productos[indice];
    console.log(`Procesando producto con variantes pendientes ${indice + 1} de ${productos.length}:`, productoActual);
    
    // Obtener el ID del producto correctamente según su origen
    const productoId = productoActual.producto_id || productoActual.id;
    if (!productoId) {
      console.error("Error: No se encontró ID de producto:", productoActual);
      // Continuar con el siguiente producto
      procesarProductoConVariantesPendientes(productos, indice + 1, sentenciaId);
      return;
    }
    
    // Asegurar que los precios estén en formato numérico
    const productoConPreciosNumericos = {
      ...productoActual,
      precio_adicional: parseFloat(productoActual.precio_adicional || 0),
      tamano_precio: parseFloat(productoActual.tamano_precio || 0),
      ingrediente_precio: parseFloat(productoActual.ingrediente_precio || 0)
    };
    
    // Establecer el producto seleccionado
    setProductoSeleccionado({
      ...productoConPreciosNumericos,
      id: productoId,
      nombre: productoActual.producto_nombre || productoActual.nombre,
      precio: 0, // El precio es 0 porque es parte de una sentencia
      categoria: productoActual.producto_categoria || productoActual.categoria,
      // Agregar metadatos para identificar que es parte de una sentencia
      es_parte_sentencia: true,
      sentencia_id: sentenciaId,
      // Para continuar el procesamiento después de seleccionar variantes
      indice_procesamiento: indice,
      productos_pendientes: productos
    });
    
    console.log("Verificando variantes para:", productoConPreciosNumericos);
    
    // Determinar qué tipo de variante necesitamos seleccionar primero
    if (productoActual.sabor_id === null && productoActual.requiere_sabor) {
      console.log("El producto requiere selección de SABOR");
      // Necesita seleccionar sabor
      const tieneSabores = await cargarSabores(productoId);
      if (tieneSabores) {
        setSeleccionSabores(true);
        setMostrarSeleccionCantidad(false);
        return;
      } else {
        console.warn("No se pudieron cargar sabores para este producto");
      }
    }
    
    if (productoActual.tamano_id === null && productoActual.requiere_tamano) {
      console.log("El producto requiere selección de TAMAÑO");
      // Necesita seleccionar tamaño
      const tieneTamanos = await cargarTamanos(productoId);
      if (tieneTamanos) {
        setSeleccionTamano(true);
        setMostrarSeleccionCantidad(false);
        return;
      } else {
        console.warn("No se pudieron cargar tamaños para este producto");
      }
    }
    
    if (productoActual.ingrediente_id === null && productoActual.requiere_ingrediente) {
      console.log("El producto requiere selección de INGREDIENTE");
      // Necesita seleccionar ingrediente
      const tieneIngredientes = await cargarIngredientes(productoId);
      if (tieneIngredientes) {
        setSeleccionIngrediente(true);
        setMostrarSeleccionCantidad(false);
        return;
      } else {
        console.warn("No se pudieron cargar ingredientes para este producto");
      }
    }
    
    console.log("El producto no requiere selección de variantes o no se encontraron opciones");
    
    // Si llegamos aquí, no necesita selección de variantes o algo falló
    // En cualquier caso, pasamos al siguiente producto
    procesarProductoConVariantesPendientes(productos, indice + 1, sentenciaId);
  };

  // Modificar las funciones de selección para continuar procesando productos pendientes
  const seleccionarSaborSentencia = async (sabor, producto) => {
    // Guardar el sabor seleccionado con todos sus datos
    const saborCompletoParaEstado = { // Para el estado local y flujo de selección
      id: sabor.id,
      nombre: sabor.nombre,
      categoria_nombre: sabor.categoria_nombre,
      precio_adicional: parseFloat(sabor.precio_adicional || 0)
    };
    setSaborSeleccionado(saborCompletoParaEstado);
    
    // Preparar datos de variante para agregarProductoSentenciaConVariante
    const varianteParaAgregar = {
      sabor_id: sabor.id,
      sabor_nombre: sabor.nombre,
      sabor_categoria_nombre: sabor.categoria_nombre, // Corregido para pasar categoría
      sabor_precio_adicional: parseFloat(sabor.precio_adicional || 0)
    };

    // Verificar si hay tamaños para seleccionar
    if (producto.tamano_id === null && producto.requiere_tamano) {
      const tieneTamanos = await cargarTamanos(producto.id);
      if (tieneTamanos) {
        setSeleccionTamano(true);
        setSeleccionSabores(false);
        return;
      }
    }
    
    // Verificar si hay ingredientes para seleccionar
    if (producto.ingrediente_id === null && producto.requiere_ingrediente) {
      const tieneIngredientes = await cargarIngredientes(producto.id);
      if (tieneIngredientes) {
        setSeleccionIngrediente(true);
        setSeleccionSabores(false);
        return;
      }
    }
    
    // Si no hay más selecciones, agregar el producto con el sabor seleccionado
    agregarProductoSentenciaConVariante(producto, varianteParaAgregar);
    
    // Limpiar estados
    setSeleccionSabores(false);
    setSaborSeleccionado(null);
  };

  // Función para agregar un producto de sentencia con sus variantes seleccionadas
  const agregarProductoSentenciaConVariante = (producto, variantes) => {
    // Preservar el nombre original del producto y otros campos importantes
    const nombreOriginal = producto.producto_nombre || producto.nombre;
    const categoriaOriginal = producto.producto_categoria || producto.categoria;
    const idOriginal = producto.producto_id || producto.id;
    
    // Calcular precio total sumando los precios adicionales de las variantes
    let precioTotalDeVariantes = 0;
    
    if (variantes.sabor_precio_adicional) {
      precioTotalDeVariantes += parseFloat(variantes.sabor_precio_adicional);
    }
    if (variantes.tamano_precio_adicional) {
      precioTotalDeVariantes += parseFloat(variantes.tamano_precio_adicional);
    }
    if (variantes.ingrediente_precio_adicional) {
      precioTotalDeVariantes += parseFloat(variantes.ingrediente_precio_adicional);
    }
    
    // Asegurarnos de que todos los campos de las variantes estén presentes para la visualización y datos
    const variantesCompletasParaProducto = {
      // Campos de sabor
      sabor_id: variantes.sabor_id || null,
      sabor_nombre: variantes.sabor_nombre || null,
      sabor_categoria: variantes.sabor_categoria_nombre || null, // Usar el campo correcto
      precio_adicional: parseFloat(variantes.sabor_precio_adicional || 0), // Usado para mostrar precio del sabor
      
      // Campos de tamaño
      tamano_id: variantes.tamano_id || null,
      tamano_nombre: variantes.tamano_nombre || null,
      tamano_precio: parseFloat(variantes.tamano_precio_adicional || 0), // Usado para mostrar precio del tamaño
      
      // Campos de ingrediente
      ingrediente_id: variantes.ingrediente_id || null,
      ingrediente_nombre: variantes.ingrediente_nombre || null,
      ingrediente_precio: parseFloat(variantes.ingrediente_precio_adicional || 0) // Usado para mostrar precio del ingrediente
    };
    
    // Crear un objeto con todas las propiedades necesarias
    const productoCompleto = {
      id: idOriginal,
      nombre: nombreOriginal,
      categoria: categoriaOriginal,
      precio: 0, // Precio base 0 por ser parte de la sentencia
      precio_original: producto.precio_original || 0,
      es_parte_sentencia: true,
      sentencia_id: producto.sentencia_id,
      cantidad: producto.cantidad || 1,
      // Incluir variantes seleccionadas
      ...variantesCompletasParaProducto,
      // Si hay más campos específicos de producto.productos_pendientes[indice], los incluiríamos aquí
    };
    
    // Si este producto es parte de un procesamiento secuencial
    if (producto.indice_procesamiento !== undefined && producto.productos_pendientes) {
      // Agregar el producto actual a la lista
      agregarProductosDeSentencia(productoCompleto);
      
      // Continuar con el siguiente producto en la secuencia
      procesarProductoConVariantesPendientes(
        producto.productos_pendientes,
        producto.indice_procesamiento + 1,
        producto.sentencia_id
      );
    } else {
      // Si no es parte de un procesamiento secuencial, simplemente agregarlo
      agregarProductosDeSentencia(productoCompleto);
    }
    
    // Limpiar estados
    setProductoSeleccionado(null);
    setSaborSeleccionado(null);
  };

  if (loading) {
    return <p className="text-center text-gray-400">Cargando productos...</p>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={cargarProductos}
          className="mt-4 bg-vino px-4 py-2 rounded"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Mostrar selector de sentencias si está activo
  if (mostrarSelectorSentencias) {
    return (
      <SentenciaSelector 
        onAddProducts={agregarProductosDeSentencia} 
        onClose={() => setMostrarSelectorSentencias(false)}
      />
    );
  }

  if (mostrarSeleccionCantidad && productoSeleccionado) {
    return (
      <div className="bg-vino rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{productoSeleccionado.nombre}</h2>
          <button 
            onClick={() => {
              setProductoSeleccionado(null);
              setCantidad(1);
              setNotas("");
              setSeleccionSabores(false);
              setProductoEditandoNotas(null);
              setMostrarSeleccionCantidad(false);
              setSeleccionTamano(false);
              setSeleccionIngrediente(false);
              setSaborSeleccionado(null);
            }}
            className="text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <p className="text-sm">{productoSeleccionado.descripcion}</p>
        <p className="text-amarillo font-bold">${productoSeleccionado.precio.toFixed(2)}</p>
        
        <div>
          <label className="block mb-2 font-bold">Cantidad:</label>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 bg-negro rounded p-2 w-full">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setCantidad(prev => Math.max(1, prev - 1));
                }}
                className="bg-vino px-3 py-1 rounded-full font-bold"
              >
                -
              </button>
              <span className="flex-1 text-center text-xl font-bold">{cantidad}</span>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setCantidad(prev => prev + 1);
                }}
                className="bg-vino px-3 py-1 rounded-full font-bold"
              >
                +
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num}
                  onClick={(e) => {
                    e.preventDefault();
                    setCantidad(num);
                  }}
                  className={`p-2 rounded-lg font-bold ${
                    cantidad === num 
                      ? 'bg-amarillo text-negro' 
                      : 'bg-negro hover:bg-negro/80'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <button
          onClick={continuar}
          className="w-full bg-amarillo text-negro py-3 rounded-full font-bold hover:bg-yellow-500"
        >
          Continuar
        </button>
      </div>
    );
  }

  if (seleccionSabores && saboresDisponibles.length > 0) {
    return (
      <div className="bg-vino rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Selecciona un sabor para {productoSeleccionado.nombre} ({cantidad})</h2>
          <button 
            onClick={() => {
              setSeleccionSabores(false);
              setMostrarSeleccionCantidad(true);
              setSaborSeleccionado(null);
            }}
            className="text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {loadingSabores ? (
          <p className="text-center py-4">Cargando sabores disponibles...</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {saboresDisponibles.map(sabor => (
              <button
                key={sabor.id}
                onClick={(e) => {
                  e.preventDefault();
                  seleccionarSabor(sabor);
                }}
                className="bg-negro p-3 rounded text-left hover:bg-gray-800 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{sabor.nombre}</p>
                  {sabor.categoria_nombre && (
                    <p className="text-xs text-gray-400">{sabor.categoria_nombre}</p>
                  )}
                </div>
                {sabor.precio_adicional > 0 && (
                  <span className="bg-amarillo text-negro px-2 py-1 rounded-full text-xs font-bold">
                    +${sabor.precio_adicional}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (seleccionTamano && tamanosDisponibles.length > 0) {
    return (
      <div className="bg-vino rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Selecciona un tamaño para {productoSeleccionado.nombre} 
            {saborSeleccionado ? ` (${saborSeleccionado.nombre})` : ''}
          </h2>
          <button 
            onClick={() => {
              setSeleccionTamano(false);
              setSeleccionSabores(true);
              setSaborSeleccionado(null);
            }}
            className="text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {loadingTamanos ? (
          <p className="text-center py-4">Cargando tamaños disponibles...</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {tamanosDisponibles.map(tamano => (
              <button
                key={tamano.id}
                onClick={(e) => {
                  e.preventDefault();
                  seleccionarTamano(tamano);
                }}
                className="bg-negro p-3 rounded text-left hover:bg-gray-800 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{tamano.nombre}</p>
                  {tamano.descripcion && (
                    <p className="text-xs text-gray-400">{tamano.descripcion}</p>
                  )}
                </div>
                {tamano.precio_adicional > 0 && (
                  <span className="bg-amarillo text-negro px-2 py-1 rounded-full text-xs font-bold">
                    +${tamano.precio_adicional}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (seleccionIngrediente) {
    console.log("Hola");
    return (
      <div className="bg-vino rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Ingrediente extra para {productoSeleccionado.nombre} 
            {saborSeleccionado ? ` (${saborSeleccionado.nombre})` : ''}
          </h2>
          <button 
            onClick={() => {
              setSeleccionIngrediente(false);
              setSeleccionSabores(true);
              setSaborSeleccionado(null);
            }}
            className="text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {loadingIngredientes ? (
          <p className="text-center py-4">Cargando ingredientes disponibles...</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {/* Opción para no agregar ingrediente extra */}
            <button
              onClick={(e) => {
                e.preventDefault();
                seleccionarIngrediente(null);
              }}
              className="bg-negro p-3 rounded text-left hover:bg-gray-800 flex justify-between items-center"
            >
              <div>
                <p className="font-bold">Sin ingrediente extra</p>
                <p className="text-xs text-gray-400">Continuar sin añadir ingrediente</p>
              </div>
            </button>
            
            {/* Lista de ingredientes disponibles */}
            {ingredientesDisponibles.map(ingrediente => (
              <button
                key={ingrediente.id}
                onClick={(e) => {
                  e.preventDefault();
                  seleccionarIngrediente(ingrediente);
                }}
                className="bg-negro p-3 rounded text-left hover:bg-gray-800 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{ingrediente.nombre}</p>
                  {ingrediente.categoria_nombre && (
                    <p className="text-xs text-gray-400">{ingrediente.categoria_nombre}</p>
                  )}
                </div>
                {ingrediente.precio_adicional > 0 && (
                  <span className="bg-amarillo text-negro px-2 py-1 rounded-full text-xs font-bold">
                    +${ingrediente.precio_adicional}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (productoEditandoNotas) {
    return (
      <div className="bg-vino rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{productoEditandoNotas.nombre} ({cantidad})</h2>
          <button 
            onClick={cancelarEditarNotas}
            className="text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {productoEditandoNotas.sabor_id && (
          <div className="bg-negro/30 p-3 rounded">
            <p className="font-bold">Sabor seleccionado:</p>
            <p>{productoEditandoNotas.sabor_nombre} 
              {productoEditandoNotas.sabor_categoria ? ` (${productoEditandoNotas.sabor_categoria})` : ''}
            </p>
            {productoEditandoNotas.precio_adicional > 0 && (
              <p className="text-xs text-amarillo mt-1">
                Precio adicional: +${productoEditandoNotas.precio_adicional}
              </p>
            )}
          </div>
        )}
        
        {productoEditandoNotas.tamano_id && (
          <div className="bg-negro/30 p-3 rounded mt-2">
            <p className="font-bold">Tamaño seleccionado:</p>
            <p>{productoEditandoNotas.tamano_nombre}</p>
            {productoEditandoNotas.tamano_precio > 0 && (
              <p className="text-xs text-amarillo mt-1">
                Precio adicional: +${productoEditandoNotas.tamano_precio}
              </p>
            )}
          </div>
        )}
        
        {productoEditandoNotas.ingrediente_id && (
          <div className="bg-negro/30 p-3 rounded mt-2">
            <p className="font-bold">Ingrediente extra:</p>
            <p>{productoEditandoNotas.ingrediente_nombre}</p>
            {productoEditandoNotas.ingrediente_precio > 0 && (
              <p className="text-xs text-amarillo mt-1">
                Precio adicional: +${productoEditandoNotas.ingrediente_precio}
              </p>
            )}
          </div>
        )}
        
        <div>
          <label className="block mb-2 font-bold">Notas especiales:</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Sin cebolla, extra queso, etc."
            className="w-full px-4 py-2 rounded bg-negro text-white placeholder:text-gray-400 border border-amarillo"
            rows={3}
          />
        </div>
        
        <button
          onClick={agregarProductoALista}
          className="w-full bg-amarillo text-negro py-3 rounded font-bold"
        >
          Agregar a la Orden
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {productosSeleccionados.length > 0 && (
        <div className="bg-negro rounded p-4 space-y-3">
          <h3 className="font-bold text-amarillo">Productos seleccionados</h3>
          {productosSeleccionados.map((prod, index) => (
            <div key={index} className="flex justify-between items-start border-b border-gray-700 pb-2">
              <div className="flex-1">
                <p className="font-bold">{prod.nombre}</p>
                {prod.esSentencia && (
                  <p className="text-xs text-amarillo font-normal">(Sentencia)</p>
                )}
                {prod.es_parte_sentencia && (
                  <p className="text-xs text-amarillo font-normal">(Parte de sentencia)</p>
                )}
                
                {/* Mostrar sabor si existe */}
                {prod.sabor_nombre && (
                  <div className="flex justify-between mt-1">
                    <span>Sabor: {prod.sabor_nombre} {prod.sabor_categoria ? `(${prod.sabor_categoria})` : ''}</span>
                    {parseFloat(prod.precio_adicional) > 0 && (
                      <span className="text-amarillo">+${parseFloat(prod.precio_adicional).toFixed(2)}</span>
                    )}
                  </div>
                )}
                
                {/* Mostrar tamaño si existe */}
                {prod.tamano_nombre && (
                  <div className="flex justify-between mt-1">
                    <span>Tamaño: {prod.tamano_nombre}</span>
                    {parseFloat(prod.tamano_precio) > 0 && (
                      <span className="text-amarillo">+${parseFloat(prod.tamano_precio).toFixed(2)}</span>
                    )}
                  </div>
                )}
                
                {/* Mostrar ingrediente si existe */}
                {prod.ingrediente_nombre && (
                  <div className="flex justify-between mt-1">
                    <span>Ingrediente: {prod.ingrediente_nombre}</span>
                    {parseFloat(prod.ingrediente_precio) > 0 && (
                      <span className="text-amarillo">+${parseFloat(prod.ingrediente_precio).toFixed(2)}</span>
                    )}
                  </div>
                )}
                
                {/* Mostrar notas si existen */}
                {prod.notas && (
                  <div className="mt-2 italic">"{prod.notas}"</div>
                )}
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  {/* Botones para modificar cantidad */}
                  {!prod.es_parte_sentencia && (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          quitarProducto(prod.id, prod.sabor_id, prod.tamano_id, prod.ingrediente_id, prod.notas);
                        }}
                        className="bg-vino px-2 rounded-full"
                      >
                        -
                      </button>
                      <span className="font-bold">{prod.cantidad}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          aumentarCantidad(prod.id, prod.sabor_id, prod.tamano_id, prod.ingrediente_id, prod.notas);
                        }}
                        className="bg-vino px-2 rounded-full"
                      >
                        +
                      </button>
                    </>
                  )}
                  {prod.es_parte_sentencia && (
                    <span className="font-bold">{prod.cantidad}x</span>
                  )}
                </div>
                
                {/* Mostrar precio */}
                <div className="text-sm">
                  {!prod.es_parte_sentencia && (
                    <>${(prod.precio * prod.cantidad).toFixed(2)}</>
                  )}
                  {prod.es_parte_sentencia && prod.precio > 0 && (
                    <>+${parseFloat(prod.precio).toFixed(2)}</>
                  )}
                </div>
              </div>
            </div>
          ))}
          <p className="font-bold text-right text-lg mt-4">
            Total: ${productosSeleccionados
              .reduce((total, p) => {
                if (p.es_parte_sentencia && !p.esSentencia) {
                  // Para productos de sentencia, solo sumamos los costos adicionales
                  return total + (p.precio * p.cantidad);
                } else {
                  // Para productos normales o sentencias principales, sumamos el precio completo
                  return total + (p.precio * p.cantidad);
                }
              }, 0)
              .toFixed(2)}
          </p>
          <button
            onClick={agregarProducto}
            disabled={enviando}
            className={`w-full bg-amarillo text-negro p-3 rounded font-bold ${
              enviando ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-500"
            } mt-4`}
          >
            {enviando ? "Agregando..." : "Confirmar y Agregar a la Orden"}
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-amarillo font-bold">#{orden_id}</span>
          <h2 className="text-lg font-bold text-amarillo">
            {ordenInfo ? `${ordenInfo.cliente} - Seleccionar productos` : "Seleccionar productos"}
          </h2>
        </div>
        
        {/* Botón para mostrar el selector de sentencias */}
        <button
          onClick={() => setMostrarSelectorSentencias(true)}
          className="bg-amarillo text-negro px-4 py-2 rounded font-bold hover:bg-yellow-500"
        >
          Agregar Sentencia
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-4 py-3 pl-10 rounded-full bg-vino/70 text-white placeholder:text-gray-300"
        />
        <span className="absolute left-3 top-3">🔍</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaSeleccionada(cat)}
            className={`py-1 px-3 rounded-full text-sm font-bold ${
              categoriaSeleccionada === cat ? "bg-amarillo text-negro" : "bg-vino text-white"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {productosFiltrados().length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            No se encontraron productos
          </p>
        ) : (
          productosFiltrados().map((producto) => (
            <div
              key={producto.id}
              onClick={(e) => {
                e.preventDefault();
                seleccionarProducto(producto);
              }}
              className="bg-vino/80 rounded-xl p-3 cursor-pointer hover:bg-vino transition"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold">{producto.nombre}</h3>
                <p className="text-amarillo font-bold">${parseFloat(producto.precio).toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      <a 
        href={`/ordenes/${orden_id}`}
        className="block bg-vino text-white text-center py-3 px-6 rounded-full font-bold"
      >
        Volver a la Orden
      </a>
    </div>
  );
} 