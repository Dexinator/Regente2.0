# Kitchen Workflow Documentation

## Overview

El sistema de cocina de Regente 2.0 está diseñado para optimizar el flujo de trabajo de los cocineros, proporcionando una interfaz intuitiva y un sistema de preparación basado en stacks individuales por cliente.

## Stack-Based Preparation System

### Concepto

El sistema implementa una lógica de "stack por cliente" donde:
- Cada producto muestra la cantidad total pendiente de preparar
- Los cocineros preparan una unidad a la vez
- El cliente permanece visible hasta que todas sus unidades estén preparadas
- Esto refleja el flujo de trabajo real de una cocina

### Ejemplo de Funcionamiento

```
Estado inicial:
"4 X Tacos al Pastor - Clientes: Juan Pérez"

Después del primer clic en ✓:
"3 X Tacos al Pastor - Clientes: Juan Pérez" (1 unidad preparada)

Después del segundo clic en ✓:
"2 X Tacos al Pastor - Clientes: Juan Pérez" (2 unidades preparadas)

Continúa hasta que todas las unidades estén preparadas...
```

## Interface Components

### Card Layout

Cada tarjeta de producto en cocina muestra:

```
[Cantidad] X [Nombre del Producto] [Sabor] [Ingrediente Extra] [Tamaño]
```

**Ejemplo:**
```
4 X Tacos al Pastor Picante Sin Cebolla Grande
```

### Notes Display

Las notas especiales se muestran enumeradas:
```
1. Sin cebolla
2. Extra queso
3. Muy picante
```

### Customer Information

Los nombres de clientes se muestran en la parte inferior:
```
Clientes: Juan Pérez, María López, Carlos García
```

### Action Button

- **Símbolo**: ✓ (checkmark)
- **Funcionalidad**: Marca una unidad como preparada
- **Ubicación**: Esquina inferior derecha de cada tarjeta

## Technical Implementation

### Frontend Logic

1. **Data Grouping**: 
   - Productos similares se agrupan por variantes
   - Se mantiene información individual de clientes
   - Se conservan arrays de `detalle_ids` para procesamiento

2. **Preparation Action**:
   ```javascript
   const marcarComoPreparado = async (producto) => {
     // Envía cantidad: 1 al backend
     // Actualiza la interfaz
     // Recarga datos después de procesamiento
   }
   ```

### Backend Logic

1. **Partial Preparation Function**:
   ```javascript
   marcarProductoComoPreparado(detalle_id, cantidad_a_preparar)
   ```

2. **Record Division**:
   - Si `cantidad_a_preparar < total_cantidad`:
     - Reduce cantidad del registro original
     - Crea nuevo registro marcado como preparado
   - Si `cantidad_a_preparar >= total_cantidad`:
     - Marca todo el registro como preparado

### Database Schema

```sql
-- Registro original (antes de preparación)
detalles_orden: {
  id: 123,
  cantidad: 4,
  preparado: false
}

-- Después de preparar 1 unidad:

-- Registro pendiente
detalles_orden: {
  id: 123,
  cantidad: 3,
  preparado: false
}

-- Registro preparado
detalles_orden: {
  id: 124, -- nuevo ID
  cantidad: 1,
  preparado: true,
  tiempo_preparacion: '2024-01-15 14:30:00'
}
```

## User Experience Features

### Real-time Updates

- **Polling Interval**: 30 segundos
- **Manual Refresh**: Botón "Actualizar" disponible
- **Status Feedback**: Animación durante procesamiento

### Filtering Options

- **Todos los pedidos**: Muestra todos los productos
- **Solo Alimentos**: Filtra por categorías de comida
- **Solo Bebidas**: Filtra por bebidas y pulques
- **Solo Barra**: Filtra por productos de barra

### Time Grouping

Los productos se agrupan en bloques de 10 minutos:
```
Pedidos de 14:20
Pedidos de 14:30
Pedidos de 14:40
```

## Workflow Steps

### For Cooks

1. **View pending orders** in chronological order (oldest first)
2. **Read product details** in simplified format
3. **Check special notes** if any are present
4. **Prepare one unit** of the product
5. **Click ✓ button** to mark as prepared
6. **Continue until all units** for that customer are complete

### For System

1. **Receive preparation request** with `cantidad: 1`
2. **Validate detalle_id** exists and is not already prepared
3. **Split record** if partial preparation
4. **Update database** with new prepared record
5. **Return success response** to frontend
6. **Refresh kitchen display** with updated quantities

## Error Handling

### Common Scenarios

1. **Product already prepared**: Show appropriate error message
2. **Database connection issues**: Retry mechanism with user feedback
3. **Invalid detalle_id**: Log error and show user notification

### Recovery Actions

- **Manual refresh**: Allow cooks to manually update the display
- **Despreparar function**: Allow reverting prepared status if needed
- **Error logging**: Comprehensive logging for debugging

## Performance Considerations

### Frontend

- **Efficient grouping**: Products grouped in memory to reduce rendering
- **Minimal re-renders**: Only update affected components
- **Cached data**: Smart caching with 30-second refresh intervals

### Backend

- **Transaction safety**: All database operations wrapped in transactions
- **Connection pooling**: Efficient database connection management
- **Query optimization**: Indexed queries for fast response times

## Future Enhancements

### Planned Features

1. **Push notifications**: Real-time updates without polling
2. **Voice feedback**: Audio confirmation of preparation actions
3. **Kitchen display screens**: Dedicated display monitors
4. **Preparation time tracking**: Analytics on preparation times
5. **Priority ordering**: Rush orders and VIP customers

### Integration Possibilities

- **IoT sensors**: Kitchen equipment integration
- **Mobile apps**: Dedicated mobile interface for cooks
- **Analytics dashboard**: Kitchen performance metrics
- **Inventory integration**: Automatic ingredient deduction