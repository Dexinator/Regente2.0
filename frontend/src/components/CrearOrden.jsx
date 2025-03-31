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
            const res = await fetch(`http://localhost:3000/products/sabores/producto/${productoId}`);
            if (!res.ok) throw new Error("Error cargando sabores");
            const data = await res.json();
            setSaboresDisponibles(data);
            setLoadingSabores(false);
            return data.length > 0;
        } catch (err) {
            console.error("Error cargando sabores:", err);
            setLoadingSabores(false);
            return false;
        }
    };
    
    const agregarProducto = async (producto) => {
        // Verificar si el producto tiene sabores disponibles
        const tieneSabores = await cargarSabores(producto.id);
        
        if (tieneSabores) {
            // Si tiene sabores, mostrar selector
            setProductoConSabor(producto);
        } else {
            // Si no tiene sabores, agregar directamente
            const yaExiste = seleccionados.find((p) => p.id === producto.id && !p.sabor_id);
            if (yaExiste) {
                setSeleccionados((prev) =>
                    prev.map((p) =>
                        p.id === producto.id && !p.sabor_id ? { ...p, cantidad: p.cantidad + 1 } : p
                    )
                );
            } else {
                setSeleccionados((prev) => [...prev, { ...producto, cantidad: 1 }]);
            }
        }
    };

    const agregarProductoConSabor = (sabor) => {
        if (!productoConSabor) return;
        
        // Verificar si ya existe este producto con este sabor
        const yaExiste = seleccionados.find(
            (p) => p.id === productoConSabor.id && p.sabor_id === sabor.id
        );
        
        if (yaExiste) {
            setSeleccionados((prev) =>
                prev.map((p) =>
                    p.id === productoConSabor.id && p.sabor_id === sabor.id 
                        ? { ...p, cantidad: p.cantidad + 1 } 
                        : p
                )
            );
        } else {
            // Precio con posible adicional
            const precioTotal = parseFloat(productoConSabor.precio) + parseFloat(sabor.precio_adicional || 0);
            
            setSeleccionados((prev) => [
                ...prev, 
                { 
                    ...productoConSabor, 
                    cantidad: 1,
                    sabor_id: sabor.id,
                    sabor_nombre: sabor.nombre,
                    sabor_categoria: sabor.categoria_nombre,
                    precio_original: parseFloat(productoConSabor.precio),
                    precio_adicional: parseFloat(sabor.precio_adicional || 0),
                    precio: precioTotal
                }
            ]);
        }
        
        // Cerrar el selector de sabores
        setProductoConSabor(null);
        setSaboresDisponibles([]);
    };

    const cancelarSeleccionSabor = () => {
        setProductoConSabor(null);
        setSaboresDisponibles([]);
    };

    const quitarProducto = (id, sabor_id) => {
        setSeleccionados((prev) =>
            prev
            .map((p) => (p.id === id && p.sabor_id === sabor_id ? { ...p, cantidad: p.cantidad - 1 } : p))
            .filter((p) => p.cantidad > 0)
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
                sabor_id: p.sabor_id || null
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

    // Si hay un producto con sabores para seleccionar
    if (productoConSabor) {
        return (
            <div className="bg-vino rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Selecciona un sabor para {productoConSabor.nombre}</h2>
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
                            <div key={index} className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <div className="flex-1">
                                    <p className="font-bold">{prod.nombre}</p>
                                    {prod.sabor_nombre && (
                                        <p className="text-xs text-amarillo">
                                            Sabor: {prod.sabor_nombre} 
                                            {prod.sabor_categoria ? ` (${prod.sabor_categoria})` : ''}
                                            {prod.precio_adicional > 0 && ` +$${prod.precio_adicional}`}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => quitarProducto(prod.id, prod.sabor_id)}
                                        className="bg-vino text-white px-2 py-1 rounded-full text-xs"
                                    >
                                        -
                                    </button>
                                    <span className="text-sm">
                                        {prod.cantidad} × ${prod.precio.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <p className="font-bold text-right text-lg mt-2">
                            Total: ${seleccionados.reduce((sum, prod) => sum + (prod.precio * prod.cantidad), 0).toFixed(2)}
                        </p>
                    </div>
                )}
                <button
                    onClick={crearOrden}
                    className="w-full bg-amarillo text-negro p-3 rounded font-bold hover:bg-yellow-500"
                >
                    Crear Orden
                </button>
            </div>

            <hr className="my-6 border-amarillo" />
            <h2 className="text-lg font-bold text-amarillo">Seleccionar productos</h2>
            
            <div className="space-y-4">
                <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                    className="w-full p-2 rounded bg-negro text-white border border-amarillo placeholder:text-white/60"
                />
                
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
            
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
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
                        <button
                            key={prod.id}
                            onClick={() => agregarProducto(prod)}
                            className="bg-negro p-3 rounded text-left hover:bg-gray-800"
                        >
                            <p className="font-subtitulo">{prod.nombre}</p>
                            <p className="text-sm text-white/70">
                                ${prod.precio} · {prod.categoria}
                            </p>
                        </button>
                    ))}
            </div>
        </div>
    );
}
