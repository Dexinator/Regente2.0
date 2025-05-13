import { useEffect, useState } from "react";
import { getEmpleadoId } from "../utils/auth";
import { API_URL } from "../utils/api.js";
import SentenciaSelector from "./SentenciaSelector";

export default function CrearOrden() {
    const [presos, setPresos] = useState([]);
    const [presoSeleccionado, setPresoSeleccionado] = useState(null);
    const [nombreLibre, setNombreLibre] = useState("");
    const [numPersonas, setNumPersonas] = useState(1);
    
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Estados para selección de producto
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [notas, setNotas] = useState("");
    
    // Estados para sabores
    const [saboresDisponibles, setSaboresDisponibles] = useState([]);
    const [loadingSabores, setLoadingSabores] = useState(false);
    const [seleccionSabores, setSeleccionSabores] = useState(false);
    
    // Estados para notas y cantidad
    const [productoEditandoNotas, setProductoEditandoNotas] = useState(null);
    const [mostrarSeleccionCantidad, setMostrarSeleccionCantidad] = useState(false);
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);
    
    // Estados para tamaños
    const [saborSeleccionado, setSaborSeleccionado] = useState(null);
    const [tamanosDisponibles, setTamanosDisponibles] = useState([]);
    const [loadingTamanos, setLoadingTamanos] = useState(false);
    const [seleccionTamano, setSeleccionTamano] = useState(false);
    const [tamanoSeleccionado, setTamanoSeleccionado] = useState(null);
    
    // Nuevos estados para ingredientes extra
    const [ingredientesDisponibles, setIngredientesDisponibles] = useState([]);
    const [loadingIngredientes, setLoadingIngredientes] = useState(false);
    const [seleccionIngrediente, setSeleccionIngrediente] = useState(false);

    // Estado para código promocional
    const [codigoPromocional, setCodigoPromocional] = useState("");
    const [codigoValido, setCodigoValido] = useState(null);
    const [verificandoCodigo, setVerificandoCodigo] = useState(false);

    const [filtroPreso, setFiltroPreso] = useState("");

    // Nuevo estado para mostrar el selector de sentencias
    const [mostrarSelectorSentencias, setMostrarSelectorSentencias] = useState(false);

    // Nuevo estado para manejar la creación de la orden
    const [creandoOrden, setCreandoOrden] = useState(false);

    useEffect(() => {
        // Cargar presos
        fetch(`${API_URL}/clients`)
        .then((res) => res.json())
        .then((data) => setPresos(data))
        .catch((err) => console.error("Error cargando presos:", err));
        
        // Cargar productos
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
    
    // Cargar sabores para un producto
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
            return data.length > 0;
        } catch (error) {
            console.error("Error cargando sabores:", error);
            setLoadingSabores(false);
            return false;
        }
    };
    
    // Cargar tamaños para un producto
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
            
            setIngredientesDisponibles(data);
            setLoadingIngredientes(false);
            return data.length > 0;
        } catch (error) {
            console.error("Error cargando ingredientes:", error);
            setLoadingIngredientes(false);
            return false;
        }
    };
    
    // Ahora al agregar un producto, primero mostramos la pantalla de cantidad
    const agregarProducto = (producto) => {
        // Verificar si el producto tiene sabores disponibles
        if (producto.sabores_disponibles && producto.sabores_disponibles.length > 0) {
            setProductoSeleccionado(producto);
            setSeleccionSabores(true);
            cargarSabores(producto.id);
        } else {
            setProductoEditandoNotas({
                ...producto,
                nombre: producto.nombre // Asegurarnos de incluir el nombre
            });
            setMostrarSeleccionCantidad(true);
        }
    };

    // Función para continuar después de seleccionar la cantidad
    const continuar = async () => {
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

    // Modificar la selección de sabor original para manejar productos de sentencias
    const seleccionarSabor = async (sabor) => {
        // Si el producto es parte de una sentencia, usar la función específica
        if (productoSeleccionado && productoSeleccionado.es_parte_sentencia) {
            seleccionarSaborSentencia(sabor, productoSeleccionado);
            return;
        }
        
        // Comportamiento original para productos normales
        setSaborSeleccionado(sabor);
        
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

    // Modificar la selección de tamaño para manejar productos de sentencias
    const seleccionarTamano = (tamano) => {
        // Si el producto es parte de una sentencia
        if (productoSeleccionado && productoSeleccionado.es_parte_sentencia) {
            // Agregar el tamaño al producto
            const datosCombinados = {
                // Del sabor (tomado de saborSeleccionado estado)
                sabor_id: saborSeleccionado?.id || null,
                sabor_nombre: saborSeleccionado?.nombre || null,
                sabor_categoria_nombre: saborSeleccionado?.categoria_nombre || null,
                sabor_precio_adicional: parseFloat(saborSeleccionado?.precio_adicional || 0),
                // Del tamaño (tomado del argumento 'tamano')
                tamano_id: tamano.id,
                tamano_nombre: tamano.nombre,
                tamano_precio_adicional: parseFloat(tamano.precio_adicional || 0)
            };
            
            // Verificar si hay ingredientes para seleccionar
            if (productoSeleccionado.ingrediente_id === null && productoSeleccionado.requiere_ingrediente) {
                const cargarYSeleccionar = async () => {
                    const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
                    if (tieneIngredientes) {
                        // Guardar el tamaño seleccionado (con su precio) para usarlo después si se elige un ingrediente
                        setTamanoSeleccionado({
                            id: tamano.id,
                            nombre: tamano.nombre,
                            precio_adicional: parseFloat(tamano.precio_adicional || 0)
                        });
                        setSeleccionTamano(false);
                        setSeleccionIngrediente(true);
                    } else {
                        // Si no hay ingredientes, agregar el producto con sabor y tamaño
                        agregarProductoSentenciaConVariante(productoSeleccionado, datosCombinados);
                        setSeleccionTamano(false);
                        setSaborSeleccionado(null); // Limpiar sabor seleccionado
                        setTamanoSeleccionado(null); // Limpiar tamaño seleccionado
                    }
                };
                cargarYSeleccionar();
                return;
            }
            
            agregarProductoSentenciaConVariante(productoSeleccionado, datosCombinados);
            setSeleccionTamano(false);
            setSaborSeleccionado(null); // Limpiar sabor seleccionado
            setTamanoSeleccionado(null); // Limpiar tamaño seleccionado
            return;
        }
        
        // Comportamiento original para productos normales
        const datosCombinados = {
            ...saborSeleccionado,
            tamano_id: tamano.id,
            tamano_nombre: tamano.nombre,
            tamano_precio: parseFloat(tamano.precio_adicional || 0)
        };
        
        // Verificar si hay ingredientes para seleccionar
        if (productoSeleccionado.requiere_ingrediente) {
            const cargarYSeleccionar = async () => {
                const tieneIngredientes = await cargarIngredientes(productoSeleccionado.id);
                if (tieneIngredientes) {
                    // Guardar tamaño para usarlo después
                    setTamanoSeleccionado({
                        ...tamano,
                        precio_adicional: parseFloat(tamano.precio_adicional || 0)
                    });
                    setSeleccionTamano(false);
                    setSeleccionIngrediente(true);
                } else {
                    mostrarPantallaNotas(productoSeleccionado, datosCombinados);
                    setSeleccionTamano(false);
                }
            };
            cargarYSeleccionar();
            return;
        }
        
        mostrarPantallaNotas(productoSeleccionado, datosCombinados);
        setSeleccionTamano(false);
    };

    // Modificar la selección de ingrediente para manejar productos de sentencias
    const seleccionarIngrediente = (ingrediente) => {
        // Si el producto es parte de una sentencia
        if (productoSeleccionado && productoSeleccionado.es_parte_sentencia) {
            // Preparar datos para agregar
            const datosCombinados = {
                // Del sabor (tomado de saborSeleccionado estado)
                sabor_id: saborSeleccionado?.id || null,
                sabor_nombre: saborSeleccionado?.nombre || null,
                sabor_categoria_nombre: saborSeleccionado?.categoria_nombre || null,
                sabor_precio_adicional: parseFloat(saborSeleccionado?.precio_adicional || 0),
                // Del tamaño (tomado de tamanoSeleccionado estado)
                tamano_id: tamanoSeleccionado?.id || null,
                tamano_nombre: tamanoSeleccionado?.nombre || null,
                tamano_precio_adicional: parseFloat(tamanoSeleccionado?.precio_adicional || 0),
                // Del ingrediente (tomado del argumento 'ingrediente')
                // Si 'ingrediente' es null (opción "Sin ingrediente extra"), los campos de ingrediente serán null/0
                ingrediente_id: ingrediente?.id || null,
                ingrediente_nombre: ingrediente?.nombre || null,
                ingrediente_precio_adicional: parseFloat(ingrediente?.precio_adicional || 0)
            };
            
            // Agregar a la lista
            agregarProductoSentenciaConVariante(productoSeleccionado, datosCombinados);
            setSeleccionIngrediente(false);
            setSaborSeleccionado(null); // Limpiar
            setTamanoSeleccionado(null); // Limpiar
            return;
        }
        
        // Si tenemos tamaño y sabor
        if (tamanoSeleccionado) {
            // Combinamos el producto con sabor, tamaño e ingrediente
            const datosCombinados = {
                ...saborSeleccionado,
                tamano_id: tamanoSeleccionado.id,
                tamano_nombre: tamanoSeleccionado.nombre,
                tamano_precio: parseFloat(tamanoSeleccionado.precio_adicional || 0),
                ingrediente_id: ingrediente.id,
                ingrediente_nombre: ingrediente.nombre,
                ingrediente_precio: parseFloat(ingrediente.precio_adicional || 0)
            };
            
            mostrarPantallaNotas(productoSeleccionado, datosCombinados);
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

    // Función para cancelar la selección de un producto
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

    // Función para cancelar la selección de sabor
    const cancelarSeleccionSabor = () => {
        setSeleccionSabores(false);
        setMostrarSeleccionCantidad(true);
        setSaborSeleccionado(null);
    };

    // Función para cancelar la selección de tamaño
    const cancelarSeleccionTamano = () => {
        setSeleccionTamano(false);
        setSeleccionSabores(true);
        setSaborSeleccionado(null);
    };

    // Función para cancelar la selección de ingrediente
    const cancelarSeleccionIngrediente = () => {
        setSeleccionIngrediente(false);
        setSeleccionSabores(true);
        setSaborSeleccionado(null);
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

    // Función para validar código promocional
    const validarCodigoPromocional = async () => {
        if (!codigoPromocional.trim()) {
            setCodigoValido(null);
            return;
        }
        
        try {
            setVerificandoCodigo(true);
            
            const response = await fetch(`${API_URL}/promociones/validar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ codigo: codigoPromocional.trim() }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                setCodigoValido({ valid: false, message: error.error });
                return;
            }
            
            const result = await response.json();
            if (result.valid) {
                setCodigoValido({ 
                    valid: true, 
                    message: `Código válido: ${result.codigo.porcentaje_descuento}% de descuento`,
                    data: result.codigo
                });
            } else {
                setCodigoValido({ valid: false, message: "Código inválido o expirado" });
            }
        } catch (error) {
            setCodigoValido({ valid: false, message: error.message });
        } finally {
            setVerificandoCodigo(false);
        }
    };

    const crearOrden = async () => {
        if (productosSeleccionados.length === 0) {
            alert("Agrega al menos un producto");
            return;
        }
        
        try {
            setCreandoOrden(true);
            
            // Calcular el total incluyendo los costos adicionales de variantes
            const total = productosSeleccionados.reduce((sum, prod) => {
                return sum + (prod.precio * prod.cantidad);
            }, 0);
            
            console.log("Creando orden con productos:", productosSeleccionados);
            
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    preso_id: presoSeleccionado?.id,
                    nombre_cliente: presoSeleccionado ? presoSeleccionado.reg_name : nombreLibre,
                    total: total,
                    empleado_id: getEmpleadoId(),
                    num_personas: numPersonas,
                    codigo_promocional: codigoValido?.valid ? codigoPromocional.trim() : null,
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

                        // Si es parte de una sentencia, agregar metadatos (ya lo hacías, solo revisando)
                        // if (p.es_parte_sentencia) {
                        // productoData.es_parte_sentencia = true; // ya está arriba
                        // productoData.sentencia_id = p.sentencia_id; // ya está arriba
                            
                            // Los costos adicionales de variantes ya están sumados en p.precio para componentes
                            // Si el backend los necesitara desglosados, se añadirían aquí.
                        // }

                        // Si es la sentencia principal (ya lo hacías, solo revisando)
                        // if (p.esSentencia) {
                            // productoData.es_sentencia_principal = true; // ya está arriba
                            // productoData.sentencia_id = p.sentencia_id; // ya está arriba
                            // productoData.nombre_sentencia = p.nombre; // ya está arriba
                            // productoData.descripcion_sentencia = p.descripcion; // ya está arriba
                        // }
                        // console.log("Enviando productoData:", productoData); // Descomentar para depurar
                        return productoData;
                    })
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear la orden');
            }

            const data = await response.json();
            alert("Orden creada con éxito");
            window.location.href = "/ordenes";
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        } finally {
            setCreandoOrden(false);
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

    // Nueva función para agregar productos de sentencias
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
        // console.log("Producto de sentencia con variantes a agregar:", producto);
        // console.log("Variantes recibidas en agregarProductoSentenciaConVariante:", variantes);
        
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
            ...producto, // Producto base de la sentencia (puede tener info de procesamiento)
            ...variantesCompletasParaProducto, // Información de las variantes seleccionadas
            es_parte_sentencia: true,
            // Preservar campos originales del producto
            nombre: nombreOriginal,
            categoria: categoriaOriginal,
            id: idOriginal, // ID original del producto, no de la variante
            // El 'precio' del producto de sentencia en la lista es la suma de los costos adicionales de sus variantes.
            precio: precioTotalDeVariantes,
            // Ya no necesitamos precio_adicional_total, ya que 'precio' cumple esta función para productos de sentencia.
            cantidad: producto.cantidad || 1
        };
        
        // console.log("Producto de sentencia COMPLETO a agregar:", productoCompleto);
        
        // Agregar a la lista de productos seleccionados
        setProductosSeleccionados(prev => [...prev, productoCompleto]);
        
        // Continuar con el siguiente producto pendiente
        if (producto.productos_pendientes && producto.indice_procesamiento !== undefined) {
            procesarProductoConVariantesPendientes(
                producto.productos_pendientes, 
                producto.indice_procesamiento + 1,
                producto.sentencia_id
            );
        }
    };

    // Renderización principal
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

    // Pantalla principal para selección de cliente y productos
    return (
        <div className="space-y-8">
            <h2 className="text-lg font-bold text-amarillo">Datos del Cliente</h2>
            
            {/* Búsqueda de presos */}
            <div>
                <label className="block mb-2 text-amarillo font-bold">Buscar preso</label>
                <div className="relative">
                    <input
                        type="text"
                        value={filtroPreso}
                        onChange={e => setFiltroPreso(e.target.value)}
                        placeholder="Buscar por nombre, celda o número de teléfono"
                        className="w-full bg-vino text-white p-2 rounded"
                    />
                </div>
                
                {filtroPreso && (
                    <div className="mt-2 bg-negro rounded overflow-hidden max-h-40 overflow-y-auto">
                        {presos
                        .filter(p => 
                            p.reg_name.toLowerCase().includes(filtroPreso.toLowerCase()) ||
                            (p.igname && p.igname.toLowerCase().includes(filtroPreso.toLowerCase())) ||
                            p.res_tel.includes(filtroPreso)
                        )
                        .slice(0, 5)
                        .map(preso => (
                            <button
                                key={preso.id}
                                onClick={() => {
                                    setPresoSeleccionado(preso);
                                    setFiltroPreso("");
                                    setNombreLibre("");
                                }}
                                className="w-full text-left p-2 hover:bg-vino/30 flex justify-between items-center border-b border-gray-800"
                            >
                                <div>
                                    <p>{preso.reg_name}</p>
                                    {preso.igname && <p className="text-xs text-gray-400">IG: {preso.igname}</p>}
                                </div>
                                <p className="text-sm text-gray-400">Celda {preso.cellmate}</p>
                            </button>
                        ))}
                    </div>
                )}
                
                {presoSeleccionado && (
                    <div className="mt-2 p-3 bg-vino/30 rounded flex justify-between">
                        <div>
                            <p className="font-bold">{presoSeleccionado.reg_name}</p>
                            <p className="text-sm text-gray-300">TEL: {presoSeleccionado.res_tel}</p>
                            {presoSeleccionado.igname && <p className="text-sm text-gray-300">IG: {presoSeleccionado.igname}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm">Compañero de Celda {presoSeleccionado.cellmate}</p>
                            <button
                                onClick={() => setPresoSeleccionado(null)}
                                className="text-gray-300 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {!presoSeleccionado && (
                <div>
                    <label className="block mb-2 text-amarillo font-bold">O nombre de referencia</label>
                    <input
                        type="text"
                        value={nombreLibre}
                        onChange={(e) => {
                            setNombreLibre(e.target.value);
                            setPresoSeleccionado(null);
                        }}
                        placeholder="Ej. Chica de blanco"
                        className="w-full bg-vino text-white p-2 rounded"
                    />
                </div>
            )}
            
            {/* Campo para número de personas */}
            <div>
                <label className="block mb-2 text-amarillo font-bold">Número de personas</label>
                <div className="flex items-center gap-3 bg-negro rounded p-2 w-full">
                    <button 
                        onClick={() => setNumPersonas(prev => Math.max(1, prev - 1))}
                        className="bg-vino px-3 py-1 rounded-full font-bold"
                    >
                        -
                    </button>
                    <span className="flex-1 text-center text-xl font-bold">{numPersonas}</span>
                    <button 
                        onClick={() => setNumPersonas(prev => prev + 1)}
                        className="bg-vino px-3 py-1 rounded-full font-bold"
                    >
                        +
                    </button>
                </div>
            </div>
            
            {/* Campo para código promocional */}
            <div>
                <label className="block mb-2 text-amarillo font-bold">Código Promocional (opcional)</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={codigoPromocional}
                        onChange={(e) => setCodigoPromocional(e.target.value.toUpperCase())}
                        onBlur={validarCodigoPromocional}
                        placeholder="Ej. VERANO2023"
                        className="flex-1 bg-vino text-white p-2 rounded uppercase"
                    />
                    <button 
                        onClick={validarCodigoPromocional}
                        className="bg-amarillo text-negro px-3 rounded font-bold"
                        disabled={verificandoCodigo || !codigoPromocional.trim()}
                    >
                        Validar
                    </button>
                </div>
                {verificandoCodigo && (
                    <p className="text-gray-400 text-sm mt-1">Verificando código...</p>
                )}
                {codigoValido && (
                    <p className={`text-sm mt-1 ${codigoValido.valid ? 'text-green-500' : 'text-red-500'}`}>
                        {codigoValido.message}
                    </p>
                )}
            </div>
            
            {/* Lista de productos seleccionados */}
            <div className="space-y-3 my-6">
                {productosSeleccionados.length > 0 && (
                    <div className="bg-negro rounded p-4 space-y-3">
                        <h3 className="font-bold text-amarillo">Productos seleccionados</h3>
                        {productosSeleccionados.map((producto, index) => (
                            <div 
                                key={`${index}-${producto.id}-${producto.sabor_id}-${producto.tamano_id}-${producto.ingrediente_id}`} 
                                className="bg-negro p-3 rounded flex justify-between items-start border-b border-gray-800 pb-3"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{producto.nombre}</span>
                                        {producto.esSentencia && (
                                            <span className="bg-amarillo text-negro px-2 py-0.5 rounded-full text-xs">
                                                Sentencia
                                            </span>
                                        )}
                                        {producto.es_parte_sentencia && (
                                            <span className="bg-amarillo/30 text-amarillo px-2 py-0.5 rounded-full text-xs">
                                                Incluido
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Mostrar información de variantes si existe */}
                                    <div className="text-xs text-gray-400 mt-1">
                                        {/* Mostrar sabor si existe */}
                                        {producto.sabor_nombre && (
                                            <div className="flex justify-between mt-1">
                                                <span>Sabor: {producto.sabor_nombre}</span>
                                                {parseFloat(producto.precio_adicional) > 0 && (
                                                    <span className="text-amarillo">+${parseFloat(producto.precio_adicional).toFixed(2)}</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Mostrar tamaño si existe */}
                                        {producto.tamano_nombre && (
                                            <div className="flex justify-between mt-1">
                                                <span>Tamaño: {producto.tamano_nombre}</span>
                                                {parseFloat(producto.tamano_precio) > 0 && (
                                                    <span className="text-amarillo">+${parseFloat(producto.tamano_precio).toFixed(2)}</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Mostrar ingrediente si existe */}
                                        {producto.ingrediente_nombre && (
                                            <div className="flex justify-between mt-1">
                                                <span>Ingrediente: {producto.ingrediente_nombre}</span>
                                                {parseFloat(producto.ingrediente_precio) > 0 && (
                                                    <span className="text-amarillo">+${parseFloat(producto.ingrediente_precio).toFixed(2)}</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Mostrar notas si existen */}
                                        {producto.notas && (
                                            <div className="mt-2 italic">"{producto.notas}"</div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        {/* Botones para modificar cantidad */}
                                        {!producto.es_parte_sentencia && (
                                            <>
                                                <button
                                                    onClick={() => quitarProducto(
                                                        producto.id, 
                                                        producto.sabor_id, 
                                                        producto.tamano_id, 
                                                        producto.ingrediente_id,
                                                        producto.notas
                                                    )}
                                                    className="bg-vino px-2 rounded-full"
                                                >
                                                    -
                                                </button>
                                                <span className="font-bold">{producto.cantidad}</span>
                                                <button
                                                    onClick={() => aumentarCantidad(
                                                        producto.id, 
                                                        producto.sabor_id, 
                                                        producto.tamano_id, 
                                                        producto.ingrediente_id,
                                                        producto.notas
                                                    )}
                                                    className="bg-vino px-2 rounded-full"
                                                >
                                                    +
                                                </button>
                                            </>
                                        )}
                                        {producto.es_parte_sentencia && (
                                            <span className="font-bold">{producto.cantidad}x</span>
                                        )}
                                    </div>
                                    
                                    {/* Mostrar precio */}
                                    <div className="text-sm">
                                        {!producto.es_parte_sentencia && (
                                            <>${(producto.precio * producto.cantidad).toFixed(2)}</>
                                        )}
                                        {producto.es_parte_sentencia && producto.precio > 0 && (
                                            <>+${parseFloat(producto.precio).toFixed(2)}</>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {productosSeleccionados.length === 0 && (
                    <div className="bg-negro/50 rounded p-4 text-center">
                        <p className="text-gray-400">No hay productos seleccionados</p>
                    </div>
                )}
            </div>

            <hr className="my-6 border-amarillo" />
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-amarillo">Seleccionar productos</h2>
                
                {/* Nuevo botón para mostrar el selector de sentencias */}
                <button
                    onClick={() => setMostrarSelectorSentencias(true)}
                    className="bg-amarillo text-negro px-4 py-2 rounded font-bold hover:bg-yellow-500"
                >
                    Agregar Sentencia
                </button>
            </div>
            
            {/* Filtros de productos */}
            <div className="space-y-4">
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
            </div>
            
            {/* Lista de productos */}
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
            
            {/* Selector de Sentencias - como overlay */}
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

            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">
                    ${productosSeleccionados
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
                </span>
            </div>

            <button
                onClick={crearOrden}
                className="w-full bg-amarillo text-negro py-3 rounded font-bold"
                disabled={creandoOrden}
            >
                {creandoOrden ? "Creando orden..." : "Crear Orden"}
            </button>
        </div>
    );
}
