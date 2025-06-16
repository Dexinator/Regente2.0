# Sistema de Compras para Regente 2.0

## Introducción

El Sistema de Compras de Regente 2.0 permite gestionar todo el ciclo de adquisición de insumos, desde la requisición inicial hasta la compra y análisis de precios. Este documento explica cómo utilizar las diferentes funcionalidades del sistema.

## Índice
1. [Estructura del Sistema](#estructura-del-sistema)
2. [Proveedores](#proveedores)
3. [Insumos](#insumos)
4. [Requisiciones](#requisiciones)
5. [Compras](#compras)
6. [Análisis de Precios](#análisis-de-precios)
7. [API Reference](#api-reference)

## Estructura del Sistema

El sistema de compras se compone de cuatro entidades principales:

1. **Proveedores**: Empresas o personas que suministran insumos.
2. **Insumos**: Productos o materiales que se adquieren para el negocio.
3. **Requisiciones**: Solicitudes internas de insumos necesarios.
4. **Compras**: Registro de adquisiciones realizadas a proveedores.

### Flujo de Trabajo

1. Un empleado detecta la necesidad de un insumo y crea una **requisición**.
2. El encargado de compras revisa las requisiciones pendientes.
3. El encargado realiza la **compra** de los insumos requeridos.
4. La gerencia puede analizar los precios históricos para tomar decisiones.

## Proveedores

### Gestión de Proveedores

Los proveedores son las entidades que suministran insumos al negocio. Para cada proveedor se registra:

- Nombre
- RFC
- Dirección
- Teléfono
- Email
- Nombre de contacto

### Operaciones con Proveedores

- **Crear proveedor**: Registrar un nuevo proveedor en el sistema.
- **Editar proveedor**: Modificar los datos de un proveedor existente.
- **Eliminar proveedor**: Dar de baja un proveedor (desactivación lógica).
- **Consultar proveedores**: Ver la lista de proveedores disponibles.
- **Ver insumos por proveedor**: Consultar qué insumos ofrece cada proveedor.

## Insumos

### Gestión de Insumos

Los insumos son los productos o materiales que se adquieren para el negocio. Para cada insumo se registra:

- Nombre
- Descripción
- Categoría
- Unidad de medida predeterminada
- Proveedores que lo ofrecen (con precios de referencia)

### Operaciones con Insumos

- **Crear insumo**: Registrar un nuevo insumo en el sistema.
- **Editar insumo**: Modificar los datos de un insumo existente.
- **Eliminar insumo**: Dar de baja un insumo (desactivación lógica).
- **Consultar insumos**: Ver la lista de insumos disponibles.
- **Filtrar por categoría**: Ver insumos de una categoría específica.

## Requisiciones

### Gestión de Requisiciones

Las requisiciones son solicitudes internas de insumos necesarios. Para cada requisición se registra:

- Usuario solicitante
- Fecha de solicitud
- Lista de insumos requeridos (con cantidad y unidad)
- Estado de completado
- Notas adicionales

### Operaciones con Requisiciones

- **Crear requisición**: Registrar una nueva solicitud de insumos.
- **Agregar items**: Añadir insumos a una requisición existente.
- **Editar items**: Modificar cantidades o unidades de los insumos solicitados.
- **Eliminar items**: Quitar insumos de una requisición.
- **Marcar como completada**: Indicar que todos los insumos han sido adquiridos.
- **Consultar requisiciones**: Ver la lista de requisiciones filtradas por estado.

## Compras

### Gestión de Compras

Las compras registran las adquisiciones realizadas a proveedores. Para cada compra se registra:

- Proveedor
- Usuario que realizó la compra
- Fecha de compra
- Total pagado
- Método de pago
- Si se solicitó factura
- Número de factura (opcional)
- Lista de insumos comprados (con precio, cantidad y unidad)
- Notas adicionales

### Operaciones con Compras

- **Crear compra**: Registrar una nueva compra.
- **Agregar items**: Añadir insumos a una compra existente.
- **Editar items**: Modificar precios, cantidades o unidades de los insumos comprados.
- **Eliminar items**: Quitar insumos de una compra.
- **Consultar compras**: Ver la lista de compras filtradas por proveedor o fecha.
- **Ver items de requisición pendientes**: Consultar qué insumos están pendientes de comprar.

## Análisis de Precios

El sistema ofrece herramientas para analizar los precios históricos de los insumos:

- **Precio promedio por proveedor**: Ver el precio promedio de cada insumo por proveedor.
- **Precio mínimo y máximo**: Identificar los mejores y peores precios históricos.
- **Tendencias de precios**: Analizar cómo han evolucionado los precios a lo largo del tiempo.
- **Comparativa entre proveedores**: Determinar qué proveedor ofrece los mejores precios.

## API Reference

### Proveedores

```
GET /proveedores
GET /proveedores/:id
POST /proveedores
PUT /proveedores/:id
DELETE /proveedores/:id
GET /proveedores/:id/insumos
```

### Insumos

```
GET /insumos
GET /insumos/categorias
GET /insumos/:id
POST /insumos
PUT /insumos/:id
DELETE /insumos/:id
```

### Requisiciones

```
GET /requisiciones
GET /requisiciones/:id
POST /requisiciones
PUT /requisiciones/:id
DELETE /requisiciones/:id
POST /requisiciones/:id/items
PUT /requisiciones/:id/items/:itemId
DELETE /requisiciones/:id/items/:itemId
```

### Compras

```
GET /compras
GET /compras/analisis-precios
GET /compras/items-requisicion-pendientes
GET /compras/:id
POST /compras
PUT /compras/:id
DELETE /compras/:id
POST /compras/:id/items
PUT /compras/:id/items/:itemId
DELETE /compras/:id/items/:itemId
```

## Ejemplos de Uso

### Crear una Requisición

```javascript
// Ejemplo de petición para crear una requisición
fetch('/requisiciones', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    usuario_id: 1,
    notas: "Urgente para preparación del fin de semana",
    items: [
      {
        insumo_id: 1, // Canela en polvo
        cantidad: 500,
        unidad: "gr",
        urgencia: "alta"
      },
      {
        insumo_id: 2, // Azúcar
        cantidad: 5,
        unidad: "kg",
        urgencia: "normal"
      }
    ]
  })
});
```

### Registrar una Compra

```javascript
// Ejemplo de petición para registrar una compra
fetch('/compras', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    proveedor_id: 1, // Walmart
    usuario_id: 2,
    total: 450.50,
    metodo_pago: "efectivo",
    solicito_factura: false,
    notas: "Compra semanal",
    items: [
      {
        insumo_id: 1, // Canela en polvo
        requisicion_item_id: 5, // ID del item de requisición correspondiente
        precio_unitario: 0.09, // $0.09 por gramo
        cantidad: 500,
        unidad: "gr"
      },
      {
        insumo_id: 2, // Azúcar
        requisicion_item_id: 6, // ID del item de requisición correspondiente
        precio_unitario: 22.50, // $22.50 por kg
        cantidad: 5,
        unidad: "kg"
      },
      {
        insumo_id: 5, // Papel higiénico (no estaba en requisición)
        precio_unitario: 12.00,
        cantidad: 12,
        unidad: "rollo"
      }
    ]
  })
});
```

### Consultar Análisis de Precios

```javascript
// Ejemplo de petición para consultar análisis de precios de un insumo
fetch('/compras/analisis-precios?insumo_id=1', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Conclusión

El Sistema de Compras de Regente 2.0 proporciona una solución completa para gestionar el ciclo de adquisición de insumos, desde la requisición hasta la compra y análisis. Con esta herramienta, el negocio puede optimizar sus procesos de compra, controlar mejor sus gastos y tomar decisiones más informadas sobre sus proveedores. 