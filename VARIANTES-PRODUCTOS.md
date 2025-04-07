# Documentación: Sistema de Variantes de Productos

## Introducción

Este documento describe la implementación del sistema de variantes de productos en la aplicación. El sistema permite gestionar diferentes tipos de variantes como sabores, tamaños e ingredientes extra para los productos.

## Estructura de la Base de Datos

### Tablas Principales

1. **variantes**
```sql
CREATE TABLE variantes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL, -- 'sabor', 'tamaño', 'ingrediente', etc.
  descripcion TEXT,
  precio_adicional DECIMAL(10, 2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **producto_variante**
```sql
CREATE TABLE producto_variante (
  id SERIAL PRIMARY KEY,
  producto_id INTEGER REFERENCES productos(id),
  variante_id INTEGER REFERENCES variantes(id),
  precio_adicional DECIMAL(10, 2) DEFAULT 0,
  UNIQUE(producto_id, variante_id)
);
```

3. **detalles_orden**
```sql
CREATE TABLE detalles_orden (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER REFERENCES ordenes(id),
  producto_id INTEGER REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  empleado_id INTEGER NOT NULL,
  sabor_id INTEGER REFERENCES variantes(id),  -- Para sabores
  tamano_id INTEGER REFERENCES variantes(id),  -- Para tamaños
  ingrediente_id INTEGER REFERENCES variantes(id),  -- Para ingredientes extra
  notas TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente',
  tiempo_preparacion TIMESTAMP,
  cancelado BOOLEAN DEFAULT FALSE
);
```

4. **categorias_variantes**
```sql
CREATE TABLE categorias_variantes (
  id SERIAL PRIMARY KEY,
  categoria_id INT REFERENCES categorias(id),
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'sabores', 'tamaños', 'ingredientes'
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE
);
```

## Tipos de Variantes

Aunque utilizamos una tabla general de `variantes`, en el contexto del negocio manejamos diferentes tipos específicos:

1. **Sabor** (`sabor_id`): El sabor principal del producto
   - Ejemplo: Sabores de pulque (Fresa, Mango, etc.)
   - Ejemplo: Sabores base para cenas (Chicharrón, Pollo, etc.)

2. **Tamaño** (`tamano_id`): El tamaño del producto
   - Ejemplo: Tamaños de pulque (Vaso, Litro, etc.)

3. **Ingrediente Extra** (`ingrediente_id`): Ingredientes adicionales
   - Ejemplo: Extras para cenas (Queso extra, Chile extra, etc.)

## Flujo de Operación

### 1. Asignación de Variantes a Productos

Para configurar qué variantes están disponibles para cada producto:

```sql
-- Asignar variantes a productos
INSERT INTO producto_variante (producto_id, variante_id, precio_adicional)
VALUES 
  (1, 1, 0),  -- Producto 1 puede tener variante 1
  (1, 2, 5),  -- Producto 1 puede tener variante 2 con precio adicional
  (2, 3, 0);  -- Producto 2 puede tener variante 3
```

### 2. Creación de Órdenes con Variantes

Al crear un detalle de orden con variantes específicas:

```javascript
// Objeto del detalle de producto
const detalleProducto = {
  producto_id: 1,     // ID del producto
  cantidad: 2,        // Cantidad
  precio_unitario: 35.00,  // Precio base
  sabor_id: 12,    // ID del sabor seleccionado
  tamano_id: 3,     // ID del tamaño seleccionado
  ingrediente_id: 7, // ID del ingrediente extra
  notas: "Sin hielo"  // Notas adicionales
};
```

### 3. Consulta de Productos con sus Variantes

Para obtener productos con sus variantes disponibles:

```sql
-- Obtener variantes disponibles para un producto
SELECT p.id as producto_id, p.nombre as producto_nombre, 
       v.id as variante_id, v.nombre as variante_nombre,
       v.categoria, pv.precio_adicional
FROM productos p
JOIN producto_variante pv ON p.id = pv.producto_id
JOIN variantes v ON pv.variante_id = v.id
WHERE p.id = 1
  AND v.activo = TRUE;
```

## Lógica de Selección en Frontend

```javascript
// Comprobar si un producto ya está en la lista con las mismas variantes
const productoExistente = productosSeleccionados.find(p => 
  p.producto_id === producto.producto_id && 
  p.sabor_id === producto.sabor_id &&
  p.tamano_id === producto.tamano_id &&
  p.ingrediente_id === producto.ingrediente_id &&
  p.notas === producto.notas
);
```

## Consultas SQL Comunes

### Obtener Productos de una Orden con sus Variantes

```sql
SELECT d.id, d.orden_id, d.producto_id, p.nombre as producto_nombre, 
       d.cantidad, d.precio_unitario, 
       d.sabor_id, v1.nombre as sabor_nombre,
       d.tamano_id, v2.nombre as tamano_nombre,
       d.ingrediente_id, v3.nombre as ingrediente_nombre,
       d.notas, d.estado
FROM detalles_orden d
JOIN productos p ON d.producto_id = p.id
LEFT JOIN variantes v1 ON d.sabor_id = v1.id
LEFT JOIN variantes v2 ON d.tamano_id = v2.id
LEFT JOIN variantes v3 ON d.ingrediente_id = v3.id
WHERE d.orden_id = 123;
```

### Calcular Precio Total con Variantes

```sql
SELECT d.id, d.producto_id, p.nombre, d.cantidad, d.precio_unitario,
       d.sabor_id, v1.nombre, cv1.nombre, d.tamano_id, v2.nombre, v2.precio_adicional, v1.precio_adicional,
       (d.precio_unitario + COALESCE(v1.precio_adicional, 0) + COALESCE(v2.precio_adicional, 0)) * d.cantidad as subtotal
FROM detalles_orden d
JOIN productos p ON d.producto_id = p.id
LEFT JOIN variantes v1 ON d.sabor_id = v1.id
LEFT JOIN categorias_variantes cv1 ON v1.categoria_id = cv1.id
LEFT JOIN variantes v2 ON d.tamano_id = v2.id
WHERE d.orden_id = 123;
``` 