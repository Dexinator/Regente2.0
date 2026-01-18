import { useState, useEffect } from "react";
import {
  getCompras,
  getCompraById,
  createCompra,
  updateCompra,
  deleteCompra,
  getProveedores,
  getInsumos,
  getItemsRequisicionPendientes,
  getInsumosByProveedor,
  getUnidadesMedida,
  createInsumo,
  getCategoriasInsumos
} from "../../utils/compras-api";
import { getEmpleadoId } from "../../utils/auth";

export default function RegistroCompras() {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [compraEditando, setCompraEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [insumosFiltrados, setInsumosFiltrados] = useState([]);
  const [itemsRequisicionSugeridos, setItemsRequisicionSugeridos] = useState([]);
  const [preciosProveedor, setPreciosProveedor] = useState({});

  const [formData, setFormData] = useState({
    proveedor_id: "",
    origen_compra: "",
    fecha_compra: new Date().toISOString().split('T')[0],
    metodo_pago: "efectivo",
    solicito_factura: false,
    numero_factura: "",
    notas: "",
    items: []
  });

  const [itemEditando, setItemEditando] = useState(null);
  const [formItem, setFormItem] = useState({
    insumo_id: "",
    insumo_nombre: "",
    cantidad: 1,
    unidad: "unidad",
    precio_unitario: 0,
    requisicion_item_id: null
  });

  // Estados para modal de nuevo insumo
  const [mostrarModalNuevoInsumo, setMostrarModalNuevoInsumo] = useState(false);
  const [categoriasInsumos, setCategoriasInsumos] = useState([]);
  const [creandoInsumo, setCreandoInsumo] = useState(false);
  const [mostrarInputUnidadNueva, setMostrarInputUnidadNueva] = useState(false);
  const [unidadNueva, setUnidadNueva] = useState("");
  const [formNuevoInsumo, setFormNuevoInsumo] = useState({
    nombre: "",
    categoria: "",
    marca: "",
    unidad_medida_default: "unidad",
    descripcion: ""
  });

  const usuarioId = getEmpleadoId();

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarCompras();
  }, [filtroProveedor, filtroFecha]);

  useEffect(() => {
    // Filtrar insumos basado en búsqueda
    // No filtrar si ya hay un insumo seleccionado (evita reabrir el dropdown)
    if (formItem.insumo_id) {
      setInsumosFiltrados([]);
      return;
    }

    if (busquedaInsumo.trim() === "") {
      setInsumosFiltrados([]);
    } else {
      const termino = busquedaInsumo.toLowerCase();
      const filtrados = insumos.filter(insumo =>
        insumo.nombre.toLowerCase().includes(termino) ||
        (insumo.categoria && insumo.categoria.toLowerCase().includes(termino)) ||
        (insumo.marca && insumo.marca.toLowerCase().includes(termino))
      ).slice(0, 10);
      setInsumosFiltrados(filtrados);
    }
  }, [busquedaInsumo, insumos, formItem.insumo_id]);

  useEffect(() => {
    // Cuando se selecciona un proveedor, buscar items de requisición pendientes y precios
    if (formData.proveedor_id && formData.proveedor_id !== 'otro') {
      cargarItemsRequisicionSugeridos(formData.proveedor_id);
      cargarPreciosProveedor(formData.proveedor_id);
    } else {
      setItemsRequisicionSugeridos([]);
      setPreciosProveedor({});
    }
  }, [formData.proveedor_id]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      const [proveedoresData, insumosData, unidadesData, categoriasData] = await Promise.all([
        getProveedores(),
        getInsumos(),
        getUnidadesMedida(),
        getCategoriasInsumos()
      ]);

      setProveedores(proveedoresData);
      setInsumos(insumosData);
      setUnidades(unidadesData);
      setCategoriasInsumos(categoriasData);

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
      if (filtroProveedor) filters.proveedor_id = filtroProveedor;
      if (filtroFecha) filters.fecha_inicio = filtroFecha;

      const data = await getCompras(filters);
      setCompras(data);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las compras.");
    }
  };

  const cargarItemsRequisicionSugeridos = async (proveedorId) => {
    try {
      const items = await getItemsRequisicionPendientes(proveedorId);
      setItemsRequisicionSugeridos(items);

      // Notificar si hay items de requisición pendientes
      if (items.length > 0) {
        setError(`Hay ${items.length} items de requisiciones pendientes para este proveedor`);
      }
    } catch (error) {
      console.error("Error cargando requisiciones:", error);
      setItemsRequisicionSugeridos([]);
    }
  };

  const cargarPreciosProveedor = async (proveedorId) => {
    try {
      const insumosConPrecio = await getInsumosByProveedor(proveedorId);
      // Crear mapa de insumo_id -> precio_referencia
      const precios = {};
      insumosConPrecio.forEach(insumo => {
        if (insumo.precio_referencia) {
          precios[insumo.id] = parseFloat(insumo.precio_referencia);
        }
      });
      setPreciosProveedor(precios);
    } catch (error) {
      console.error("Error cargando precios del proveedor:", error);
      setPreciosProveedor({});
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const seleccionarInsumo = (insumo) => {
    // Buscar si hay un item de requisición pendiente para este insumo
    const itemRequisicion = itemsRequisicionSugeridos.find(
      item => item.insumo_id === insumo.id
    );

    // Obtener precio de referencia del proveedor si existe
    const precioReferencia = preciosProveedor[insumo.id] || 0;

    setFormItem({
      ...formItem,
      insumo_id: insumo.id,
      insumo_nombre: insumo.nombre,
      unidad: insumo.unidad_medida_default || "unidad",
      cantidad: itemRequisicion ? itemRequisicion.cantidad : 1,
      precio_unitario: precioReferencia,
      requisicion_item_id: itemRequisicion ? itemRequisicion.id : null
    });

    setBusquedaInsumo(insumo.nombre);
    setInsumosFiltrados([]);

    // Mostrar información relevante
    if (itemRequisicion && precioReferencia > 0) {
      setError(`Requisición pendiente: ${itemRequisicion.cantidad} ${itemRequisicion.unidad}. Precio total sugerido: $${precioReferencia}`);
    } else if (itemRequisicion) {
      setError(`Este insumo tiene una requisición pendiente: ${itemRequisicion.cantidad} ${itemRequisicion.unidad}`);
    } else if (precioReferencia > 0) {
      setError(`Precio total de última compra: $${precioReferencia}`);
    }
  };

  // Funciones para el modal de nuevo insumo
  const abrirModalNuevoInsumo = () => {
    // Pre-llenar el nombre con lo que el usuario escribió en la búsqueda
    setFormNuevoInsumo({
      nombre: busquedaInsumo.trim(),
      categoria: "",
      marca: "",
      unidad_medida_default: "unidad",
      descripcion: ""
    });
    setMostrarModalNuevoInsumo(true);
    setInsumosFiltrados([]);
  };

  const cerrarModalNuevoInsumo = () => {
    setMostrarModalNuevoInsumo(false);
    setMostrarInputUnidadNueva(false);
    setUnidadNueva("");
    setFormNuevoInsumo({
      nombre: "",
      categoria: "",
      marca: "",
      unidad_medida_default: "unidad",
      descripcion: ""
    });
  };

  const handleNuevoInsumoChange = (e) => {
    const { name, value } = e.target;

    // Si es el campo de unidad y selecciona "otra"
    if (name === "unidad_medida_default") {
      if (value === "__otra__") {
        setMostrarInputUnidadNueva(true);
        setUnidadNueva("");
      } else {
        setMostrarInputUnidadNueva(false);
        setUnidadNueva("");
      }
    }

    setFormNuevoInsumo({
      ...formNuevoInsumo,
      [name]: value
    });
  };

  const handleCrearInsumo = async (e) => {
    e.preventDefault();

    if (!formNuevoInsumo.nombre.trim()) {
      setError("El nombre del insumo es requerido");
      return;
    }

    // Validar unidad nueva si se seleccionó "otra"
    if (formNuevoInsumo.unidad_medida_default === "__otra__" && !unidadNueva.trim()) {
      setError("Debe ingresar el nombre de la nueva unidad");
      return;
    }

    setCreandoInsumo(true);
    setError("");

    try {
      // Determinar la unidad a usar
      const unidadFinal = formNuevoInsumo.unidad_medida_default === "__otra__"
        ? unidadNueva.trim()
        : formNuevoInsumo.unidad_medida_default;

      // Crear el insumo con el proveedor actual si está seleccionado
      const dataToSend = {
        ...formNuevoInsumo,
        unidad_medida_default: unidadFinal,
        proveedores: formData.proveedor_id && formData.proveedor_id !== 'otro'
          ? [{ id: parseInt(formData.proveedor_id), precio_referencia: null }]
          : []
      };

      const nuevoInsumo = await createInsumo(dataToSend);

      // Recargar la lista de insumos, categorías y unidades
      const [insumosActualizados, categoriasActualizadas, unidadesActualizadas] = await Promise.all([
        getInsumos(),
        getCategoriasInsumos(),
        getUnidadesMedida()
      ]);
      setInsumos(insumosActualizados);
      setCategoriasInsumos(categoriasActualizadas);
      setUnidades(unidadesActualizadas);

      // Seleccionar automáticamente el nuevo insumo
      seleccionarInsumo(nuevoInsumo);

      // Cerrar el modal
      cerrarModalNuevoInsumo();

      setError(`Insumo "${nuevoInsumo.nombre}" creado exitosamente`);
    } catch (error) {
      console.error("Error al crear insumo:", error);
      setError(error.message || "Error al crear el insumo");
    } finally {
      setCreandoInsumo(false);
    }
  };

  const agregarItem = () => {
    if (!formItem.insumo_id || formItem.precio_unitario <= 0) {
      setError("Selecciona un insumo y define el precio");
      return;
    }

    if (itemEditando !== null) {
      // Actualizar item existente
      const nuevosItems = [...formData.items];
      nuevosItems[itemEditando] = { ...formItem };
      setFormData({ ...formData, items: nuevosItems });
      setItemEditando(null);
    } else {
      // Agregar nuevo item
      setFormData({
        ...formData,
        items: [...formData.items, { ...formItem }]
      });
    }

    // Resetear formulario de item
    setFormItem({
      insumo_id: "",
      insumo_nombre: "",
      cantidad: 1,
      unidad: "unidad",
      precio_unitario: 0,
      requisicion_item_id: null
    });
    setBusquedaInsumo("");
    setError("");
  };

  const editarItem = (index) => {
    const item = formData.items[index];
    setFormItem(item);
    setBusquedaInsumo(item.insumo_nombre);
    setItemEditando(index);
  };

  const eliminarItem = (index) => {
    const nuevosItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: nuevosItems });
  };

  const calcularTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + parseFloat(item.precio_unitario || 0);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.items.length === 0) {
      setError("Agrega al menos un item a la compra");
      return;
    }

    if (formData.proveedor_id === 'otro' && !formData.origen_compra) {
      setError("Debe especificar el origen de la compra");
      return;
    }

    try {
      const dataToSend = {
        proveedor_id: formData.proveedor_id === 'otro' ? null : formData.proveedor_id,
        origen_compra: formData.proveedor_id === 'otro' ? formData.origen_compra : null,
        usuario_id: usuarioId,
        total: calcularTotal(),
        metodo_pago: formData.metodo_pago,
        solicito_factura: formData.solicito_factura,
        numero_factura: formData.numero_factura,
        notas: formData.notas,
        fecha_compra: formData.fecha_compra,
        items: formData.items.map(item => ({
          insumo_id: item.insumo_id,
          cantidad: item.cantidad,
          unidad: item.unidad,
          precio_unitario: item.precio_unitario,
          requisicion_item_id: item.requisicion_item_id
        }))
      };

      if (compraEditando) {
        await updateCompra(compraEditando.id, dataToSend);
      } else {
        await createCompra(dataToSend);
      }

      resetForm();
      await cargarCompras();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al guardar la compra");
    }
  };

  const iniciarEdicion = async (compra) => {
    try {
      const compraCompleta = await getCompraById(compra.id);

      setCompraEditando(compraCompleta);
      setFormData({
        proveedor_id: compraCompleta.proveedor_id || (compraCompleta.origen_compra ? 'otro' : ''),
        origen_compra: compraCompleta.origen_compra || '',
        fecha_compra: new Date(compraCompleta.fecha_compra).toISOString().split('T')[0],
        metodo_pago: compraCompleta.metodo_pago,
        solicito_factura: compraCompleta.solicito_factura || false,
        numero_factura: compraCompleta.numero_factura || "",
        notas: compraCompleta.notas || "",
        items: compraCompleta.items.map(item => ({
          insumo_id: item.insumo_id,
          insumo_nombre: item.insumo_nombre,
          cantidad: parseFloat(item.cantidad),
          unidad: item.unidad,
          precio_unitario: parseFloat(item.precio_unitario),
          requisicion_item_id: item.requisicion_item_id
        }))
      });

      setMostrarFormulario(true);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los datos de la compra");
    }
  };

  const eliminarCompra = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta compra?")) return;

    try {
      await deleteCompra(id);
      await cargarCompras();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al eliminar la compra");
    }
  };

  const resetForm = () => {
    setCompraEditando(null);
    setFormData({
      proveedor_id: "",
      origen_compra: "",
      fecha_compra: new Date().toISOString().split('T')[0],
      metodo_pago: "efectivo",
      solicito_factura: false,
      numero_factura: "",
      notas: "",
      items: []
    });
    setFormItem({
      insumo_id: "",
      insumo_nombre: "",
      cantidad: 1,
      unidad: "unidad",
      precio_unitario: 0,
      requisicion_item_id: null
    });
    setBusquedaInsumo("");
    setItemEditando(null);
    setItemsRequisicionSugeridos([]);
    setPreciosProveedor({});
  };

  if (loading && compras.length === 0) {
    return <div className="text-center py-10">Cargando compras...</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-subtitulo text-amarillo">Registro de Compras y Gastos</h2>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <select
          value={filtroProveedor}
          onChange={(e) => setFiltroProveedor(e.target.value)}
          className="bg-negro border border-gray-700 rounded p-2 text-white"
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map(proveedor => (
            <option key={proveedor.id} value={proveedor.id}>
              {proveedor.nombre}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          className="bg-negro border border-gray-700 rounded p-2 text-white"
          placeholder="Filtrar por fecha"
        />
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Formulario de compra */}
      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="bg-negro/50 p-6 rounded-lg mb-6">
          <h3 className="text-xl text-amarillo mb-4">
            {compraEditando ? "Editar Compra" : "Nueva Compra"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                {proveedores.map(proveedor => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
                <option value="otro">--- Otro (Tianguis/Mercado/Ocasional) ---</option>
              </select>
            </div>

            {formData.proveedor_id === 'otro' && (
              <div>
                <label className="block text-white mb-1">Origen de la Compra *</label>
                <input
                  type="text"
                  name="origen_compra"
                  value={formData.origen_compra}
                  onChange={handleInputChange}
                  required={formData.proveedor_id === 'otro'}
                  placeholder="Ej: Tianguis de San Juan, Mercado Central, Vendedor ocasional..."
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-white mb-1">Fecha *</label>
              <input
                type="date"
                name="fecha_compra"
                value={formData.fecha_compra}
                onChange={handleInputChange}
                required
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
              />
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

            <div>
              <label className="block text-white mb-1">Notas</label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleInputChange}
                rows="2"
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
              ></textarea>
            </div>
          </div>

          {/* Sección para agregar items */}
          <div className="bg-negro/30 p-4 rounded mb-4">
            <h4 className="text-lg text-white mb-3">Agregar Items</h4>

            {/* Sugerencias de requisiciones */}
            {itemsRequisicionSugeridos.length > 0 && (
              <div className="bg-yellow-900/30 border border-yellow-600 p-3 rounded mb-4">
                <p className="text-yellow-200 text-sm mb-2">
                  Items de requisiciones pendientes para este proveedor:
                </p>
                <div className="space-y-1">
                  {itemsRequisicionSugeridos.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => seleccionarInsumo({
                        id: item.insumo_id,
                        nombre: item.insumo_nombre,
                        unidad_medida_default: item.unidad
                      })}
                      className="block w-full text-left bg-yellow-900/20 p-2 rounded hover:bg-yellow-900/40 text-yellow-100 text-sm"
                    >
                      {item.insumo_nombre} - {item.cantidad} {item.unidad}
                      (Req #{item.requisicion_id})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campo de búsqueda de insumo - ancho completo */}
            <div className="mb-3">
              <label className="block text-white mb-1">Buscar Insumo *</label>
              <div className="relative">
                <input
                  type="text"
                  value={busquedaInsumo}
                  onChange={(e) => {
                    setBusquedaInsumo(e.target.value);
                    // Limpiar el insumo seleccionado para permitir una nueva búsqueda
                    if (formItem.insumo_id) {
                      setFormItem({
                        ...formItem,
                        insumo_id: "",
                        insumo_nombre: ""
                      });
                    }
                  }}
                  placeholder="Nombre, categoría o marca..."
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />

                {(insumosFiltrados.length > 0 || busquedaInsumo.trim().length >= 2) && !formItem.insumo_id && (
                  <div className="absolute z-10 w-full mt-1 bg-negro border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
                    {insumosFiltrados.map(insumo => (
                      <div
                        key={insumo.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          seleccionarInsumo(insumo);
                        }}
                        className="p-2 hover:bg-vino/30 cursor-pointer border-b border-gray-800"
                      >
                        <div className="text-white">{insumo.nombre}</div>
                        <div className="text-sm text-gray-400">
                          {insumo.categoria && `${insumo.categoria} `}
                          {insumo.marca && `| ${insumo.marca}`}
                        </div>
                      </div>
                    ))}
                    {/* Opción para crear nuevo insumo */}
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        abrirModalNuevoInsumo();
                      }}
                      className="p-2 hover:bg-amarillo/20 cursor-pointer border-t border-gray-600 bg-gray-900/50"
                    >
                      <div className="text-amarillo font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Crear nuevo insumo
                        {busquedaInsumo.trim() && (
                          <span className="font-normal text-white">"{busquedaInsumo.trim()}"</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {insumosFiltrados.length === 0
                          ? "No se encontraron coincidencias"
                          : "Agregar un insumo que no está en la lista"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Campos de cantidad, unidad, precio y botón */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-white mb-1">Cantidad *</label>
                <input
                  type="number"
                  value={formItem.cantidad}
                  onChange={(e) => setFormItem({...formItem, cantidad: e.target.value})}
                  step="0.01"
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-white mb-1">Unidad</label>
                <select
                  value={formItem.unidad}
                  onChange={(e) => setFormItem({...formItem, unidad: e.target.value})}
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                >
                  <option value="">Seleccionar unidad</option>
                  {unidades.map((unidad) => (
                    <option key={unidad.id} value={unidad.nombre}>
                      {unidad.nombre} {unidad.abreviatura && `(${unidad.abreviatura})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white mb-1">Precio Total *</label>
                <input
                  type="number"
                  value={formItem.precio_unitario}
                  onChange={(e) => setFormItem({...formItem, precio_unitario: e.target.value})}
                  step="0.01"
                  placeholder="Lo que pagaste"
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />
              </div>

              <button
                type="button"
                onClick={agregarItem}
                className="bg-amarillo text-negro px-4 py-2 rounded font-bold"
              >
                {itemEditando !== null ? "Actualizar" : "Agregar"}
              </button>
            </div>
          </div>

          {/* Lista de items agregados */}
          {formData.items.length > 0 && (
            <div className="mb-4">
              <h4 className="text-lg text-white mb-3">Items de la Compra</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead className="bg-vino/70">
                    <tr>
                      <th className="p-2 text-left">Insumo</th>
                      <th className="p-2 text-center">Cantidad</th>
                      <th className="p-2 text-center">Unidad</th>
                      <th className="p-2 text-center">Precio Total</th>
                      <th className="p-2 text-center">Requisición</th>
                      <th className="p-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-700">
                        <td className="p-2">{item.insumo_nombre}</td>
                        <td className="p-2 text-center">{item.cantidad}</td>
                        <td className="p-2 text-center">{item.unidad}</td>
                        <td className="p-2 text-center">${parseFloat(item.precio_unitario).toFixed(2)}</td>
                        <td className="p-2 text-center">
                          {item.requisicion_item_id ? (
                            <span className="px-2 py-1 rounded text-xs bg-green-900/50 text-green-200">
                              Vinculada
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300">
                              Directa
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => editarItem(index)}
                            className="bg-amarillo text-negro p-1 rounded mr-2"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarItem(index)}
                            className="bg-red-700 text-white p-1 rounded"
                            title="Eliminar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-vino/50">
                      <td colSpan="3" className="p-2 text-right font-bold">TOTAL:</td>
                      <td className="p-2 text-center font-bold text-amarillo">
                        ${calcularTotal().toFixed(2)}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {(compraEditando || formData.items.length > 0) && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-700 text-white px-4 py-2 rounded"
              >
                {compraEditando ? "Cancelar Edición" : "Limpiar"}
              </button>
            )}
            <button
              type="submit"
              className="bg-amarillo text-negro px-4 py-2 rounded font-bold"
              disabled={formData.items.length === 0}
            >
              {compraEditando ? "Actualizar Compra" : "Guardar Compra"}
            </button>
          </div>
        </form>
      )}

      {/* Lista de compras */}
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
                <th className="p-2 text-left">Fecha</th>
                <th className="p-2 text-left">Proveedor</th>
                <th className="p-2 text-center">Items</th>
                <th className="p-2 text-center">Total</th>
                <th className="p-2 text-center">Método</th>
                <th className="p-2 text-center">Factura</th>
                <th className="p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {compras.map(compra => (
                <tr key={compra.id} className="border-b border-gray-700">
                  <td className="p-2">{compra.id}</td>
                  <td className="p-2">
                    {new Date(compra.fecha_compra).toLocaleDateString()}
                  </td>
                  <td className="p-2">{compra.proveedor_nombre || "N/A"}</td>
                  <td className="p-2 text-center">{compra.total_items || 0}</td>
                  <td className="p-2 text-center">
                    ${parseFloat(compra.total_calculado || compra.total).toFixed(2)}
                  </td>
                  <td className="p-2 text-center capitalize">{compra.metodo_pago}</td>
                  <td className="p-2 text-center">
                    {compra.solicito_factura ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => iniciarEdicion(compra)}
                        className="bg-amarillo text-negro p-1 rounded"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para crear nuevo insumo */}
      {mostrarModalNuevoInsumo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-negro border border-gray-700 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-xl text-amarillo font-bold">Nuevo Insumo</h3>
              <button
                onClick={cerrarModalNuevoInsumo}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCrearInsumo} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-1">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formNuevoInsumo.nombre}
                    onChange={handleNuevoInsumoChange}
                    required
                    autoFocus
                    className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    placeholder="Nombre del insumo"
                  />
                </div>

                <div>
                  <label className="block text-white mb-1">Categoría</label>
                  <input
                    type="text"
                    name="categoria"
                    value={formNuevoInsumo.categoria}
                    onChange={handleNuevoInsumoChange}
                    list="categorias-insumos-list"
                    className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    placeholder="Ej: Verduras, Carnes, Limpieza..."
                  />
                  <datalist id="categorias-insumos-list">
                    {categoriasInsumos.map((cat, index) => (
                      <option key={index} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-white mb-1">Marca</label>
                  <input
                    type="text"
                    name="marca"
                    value={formNuevoInsumo.marca}
                    onChange={handleNuevoInsumoChange}
                    className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    placeholder="Marca (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-white mb-1">Unidad de Medida *</label>
                  <select
                    name="unidad_medida_default"
                    value={formNuevoInsumo.unidad_medida_default}
                    onChange={handleNuevoInsumoChange}
                    required
                    className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                  >
                    <option value="">Seleccionar unidad</option>
                    {unidades.map((unidad) => (
                      <option key={unidad.id} value={unidad.nombre}>
                        {unidad.nombre} {unidad.abreviatura && `(${unidad.abreviatura})`}
                      </option>
                    ))}
                    <option value="__otra__">--- Otra (agregar nueva) ---</option>
                  </select>

                  {mostrarInputUnidadNueva && (
                    <div className="mt-2">
                      <label className="block text-white mb-1 text-sm">Nueva unidad *</label>
                      <input
                        type="text"
                        value={unidadNueva}
                        onChange={(e) => setUnidadNueva(e.target.value)}
                        placeholder="Ej: Galón, Costal, etc."
                        required
                        className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Esta unidad se agregará automáticamente a la lista
                      </p>
                    </div>
                  )}
                </div>

                {formData.proveedor_id && formData.proveedor_id !== 'otro' && (
                  <div className="bg-vino/20 border border-vino/50 rounded p-3">
                    <p className="text-sm text-gray-300">
                      Este insumo se asociará automáticamente con el proveedor:{" "}
                      <span className="text-white font-bold">
                        {proveedores.find(p => p.id === parseInt(formData.proveedor_id))?.nombre}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={cerrarModalNuevoInsumo}
                  className="bg-gray-700 text-white px-4 py-2 rounded"
                  disabled={creandoInsumo}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amarillo text-negro px-4 py-2 rounded font-bold disabled:opacity-50"
                  disabled={creandoInsumo}
                >
                  {creandoInsumo ? "Creando..." : "Crear Insumo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}