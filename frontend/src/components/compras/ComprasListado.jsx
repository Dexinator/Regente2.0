import { useState, useEffect } from "react";
import { 
  getCompras, 
  getCompraById,
  createCompra, 
  updateCompra, 
  deleteCompra,
  addItemCompra,
  updateItemCompra,
  deleteItemCompra,
  getProveedores,
  getInsumos,
  getItemsRequisicionPendientes
} from "../../utils/compras-api";
import { getUserRole, getUserName, getEmpleadoId } from "../../utils/auth";

export default function ComprasListado() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [itemsRequisicion, setItemsRequisicion] = useState([]);
  const [compraActual, setCompraActual] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarFormularioItem, setMostrarFormularioItem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroMetodoPago, setFiltroMetodoPago] = useState("");
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [compraAPagar, setCompraAPagar] = useState(null);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState("efectivo");
  const [formData, setFormData] = useState({
    proveedor_id: "",
    metodo_pago: "efectivo",
    solicito_factura: false,
    numero_factura: "",
    notas: "",
    total: 0
  });
  const [formItemData, setFormItemData] = useState({
    insumo_id: "",
    requisicion_item_id: null,
    precio_unitario: 0,
    cantidad: 1,
    unidad: "unidad"
  });
  const [usuarioId, setUsuarioId] = useState(null);

  useEffect(() => {
    // Obtener ID del usuario actual
    setUsuarioId(getEmpleadoId());
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarCompras();
  }, [filtroProveedor, filtroMetodoPago]);

  useEffect(() => {
    if (formData.proveedor_id) {
      cargarItemsRequisicionPendientes(formData.proveedor_id);
    }
  }, [formData.proveedor_id]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Cargar proveedores
      const proveedoresData = await getProveedores();
      setProveedores(proveedoresData);
      
      // Cargar insumos
      const insumosData = await getInsumos();
      setInsumos(insumosData);
      
      // Cargar compras
      await cargarCompras();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los datos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const cargarCompras = async () => {
    try {
      const filters = {};
      if (filtroProveedor) {
        filters.proveedor_id = filtroProveedor;
      }
      if (filtroMetodoPago) {
        filters.metodo_pago = filtroMetodoPago;
      }

      const data = await getCompras(filters);
      setCompras(data);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las compras. Intenta de nuevo.");
    }
  };

  const cargarItemsRequisicionPendientes = async (proveedorId) => {
    try {
      const items = await getItemsRequisicionPendientes(proveedorId);
      setItemsRequisicion(items);
    } catch (error) {
      console.error("Error:", error);
      // No mostrar error, simplemente dejar la lista vacía
      setItemsRequisicion([]);
    }
  };

  const verDetalleCompra = async (id) => {
    setError("");
    
    try {
      const compra = await getCompraById(id);
      setCompraActual(compra);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los detalles de la compra");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "insumo_id") {
      // Obtener la unidad de medida del insumo seleccionado
      const insumoSeleccionado = insumos.find(i => i.id === parseInt(value));
      if (insumoSeleccionado) {
        setFormItemData({
          ...formItemData,
          [name]: value,
          unidad: insumoSeleccionado.unidad_medida_default
        });
        return;
      }
    }

    if (name === "requisicion_item_id") {
      if (value) {
        // Si se seleccionó un item de requisición, llenar los datos del insumo
        const itemRequisicion = itemsRequisicion.find(i => i.id === parseInt(value));
        if (itemRequisicion) {
          setFormItemData({
            ...formItemData,
            requisicion_item_id: value,
            insumo_id: itemRequisicion.insumo_id,
            cantidad: itemRequisicion.cantidad,
            unidad: itemRequisicion.unidad
          });
          return;
        }
      } else {
        // Si se deseleccionó, mantener solo el insumo_id si existe
        setFormItemData({
          ...formItemData,
          requisicion_item_id: null
        });
        return;
      }
    }
    
    setFormItemData({
      ...formItemData,
      [name]: value
    });
  };

  const calcularSubtotal = () => {
    // El precio_unitario ahora representa el precio total pagado
    return parseFloat(formItemData.precio_unitario) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      const nuevaCompra = await createCompra({
        proveedor_id: formData.proveedor_id,
        usuario_id: usuarioId,
        total: 0, // Se actualizará al agregar items
        metodo_pago: formData.metodo_pago,
        solicito_factura: formData.solicito_factura,
        numero_factura: formData.numero_factura,
        notas: formData.notas,
        items: [] // Los items se agregarán después
      });
      
      resetForm();
      await cargarCompras();
      
      // Abrir la compra recién creada
      setCompraActual(nuevaCompra);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al crear la compra");
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!compraActual) return;
    
    try {
      await addItemCompra(compraActual.id, formItemData);
      
      // Recargar la compra actual
      const compraActualizada = await getCompraById(compraActual.id);
      setCompraActual(compraActualizada);
      
      resetFormItem();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al agregar el item");
    }
  };

  const eliminarItem = async (compraId, itemId) => {
    if (!confirm("¿Estás seguro de eliminar este item?")) return;
    
    setError("");
    
    try {
      await deleteItemCompra(compraId, itemId);
      
      // Recargar la compra actual
      const compraActualizada = await getCompraById(compraId);
      setCompraActual(compraActualizada);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al eliminar el item");
    }
  };

  const eliminarCompra = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta compra?")) return;
    
    setError("");
    
    try {
      await deleteCompra(id);
      
      if (compraActual && compraActual.id === id) {
        setCompraActual(null);
      }
      
      await cargarCompras();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al eliminar la compra");
    }
  };

  const resetForm = () => {
    setFormData({
      proveedor_id: "",
      metodo_pago: "efectivo",
      solicito_factura: false,
      numero_factura: "",
      notas: "",
      total: 0
    });
    setMostrarFormulario(false);
  };

  const resetFormItem = () => {
    setFormItemData({
      insumo_id: "",
      requisicion_item_id: null,
      precio_unitario: 0,
      cantidad: 1,
      unidad: "unidad"
    });
    setMostrarFormularioItem(false);
  };

  const abrirModalPago = (compra) => {
    setCompraAPagar(compra);
    setMetodoPagoSeleccionado("efectivo");
    setMostrarModalPago(true);
  };

  const cerrarModalPago = () => {
    setMostrarModalPago(false);
    setCompraAPagar(null);
    setMetodoPagoSeleccionado("efectivo");
  };

  const marcarComoPagado = async () => {
    if (!compraAPagar) return;

    setError("");

    try {
      await updateCompra(compraAPagar.id, {
        metodo_pago: metodoPagoSeleccionado
      });

      cerrarModalPago();
      await cargarCompras();

      // Si estamos viendo el detalle de esta compra, actualizarlo
      if (compraActual && compraActual.id === compraAPagar.id) {
        const compraActualizada = await getCompraById(compraAPagar.id);
        setCompraActual(compraActualizada);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al marcar como pagado");
    }
  };

  if (loading && compras.length === 0) {
    return <div className="text-center py-10">Cargando compras...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-subtitulo text-amarillo">Compras</h2>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value)}
            className="bg-negro border border-gray-700 rounded p-2 text-white"
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((proveedor) => (
              <option key={proveedor.id} value={proveedor.id}>
                {proveedor.nombre}
              </option>
            ))}
          </select>
          <select
            value={filtroMetodoPago}
            onChange={(e) => setFiltroMetodoPago(e.target.value)}
            className="bg-negro border border-gray-700 rounded p-2 text-white"
          >
            <option value="">Todos los métodos</option>
            <option value="pendiente de pago">⏳ Pendiente de Pago</option>
            <option value="efectivo">Efectivo</option>
            <option value="transfer bbva">Transfer BBVA</option>
            <option value="transfer Mercado Pago">Transfer Mercado Pago</option>
          </select>
          <button
            onClick={() => {
              setCompraActual(null);
              setMostrarFormulario(!mostrarFormulario);
            }}
            className="bg-vino text-white px-4 py-2 rounded-full font-bold"
          >
            {mostrarFormulario ? "Cancelar" : "Nueva Compra"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Formulario para nueva compra */}
      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="bg-negro/50 p-4 rounded-lg mb-6">
          <h3 className="text-xl text-amarillo mb-4">Nueva Compra</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-white mb-1">Proveedor *</label>
              <select
                name="proveedor_id"
                value={formData.proveedor_id}
                onChange={handleInputChange}
                required
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
              >
                <option value="">Seleccionar proveedor</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-white mb-1">Método de Pago *</label>
              <select
                name="metodo_pago"
                value={formData.metodo_pago}
                onChange={handleInputChange}
                required
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transfer bbva">Transfer BBVA</option>
                <option value="transfer Mercado Pago">Transfer Mercado Pago</option>
                <option value="pendiente de pago">Pendiente de Pago</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="solicito_factura"
                name="solicito_factura"
                checked={formData.solicito_factura}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label htmlFor="solicito_factura" className="text-white">
                Solicitar factura
              </label>
            </div>
            
            {formData.solicito_factura && (
              <div>
                <label className="block text-white mb-1">Número de Factura</label>
                <input
                  type="text"
                  name="numero_factura"
                  value={formData.numero_factura}
                  onChange={handleInputChange}
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />
              </div>
            )}
            
            <div className="md:col-span-2">
              <label className="block text-white mb-1">Notas</label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleInputChange}
                rows="3"
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
              ></textarea>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-700 text-white px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-amarillo text-negro px-4 py-2 rounded font-bold"
            >
              Crear Compra
            </button>
          </div>
        </form>
      )}

      {/* Vista de detalle de compra */}
      {compraActual && (
        <div className="bg-negro/50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl text-amarillo">
              Compra #{compraActual.id}
            </h3>
            <button
              onClick={() => setCompraActual(null)}
              className="bg-gray-700 text-white px-3 py-1 rounded"
            >
              Volver
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400">Proveedor:</p>
              <p className="text-white">{compraActual.proveedor_nombre || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-400">Fecha:</p>
              <p className="text-white">
                {new Date(compraActual.fecha_compra).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Método de Pago:</p>
              {compraActual.metodo_pago === "pendiente de pago" ? (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-sm bg-yellow-600 text-black font-bold">
                    ⏳ Pendiente de Pago
                  </span>
                  <button
                    onClick={() => abrirModalPago(compraActual)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold"
                  >
                    Marcar Pagado
                  </button>
                </div>
              ) : (
                <span className="px-2 py-1 rounded text-sm bg-green-900/50 text-green-200 capitalize">
                  {compraActual.metodo_pago}
                </span>
              )}
            </div>
            <div>
              <p className="text-gray-400">Total:</p>
              <p className="text-white">${compraActual.total_calculado || compraActual.total}</p>
            </div>
            {compraActual.solicito_factura && (
              <div>
                <p className="text-gray-400">Número de Factura:</p>
                <p className="text-white">{compraActual.numero_factura || "N/A"}</p>
              </div>
            )}
            {compraActual.notas && (
              <div className="md:col-span-2">
                <p className="text-gray-400">Notas:</p>
                <p className="text-white">{compraActual.notas}</p>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg text-white">Items</h4>
              <button
                onClick={() => setMostrarFormularioItem(!mostrarFormularioItem)}
                className="bg-vino text-white px-3 py-1 rounded"
              >
                {mostrarFormularioItem ? "Cancelar" : "Agregar Item"}
              </button>
            </div>
            
            {/* Formulario para agregar item */}
            {mostrarFormularioItem && (
              <form onSubmit={handleItemSubmit} className="bg-negro/30 p-3 rounded mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {/* Si hay items de requisición pendientes para este proveedor, mostrar selector */}
                  {itemsRequisicion.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-white mb-1">Item de Requisición (opcional)</label>
                      <select
                        name="requisicion_item_id"
                        value={formItemData.requisicion_item_id || ""}
                        onChange={handleItemInputChange}
                        className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                      >
                        <option value="">Ninguno - Compra directa</option>
                        {itemsRequisicion.map((item) => (
                          <option key={item.id} value={item.id}>
                            Req #{item.requisicion_id}: {item.insumo_nombre} - {item.cantidad} {item.unidad}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-white mb-1">Insumo *</label>
                    <select
                      name="insumo_id"
                      value={formItemData.insumo_id}
                      onChange={handleItemInputChange}
                      required
                      className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                      disabled={formItemData.requisicion_item_id}
                    >
                      <option value="">Seleccionar insumo</option>
                      {insumos.map((insumo) => (
                        <option key={insumo.id} value={insumo.id}>
                          {insumo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-white mb-1">Precio Total *</label>
                    <input
                      type="number"
                      name="precio_unitario"
                      value={formItemData.precio_unitario}
                      onChange={handleItemInputChange}
                      min="0.01"
                      step="0.01"
                      required
                      placeholder="Lo que pagaste"
                      className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white mb-1">Cantidad *</label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formItemData.cantidad}
                      onChange={handleItemInputChange}
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white mb-1">Unidad *</label>
                    <input
                      type="text"
                      name="unidad"
                      value={formItemData.unidad}
                      onChange={handleItemInputChange}
                      required
                      className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <p className="text-white text-right">
                      <span className="text-gray-400">Subtotal:</span> ${calcularSubtotal().toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-amarillo text-negro px-3 py-1 rounded font-bold"
                  >
                    Agregar
                  </button>
                </div>
              </form>
            )}
            
            {/* Lista de items */}
            {compraActual.items.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No hay items en esta compra
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead className="bg-vino/70 text-white">
                    <tr>
                      <th className="p-2 text-left">Insumo</th>
                      <th className="p-2 text-center">Cantidad</th>
                      <th className="p-2 text-center">Precio Total</th>
                      <th className="p-2 text-center">Requisición</th>
                      <th className="p-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compraActual.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-700">
                        <td className="p-2">{item.insumo_nombre}</td>
                        <td className="p-2 text-center">
                          {item.cantidad} {item.unidad}
                        </td>
                        <td className="p-2 text-center">
                          ${parseFloat(item.subtotal).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          {item.es_de_requisicion ? (
                            <span className="px-2 py-1 rounded text-xs bg-green-900/50 text-green-200">
                              #{item.requisicion_id}
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                              Directa
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => eliminarItem(compraActual.id, item.id)}
                            className="bg-red-700 text-white p-1 rounded"
                            title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => eliminarCompra(compraActual.id)}
              className="bg-red-700 text-white px-4 py-2 rounded"
            >
              Eliminar Compra
            </button>
          </div>
        </div>
      )}

      {/* Lista de compras */}
      {!compraActual && (
        <>
          {compras.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No hay compras registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead className="bg-vino text-white">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Proveedor</th>
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-center">Items</th>
                    <th className="p-2 text-center">Total</th>
                    <th className="p-2 text-center">Método</th>
                    <th className="p-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((compra) => {
                    const esPendiente = compra.metodo_pago === "pendiente de pago";
                    return (
                      <tr
                        key={compra.id}
                        className={`border-b border-gray-700 ${esPendiente ? "bg-yellow-900/20" : ""}`}
                      >
                        <td className="p-2">{compra.id}</td>
                        <td className="p-2">{compra.proveedor_nombre || "N/A"}</td>
                        <td className="p-2">
                          {new Date(compra.fecha_compra).toLocaleDateString()}
                        </td>
                        <td className="p-2 text-center">
                          {compra.total_items}
                        </td>
                        <td className="p-2 text-center">
                          ${parseFloat(compra.total_calculado || compra.total).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          {esPendiente ? (
                            <span className="px-2 py-1 rounded text-xs bg-yellow-600 text-black font-bold">
                              ⏳ Pendiente
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-green-900/50 text-green-200 capitalize">
                              {compra.metodo_pago}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center gap-2">
                            {esPendiente && (
                              <button
                                onClick={() => abrirModalPago(compra)}
                                className="bg-green-600 text-white p-1 rounded"
                                title="Marcar como pagado"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => verDetalleCompra(compra.id)}
                              className="bg-amarillo text-negro p-1 rounded"
                              title="Ver detalle"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => eliminarCompra(compra.id)}
                              className="bg-red-700 text-white p-1 rounded"
                              title="Eliminar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal para marcar como pagado */}
      {mostrarModalPago && compraAPagar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-negro border border-gray-700 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-xl text-amarillo font-bold">Marcar como Pagado</h3>
              <button
                onClick={cerrarModalPago}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4 p-3 bg-gray-800 rounded">
                <p className="text-gray-400 text-sm">Compra #{compraAPagar.id}</p>
                <p className="text-white font-bold">{compraAPagar.proveedor_nombre}</p>
                <p className="text-amarillo text-lg font-bold">
                  ${parseFloat(compraAPagar.total_calculado || compraAPagar.total).toFixed(2)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-white mb-2">Método de Pago Utilizado</label>
                <select
                  value={metodoPagoSeleccionado}
                  onChange={(e) => setMetodoPagoSeleccionado(e.target.value)}
                  className="w-full bg-negro border border-gray-700 rounded p-3 text-white text-lg"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transfer bbva">Transfer BBVA</option>
                  <option value="transfer Mercado Pago">Transfer Mercado Pago</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={cerrarModalPago}
                  className="bg-gray-700 text-white px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={marcarComoPagado}
                  className="bg-green-600 text-white px-4 py-2 rounded font-bold"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 