import { useState, useEffect } from "react";
import {
  getRecetas,
  getRecetaById,
  createReceta,
  updateReceta,
  deleteReceta,
  calcularCostoReceta,
  verificarDisponibilidadReceta
} from "../../utils/recetas-api";
import { getProductos } from "../../utils/api";
import { getInsumos } from "../../utils/compras-api";

export default function RecetasPanel() {
  const [recetas, setRecetas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [recetaActual, setRecetaActual] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroActiva, setFiltroActiva] = useState(true);
  const [costoReceta, setCostoReceta] = useState(null);
  const [disponibilidadReceta, setDisponibilidadReceta] = useState(null);
  const [formData, setFormData] = useState({
    producto_id: "",
    nombre_receta: "",
    descripcion: "",
    rendimiento: 1,
    ingredientes: []
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarRecetas();
  }, [filtroActiva]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      // Cargar productos e insumos
      const [productosData, insumosData] = await Promise.all([
        getProductos(),
        getInsumos()
      ]);

      setProductos(productosData);
      setInsumos(insumosData);

      // Cargar recetas
      await cargarRecetas();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los datos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const cargarRecetas = async () => {
    try {
      const data = await getRecetas({ activa: filtroActiva });
      setRecetas(data);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar las recetas. Intenta de nuevo.");
    }
  };

  const verDetalleReceta = async (id) => {
    setError("");

    try {
      const receta = await getRecetaById(id);
      setRecetaActual(receta);

      // Cargar costo y disponibilidad
      const [costo, disponibilidad] = await Promise.all([
        calcularCostoReceta(id),
        verificarDisponibilidadReceta(id, 1)
      ]);

      setCostoReceta(costo);
      setDisponibilidadReceta(disponibilidad);
    } catch (error) {
      console.error("Error:", error);
      setError("Error al cargar los detalles de la receta");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const agregarIngrediente = () => {
    setFormData({
      ...formData,
      ingredientes: [
        ...formData.ingredientes,
        {
          insumo_id: "",
          cantidad: 1,
          unidad: "unidad",
          notas: ""
        }
      ]
    });
  };

  const actualizarIngrediente = (index, campo, valor) => {
    const nuevosIngredientes = [...formData.ingredientes];
    nuevosIngredientes[index][campo] = valor;

    // Si se selecciona un insumo, actualizar la unidad por defecto
    if (campo === "insumo_id") {
      const insumoSeleccionado = insumos.find(i => i.id === parseInt(valor));
      if (insumoSeleccionado) {
        nuevosIngredientes[index].unidad = insumoSeleccionado.unidad_medida_default;
      }
    }

    setFormData({
      ...formData,
      ingredientes: nuevosIngredientes
    });
  };

  const eliminarIngrediente = (index) => {
    setFormData({
      ...formData,
      ingredientes: formData.ingredientes.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validar ingredientes
    const ingredientesValidos = formData.ingredientes.filter(
      ing => ing.insumo_id && ing.cantidad > 0
    );

    if (ingredientesValidos.length === 0) {
      setError("Debe agregar al menos un ingrediente válido");
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        ingredientes: ingredientesValidos
      };

      if (recetaActual) {
        await updateReceta(recetaActual.id, dataToSend);
      } else {
        await createReceta(dataToSend);
      }

      resetForm();
      await cargarRecetas();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al guardar la receta");
    }
  };

  const editarReceta = async (receta) => {
    setRecetaActual(receta);
    setFormData({
      producto_id: receta.producto_id,
      nombre_receta: receta.nombre_receta || "",
      descripcion: receta.descripcion || "",
      rendimiento: receta.rendimiento || 1,
      ingredientes: receta.ingredientes || []
    });
    setMostrarFormulario(true);
  };

  const eliminarReceta = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta receta?")) return;

    setError("");

    try {
      await deleteReceta(id);
      await cargarRecetas();
      if (recetaActual?.id === id) {
        setRecetaActual(null);
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al eliminar la receta");
    }
  };

  const resetForm = () => {
    setRecetaActual(null);
    setFormData({
      producto_id: "",
      nombre_receta: "",
      descripcion: "",
      rendimiento: 1,
      ingredientes: []
    });
    setMostrarFormulario(false);
  };

  if (loading) {
    return <div className="text-center py-10">Cargando recetas...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-subtitulo text-amarillo">Recetas de Productos</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filtroActiva}
              onChange={(e) => setFiltroActiva(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-white">Solo activas</span>
          </label>
          <button
            onClick={() => {
              resetForm();
              setMostrarFormulario(!mostrarFormulario);
            }}
            className="bg-amarillo text-negro px-4 py-2 rounded-full font-bold"
          >
            {mostrarFormulario ? "Cancelar" : "Nueva Receta"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Formulario de receta */}
      {mostrarFormulario && (
        <div className="bg-negro/50 p-6 rounded-lg mb-6">
          <h3 className="text-xl font-subtitulo text-amarillo mb-4">
            {recetaActual ? "Editar Receta" : "Nueva Receta"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2">Producto *</label>
                <select
                  name="producto_id"
                  value={formData.producto_id}
                  onChange={handleInputChange}
                  required
                  disabled={recetaActual}
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map(producto => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - {producto.categoria_nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white mb-2">Rendimiento</label>
                <input
                  type="number"
                  name="rendimiento"
                  value={formData.rendimiento}
                  onChange={handleInputChange}
                  min="0.1"
                  step="0.1"
                  className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-white mb-2">Nombre de la receta</label>
              <input
                type="text"
                name="nombre_receta"
                value={formData.nombre_receta}
                onChange={handleInputChange}
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                placeholder="Ej: Receta tradicional de molletes"
              />
            </div>

            <div>
              <label className="block text-white mb-2">Descripción</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="3"
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
                placeholder="Descripción o notas sobre la receta"
              />
            </div>

            {/* Ingredientes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-white">Ingredientes *</label>
                <button
                  type="button"
                  onClick={agregarIngrediente}
                  className="bg-vino text-white px-3 py-1 rounded-full text-sm"
                >
                  + Agregar ingrediente
                </button>
              </div>

              {formData.ingredientes.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No hay ingredientes. Haz clic en "Agregar ingrediente" para comenzar.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.ingredientes.map((ingrediente, index) => (
                    <div key={index} className="flex gap-2 items-center bg-negro/30 p-2 rounded">
                      <select
                        value={ingrediente.insumo_id}
                        onChange={(e) => actualizarIngrediente(index, "insumo_id", e.target.value)}
                        className="flex-1 bg-negro border border-gray-700 rounded p-1 text-white text-sm"
                        required
                      >
                        <option value="">Seleccionar insumo</option>
                        {insumos.map(insumo => (
                          <option key={insumo.id} value={insumo.id}>
                            {insumo.nombre} {insumo.marca && `- ${insumo.marca}`}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        value={ingrediente.cantidad}
                        onChange={(e) => actualizarIngrediente(index, "cantidad", parseFloat(e.target.value))}
                        min="0.001"
                        step="0.001"
                        className="w-24 bg-negro border border-gray-700 rounded p-1 text-white text-sm"
                        placeholder="Cantidad"
                        required
                      />

                      <select
                        value={ingrediente.unidad}
                        onChange={(e) => actualizarIngrediente(index, "unidad", e.target.value)}
                        className="w-32 bg-negro border border-gray-700 rounded p-1 text-white text-sm"
                        required
                      >
                        <option value="unidad">Unidad</option>
                        <option value="kg">Kilogramo</option>
                        <option value="g">Gramo</option>
                        <option value="l">Litro</option>
                        <option value="ml">Mililitro</option>
                        <option value="pza">Pieza</option>
                      </select>

                      <input
                        type="text"
                        value={ingrediente.notas}
                        onChange={(e) => actualizarIngrediente(index, "notas", e.target.value)}
                        className="flex-1 bg-negro border border-gray-700 rounded p-1 text-white text-sm"
                        placeholder="Notas (opcional)"
                      />

                      <button
                        type="button"
                        onClick={() => eliminarIngrediente(index)}
                        className="bg-red-900 text-white px-2 py-1 rounded text-sm"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-700 text-white px-4 py-2 rounded-full"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-amarillo text-negro px-6 py-2 rounded-full font-bold"
              >
                {recetaActual ? "Actualizar" : "Crear"} Receta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de recetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recetas.map((receta) => (
          <div
            key={receta.id}
            className="bg-negro/50 p-4 rounded-lg cursor-pointer hover:bg-negro/70"
            onClick={() => verDetalleReceta(receta.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold text-amarillo">
                {receta.producto_nombre}
              </h3>
              {receta.activa && (
                <span className="bg-green-900 text-green-200 px-2 py-1 rounded text-xs">
                  Activa
                </span>
              )}
            </div>
            <p className="text-white text-sm mb-2">
              {receta.nombre_receta || "Sin nombre"}
            </p>
            <div className="flex justify-between text-gray-400 text-sm">
              <span>{receta.num_ingredientes} ingredientes</span>
              <span>Rinde: {receta.rendimiento}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detalle de receta */}
      {recetaActual && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-negro/95 p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-subtitulo text-amarillo">
                  {recetaActual.producto_nombre}
                </h2>
                <p className="text-white mt-1">
                  {recetaActual.nombre_receta || "Sin nombre de receta"}
                </p>
                {recetaActual.descripcion && (
                  <p className="text-gray-400 mt-2">{recetaActual.descripcion}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setRecetaActual(null);
                  setCostoReceta(null);
                  setDisponibilidadReceta(null);
                }}
                className="text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Información general */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-negro/50 p-3 rounded">
                <p className="text-gray-400 text-sm">Rendimiento</p>
                <p className="text-white text-xl">{recetaActual.rendimiento} unidades</p>
              </div>
              {costoReceta && (
                <div className="bg-negro/50 p-3 rounded">
                  <p className="text-gray-400 text-sm">Costo Total</p>
                  <p className="text-amarillo text-xl font-bold">
                    ${costoReceta.costo_total.toFixed(2)}
                  </p>
                </div>
              )}
              {disponibilidadReceta && (
                <div className="bg-negro/50 p-3 rounded">
                  <p className="text-gray-400 text-sm">Disponibilidad</p>
                  <p className={`text-xl font-bold ${
                    disponibilidadReceta.disponible ? "text-green-400" : "text-red-400"
                  }`}>
                    {disponibilidadReceta.disponible ? "Disponible" : "No disponible"}
                  </p>
                </div>
              )}
            </div>

            {/* Ingredientes */}
            <h3 className="text-lg font-subtitulo text-amarillo mb-3">Ingredientes</h3>
            <div className="space-y-2 mb-6">
              {recetaActual.ingredientes.map((ing, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center bg-negro/30 p-3 rounded"
                >
                  <div className="flex-1">
                    <span className="text-white font-bold">
                      {ing.insumo_nombre}
                    </span>
                    {ing.marca && (
                      <span className="text-gray-400 ml-2">({ing.marca})</span>
                    )}
                    {ing.notas && (
                      <p className="text-gray-400 text-sm mt-1">{ing.notas}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-white">
                      {ing.cantidad} {ing.unidad}
                    </p>
                    {costoReceta?.detalles[index] && (
                      <p className="text-gray-400 text-sm">
                        ${(costoReceta.detalles[index].precio_promedio * ing.cantidad).toFixed(2)}
                      </p>
                    )}
                  </div>
                  {disponibilidadReceta?.ingredientes[index] && (
                    <div className="ml-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        disponibilidadReceta.ingredientes[index].disponible
                          ? "bg-green-900 text-green-200"
                          : "bg-red-900 text-red-200"
                      }`}>
                        {disponibilidadReceta.ingredientes[index].disponible
                          ? "✓"
                          : `Falta: ${(
                              disponibilidadReceta.ingredientes[index].cantidad_necesaria -
                              disponibilidadReceta.ingredientes[index].cantidad_disponible
                            ).toFixed(2)}`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => editarReceta(recetaActual)}
                className="bg-vino text-white px-4 py-2 rounded-full"
              >
                Editar
              </button>
              <button
                onClick={() => eliminarReceta(recetaActual.id)}
                className="bg-red-900 text-white px-4 py-2 rounded-full"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}