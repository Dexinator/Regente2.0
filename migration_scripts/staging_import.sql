-- Limpieza e importación de datos para staging
BEGIN;

-- Limpiar datos existentes
TRUNCATE TABLE insumo_proveedor CASCADE;
TRUNCATE TABLE insumos CASCADE;
TRUNCATE TABLE proveedores CASCADE;

-- Los INSERT se agregarán desde el export local

COMMIT;