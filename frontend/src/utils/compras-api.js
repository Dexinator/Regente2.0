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
  
  const query = params.toString() ? `?${params.toString()}` : "";
  return await fetchApi(`/compras${query}`);
};

export const getCompraById = async (id) => {
  return await fetchApi(`/compras/${id}`);
};

export const createCompra = async (data) => {
  return await fetchApi("/compras", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateCompra = async (id, data) => {
  return await fetchApi(`/compras/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
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