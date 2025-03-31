import { useEffect, useState } from "react";

export default function CrearOrden() {
    const [presos, setPresos] = useState([]);
    const [presoSeleccionado, setPresoSeleccionado] = useState(null);
    const [nombreLibre, setNombreLibre] = useState("");
    
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

    const [filtroPreso, setFiltroPreso] = useState("");

    useEffect(() => {
        // Cargar presos
        fetch("http://localhost:3000/clients")
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
    
    // Cargar sabores para un producto
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
            
            // Filtrar explícitamente para excluir cualquier tamaño que haya podido colarse
            const soloSabores = data.filter(item => {
                return !item.nombre.toLowerCase().includes('litro') && 
                    item.categoria_tipo !== 'tamaño';
            });
            
            console.log("Sabores filtrados:", soloSabores);
            setSaboresDisponibles(soloSabores);
            setLoadingSabores(false);
            return soloSabores.length > 0;
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

    // Después de seleccionar la cantidad, verificamos si tiene sabores
    const continuarDespuesDeCantidad = async () => {
        if (!productoSeleccionado) return;

        const esPulque = productoSeleccionado.categoria === "Pulque";
        console.log("¿Es pulque?", esPulque);
        
        // Para pulques, primero mostramos selección de sabores 
        if (esPulque) {
            const tieneSabores = await cargarSabores(productoSeleccionado.id);
            console.log("¿Tiene sabores?", tieneSabores);
            
            if (tieneSabores) {
                // Si tiene sabores, mostrar pantalla de selección de sabores
                setProductoSeleccionado(productoSeleccionado);
                setNotas(""); // Limpiar notas
                setProductoSeleccionado(null);
            } else {
                // Si no tiene sabores (extraño para pulque), mostrar tamaños directamente
                const tieneTamanos = await cargarTamanos(productoSeleccionado.id);
                console.log("¿Tiene tamaños?", tieneTamanos);
                
                if (tieneTamanos) {
                    setSeleccionTamano(true);
                    setProductoSeleccionado(null);
                } else {
                    // Si no tiene sabores ni tamaños, mostrar notas
                    setProductoEditandoNotas({...productoSeleccionado, sabor_id: null});
                    setNotas("");
                    setProductoSeleccionado(null);
                }
            }
        } else {
            // Para productos no-pulque, verificar si tiene sabores
            const tieneSabores = await cargarSabores(productoSeleccionado.id);
            console.log("¿Tiene sabores? (no-pulque)", tieneSabores);
            
            if (tieneSabores) {
                // Si tiene sabores, mostrar selector
                setProductoSeleccionado(productoSeleccionado);
                setNotas(""); // Limpiar notas
                setProductoSeleccionado(null);
            } else {
                // Si no tiene sabores, mostrar pantalla de notas primero
                setProductoEditandoNotas({...productoSeleccionado, sabor_id: null});
                setNotas("");
                setProductoSeleccionado(null);
            }
        }
    };

    const agregarProductoConSabor = async (sabor) => {
        console.log("Sabor seleccionado:", sabor);
        if (!productoSeleccionado) return;
        
        const esPulque = productoSeleccionado.categoria === "Pulque";
        
        // Asegurarnos de que el precio adicional sea un número válido
        const precioAdicionalSabor = parseFloat(sabor.precio_adicional) || 0;
        
        if (esPulque) {
            // Para pulques, guardar sabor y mostrar tamaños
            setSaborSeleccionado({
                ...sabor,
                precio_adicional: precioAdicionalSabor
            });
            
            const tieneTamanos = await cargarTamanos(productoSeleccionado.id);
            console.log("¿Tiene tamaños para este sabor?", tieneTamanos);
            
            if (tieneTamanos) {
                setProductoSeleccionado(null);
                setSeleccionTamano(true);
            } else {
                // Si no tiene tamaños, ir a notas
                setProductoEditandoNotas({
                    ...productoSeleccionado,
                    sabor_id: sabor.id,
                    sabor_nombre: sabor.nombre,
                    sabor_categoria: sabor.categoria_nombre,
                    precio_adicional: precioAdicionalSabor
                });
                setProductoSeleccionado(null);
            }
        } else {
            // Para productos normales, ir a notas
            setProductoEditandoNotas({
                ...productoSeleccionado,
                sabor_id: sabor.id,
                sabor_nombre: sabor.nombre,
                sabor_categoria: sabor.categoria_nombre,
                precio_adicional: precioAdicionalSabor
            });
            setProductoSeleccionado(null);
        }
    };
    
    // Nueva función para seleccionar tamaño
    const seleccionarTamano = (tamano) => {
        // Asegurarnos de que el precio adicional del tamaño sea un número válido
        const precioAdicionalTamano = parseFloat(tamano.precio_adicional) || 0;
        
        // Combinamos el producto con sabor y tamaño
        const datosCombinados = {
            ...productoSeleccionado ?? productos.find(p => p.id === saborSeleccionado.producto_id),
            sabor_id: saborSeleccionado?.id,
            sabor_nombre: saborSeleccionado?.nombre,
            sabor_categoria: saborSeleccionado?.categoria_nombre,
            precio_adicional: parseFloat(saborSeleccionado?.precio_adicional || 0),
            tamano_id: tamano.id,
            tamano_nombre: tamano.nombre,
            tamano_precio: precioAdicionalTamano
        };
        
        setProductoEditandoNotas(datosCombinados);
        setSeleccionTamano(false);
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

    const cancelarEditarNotas = () => {
        setProductoEditandoNotas(null);
        setNotas("");
        
        // Determinar a qué pantalla volver
        if (productoSeleccionado?.categoria === "Pulque" && saborSeleccionado) {
            setSeleccionTamano(true);
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
            tamano_precio 
        } = productoEditandoNotas;
        
        // Clave única para identificar este producto con este sabor, tamaño y notas
        const uniqueKey = `${id}-${sabor_id || 0}-${tamano_id || 0}-${notas.trim() || ""}`;
        
        // Verificar si ya existe este producto con este sabor, tamaño y notas
        const yaExiste = productosSeleccionados.find(p => 
            p.id === id && 
            p.sabor_id === sabor_id && 
            p.tamano_id === tamano_id && 
            ((p.notas || "") === (notas.trim() || ""))
        );
        
        if (yaExiste) {
            // Si ya existe, incrementar cantidad
            setProductosSeleccionados(prev => 
                prev.map(p => 
                    p.id === id && 
                    p.sabor_id === sabor_id && 
                    p.tamano_id === tamano_id && 
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

    const quitarProducto = (id, sabor_id, tamano_id, notas) => {
        setProductosSeleccionados(prev => 
            prev
            .map(p => (
                p.id === id && 
                p.sabor_id === sabor_id && 
                p.tamano_id === tamano_id &&
                ((p.notas || "") === (notas || "")) 
                    ? { ...p, cantidad: p.cantidad - 1 } 
                    : p
            ))
            .filter(p => p.cantidad > 0)
        );
    };

    const aumentarCantidad = (id, sabor_id, tamano_id, notas) => {
        setProductosSeleccionados(prev =>
            prev.map(p => 
                p.id === id && 
                p.sabor_id === sabor_id && 
                p.tamano_id === tamano_id &&
                ((p.notas || "") === (notas || ""))
                    ? { ...p, cantidad: p.cantidad + 1 }
                    : p
            )
        );
    };

    const crearOrden = async () => {
        if (productosSeleccionados.length === 0) {
            alert("Agrega al menos un producto");
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    preso_id: presoSeleccionado?.id,
                    nombre_cliente: presoSeleccionado ? presoSeleccionado.reg_name : nombreLibre,
                    total: productosSeleccionados.reduce((sum, prod) => sum + (prod.precio * prod.cantidad), 0),
                    empleado_id: 1, // temporal, puedes leerlo del token luego
                    productos: productosSeleccionados.map(p => ({
                        producto_id: p.id,
                        cantidad: p.cantidad,
                        precio_unitario: p.precio,
                        sabor_id: p.sabor_id,
                        tamano_id: p.tamano_id,
                        notas: p.notas
                    }))
                })
            });

            if (!response.ok) {
                throw new Error('Error al crear la orden');
            }

            const data = await response.json();
            alert("Orden creada con éxito");
            window.location.href = "/ordenes";
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
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
        setSaborSeleccionado(null);
    };

    const continuar = async () => {
        if (!productoSeleccionado) return;
        
        const esPulque = productoSeleccionado.categoria === "Pulque";
        console.log("¿Es pulque?", esPulque);
        
        // Para pulques, primero mostramos selección de sabores 
        if (esPulque) {
            const tieneSabores = await cargarSabores(productoSeleccionado.id);
            console.log("¿Tiene sabores?", tieneSabores);
            
            if (tieneSabores) {
                // Si tiene sabores, mostrar pantalla de selección de sabores
                setSeleccionSabores(true);
                setSeleccionTamano(false);
                setMostrarSeleccionCantidad(false);
            } else {
                // Si no tiene sabores (extraño para pulque), mostrar tamaños directamente
                const tieneTamanos = await cargarTamanos(productoSeleccionado.id);
                console.log("¿Tiene tamaños?", tieneTamanos);
                
                if (tieneTamanos) {
                    setSeleccionTamano(true);
                    setSeleccionSabores(false);
                    setMostrarSeleccionCantidad(false);
                } else {
                    // Si no tiene sabores ni tamaños, mostrar notas
                    mostrarPantallaNotas(productoSeleccionado, null);
                    setMostrarSeleccionCantidad(false);
                }
            }
        } else {
            // Para productos no-pulque
            const tieneSabores = await cargarSabores(productoSeleccionado.id);
            console.log("¿Tiene sabores? (no-pulque)", tieneSabores);
            
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

    // Función para manejar selección de sabores
    const seleccionarSabor = async (sabor) => {
        console.log("Sabor seleccionado:", sabor);
        const esPulque = productoSeleccionado.categoria === "Pulque";
        
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
        } else {
            // Para otros productos, seguimos el flujo normal
            mostrarPantallaNotas(productoSeleccionado, sabor);
            setSeleccionSabores(false);
        }
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
                tamano_precio: opcion.tamano_precio
            });
        } else if (opcion) {
            // Solo sabor
            setProductoEditandoNotas({
                ...producto,
                sabor_id: opcion.id,
                sabor_nombre: opcion.nombre,
                sabor_categoria: opcion.categoria_nombre,
                precio_adicional: parseFloat(opcion.precio_adicional || 0)
            });
        } else {
            // Sin opciones adicionales
            setProductoEditandoNotas({
                ...producto,
                sabor_id: null,
                sabor_nombre: null,
                sabor_categoria: null,
                precio_adicional: 0
            });
        }
        
        setNotas("");
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
        <div className="space-y-6">
            {/* Sección de selección de cliente */}
            {!nombreLibre && (
                <div>
                    <label className="block mb-2 text-amarillo font-bold">Cliente registrado</label>

                    <input
                        type="text"
                        placeholder="Buscar preso por nombre o número..."
                        value={filtroPreso}
                        onChange={(e) => setFiltroPreso(e.target.value)}
                        className="w-full mb-2 bg-negro text-white p-2 rounded border border-amarillo placeholder:text-white/60"
                    />

                    <select
                        value={presoSeleccionado?.id || ""}
                        onChange={(e) => {
                            if (e.target.value) {
                                const selectedPreso = presos.find(p => p.id == e.target.value);
                                setPresoSeleccionado(selectedPreso);
                                setNombreLibre("");
                            } else {
                                setPresoSeleccionado(null);
                            }
                        }}
                        className="w-full bg-vino text-white p-2 rounded"
                    >
                        <option value="">-- Selecciona un preso --</option>
                        {presos
                            .filter(
                                (p) =>
                                p.reg_name.toLowerCase().includes(filtroPreso.toLowerCase()) ||
                                p.id.toString().includes(filtroPreso)
                            )
                            .map((p) => (
                                <option key={p.id} value={p.id}>
                                    #{p.id} · {p.reg_name}
                                </option>
                            ))}
                    </select>
                </div>
            )}
            
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
            
            {/* Lista de productos seleccionados */}
            <div className="space-y-3 my-6">
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
                                    {prod.notas && (
                                        <p className="text-xs text-gray-400 mt-1 italic">
                                            Notas: {prod.notas}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => quitarProducto(prod.id, prod.sabor_id, prod.tamano_id, prod.notas)}
                                        className="bg-vino text-white px-2 py-1 rounded-full text-xs"
                                    >
                                        -
                                    </button>
                                    <span className="text-sm px-2">
                                        {prod.cantidad}
                                    </span>
                                    <button
                                        onClick={() => aumentarCantidad(prod.id, prod.sabor_id, prod.tamano_id, prod.notas)}
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
                            onClick={crearOrden}
                            className="w-full bg-amarillo text-negro p-3 rounded font-bold hover:bg-yellow-500 mt-4"
                        >
                            Crear Orden
                        </button>
                    </div>
                )}
                {productosSeleccionados.length === 0 && (
                    <div className="bg-negro/50 rounded p-4 text-center">
                        <p className="text-gray-400">No hay productos seleccionados</p>
                    </div>
                )}
            </div>

            <hr className="my-6 border-amarillo" />
            <h2 className="text-lg font-bold text-amarillo">Seleccionar productos</h2>
            
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
        </div>
    );
}
