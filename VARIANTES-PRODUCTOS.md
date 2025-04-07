# Sistema de Variantes de Productos en Regente 2.0

Este documento explica en detalle cómo funciona el sistema de variantes de productos en Regente 2.0, incluyendo su estructura, implementación y consideraciones para futuras modificaciones.

## Estructura de Datos

### Tablas Principales

- **productos**: Contiene los productos base (ej. Pulque, Cena, Postre)
- **sabores**: A pesar de su nombre, contiene TODAS las variantes (sabores, tamaños, ingredientes)
- **categorias_variantes**: Agrupa los tipos de variantes (ej. "Sabores de Pulque", "Tamaños", "Ingredientes Extra")
- **detalles_orden**: Contiene los productos pedidos, incluyendo referencias a sus variantes

### Campos clave en `detalles_orden`

```sql
CREATE TABLE detalles_orden (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER REFERENCES ordenes(orden_id),
  producto_id INTEGER REFERENCES productos(id),
  cantidad INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  preparado BOOLEAN DEFAULT FALSE,
  sabor_id INTEGER REFERENCES sabores(id),  -- Para sabores
  tamano_id INTEGER REFERENCES sabores(id), -- Para tamaños
  ingrediente_id INTEGER REFERENCES sabores(id), -- Para ingredientes extra
  notas TEXT,
  tiempo_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tiempo_preparacion TIMESTAMP
);
```

### Relación con la tabla `sabores`

```sql
CREATE TABLE sabores (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  categoria_id INTEGER REFERENCES categorias_variantes(id),
  precio_adicional DECIMAL(10,2) DEFAULT 0,
  disponible BOOLEAN DEFAULT TRUE
);
```

## Funcionamiento del Sistema de Variantes

### 1. Tipos de Variantes

Cada producto puede tener hasta tres tipos de variantes, todas almacenadas en la tabla `sabores`:

1. **Sabor** (`sabor_id`): El sabor principal del producto
   - Ejemplos: "Avena", "Coco", "Mango" para pulques
   - Ejemplos: "Regular", "Vegetariana" para cenas

2. **Tamaño** (`tamano_id`): Generalmente usado solo para pulques
   - Ejemplos: "Chico", "Mediano", "Grande"

3. **Ingrediente Extra** (`ingrediente_id`): Generalmente usado para cenas
   - Ejemplos: "Queso extra", "Chorizo", "Tocino"

### 2. Asignación según Categoría

Cada categoría de producto tiene un comportamiento específico:

| Categoría | Sabor | Tamaño | Ingrediente Extra |
|-----------|-------|--------|------------------|
| Pulques   | ✅    | ✅     | ❌               |
| Cenas     | ✅    | ❌     | ✅               |
| Otros     | Opcional | Opcional | Opcional    |

### 3. Cálculo de Precios

El precio final de un producto se calcula:
```
Precio Final = Precio Base + Precio Adicional Sabor + Precio Adicional Tamaño + Precio Adicional Ingrediente
```

Cada variante puede tener un `precio_adicional` en la tabla `sabores`.

## Implementación en el Frontend

### Componentes principales

1. **AgregarProducto.jsx**: Permite seleccionar productos con sus variantes
2. **CrearOrden.jsx**: Gestiona la creación de órdenes con productos y variantes
3. **GestionOrden.jsx**: Muestra y gestiona órdenes, incluyendo cancelaciones
4. **PedidosCocina.jsx** e **HistorialCocina.jsx**: Muestran productos con sus variantes en cocina

### Flujo de Selección de Variantes

1. El usuario selecciona un producto de una categoría
2. Según la categoría, se muestran selectores específicos:
   - Para **Pulques**: Selector de sabor + selector de tamaño
   - Para **Cenas**: Selector de base (sabor) + selector de ingrediente extra opcional

3. Al añadir a la orden, se guardan todos los IDs de variantes seleccionadas

```javascript
// Ejemplo de objeto enviado al backend
const productoSeleccionado = {
  producto_id: 5,
  cantidad: 2,
  sabor_id: 12,    // ID del sabor seleccionado
  tamano_id: 3,    // ID del tamaño seleccionado (si aplica)
  ingrediente_id: 8, // ID del ingrediente extra (si aplica)
  notas: "Sin azúcar"
};
```

## Manejo de Cancelaciones

Las cancelaciones se registran como entradas adicionales en `detalles_orden` con cantidad negativa.

### Consideraciones importantes:

1. **Variantes idénticas**: Al cancelar, se debe identificar exactamente el mismo producto con las mismas variantes
2. **Cantidad disponible**: No se pueden cancelar más unidades que las disponibles (originales - canceladas)
3. **Productos preparados**: No se pueden cancelar productos ya preparados

