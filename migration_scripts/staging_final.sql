-- Migración final a staging con datos correctos
BEGIN;

-- Limpiar tablas
TRUNCATE TABLE insumo_proveedor CASCADE;
TRUNCATE TABLE insumos CASCADE;
TRUNCATE TABLE proveedores CASCADE;

-- Los INSERT vienen del export

COMMIT;