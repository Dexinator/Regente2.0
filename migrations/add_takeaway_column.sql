-- Add takeaway functionality to orders table
ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS es_para_llevar BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN ordenes.es_para_llevar IS 'Indicates if the order is for takeaway (true) or dine-in (false)';