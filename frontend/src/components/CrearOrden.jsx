import { useEffect, useState } from "react";

export default function CrearOrden() {
    const [presos, setPresos] = useState([]);
    const [presoSeleccionado, setPresoSeleccionado] = useState(null);
    const [nombreLibre, setNombreLibre] = useState("");
    
    const [productos, setProductos] = useState([]);
    const [seleccionados, setSeleccionados] = useState([]);
    
    const [filtroNombre, setFiltroNombre] = useState("");
    const [filtroCategoria, setFiltroCategoria] = useState("");
    const [filtroPreso, setFiltroPreso] = useState("");
    
    // Estados para manejar sabores
    const [productoConSabor, setProductoConSabor] = useState(null);
    const [saboresDisponibles, setSaboresDisponibles] = useState([]);
    const [loadingSabores, setLoadingSabores] = useState(false);

    // Estado para manejar notas
    const [notasProducto, setNotasProducto] = useState("");
    const [productoEditandoNotas, setProductoEditandoNotas] = useState(null);
    
    // Estado para manejar cantidad
    const [cantidad, setCantidad] = useState(1);
    const [productoConCantidad, setProductoConCantidad] = useState(null);
    
    // Nuevos estados para tamaños
    const [saborSeleccionado, setSaborSeleccionado] = useState(null);
    const [tamanosDisponibles, setTamanosDisponibles] = useState([]);
    const [loadingTamanos, setLoadingTamanos] = useState(false);
    const [seleccionTamano, setSeleccionTamano] = useState(false);

    useEffect(() => {
        // Cargar presos
        fetch("http://localhost:3000/clients")
        .then((res) => res.json())
        .then((data) => setPresos(data))
        .catch((err) => console.error("Error cargando presos:", err));
        
        // Cargar productos
        fetch("http://localhost:3000/products")
        .then((res) => res.json())
        .then((data) => setProductos(data))
        .catch((err) => console.error("Error cargando productos:", err));
    }, []);
    
    // Cargar sabores para un producto
    const cargarSabores = async (productoId) => {
        setLoadingSabores(true);
        try {
            // Conseguir sabores con nuevo parámetro tipo=sabor
            console.log("Cargando sabores para producto:", productoId);
            const res = await fetch(`http://localhost:3000/products/sabores/producto/${productoId}?tipo=sabor`);
            const data = await res.json();
            
            console.log("Sabores obtenidos:", data);
            
            if (!res.ok) throw new Error("Error cargando sabores");
            
            // Filtrar explícitamente para excluir cualquier tamaño que haya podido colarse
            const soloSabores = data.filter(item => {
                return !item.nombre.toLowerCase().includes('litro') && 
                       item.categoria_tipo !== 'tamaño';
            });
            
            console.log("Sabores filtrados:", soloSabores);
            setSaboresDisponibles(soloSabores);
            setLoadingSabores(false);
            return soloSabores.length > 0;
        } catch (err) {
            console.error("Error cargando sabores:", err);
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
            
            if (!res.ok) throw new Error("Error cargando tamaños");
            
            // Filtrar tamaños según la categoría del producto si es pulque
            const producto = productos.find(p => p.id === parseInt(productoId));
            let tamanosAplicables = data;
            
            if (producto && producto.categoria === "Pulque") {
                // Para cada categoría, mostrar solo los tamaños aplicables
                const categoriaEnNombre = producto.nombre.toLowerCase();
                
                tamanosAplicables = data.filter(t => {
                    const nombreTamano = t.nombre.toLowerCase();
                    return nombreTamano === "medio litro" || 
                           (nombreTamano.includes("litro") && nombreTamano.includes(categoriaEnNombre.split(' ')[0]));
                });
            }
            
            console.log("Tamaños filtrados:", tamanosAplicables);
            setTamanosDisponibles(tamanosAplicables);
            setLoadingTamanos(false);
            return tamanosAplicables.length > 0;
        } catch (err) {
            console.error("Error cargando tamaños:", err);
            setLoadingTamanos(false);
            return false;
        }
    };
    
    // Ahora al agregar un producto, primero mostramos la pantalla de cantidad
    const agregarProducto = (producto) => {
        setProductoConCantidad(producto);
        setCantidad(1);
        setSaborSeleccionado(null);
    };

    // Después de seleccionar la cantidad, verificamos si tiene sabores
    const continuarDespuesDeCantidad = async () => {
        if (!productoConCantidad) return;

        const esPulque = productoConCantidad.categoria === "Pulque";
        console.log("¿Es pulque?", esPulque);
        
        // Para pulques, primero mostramos selección de sabores 
        if (esPulque) {
            const tieneSabores = await cargarSabores(productoConCantidad.id);
            console.log("¿Tiene sabores?", tieneSabores);
            
            if (tieneSabores) {
                // Si tiene sabores, mostrar pantalla de selección de sabores
                setProductoConSabor(productoConCantidad);
                setNotasProducto(""); // Limpiar notas
                setProductoConCantidad(null);
                setSeleccionTamano(false);
            } else {
                // Si no tiene sabores (extraño para pulque), mostrar tamaños directamente
                const tieneTamanos = await cargarTamanos(productoConCantidad.id);
                console.log("¿Tiene tamaños?", tieneTamanos);
                
                if (tieneTamanos) {
                    setSeleccionTamano(true);
                    setProductoConSabor(null);
                    setProductoConCantidad(null);
                } else {
                    // Si no tiene sabores ni tamaños, mostrar notas
                    setProductoEditandoNotas({...productoConCantidad, sabor_id: null});
                    setNotasProducto("");
                    setProductoConCantidad(null);
                }
            }
        } else {
            // Para productos no-pulque, verificar si tiene sabores
            const tieneSabores = await cargarSabores(productoConCantidad.id);
            console.log("¿Tiene sabores? (no-pulque)", tieneSabores);
            
            if (tieneSabores) {
                // Si tiene sabores, mostrar selector
                setProductoConSabor(productoConCantidad);
                setNotasProducto(""); // Limpiar notas
                setProductoConCantidad(null);
            } else {
                // Si no tiene sabores, mostrar pantalla de notas primero
                setProductoEditandoNotas({...productoConCantidad, sabor_id: null});
                setNotasProducto("");
                setProductoConCantidad(null);
            }
        }
    };

    const agregarProductoConSabor = async (sabor) => {
        console.log("Sabor seleccionado:", sabor);
        if (!productoConSabor) return;
        
        const esPulque = productoConSabor.categoria === "Pulque";
        
        if (esPulque) {
            // Para pulques, guardar sabor y mostrar tamaños
            setSaborSeleccionado(sabor);
            
            const tieneTamanos = await cargarTamanos(productoConSabor.id);
            console.log("¿Tiene tamaños para este sabor?", tieneTamanos);
            
            if (tieneTamanos) {
                setProductoConSabor(null);
                setSeleccionTamano(true);
            } else {
                // Si no tiene tamaños, ir a notas
                setProductoEditandoNotas({
                    ...productoConSabor,
                    sabor_id: sabor.id,
                    sabor_nombre: sabor.nombre,
                    sabor_categoria: sabor.categoria_nombre,
                    precio_adicional: parseFloat(sabor.precio_adicional || 0)
                });
                setProductoConSabor(null);
            }
        } else {
            // Para productos normales, ir a notas
            setProductoEditandoNotas({
                ...productoConSabor,
                sabor_id: sabor.id,
                sabor_nombre: sabor.nombre,
                sabor_categoria: sabor.categoria_nombre,
                precio_adicional: parseFloat(sabor.precio_adicional || 0)
            });
            setProductoConSabor(null);
        }
    };
    
    // Nueva función para seleccionar tamaño
    const seleccionarTamano = (tamano) => {
        // Combinamos el producto con sabor y tamaño
        const datosCombinados = {
            ...productoConSabor ?? productos.find(p => p.id === saborSeleccionado.producto_id),
            sabor_id: saborSeleccionado?.id,
            sabor_nombre: saborSeleccionado?.nombre,
            sabor_categoria: saborSeleccionado?.categoria_nombre,
            precio_adicional: parseFloat(saborSeleccionado?.precio_adicional || 0),
            tamano_id: tamano.id,
            tamano_nombre: tamano.nombre,
            tamano_precio: parseFloat(tamano.precio_adicional || 0)
        };
        
        setProductoEditandoNotas(datosCombinados);
        setSeleccionTamano(false);
    };

    const confirmarAgregarProducto = () => {
        if (!productoEditandoNotas) return;
        
        const { id, sabor_id, sabor_nombre, sabor_categoria, precio_adicional, tamano_id, tamano_nombre, tamano_precio } = productoEditandoNotas;
        
        // Verificar si ya existe este producto con este sabor, tamaño y notas
        const yaExiste = seleccionados.find(
            (p) => p.id === id && 
                   p.sabor_id === sabor_id && 
                   p.tamano_id === tamano_id &&
                   ((p.notas || "") === (notasProducto || ""))
        );
        
        if (yaExiste) {
            setSeleccionados((prev) =>
                prev.map((p) =>
                    p.id === id && 
                    p.sabor_id === sabor_id && 
                    p.tamano_id === tamano_id &&
                    ((p.notas || "") === (notasProducto || ""))
                        ? { ...p, cantidad: p.cantidad + cantidad } 
                        : p
                )
            );
        } else {
            // Calcular precio total con adicionales
            let precioTotal = parseFloat(productoEditandoNotas.precio);
            
            if (precio_adicional) {
                precioTotal += precio_adicional;
            }
            
            if (tamano_precio) {
                precioTotal += tamano_precio;
            }
            
            setSeleccionados((prev) => [
                ...prev, 
                { 
                    ...productoEditandoNotas, 
                    cantidad,
                    precio_original: parseFloat(productoEditandoNotas.precio),
                    precio: precioTotal,
                    notas: notasProducto.trim() || null
                }
            ]);
        }
        
        // Limpiar estados
        setProductoEditandoNotas(null);
        setNotasProducto("");
        setSaborSeleccionado(null);
    };

    const cancelarSeleccionSabor = () => {
        setProductoConSabor(null);
        setProductoConCantidad(productoConSabor);
    };
    
    const cancelarSeleccionTamano = () => {
        setSeleccionTamano(false);
        setProductoConSabor(productos.find(p => p.id === saborSeleccionado?.producto_id));
        setSaborSeleccionado(null);
    };

    const cancelarAgregarProducto = () => {
        setProductoEditandoNotas(null);
        setNotasProducto("");
        
        // Si venimos de seleccionar tamaño, volver ahí
        if (saborSeleccionado) {
            setSeleccionTamano(true);
        } 
        // Si venimos de seleccionar sabor, volver ahí
        else if (productoConSabor) {
            setProductoConSabor(productoEditandoNotas);
        } 
        // Si venimos de cantidad, volver ahí
        else {
            setProductoConCantidad(productoEditandoNotas);
        }
    };

    const cancelarSeleccionCantidad = () => {
        setProductoConCantidad(null);
        setCantidad(1);
    };

    const quitarProducto = (id, sabor_id, tamano_id, notas) => {
        setSeleccionados((prev) =>
            prev
            .map((p) => (
                p.id === id && 
                p.sabor_id === sabor_id && 
                p.tamano_id === tamano_id &&
                ((p.notas || "") === (notas || "")) 
                    ? { ...p, cantidad: p.cantidad - 1 } 
                    : p
            ))
            .filter((p) => p.cantidad > 0)
        );
    };

    const aumentarProducto = (id, sabor_id, tamano_id, notas) => {
        setSeleccionados((prev) =>
            prev.map((p) => (
                p.id === id && 
                p.sabor_id === sabor_id && 
                p.tamano_id === tamano_id &&
                ((p.notas || "") === (notas || "")) 
                    ? { ...p, cantidad: p.cantidad + 1 } 
                    : p
            ))
        );
    };

    const crearOrden = async () => {
        if (!presoSeleccionado && !nombreLibre.trim()) {
            alert("Debes seleccionar un cliente o escribir un nombre");
            return;
        }
        if (seleccionados.length === 0) {
            alert("Agrega al menos un producto");
            return;
        }
        
        const body = {
            empleado_id: 1, // temporal, puedes leerlo del token luego
            preso_id: presoSeleccionado ? Number(presoSeleccionado) : null,
            nombre_cliente: nombreLibre || null,
            productos: seleccionados.map((p) => ({
                producto_id: p.id,
                cantidad: p.cantidad,
                precio_unitario: p.precio, // Enviar el precio unitario con adicionales incluidos
                sabor_id: p.sabor_id || null,
                tamano_id: p.tamano_id || null,
                notas: p.notas || null
            })),
        };
        
        try {
            const res = await fetch("http://localhost:3000/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            
            if (res.ok) {
                alert("Orden creada con éxito");
                window.location.href = "/ordenes";
            } else {
                const data = await res.json();
                alert("Error al crear orden: " + data.error);
            }
        } catch (err) {
            alert("Error de conexión");
        }
    };

    // Pantalla de selección de cantidad
    if (productoConCantidad) {
        return (
            <div className="bg-vino rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">{productoConCantidad.nombre}</h2>
                    <button 
                        onClick={cancelarSeleccionCantidad}
                        className="text-gray-300 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
                
                <p className="text-sm">{productoConCantidad.descripcion}</p>
                <p className="text-amarillo font-bold">${parseFloat(productoConCantidad.precio).toFixed(2)}</p>
                
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
                    onClick={continuarDespuesDeCantidad}
                    className="w-full bg-amarillo text-negro py-3 rounded-full font-bold hover:bg-yellow-500"
                >
                    Continuar
                </button>
            </div>
        );
    }

    // Pantalla de edición de notas
    if (productoEditandoNotas) {
        return (
            <div className="bg-vino rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">{productoEditandoNotas.nombre} ({cantidad})</h2>
                    <button 
                        onClick={cancelarAgregarProducto}
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
                        value={notasProducto}
                        onChange={(e) => setNotasProducto(e.target.value)}
                        placeholder="Sin cebolla, extra queso, etc."
                        className="w-full px-4 py-2 rounded bg-negro text-white placeholder:text-gray-400 border border-amarillo"
                        rows={3}
                    />
                </div>
                
                <button
                    onClick={confirmarAgregarProducto}
                    className="w-full bg-amarillo text-negro py-3 rounded font-bold"
                >
                    Agregar a la Orden
                </button>
            </div>
        );
    }

    // Si hay un producto con sabores para seleccionar
    if (productoConSabor) {
        return (
            <div className="bg-vino rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Selecciona un sabor para {productoConSabor.nombre} ({cantidad})</h2>
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
                                onClick={() => agregarProductoConSabor(sabor)}
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
    
    // NUEVA pantalla de selección de tamaño
    if (seleccionTamano && tamanosDisponibles.length > 0) {
        return (
            <div className="bg-vino rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                        Selecciona un tamaño 
                        {saborSeleccionado ? ` para ${saborSeleccionado.nombre}` : ''}
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

    return (
        <div className="space-y-6">
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
                        value={presoSeleccionado || ""}
                        onChange={(e) => {
                            setPresoSeleccionado(e.target.value || null);
                            setNombreLibre("");
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
                {seleccionados.length > 0 && (
                    <div className="bg-negro rounded p-4 space-y-3">
                        <h3 className="font-bold text-amarillo">Productos seleccionados</h3>
                        {seleccionados.map((prod, index) => (
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
                                        onClick={() => aumentarProducto(prod.id, prod.sabor_id, prod.tamano_id, prod.notas)}
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
                            Total: ${seleccionados.reduce((sum, prod) => sum + (prod.precio * prod.cantidad), 0).toFixed(2)}
                        </p>
                        <button
                            onClick={crearOrden}
                            className="w-full bg-amarillo text-negro p-3 rounded font-bold hover:bg-yellow-500 mt-4"
                        >
                            Crear Orden
                        </button>
                    </div>
                )}
                {seleccionados.length === 0 && (
                    <div className="bg-negro/50 rounded p-4 text-center">
                        <p className="text-gray-400">No hay productos seleccionados</p>
                    </div>
                )}
            </div>

            <hr className="my-6 border-amarillo" />
            <h2 className="text-lg font-bold text-amarillo">Seleccionar productos</h2>
            
            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={filtroNombre}
                        onChange={(e) => setFiltroNombre(e.target.value)}
                        className="w-full px-4 py-3 pl-10 rounded-full bg-vino/70 text-white placeholder:text-gray-300"
                    />
                    <span className="absolute left-3 top-3">🔍</span>
                </div>
                
                <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full p-2 rounded bg-negro text-white border border-amarillo"
                >
                    <option value="">Todas las categorías</option>
                    {[...new Set(productos.map(p => p.categoria).filter(Boolean))].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {productos
                    .filter((p) => {
                        const textoBusqueda = filtroNombre.toLowerCase();
                        const coincideNombre = p.nombre.toLowerCase().includes(textoBusqueda);
                        const coincideCategoriaTexto = p.categoria && p.categoria.toLowerCase().includes(textoBusqueda);
                        const coincideCategoriaDesplegable = filtroCategoria === "" || p.categoria === filtroCategoria;
                        
                        return (textoBusqueda === "" || coincideNombre || coincideCategoriaTexto) 
                               && coincideCategoriaDesplegable;
                    })
                    .map((prod) => (
                        <div
                            key={prod.id}
                            onClick={() => agregarProducto(prod)}
                            className="bg-vino/80 rounded-xl p-4 cursor-pointer hover:bg-vino transition"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold">{prod.nombre}</h3>
                                    {prod.descripcion && (
                                        <p className="text-sm text-gray-300 line-clamp-2">{prod.descripcion}</p>
                                    )}
                                </div>
                                <p className="text-amarillo font-bold">${parseFloat(prod.precio).toFixed(2)}</p>
                            </div>
                            <div className="mt-2">
                                <span className="text-xs bg-negro/50 px-2 py-1 rounded">
                                    {prod.categoria}
                                </span>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
