-- Añadir el campo "entregado" a la tabla detalles_orden
ALTER TABLE detalles_orden ADD COLUMN entregado BOOLEAN DEFAULT FALSE;

-- Actualizar los registros existentes: 
-- Si ya están preparados (preparado = TRUE), entregado = FALSE (por entregar)
-- Si no están preparados (preparado = FALSE), entregado = FALSE (no relevantes aún)
UPDATE detalles_orden SET entregado = FALSE;

-- Añadir campo tiempo_entrega para registrar cuándo se entregó
ALTER TABLE detalles_orden ADD COLUMN tiempo_entrega TIMESTAMP; 