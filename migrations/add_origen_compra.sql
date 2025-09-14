-- Permitir que proveedor_id sea nulo en la tabla compras
ALTER TABLE compras
ALTER COLUMN proveedor_id DROP NOT NULL;

-- Añadir campo origen_compra para registrar de dónde viene la compra cuando no hay proveedor
ALTER TABLE compras
ADD COLUMN IF NOT EXISTS origen_compra VARCHAR(255);

-- Añadir comentario explicativo
COMMENT ON COLUMN compras.origen_compra IS 'Origen de la compra cuando no hay proveedor registrado (ej: Tianguis, Mercado local, Vendedor ocasional)';

-- Crear índice para búsquedas por origen
CREATE INDEX IF NOT EXISTS idx_compras_origen ON compras(origen_compra) WHERE origen_compra IS NOT NULL;

-- Actualizar la vista o query para incluir el nuevo campo
-- Esto es solo para documentación, las queries se actualizarán en el código