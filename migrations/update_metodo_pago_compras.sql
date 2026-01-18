-- Migración: Actualizar métodos de pago en compras
-- Fecha: 2026-01-17
-- Nuevos métodos: efectivo, transfer bbva, transfer Mercado Pago, pendiente de pago

-- Primero, actualizar registros existentes que tengan métodos que ya no serán válidos
UPDATE compras SET metodo_pago = 'efectivo' WHERE metodo_pago NOT IN ('efectivo', 'transfer bbva', 'transfer Mercado Pago', 'pendiente de pago');

-- También actualizar los que tenían 'transferencia' a un valor más específico (puedes ajustar esto)
UPDATE compras SET metodo_pago = 'transfer bbva' WHERE metodo_pago = 'transferencia';

-- Eliminar el constraint existente
ALTER TABLE compras DROP CONSTRAINT IF EXISTS compras_metodo_pago_check;

-- Crear el nuevo constraint con los métodos actualizados
ALTER TABLE compras ADD CONSTRAINT compras_metodo_pago_check
CHECK (metodo_pago IN ('efectivo', 'transfer bbva', 'transfer Mercado Pago', 'pendiente de pago'));

-- Verificar los valores actuales
SELECT DISTINCT metodo_pago, COUNT(*) as cantidad FROM compras GROUP BY metodo_pago;
