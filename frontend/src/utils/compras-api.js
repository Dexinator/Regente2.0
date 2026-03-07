/**
 * Utilidades para la API del sistema de compras
 */
import { fetchApi } from "./api.js";

// Proveedores
export const getProveedores = async () => {
  return await fetchApi("/proveedores");
};

export const getProveedorById = async (id) => {
  return await fetchApi(`/proveedores/${id}`);
};

export const createProveedor = async (data) => {
  return await fetchApi("/proveedores", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateProveedor = async (id, data) => {
  return await fetchApi(`/proveedores/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteProveedor = async (id) => {
  return await fetchApi(`/proveedores/${id}`, {
    method: "DELETE",
  });
};

export const getInsumosByProveedor = async (id) => {
  return await fetchApi(`/proveedores/${id}/insumos`);
};

// Insumos
export const getInsumos = async (categoria = null) => {
  const query = categoria ? `?categoria=${encodeURIComponent(categoria)}` : "";
  return await fetchApi(`/insumos${query}`);
};

export const getInsumoById = async (id) => {
  return await fetchApi(`/insumos/${id}`);
};

export const getCategoriasInsumos = async () => {
  return await fetchApi("/insumos/categorias");
};

export const createInsumo = async (data) => {
  return await fetchApi("/insumos", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateInsumo = async (id, data) => {
  return await fetchApi(`/insumos/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteInsumo = async (id) => {
  return await fetchApi(`/insumos/${id}`, {
    method: "DELETE",
  });
};

// Requisiciones
export const getRequisiciones = async (completada = null) => {
  const query = completada !== null ? `?completada=${completada}` : "";
  return await fetchApi(`/requisiciones${query}`);
};

export const getRequisicionById = async (id) => {
  return await fetchApi(`/requisiciones/${id}`);
};

export const createRequisicion = async (data) => {
  return await fetchApi("/requisiciones", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateRequisicion = async (id, data) => {
  return await fetchApi(`/requisiciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteRequisicion = async (id) => {
  return await fetchApi(`/requisiciones/${id}`, {
    method: "DELETE",
  });
};

export const addItemRequisicion = async (requisicionId, data) => {
  return await fetchApi(`/requisiciones/${requisicionId}/items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateItemRequisicion = async (requisicionId, itemId, data) => {
  return await fetchApi(`/requisiciones/${requisicionId}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteItemRequisicion = async (requisicionId, itemId) => {
  return await fetchApi(`/requisiciones/${requisicionId}/items/${itemId}`, {
    method: "DELETE",
  });
};

// Compras
export const getCompras = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.proveedor_id) params.append("proveedor_id", filters.proveedor_id);
  if (filters.fecha_inicio) params.append("fecha_inicio", filters.fecha_inicio);
  if (filters.fecha_fin) params.append("fecha_fin", filters.fecha_fin);
  if (filters.metodo_pago) params.append("metodo_pago", filters.metodo_pago);

  const query = params.toString() ? `?${params.toString()}` : "";
  return await fetchApi(`/compras${query}`);
};

export const getCompraById = async (id) => {
  return await fetchApi(`/compras/${id}`);
};

export const createCompra = async (data) => {
  // Asegurar que la fecha esté en el formato correcto
  if (data.fecha_compra) {
    data.fecha_compra = new Date(data.fecha_compra).toISOString();
  }
  // Limpiar campos según el tipo de compra
  // Si proveedor_id es 'otro', convertir a null y usar origen_compra
  // Si proveedor_id ya es null pero hay origen_compra, preservar origen_compra
  const cleanedData = {
    ...data,
    proveedor_id: data.proveedor_id === 'otro' ? null : (data.proveedor_id || null),
    origen_compra: data.proveedor_id === 'otro' ? data.origen_compra : (data.proveedor_id ? null : data.origen_compra)
  };
  return await fetchApi("/compras", {
    method: "POST",
    body: JSON.stringify(cleanedData),
  });
};

export const updateCompra = async (id, data) => {
  // Asegurar que la fecha esté en el formato correcto si se proporciona
  if (data.fecha_compra) {
    data.fecha_compra = new Date(data.fecha_compra).toISOString();
  }
  // Limpiar campos según el tipo de compra
  // Si proveedor_id es 'otro', convertir a null y usar origen_compra
  // Si proveedor_id ya es null pero hay origen_compra, preservar origen_compra
  const cleanedData = {
    ...data,
    proveedor_id: data.proveedor_id === 'otro' ? null : (data.proveedor_id || null),
    origen_compra: data.proveedor_id === 'otro' ? data.origen_compra : (data.proveedor_id ? null : data.origen_compra)
  };
  return await fetchApi(`/compras/${id}`, {
    method: "PUT",
    body: JSON.stringify(cleanedData),
  });
};

export const deleteCompra = async (id) => {
  return await fetchApi(`/compras/${id}`, {
    method: "DELETE",
  });
};

export const addItemCompra = async (compraId, data) => {
  return await fetchApi(`/compras/${compraId}/items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateItemCompra = async (compraId, itemId, data) => {
  return await fetchApi(`/compras/${compraId}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteItemCompra = async (compraId, itemId) => {
  return await fetchApi(`/compras/${compraId}/items/${itemId}`, {
    method: "DELETE",
  });
};

export const getAnalisisPrecios = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.insumo_id) params.append("insumo_id", filters.insumo_id);
  if (filters.proveedor_id) params.append("proveedor_id", filters.proveedor_id);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  return await fetchApi(`/compras/analisis-precios${query}`);
};

export const getItemsRequisicionPendientes = async (proveedor_id = null) => {
  const query = proveedor_id ? `?proveedor_id=${proveedor_id}` : "";
  return await fetchApi(`/compras/items-requisicion-pendientes${query}`);
};

// Nuevas funciones para días de compra y compras del día
export const getDiasCompraDisponibles = async () => {
  return await fetchApi("/proveedores/dias-compra/disponibles");
};

export const getProveedoresPorDia = async (dia) => {
  return await fetchApi(`/proveedores/dia/${dia}`);
};

export const getComprasDelDia = async (dia, proveedor_id = null) => {
  const query = proveedor_id ? `?proveedor_id=${proveedor_id}` : "";
  return await fetchApi(`/compras/dia/${dia}${query}`);
};

// Funciones de inventario
export const getInventario = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.categoria) params.append("categoria", filters.categoria);
  if (filters.bajo_minimo) params.append("bajo_minimo", filters.bajo_minimo);
  
  const query = params.toString() ? `?${params.toString()}` : "";
  return await fetchApi(`/inventario${query}`);
};

export const getInventarioByInsumo = async (insumo_id) => {
  return await fetchApi(`/inventario/insumo/${insumo_id}`);
};

export const updateInventario = async (data) => {
  return await fetchApi("/inventario", {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const ajustarInventario = async (data) => {
  return await fetchApi("/inventario/ajustar", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const getInventarioBajoPorProveedor = async (proveedor_id) => {
  return await fetchApi(`/inventario/proveedor/${proveedor_id}/bajo-minimo`);
};

export const getEstadisticasInventario = async () => {
  return await fetchApi("/inventario/estadisticas");
};

// Unidades de Medida
export const getUnidadesMedida = async () => {
  return await fetchApi("/unidades");
}; 