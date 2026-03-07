import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";
import { getToken } from "../utils/auth.js";

export default function ProductosPanel() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  
  // Estados para el formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    costo: "",
    categoria: "",
    descripcion: ""
  });

  // Estados para variantes
  const [todasLasVariantes, setTodasLasVariantes] = useState([]);
  const [variantesSeleccionadas, setVariantesSeleccionadas] = useState([]);
  const [categoriasVariantes, setCategoriasVariantes] = useState([]);
  const [tiposVariantesDisponibles, setTiposVariantesDisponibles] = useState([]);
  const [mostrarGestorVariantes, setMostrarGestorVariantes] = useState(false);
  const [variantesFiltradas, setVariantesFiltradas] = useState([]);
  const [busquedaVariante, setBusquedaVariante] = useState("");
  
  // Estado para feedback
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      // Cargar productos, variantes y categorías en paralelo
      const [productosRes, variantesRes, categVariantesRes, tiposRes] = await Promise.all([
        fetch(`${API_URL}/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/products/sabores/todos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/products/sabores/categorias`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/products/categoria-tipos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (!productosRes.ok) throw new Error("Error al cargar productos");
      
      const productosData = await productosRes.json();
      const variantesData = variantesRes.ok ? await variantesRes.json() : [];
      const categVariantesData = categVariantesRes.ok ? await categVariantesRes.json() : [];
      const tiposData = tiposRes.ok ? await tiposRes.json() : [];
      
      setProductos(productosData);
      setTodasLasVariantes(variantesData);
      setCategoriasVariantes(categVariantesData);
      setTiposVariantesDisponibles(tiposData);
      
      // Extraer categorías únicas de productos
      const categoriasUnicas = [...new Set(productosData.map(p => p.categoria))].filter(Boolean);
      setCategorias(categoriasUnicas);
    } catch (err) {
      setError(err.message);
      mostrarMensaje("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarVariantesProducto = async (productoId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/products/${productoId}/variantes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const variantes = await response.json();
        setVariantesSeleccionadas(variantes.map(v => v.id));
      }
    } catch (err) {
      console.error("Error cargando variantes del producto:", err);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: "", texto: "" }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.precio || !formData.categoria) {
      mostrarMensaje("error", "Por favor completa todos los campos requeridos");
      return;
    }
    
    try {
      const token = getToken();
      const url = editando 
        ? `${API_URL}/products/${editando.id}`
        : `${API_URL}/products`;
        
      const method = editando ? 'PUT' : 'POST';
      
      const productoData = {
        nombre: formData.nombre,
        precio: parseFloat(formData.precio),
        costo: parseFloat(formData.costo) || 0,
        categoria: formData.categoria,
        descripcion: formData.descripcion || null
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productoData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar producto');
      }
      
      const productoGuardado = await response.json();
      
      // Guardar variantes si hay seleccionadas
      if (variantesSeleccionadas.length > 0) {
        await guardarVariantesProducto(productoGuardado.id);
      }
      
      await cargarDatos();
      limpiarFormulario();
      mostrarMensaje("exito", editando ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
    } catch (err) {
      mostrarMensaje("error", err.message);
    }
  };

  const guardarVariantesProducto = async (productoId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/products/${productoId}/variantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ variantes: variantesSeleccionadas })
      });
      
      if (!response.ok) {
        throw new Error("Error al guardar variantes");
      }
    } catch (err) {
      console.error("Error guardando variantes:", err);
    }
  };

  const handleEditar = async (producto) => {
    setEditando(producto);
    setFormData({
      nombre: producto.nombre,
      precio: producto.precio,
      costo: producto.costo || "",
      categoria: producto.categoria,
      descripcion: producto.descripcion || ""
    });
    
    // Cargar variantes del producto
    await cargarVariantesProducto(producto.id);
    
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${nombre}"?\n\nEsta acción no se puede deshacer.`)) return;
    
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Error al eliminar producto");
      
      await cargarDatos();
      mostrarMensaje("exito", 'Producto eliminado exitosamente');
    } catch (err) {
      mostrarMensaje("error", err.message);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: "",
      precio: "",
      costo: "",
      categoria: "",
      descripcion: ""
    });
    setVariantesSeleccionadas([]);
    setEditando(null);
    setMostrarFormulario(false);
    setMostrarGestorVariantes(false);
  };

  const toggleVariante = (varianteId) => {
    setVariantesSeleccionadas(prev => {
      if (prev.includes(varianteId)) {
        return prev.filter(id => id !== varianteId);
      } else {
        return [...prev, varianteId];
      }
    });
  };

  const productosFiltrados = productos.filter(producto => {
    const coincideCategoria = filtroCategoria === "todas" || producto.categoria === filtroCategoria;
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                           (producto.descripcion && producto.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideEstado = mostrarInactivos || producto.activo !== false;
    return coincideCategoria && coincideBusqueda && coincideEstado;
  });

  const calcularMargen = (precio, costo) => {
    if (!precio || !costo || precio === 0) return 0;
    return ((precio - costo) / precio * 100).toFixed(1);
  };

  const obtenerColorMargen = (margen) => {
    if (margen >= 70) return 'text-green-400';
    if (margen >= 50) return 'text-yellow-400';
    if (margen >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getTiposVariantesPorCategoria = (categoriaProducto) => {
    return tiposVariantesDisponibles
      .filter(t => t.categoria_producto === categoriaProducto)
      .map(t => t.tipo_variante);
  };

  // Filtrar variantes según búsqueda
  useEffect(() => {
    if (busquedaVariante) {
      setVariantesFiltradas(
        todasLasVariantes.filter(v => 
          v.nombre.toLowerCase().includes(busquedaVariante.toLowerCase()) ||
          v.categoria_nombre.toLowerCase().includes(busquedaVariante.toLowerCase())
        )
      );
    } else {
      setVariantesFiltradas(todasLasVariantes);
    }
  }, [busquedaVariante, todasLasVariantes]);

  if (loading) return (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amarillo mx-auto"></div>
        <p className="mt-4 text-gray-400">Cargando productos...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="text-center py-8">
      <p className="text-red-500 mb-4">{error}</p>
      <button onClick={cargarDatos} className="bg-vino px-4 py-2 rounded hover:bg-vino/80">
        Reintentar
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Mensaje de feedback */}
      {mensaje.texto && (
        <div className={`mb-4 p-4 rounded-lg ${
          mensaje.tipo === 'exito' ? 'bg-green-600' : 'bg-red-600'
        } text-white animate-fade-in`}>
          {mensaje.texto}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-amarillo">Gestión de Productos</h1>
          <p className="text-gray-400 mt-1">Administra el catálogo de productos del sistema</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-amarillo text-negro px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Producto
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-vino rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Buscar:</label>
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre o descripción..."
                className="w-full px-4 py-2 pl-10 rounded bg-negro text-white"
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-2">Categoría:</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full px-4 py-2 rounded bg-negro text-white"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Mostrar productos inactivos</span>
            </label>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-vino/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amarillo">{productosFiltrados.length}</p>
          <p className="text-sm text-gray-400">Productos</p>
        </div>
        <div className="bg-vino/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amarillo">{categorias.length}</p>
          <p className="text-sm text-gray-400">Categorías</p>
        </div>
        <div className="bg-vino/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amarillo">
            {productosFiltrados.filter(p => calcularMargen(p.precio, p.costo) >= 50).length}
          </p>
          <p className="text-sm text-gray-400">Margen &gt; 50%</p>
        </div>
        <div className="bg-vino/50 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amarillo">
            ${productosFiltrados.reduce((sum, p) => sum + parseFloat(p.precio || 0), 0).toFixed(2)}
          </p>
          <p className="text-sm text-gray-400">Valor total</p>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="bg-vino rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-negro">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Costo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Precio</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Margen</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Variantes</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {productosFiltrados.map(producto => (
                <tr key={producto.id} className="hover:bg-vino/80 transition">
                  <td className="px-4 py-3 text-sm">{producto.id}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-bold">{producto.nombre}</p>
                      {producto.descripcion && (
                        <p className="text-xs text-gray-400 mt-1">{producto.descripcion}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-negro">
                      {producto.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    ${parseFloat(producto.costo || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-amarillo font-bold">
                    ${parseFloat(producto.precio).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${obtenerColorMargen(calcularMargen(producto.precio, producto.costo))}`}>
                      {calcularMargen(producto.precio, producto.costo)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      {getTiposVariantesPorCategoria(producto.categoria).map(tipo => (
                        <span key={tipo} className="text-xs px-2 py-1 bg-negro rounded" title={tipo}>
                          {tipo === 'sabor_comida' ? '🍽️' : tipo === 'tamano' ? '📏' : '➕'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEditar(producto)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(producto.id, producto.nombre)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {productosFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No se encontraron productos con los filtros aplicados
            </div>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="mt-4 text-right text-sm text-gray-400">
        Mostrando {productosFiltrados.length} de {productos.length} productos
      </div>

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-vino rounded-lg p-6 max-w-2xl w-full my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editando ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button
                onClick={limpiarFormulario}
                className="text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-2">
                    Nombre del producto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                    className="w-full px-4 py-2 rounded bg-negro text-white"
                    placeholder="Ej: Chileatole"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    required
                    className="w-full px-4 py-2 rounded bg-negro text-white"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="nueva">+ Nueva categoría</option>
                  </select>
                  {formData.categoria === "nueva" && (
                    <input
                      type="text"
                      placeholder="Nombre de la nueva categoría"
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className="w-full px-4 py-2 rounded bg-negro text-white mt-2"
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">
                    Precio de venta <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({...formData, precio: e.target.value})}
                      required
                      className="w-full px-8 py-2 rounded bg-negro text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Costo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.costo}
                      onChange={(e) => setFormData({...formData, costo: e.target.value})}
                      className="w-full px-8 py-2 rounded bg-negro text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Margen de ganancia</label>
                  <div className={`text-2xl font-bold ${obtenerColorMargen(calcularMargen(formData.precio, formData.costo))}`}>
                    {calcularMargen(formData.precio, formData.costo)}%
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-4 py-2 rounded bg-negro text-white"
                  rows="2"
                  placeholder="Descripción opcional del producto"
                />
              </div>

              {/* Sección de variantes */}
              {formData.categoria && (
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Variantes disponibles</h3>
                    <button
                      type="button"
                      onClick={() => setMostrarGestorVariantes(!mostrarGestorVariantes)}
                      className="text-amarillo text-sm hover:underline"
                    >
                      {mostrarGestorVariantes ? 'Ocultar' : 'Gestionar'} variantes
                    </button>
                  </div>
                  
                  {mostrarGestorVariantes && (
                    <div className="bg-negro p-4 rounded mb-4">
                      <p className="text-sm text-gray-400 mb-3">
                        Selecciona las variantes que estarán disponibles para este producto
                      </p>
                      
                      {/* Búsqueda de variantes */}
                      <input
                        type="text"
                        value={busquedaVariante}
                        onChange={(e) => setBusquedaVariante(e.target.value)}
                        placeholder="Buscar variante..."
                        className="w-full px-3 py-2 rounded bg-vino text-white mb-3"
                      />
                      
                      {/* Lista de variantes por tipo */}
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {getTiposVariantesPorCategoria(formData.categoria).map(tipo => {
                          const variantesDeTipo = variantesFiltradas.filter(v => 
                            v.categoria_nombre.toLowerCase().includes(
                              tipo === 'sabor_comida' ? 'sabor' : 
                              tipo === 'tamano' ? 'tamaño' : 
                              'ingrediente'
                            )
                          );
                          
                          if (variantesDeTipo.length === 0) return null;
                          
                          return (
                            <div key={tipo}>
                              <h4 className="text-sm font-bold text-amarillo mb-2">
                                {tipo === 'sabor_comida' ? 'Sabores' : 
                                 tipo === 'tamano' ? 'Tamaños' : 
                                 'Ingredientes Extra'}
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {variantesDeTipo.map(variante => (
                                  <label
                                    key={variante.id}
                                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-amarillo"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={variantesSeleccionadas.includes(variante.id)}
                                      onChange={() => toggleVariante(variante.id)}
                                      className="rounded"
                                    />
                                    <span>
                                      {variante.nombre}
                                      {variante.precio_adicional > 0 && (
                                        <span className="text-xs text-gray-400 ml-1">
                                          (+${variante.precio_adicional})
                                        </span>
                                      )}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-3">
                        {variantesSeleccionadas.length} variantes seleccionadas
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amarillo text-negro py-3 rounded-lg font-bold hover:bg-yellow-500 transition"
                >
                  {editando ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}