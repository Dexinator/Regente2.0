BEGIN;

-- Crear tabla temporal para importar el CSV completo
CREATE TEMP TABLE temp_insumos (
    id text,
    nombre text,
    descripcion text,
    categoria text,
    unidad_medida_default text,
    fecha_alta text,
    activo text,
    marca text,
    cantidad_por_unidad text,
    extra1 text,
    extra2 text,
    extra3 text,
    extra4 text,
    extra5 text,
    precio text
);

-- Importar desde el CSV
COPY temp_insumos
FROM '/tmp/Insumos 2.0.csv'
WITH (FORMAT CSV, HEADER true, ENCODING 'UTF8');

-- Insertar en la tabla real procesando los datos
INSERT INTO insumos (id, nombre, descripcion, categoria, unidad_medida_default, fecha_alta, activo, marca, cantidad_por_unidad)
SELECT 
    CAST(id AS integer),
    COALESCE(nombre, ''),
    COALESCE(descripcion, 'Por definir'),
    COALESCE(categoria, ''),
    COALESCE(unidad_medida_default, 'unidad'),
    TO_DATE(fecha_alta, 'DD/MM/YYYY'),
    CASE WHEN activo = 't' THEN true ELSE false END,
    COALESCE(marca, 'Por definir'),
    CAST(COALESCE(NULLIF(cantidad_por_unidad, ''), '1') AS numeric)
FROM temp_insumos
WHERE id IS NOT NULL AND id != '';

-- Actualizar secuencia
SELECT setval('insumos_id_seq', (SELECT MAX(id) FROM insumos));

-- Mostrar conteo
SELECT COUNT(*) as total_insumos_importados FROM insumos;

COMMIT;