### Cálculo de disponibilidad para cancelación

```javascript
// Código para calcular productos disponibles para cancelar
let cantidadCancelada = 0;
      
if (Array.isArray(orden.productos)) {
  orden.productos.forEach(p => {
    if (p.es_cancelacion && 
        p.producto_id === producto.producto_id && 
        p.sabor_id === producto.sabor_id && 
        p.tamano_id === producto.tamano_id && 
        p.ingrediente_id === producto.ingrediente_id) {
      cantidadCancelada += Math.abs(p.cantidad);
    }
  });
}

const cantidadDisponible = Math.max(0, producto.cantidad - cantidadCancelada);
```

## Visualización en Interfaz

### Formato de visualización:

- **Pulques**: `[Nombre] - [Sabor] ([Tamaño])`
- **Cenas**: `[Nombre] - [Sabor base] + [Ingrediente extra]`
- **Otros**: `[Nombre] - [Sabor]` (si aplica)

### Ejemplo en componente PedidosCocina:

```javascript
const formatearDetallesProducto = (producto) => {
  let detalles = producto.nombre;
  const esPulque = producto.categoria === 'Pulque' || producto.categoria === 'Pulques';
  const esCena = producto.categoria === 'Cena' || producto.categoria === 'Cenas';
  
  // Añadir sabor si existe
  if (producto.sabor_nombre) {
    detalles += ` - ${producto.sabor_nombre}`;
  }
  
  // Añadir tamaño para pulques
  if (esPulque && producto.tamano_nombre) {
    detalles += ` (${producto.tamano_nombre})`;
  }
  
  // Añadir ingrediente extra para cenas
  if (esCena && producto.ingrediente_nombre) {
    detalles += ` + ${producto.ingrediente_nombre}`;
  }

  return detalles;
};
```

## Consideraciones para Futuras Modificaciones

### 1. Añadir un nuevo tipo de variante

Para añadir un nuevo tipo de variante (ej. "Toppings"):

1. **Backend**: 
   - Añadir un nuevo campo en `detalles_orden` (ej. `topping_id`)
   - Asegurarse que tenga una foreign key a `sabores`
   - Actualizar las consultas SQL en los endpoints relevantes

2. **Frontend**:
   - Modificar los componentes para mostrar la nueva variante
   - Actualizar la lógica de selección y envío al backend
   - Actualizar la visualización en todos los componentes relevantes

### 2. Modificar categorías existentes

Para cambiar qué variantes aplican a qué categorías:

1. Actualizar la lógica condicional en los componentes frontend
2. Actualizar las verificaciones en el backend (si hay reglas específicas)

### 3. Cambiar el cálculo de precios

Si se desea modificar cómo se calculan los precios:

1. Actualizar la lógica en los modelos del backend
2. Actualizar los cálculos en el frontend donde se muestre el precio

## Ejemplos de Consultas SQL Importantes

### Obtener productos con variantes

```sql
SELECT 
  p.id AS producto_id,
  p.nombre, 
  SUM(d.cantidad) AS cantidad, 
  d.precio_unitario,
  d.sabor_id,
  s.nombre AS sabor_nombre,
  cv.nombre AS sabor_categoria,
  d.tamano_id,
  t.nombre AS tamano_nombre,
  t.precio_adicional AS tamano_precio,
  s.precio_adicional AS sabor_precio,
  d.ingrediente_id,
  i.nombre AS ingrediente_nombre,
  i.precio_adicional AS ingrediente_precio,
  cvi.nombre AS ingrediente_categoria,
  d.notas
FROM detalles_orden d
JOIN productos p ON d.producto_id = p.id
LEFT JOIN sabores s ON d.sabor_id = s.id
LEFT JOIN categorias_variantes cv ON s.categoria_id = cv.id
LEFT JOIN sabores t ON d.tamano_id = t.id
LEFT JOIN sabores i ON d.ingrediente_id = i.id
LEFT JOIN categorias_variantes cvi ON i.categoria_id = cvi.id
WHERE d.orden_id = $1
GROUP BY p.id, p.nombre, d.precio_unitario, d.producto_id, 
         d.sabor_id, s.nombre, cv.nombre, d.tamano_id, t.nombre, t.precio_adicional, s.precio_adicional, 
         d.ingrediente_id, i.nombre, i.precio_adicional, cvi.nombre, d.notas
```

## Conclusión

El sistema de variantes en Regente 2.0 es flexible y permite manejar diferentes tipos de productos con sus características específicas. Si necesitas implementar nuevas características, revisa cuidadosamente los puntos mencionados en "Consideraciones para Futuras Modificaciones". 