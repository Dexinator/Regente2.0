# Sistema de Variantes de Productos en Regente 2.0

Este documento explica en detalle cómo funciona el sistema de variantes de productos en Regente 2.0, incluyendo su estructura, implementación y consideraciones para futuras modificaciones.

## Estructura de Datos

### Tablas Principales

1. **productos**: Contiene los productos base (ej. Pulque, Cena, Postre)

2. **sabores**: A pesar de su nombre, contiene TODAS las variantes (sabores, tamaños, ingredientes)
   ```sql
   CREATE TABLE sabores (
     id SERIAL PRIMARY KEY,
     nombre VARCHAR(100) NOT NULL,
     descripcion TEXT,
     categoria_id INTEGER REFERENCES categorias_variantes(id),
     disponible BOOLEAN DEFAULT TRUE,
     precio_adicional DECIMAL(10,2) DEFAULT 0
   );
   ```

3. **categorias_variantes**: Agrupa los tipos de variantes por función
   ```sql
   CREATE TABLE categorias_variantes (
     id SERIAL PRIMARY KEY,
     nombre VARCHAR(100) NOT NULL,
     tipo_variante VARCHAR(50) NOT NULL
   );
   ```
   - Tipos actuales: "pulque_sabor", "tamaño", "sabor_comida", "ingrediente_extra"

4. **categoria_producto_tipo_variante**: Define qué tipos de variantes aplican a qué categorías
   ```sql
   CREATE TABLE categoria_producto_tipo_variante (
     id SERIAL PRIMARY KEY,
     categoria_producto VARCHAR(50) NOT NULL,  -- Ej: "Pulque", "Cena"
     tipo_variante VARCHAR(50) NOT NULL        -- Ej: "pulque_sabor", "ingrediente_extra"
   );
   ```

5. **producto_sabor**: Establece relaciones entre productos específicos y variantes disponibles
   ```sql
   CREATE TABLE producto_sabor (
     id SERIAL PRIMARY KEY,
     producto_id INTEGER REFERENCES productos(id),
     sabor_id INTEGER REFERENCES sabores(id)
   );
   ```

6. **detalles_orden**: Contiene los productos pedidos, incluyendo referencias a sus variantes
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

### Configuraciones Actuales 

#### Categorías de Variantes
| ID | Nombre | Tipo Variante |
|----|--------|---------------|
| 1 | Sabores de comida | sabor_comida |
| 2 | Sabores de pulque Natural | pulque_sabor |
| 3 | Sabores de pulque Temporada | pulque_sabor |
| 4 | Sabores de pulque A la Carta | pulque_sabor |
| 5 | Sabores de pulque Especial | pulque_sabor |
| 6 | Tamaños de pulque | tamaño |
| 7 | Ingredientes Extra | ingrediente_extra |

#### Tipos de Variantes por Categoría de Producto
| ID | Categoría Producto | Tipo Variante |
|----|-------------------|---------------|
| 1 | Cenas | sabor_comida |
| 2 | Pulque | pulque_sabor |
| 3 | Pulque | tamaño |
| 4 | Cena | sabor_comida |
| 5 | Cenas | ingrediente_extra |
| 6 | Cena | ingrediente_extra |

## Funcionamiento del Sistema de Variantes

### 1. Tipos de Variantes

Cada producto puede tener hasta tres tipos de variantes, todas almacenadas en la tabla `sabores`:

1. **Sabor** (`sabor_id`): El sabor principal del producto
   - Para Pulques: "Sin sabor", "Mango", "Manzana", etc.
   - Para Cenas: "Carne árabe", "Chorizo argentino", etc.

2. **Tamaño** (`tamano_id`): Aplicable principalmente a Pulques
   - "Medio litro", "Litro", "5 Litros", etc.
   - Cada tamaño puede tener precio adicional (ej. "Litro Natural" +$30.00)

3. **Ingrediente Extra** (`ingrediente_id`): Aplicable principalmente a Cenas
   - "Extra árabe", "Extra Chorizo", etc.
   - Tienen precios adicionales (ej. +$15.00)

### 2. Flujo del Sistema

El sistema funciona siguiendo estos pasos:

1. **Configuración** (a nivel de base de datos):
   - Se definen categorías de variantes en `categorias_variantes`
   - Se asocian tipos de variantes a categorías de productos en `categoria_producto_tipo_variante`
   - Se establecen qué variantes específicas están disponibles para cada producto en `producto_sabor`

2. **Selección de Producto** (en la interfaz):
   - Usuario selecciona un producto (ej. "Pulque")
   - El sistema consulta `categoria_producto_tipo_variante` para saber qué tipos de variantes mostrar
   - Para Pulques: muestra selectores de sabor y tamaño
   - Para Cenas: muestra selectores de sabor base e ingrediente extra

3. **Filtrado de Variantes**:
   - Para cada selector, se consulta `producto_sabor` para mostrar solo las variantes disponibles para ese producto específico
   - Ejemplo: un Pulque Natural solo muestra sabores de la categoría "Sabores de pulque Natural"

