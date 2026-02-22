import { useState, useEffect } from "react";
import {
  getRequisiciones,
  getRequisicionById,
  createRequisicion,
  updateRequisicion,
  deleteRequisicion,
  addItemRequisicion,
  updateItemRequisicion,
  deleteItemRequisicion,
  getInsumos,
  getUnidadesMedida
} from "../../utils/compras-api";
import { getUserRole, getUserName, getEmpleadoId } from "../../utils/auth";

export default function RequisicionesPanel() {
  const [requisiciones, setRequisiciones] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [requisicionActual, setRequisicionActual] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarFormularioItem, setMostrarFormularioItem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroCompletada, setFiltroCompletada] = useState(false);
  const [formData, setFormData] = useState({
    notas: "",
    items: []
  });
  const [formItemData, setFormItemData] = useState({
    insumo_id: "",
    cantidad: 1,
    unidad: "unidad",
    urgencia: "normal"
  });
  const [usuarioId, setUsuarioId] = useState(null);
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [insumosFiltrados, setInsumosFiltrados] = useState([]);
  const [busquedaInsumoDetalle, setBusquedaInsumoDetalle] = useState("");
  const [insumosFiltradosDetalle, setInsumosFiltradosDetalle] = useState([]);

  useEffect(() => {
    // Obtener ID del usuario actual
    setUsuarioId(getEmpleadoId());
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarRequisiciones();
  }, [filtroCompletada]);

  useEffect(() => {
    // Filtrar insumos para el formulario principal
    // No filtrar si ya hay un insumo seleccionado (evita reabrir el dropdown)
    if (formItemData.insumo_id) {
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
  }, [busquedaInsumo, insumos, formItemData.insumo_id]);

  useEffect(() => {
    // Filtrar insumos para el formulario de detalle
    // No filtrar si ya hay un insumo seleccionado (evita reabrir el dropdown)
    if (formItemData.insumo_id) {
      setInsumosFiltradosDetalle([]);
      return;
    }

    if (busquedaInsumoDetalle.trim() === "") {
      setInsumosFiltradosDetalle([]);
    } else {
      const termino = busquedaInsumoDetalle.toLowerCase();
      const filtrados = insumos.filter(insumo =>
        insumo.nombre.toLowerCase().includes(termino) ||
        (insumo.categoria && insumo.categoria.toLowerCase().includes(termino)) ||
        (insumo.marca && insumo.marca.toLowerCase().includes(termino))
      ).slice(0, 10);
      setInsumosFiltradosDetalle(filtrados);
    }
  }, [busquedaInsumoDetalle, insumos, formItemData.insumo_id]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      // Cargar insumos y unidades en paralelo
      const [insumosData, unidadesData] = await Promise.all([
        getInsumos(),
        getUnidadesMedida()
      ]);
      setInsumos(insumosData);
      setUnidades(unidadesData);

      // Cargar requisiciones
      await cargarRequisiciones();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los datos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const cargarRequisiciones = async () => {
    try {
      const data = await getRequisiciones(filtroCompletada);
      setRequisiciones(data);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las requisiciones. Intenta de nuevo.");
    }
  };

  const verDetalleRequisicion = async (id) => {
    setError("");
    
    try {
      const requisicion = await getRequisicionById(id);
      setRequisicionActual(requisicion);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los detalles de la requisición");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
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
    
    setFormItemData({
      ...formItemData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validar que haya al menos un item
    if (formData.items.length === 0) {
      setError("Debe agregar al menos un item a la requisición");
      return;
    }
    
    try {
      const nuevaRequisicion = await createRequisicion({
        usuario_id: usuarioId,
        notas: formData.notas,
        items: formData.items
      });
      
      resetForm();
      await cargarRequisiciones();
      
      // Abrir la requisición recién creada
      setRequisicionActual(nuevaRequisicion);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al crear la requisición");
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!requisicionActual) return;
    
    try {
      await addItemRequisicion(requisicionActual.id, formItemData);
      
      // Recargar la requisición actual
      const requisicionActualizada = await getRequisicionById(requisicionActual.id);
      setRequisicionActual(requisicionActualizada);
      
      resetFormItem();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al agregar el item");
    }
  };

  const marcarItemCompletado = async (requisicionId, itemId, completado) => {
    setError("");
    
    try {
      await updateItemRequisicion(requisicionId, itemId, { completado });
      
      // Recargar la requisición actual
      const requisicionActualizada = await getRequisicionById(requisicionId);
      setRequisicionActual(requisicionActualizada);
      
      // Recargar la lista de requisiciones
      await cargarRequisiciones();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al actualizar el item");
    }
  };

  const eliminarItem = async (requisicionId, itemId) => {
    if (!confirm("¿Estás seguro de eliminar este item?")) return;
    
    setError("");
    
    try {
      await deleteItemRequisicion(requisicionId, itemId);
      
      // Recargar la requisición actual
      const requisicionActualizada = await getRequisicionById(requisicionId);
      setRequisicionActual(requisicionActualizada);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al eliminar el item");
    }
  };

  const eliminarRequisicion = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta requisición?")) return;
    
    setError("");
    
    try {
      await deleteRequisicion(id);
      
      if (requisicionActual && requisicionActual.id === id) {
        setRequisicionActual(null);
      }
      
      await cargarRequisiciones();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al eliminar la requisición");
    }
  };

  const resetForm = () => {
    setFormData({
      notas: "",
      items: []
    });
    setMostrarFormulario(false);
    setBusquedaInsumo("");
    setMostrarFormularioItem(false);
  };

  const resetFormItem = () => {
    setFormItemData({
      insumo_id: "",
      cantidad: 1,
      unidad: "unidad",
      urgencia: "normal"
    });
    setMostrarFormularioItem(false);
    setBusquedaInsumo("");
    setBusquedaInsumoDetalle("");
  };

  const agregarItemAFormulario = () => {
    // Validar que se haya seleccionado un insumo
    if (!formItemData.insumo_id) {
      setError("Debe seleccionar un insumo");
      return;
    }

    // Validar cantidad
    if (!formItemData.cantidad || formItemData.cantidad <= 0) {
      setError("Debe ingresar una cantidad válida");
      return;
    }

    // Validar unidad
    if (!formItemData.unidad) {
      setError("Debe seleccionar una unidad");
      return;
    }

    // Verificar que no se haya agregado ya este insumo
    const yaExiste = formData.items.some(item => item.insumo_id === formItemData.insumo_id);
    if (yaExiste) {
      setError("Este insumo ya está en la lista");
      return;
    }

    // Agregar el item a la lista
    setFormData({
      ...formData,
      items: [...formData.items, { ...formItemData }]
    });

    // Limpiar los campos pero mantener el formulario visible para agregar más items
    setFormItemData({
      insumo_id: "",
      cantidad: 1,
      unidad: "unidad",
      urgencia: "normal"
    });
    setBusquedaInsumo("");
    setError("");
  };

  const eliminarItemDeFormulario = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  if (loading && requisiciones.length === 0) {
    return <div className="text-center py-10">Cargando requisiciones...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-subtitulo text-amarillo">Requisiciones</h2>
        <div className="flex gap-2">
          <select
            value={filtroCompletada === null ? "" : filtroCompletada.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setFiltroCompletada(val === "" ? null : val === "true");
            }}
            className="bg-negro border border-gray-700 rounded p-2 text-white"
          >
            <option value="">Todas</option>
            <option value="true">Completadas</option>
            <option value="false">Pendientes</option>
          </select>
          <button
            onClick={() => {
              setRequisicionActual(null);
              const nuevoEstado = !mostrarFormulario;
              setMostrarFormulario(nuevoEstado);
              // Mostrar automáticamente el formulario de item al abrir nueva requisición
              if (nuevoEstado) {
                setMostrarFormularioItem(true);
              }
            }}
            className="bg-vino text-white px-4 py-2 rounded-full font-bold"
          >
            {mostrarFormulario ? "Cancelar" : "Nueva Requisición"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Formulario para nueva requisición */}
      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="bg-negro/50 p-4 rounded-lg mb-6">
          <h3 className="text-xl text-amarillo mb-4">Nueva Requisición</h3>
          
          <div className="mb-4">
            <label className="block text-white mb-1">Notas</label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleInputChange}
              rows="3"
              placeholder="Descripción de la requisición (opcional)"
              className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
            ></textarea>
          </div>
          
          {/* Sección de items */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-white">Items de la Requisición *</label>
              <button
                type="button"
                onClick={() => setMostrarFormularioItem(!mostrarFormularioItem)}
                className="bg-vino text-white px-3 py-1 rounded text-sm"
              >
                {mostrarFormularioItem ? "Cancelar" : "Agregar Item"}
              </button>
            </div>
            
            {/* Formulario para agregar item dentro del formulario principal */}
            {mostrarFormularioItem && (
              <div className="bg-negro/30 p-3 rounded mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-white mb-1">Buscar Insumo *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={busquedaInsumo}
                        onChange={(e) => {
                          setBusquedaInsumo(e.target.value);
                          // Limpiar el insumo seleccionado para permitir una nueva búsqueda
                          if (formItemData.insumo_id) {
                            setFormItemData({
                              ...formItemData,
                              insumo_id: ""
                            });
                          }
                        }}
                        placeholder="Buscar por nombre, categoría o marca..."
                        className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                      />

                      {/* Dropdown de resultados */}
                      {insumosFiltrados.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-negro border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
                          {insumosFiltrados.map((insumo) => (
                            <div
                              key={insumo.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFormItemData({
                                  ...formItemData,
                                  insumo_id: insumo.id.toString(),
                                  unidad: insumo.unidad_medida_default
                                });
                                setBusquedaInsumo(insumo.nombre);
                                setInsumosFiltrados([]);
                              }}
                              className="w-full text-left p-2 hover:bg-vino/30 border-b border-gray-800 last:border-0 cursor-pointer"
                            >
                              <div className="text-white">{insumo.nombre}</div>
                              <div className="text-sm text-gray-400">
                                {insumo.categoria && `Categoría: ${insumo.categoria} `}
                                {insumo.marca && `| Marca: ${insumo.marca}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Mostrar si se seleccionó un insumo */}
                      {formItemData.insumo_id && (
                        <div className="text-xs text-green-400 mt-1">
                          Insumo seleccionado
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white mb-1">Cantidad *</label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formItemData.cantidad}
                      onChange={handleItemInputChange}
                      min="1"
                      step="0.01"
                      className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-1">Unidad *</label>
                    <select
                      name="unidad"
                      value={formItemData.unidad}
                      onChange={handleItemInputChange}
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
                    <label className="block text-white mb-1">Urgencia</label>
                    <select
                      name="urgencia"
                      value={formItemData.urgencia}
                      onChange={handleItemInputChange}
                      className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    >
                      <option value="baja">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={agregarItemAFormulario}
                    className="bg-amarillo text-negro px-3 py-1 rounded font-bold text-sm"
                  >
                    Agregar a la Lista
                  </button>
                </div>
              </div>
            )}
            
            {/* Lista de items agregados */}
            {formData.items.length === 0 ? (
              <div className="bg-negro/30 p-4 rounded text-center text-gray-400">
                No hay items agregados. Debe agregar al menos un item.
              </div>
            ) : (
              <div className="bg-negro/30 p-3 rounded">
                <div className="space-y-2">
                  {formData.items.map((item, index) => {
                    const insumo = insumos.find(i => i.id === parseInt(item.insumo_id));
                    return (
                      <div key={index} className="flex justify-between items-center bg-negro/50 p-2 rounded">
                        <div className="flex-1">
                          <div className="text-white font-semibold">
                            {insumo?.nombre || "Insumo desconocido"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {item.cantidad} {item.unidad} - Urgencia: {item.urgencia}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarItemDeFormulario(index)}
                          className="bg-red-700 text-white p-1 rounded ml-2"
                          title="Eliminar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
              disabled={formData.items.length === 0}
            >
              Crear Requisición ({formData.items.length} items)
            </button>
          </div>
        </form>
      )}

      {/* Vista de detalle de requisición */}
      {requisicionActual && (
        <div className="bg-negro/50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl text-amarillo">
              Requisición #{requisicionActual.id}
            </h3>
            <button
              onClick={() => setRequisicionActual(null)}
              className="bg-gray-700 text-white px-3 py-1 rounded"
            >
              Volver
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400">Solicitante:</p>
              <p className="text-white">{requisicionActual.usuario_nombre || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-400">Fecha:</p>
              <p className="text-white">
                {new Date(requisicionActual.fecha_solicitud).toLocaleString()}
              </p>
            </div>
            {requisicionActual.notas && (
              <div className="md:col-span-2">
                <p className="text-gray-400">Notas:</p>
                <p className="text-white">{requisicionActual.notas}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <p className="text-gray-400">Estado:</p>
              <p className={requisicionActual.completada ? "text-green-500" : "text-yellow-500"}>
                {requisicionActual.completada ? "Completada" : "Pendiente"}
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg text-white">Items</h4>
              {!requisicionActual.completada && (
                <button
                  onClick={() => setMostrarFormularioItem(!mostrarFormularioItem)}
                  className="bg-vino text-white px-3 py-1 rounded"
                >
                  {mostrarFormularioItem ? "Cancelar" : "Agregar Item"}
                </button>
              )}
            </div>
            
            {/* Formulario para agregar item */}
            {mostrarFormularioItem && (
              <form onSubmit={handleItemSubmit} className="bg-negro/30 p-3 rounded mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-white mb-1">Buscar Insumo *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={busquedaInsumoDetalle}
                        onChange={(e) => {
                          setBusquedaInsumoDetalle(e.target.value);
                          // Limpiar el insumo seleccionado para permitir una nueva búsqueda
                          if (formItemData.insumo_id) {
                            setFormItemData({
                              ...formItemData,
                              insumo_id: ""
                            });
                          }
                        }}
                        placeholder="Buscar por nombre, categoría o marca..."
                        className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                      />
                      
                      {/* Dropdown de resultados */}
                      {insumosFiltradosDetalle.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-negro border border-gray-700 rounded shadow-lg max-h-60 overflow-y-auto">
                          {insumosFiltradosDetalle.map((insumo) => (
                            <div
                              key={insumo.id}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFormItemData({
                                  ...formItemData,
                                  insumo_id: insumo.id.toString(),
                                  unidad: insumo.unidad_medida_default
                                });
                                setBusquedaInsumoDetalle(insumo.nombre);
                                setInsumosFiltradosDetalle([]);
                              }}
                              className="w-full text-left p-2 hover:bg-vino/30 border-b border-gray-800 last:border-0 cursor-pointer"
                            >
                              <div className="text-white">{insumo.nombre}</div>
                              <div className="text-sm text-gray-400">
                                {insumo.categoria && `Categoría: ${insumo.categoria} `}
                                {insumo.marca && `| Marca: ${insumo.marca}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Mostrar si se seleccionó un insumo */}
                      {formItemData.insumo_id && (
                        <div className="text-xs text-green-400 mt-1">
                          Insumo seleccionado
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-white mb-1">Cantidad *</label>
                    <input
                      type="number"
                      name="cantidad"
                      value={formItemData.cantidad}
                      onChange={handleItemInputChange}
                      min="1"
                      step="0.01"
                      required
                      className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white mb-1">Unidad *</label>
                    <select
                      name="unidad"
                      value={formItemData.unidad}
                      onChange={handleItemInputChange}
                      required
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
                    <label className="block text-white mb-1">Urgencia</label>
                    <select
                      name="urgencia"
                      value={formItemData.urgencia}
                      onChange={handleItemInputChange}
                      className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    >
                      <option value="baja">Baja</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
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
            {requisicionActual.items.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No hay items en esta requisición
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead className="bg-vino/70 text-white">
                    <tr>
                      <th className="p-2 text-left">Insumo</th>
                      <th className="p-2 text-center">Cantidad</th>
                      <th className="p-2 text-center">Estado</th>
                      <th className="p-2 text-center">Urgencia</th>
                      <th className="p-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requisicionActual.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-700">
                        <td className="p-2">{item.insumo_nombre}</td>
                        <td className="p-2 text-center">
                          {item.cantidad} {item.unidad}
                        </td>
                        <td className="p-2 text-center">
                          <span className={`
                            px-2 py-1 rounded text-xs
                            ${item.completado ? 'bg-green-900/50 text-green-200' : 'bg-yellow-900/50 text-yellow-200'}
                          `}>
                            {item.completado ? "Completado" : "Pendiente"}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <span className={`
                            px-2 py-1 rounded text-xs
                            ${item.urgencia === 'baja' ? 'bg-blue-900/50 text-blue-200' :
                              item.urgencia === 'normal' ? 'bg-green-900/50 text-green-200' :
                              item.urgencia === 'alta' ? 'bg-yellow-900/50 text-yellow-200' :
                              'bg-red-900/50 text-red-200'}
                          `}>
                            {item.urgencia}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center gap-2">
                            {!item.completado && (
                              <button
                                onClick={() => marcarItemCompletado(requisicionActual.id, item.id, true)}
                                className="bg-green-700 text-white p-1 rounded"
                                title="Marcar como completado"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            {item.completado && (
                              <button
                                onClick={() => marcarItemCompletado(requisicionActual.id, item.id, false)}
                                className="bg-yellow-700 text-white p-1 rounded"
                                title="Marcar como pendiente"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => eliminarItem(requisicionActual.id, item.id)}
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
          </div>
          
          {!requisicionActual.completada && (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => eliminarRequisicion(requisicionActual.id)}
                className="bg-red-700 text-white px-4 py-2 rounded"
              >
                Eliminar Requisición
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lista de requisiciones */}
      {!requisicionActual && (
        <>
          {requisiciones.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No hay requisiciones registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead className="bg-vino text-white">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Solicitante</th>
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-center">Items</th>
                    <th className="p-2 text-center">Estado</th>
                    <th className="p-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requisiciones.map((requisicion) => (
                    <tr key={requisicion.id} className="border-b border-gray-700">
                      <td className="p-2">{requisicion.id}</td>
                      <td className="p-2">{requisicion.usuario_nombre || "N/A"}</td>
                      <td className="p-2">
                        {new Date(requisicion.fecha_solicitud).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-center">
                        {requisicion.items_completados} / {requisicion.total_items}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`
                          px-2 py-1 rounded text-xs
                          ${requisicion.completada ? 'bg-green-900/50 text-green-200' : 'bg-yellow-900/50 text-yellow-200'}
                        `}>
                          {requisicion.completada ? "Completada" : "Pendiente"}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => verDetalleRequisicion(requisicion.id)}
                            className="bg-amarillo text-negro p-1 rounded"
                            title="Ver detalle"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {!requisicion.completada && (
                            <button
                              onClick={() => eliminarRequisicion(requisicion.id)}
                              className="bg-red-700 text-white p-1 rounded"
                              title="Eliminar"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
} 