-- Script final de migración a staging
BEGIN;

-- Limpiar completamente las tablas
TRUNCATE TABLE insumo_proveedor CASCADE;
TRUNCATE TABLE insumos CASCADE;  
TRUNCATE TABLE proveedores CASCADE;

-- Los INSERT vienen del export

COMMIT;