-- Migración: Sistema de unidades de medida normalizado
-- Fecha: 2026-01-05
-- Descripción:
--   1. Crea la tabla unidades_medida
--   2. Normaliza los datos existentes en insumos
--   3. Agrega FK entre insumos y unidades_medida

-- ============================================
-- PASO 1: Crear tabla de unidades de medida
-- ============================================
CREATE TABLE IF NOT EXISTS unidades_medida (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    abreviatura VARCHAR(20),
    categoria VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar unidades de medida estándar
INSERT INTO unidades_medida (nombre, abreviatura, categoria) VALUES
    ('Kilogramo', 'kg', 'Peso'),
    ('Gramo', 'g', 'Peso'),
    ('Litro', 'L', 'Volumen'),
    ('Mililitro', 'ml', 'Volumen'),
    ('Pieza', 'pza', 'Unidad'),
    ('Unidad', 'und', 'Unidad'),
    ('Paquete', 'paq', 'Unidad'),
    ('Caja', 'caja', 'Unidad'),
    ('Bolsa', 'bolsa', 'Unidad'),
    ('Mes', 'mes', 'Tiempo'),
    ('Docena', 'doc', 'Unidad'),
    ('Manojo', 'manojo', 'Unidad'),
    ('Bote', 'bote', 'Unidad'),
    ('Lata', 'lata', 'Unidad'),
    ('Frasco', 'frasco', 'Unidad'),
    ('6 Piezas', '6pz', 'Paquete'),
    ('12 Piezas', '12pz', 'Paquete'),
    ('24 Piezas', '24pz', 'Paquete'),
    ('Por definir', 'N/A', 'Otro')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- PASO 2: Normalizar datos existentes en insumos
-- ============================================
-- IMPORTANTE: Ejecutar solo si la tabla insumos ya tiene datos

-- Normalizar variantes de Kilogramo
UPDATE insumos SET unidad_medida_default = 'Kilogramo'
WHERE unidad_medida_default IN ('Kg', 'kg');

-- Normalizar variantes de Gramo
UPDATE insumos SET unidad_medida_default = 'Gramo'
WHERE unidad_medida_default IN ('g', 'gr', 'Gr');

-- Normalizar variantes de Litro
UPDATE insumos SET unidad_medida_default = 'Litro'
WHERE unidad_medida_default IN ('Lt', 'l');

-- Normalizar variantes de Mililitro
UPDATE insumos SET unidad_medida_default = 'Mililitro'
WHERE unidad_medida_default IN ('ml', 'Ml');

-- Normalizar variantes de Pieza
UPDATE insumos SET unidad_medida_default = 'Pieza'
WHERE unidad_medida_default IN ('pieza', 'pza', 'piezas');

-- Normalizar variantes de Unidad
UPDATE insumos SET unidad_medida_default = 'Unidad'
WHERE unidad_medida_default = 'unidad';

-- Normalizar variantes de Bolsa
UPDATE insumos SET unidad_medida_default = 'Bolsa'
WHERE unidad_medida_default = 'bolsa';

-- Normalizar variantes de Mes
UPDATE insumos SET unidad_medida_default = 'Mes'
WHERE unidad_medida_default = 'mes';

-- ============================================
-- PASO 3: Agregar Foreign Key
-- ============================================
-- IMPORTANTE: Solo ejecutar después de normalizar los datos

ALTER TABLE insumos
ADD CONSTRAINT fk_insumos_unidad_medida
FOREIGN KEY (unidad_medida_default)
REFERENCES unidades_medida(nombre);

-- ============================================
-- VERIFICACIÓN (opcional)
-- ============================================
-- SELECT i.unidad_medida_default, u.nombre, COUNT(*)
-- FROM insumos i
-- LEFT JOIN unidades_medida u ON i.unidad_medida_default = u.nombre
-- GROUP BY i.unidad_medida_default, u.nombre
-- ORDER BY COUNT(*) DESC;
