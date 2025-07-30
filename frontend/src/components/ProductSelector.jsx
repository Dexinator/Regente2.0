import { useState, useEffect, useRef } from "react";
import { API_URL } from "../utils/api.js";
import SentenciaSelector from "./SentenciaSelector";

export default function ProductSelector({ 
  onProductsSelected,
  onClose,
  initialProducts = [],
  showCustomerName = false,
  customerName = "",
  orderId = null
}) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");
  
  // Estados para sabores
  const [saboresDisponibles, setSaboresDisponibles] = useState([]);
  const [loadingSabores, setLoadingSabores] = useState(false);
  const [seleccionSabores, setSeleccionSabores] = useState(false);
  const [productoEditandoNotas, setProductoEditandoNotas] = useState(null);
  const [mostrarSeleccionCantidad, setMostrarSeleccionCantidad] = useState(false);
  const [productosSeleccionados, setProductosSeleccionados] = useState(initialProducts);
  const [esParaLlevar, setEsParaLlevar] = useState(false);
  
  // Estados para tamaños
  const [saborSeleccionado, setSaborSeleccionado] = useState(null);
  const [tamanosDisponibles, setTamanosDisponibles] = useState([]);
  const [loadingTamanos, setLoadingTamanos] = useState(false);
  const [seleccionTamano, setSeleccionTamano] = useState(false);
  const [tamanoSeleccionado, setTamanoSeleccionado] = useState(null);
  
  // Estados para ingredientes extra
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
  const [loadingIngredientes, setLoadingIngredientes] = useState(false);
  const [seleccionIngrediente, setSeleccionIngrediente] = useState(false);
  const [quiereIngredienteExtra, setQuiereIngredienteExtra] = useState(false);
  const [tieneIngredientesDisponibles, setTieneIngredientesDisponibles] = useState(false);

  // Estado para mostrar el selector de sentencias
  const [mostrarSelectorSentencias, setMostrarSelectorSentencias] = useState(false);

  // Referencias para los contenedores scrollables
  const saboresScrollRef = useRef(null);
  const tamanosScrollRef = useRef(null);
  const ingredientesScrollRef = useRef(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (productoSeleccionado) {
      setMostrarSeleccionCantidad(true);
      setCantidad(1);
    } else {
      setSaboresDisponibles([]);
      setTamanosDisponibles([]);
      setIngredientesDisponibles([]);
    }
  }, [productoSeleccionado]);

  // Resetear scroll cuando aparecen los modales
  useEffect(() => {
    if (seleccionSabores && saboresScrollRef.current) {
      saboresScrollRef.current.scrollTop = 0;
    }
  }, [seleccionSabores]);

  useEffect(() => {
    if (seleccionTamano && tamanosScrollRef.current) {
      tamanosScrollRef.current.scrollTop = 0;
    }
  }, [seleccionTamano]);

  useEffect(() => {
    if (seleccionIngrediente && ingredientesScrollRef.current) {
      ingredientesScrollRef.current.scrollTop = 0;
    }
  }, [seleccionIngrediente]);

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
      console.log("Cargando sabores para producto:", productoId);
      const res = await fetch(`${API_URL}/products/sabores/producto/${productoId}?tipo=sabor_comida`);
      const data = await res.json();
      
      console.log("Sabores obtenidos:", data);
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar sabores");
      }
      
      // Ordenar sabores por precio ascendente (más baratos primero, más caros al final)
      const saboresOrdenados = data.sort((a, b) => 
        (parseFloat(a.precio_adicional) || 0) - (parseFloat(b.precio_adicional) || 0)
      );
      setSaboresDisponibles(saboresOrdenados);
      setLoadingSabores(false);
      return saboresOrdenados.length > 0;
    } catch (error) {
      console.error("Error cargando sabores:", error);
      setLoadingSabores(false);
      return false;
    }
  };
  
  const cargarTamanos = async (productoId) => {
    setLoadingTamanos(true);
    try {
      console.log("Cargando tamaños para producto:", productoId);
      const res = await fetch(`${API_URL}/products/sabores/producto/${productoId}?tipo=tamano`);
      const data = await res.json();
      
      console.log("Tamaños obtenidos:", data);
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar tamaños");
      }
      
      // Filtrar tamaños según la categoría del producto si es pulque
      const producto = productos.find(p => p.id === parseInt(productoId));
      let tamanosAplicables = data;
      
      if (producto && producto.categoria === "Pulque") {
        const categoriaEnNombre = producto.nombre.toLowerCase();
        
        tamanosAplicables = data.filter(t => {
          const nombreTamano = t.nombre.toLowerCase();
          return nombreTamano === "medio litro" || 
                 (nombreTamano.includes("litro") && nombreTamano.includes(categoriaEnNombre.split(' ')[0]));
        });
      }
      
      console.log("Tamaños filtrados:", tamanosAplicables);
      // Ordenar tamaños por precio ascendente (más baratos primero, más caros al final)
      const tamanosOrdenados = tamanosAplicables.sort((a, b) => 
        (parseFloat(a.precio_adicional) || 0) - (parseFloat(b.precio_adicional) || 0)
      );
      setTamanosDisponibles(tamanosOrdenados);
      setLoadingTamanos(false);
      return tamanosOrdenados.length > 0;
    } catch (error) {
      console.error("Error cargando tamaños:", error);
      setLoadingTamanos(false);
      return false;
    }
  };

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
      
      // Ordenar ingredientes por precio ascendente (más baratos primero, más caros al final)
      const ingredientesOrdenados = data.sort((a, b) => 
        (parseFloat(a.precio_adicional) || 0) - (parseFloat(b.precio_adicional) || 0)
      );
      setIngredientesDisponibles(ingredientesOrdenados);
      setLoadingIngredientes(false);
      return ingredientesOrdenados.length > 0;
    } catch (error) {
      console.error("Error cargando ingredientes:", error);
      setLoadingIngredientes(false);
      return false;
    }
  };

  const productosFiltrados = () => {
    let result = [...productos];
    
    if (categoriaSeleccionada !== "todas") {
      result = result.filter(p => p.categoria === categoriaSeleccionada);
    }
    
    if (busqueda.trim()) {
      const terminoBusqueda = busqueda.toLowerCase().trim();
      result = result.filter(p => 
        p.nombre.toLowerCase().includes(terminoBusqueda) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(terminoBusqueda))
      );
    }
    
    return result;
  };

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setCantidad(1);
    setNotas("");
    setSaborSeleccionado(null);
  };

  const continuar = async () => {
    if (!productoSeleccionado) return;

    const tieneSabores = await cargarSabores(productoSeleccionado.id);
    if (tieneSabores) {
      setSeleccionSabores(true);
      setSeleccionTamano(false);
      setSeleccionIngrediente(false);
      setMostrarSeleccionCantidad(false);
    } else {
      const tieneTamanos = await cargarTamanos(productoSeleccionado.id);
      if (tieneTamanos) {
        setSeleccionTamano(true);
        setSeleccionSabores(false);
        setSeleccionIngrediente(false);
        setMostrarSeleccionCantidad(false);
      } else {
        // Verificar si tiene ingredientes disponibles pero no mostrar el modal aún
        const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
        setTieneIngredientesDisponibles(tieneIngredientes);
        mostrarPantallaNotas(productoSeleccionado, null);
        setMostrarSeleccionCantidad(false);
      }
    }
  };

  const seleccionarSabor = async (sabor) => {
    if (productoSeleccionado && productoSeleccionado.es_parte_sentencia) {
      seleccionarSaborSentencia(sabor, productoSeleccionado);
      return;
    }
    
    setSaborSeleccionado(sabor);
    
    const tieneTamanos = await cargarTamanos(productoSeleccionado.id);
    
    if (tieneTamanos) {
      setSeleccionTamano(true);
      setSeleccionIngrediente(false);
      setSeleccionSabores(false);
      return;
    }
    
    // Verificar si tiene ingredientes disponibles pero no mostrar el modal aún
    const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
    setTieneIngredientesDisponibles(tieneIngredientes);
    
    mostrarPantallaNotas(productoSeleccionado, sabor);
    setSeleccionSabores(false);
  };

  const seleccionarTamano = async (tamano) => {
    if (productoSeleccionado && productoSeleccionado.es_parte_sentencia) {
      const varianteParaAgregar = {
        sabor_id: saborSeleccionado?.id || null,
        sabor_nombre: saborSeleccionado?.nombre || null,
        sabor_categoria_nombre: saborSeleccionado?.categoria_nombre || null,
        sabor_precio_adicional: parseFloat(saborSeleccionado?.precio_adicional || 0),
        tamano_id: tamano.id,
        tamano_nombre: tamano.nombre,
        tamano_precio_adicional: parseFloat(tamano.precio_adicional || 0)
      };
      
      // Para sentencias, omitir ingredientes por defecto
      // if (productoSeleccionado.ingrediente_id === null && productoSeleccionado.requiere_ingrediente) {
      //   const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
      //   if (tieneIngredientes) {
      //     setSeleccionIngrediente(true);
      //     setSeleccionTamano(false);
      //     return;
      //   }
      // }
      
      agregarProductoSentenciaConVariante(productoSeleccionado, varianteParaAgregar);
      return;
    }
    
    const datosCombinados = {
      ...saborSeleccionado,
      tamano_id: tamano.id,
      tamano_nombre: tamano.nombre,
      tamano_precio: parseFloat(tamano.precio_adicional || 0)
    };
    
    // Verificar si tiene ingredientes disponibles pero no mostrar el modal aún
    const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
    setTieneIngredientesDisponibles(tieneIngredientes);
    
    // Guardar el tamaño seleccionado por si el usuario quiere ingrediente extra
    setTamanoSeleccionado({
      id: tamano.id,
      nombre: tamano.nombre,
      precio_adicional: parseFloat(tamano.precio_adicional || 0)
    });
    
    mostrarPantallaNotas(productoSeleccionado, datosCombinados);
    setSeleccionTamano(false);
  };

  const seleccionarIngrediente = (ingrediente) => {
    if (productoSeleccionado && productoSeleccionado.es_parte_sentencia) {
      const varianteParaAgregar = {
        sabor_id: saborSeleccionado?.id || null,
        sabor_nombre: saborSeleccionado?.nombre || null,
        sabor_categoria_nombre: saborSeleccionado?.categoria_nombre || null,
        sabor_precio_adicional: parseFloat(saborSeleccionado?.precio_adicional || 0),
        tamano_id: tamanoSeleccionado?.id || null,
        tamano_nombre: tamanoSeleccionado?.nombre || null,
        tamano_precio_adicional: parseFloat(tamanoSeleccionado?.precio_adicional || 0),
        ingrediente_id: ingrediente?.id || null,
        ingrediente_nombre: ingrediente?.nombre || null,
        ingrediente_precio_adicional: ingrediente ? parseFloat(ingrediente.precio_adicional || 0) : 0
      };
      
      agregarProductoSentenciaConVariante(productoSeleccionado, varianteParaAgregar);
      return;
    }
    
    const datosCombinados = tamanoSeleccionado ? {
      ...saborSeleccionado,
      tamano_id: tamanoSeleccionado.id,
      tamano_nombre: tamanoSeleccionado.nombre,
      tamano_precio: parseFloat(tamanoSeleccionado.precio_adicional || 0),
      ingrediente_id: ingrediente?.id || null,
      ingrediente_nombre: ingrediente?.nombre || null,
      ingrediente_precio: ingrediente ? parseFloat(ingrediente.precio_adicional || 0) : 0
    } : {
      ...saborSeleccionado,
      ingrediente_id: ingrediente?.id || null,
      ingrediente_nombre: ingrediente?.nombre || null,
      ingrediente_precio: ingrediente ? parseFloat(ingrediente.precio_adicional || 0) : 0
    };
    
    // No resetear quiereIngredienteExtra ya que el usuario explícitamente lo solicitó
    mostrarPantallaNotas(productoSeleccionado, datosCombinados);
    setSeleccionIngrediente(false);
  };

  const mostrarPantallaNotas = (producto, opcion) => {
    if (!producto) return;
    
    // Resetear el checkbox de ingrediente extra solo si no viene de selección de ingrediente
    if (!opcion || !opcion.hasOwnProperty('ingrediente_id')) {
      setQuiereIngredienteExtra(false);
    }
    
    if (opcion && opcion.tamano_id) {
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

  const cancelarEditarNotas = () => {
    setProductoEditandoNotas(null);
    setNotas("");
    setQuiereIngredienteExtra(false);
    setTieneIngredientesDisponibles(false);
    setProductoSeleccionado(null);
    setSaborSeleccionado(null);
    setTamanoSeleccionado(null);
    setCantidad(1);
    setEsParaLlevar(false);
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
    
    const yaExiste = productosSeleccionados.find(p => 
      p.id === id && 
      p.sabor_id === sabor_id && 
      p.tamano_id === tamano_id && 
      p.ingrediente_id === ingrediente_id &&
      ((p.notas || "") === (notas.trim() || ""))
    );
    
    if (yaExiste) {
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
      
      setProductosSeleccionados(prev => [
        ...prev, 
        { 
          ...productoEditandoNotas, 
          cantidad,
          precio_original: productoEditandoNotas.precio,
          precio: precioTotal,
          notas: notas.trim() || null,
          es_para_llevar: esParaLlevar
        }
      ]);
    }
    
    setProductoEditandoNotas(null);
    setProductoSeleccionado(null);
    setSaborSeleccionado(null);
    setNotas("");
    setCantidad(1);
    setEsParaLlevar(false);
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

  const eliminarSentenciaCompleta = (sentenciaId) => {
    if (!confirm("¿Deseas eliminar esta sentencia y todos sus productos?")) return;
    
    setProductosSeleccionados(prev => 
      prev.filter(p => p.sentencia_id !== sentenciaId)
    );
  };

  const handleConfirmarProductos = () => {
    if (productosSeleccionados.length === 0) {
      alert("Agrega al menos un producto");
      return;
    }
    
    onProductsSelected(productosSeleccionados);
  };

  // Funciones para manejo de sentencias
  const agregarProductosDeSentencia = (producto) => {
    if (producto.tipo === "grupo_variantes_pendientes" && producto.productos) {
      console.log("Recibido grupo de productos con variantes pendientes:", producto);
      setMostrarSelectorSentencias(false);
      procesarProductoConVariantesPendientes(producto.productos, 0, producto.sentencia_id);
      return;
    }
    
    if (producto.esSentencia) {
      const yaExiste = productosSeleccionados.find(p => 
        p.esSentencia && p.sentencia_id === producto.sentencia_id
      );
      
      if (yaExiste) {
        setProductosSeleccionados(prev => 
          prev.map(p => 
            p.esSentencia && p.sentencia_id === producto.sentencia_id
              ? { ...p, cantidad: p.cantidad + producto.cantidad } 
              : p
          )
        );
      } else {
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
    
    if (producto.es_parte_sentencia) {
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
    
    const yaExiste = productosSeleccionados.find(p => 
      p.id === producto.id && 
      p.sabor_id === producto.sabor_id && 
      p.tamano_id === producto.tamano_id && 
      p.ingrediente_id === producto.ingrediente_id &&
      ((p.notas || "") === (producto.notas || ""))
    );
    
    if (yaExiste) {
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

  const procesarProductoConVariantesPendientes = async (productos, indice, sentenciaId) => {
    if (indice >= productos.length) {
      console.log("Todos los productos con variantes pendientes han sido procesados");
      return;
    }
    
    const productoActual = productos[indice];
    console.log(`Procesando producto con variantes pendientes ${indice + 1} de ${productos.length}:`, productoActual);
    
    const productoId = productoActual.producto_id || productoActual.id;
    if (!productoId) {
      console.error("Error: No se encontró ID de producto:", productoActual);
      procesarProductoConVariantesPendientes(productos, indice + 1, sentenciaId);
      return;
    }
    
    const productoConPreciosNumericos = {
      ...productoActual,
      precio_adicional: parseFloat(productoActual.precio_adicional || 0),
      tamano_precio: parseFloat(productoActual.tamano_precio || 0),
      ingrediente_precio: parseFloat(productoActual.ingrediente_precio || 0)
    };
    
    setProductoSeleccionado({
      ...productoConPreciosNumericos,
      id: productoId,
      nombre: productoActual.producto_nombre || productoActual.nombre,
      precio: 0,
      categoria: productoActual.producto_categoria || productoActual.categoria,
      es_parte_sentencia: true,
      sentencia_id: sentenciaId,
      indice_procesamiento: indice,
      productos_pendientes: productos
    });
    
    console.log("Verificando variantes para:", productoConPreciosNumericos);
    
    if (productoActual.sabor_id === null && productoActual.requiere_sabor) {
      console.log("El producto requiere selección de SABOR");
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
      console.log("El producto permite ingredientes extra, pero se omitirán por defecto");
      // No mostrar el modal de ingredientes para sentencias
      // El ingrediente se quedará como null (sin ingrediente extra)
    }
    
    console.log("El producto no requiere selección de variantes o no se encontraron opciones");
    
    const productoFinal = {
      ...productoConPreciosNumericos,
      id: productoId,
      nombre: productoActual.producto_nombre || productoActual.nombre,
      categoria: productoActual.producto_categoria || productoActual.categoria,
      precio: 0,
      es_parte_sentencia: true,
      sentencia_id: sentenciaId,
      cantidad: productoActual.cantidad || 1
    };
    
    agregarProductosDeSentencia(productoFinal);
    procesarProductoConVariantesPendientes(productos, indice + 1, sentenciaId);
  };

  const seleccionarSaborSentencia = async (sabor, producto) => {
    const saborCompletoParaEstado = {
      id: sabor.id,
      nombre: sabor.nombre,
      categoria_nombre: sabor.categoria_nombre,
      precio_adicional: parseFloat(sabor.precio_adicional || 0)
    };
    setSaborSeleccionado(saborCompletoParaEstado);
    
    const varianteParaAgregar = {
      sabor_id: sabor.id,
      sabor_nombre: sabor.nombre,
      sabor_categoria_nombre: sabor.categoria_nombre,
      sabor_precio_adicional: parseFloat(sabor.precio_adicional || 0)
    };

    if (producto.tamano_id === null && producto.requiere_tamano) {
      const tieneTamanos = await cargarTamanos(producto.id);
      if (tieneTamanos) {
        setSeleccionTamano(true);
        setSeleccionSabores(false);
        return;
      }
    }
    
    // Para sentencias, omitir ingredientes por defecto
    // if (producto.ingrediente_id === null && producto.requiere_ingrediente) {
    //   const tieneIngredientes = await cargarIngredientes(producto.id);
    //   if (tieneIngredientes) {
    //     setSeleccionIngrediente(true);
    //     setSeleccionSabores(false);
    //     return;
    //   }
    // }
    
    agregarProductoSentenciaConVariante(producto, varianteParaAgregar);
    setSeleccionSabores(false);
    setSaborSeleccionado(null);
  };

  const agregarProductoSentenciaConVariante = (producto, variantes) => {
    const nombreOriginal = producto.producto_nombre || producto.nombre;
    const categoriaOriginal = producto.producto_categoria || producto.categoria;
    const idOriginal = producto.producto_id || producto.id;
    
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
    
    const variantesCompletasParaProducto = {
      sabor_id: variantes.sabor_id || null,
      sabor_nombre: variantes.sabor_nombre || null,
      sabor_categoria: variantes.sabor_categoria_nombre || null,
      precio_adicional: parseFloat(variantes.sabor_precio_adicional || 0),
      tamano_id: variantes.tamano_id || null,
      tamano_nombre: variantes.tamano_nombre || null,
      tamano_precio: parseFloat(variantes.tamano_precio_adicional || 0),
      ingrediente_id: variantes.ingrediente_id || null,
      ingrediente_nombre: variantes.ingrediente_nombre || null,
      ingrediente_precio: parseFloat(variantes.ingrediente_precio_adicional || 0)
    };
    
    const productoCompleto = {
      id: idOriginal,
      nombre: nombreOriginal,
      categoria: categoriaOriginal,
      precio: precioTotalDeVariantes,
      precio_original: producto.precio_original || 0,
      es_parte_sentencia: true,
      sentencia_id: producto.sentencia_id,
      cantidad: producto.cantidad || 1,
      ...variantesCompletasParaProducto
    };
    
    if (producto.indice_procesamiento !== undefined && producto.productos_pendientes) {
      agregarProductosDeSentencia(productoCompleto);
      
      setProductoSeleccionado(null);
      setSaborSeleccionado(null);
      setSeleccionSabores(false);
      setSeleccionTamano(false);
      setSeleccionIngrediente(false);
      
      procesarProductoConVariantesPendientes(
        producto.productos_pendientes,
        producto.indice_procesamiento + 1,
        producto.sentencia_id
      );
    } else {
      agregarProductosDeSentencia(productoCompleto);
      setProductoSeleccionado(null);
      setSaborSeleccionado(null);
    }
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

  // Modal de selección de cantidad
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

  // Modal de selección de sabores
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
          <div ref={saboresScrollRef} className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
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

  // Modal de selección de tamaños
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
          <div ref={tamanosScrollRef} className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
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

  // Modal de selección de ingredientes
  if (seleccionIngrediente) {
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
              // Volver al modal de notas sin ingrediente
              const datosCombinados = tamanoSeleccionado ? {
                ...saborSeleccionado,
                tamano_id: tamanoSeleccionado.id,
                tamano_nombre: tamanoSeleccionado.nombre,
                tamano_precio: parseFloat(tamanoSeleccionado.precio_adicional || 0)
              } : saborSeleccionado;
              
              mostrarPantallaNotas(productoSeleccionado, datosCombinados);
            }}
            className="text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {loadingIngredientes ? (
          <p className="text-center py-4">Cargando ingredientes disponibles...</p>
        ) : (
          <div ref={ingredientesScrollRef} className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
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

  // Modal de notas
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
        
        {/* Checkbox para ingrediente extra si hay ingredientes disponibles y no se ha seleccionado uno */}
        {tieneIngredientesDisponibles && !productoEditandoNotas.ingrediente_id && (
          <div className="bg-negro/30 p-3 rounded">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={quiereIngredienteExtra}
                onChange={(e) => setQuiereIngredienteExtra(e.target.checked)}
                className="w-5 h-5 rounded border-amarillo text-amarillo focus:ring-amarillo"
              />
              <span className="font-bold">Agregar ingrediente extra</span>
            </label>
          </div>
        )}
        
        {/* Toggle para llevar */}
        <div className="bg-negro/30 p-3 rounded">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={esParaLlevar}
              onChange={(e) => setEsParaLlevar(e.target.checked)}
              className="w-5 h-5 rounded border-amarillo text-amarillo focus:ring-amarillo"
            />
            <span className="font-bold">🛍️ Para llevar</span>
          </label>
        </div>
        
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
          onClick={() => {
            if (quiereIngredienteExtra && tieneIngredientesDisponibles && !productoEditandoNotas.ingrediente_id) {
              // Mostrar modal de ingredientes
              setSeleccionIngrediente(true);
              setProductoEditandoNotas(null);
            } else {
              // Agregar producto directamente
              agregarProductoALista();
            }
          }}
          className="w-full bg-amarillo text-negro py-3 rounded font-bold"
        >
          {quiereIngredienteExtra && tieneIngredientesDisponibles && !productoEditandoNotas.ingrediente_id 
            ? "Continuar a Ingredientes" 
            : "Agregar a la Orden"}
        </button>
      </div>
    );
  }

  // Vista principal
  return (
    <div className="space-y-6">
      {productosSeleccionados.length > 0 && (
        <div className="bg-negro rounded p-4 space-y-3">
          <h3 className="font-bold text-amarillo">Productos seleccionados</h3>
          {productosSeleccionados.map((prod, index) => (
            <div key={index} className="flex justify-between items-start border-b border-gray-700 pb-2">
              <div className="flex-1">
                <p className="font-bold">
                  {prod.nombre}
                  {prod.es_para_llevar && (
                    <span className="ml-2 text-xs bg-amarillo text-negro px-2 py-0.5 rounded font-bold">
                      🛍️ Para llevar
                    </span>
                  )}
                </p>
                {prod.esSentencia && (
                  <p className="text-xs text-amarillo font-normal">(Sentencia)</p>
                )}
                {prod.es_parte_sentencia && (
                  <p className="text-xs text-amarillo font-normal">(Parte de sentencia)</p>
                )}
                
                {prod.sabor_nombre && (
                  <div className="flex justify-between mt-1">
                    <span>Sabor: {prod.sabor_nombre} {prod.sabor_categoria ? `(${prod.sabor_categoria})` : ''}</span>
                    {parseFloat(prod.precio_adicional) > 0 && (
                      <span className="text-amarillo">+${parseFloat(prod.precio_adicional).toFixed(2)}</span>
                    )}
                  </div>
                )}
                
                {prod.tamano_nombre && (
                  <div className="flex justify-between mt-1">
                    <span>Tamaño: {prod.tamano_nombre}</span>
                    {parseFloat(prod.tamano_precio) > 0 && (
                      <span className="text-amarillo">+${parseFloat(prod.tamano_precio).toFixed(2)}</span>
                    )}
                  </div>
                )}
                
                {prod.ingrediente_nombre && (
                  <div className="flex justify-between mt-1">
                    <span>Ingrediente: {prod.ingrediente_nombre}</span>
                    {parseFloat(prod.ingrediente_precio) > 0 && (
                      <span className="text-amarillo">+${parseFloat(prod.ingrediente_precio).toFixed(2)}</span>
                    )}
                  </div>
                )}
                
                {prod.notas && (
                  <div className="mt-2 italic">"{prod.notas}"</div>
                )}
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
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
                  {prod.esSentencia && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        eliminarSentenciaCompleta(prod.sentencia_id);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs ml-2"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                
                <div className="text-sm">
                  {!prod.es_parte_sentencia && (
                    <>${(prod.precio * prod.cantidad).toFixed(2)}</>
                  )}
                  {prod.es_parte_sentencia && prod.precio > 0 && (
                    <span className="text-amarillo">+${(prod.precio * prod.cantidad).toFixed(2)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <p className="font-bold text-right text-lg mt-4">
            Total: ${productosSeleccionados
              .reduce((total, p) => {
                if (p.es_parte_sentencia && !p.esSentencia) {
                  return total + (p.precio * p.cantidad);
                } else {
                  return total + (p.precio * p.cantidad);
                }
              }, 0)
              .toFixed(2)}
          </p>
          <button
            onClick={handleConfirmarProductos}
            className="w-full bg-amarillo text-negro p-3 rounded font-bold hover:bg-yellow-500 mt-4"
          >
            Confirmar Productos
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {orderId && <span className="text-sm text-amarillo font-bold">#{orderId}</span>}
          <h2 className="text-lg font-bold text-amarillo">
            {showCustomerName && customerName ? `${customerName} - Seleccionar productos` : "Seleccionar productos"}
          </h2>
          {esParaLlevar && (
            <span className="bg-amarillo/20 text-amarillo px-2 py-1 rounded text-sm font-bold">
              🛍️ Para Llevar
            </span>
          )}
        </div>
        
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
      
      {onClose && (
        <button
          onClick={onClose}
          className="block bg-vino text-white text-center py-3 px-6 rounded-full font-bold w-full"
        >
          Cancelar
        </button>
      )}
      
      {mostrarSelectorSentencias && (
        <div className="fixed inset-0 bg-negro/80 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <SentenciaSelector 
              onAddProducts={agregarProductosDeSentencia}
              onClose={() => setMostrarSelectorSentencias(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}