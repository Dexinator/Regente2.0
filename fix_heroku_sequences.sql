-- Script para corregir todas las secuencias desincronizadas en Heroku
-- Ejecutar este script en las bases de datos de staging y producción de Heroku
-- Generado el 2025-01-02

-- Primero verificamos el estado actual de las secuencias
SELECT '=== ESTADO ACTUAL DE LAS SECUENCIAS ===' as info;

SELECT 
    tabla,
    max_id,
    seq_value,
    CASE 
        WHEN max_id IS NULL THEN 'OK (tabla vacía)'
        WHEN seq_value >= max_id THEN 'OK'
        ELSE 'NECESITA CORRECCIÓN'
    END as estado
FROM (
    SELECT 'categoria_producto_tipo_variante' as tabla, MAX(id) as max_id, (SELECT last_value FROM categoria_producto_tipo_variante_id_seq) as seq_value FROM categoria_producto_tipo_variante
    UNION ALL
    SELECT 'categorias_variantes', MAX(id), (SELECT last_value FROM categorias_variantes_id_seq) FROM categorias_variantes
    UNION ALL
    SELECT 'codigos_promocionales', MAX(id), (SELECT last_value FROM codigos_promocionales_id_seq) FROM codigos_promocionales
    UNION ALL
    SELECT 'compras', MAX(id), (SELECT last_value FROM compras_id_seq) FROM compras
    UNION ALL
    SELECT 'detalles_orden', MAX(id), (SELECT last_value FROM detalles_orden_id_seq) FROM detalles_orden
    UNION ALL
    SELECT 'empleados', MAX(id), (SELECT last_value FROM empleados_id_seq) FROM empleados
    UNION ALL
    SELECT 'grados', MAX(id), (SELECT last_value FROM grados_id_seq) FROM grados
    UNION ALL
    SELECT 'insumo_proveedor', MAX(id), (SELECT last_value FROM insumo_proveedor_id_seq) FROM insumo_proveedor
    UNION ALL
    SELECT 'insumos', MAX(id), (SELECT last_value FROM insumos_id_seq) FROM insumos
    UNION ALL
    SELECT 'inventario', MAX(id), (SELECT last_value FROM inventario_id_seq) FROM inventario
    UNION ALL
    SELECT 'items_compra', MAX(id), (SELECT last_value FROM items_compra_id_seq) FROM items_compra
    UNION ALL
    SELECT 'items_requisicion', MAX(id), (SELECT last_value FROM items_requisicion_id_seq) FROM items_requisicion
    UNION ALL
    SELECT 'ordenes', MAX(orden_id), (SELECT last_value FROM ordenes_orden_id_seq) FROM ordenes
    UNION ALL
    SELECT 'pagos', MAX(id), (SELECT last_value FROM pagos_id_seq) FROM pagos
    UNION ALL
    SELECT 'preso_grado', MAX(id), (SELECT last_value FROM preso_grado_id_seq) FROM preso_grado
    UNION ALL
    SELECT 'presos', MAX(id), (SELECT last_value FROM presos_id_seq) FROM presos
    UNION ALL
    SELECT 'producto_sabor', MAX(id), (SELECT last_value FROM producto_sabor_id_seq) FROM producto_sabor
    UNION ALL
    SELECT 'productos', MAX(id), (SELECT last_value FROM productos_id_seq) FROM productos
    UNION ALL
    SELECT 'productos_sentencias', MAX(id), (SELECT last_value FROM productos_sentencias_id_seq) FROM productos_sentencias
    UNION ALL
    SELECT 'proveedores', MAX(id), (SELECT last_value FROM proveedores_id_seq) FROM proveedores
    UNION ALL
    SELECT 'requisiciones', MAX(id), (SELECT last_value FROM requisiciones_id_seq) FROM requisiciones
    UNION ALL
    SELECT 'sabores', MAX(id), (SELECT last_value FROM sabores_id_seq) FROM sabores
    UNION ALL
    SELECT 'sentencias', MAX(id), (SELECT last_value FROM sentencias_id_seq) FROM sentencias
) as sequence_check
ORDER BY 
    CASE 
        WHEN max_id IS NULL THEN 2
        WHEN seq_value >= max_id THEN 2
        ELSE 1
    END, 
    tabla;

-- Corregir todas las secuencias que lo necesiten
SELECT '=== CORRIGIENDO SECUENCIAS ===' as info;

