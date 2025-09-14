-- Script para inicializar inventario con todos los insumos existentes
-- =========================================================

-- Insertar registros de inventario para todos los insumos que no tengan inventario
INSERT INTO inventario (
    insumo_id,
    cantidad_actual,
    unidad,
    stock_minimo,
    stock_maximo,
    punto_reorden,
    tiempo_entrega_dias
)
SELECT
    i.id as insumo_id,
    0 as cantidad_actual,
    COALESCE(i.unidad_medida_default, 'unidad') as unidad,
    0 as stock_minimo,
    0 as stock_maximo,
    0 as punto_reorden,
    1 as tiempo_entrega_dias
FROM insumos i
WHERE i.activo = true
AND NOT EXISTS (
    SELECT 1
    FROM inventario inv
    WHERE inv.insumo_id = i.id
);

-- Mensaje de confirmación
DO $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM inventario;
    RAISE NOTICE 'Total de registros en inventario: %', total_count;
END $$;