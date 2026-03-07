-- Implementación del Sistema de Compras para Regente 2.0
-- Creación de tablas, índices y restricciones

-- 1. Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rfc VARCHAR(13) NOT NULL UNIQUE,
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    contacto_nombre VARCHAR(100),
    fecha_alta DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT TRUE
);

-- Índices para proveedores
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_rfc ON proveedores(rfc);

-- 2. Tabla de Insumos
CREATE TABLE IF NOT EXISTS insumos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    categoria VARCHAR(50),
    unidad_medida_default VARCHAR(20) NOT NULL DEFAULT 'unidad',
    fecha_alta DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT TRUE
);

-- Índices para insumos
CREATE INDEX IF NOT EXISTS idx_insumos_nombre ON insumos(nombre);
CREATE INDEX IF NOT EXISTS idx_insumos_categoria ON insumos(categoria);

-- 3. Tabla de relación entre Insumos y Proveedores
CREATE TABLE IF NOT EXISTS insumo_proveedor (
    id SERIAL PRIMARY KEY,
    insumo_id INTEGER REFERENCES insumos(id),
    proveedor_id INTEGER REFERENCES proveedores(id),
    precio_referencia NUMERIC(10,2),
    UNIQUE(insumo_id, proveedor_id)
);

-- 4. Tabla de Requisiciones
CREATE TABLE IF NOT EXISTS requisiciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES empleados(id),
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_completada TIMESTAMP,
    completada BOOLEAN DEFAULT FALSE,
    notas TEXT
);

-- Índices para requisiciones
CREATE INDEX IF NOT EXISTS idx_requisiciones_usuario ON requisiciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_requisiciones_completada ON requisiciones(completada);

-- 5. Tabla de Items de Requisición
CREATE TABLE IF NOT EXISTS items_requisicion (
    id SERIAL PRIMARY KEY,
    requisicion_id INTEGER REFERENCES requisiciones(id) ON DELETE CASCADE,
    insumo_id INTEGER REFERENCES insumos(id),
    cantidad NUMERIC(10,2) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    urgencia VARCHAR(20) DEFAULT 'normal',
    completado BOOLEAN DEFAULT FALSE
);

-- Índices para items de requisición
CREATE INDEX IF NOT EXISTS idx_items_req_requisicion ON items_requisicion(requisicion_id);
CREATE INDEX IF NOT EXISTS idx_items_req_insumo ON items_requisicion(insumo_id);

-- 6. Tabla de Compras
CREATE TABLE IF NOT EXISTS compras (
    id SERIAL PRIMARY KEY,
    proveedor_id INTEGER REFERENCES proveedores(id),
    usuario_id INTEGER REFERENCES empleados(id),
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10,2) NOT NULL,
    metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    solicito_factura BOOLEAN DEFAULT FALSE,
    numero_factura VARCHAR(50),
    notas TEXT
);

