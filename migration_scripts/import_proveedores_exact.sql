-- Importación exacta de proveedores desde CSV
BEGIN;

-- Crear tabla temporal para importar CSV
CREATE TEMP TABLE temp_proveedores (
    id text,
    nombre text,
    rfc text,
    direccion text,
    telefono text,
    email text,
    contacto_nombre text,
    fecha_alta text,
    activo text,
    dias_compra text,
    extra1 text,
    extra2 text
);

-- Copiar desde CSV
\COPY temp_proveedores FROM '/tmp/Proveedores 2.0.csv' WITH (FORMAT CSV, HEADER true, ENCODING 'UTF8');

-- Insertar en proveedores procesando los datos
INSERT INTO proveedores (id, nombre, rfc, direccion, telefono, email, contacto_nombre, fecha_alta, activo, dias_compra)
SELECT 
    CAST(id AS integer),
    COALESCE(nombre, ''),
    COALESCE(rfc, ''),
    COALESCE(direccion, ''),
    COALESCE(telefono, ''),
    COALESCE(email, ''),
    COALESCE(contacto_nombre, ''),
    '2025-01-01'::date, -- Fecha por defecto
    CASE WHEN activo = 't' THEN true ELSE false END,
    NULL -- dias_compra como NULL por ahora debido al formato complejo
FROM temp_proveedores
WHERE id IS NOT NULL AND id != '';

-- Actualizar secuencia
SELECT setval('proveedores_id_seq', (SELECT MAX(id) FROM proveedores));

-- Mostrar resultado
SELECT COUNT(*) as total_proveedores FROM proveedores;
SELECT id, nombre FROM proveedores ORDER BY id;

COMMIT;