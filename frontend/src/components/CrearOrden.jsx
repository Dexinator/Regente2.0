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
    
    const agregarProducto = (producto) => {
        const yaExiste = seleccionados.find((p) => p.id === producto.id);
        if (yaExiste) {
            setSeleccionados((prev) =>
                prev.map((p) =>
                    p.id === producto.id ? { ...p, cantidad: p.cantidad + 1 } : p
        )
    );
} else {
    setSeleccionados((prev) => [...prev, { ...producto, cantidad: 1 }]);
}
};

const quitarProducto = (id) => {
    setSeleccionados((prev) =>
        prev
    .map((p) => (p.id === id ? { ...p, cantidad: p.cantidad - 1 } : p))
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
            
            // Si hay texto de búsqueda, se filtra por nombre o categoría
            // Y luego se aplica el filtro del desplegable de categoría
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
    
    <hr className="my-6 border-amarillo" />
    <h2 className="text-lg font-bold text-amarillo">Resumen</h2>
    
    {seleccionados.length === 0 && <p className="text-sm text-gray-400">No hay productos seleccionados</p>}
    
    <ul className="text-sm space-y-1">
    {seleccionados.map((p) => (
        <li key={p.id} className="flex justify-between items-center">
        <span>{p.nombre} x{p.cantidad}</span>
        <div className="space-x-2">
        <button onClick={() => quitarProducto(p.id)} className="text-red-400">–</button>
        <button onClick={() => agregarProducto(p)} className="text-green-400">+</button>
        </div>
        </li>
    ))}
    </ul>
    
    
    <button
    onClick={crearOrden}
    className="w-full bg-amarillo text-negro py-2 rounded font-bold mt-4"
    >
    Crear orden
    </button>
    
    </div>
);
}