-- Índices para compras
CREATE INDEX IF NOT EXISTS idx_compras_proveedor ON compras(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_compras_usuario ON compras(usuario_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON compras(fecha_compra);

-- 7. Tabla de Items de Compra
CREATE TABLE IF NOT EXISTS items_compra (
    id SERIAL PRIMARY KEY,
    compra_id INTEGER REFERENCES compras(id) ON DELETE CASCADE,
    insumo_id INTEGER REFERENCES insumos(id),
    requisicion_item_id INTEGER REFERENCES items_requisicion(id),
    precio_unitario NUMERIC(10,2) NOT NULL,
    cantidad NUMERIC(10,2) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    subtotal NUMERIC(10,2) GENERATED ALWAYS AS (precio_unitario * cantidad) STORED
);

-- Índices para items de compra
CREATE INDEX IF NOT EXISTS idx_items_compra_compra ON items_compra(compra_id);
CREATE INDEX IF NOT EXISTS idx_items_compra_insumo ON items_compra(insumo_id);
CREATE INDEX IF NOT EXISTS idx_items_compra_req_item ON items_compra(requisicion_item_id);

-- 8. Vista para análisis de precios por insumo y proveedor
CREATE OR REPLACE VIEW analisis_precios_insumos AS
SELECT 
    i.id AS insumo_id,
    i.nombre AS insumo_nombre,
    i.categoria,
    p.id AS proveedor_id,
    p.nombre AS proveedor_nombre,
    ic.unidad,
    AVG(ic.precio_unitario) AS precio_promedio,
    MIN(ic.precio_unitario) AS precio_minimo,
    MAX(ic.precio_unitario) AS precio_maximo,
    COUNT(ic.id) AS num_compras,
    MAX(c.fecha_compra) AS ultima_compra
FROM insumos i
JOIN items_compra ic ON i.id = ic.insumo_id
JOIN compras c ON ic.compra_id = c.id
JOIN proveedores p ON c.proveedor_id = p.id
GROUP BY i.id, i.nombre, i.categoria, p.id, p.nombre, ic.unidad
ORDER BY i.nombre, p.nombre;

-- 9. Función para marcar requisiciones como completadas
CREATE OR REPLACE FUNCTION actualizar_estado_requisicion()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el estado del item de requisición
    UPDATE items_requisicion 
    SET completado = TRUE
    WHERE id = NEW.requisicion_item_id;
    
    -- Verificar si todos los items de la requisición están completados
    IF NOT EXISTS (
        SELECT 1 FROM items_requisicion 
        WHERE requisicion_id = (
            SELECT requisicion_id FROM items_requisicion WHERE id = NEW.requisicion_item_id
        ) 
        AND completado = FALSE
    ) THEN
        -- Si todos están completados, actualizar la requisición
        UPDATE requisiciones
        SET completada = TRUE, fecha_completada = CURRENT_TIMESTAMP
        WHERE id = (
            SELECT requisicion_id FROM items_requisicion WHERE id = NEW.requisicion_item_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar automáticamente el estado de requisiciones
CREATE TRIGGER trigger_actualizar_requisicion
AFTER INSERT ON items_compra
FOR EACH ROW
WHEN (NEW.requisicion_item_id IS NOT NULL)
EXECUTE FUNCTION actualizar_estado_requisicion();

-- 10. Datos iniciales para pruebas (opcional)
-- Insertar algunos proveedores de ejemplo
INSERT INTO proveedores (nombre, rfc) VALUES 
('Walmart', 'WAL010101ABC'),
('Costco', 'COS020202DEF'),
('Abarrotes El Preso', 'ABP030303GHI'),
('Distribuidora de Especias', 'DES040404JKL');

-- Insertar algunos insumos de ejemplo
INSERT INTO insumos (nombre, descripcion, categoria, unidad_medida_default) VALUES 
('Canela en polvo', 'Canela molida para cocina', 'Especias', 'gr'),
('Azúcar', 'Azúcar estándar', 'Básicos', 'kg'),
('Harina de trigo', 'Harina para todo uso', 'Básicos', 'kg'),
('Pulque natural', 'Pulque sin sabor para preparaciones', 'Bebidas', 'litro'),
('Papel higiénico', 'Para baños', 'Limpieza', 'rollo');

-- Relacionar insumos con proveedores
INSERT INTO insumo_proveedor (insumo_id, proveedor_id, precio_referencia) VALUES
(1, 1, 45.50),  -- Canela en Walmart
(1, 3, 40.00),  -- Canela en Abarrotes El Preso
(1, 4, 35.00),  -- Canela en Distribuidora de Especias
(2, 1, 25.00),  -- Azúcar en Walmart
(2, 2, 22.50),  -- Azúcar en Costco
(3, 1, 18.00),  -- Harina en Walmart
(3, 2, 16.50),  -- Harina en Costco
(4, 3, 50.00),  -- Pulque en Abarrotes El Preso
(5, 1, 12.00),  -- Papel higiénico en Walmart
(5, 2, 10.00);  -- Papel higiénico en Costco 