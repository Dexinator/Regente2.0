-- Script de actualización para la base de datos de staging
-- Fecha: 2025-07-01
-- Descripción: Sincronizar estructura de staging con local

-- 1. Crear tabla inventario
CREATE TABLE IF NOT EXISTS public.inventario (
    id SERIAL PRIMARY KEY,
    insumo_id integer REFERENCES public.insumos(id) ON DELETE CASCADE,
    cantidad_actual numeric(10,2) DEFAULT 0 NOT NULL,
    unidad character varying(20) NOT NULL,
    stock_minimo numeric(10,2) DEFAULT 0,
    stock_maximo numeric(10,2) DEFAULT 0,
    ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índice único para inventario
CREATE UNIQUE INDEX IF NOT EXISTS inventario_insumo_id_unidad_key ON public.inventario USING btree (insumo_id, unidad);

-- 3. Crear función actualizar_inventario
CREATE OR REPLACE FUNCTION public.actualizar_inventario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.ultima_actualizacion := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 4. Crear trigger para actualizar inventario
CREATE TRIGGER trigger_actualizar_inventario 
    BEFORE UPDATE ON public.inventario 
    FOR EACH ROW 
    EXECUTE FUNCTION public.actualizar_inventario();

-- 5. Agregar columna dias_compra a proveedores
ALTER TABLE public.proveedores 
ADD COLUMN IF NOT EXISTS dias_compra json;

-- 6. Ajustar tipo de dato de marca en insumos para que coincida con local
ALTER TABLE public.insumos 
ALTER COLUMN marca TYPE character varying(100);

-- 7. Otorgar permisos necesarios (ajustar según el usuario de staging)
GRANT ALL ON TABLE public.inventario TO u3tobu994lm3di;
GRANT USAGE, SELECT ON SEQUENCE public.inventario_id_seq TO u3tobu994lm3di;