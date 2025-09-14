-- Sistema de Recetas y Control de Inventario
-- =============================================

-- Tabla de recetas (vincula productos con sus insumos)
CREATE TABLE IF NOT EXISTS recetas (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    nombre_receta VARCHAR(100),
    descripcion TEXT,
    rendimiento NUMERIC(10,2) DEFAULT 1, -- Cuántas porciones/unidades rinde
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id) -- Un producto tiene una sola receta activa
);

-- Tabla de ingredientes de recetas (insumos necesarios por producto)
CREATE TABLE IF NOT EXISTS receta_ingredientes (
    id SERIAL PRIMARY KEY,
    receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    insumo_id INTEGER NOT NULL REFERENCES insumos(id),
    cantidad NUMERIC(10,3) NOT NULL, -- Cantidad necesaria del insumo
    unidad VARCHAR(20) NOT NULL, -- Unidad de medida
    notas TEXT,
    UNIQUE(receta_id, insumo_id)
);

-- Agregar campos de control de inventario a la tabla inventario si no existen
ALTER TABLE inventario
ADD COLUMN IF NOT EXISTS punto_reorden NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tiempo_entrega_dias INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS ultima_alerta TIMESTAMP;

-- Tabla de movimientos de inventario para trazabilidad
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    insumo_id INTEGER NOT NULL REFERENCES insumos(id),
    tipo_movimiento VARCHAR(20) NOT NULL CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste', 'venta', 'merma')),
    cantidad NUMERIC(10,3) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    referencia_tipo VARCHAR(50), -- 'orden', 'compra', 'ajuste_manual', etc.
    referencia_id INTEGER, -- ID de la orden, compra, etc.
    usuario_id INTEGER REFERENCES empleados(id),
    notas TEXT,
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de alertas de inventario
CREATE TABLE IF NOT EXISTS alertas_inventario (
    id SERIAL PRIMARY KEY,
    insumo_id INTEGER NOT NULL REFERENCES insumos(id),
    tipo_alerta VARCHAR(20) NOT NULL CHECK (tipo_alerta IN ('stock_minimo', 'punto_reorden', 'sin_stock')),
    nivel_actual NUMERIC(10,2),
    nivel_requerido NUMERIC(10,2),
    urgencia VARCHAR(20) DEFAULT 'normal' CHECK (urgencia IN ('baja', 'normal', 'alta', 'critica')),
    atendida BOOLEAN DEFAULT false,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_atendida TIMESTAMP,
    usuario_atendio_id INTEGER REFERENCES empleados(id)
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_recetas_producto ON recetas(producto_id);
CREATE INDEX IF NOT EXISTS idx_receta_ingredientes_receta ON receta_ingredientes(receta_id);
CREATE INDEX IF NOT EXISTS idx_receta_ingredientes_insumo ON receta_ingredientes(insumo_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_insumo ON movimientos_inventario(insumo_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_alertas_atendida ON alertas_inventario(atendida);
CREATE INDEX IF NOT EXISTS idx_alertas_insumo ON alertas_inventario(insumo_id);

-- Función para descontar inventario al vender un producto
CREATE OR REPLACE FUNCTION descontar_inventario_venta()
RETURNS TRIGGER AS $$
DECLARE
    ingrediente RECORD;
    inventario_actual RECORD;
    nueva_cantidad NUMERIC;
BEGIN
    -- Solo procesar si el producto se marca como preparado
    IF NEW.preparado = true AND OLD.preparado = false THEN
        -- Buscar la receta del producto
        FOR ingrediente IN
            SELECT ri.*, r.rendimiento
            FROM receta_ingredientes ri
            JOIN recetas r ON ri.receta_id = r.id
            WHERE r.producto_id = NEW.producto_id
            AND r.activa = true
        LOOP
            -- Buscar el inventario actual del insumo
            SELECT * INTO inventario_actual
            FROM inventario
            WHERE insumo_id = ingrediente.insumo_id
            AND unidad = ingrediente.unidad
            LIMIT 1;

            IF inventario_actual IS NOT NULL THEN
                -- Calcular nueva cantidad considerando la cantidad del producto vendido
                nueva_cantidad := inventario_actual.cantidad_actual -
                    (ingrediente.cantidad * ABS(NEW.cantidad) / COALESCE(ingrediente.rendimiento, 1));

                -- Actualizar inventario
                UPDATE inventario
                SET cantidad_actual = GREATEST(0, nueva_cantidad),
                    ultima_actualizacion = CURRENT_TIMESTAMP
                WHERE id = inventario_actual.id;

                -- Registrar movimiento
                INSERT INTO movimientos_inventario (
                    insumo_id, tipo_movimiento, cantidad, unidad,
                    referencia_tipo, referencia_id, usuario_id, notas
                ) VALUES (
                    ingrediente.insumo_id,
                    'venta',
                    -(ingrediente.cantidad * ABS(NEW.cantidad) / COALESCE(ingrediente.rendimiento, 1)),
                    ingrediente.unidad,
                    'orden',
                    NEW.orden_id,
                    NEW.preparado_por_empleado_id,
                    'Descuento automático por venta - Producto: ' || NEW.producto_id
                );

                -- Verificar niveles y crear alertas si es necesario
                IF nueva_cantidad <= COALESCE(inventario_actual.stock_minimo, 0) THEN
                    -- Verificar si no hay alerta activa
                    IF NOT EXISTS (
                        SELECT 1 FROM alertas_inventario
                        WHERE insumo_id = ingrediente.insumo_id
                        AND atendida = false
                        AND tipo_alerta = CASE
                            WHEN nueva_cantidad <= 0 THEN 'sin_stock'
                            ELSE 'stock_minimo'
                        END
                    ) THEN
                        INSERT INTO alertas_inventario (
                            insumo_id, tipo_alerta, nivel_actual,
                            nivel_requerido, urgencia
                        ) VALUES (
                            ingrediente.insumo_id,
                            CASE
                                WHEN nueva_cantidad <= 0 THEN 'sin_stock'
                                ELSE 'stock_minimo'
                            END,
                            nueva_cantidad,
                            inventario_actual.stock_minimo,
                            CASE
                                WHEN nueva_cantidad <= 0 THEN 'critica'
                                WHEN nueva_cantidad <= inventario_actual.stock_minimo * 0.5 THEN 'alta'
                                ELSE 'normal'
                            END
                        );
                    END IF;
                END IF;
            ELSE
                -- Si no existe inventario para ese insumo, crearlo con cantidad 0
                INSERT INTO inventario (
                    insumo_id, cantidad_actual, unidad,
                    stock_minimo, stock_maximo
                ) VALUES (
                    ingrediente.insumo_id, 0, ingrediente.unidad, 0, 0
                );

                -- Crear alerta de sin stock
                INSERT INTO alertas_inventario (
                    insumo_id, tipo_alerta, nivel_actual,
                    nivel_requerido, urgencia
                ) VALUES (
                    ingrediente.insumo_id, 'sin_stock', 0, 0, 'critica'
                );
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para descontar inventario
DROP TRIGGER IF EXISTS trigger_descontar_inventario_venta ON detalles_orden;
CREATE TRIGGER trigger_descontar_inventario_venta
AFTER UPDATE ON detalles_orden
FOR EACH ROW
EXECUTE FUNCTION descontar_inventario_venta();

-- Función para actualizar inventario al registrar una compra
CREATE OR REPLACE FUNCTION actualizar_inventario_compra()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar o insertar en inventario
    INSERT INTO inventario (insumo_id, cantidad_actual, unidad)
    VALUES (NEW.insumo_id, NEW.cantidad, NEW.unidad)
    ON CONFLICT (insumo_id, unidad)
    DO UPDATE SET
        cantidad_actual = inventario.cantidad_actual + NEW.cantidad,
        ultima_actualizacion = CURRENT_TIMESTAMP;

    -- Registrar movimiento
    INSERT INTO movimientos_inventario (
        insumo_id, tipo_movimiento, cantidad, unidad,
        referencia_tipo, referencia_id, notas
    ) VALUES (
        NEW.insumo_id, 'entrada', NEW.cantidad, NEW.unidad,
        'compra', NEW.compra_id,
        'Entrada por compra'
    );

    -- Marcar alertas como atendidas si el stock se recuperó
    UPDATE alertas_inventario
    SET atendida = true,
        fecha_atendida = CURRENT_TIMESTAMP
    WHERE insumo_id = NEW.insumo_id
    AND atendida = false
    AND EXISTS (
        SELECT 1 FROM inventario i
        WHERE i.insumo_id = NEW.insumo_id
        AND i.cantidad_actual > i.stock_minimo
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar inventario en compras
DROP TRIGGER IF EXISTS trigger_actualizar_inventario_compra ON items_compra;
CREATE TRIGGER trigger_actualizar_inventario_compra
AFTER INSERT ON items_compra
FOR EACH ROW
EXECUTE FUNCTION actualizar_inventario_compra();

-- Vista para panel de control de inventario
CREATE OR REPLACE VIEW vista_control_inventario AS
SELECT
    i.id,
    i.insumo_id,
    ins.nombre as insumo_nombre,
    ins.categoria,
    ins.marca,
    i.cantidad_actual,
    i.unidad,
    i.stock_minimo,
    i.stock_maximo,
    i.punto_reorden,
    CASE
        WHEN i.cantidad_actual <= 0 THEN 'sin_stock'
        WHEN i.cantidad_actual <= i.stock_minimo THEN 'critico'
        WHEN i.cantidad_actual <= i.punto_reorden THEN 'reordenar'
        WHEN i.cantidad_actual >= i.stock_maximo THEN 'exceso'
        ELSE 'normal'
    END as estado_stock,
    i.ultima_actualizacion,
    (
        SELECT COUNT(*)
        FROM alertas_inventario ai
        WHERE ai.insumo_id = i.insumo_id
        AND ai.atendida = false
    ) as alertas_activas
FROM inventario i
JOIN insumos ins ON i.insumo_id = ins.id
WHERE ins.activo = true
ORDER BY
    CASE
        WHEN i.cantidad_actual <= 0 THEN 1
        WHEN i.cantidad_actual <= i.stock_minimo THEN 2
        WHEN i.cantidad_actual <= i.punto_reorden THEN 3
        ELSE 4
    END,
    ins.nombre;