import { useState, useEffect } from "react";
import {
  getInsumos,
  getCategoriasInsumos,
  getProveedores,
  getInsumoById,
  createInsumo,
  updateInsumo,
  deleteInsumo,
  getUnidadesMedida
} from "../../utils/compras-api";

export default function InsumosPanel() {
  const [insumos, setInsumos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState(null);
  const [mostrarInputUnidadNueva, setMostrarInputUnidadNueva] = useState(false);
  const [unidadNueva, setUnidadNueva] = useState("");
  const [insumoAEliminar, setInsumoAEliminar] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoria: "",
    marca: "",
    unidad_medida_default: "unidad",
    cantidad_por_unidad: 1,
    proveedores: []
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarInsumos();
  }, [categoriaSeleccionada]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      // Cargar categorías, proveedores y unidades en paralelo
      const [categoriasData, proveedoresData, unidadesData] = await Promise.all([
        getCategoriasInsumos(),
        getProveedores(),
        getUnidadesMedida()
      ]);
      setCategorias(categoriasData);
      setProveedores(proveedoresData);
      setUnidades(unidadesData);

      // Cargar insumos
      await cargarInsumos();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los datos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const cargarInsumos = async () => {
    try {
      const data = await getInsumos(categoriaSeleccionada || null);
      setInsumos(data);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los insumos. Intenta de nuevo.");
    }
  };

  const handleInputChange = (e) => {
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

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleProveedorChange = (e, proveedorId) => {
    const { checked } = e.target;
    
    if (checked) {
      // Agregar proveedor
      setFormData({
        ...formData,
        proveedores: [
          ...formData.proveedores,
          { id: proveedorId, precio_referencia: null }
        ]
      });
    } else {
      // Quitar proveedor
      setFormData({
        ...formData,
        proveedores: formData.proveedores.filter(p => p.id !== proveedorId)
      });
    }
  };

  const handlePrecioChange = (e, proveedorId) => {
    const precio = e.target.value ? parseFloat(e.target.value) : null;
    
    setFormData({
      ...formData,
      proveedores: formData.proveedores.map(p => 
        p.id === proveedorId ? { ...p, precio_referencia: precio } : p
      )
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Determinar la unidad a usar
    let unidadFinal = formData.unidad_medida_default;
    if (formData.unidad_medida_default === "__otra__") {
      if (!unidadNueva.trim()) {
        setError("Debe ingresar el nombre de la nueva unidad");
        return;
      }
      unidadFinal = unidadNueva.trim();
    }

    const dataToSend = {
      ...formData,
      unidad_medida_default: unidadFinal
    };

    try {
      if (insumoEditando) {
        await updateInsumo(insumoEditando.id, {
          ...dataToSend,
          activo: true
        });
      } else {
        await createInsumo(dataToSend);
      }

      resetForm();
      // Recargar datos incluyendo unidades (por si se agregó una nueva)
      await cargarDatos();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al guardar el insumo");
    }
  };

  const editarInsumo = async (id) => {
    setError("");

    try {
      // Obtener insumo con sus proveedores
      const insumo = await getInsumoById(id);

      // Verificar si la unidad del insumo existe en la lista de unidades
      const unidadExiste = unidades.some(u => u.nombre === insumo.unidad_medida_default);

      setInsumoEditando(insumo);

      if (unidadExiste) {
        setFormData({
          nombre: insumo.nombre,
          descripcion: insumo.descripcion || "",
          categoria: insumo.categoria || "",
          marca: insumo.marca || "",
          unidad_medida_default: insumo.unidad_medida_default || "",
          cantidad_por_unidad: insumo.cantidad_por_unidad || 1,
          proveedores: insumo.proveedores || []
        });
        setMostrarInputUnidadNueva(false);
        setUnidadNueva("");
      } else {
        // La unidad no existe en la tabla, mostrar como "otra"
        setFormData({
          nombre: insumo.nombre,
          descripcion: insumo.descripcion || "",
          categoria: insumo.categoria || "",
          marca: insumo.marca || "",
          unidad_medida_default: "__otra__",
          cantidad_por_unidad: insumo.cantidad_por_unidad || 1,
          proveedores: insumo.proveedores || []
        });
        setMostrarInputUnidadNueva(true);
        setUnidadNueva(insumo.unidad_medida_default || "");
      }

      setMostrarModal(true);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los datos del insumo");
    }
  };

  const confirmarEliminar = (insumo) => {
    setInsumoAEliminar(insumo);
  };

  const cancelarEliminar = () => {
    setInsumoAEliminar(null);
  };

  const eliminarInsumo = async () => {
    if (!insumoAEliminar) return;

    setError("");

    try {
      await deleteInsumo(insumoAEliminar.id);
      setInsumoAEliminar(null);
      await cargarInsumos();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al eliminar el insumo");
      setInsumoAEliminar(null);
    }
  };

  const resetForm = () => {
    setInsumoEditando(null);
    setFormData({
      nombre: "",
      descripcion: "",
      categoria: "",
      marca: "",
      unidad_medida_default: "",
      cantidad_por_unidad: 1,
      proveedores: []
    });
    setMostrarInputUnidadNueva(false);
    setUnidadNueva("");
    setMostrarModal(false);
  };

  const abrirNuevoInsumo = () => {
    resetForm();
    setMostrarModal(true);
  };

  if (loading && insumos.length === 0) {
    return <div className="text-center py-10">Cargando insumos...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-subtitulo text-amarillo">Insumos</h2>
        <button
          onClick={abrirNuevoInsumo}
          className="bg-vino text-white px-4 py-2 rounded-full font-bold"
        >
          Nuevo Insumo
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filtro por categoría */}
      <div className="mb-6">
        <label className="block text-white mb-1">Filtrar por categoría</label>
        <select
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          className="w-full md:w-64 bg-negro border border-gray-700 rounded p-2 text-white"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Modal de Formulario */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-negro border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-negro border-b border-gray-700 p-4 flex justify-between items-center">
              <h3 className="text-xl text-amarillo font-bold">
                {insumoEditando ? "Editar Insumo" : "Nuevo Insumo"}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white mb-1">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-white mb-1">Categoría</label>
                  <input
                    type="text"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    list="categorias-list"
                    className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                  />
                  <datalist id="categorias-list">
                    {categorias.map((cat, index) => (
                      <option key={index} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-white mb-1">Marca</label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-white mb-1">Unidad de Medida *</label>
                  <select
                    name="unidad_medida_default"
                    value={formData.unidad_medida_default}
                    onChange={handleInputChange}
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

                <div>
                  <label className="block text-white mb-1">Cantidad por Unidad</label>
                  <input
                    type="number"
                    name="cantidad_por_unidad"
                    value={formData.cantidad_por_unidad}
                    onChange={handleInputChange}
                    min="0.001"
                    step="0.001"
                    className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                    placeholder="Ej: 1 kg = 1000 g"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white mb-1">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                  ></textarea>
                </div>
              </div>

              {/* Selección de proveedores */}
              <div className="mb-4">
                <label className="block text-white mb-2">Proveedores</label>
                <div className="bg-negro/50 border border-gray-700 p-3 rounded max-h-48 overflow-y-auto">
                  {proveedores.length === 0 ? (
                    <p className="text-gray-400">No hay proveedores disponibles</p>
                  ) : (
                    proveedores.map((proveedor) => {
                      const isSelected = formData.proveedores.some(p => p.id === proveedor.id);
                      const precioReferencia = formData.proveedores.find(p => p.id === proveedor.id)?.precio_referencia;

                      return (
                        <div key={proveedor.id} className="mb-2 pb-2 border-b border-gray-700 last:border-0">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`proveedor-${proveedor.id}`}
                              checked={isSelected}
                              onChange={(e) => handleProveedorChange(e, proveedor.id)}
                              className="mr-2"
                            />
                            <label htmlFor={`proveedor-${proveedor.id}`} className="text-white">
                              {proveedor.nombre}
                            </label>
                          </div>

                          {isSelected && (
                            <div className="mt-2 ml-6">
                              <label className="block text-gray-300 text-sm mb-1">
                                Precio referencia:
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={precioReferencia || ""}
                                onChange={(e) => handlePrecioChange(e, proveedor.id)}
                                className="w-32 bg-negro border border-gray-700 rounded p-1 text-white"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
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
                  {insumoEditando ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {insumoAEliminar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-negro border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl text-amarillo font-bold mb-4">Confirmar Eliminación</h3>
            <p className="text-white mb-6">
              ¿Estás seguro de eliminar el insumo <span className="font-bold text-amarillo">"{insumoAEliminar.nombre}"</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelarEliminar}
                className="bg-gray-700 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarInsumo}
                className="bg-red-700 text-white px-4 py-2 rounded font-bold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {insumos.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No hay insumos registrados
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-[700px] w-full text-white table-fixed">
            <thead className="bg-vino text-white text-sm">
              <tr>
                <th className="p-2 text-left w-[22%]">Nombre</th>
                <th className="p-2 text-left w-[18%]">Categoría</th>
                <th className="p-2 text-left w-[14%]">Marca</th>
                <th className="p-2 text-left w-[12%]">Unidad</th>
                <th className="p-2 text-center w-[7%]">Cant</th>
                <th className="p-2 text-center w-[7%]">Prov.</th>
                <th className="p-2 text-center w-[20%]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((insumo) => (
                <tr key={insumo.id} className="border-b border-gray-700 hover:bg-gray-800/30">
                  <td className="p-2 truncate" title={insumo.nombre}>{insumo.nombre}</td>
                  <td className="p-2 truncate" title={insumo.categoria}>{insumo.categoria || "-"}</td>
                  <td className="p-2 truncate" title={insumo.marca}>{insumo.marca || "-"}</td>
                  <td className="p-2 truncate" title={insumo.unidad_medida_default}>{insumo.unidad_medida_default}</td>
                  <td className="p-2 text-center">{insumo.cantidad_por_unidad || 1}</td>
                  <td className="p-2 text-center">{insumo.num_proveedores || 0}</td>
                  <td className="p-2">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => editarInsumo(insumo.id)}
                        className="bg-amarillo text-negro p-1.5 rounded hover:bg-yellow-500"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmarEliminar(insumo)}
                        className="bg-red-700 text-white p-1.5 rounded hover:bg-red-600"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  );
} 