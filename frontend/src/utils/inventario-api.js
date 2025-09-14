/**
 * Utilidades para la API del sistema de inventario
 */
import { fetchApi } from "./api.js";

// Inventario
export const getInventario = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.categoria) params.append("categoria", filters.categoria);
  if (filters.bajo_minimo) params.append("bajo_minimo", filters.bajo_minimo);
  if (filters.estado_stock) params.append("estado_stock", filters.estado_stock);
  if (filters.con_alertas) params.append("con_alertas", filters.con_alertas);

  const query = params.toString() ? `?${params.toString()}` : "";
  return await fetchApi(`/inventario${query}`);
};

export const getInventarioByInsumo = async (insumoId) => {
  return await fetchApi(`/inventario/insumo/${insumoId}`);
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

export const updateNivelesInventario = async (insumoId, unidad, niveles) => {
  return await fetchApi(`/inventario/${insumoId}/${unidad}/niveles`, {
    method: "PUT",
    body: JSON.stringify(niveles),
  });
};

// Estadísticas
export const getEstadisticasInventario = async () => {
  return await fetchApi("/inventario/estadisticas");
};

export const getInventarioBajoPorProveedor = async (proveedorId) => {
  return await fetchApi(`/inventario/proveedor/${proveedorId}/bajo-minimo`);
};

// Alertas
export const getAlertasInventario = async (atendidas = false) => {
  const query = `?atendidas=${atendidas}`;
  return await fetchApi(`/inventario/alertas${query}`);
};

export const atenderAlerta = async (alertaId, usuarioId) => {
  return await fetchApi(`/inventario/alertas/${alertaId}/atender`, {
    method: "PUT",
    body: JSON.stringify({ usuario_id: usuarioId }),
  });
};

// Movimientos
export const getMovimientosInventario = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.insumo_id) params.append("insumo_id", filters.insumo_id);
  if (filters.tipo_movimiento) params.append("tipo_movimiento", filters.tipo_movimiento);
  if (filters.fecha_inicio) params.append("fecha_inicio", filters.fecha_inicio);
  if (filters.fecha_fin) params.append("fecha_fin", filters.fecha_fin);
  if (filters.limit) params.append("limit", filters.limit);

  const query = params.toString() ? `?${params.toString()}` : "";
  return await fetchApi(`/inventario/movimientos${query}`);
};

// Sugerencias de reorden
export const getSugerenciasReorden = async () => {
  return await fetchApi("/inventario/sugerencias-reorden");
};