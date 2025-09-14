/**
 * Utilidades para la API del sistema de recetas
 */
import { fetchApi } from "./api.js";

// Recetas
export const getRecetas = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.activa !== undefined) params.append("activa", filters.activa);
  if (filters.categoria_id) params.append("categoria_id", filters.categoria_id);

  const query = params.toString() ? `?${params.toString()}` : "";
  return await fetchApi(`/recetas${query}`);
};

export const getRecetaById = async (id) => {
  return await fetchApi(`/recetas/${id}`);
};

export const getRecetaByProducto = async (productoId) => {
  return await fetchApi(`/recetas/producto/${productoId}`);
};

export const createReceta = async (data) => {
  return await fetchApi("/recetas", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateReceta = async (id, data) => {
  return await fetchApi(`/recetas/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const deleteReceta = async (id) => {
  return await fetchApi(`/recetas/${id}`, {
    method: "DELETE",
  });
};

export const calcularCostoReceta = async (id) => {
  return await fetchApi(`/recetas/${id}/costo`);
};

export const verificarDisponibilidadReceta = async (id, cantidad = 1) => {
  const query = cantidad ? `?cantidad=${cantidad}` : "";
  return await fetchApi(`/recetas/${id}/disponibilidad${query}`);
};