-- categoria_producto_tipo_variante
SELECT setval('categoria_producto_tipo_variante_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM categoria_producto_tipo_variante), 0) + 1, 1), false) as categoria_producto_tipo_variante_seq;

-- categorias_variantes
SELECT setval('categorias_variantes_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM categorias_variantes), 0) + 1, 1), false) as categorias_variantes_seq;

-- codigos_promocionales
SELECT setval('codigos_promocionales_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM codigos_promocionales), 0) + 1, 1), false) as codigos_promocionales_seq;

-- compras
SELECT setval('compras_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM compras), 0) + 1, 1), false) as compras_seq;

-- detalles_orden
SELECT setval('detalles_orden_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM detalles_orden), 0) + 1, 1), false) as detalles_orden_seq;

-- empleados
SELECT setval('empleados_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM empleados), 0) + 1, 1), false) as empleados_seq;

-- grados
SELECT setval('grados_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM grados), 0) + 1, 1), false) as grados_seq;

-- insumo_proveedor
SELECT setval('insumo_proveedor_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM insumo_proveedor), 0) + 1, 1), false) as insumo_proveedor_seq;

-- insumos
SELECT setval('insumos_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM insumos), 0) + 1, 1), false) as insumos_seq;

-- inventario
SELECT setval('inventario_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM inventario), 0) + 1, 1), false) as inventario_seq;

-- items_compra
SELECT setval('items_compra_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM items_compra), 0) + 1, 1), false) as items_compra_seq;

-- items_requisicion
SELECT setval('items_requisicion_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM items_requisicion), 0) + 1, 1), false) as items_requisicion_seq;

-- ordenes
SELECT setval('ordenes_orden_id_seq', GREATEST(COALESCE((SELECT MAX(orden_id) FROM ordenes), 0) + 1, 1), false) as ordenes_seq;

-- pagos
SELECT setval('pagos_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM pagos), 0) + 1, 1), false) as pagos_seq;

-- preso_grado
SELECT setval('preso_grado_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM preso_grado), 0) + 1, 1), false) as preso_grado_seq;

-- presos
SELECT setval('presos_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM presos), 0) + 1, 1), false) as presos_seq;

-- producto_sabor
SELECT setval('producto_sabor_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM producto_sabor), 0) + 1, 1), false) as producto_sabor_seq;

-- productos
SELECT setval('productos_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM productos), 0) + 1, 1), false) as productos_seq;

-- productos_sentencias
SELECT setval('productos_sentencias_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM productos_sentencias), 0) + 1, 1), false) as productos_sentencias_seq;

-- proveedores
SELECT setval('proveedores_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM proveedores), 0) + 1, 1), false) as proveedores_seq;

-- requisiciones
SELECT setval('requisiciones_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM requisiciones), 0) + 1, 1), false) as requisiciones_seq;

-- sabores
SELECT setval('sabores_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM sabores), 0) + 1, 1), false) as sabores_seq;

-- sentencias
SELECT setval('sentencias_id_seq', GREATEST(COALESCE((SELECT MAX(id) FROM sentencias), 0) + 1, 1), false) as sentencias_seq;

-- Verificar el estado final
SELECT '=== ESTADO FINAL DE LAS SECUENCIAS ===' as info;

SELECT 
    tabla,
    max_id,
    seq_value as nuevo_seq_value,
    CASE 
        WHEN max_id IS NULL THEN 'OK (tabla vacía)'
        WHEN seq_value > max_id THEN 'CORREGIDO'
        ELSE 'ERROR'
    END as estado
FROM (
    SELECT 'categoria_producto_tipo_variante' as tabla, MAX(id) as max_id, (SELECT last_value FROM categoria_producto_tipo_variante_id_seq) as seq_value FROM categoria_producto_tipo_variante
    UNION ALL
    SELECT 'categorias_variantes', MAX(id), (SELECT last_value FROM categorias_variantes_id_seq) FROM categorias_variantes
    UNION ALL
    SELECT 'codigos_promocionales', MAX(id), (SELECT last_value FROM codigos_promocionales_id_seq) FROM codigos_promocionales
    UNION ALL
    SELECT 'compras', MAX(id), (SELECT last_value FROM compras_id_seq) FROM compras
    UNION ALL
    SELECT 'detalles_orden', MAX(id), (SELECT last_value FROM detalles_orden_id_seq) FROM detalles_orden
    UNION ALL
    SELECT 'empleados', MAX(id), (SELECT last_value FROM empleados_id_seq) FROM empleados
    UNION ALL
    SELECT 'grados', MAX(id), (SELECT last_value FROM grados_id_seq) FROM grados
    UNION ALL
    SELECT 'insumo_proveedor', MAX(id), (SELECT last_value FROM insumo_proveedor_id_seq) FROM insumo_proveedor
    UNION ALL
    SELECT 'insumos', MAX(id), (SELECT last_value FROM insumos_id_seq) FROM insumos
    UNION ALL
    SELECT 'inventario', MAX(id), (SELECT last_value FROM inventario_id_seq) FROM inventario
    UNION ALL
    SELECT 'items_compra', MAX(id), (SELECT last_value FROM items_compra_id_seq) FROM items_compra
    UNION ALL
    SELECT 'items_requisicion', MAX(id), (SELECT last_value FROM items_requisicion_id_seq) FROM items_requisicion
    UNION ALL
    SELECT 'ordenes', MAX(orden_id), (SELECT last_value FROM ordenes_orden_id_seq) FROM ordenes
    UNION ALL
    SELECT 'pagos', MAX(id), (SELECT last_value FROM pagos_id_seq) FROM pagos
    UNION ALL
    SELECT 'preso_grado', MAX(id), (SELECT last_value FROM preso_grado_id_seq) FROM preso_grado
    UNION ALL
    SELECT 'presos', MAX(id), (SELECT last_value FROM presos_id_seq) FROM presos
    UNION ALL
    SELECT 'producto_sabor', MAX(id), (SELECT last_value FROM producto_sabor_id_seq) FROM producto_sabor
    UNION ALL
    SELECT 'productos', MAX(id), (SELECT last_value FROM productos_id_seq) FROM productos
    UNION ALL
    SELECT 'productos_sentencias', MAX(id), (SELECT last_value FROM productos_sentencias_id_seq) FROM productos_sentencias
    UNION ALL
    SELECT 'proveedores', MAX(id), (SELECT last_value FROM proveedores_id_seq) FROM proveedores
    UNION ALL
    SELECT 'requisiciones', MAX(id), (SELECT last_value FROM requisiciones_id_seq) FROM requisiciones
    UNION ALL
    SELECT 'sabores', MAX(id), (SELECT last_value FROM sabores_id_seq) FROM sabores
    UNION ALL
    SELECT 'sentencias', MAX(id), (SELECT last_value FROM sentencias_id_seq) FROM sentencias
) as sequence_check
ORDER BY tabla;

SELECT '=== CORRECCIÓN COMPLETADA ===' as info;