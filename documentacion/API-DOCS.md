# Documentación API Regente 2.0

## Índice
- [Introducción](#introducción)
- [Base URL](#base-url)
- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
  - [Autenticación](#endpoints-autenticación)
  - [Órdenes](#endpoints-órdenes)
  - [Cocina](#endpoints-cocina)
  - [Productos](#endpoints-productos)
  - [Sabores/Variantes](#endpoints-sabores)
  - [Clientes](#endpoints-clientes)
  - [Pagos](#endpoints-pagos)
  - [Reportes](#endpoints-reportes)
- [Modelos de Datos](#modelos-de-datos)

## Introducción

La API de Regente 2.0 ofrece un conjunto completo de endpoints para gestionar un restaurante/bar, incluyendo la gestión de órdenes, cocina, productos, clientes, pagos y reportes. Esta documentación describe los endpoints disponibles, sus parámetros y respuestas.

## Base URL

```
http://localhost:3000
```

En producción, esta URL puede variar según la configuración del servidor.

## Autenticación

La mayoría de los endpoints requieren autenticación mediante un token JWT. Para obtener un token:

1. Haz una petición POST a `/employees/login` con las credenciales de usuario.
2. El servidor responderá con un token JWT.
3. Incluye el token en las siguientes peticiones en el header `Authorization: Bearer [token]`.

## Endpoints

### Endpoints: Autenticación

#### Iniciar sesión

```
POST /employees/login
```

**Body:**
```json
{
  "usuario": "string",
  "password": "string"
}
```

**Respuesta:**
```json
{
  "token": "string"
}
```

**Códigos de respuesta:**
- `200 OK`: Login exitoso
- `401 Unauthorized`: Credenciales inválidas
- `500 Internal Server Error`: Error del servidor

#### Obtener perfil autenticado

```
GET /employees/me
```

**Headers:**
```
Authorization: Bearer [token]
```

**Respuesta:**
```json
{
  "id": "integer",
  "nombre": "string",
  "usuario": "string",
  "rol": "string",
  "fecha_ingreso": "string"
}
```

### Endpoints: Órdenes

#### Obtener todas las órdenes

```
GET /orders
```

**Parámetros de consulta (opcionales):**
- `fecha_inicio`: Fecha de inicio (YYYY-MM-DD)
- `fecha_fin`: Fecha de fin (YYYY-MM-DD)

**Respuesta:**
```json
[
  {
    "orden_id": "integer",
    "preso_id": "integer",
    "nombre_cliente": "string",
    "total": "number",
    "fecha": "string",
    "estado": "string",
    "empleado_id": "integer",
    "num_personas": "integer"
  }
]
```

#### Obtener órdenes abiertas

```
GET /orders/open
```

**Respuesta:**
```json
[
  {
    "orden_id": "integer",
    "preso_id": "integer",
    "nombre_cliente": "string",
    "total": "number",
    "fecha": "string",
    "estado": "string",
    "empleado_id": "integer",
    "num_personas": "integer"
  }
]
```

#### Obtener una orden específica

```
GET /orders/:id
```

**Respuesta:**
```json
{
  "orden": {
    "orden_id": "integer",
    "preso_id": "integer",
    "nombre_cliente": "string",
    "total": "number",
    "fecha": "string",
    "estado": "string",
    "empleado_id": "integer",
    "num_personas": "integer"
  },
  "detalles": [
    {
      "id": "integer",
      "orden_id": "integer",
      "producto_id": "integer",
      "cantidad": "integer",
      "precio_unitario": "number",
      "nombre_producto": "string",
      "categoria": "string",
      "sabor_id": "integer",
      "sabor_nombre": "string",
      "tamano_id": "integer",
      "tamano_nombre": "string",
      "preparado": "boolean",
      "tiempo_creacion": "string",
      "tiempo_preparacion": "string"
    }
  ]
}
```

#### Crear orden

```
POST /orders
```

**Body:**
```json
{
  "preso_id": "integer", // opcional
  "nombre_cliente": "string",
  "empleado_id": "integer",
  "num_personas": "integer" // opcional, default: 1
}
```

**Respuesta:**
```json
{
  "orden_id": "integer",
  "mensaje": "Orden creada exitosamente"
}
```

#### Cerrar orden

```
PUT /orders/:id/close
```

**Respuesta:**
```json
{
  "mensaje": "Orden cerrada exitosamente"
}
```

#### Agregar productos a una orden

```
POST /orders/:id/productos
```

**Body:**
```json
{
  "productos": [
    {
      "producto_id": "integer",
      "cantidad": "integer",
      "precio_unitario": "number",
      "sabor_id": "integer", // opcional
      "tamano_id": "integer", // opcional
      "notas": "string" // opcional
    }
  ]
}
```

**Respuesta:**
```json
{
  "mensaje": "Productos agregados exitosamente",
  "productos_agregados": "integer"
}
```

#### Cancelar productos

```
POST /orders/:id/cancelar
```

**Body:**
```json
{
  "detalle_id": "integer"
}
```

**Respuesta:**
```json
{
  "mensaje": "Producto cancelado exitosamente"
}
```

#### Obtener resumen de orden

```
GET /orders/:id/resumen
```

**Respuesta:**
```json
{
  "orden_id": "integer",
  "nombre_cliente": "string",
  "total": "number",
  "fecha": "string",
  "estado": "string",
  "pagado": "number",
  "pendiente": "number",
  "productos": "integer",
  "metodos_pago": [
    {
      "metodo": "string",
      "monto": "number"
    }
  ]
}
```

### Endpoints: Cocina

#### Obtener productos pendientes de preparar

```
GET /orders/cocina/pendientes
```

**Respuesta:**
```json
[
  {
    "detalle_id": "integer",
    "orden_id": "integer",
    "producto_id": "integer",
    "nombre": "string",
    "categoria": "string",
    "cantidad": "integer",
    "cliente": "string",
    "notas": "string",
    "tiempo_creacion": "string",
    "sabor_id": "integer",
    "sabor_nombre": "string",
    "categoria_variante": "string",
    "tamano_id": "integer",
    "tamano_nombre": "string"
  }
]
```

#### Obtener historial de productos preparados

```
GET /orders/cocina/historial
```

**Parámetros de consulta:**
- `fecha`: Fecha para filtrar (YYYY-MM-DD)

**Respuesta:**
```json
[
  {
    "detalle_id": "integer",
    "orden_id": "integer",
    "producto_id": "integer",
    "nombre": "string",
    "categoria": "string",
    "cantidad": "integer",
    "cliente": "string",
    "notas": "string",
    "tiempo_creacion": "string",
    "tiempo_preparacion": "string",
    "sabor_id": "integer",
    "sabor_nombre": "string",
    "categoria_variante": "string",
    "tamano_id": "integer",
    "tamano_nombre": "string"
  }
]
```

#### Actualizar estado de producto (marcar como preparado)

```
PUT /orders/detalle/:id
```

**Respuesta:**
```json
{
  "mensaje": "Estado del producto actualizado correctamente"
}
```

### Endpoints: Productos

#### Obtener todos los productos

```
GET /products
```

**Respuesta:**
```json
[
  {
    "id": "integer",
    "nombre": "string",
    "precio": "number",
    "categoria": "string"
  }
]
```

#### Obtener producto específico

```
GET /products/:id
```

**Respuesta:**
```json
{
  "id": "integer",
  "nombre": "string",
  "precio": "number",
  "categoria": "string"
}
```

#### Crear producto

```
POST /products
```

**Body:**
```json
{
  "nombre": "string",
  "precio": "number",
  "categoria": "string",
  "sabores": "array<integer>" // opcional
}
```

**Respuesta:**
```json
{
  "id": "integer",
  "nombre": "string",
  "precio": "number",
  "categoria": "string",
  "mensaje": "Producto creado exitosamente"
}
```

#### Actualizar producto

```
PUT /products/:id
```

**Body:**
```json
{
  "nombre": "string",
  "precio": "number",
  "categoria": "string"
}
```

**Respuesta:**
```json
{
  "mensaje": "Producto actualizado exitosamente"
}
```

#### Eliminar producto

```
DELETE /products/:id
```

**Respuesta:**
```json
{
  "mensaje": "Producto eliminado exitosamente"
}
```

### Endpoints: Sabores

#### Obtener sabores por producto

```
GET /products/sabores/producto/:id
```

**Respuesta:**
```json
[
  {
    "id": "integer",
    "nombre": "string",
    "descripcion": "string",
    "categoria_id": "integer",
    "categoria_nombre": "string",
    "disponible": "boolean",
    "precio_adicional": "number"
  }
]
```

#### Obtener sabores por categoría

```
GET /products/sabores/categoria/:categoria
```

**Respuesta:**
```json
[
  {
    "id": "integer",
    "nombre": "string",
    "descripcion": "string",
    "categoria_id": "integer",
    "categoria_nombre": "string",
    "disponible": "boolean",
    "precio_adicional": "number"
  }
]
```

#### Obtener categorías de variantes

```
GET /products/sabores/categorias
```

**Respuesta:**
```json
[
  {
    "id": "integer",
    "nombre": "string",
    "tipo": "string"
  }
]
```

#### Obtener todos los sabores

```
GET /products/sabores/todos
```

**Respuesta:**
```json
[
  {
    "id": "integer",
    "nombre": "string",
    "descripcion": "string",
    "categoria_id": "integer",
    "categoria_nombre": "string",
    "disponible": "boolean",
    "precio_adicional": "number"
  }
]
```

#### Obtener sabor específico

```
GET /products/sabores/:id
```

**Respuesta:**
```json
{
  "id": "integer",
  "nombre": "string",
  "descripcion": "string",
  "categoria_id": "integer",
  "categoria_nombre": "string",
  "disponible": "boolean",
  "precio_adicional": "number"
}
```

### Endpoints: Clientes

#### Obtener todos los clientes

```
GET /clients
```

**Respuesta:**
```json
[
  {
    "id": "integer",
    "reg_name": "string",
    "res_tel": "string",
    "IGname": "string",
    "Bday": "string",
    "mkt": "boolean",
    "cellmate": "integer",
    "referidos": "integer",
    "fecha_registro": "string"
  }
]
```

#### Obtener cliente específico

```
GET /clients/:id
```

**Respuesta:**
```json
{
  "id": "integer",
  "reg_name": "string",
  "res_tel": "string",
  "IGname": "string",
  "Bday": "string",
  "mkt": "boolean",
  "cellmate": "integer",
  "referidos": "integer",
  "fecha_registro": "string"
}
```

#### Crear cliente

```
POST /clients
```

**Body:**
```json
{
  "reg_name": "string",
  "res_tel": "string",
  "IGname": "string",
  "Bday": "string",
  "mkt": "boolean",
  "cellmate": "integer",
  "referidos": "integer" // opcional
}
```

**Respuesta:**
```json
{
  "id": "integer",
  "mensaje": "Cliente creado exitosamente"
}
```

#### Actualizar cliente

```
PUT /clients/:id
```

**Body:**
```json
{
  "reg_name": "string",
  "res_tel": "string",
  "IGname": "string",
  "Bday": "string",
  "mkt": "boolean",
  "cellmate": "integer",
  "referidos": "integer"
}
```

**Respuesta:**
```json
{
  "mensaje": "Cliente actualizado exitosamente"
}
```

#### Eliminar cliente

```
DELETE /clients/:id
```

**Respuesta:**
```json
{
  "mensaje": "Cliente eliminado exitosamente"
}
```

### Endpoints: Pagos

#### Registrar pago

```
POST /pagos
```

**Body:**
```json
{
  "orden_id": "integer",
  "metodo": "string", // "efectivo", "tarjeta", "transferencia", "otro"
  "monto": "number",
  "empleado_id": "integer",
  "propina": "number", // opcional
  "porcentaje_propina": "number" // opcional
}
```

**Respuesta:**
```json
{
  "id": "integer",
  "mensaje": "Pago registrado exitosamente"
}
```

#### Obtener pagos de una orden

```
GET /pagos/orden/:id
```

**Respuesta:**
```json
[
  {
    "id": "integer",
    "orden_id": "integer",
    "metodo": "string",
    "monto": "number",
    "fecha": "string",
    "empleado_id": "integer",
    "propina": "number",
    "porcentaje_propina": "number"
  }
]
```

### Endpoints: Reportes

#### Obtener reporte financiero

```
GET /reports/financiero
```

**Parámetros de consulta:**
- `fechaInicio`: Fecha de inicio (YYYY-MM-DD)
- `fechaFin`: Fecha de fin (YYYY-MM-DD)

**Respuesta:**
```json
{
  "ventas_totales": "number",
  "ordenes_total": "integer",
  "propinas_total": "number",
  "pagos_efectivo": "number",
  "pagos_tarjeta": "number",
  "pagos_transferencia": "number",
  "pagos_otro": "number",
  "ticket_promedio": "number",
  "personas_totales": "integer",
  "consumo_por_persona": "number"
}
```

#### Obtener reporte de gerente

```
GET /reports/gerente
```

**Parámetros de consulta:**
- `fechaInicio`: Fecha de inicio (YYYY-MM-DD)
- `fechaFin`: Fecha de fin (YYYY-MM-DD)

**Respuesta:**
```json
{
  "ventas_totales": "number",
  "ordenes_total": "integer",
  "productos_vendidos": "integer",
  "productos_populares": [
    {
      "id": "integer",
      "nombre": "string",
      "cantidad": "integer",
      "ingresos": "number"
    }
  ],
  "ventas_por_categoria": [
    {
      "categoria": "string",
      "cantidad": "integer",
      "ingresos": "number"
    }
  ],
  "clientes_nuevos": "integer",
  "ventas_por_dia": [
    {
      "fecha": "string",
      "ingresos": "number",
      "ordenes": "integer"
    }
  ]
}
```

#### Obtener reporte de ventas personalizado

```
GET /reports/ventas
```

**Parámetros de consulta:**
- `fechaInicio`: Fecha de inicio (YYYY-MM-DD)
- `fechaFin`: Fecha de fin (YYYY-MM-DD)

**Respuesta:**
```json
{
  "ventas_totales": "number",
  "ordenes_total": "integer",
  "productos_vendidos": "integer",
  "ventas_por_dia": [
    {
      "fecha": "string",
      "ingresos": "number",
      "ordenes": "integer"
    }
  ]
}
```

#### Obtener productos populares

```
GET /reports/productos/populares
```

**Parámetros de consulta (opcionales):**
- `limite`: Número máximo de productos a devolver (default: 10)
- `fechaInicio`: Fecha de inicio (YYYY-MM-DD)
- `fechaFin`: Fecha de fin (YYYY-MM-DD)

**Respuesta:**
```json
[
  {
    "id": "integer",
    "nombre": "string",
    "cantidad": "integer",
    "ingresos": "number",
    "categoria": "string"
  }
]
```

#### Obtener reporte del día

```
GET /reports/detalle-dia
```

**Parámetros de consulta (opcionales):**
- `fecha`: Fecha específica (YYYY-MM-DD) (default: hoy)

**Respuesta:**
```json
{
  "fecha": "string",
  "ventas_totales": "number",
  "ordenes_total": "integer",
  "productos_vendidos": "integer",
  "clientes_atendidos": "integer",
  "pagos": {
    "efectivo": "number",
    "tarjeta": "number",
    "transferencia": "number",
    "otro": "number"
  },
  "propinas": "number",
  "ventas_por_hora": [
    {
      "hora": "integer",
      "ingresos": "number",
      "ordenes": "integer"
    }
  ]
}
```

#### Obtener clientes frecuentes

```
GET /reports/presos/top
```

**Parámetros de consulta (opcionales):**
- `limite`: Número máximo de clientes a devolver (default: 10)

**Respuesta:**
```json
[
  {
    "id": "integer",
    "nombre": "string",
    "visitas": "integer",
    "gasto_total": "number",
    "ultima_visita": "string"
  }
]
```

## Modelos de Datos

### Orden
```json
{
  "orden_id": "integer",
  "preso_id": "integer",
  "nombre_cliente": "string",
  "total": "number",
  "fecha": "string",
  "estado": "string", // "abierta" o "cerrada"
  "empleado_id": "integer",
  "num_personas": "integer"
}
```

### Detalle de Orden
```json
{
  "id": "integer",
  "orden_id": "integer",
  "producto_id": "integer",
  "cantidad": "integer",
  "precio_unitario": "number",
  "empleado_id": "integer",
  "sabor_id": "integer",
  "tamano_id": "integer",
  "preparado": "boolean",
  "tiempo_creacion": "string",
  "tiempo_preparacion": "string"
}
```

### Producto
```json
{
  "id": "integer",
  "nombre": "string",
  "precio": "number",
  "categoria": "string"
}
```

### Sabor/Variante
```json
{
  "id": "integer",
  "nombre": "string",
  "descripcion": "string",
  "categoria_id": "integer",
  "disponible": "boolean",
  "precio_adicional": "number"
}
```

### Cliente (Preso)
```json
{
  "id": "integer",
  "reg_name": "string",
  "res_tel": "string",
  "IGname": "string",
  "Bday": "string",
  "mkt": "boolean",
  "cellmate": "integer",
  "referidos": "integer",
  "fecha_registro": "string"
}
```

### Pago
```json
{
  "id": "integer",
  "orden_id": "integer",
  "metodo": "string", // "efectivo", "tarjeta", "transferencia", "otro"
  "monto": "number",
  "fecha": "string",
  "empleado_id": "integer",
  "propina": "number",
  "porcentaje_propina": "number"
}
```

### Empleado
```json
{
  "id": "integer",
  "nombre": "string",
  "usuario": "string",
  "password": "string", // No se muestra en las respuestas
  "rol": "string", // "admin", "mesero", "cocinero", "financiero"
  "fecha_ingreso": "string",
  "activo": "boolean"
}
``` 