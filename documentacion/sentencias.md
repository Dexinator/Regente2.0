# Sistema de Sentencias en Regente 2.0

## Definición

Las "sentencias" son combos predefinidos de productos que se ofrecen a un precio especial. Cada sentencia tiene:
- Un producto principal (la sentencia misma) con nombre, descripción y precio
- Varios productos componentes que forman parte de la sentencia

## Estructura de Datos

### Tablas Principales

1. **sentencias**
   ```sql
   CREATE TABLE sentencias (
     id SERIAL PRIMARY KEY,
     nombre VARCHAR(100) NOT NULL,
     descripcion TEXT,
     precio DECIMAL(10,2) NOT NULL,
     activa BOOLEAN DEFAULT TRUE
   );
   ```

2. **productos_sentencias**
   ```sql
   CREATE TABLE productos_sentencias (
     id SERIAL PRIMARY KEY,
     sentencia_id INTEGER REFERENCES sentencias(id),
     producto_id INTEGER REFERENCES productos(id),
     cantidad INTEGER DEFAULT 1,
     sabor_id INTEGER REFERENCES sabores(id),
     tamano_id INTEGER REFERENCES sabores(id),
     ingrediente_id INTEGER REFERENCES sabores(id),
     es_opcional BOOLEAN DEFAULT FALSE,
     grupo_opcion INTEGER,
     precio_unitario DECIMAL(10,2) DEFAULT 0
   );
   ```

3. **detalles_orden** (campos adicionales para sentencias)
   ```sql
   ALTER TABLE detalles_orden
   ADD COLUMN sentencia_id INTEGER REFERENCES sentencias(id),
   ADD COLUMN es_sentencia_principal BOOLEAN DEFAULT FALSE,
   ADD COLUMN sentencia_detalle_orden_padre_id INTEGER REFERENCES detalles_orden(id),
   ADD COLUMN nombre_sentencia VARCHAR(100),
   ADD COLUMN descripcion_sentencia TEXT;
   ```

## Funcionamiento en la Base de Datos

Cuando se añade una sentencia a una orden, se crean múltiples registros en `detalles_orden`:

1. **Registro Principal**: Representa la sentencia misma
   - `producto_id` es NULL
   - `es_sentencia_principal` es TRUE
   - `sentencia_id` contiene el ID de la sentencia
   - `nombre_sentencia` y `descripcion_sentencia` contienen los datos de la sentencia
   - `precio_unitario` contiene el precio de la sentencia completa

2. **Registros de Componentes**: Un registro por cada producto componente
   - `producto_id` contiene el ID del producto componente
   - `es_sentencia_principal` es FALSE
   - `sentencia_id` contiene el ID de la sentencia
   - `sentencia_detalle_orden_padre_id` contiene el ID del registro principal
   - `precio_unitario` generalmente es 0, ya que el precio está incluido en el registro principal

## Implementación en el Frontend

### Componentes Relevantes

1. **SentenciaSelector.jsx**: Permite al usuario seleccionar sentencias y sus componentes
2. **CrearOrden.jsx** y **AgregarProducto.jsx**: Integran el selector de sentencias 

### Flujo al Crear/Agregar Sentencia

1. Usuario selecciona "Agregar Sentencia"
2. Se abre SentenciaSelector.jsx
3. Usuario selecciona una sentencia
4. Para cada producto componente que requiere variantes (sabor/tamaño/ingrediente):
   - Se muestran opciones para seleccionar las variantes
5. Los productos se agregan a la orden:
   - Un producto principal con el precio total de la sentencia
   - Varios productos componentes con precio 0

```javascript
// Ejemplo de estructura de datos enviada al backend
const sentenciaCompleta = [
  // Sentencia principal
  {
    sentencia_id: 1,
    es_sentencia_principal: true,
    nombre_sentencia: "El Apando",
    descripcion_sentencia: "Combo popular",
    precio_unitario: 170.00,
    cantidad: 1
  },
  // Productos componentes
  {
    producto_id: 34, // Especial
    es_parte_sentencia: true,
    sentencia_id: 1,
    tamano_id: 12, // Medio litro
    precio_unitario: 0,
    cantidad: 1
  },
  {
    producto_id: 22, // Brebaje
    es_parte_sentencia: true,
    sentencia_id: 1,
    sabor_id: 37, // Tradicional
    precio_unitario: 0,
    cantidad: 1
  },
  {
    producto_id: 5, // Molletes
    es_parte_sentencia: true,
    sentencia_id: 1,
    precio_unitario: 0,
    cantidad: 1
  }
]
```

## Implementación en el Backend

### Manejo de Sentencias en POST /orders y POST /orders/:id/productos

El backend procesa sentencias en dos pasos:

1. **Primera pasada**: Procesar registros principales de sentencias
   - Insertar registros `es_sentencia_principal: true`
   - Guardar relación entre `sentencia_id` y el `id` generado del detalle

2. **Segunda pasada**: Procesar componentes de sentencias
   - Insertar productos componentes con `es_sentencia_principal: false`
   - Establecer `sentencia_detalle_orden_padre_id` para mantener la relación

```javascript
// Fragmento de código del backend
const mapaSentenciasCreadas = {}; // Mapeo de sentencia_id -> id de detalle_orden

// Primera pasada: Insertar sentencias principales
const sentenciasPrincipalesItems = productos.filter(p => p.es_sentencia_principal);
for (const spItem of sentenciasPrincipalesItems) {
  // Insertar y guardar ID del registro creado
  const result = await client.query(sqlInsertSentencia, [params]);
  mapaSentenciasCreadas[spItem.sentencia_id] = result.rows[0].id;
}

// Segunda pasada: Insertar componentes
for (const prodItem of productos) {
  if (prodItem.es_sentencia_principal) continue;
  
  // Si es parte de sentencia, establecer relación con su padre
  let sentenciaDetalleOrdenPadreId = null;
  if (prodItem.es_parte_sentencia && prodItem.sentencia_id) {
    sentenciaDetalleOrdenPadreId = mapaSentenciasCreadas[prodItem.sentencia_id];
  }
  
  // Insertar componente con la relación al padre
  await client.query(sqlInsertComponente, [
    // ... otros parámetros
    prodItem.es_parte_sentencia ? prodItem.sentencia_id : null,
    sentenciaDetalleOrdenPadreId
  ]);
}
```

## Consideraciones Importantes

1. **Precio**: Los productos componentes tienen precio 0 para evitar doble contabilización
2. **Cancelaciones**: Al cancelar una sentencia, se deben cancelar todos sus componentes
3. **Preparación**: Los componentes de sentencias se preparan individualmente como productos normales
4. **Visualización**: En las vistas de orden, los componentes aparecen agrupados bajo su sentencia principal

## Ejemplos de Sentencias

### Infracción ($85.00)
- 1 Brebaje id 22, sabor: Tradicional id 37
- 1 Cerveza Popular id 10 ó 1 Natural id 31, tamaño: Medio litro id 12

### El Apando ($170.00)
- 1 Especial id 34, tamaño: Medio litro id 12
- 1 Brebaje id 22, sabor: Tradicional id 37
- 1 Molletes id 5

### Noche en los Separos ($185.00)
- 1 Brebaje id 22, sabor: Tradicional id 37
- 2 Cervezas Populares id 10 ó 1 Temporada id 32, tamaño: Litro Temporada id 15
- 1 Molletes id 5

### Pena Capital ($125.00)
- 1 Brebaje id 22, sabor: Tradicional id 37
- 1 Natural id 31, tamaño: Medio litro id 12
- 1 Cerveza Popular id 10