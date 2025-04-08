import { useState, useEffect } from "react";
import { getEmpleadoId } from "../utils/auth";

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
    }
  }, [productoSeleccionado]);

  const cargarProductos = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("http://localhost:3000/products");
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
      const res = await fetch(`http://localhost:3000/products/sabores/producto/${productoId}?tipo=sabor`);
      const data = await res.json();
      
      console.log("Sabores obtenidos:", data);
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar sabores");
      }
      
      // Confiamos en el backend para filtrar correctamente
      setSaboresDisponibles(data);
      setLoadingSabores(false);
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
      const res = await fetch(`http://localhost:3000/products/sabores/producto/${productoId}?tipo=tamano`);
      const data = await res.json();
      
      console.log("Tamaños obtenidos:", data);
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar tamaños");
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
      const res = await fetch(`http://localhost:3000/products/sabores/producto/${productoId}?tipo=ingredientes`);
      const data = await res.json();
      
      console.log("Ingredientes obtenidos:", data);
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar ingredientes");
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

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setCantidad(1);
    setNotas("");
    setSaborSeleccionado(null);
  };

  const cancelarSeleccion = () => {
    setProductoSeleccionado(null);
    setCantidad(1);
    setNotas("");
    setSeleccionSabores(false);
    setProductoEditandoNotas(null);
    setMostrarSeleccionCantidad(false);
    setSeleccionTamano(false);
    setSeleccionIngrediente(false);
    setSaborSeleccionado(null);
  };

  const continuar = async () => {
    if (!productoSeleccionado) return;
    
    const esPulque = productoSeleccionado.categoria === "Pulque";
    const esCena = productoSeleccionado.categoria === "Cenas" || productoSeleccionado.categoria === "Cena";
    console.log("¿Es pulque?", esPulque);
    console.log("¿Es cena?", esCena);
    
    // Para pulques, primero mostramos selección de sabores 
    if (esPulque) {
      const tieneSabores = await cargarSabores(productoSeleccionado.id);
      console.log("¿Tiene sabores?", tieneSabores);
      
      if (tieneSabores) {
        // Si tiene sabores, mostrar pantalla de selección de sabores
        setSeleccionSabores(true);
        setSeleccionTamano(false);
        setSeleccionIngrediente(false);
        setMostrarSeleccionCantidad(false);
      } else {
        // Si no tiene sabores (extraño para pulque), mostrar tamaños directamente
        const tieneTamanos = await cargarTamanos(productoSeleccionado.id);
        console.log("¿Tiene tamaños?", tieneTamanos);
        
        if (tieneTamanos) {
          setSeleccionTamano(true);
          setSeleccionSabores(false);
          setSeleccionIngrediente(false);
          setMostrarSeleccionCantidad(false);
        } else {
          // Si no tiene sabores ni tamaños, mostrar notas
          mostrarPantallaNotas(productoSeleccionado, null);
          setMostrarSeleccionCantidad(false);
        }
      }
    } else if (esCena) {
      // Para productos de categoría Cena/Cenas
      const tieneSabores = await cargarSabores(productoSeleccionado.id);
      console.log("¿Tiene sabores? (cenas)", tieneSabores);
      
      if (tieneSabores) {
        // Si tiene sabores, mostrar pantalla de selección de sabores
        setSeleccionSabores(true);
        setSeleccionTamano(false);
        setSeleccionIngrediente(false);
        setMostrarSeleccionCantidad(false);
      } else {
        // Si no tiene sabores, comprobar si tiene ingredientes extra
        const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
        console.log("¿Tiene ingredientes extra?", tieneIngredientes);
        
        if (tieneIngredientes) {
          setSeleccionIngrediente(true);
          setSeleccionSabores(false);
          setSeleccionTamano(false);
          setMostrarSeleccionCantidad(false);
        } else {
          // Si no tiene sabores ni ingredientes, mostrar notas
          mostrarPantallaNotas(productoSeleccionado, null);
          setMostrarSeleccionCantidad(false);
        }
      }
    } else {
      // Para otros productos no-pulque y no-cena
      const tieneSabores = await cargarSabores(productoSeleccionado.id);
      console.log("¿Tiene sabores? (otro producto)", tieneSabores);
      
      if (tieneSabores) {
        // Si tiene sabores, ir a pantalla de selección
        setSeleccionSabores(true);
        setMostrarSeleccionCantidad(false);
      } else {
        // Si no tiene sabores, ir a notas
        mostrarPantallaNotas(productoSeleccionado, null);
        setMostrarSeleccionCantidad(false);
      }
    }
  };

  // Función modificada para manejar selección de sabores
  const seleccionarSabor = async (sabor) => {
    console.log("Sabor seleccionado:", sabor);
    const esPulque = productoSeleccionado.categoria === "Pulque";
    const esCena = productoSeleccionado.categoria === "Cenas" || productoSeleccionado.categoria === "Cena";
    
    if (esPulque) {
      // Para pulques, guardamos el sabor y vamos a seleccionar tamaño
      setSaborSeleccionado(sabor);
      
      const tieneTamanos = await cargarTamanos(productoSeleccionado.id);
      console.log("¿Tiene tamaños para este sabor?", tieneTamanos);
      
      if (tieneTamanos) {
        setSeleccionSabores(false);
        setSeleccionTamano(true);
      } else {
        // Si por alguna razón no hay tamaños disponibles
        mostrarPantallaNotas(productoSeleccionado, sabor);
        setSeleccionSabores(false);
      }
    } else if (esCena) {
      // Para cenas, guardamos el sabor y vamos a seleccionar ingrediente extra
      setSaborSeleccionado(sabor);
      
      const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
      console.log("¿Tiene ingredientes extra para esta cena?", tieneIngredientes);
      
      if (tieneIngredientes) {
        setSeleccionSabores(false);
        setSeleccionIngrediente(true);
      } else {
        // Si no hay ingredientes disponibles
        mostrarPantallaNotas(productoSeleccionado, sabor);
        setSeleccionSabores(false);
      }
    } else {
      // Para otros productos, seguimos el flujo normal
      mostrarPantallaNotas(productoSeleccionado, sabor);
      setSeleccionSabores(false);
    }
  };

  // Nueva función para seleccionar ingrediente extra
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

  // Nueva función para seleccionar tamaño
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

  const mostrarPantallaNotas = (producto, opcion) => {
    if (!producto) return;
    
    if (opcion && opcion.tamano_id) {
      // Si tenemos sabor y tamaño (para pulques)
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
      // Si tenemos sabor e ingrediente extra (para cenas)
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

  const cancelarSeleccionSabor = () => {
    setSeleccionSabores(false);
    setMostrarSeleccionCantidad(true);
    setSaborSeleccionado(null);
  };

  const cancelarSeleccionTamano = () => {
    setSeleccionTamano(false);
    setSeleccionSabores(true); // Volver a selección de sabor
    setSaborSeleccionado(null);
  };

  const cancelarSeleccionIngrediente = () => {
    setSeleccionIngrediente(false);
    setSeleccionSabores(true); // Volver a selección de sabor
    setSaborSeleccionado(null);
  };

  const cancelarEditarNotas = () => {
    setProductoEditandoNotas(null);
    setNotas("");
    
    // Determinar a qué pantalla volver
    if (productoSeleccionado?.categoria === "Pulque" && saborSeleccionado) {
      setSeleccionTamano(true);
    } else if ((productoSeleccionado?.categoria === "Cena" || productoSeleccionado?.categoria === "Cenas") && saborSeleccionado) {
      setSeleccionIngrediente(true);
    } else if (seleccionSabores) {
      setSeleccionSabores(true);
    } else {
      setMostrarSeleccionCantidad(true);
    }
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
    
    setEnviando(true);
    
    try {
      const res = await fetch(`http://localhost:3000/orders/${orden_id}/productos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productos: productosSeleccionados.map(p => ({
            producto_id: p.id,
            cantidad: p.cantidad,
            sabor_id: p.sabor_id || null,
            tamano_id: p.tamano_id || null,
            ingrediente_id: p.ingrediente_id || null,
            notas: p.notas || null,
            precio_unitario: p.precio
          })),
          empleado_id: getEmpleadoId()
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al agregar productos");
      }
      
      // Redireccionar a la página de gestión de la orden
      window.location.href = `/ordenes/${orden_id}`;
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron agregar los productos. Intenta de nuevo.");
      setEnviando(false);
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

  if (mostrarSeleccionCantidad && productoSeleccionado) {
    return (
      <div className="bg-vino rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{productoSeleccionado.nombre}</h2>
          <button 
            onClick={cancelarSeleccion}
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
                onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
                className="bg-vino px-3 py-1 rounded-full font-bold"
              >
                -
              </button>
              <span className="flex-1 text-center text-xl font-bold">{cantidad}</span>
              <button 
                onClick={() => setCantidad(prev => prev + 1)}
                className="bg-vino px-3 py-1 rounded-full font-bold"
              >
                +
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num}
                  onClick={() => setCantidad(num)}
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
            onClick={cancelarSeleccionSabor}
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
                onClick={() => seleccionarSabor(sabor)}
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
            onClick={cancelarSeleccionTamano}
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
                onClick={() => seleccionarTamano(tamano)}
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
    return (
      <div className="bg-vino rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Ingrediente extra para {productoSeleccionado.nombre} 
            {saborSeleccionado ? ` (${saborSeleccionado.nombre})` : ''}
          </h2>
          <button 
            onClick={cancelarSeleccionIngrediente}
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
              onClick={() => seleccionarIngrediente(null)}
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
                onClick={() => seleccionarIngrediente(ingrediente)}
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
                {prod.sabor_nombre && (
                  <p className="text-xs text-amarillo">
                    Sabor: {prod.sabor_nombre} 
                    {prod.sabor_categoria ? ` (${prod.sabor_categoria})` : ''}
                    {prod.precio_adicional > 0 && ` +$${prod.precio_adicional}`}
                  </p>
                )}
                {prod.tamano_nombre && (
                  <p className="text-xs text-amarillo">
                    Tamaño: {prod.tamano_nombre}
                    {prod.tamano_precio > 0 && ` +$${prod.tamano_precio}`}
                  </p>
                )}
                {prod.ingrediente_nombre && (
                  <p className="text-xs text-amarillo">
                    Ingrediente: {prod.ingrediente_nombre}
                    {prod.ingrediente_precio > 0 && ` +$${prod.ingrediente_precio}`}
                  </p>
                )}
                {prod.notas && (
                  <p className="text-xs text-gray-400 mt-1 italic">
                    Notas: {prod.notas}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => quitarProducto(prod.id, prod.sabor_id, prod.tamano_id, prod.ingrediente_id, prod.notas)}
                  className="bg-vino text-white px-2 py-1 rounded-full text-xs"
                >
                  -
                </button>
                <span className="text-sm px-2">
                  {prod.cantidad}
                </span>
                <button
                  onClick={() => aumentarCantidad(prod.id, prod.sabor_id, prod.tamano_id, prod.ingrediente_id, prod.notas)}
                  className="bg-vino text-white px-2 py-1 rounded-full text-xs"
                >
                  +
                </button>
                <span className="text-sm ml-2">
                  ${prod.precio.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          <p className="font-bold text-right text-lg mt-4">
            Total: ${productosSeleccionados.reduce((sum, prod) => sum + (prod.precio * prod.cantidad), 0).toFixed(2)}
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
              onClick={() => seleccionarProducto(producto)}
              className="bg-vino/80 rounded-xl p-4 cursor-pointer hover:bg-vino transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{producto.nombre}</h3>
                  {producto.descripcion && (
                    <p className="text-sm text-gray-300 line-clamp-2">{producto.descripcion}</p>
                  )}
                </div>
                <p className="text-amarillo font-bold">${parseFloat(producto.precio).toFixed(2)}</p>
              </div>
              <div className="mt-2">
                <span className="text-xs bg-negro/50 px-2 py-1 rounded">
                  {producto.categoria}
                </span>
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