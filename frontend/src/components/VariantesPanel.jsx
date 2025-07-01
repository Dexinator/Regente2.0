import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";
import { getToken } from "../utils/auth.js";

export default function VariantesPanel() {
  const [variantes, setVariantes] = useState([]);
  const [categoriasVariantes, setCategoriasVariantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  
  // Estados para el formulario de variantes
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoria_id: "",
    precio_adicional: "",
    disponible: true
  });
  
  // Estados para el formulario de categorías
  const [mostrarFormularioCategoria, setMostrarFormularioCategoria] = useState(false);
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const [formDataCategoria, setFormDataCategoria] = useState({
    nombre: "",
    tipo: ""
  });
  
  // Estado para feedback
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  
  // Estado para mostrar qué vista (variantes o categorías)
  const [vistaActiva, setVistaActiva] = useState("variantes");

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      // Cargar variantes y categorías en paralelo
      const [variantesRes, categoriasRes] = await Promise.all([
        fetch(`${API_URL}/variantes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/variantes/categorias`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (!variantesRes.ok) throw new Error("Error al cargar variantes");
      if (!categoriasRes.ok) throw new Error("Error al cargar categorías");
      
      const variantesData = await variantesRes.json();
      const categoriasData = await categoriasRes.json();
      
      setVariantes(variantesData);
      setCategoriasVariantes(categoriasData);
    } catch (err) {
      setError(err.message);
      mostrarMensaje("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: "", texto: "" }), 5000);
  };

  // Funciones para manejar variantes
  const handleSubmitVariante = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.categoria_id) {
      mostrarMensaje("error", "Por favor completa todos los campos requeridos");
      return;
    }
    
    try {
      const token = getToken();
      const url = editando 
        ? `${API_URL}/variantes/${editando.id}`
        : `${API_URL}/variantes`;
        
      const method = editando ? 'PUT' : 'POST';
      
      const varianteData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        categoria_id: parseInt(formData.categoria_id),
        precio_adicional: parseFloat(formData.precio_adicional) || 0,
        disponible: formData.disponible
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(varianteData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar variante');
      }
      
      await cargarDatos();
      limpiarFormularioVariante();
      mostrarMensaje("exito", editando ? 'Variante actualizada exitosamente' : 'Variante creada exitosamente');
    } catch (err) {
      mostrarMensaje("error", err.message);
    }
  };

  const handleEditarVariante = (variante) => {
    setEditando(variante);
    setFormData({
      nombre: variante.nombre,
      descripcion: variante.descripcion || "",
      categoria_id: variante.categoria_id,
      precio_adicional: variante.precio_adicional || "",
      disponible: variante.disponible
    });
    setMostrarFormulario(true);
  };

  const handleEliminarVariante = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar la variante "${nombre}"?\n\nEsto puede afectar a los productos que la usan.`)) return;
    
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/variantes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Error al eliminar variante");
      
      await cargarDatos();
      mostrarMensaje("exito", 'Variante eliminada exitosamente');
    } catch (err) {
      mostrarMensaje("error", err.message);
    }
  };

  const limpiarFormularioVariante = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      categoria_id: "",
      precio_adicional: "",
      disponible: true
    });
    setEditando(null);
    setMostrarFormulario(false);
  };

  // Funciones para manejar categorías
  const handleSubmitCategoria = async (e) => {
    e.preventDefault();
    
    if (!formDataCategoria.nombre || !formDataCategoria.tipo) {
      mostrarMensaje("error", "Por favor completa todos los campos requeridos");
      return;
    }
    
    try {
      const token = getToken();
      const url = editandoCategoria 
        ? `${API_URL}/variantes/categorias/${editandoCategoria.id}`
        : `${API_URL}/variantes/categorias`;
        
      const method = editandoCategoria ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formDataCategoria)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar categoría');
      }
      
      await cargarDatos();
      limpiarFormularioCategoria();
      mostrarMensaje("exito", editandoCategoria ? 'Categoría actualizada' : 'Categoría creada');
    } catch (err) {
      mostrarMensaje("error", err.message);
    }
  };

  const handleEditarCategoria = (categoria) => {
    setEditandoCategoria(categoria);
    setFormDataCategoria({
      nombre: categoria.nombre,
      tipo: categoria.tipo
    });
    setMostrarFormularioCategoria(true);
  };

  const handleEliminarCategoria = async (id, nombre) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?\n\nEsto eliminará todas las variantes asociadas.`)) return;
    
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/variantes/categorias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Error al eliminar categoría");
      
      await cargarDatos();
      mostrarMensaje("exito", 'Categoría eliminada');
    } catch (err) {
      mostrarMensaje("error", err.message);
    }
  };

  const limpiarFormularioCategoria = () => {
    setFormDataCategoria({
      nombre: "",
      tipo: ""
    });
    setEditandoCategoria(null);
    setMostrarFormularioCategoria(false);
  };

  // Filtrar variantes
  const variantesFiltradas = variantes.filter(variante => {
    const coincideCategoria = filtroCategoria === "todas" || variante.categoria_id === parseInt(filtroCategoria);
    const coincideTipo = filtroTipo === "todos" || variante.categoria_tipo === filtroTipo;
    const coincideBusqueda = variante.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                           (variante.descripcion && variante.descripcion.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideEstado = mostrarInactivos || variante.disponible;
    return coincideCategoria && coincideTipo && coincideBusqueda && coincideEstado;
  });

  // Obtener tipos únicos
  const tiposUnicos = [...new Set(categoriasVariantes.map(c => c.tipo))];

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case 'sabor_comida': return '🍽️';
      case 'tamano': return '📏';
      case 'ingrediente_extra': return '➕';
      default: return '📦';
    }
  };

  const obtenerNombreTipo = (tipo) => {
    switch (tipo) {
      case 'sabor_comida': return 'Sabor';
      case 'tamano': return 'Tamaño';
      case 'ingrediente_extra': return 'Ingrediente Extra';
      default: return tipo;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amarillo mx-auto"></div>
        <p className="mt-4 text-gray-400">Cargando variantes...</p>
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

      {/* Header con tabs */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-amarillo">Gestión de Variantes</h1>
            <p className="text-gray-400 mt-1">Administra sabores, tamaños e ingredientes extra</p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setVistaActiva("variantes")}
            className={`px-4 py-2 font-bold transition ${
              vistaActiva === "variantes" 
                ? "text-amarillo border-b-2 border-amarillo" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Variantes ({variantes.length})
          </button>
          <button
            onClick={() => setVistaActiva("categorias")}
            className={`px-4 py-2 font-bold transition ${
              vistaActiva === "categorias" 
                ? "text-amarillo border-b-2 border-amarillo" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Categorías ({categoriasVariantes.length})
          </button>
        </div>
      </div>

      {/* Vista de Variantes */}
      {vistaActiva === "variantes" && (
        <>
          {/* Botón nuevo */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-amarillo text-negro px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Variante
            </button>
          </div>

          {/* Filtros */}
          <div className="bg-vino rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  {categoriasVariantes.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Tipo:</label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full px-4 py-2 rounded bg-negro text-white"
                >
                  <option value="todos">Todos los tipos</option>
                  {tiposUnicos.map(tipo => (
                    <option key={tipo} value={tipo}>
                      {obtenerNombreTipo(tipo)}
                    </option>
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
                  <span className="text-sm">Mostrar inactivos</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tabla de variantes */}
          <div className="bg-vino rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-negro">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Categoría</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Precio Extra</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {variantesFiltradas.map(variante => (
                    <tr key={variante.id} className="hover:bg-vino/80 transition">
                      <td className="px-4 py-3 text-sm">{variante.id}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-2xl" title={obtenerNombreTipo(variante.categoria_tipo)}>
                          {obtenerIconoTipo(variante.categoria_tipo)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold">{variante.nombre}</p>
                          {variante.descripcion && (
                            <p className="text-xs text-gray-400 mt-1">{variante.descripcion}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-negro">
                          {variante.categoria_nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {variante.precio_adicional > 0 ? (
                          <span className="text-amarillo font-bold">
                            +${parseFloat(variante.precio_adicional).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">$0.00</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          variante.disponible 
                            ? 'bg-green-600 text-white' 
                            : 'bg-red-600 text-white'
                        }`}>
                          {variante.disponible ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditarVariante(variante)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarVariante(variante.id, variante.nombre)}
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
              
              {variantesFiltradas.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No se encontraron variantes con los filtros aplicados
                </div>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="mt-4 text-right text-sm text-gray-400">
            Mostrando {variantesFiltradas.length} de {variantes.length} variantes
          </div>
        </>
      )}

      {/* Vista de Categorías */}
      {vistaActiva === "categorias" && (
        <>
          {/* Botón nuevo */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setMostrarFormularioCategoria(true)}
              className="bg-amarillo text-negro px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Categoría
            </button>
          </div>

          {/* Lista de categorías */}
          <div className="space-y-4 max-w-4xl mx-auto">
            {categoriasVariantes.map(categoria => (
              <div key={categoria.id} className="bg-vino rounded-lg p-6 hover:bg-vino/80 transition">
                <div className="space-y-4">
                  {/* Header con icono y título */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-negro rounded-lg p-4">
                        <span className="text-5xl">{obtenerIconoTipo(categoria.tipo)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-2xl">{categoria.nombre}</h3>
                        <p className="text-gray-400 mt-1">{obtenerNombreTipo(categoria.tipo)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400 uppercase mb-1">Total Variantes</p>
                      <p className="font-bold text-3xl text-amarillo">{categoria.total_sabores || 0}</p>
                    </div>
                  </div>
                  
                  {/* Información adicional */}
                  <div className="bg-negro/50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-400 uppercase">ID de Categoría</p>
                        <p className="font-bold">{categoria.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase">Total Variantes</p>
                        <p className="font-bold text-2xl text-amarillo">{categoria.total_sabores || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleEditarCategoria(categoria)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminarCategoria(categoria.id, categoria.nombre)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {categoriasVariantes.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No hay categorías de variantes creadas
            </div>
          )}
        </>
      )}

      {/* Modal de formulario de variantes */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-vino rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editando ? 'Editar Variante' : 'Nueva Variante'}
              </h2>
              <button
                onClick={limpiarFormularioVariante}
                className="text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmitVariante} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                  className="w-full px-4 py-2 rounded bg-negro text-white"
                  placeholder="Ej: Piña"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                  required
                  className="w-full px-4 py-2 rounded bg-negro text-white"
                >
                  <option value="">Seleccionar categoría</option>
                  {categoriasVariantes.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre} ({obtenerNombreTipo(cat.tipo)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Precio adicional</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_adicional}
                    onChange={(e) => setFormData({...formData, precio_adicional: e.target.value})}
                    className="w-full px-8 py-2 rounded bg-negro text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-4 py-2 rounded bg-negro text-white"
                  rows="2"
                  placeholder="Descripción opcional"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="disponible"
                  checked={formData.disponible}
                  onChange={(e) => setFormData({...formData, disponible: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="disponible" className="text-sm">Variante activa</label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amarillo text-negro py-3 rounded-lg font-bold hover:bg-yellow-500 transition"
                >
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={limpiarFormularioVariante}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de formulario de categorías */}
      {mostrarFormularioCategoria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-vino rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editandoCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button
                onClick={limpiarFormularioCategoria}
                className="text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmitCategoria} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDataCategoria.nombre}
                  onChange={(e) => setFormDataCategoria({...formDataCategoria, nombre: e.target.value})}
                  required
                  className="w-full px-4 py-2 rounded bg-negro text-white"
                  placeholder="Ej: Sabores de Pulque"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formDataCategoria.tipo}
                  onChange={(e) => setFormDataCategoria({...formDataCategoria, tipo: e.target.value})}
                  required
                  className="w-full px-4 py-2 rounded bg-negro text-white"
                  disabled={editandoCategoria}
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="sabor_comida">Sabor</option>
                  <option value="tamano">Tamaño</option>
                  <option value="ingrediente_extra">Ingrediente Extra</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {editandoCategoria && "El tipo no se puede cambiar una vez creado"}
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amarillo text-negro py-3 rounded-lg font-bold hover:bg-yellow-500 transition"
                >
                  {editandoCategoria ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={limpiarFormularioCategoria}
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