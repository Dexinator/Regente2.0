-- Move takeaway functionality from order level to product level

-- 1. Add es_para_llevar column to detalles_orden table
ALTER TABLE detalles_orden ADD COLUMN IF NOT EXISTS es_para_llevar BOOLEAN DEFAULT FALSE;

-- 2. Add comment for documentation
COMMENT ON COLUMN detalles_orden.es_para_llevar IS 'Indicates if this specific product is for takeaway (true) or dine-in (false)';

-- 3. Remove es_para_llevar from ordenes table
ALTER TABLE ordenes DROP COLUMN IF EXISTS es_para_llevar;