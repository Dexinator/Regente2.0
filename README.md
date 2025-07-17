# Regente 2.0

Sistema de gestión para restaurante/bar con características de punto de venta, gestión de pedidos, cocina y reportes financieros.

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:

- **Frontend**: Desarrollado con Astro y React.
- **Backend**: API REST desarrollada con Express.js y PostgreSQL.

## Requisitos

- Node.js 18+
- PostgreSQL 17
- Docker (opcional para desarrollo)

## Instalación

### Usando Docker

La forma más sencilla de ejecutar el proyecto es usando Docker:

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/regente.git
cd regente

# Iniciar contenedores
docker-compose up -d
```

### Instalación Manual

#### Backend
```bash
cd backend
npm install
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Estructura de la Base de Datos

El sistema utiliza PostgreSQL con las siguientes tablas principales:

- **presos**: Clientes del restaurante
- **productos**: Productos disponibles para venta
- **empleados**: Personal con acceso al sistema
- **ordenes**: Pedidos de los clientes
- **detalles_orden**: Productos dentro de cada pedido
- **pagos**: Registro de pagos por cada orden
- **sabores**: Variantes disponibles para productos
- **categorias_variantes**: Categorías de variantes/sabores

## Documentación de Endpoints (API)

### Autenticación
- **POST /employees/login**: Iniciar sesión
  - Body: `{ usuario, password }`
  - Response: `{ token }`

### Ordenes
- **GET /orders**: Obtener todas las órdenes
- **GET /orders/open**: Obtener órdenes abiertas
- **GET /orders/:id**: Obtener detalles de una orden específica
- **POST /orders**: Crear nueva orden
  - Body: `{ preso_id?, nombre_cliente, empleado_id, num_personas? }`
- **PUT /orders/:id/close**: Cerrar una orden
- **POST /orders/:id/productos**: Agregar productos a una orden
  - Body: `{ productos: [{ producto_id, cantidad, precio_unitario, sabor_id?, tamano_id? }] }`
- **POST /orders/:id/cancelar**: Cancelar productos de una orden
- **GET /orders/:id/resumen**: Obtener resumen de una orden

### Cocina
- **GET /orders/cocina/pendientes**: Obtener productos pendientes de preparar
- **GET /orders/cocina/historial**: Obtener historial de productos preparados
  - Query: `fecha`
- **PUT /orders/detalle/:id**: Actualizar estado de un producto (marcarlo como preparado)

### Productos
- **GET /products**: Obtener todos los productos
- **GET /products/:id**: Obtener un producto específico
- **POST /products**: Crear nuevo producto
- **PUT /products/:id**: Actualizar un producto
- **DELETE /products/:id**: Eliminar un producto

### Sabores/Variantes
- **GET /products/sabores/producto/:id**: Obtener sabores disponibles para un producto
- **GET /products/sabores/categoria/:categoria**: Obtener sabores por categoría
- **GET /products/sabores/categorias**: Obtener categorías de variantes
- **GET /products/sabores/todos**: Obtener todos los sabores
- **GET /products/sabores/:id**: Obtener un sabor específico

### Clientes
- **GET /clients**: Obtener todos los clientes
- **GET /clients/:id**: Obtener un cliente específico
- **POST /clients**: Crear nuevo cliente
- **PUT /clients/:id**: Actualizar un cliente
- **DELETE /clients/:id**: Eliminar un cliente

### Pagos
- **POST /pagos**: Registrar un pago
  - Body: `{ orden_id, metodo, monto, empleado_id, propina?, porcentaje_propina? }`
- **GET /pagos/orden/:id**: Obtener pagos de una orden específica

### Reportes
- **GET /reports/financiero**: Obtener reporte financiero
  - Query: `fechaInicio, fechaFin`
- **GET /reports/gerente**: Obtener reporte para gerente
  - Query: `fechaInicio, fechaFin`
- **GET /reports/ventas**: Obtener reporte de ventas personalizado
  - Query: `fechaInicio, fechaFin`
- **GET /reports/productos/populares**: Obtener productos más populares
- **GET /reports/detalle-dia**: Obtener detalles del día
- **GET /reports/presos/top**: Obtener clientes frecuentes

## Relación Frontend-Backend

### Componentes y sus Endpoints

| Componente             | Endpoints Utilizados                                               |
|------------------------|-------------------------------------------------------------------|
| Login                  | POST /employees/login                                              |
| GestionOrden           | GET /orders/:id, POST /orders/:id/productos                        |
| CrearOrden             | POST /orders, GET /products, GET /products/sabores/producto/:id    |
| PedidosCocina          | GET /orders/cocina/pendientes, PUT /orders/detalle/:id             |
| HistorialCocina        | GET /orders/cocina/historial                                       |
| DashboardFinanciero    | GET /reports/financiero                                            |
| DashboardGerente       | GET /reports/gerente                                               |
| AgregarProducto        | POST /products, GET /products/sabores/categorias                   |
| ListaOrdenes           | GET /orders/open                                                   |

## Características Principales

- Sistema de autenticación basado en roles (mesero, cocinero, gerente, financiero, admin)
- Gestión de pedidos en tiempo real
- Sistema de cocina con seguimiento de preparación
- Gestión de variantes de productos (sabores y tamaños)
- Reportes financieros y gerenciales
- Dashboard para diferentes roles

## Desarrollo

### Estructura del Frontend
```
frontend/
├── src/
│   ├── components/     # Componentes React
│   ├── layouts/        # Layouts de Astro
│   ├── pages/          # Páginas de Astro
│   ├── styles/         # Estilos CSS
│   └── utils/          # Utilidades
```

### Estructura del Backend
```
backend/
├── src/
│   ├── controllers/    # Controladores
│   ├── models/         # Modelos
│   ├── routes/         # Rutas
│   ├── middlewares/    # Middleware
│   ├── db/             # Configuración de base de datos
│   └── config/         # Configuración general
```

## Contribuir

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Derechos reservados - Tu Empresa 