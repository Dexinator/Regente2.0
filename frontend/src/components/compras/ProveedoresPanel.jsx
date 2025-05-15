import { useState, useEffect } from "react";
import { 
  getProveedores, 
  createProveedor, 
  updateProveedor, 
  deleteProveedor 
} from "../../utils/compras-api";

export default function ProveedoresPanel() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    rfc: "",
    direccion: "",
    telefono: "",
    email: "",
    contacto_nombre: ""
  });

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    setLoading(true);
    setError("");
    
    try {
      const data = await getProveedores();
      setProveedores(data);
    } catch (error) {
      console.error("Error:", error);
      setError("No se pudieron cargar los proveedores. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      if (proveedorEditando) {
        await updateProveedor(proveedorEditando.id, formData);
      } else {
        await createProveedor(formData);
      }
      
      resetForm();
      await cargarProveedores();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al guardar el proveedor");
    }
  };

  const editarProveedor = (proveedor) => {
    setProveedorEditando(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      rfc: proveedor.rfc,
      direccion: proveedor.direccion || "",
      telefono: proveedor.telefono || "",
      email: proveedor.email || "",
      contacto_nombre: proveedor.contacto_nombre || ""
    });
    setMostrarFormulario(true);
  };

  const eliminarProveedor = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este proveedor?")) return;
    
    setError("");
    
    try {
      await deleteProveedor(id);
      await cargarProveedores();
    } catch (error) {
      console.error("Error:", error);
      setError(error.message || "Error al eliminar el proveedor");
    }
  };

  const resetForm = () => {
    setProveedorEditando(null);
    setFormData({
      nombre: "",
      rfc: "",
      direccion: "",
      telefono: "",
      email: "",
      contacto_nombre: ""
    });
    setMostrarFormulario(false);
  };

  if (loading) {
    return <div className="text-center py-10">Cargando proveedores...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-subtitulo text-amarillo">Proveedores</h2>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-vino text-white px-4 py-2 rounded-full font-bold"
        >
          {mostrarFormulario ? "Cancelar" : "Nuevo Proveedor"}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-white p-3 rounded mb-4">
          {error}
        </div>
      )}

      {mostrarFormulario && (
        <form onSubmit={handleSubmit} className="bg-negro/50 p-4 rounded-lg mb-6">
          <h3 className="text-xl text-amarillo mb-4">
            {proveedorEditando ? "Editar Proveedor" : "Nuevo Proveedor"}
          </h3>
          
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
              <label className="block text-white mb-1">RFC *</label>
              <input
                type="text"
                name="rfc"
                value={formData.rfc}
                onChange={handleInputChange}
                required
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-white mb-1">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-white mb-1">Teléfono</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-white mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-white mb-1">Nombre de Contacto</label>
              <input
                type="text"
                name="contacto_nombre"
                value={formData.contacto_nombre}
                onChange={handleInputChange}
                className="w-full bg-negro border border-gray-700 rounded p-2 text-white"
              />
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
              {proveedorEditando ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {proveedores.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          No hay proveedores registrados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-white">
            <thead className="bg-vino text-white">
              <tr>
                <th className="p-2 text-left">Nombre</th>
                <th className="p-2 text-left">RFC</th>
                <th className="p-2 text-left">Teléfono</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((proveedor) => (
                <tr key={proveedor.id} className="border-b border-gray-700">
                  <td className="p-2">{proveedor.nombre}</td>
                  <td className="p-2">{proveedor.rfc}</td>
                  <td className="p-2">{proveedor.telefono || "-"}</td>
                  <td className="p-2">{proveedor.email || "-"}</td>
                  <td className="p-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => editarProveedor(proveedor)}
                        className="bg-amarillo text-negro p-1 rounded"
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => eliminarProveedor(proveedor.id)}
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
  );
} 