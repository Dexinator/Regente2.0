import { useState, useEffect } from "react";
import { API_URL } from "../utils/api.js";
import { getToken } from "../utils/auth.js";

export default function SentenciasPanel() {
  const [sentencias, setSentencias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [sabores, setSabores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Estados para el formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    activa: true
  });
  
  // Estados para los productos de la sentencia
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [productoNuevo, setProductoNuevo] = useState({
    producto_id: "",
    cantidad: 1,
    sabor_id: "",
    tamano_id: "",
    ingrediente_id: "",
    es_opcional: false,
    grupo_opcion: null,
    precio_unitario: 0
  });
  
  // Estado para mostrar detalles
  const [sentenciaDetalle, setSentenciaDetalle] = useState(null);
  
  // Estados para variantes específicas del producto
  const [saboresProducto, setSaboresProducto] = useState([]);
  const [tamanosProducto, setTamanosProducto] = useState([]);
  const [loadingVariantes, setLoadingVariantes] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar sentencias, productos y sabores en paralelo
      const [sentenciasRes, productosRes, saboresRes] = await Promise.all([
        fetch(`${API_URL}/sentencias`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }),
        fetch(`${API_URL}/products`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }),
        fetch(`${API_URL}/products/sabores/todos`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
      ]);
      
      if (!sentenciasRes.ok || !productosRes.ok || !saboresRes.ok) {
        throw new Error("Error al cargar datos");
      }
      
      const [sentenciasData, productosData, saboresData] = await Promise.all([
        sentenciasRes.json(),
        productosRes.json(),
        saboresRes.json()
      ]);
      
      setSentencias(sentenciasData);
      setProductos(productosData);
      setSabores(saboresData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalleSentencia = async (sentenciaId) => {
    try {
      const response = await fetch(`${API_URL}/sentencias/${sentenciaId}/productos`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (!response.ok) throw new Error("Error al cargar detalles");
      
      const data = await response.json();
      console.log("Datos recibidos del backend:", data);
      
      // Adaptar la estructura para el modal
      setSentenciaDetalle({
        ...data.sentencia,
        productos_fijos: data.productos?.fijos || [],
        productos_opcionales: data.productos?.opcionales || []
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (productosSeleccionados.length === 0) {
      alert("Debe agregar al menos un producto a la sentencia");
      return;
    }
    
    try {
      const sentenciaData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio),
        activa: formData.activa,
        productos: productosSeleccionados
      };
      
      const url = editando 
        ? `${API_URL}/sentencias/${editando.id}`
        : `${API_URL}/sentencias`;
        
      const method = editando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(sentenciaData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar sentencia');
      }
      
      await cargarDatos();
      limpiarFormulario();
      alert(editando ? 'Sentencia actualizada' : 'Sentencia creada');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditar = async (sentencia) => {
    setEditando(sentencia);
    setFormData({
      nombre: sentencia.nombre,
      descripcion: sentencia.descripcion || "",
      precio: sentencia.precio,
      activa: sentencia.activa
    });
    
    // Cargar productos de la sentencia
    try {
      const response = await fetch(`${API_URL}/sentencias/${sentencia.id}/productos`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (!response.ok) throw new Error("Error al cargar productos");
      
      const data = await response.json();
      const productosFlat = [];
      
      // Aplanar productos fijos y opcionales
      if (data.productos_fijos) {
        productosFlat.push(...data.productos_fijos);
      }
      if (data.productos_opcionales) {
        data.productos_opcionales.forEach(grupo => {
          productosFlat.push(...grupo.productos);
        });
      }
      
      setProductosSeleccionados(productosFlat);
    } catch (err) {
      alert(err.message);
    }
    
    // Limpiar las variantes al editar
    setSaboresProducto([]);
    setTamanosProducto([]);
    
    setMostrarFormulario(true);
  };

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Desactivar la sentencia "${nombre}"?`)) return;
    
    try {
      const response = await fetch(`${API_URL}/sentencias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      
      if (!response.ok) throw new Error("Error al desactivar sentencia");
      
      await cargarDatos();
      alert('Sentencia desactivada');
    } catch (err) {
      alert(err.message);
    }
  };

  const agregarProducto = () => {
    if (!productoNuevo.producto_id) {
      alert("Seleccione un producto");
      return;
    }
    
    const producto = productos.find(p => p.id === parseInt(productoNuevo.producto_id));
    const sabor = sabores.find(s => s.id === parseInt(productoNuevo.sabor_id));
    const tamano = sabores.find(s => s.id === parseInt(productoNuevo.tamano_id));
    const ingrediente = sabores.find(s => s.id === parseInt(productoNuevo.ingrediente_id));
    
    const nuevoProducto = {
      ...productoNuevo,
      producto_id: parseInt(productoNuevo.producto_id),
      producto_nombre: producto.nombre,
      sabor_nombre: sabor?.nombre,
      tamano_nombre: tamano?.nombre,
      ingrediente_nombre: ingrediente?.nombre
    };
    
    setProductosSeleccionados([...productosSeleccionados, nuevoProducto]);
    
    // Limpiar formulario de producto
    setProductoNuevo({
      producto_id: "",
      cantidad: 1,
      sabor_id: "",
      tamano_id: "",
      ingrediente_id: "",
      es_opcional: false,
      grupo_opcion: null,
      precio_unitario: 0
    });
    
    // Limpiar variantes
    setSaboresProducto([]);
    setTamanosProducto([]);
  };

  const quitarProducto = (index) => {
    setProductosSeleccionados(productosSeleccionados.filter((_, i) => i !== index));
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      precio: "",
      activa: true
    });
    setProductosSeleccionados([]);
    setEditando(null);
    setMostrarFormulario(false);
    // Limpiar variantes del producto
    setSaboresProducto([]);
    setTamanosProducto([]);
  };

  // Cargar variantes específicas cuando se selecciona un producto
  const cargarVariantesProducto = async (productoId) => {
    if (!productoId) {
      setSaboresProducto([]);
      setTamanosProducto([]);
      return;
    }

    setLoadingVariantes(true);
    try {
      // Cargar sabores del producto
      const saboresRes = await fetch(`${API_URL}/products/sabores/producto/${productoId}?tipo=sabor_comida`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (saboresRes.ok) {
        const saboresData = await saboresRes.json();
        setSaboresProducto(saboresData);
      }

      // Cargar tamaños del producto
      const tamanosRes = await fetch(`${API_URL}/products/sabores/producto/${productoId}?tipo=tamano`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (tamanosRes.ok) {
        const tamanosData = await tamanosRes.json();
        setTamanosProducto(tamanosData);
      }
    } catch (err) {
      console.error("Error cargando variantes:", err);
    } finally {
      setLoadingVariantes(false);
    }
  };

  const getSaboresPorTipo = (tipo) => {
    return sabores.filter(s => s.categoria_nombre && s.categoria_nombre.toLowerCase().includes(tipo));
  };

  if (loading) return <div className="text-center py-8">Cargando sentencias...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amarillo">Gestión de Sentencias</h1>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-amarillo text-negro px-6 py-2 rounded font-bold hover:bg-yellow-500"
        >
          + Nueva Sentencia
        </button>
      </div>

      {/* Lista de sentencias */}
      <div className="grid gap-4">
        {sentencias.map(sentencia => (
          <div key={sentencia.id} className="bg-vino rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{sentencia.nombre}</h3>
                  {!sentencia.activa && (
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                      Inactiva
                    </span>
                  )}
                </div>
                {sentencia.descripcion && (
                  <p className="text-gray-300 mt-1">{sentencia.descripcion}</p>
                )}
                <p className="text-amarillo font-bold text-lg mt-2">
                  ${parseFloat(sentencia.precio).toFixed(2)}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => cargarDetalleSentencia(sentencia.id)}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Ver Detalle
                </button>
                <button
                  onClick={() => handleEditar(sentencia)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleEliminar(sentencia.id, sentencia.nombre)}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Desactivar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de detalle */}
      {sentenciaDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-vino rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{sentenciaDetalle.nombre}</h2>
              <button
                onClick={() => setSentenciaDetalle(null)}
                className="text-gray-300 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {sentenciaDetalle.productos_fijos && sentenciaDetalle.productos_fijos.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold mb-2">Productos Fijos:</h3>
                <div className="space-y-2">
                  {sentenciaDetalle.productos_fijos.map((prod, idx) => (
                    <div key={idx} className="bg-negro p-2 rounded">
                      <p>{prod.cantidad}x {prod.producto_nombre}</p>
                      {prod.sabor_nombre && <p className="text-sm text-gray-400">Sabor: {prod.sabor_nombre}</p>}
                      {prod.tamano_nombre && <p className="text-sm text-gray-400">Tamaño: {prod.tamano_nombre}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {sentenciaDetalle.productos_opcionales && sentenciaDetalle.productos_opcionales.length > 0 && (
              <div>
                <h3 className="font-bold mb-2">Productos Opcionales:</h3>
                {sentenciaDetalle.productos_opcionales.map((grupo, idx) => (
                  <div key={idx} className="mb-3">
                    <p className="text-sm text-amarillo mb-1">Grupo {grupo.grupo}:</p>
                    <div className="space-y-2 pl-4">
                      {grupo.productos.map((prod, pidx) => (
                        <div key={pidx} className="bg-negro p-2 rounded">
                          <p>{prod.cantidad}x {prod.producto_nombre}</p>
                          {prod.sabor_nombre && <p className="text-sm text-gray-400">Sabor: {prod.sabor_nombre}</p>}
                          {prod.tamano_nombre && <p className="text-sm text-gray-400">Tamaño: {prod.tamano_nombre}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-vino rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editando ? 'Editar Sentencia' : 'Nueva Sentencia'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Nombre:</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                    className="w-full px-4 py-2 rounded bg-negro text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-2">Precio:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: e.target.value})}
                    required
                    className="w-full px-4 py-2 rounded bg-negro text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Descripción:</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-4 py-2 rounded bg-negro text-white"
                  rows="2"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={formData.activa}
                  onChange={(e) => setFormData({...formData, activa: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="activa" className="text-sm">Sentencia activa</label>
              </div>
              
              {/* Sección de productos */}
              <div className="border-t pt-4">
                <h3 className="font-bold mb-3">Productos de la Sentencia</h3>
                
                {/* Formulario para agregar producto */}
                <div className="bg-negro p-4 rounded mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1">Producto:</label>
                      <select
                        value={productoNuevo.producto_id}
                        onChange={(e) => {
                          const productoId = e.target.value;
                          setProductoNuevo({...productoNuevo, producto_id: productoId, sabor_id: "", tamano_id: ""});
                          cargarVariantesProducto(productoId);
                        }}
                        className="w-full px-2 py-1 rounded bg-vino text-white text-sm"
                      >
                        <option value="">Seleccionar producto</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} - ${p.precio}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs mb-1">Cantidad:</label>
                      <input
                        type="number"
                        value={productoNuevo.cantidad}
                        onChange={(e) => setProductoNuevo({...productoNuevo, cantidad: parseInt(e.target.value)})}
                        min="1"
                        className="w-full px-2 py-1 rounded bg-vino text-white text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs mb-1">Sabor (opcional):</label>
                      <select
                        value={productoNuevo.sabor_id}
                        onChange={(e) => setProductoNuevo({...productoNuevo, sabor_id: e.target.value})}
                        className="w-full px-2 py-1 rounded bg-vino text-white text-sm"
                        disabled={!productoNuevo.producto_id || loadingVariantes}
                      >
                        <option value="">Sin sabor predefinido</option>
                        {saboresProducto.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} {s.precio_adicional > 0 ? `(+$${s.precio_adicional})` : ''}
                          </option>
                        ))}
                      </select>
                      {loadingVariantes && <p className="text-xs text-gray-400 mt-1">Cargando sabores...</p>}
                    </div>
                    
                    <div>
                      <label className="block text-xs mb-1">Tamaño (opcional):</label>
                      <select
                        value={productoNuevo.tamano_id}
                        onChange={(e) => setProductoNuevo({...productoNuevo, tamano_id: e.target.value})}
                        className="w-full px-2 py-1 rounded bg-vino text-white text-sm"
                        disabled={!productoNuevo.producto_id || loadingVariantes}
                      >
                        <option value="">Sin tamaño predefinido</option>
                        {tamanosProducto.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} {s.precio_adicional > 0 ? `(+$${s.precio_adicional})` : ''}
                          </option>
                        ))}
                      </select>
                      {loadingVariantes && <p className="text-xs text-gray-400 mt-1">Cargando tamaños...</p>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="es_opcional"
                        checked={productoNuevo.es_opcional}
                        onChange={(e) => setProductoNuevo({...productoNuevo, es_opcional: e.target.checked})}
                      />
                      <label htmlFor="es_opcional" className="text-xs">Es opcional</label>
                    </div>
                    
                    {productoNuevo.es_opcional && (
                      <div>
                        <label className="block text-xs mb-1">Grupo opción:</label>
                        <input
                          type="number"
                          value={productoNuevo.grupo_opcion || ""}
                          onChange={(e) => setProductoNuevo({...productoNuevo, grupo_opcion: e.target.value ? parseInt(e.target.value) : null})}
                          min="1"
                          className="w-full px-2 py-1 rounded bg-vino text-white text-sm"
                          placeholder="Ej: 1"
                        />
                      </div>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={agregarProducto}
                    className="mt-3 bg-amarillo text-negro px-4 py-1 rounded text-sm font-bold hover:bg-yellow-500"
                  >
                    Agregar Producto
                  </button>
                </div>
                
                {/* Lista de productos agregados */}
                {productosSeleccionados.length > 0 && (
                  <div className="space-y-2">
                    {productosSeleccionados.map((prod, idx) => (
                      <div key={idx} className="bg-negro p-3 rounded flex justify-between items-center">
                        <div>
                          <p className="font-bold">
                            {prod.cantidad}x {prod.producto_nombre}
                            {prod.es_opcional && <span className="text-xs text-amarillo ml-2">(Opcional - Grupo {prod.grupo_opcion})</span>}
                          </p>
                          <div className="text-sm text-gray-400">
                            {prod.sabor_nombre && <span>Sabor: {prod.sabor_nombre} </span>}
                            {prod.tamano_nombre && <span>Tamaño: {prod.tamano_nombre} </span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => quitarProducto(idx)}
                          className="text-red-500 hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-amarillo text-negro py-2 rounded font-bold hover:bg-yellow-500"
                >
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="flex-1 bg-gray-600 text-white py-2 rounded font-bold hover:bg-gray-700"
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