4. **Cálculo de Precio**:
   ```
   Precio Final = Precio Base + Precio Adicional Sabor + Precio Adicional Tamaño + Precio Adicional Ingrediente
   ```

5. **Almacenamiento en Orden**:
   - Al confirmar, se guarda en `detalles_orden` con todos los IDs de variantes seleccionadas

### 3. Asignación según Categoría

Cada categoría de producto tiene un comportamiento específico:

| Categoría | Sabor | Tamaño | Ingrediente Extra |
|-----------|-------|--------|------------------|
| Pulques   | ✅    | ✅     | ❌               |
| Cenas     | ✅    | ❌     | ✅               |
| Otros     | Opcional | Opcional | Opcional    |

## Implementación en el Frontend

### Componentes principales

1. **AgregarProducto.jsx**: Permite seleccionar productos con sus variantes
2. **CrearOrden.jsx**: Gestiona la creación de órdenes con productos y variantes
3. **GestionOrden.jsx**: Muestra y gestiona órdenes, incluyendo cancelaciones
4. **PedidosCocina.jsx** e **HistorialCocina.jsx**: Muestran productos con sus variantes en cocina

### Flujo de Selección de Variantes

1. **Consulta de configuración**:
   ```javascript
   // Obtener tipos de variantes para una categoría de producto
   const obtenerTiposVariante = async (categoriaProducto) => {
     const res = await fetch(`/api/variantes/tipos-por-categoria/${categoriaProducto}`);
     return await res.json();
   };

   // Obtener variantes disponibles para un producto específico
   const obtenerVariantesProducto = async (productoId, tipoVariante) => {
     const res = await fetch(`/api/productos/${productoId}/variantes/${tipoVariante}`);
     return await res.json();
   };
   ```

2. **Interfaz dinámica según categoría**:
   ```javascript
   const [producto, setProducto] = useState(null);
   const [tiposVariante, setTiposVariante] = useState([]);
   
   useEffect(() => {
     if (producto) {
       obtenerTiposVariante(producto.categoria)
         .then(tipos => setTiposVariante(tipos));
     }
   }, [producto]);
   
   // Renderizar selectores según tipos de variante
   return (
     <div>
       {tiposVariante.includes('pulque_sabor') && (
         <SelectorSabor producto={producto} />
       )}
       {tiposVariante.includes('tamaño') && (
         <SelectorTamaño producto={producto} />
       )}
       {tiposVariante.includes('ingrediente_extra') && (
         <SelectorIngrediente producto={producto} />
       )}
     </div>
   );
   ```

3. **Objeto de producto finalizado**:
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

## Consultas SQL Frecuentes

### 1. Obtener tipos de variantes para una categoría

```sql
SELECT cv.tipo_variante 
FROM categoria_producto_tipo_variante cptv
JOIN categorias_variantes cv ON cv.tipo_variante = cptv.tipo_variante
WHERE cptv.categoria_producto = $1;
```

### 2. Obtener variantes disponibles para un producto

```sql
SELECT s.* 
FROM producto_sabor ps
JOIN sabores s ON ps.sabor_id = s.id
JOIN categorias_variantes cv ON s.categoria_id = cv.id
WHERE ps.producto_id = $1 AND cv.tipo_variante = $2;
```

### 3. Obtener productos con variantes completas

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

## Consideraciones para Futuras Modificaciones

### 1. Añadir un nuevo tipo de variante

Para añadir un nuevo tipo de variante (ej. "Toppings"):

1. **Base de datos**: 
   - Insertar nuevo registro en `categorias_variantes` con el nuevo tipo
   - Añadir las posibles variantes en la tabla `sabores` con ese categoria_id
   - Asociar el tipo de variante con categorías de productos en `categoria_producto_tipo_variante`
   - Crear relaciones producto-variante en `producto_sabor`
   - Si es necesario, añadir un nuevo campo en `detalles_orden` (ej. `topping_id`)

2. **Backend**:
   - Actualizar las consultas SQL en los endpoints relevantes

3. **Frontend**:
   - Modificar los componentes para mostrar la nueva variante
   - Actualizar la lógica de selección y envío al backend
   - Actualizar la visualización en todos los componentes relevantes

### 2. Modificar categorías existentes

Para cambiar qué variantes aplican a qué categorías:

1. Actualizar los registros en `categoria_producto_tipo_variante`
2. No es necesario modificar código si solo cambia la configuración

### 3. Cambiar el cálculo de precios

Si se desea modificar cómo se calculan los precios:

1. Actualizar la lógica en los modelos del backend donde se calculan subtotales
2. Actualizar los cálculos en el frontend donde se muestre el precio

## Conclusión

El sistema de variantes en Regente 2.0 es altamente flexible y bien estructurado, permitiendo:

1. **Configuración dinámica** de qué variantes aplican a cada categoría
2. **Separación clara** entre tipos de variantes y productos
3. **Precios modulares** con adicionales por cada variante
4. **Adaptabilidad** para diferentes categorías de productos
5. **Extensibilidad** para añadir nuevos tipos de variantes sin cambiar estructura

Para cambios futuros, siempre revisar las tablas de configuración antes de modificar código, ya que gran parte de la lógica está controlada por datos en la base de datos. 