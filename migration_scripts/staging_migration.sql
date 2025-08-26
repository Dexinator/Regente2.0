-- Script de migración a Staging
-- Fecha: 2025-01-30

BEGIN;

-- Deshabilitar restricciones temporalmente
SET session_replication_role = 'replica';

-- Limpiar tablas existentes
DELETE FROM insumo_proveedor;
DELETE FROM insumos;
DELETE FROM proveedores;

-- Los datos se insertarán desde local_to_staging.sql

-- Reactivar restricciones
SET session_replication_role = 'origin';

-- Actualizar secuencias
SELECT setval('proveedores_id_seq', COALESCE((SELECT MAX(id) FROM proveedores), 1));
SELECT setval('insumos_id_seq', COALESCE((SELECT MAX(id) FROM insumos), 1));
SELECT setval('insumo_proveedor_id_seq', COALESCE((SELECT MAX(id) FROM insumo_proveedor), 1));

COMMIT;