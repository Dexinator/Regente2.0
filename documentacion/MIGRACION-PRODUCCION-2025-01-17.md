# Migración a Producción - 17 de Enero 2025

## Resumen de la Migración

Se actualizó la base de datos de producción con la estructura y datos maestros de staging, preservando los datos históricos críticos.

## Cambios Aplicados

### 1. Nuevas Tablas Agregadas

#### Módulo de Sentencias (Combos):
- `sentencias` - Definición de combos
- `productos_sentencias` - Productos que componen las sentencias

#### Módulo de Compras:
- `proveedores` - Gestión de proveedores
- `insumos` - Catálogo de insumos con marca
- `insumo_proveedor` - Relación insumos-proveedores
- `requisiciones` - Solicitudes de compra
- `items_requisicion` - Detalles de requisiciones
- `compras` - Órdenes de compra
- `items_compra` - Detalles de compras
- `inventario` - Movimientos de inventario

### 2. Modificaciones a Tablas Existentes

#### detalles_orden:
- Agregadas columnas:
  - `sentencia_id` (INTEGER) - Referencia a sentencias
  - `es_sentencia_principal` (BOOLEAN NOT NULL DEFAULT false)
  - `sentencia_detalle_orden_padre_id` (INTEGER) - Para componentes de sentencia
  - `estado` (VARCHAR(50) DEFAULT 'pendiente')
  - `nombre_sentencia` (VARCHAR(255))
  - `descripcion_sentencia` (TEXT)
- Modificado `producto_id` para permitir NULL (necesario para sentencias principales)
- Agregados índices para mejorar performance

### 3. Datos Migrados

#### Actualizados desde Staging:
- 53 productos (catálogo actualizado)
- 131 sabores/variantes
- 6 sentencias (combos)
- 7 proveedores
- 199 insumos
- Todas las relaciones producto-variante

#### Preservados de Producción:
- 471 clientes registrados (presos)
- 7 empleados con credenciales
- 5 códigos promocionales activos
- Historial de grados de clientes

### 4. Correcciones Post-Migración

#### Error 1: "column nombre_sentencia does not exist"
**Problema**: Las columnas `nombre_sentencia` y `descripcion_sentencia` no existían en producción.
**Solución**: Se agregaron ambas columnas a la tabla `detalles_orden`.

#### Error 2: "null value in column empleado_id"
**Problema**: Al marcar productos como preparados parcialmente, no se incluía `empleado_id` en el nuevo registro.
**Solución**: Se modificó la función `marcarProductoComoPreparado` en `orders.model.js` para incluir todos los campos requeridos.

## Datos Históricos Respaldados

Se exportaron a CSV antes de la migración:
- `produccion_pagos_con_clientes.csv` - Historial completo de pagos
- `produccion_ordenes_con_clientes.csv` - Todas las órdenes históricas
- `produccion_detalles_orden_con_productos.csv` - Detalles de órdenes con nombres

## Scripts Generados

1. `backup_staging_[timestamp].sql` - Backup completo de staging
2. `backup_production_[timestamp].sql` - Backup completo de producción pre-migración
3. `produccion_datos_a_preservar.sql` - Datos específicos a mantener
4. `new_tables_ddl.sql` - DDL de tablas nuevas
5. `fix_production_detalles_orden.sql` - Correcciones post-migración

## Verificación Final

✅ Sistema de combos (sentencias) operativo
✅ Módulo de compras completo instalado
✅ Todos los clientes históricos preservados
✅ Endpoint /orders/cocina funcionando correctamente
✅ Preparación parcial de productos funcionando

## Notas Importantes

- La migración requirió truncar todas las tablas transaccionales (órdenes, pagos)
- Se resolvieron conflictos de IDs en productos manteniendo los de staging
- El campo `estado` en `detalles_orden` existe solo en producción (parte de estructura anterior)
- Los índices y constraints se alinearon con staging manteniendo compatibilidad