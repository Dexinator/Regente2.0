-- Migration script to add origen_compra column to staging database
-- Generated: 2025-01-14
-- Purpose: Synchronize staging database with local development

-- Add origen_compra column to compras table
ALTER TABLE compras
ADD COLUMN IF NOT EXISTS origen_compra VARCHAR(255);

-- Set default value for existing records
-- Using 'manual' as default for existing purchases
UPDATE compras
SET origen_compra = 'manual'
WHERE origen_compra IS NULL;

-- Optional: Add comment to document the column
COMMENT ON COLUMN compras.origen_compra IS 'Origin of the purchase: manual, requisicion, inventario, etc.';