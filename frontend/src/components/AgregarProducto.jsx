import { useState, useEffect } from "react";

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
  const [saboresDisponibles, setSaboresDisponibles] = useState([]);
  const [saborSeleccionado, setSaborSeleccionado] = useState(null);
  const [loadingSabores, setLoadingSabores] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (productoSeleccionado) {
      cargarSabores(productoSeleccionado.id);
    } else {
      setSaboresDisponibles([]);
      setSaborSeleccionado(null);
    }
  }, [productoSeleccionado]);

  const cargarSabores = async (productoId) => {
    setLoadingSabores(true);
    try {
      const res = await fetch(`http://localhost:3000/products/sabores/producto/${productoId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al cargar sabores");
      }
      
      setSaboresDisponibles(data);
      setLoadingSabores(false);
    } catch (error) {
      console.error("Error cargando sabores:", error);
      setLoadingSabores(false);
    }
  };

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
        p.descripcion.toLowerCase().includes(terminoBusqueda)
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
    setSaborSeleccionado(null);
  };

  const agregarProducto = async () => {
    if (!productoSeleccionado) return;
    
    setEnviando(true);
    
    try {
      const res = await fetch(`http://localhost:3000/orders/${orden_id}/productos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          producto_id: productoSeleccionado.id,
          cantidad,
          sabor_id: saborSeleccionado ? saborSeleccionado.id : null,
          notas: notas.trim() || null,
          empleado_id: 1 // Temporal, después obtener del token o contexto
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Error al agregar producto");
      }
      
      // Redireccionar a la página de gestión de la orden
      window.location.href = `/ordenes/${orden_id}`;
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudo agregar el producto. Intenta de nuevo.");
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

  if (productoSeleccionado) {
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
        
        {loadingSabores ? (
          <p className="text-sm text-gray-300">Cargando sabores...</p>
        ) : saboresDisponibles.length > 0 ? (
          <div className="pt-2">
            <label className="block mb-2 font-bold">Selecciona un sabor:</label>
            <select 
              value={saborSeleccionado ? saborSeleccionado.id : ""}
              onChange={(e) => {
                const saborId = e.target.value;
                const sabor = saboresDisponibles.find(s => s.id === parseInt(saborId));
                setSaborSeleccionado(sabor || null);
              }}
              className="w-full px-4 py-2 rounded bg-negro text-white border border-amarillo"
            >
              <option value="">-- Selecciona un sabor --</option>
              {saboresDisponibles.map(sabor => (
                <option key={sabor.id} value={sabor.id}>
                  {sabor.nombre} {sabor.categoria_nombre ? `(${sabor.categoria_nombre})` : ''}
                  {sabor.precio_adicional > 0 ? ` +$${sabor.precio_adicional}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        
        <div className="pt-4">
          <label className="block mb-2 font-bold">Cantidad:</label>
          <div className="flex items-center gap-3 bg-negro rounded p-2">
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
        
        <div className="flex justify-between items-center bg-negro/30 p-3 rounded mt-4">
          <div>
            <p className="text-sm">Total:</p>
            <p className="text-lg font-bold">
              ${(
                productoSeleccionado.precio * cantidad + 
                (saborSeleccionado ? (saborSeleccionado.precio_adicional || 0) * cantidad : 0)
              ).toFixed(2)}
            </p>
            {saborSeleccionado && saborSeleccionado.precio_adicional > 0 && (
              <p className="text-xs text-gray-300">
                Incluye +${(saborSeleccionado.precio_adicional * cantidad).toFixed(2)} por sabor
              </p>
            )}
          </div>
          
          <button
            onClick={agregarProducto}
            disabled={enviando || (saboresDisponibles.length > 0 && !saborSeleccionado)}
            className={`bg-amarillo text-negro px-6 py-2 rounded-full font-bold ${
              enviando || (saboresDisponibles.length > 0 && !saborSeleccionado) 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:bg-yellow-500"
            }`}
          >
            {enviando ? "Agregando..." : "Agregar a la Orden"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      
      <div className="space-y-3">
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
                  <p className="text-sm text-gray-300 line-clamp-2">{producto.descripcion}</p>
                </div>
                <p className="text-amarillo font-bold">${producto.precio.toFixed(2)}</p>
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