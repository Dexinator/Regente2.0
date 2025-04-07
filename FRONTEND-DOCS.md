# Documentación Frontend Regente 2.0

## Índice
- [Introducción](#introducción)
- [Estructura del Frontend](#estructura-del-frontend)
- [Componentes Principales](#componentes-principales)
  - [Login](#login)
  - [NavMenu](#navmenu)
  - [PedidosCocina](#pedidoscocina)
  - [HistorialCocina](#historialcocina)
  - [CrearOrden](#crearorden)
  - [GestionOrden](#gestionorden)
  - [ListaOrdenes](#listaordenes)
  - [DashboardFinanciero](#dashboardfinanciero)
  - [DashboardGerente](#dashboardgerente)
  - [AdminDashboard](#admindashboard)
  - [AgregarProducto](#agregarproducto)
- [Sistema de Rutas](#sistema-de-rutas)
- [Utilidades](#utilidades)

## Introducción

El frontend de Regente 2.0 está construido con Astro y React, ofreciendo una interfaz moderna y responsiva para la gestión del restaurante/bar. Este documento describe los principales componentes y su interacción con el backend.

## Estructura del Frontend

```
frontend/
├── src/
│   ├── components/     # Componentes React
│   ├── layouts/        # Layouts de Astro
│   ├── pages/          # Páginas de Astro
│   ├── styles/         # Estilos CSS
│   └── utils/          # Utilidades
├── public/             # Archivos estáticos
└── astro.config.mjs    # Configuración de Astro
```

## Componentes Principales

### Login

**Archivo:** `src/components/Login.jsx`

**Descripción:** Componente para la autenticación de usuarios.

**Endpoints utilizados:**
- `POST /employees/login`

**Funcionalidades:**
- Formulario de inicio de sesión
- Redirección según rol del usuario (mesero, cocinero, gerente, financiero, admin)
- Manejo de errores de autenticación

**Código relevante:**
```jsx
const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const res = await fetch("http://localhost:3000/employees/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error desconocido");
      return;
    }

    localStorage.setItem("token", data.token);
    // Redirección según rol
    ...
  } catch {
    setError("Error de conexión");
  }
};
```

### NavMenu

**Archivo:** `src/components/NavMenu.jsx`

**Descripción:** Menú de navegación responsivo adaptado a los diferentes roles de usuario.

**Endpoints utilizados:**
- Ninguno (utiliza información de sesión local)

**Funcionalidades:**
- Menú diferenciado según rol
- Opciones de navegación contextual
- Control de sesión (cierre de sesión)

### PedidosCocina

**Archivo:** `src/components/PedidosCocina.jsx`

**Descripción:** Interfaz para la preparación de productos en cocina.

**Endpoints utilizados:**
- `GET /orders/cocina/pendientes`
- `PUT /orders/detalle/:id`

**Funcionalidades:**
- Lista de productos pendientes por preparar
- Marcado de productos como preparados
- Visualización de tiempo de espera
- Agrupación por orden

**Código relevante:**
```jsx
const cargarPedidos = async () => {
  try {
    const res = await fetch("http://localhost:3000/orders/cocina/pendientes");
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Error al cargar pedidos");
    }
    
    // Organizamos los datos para mostrarlos agrupados por orden
    const pedidosOrganizados = organizarPedidos(data);
    setPedidos(pedidosOrganizados);
  } catch (error) {
    setError("No se pudieron cargar los pedidos. Intenta de nuevo.");
  }
};

const marcarProductoComoPreparado = async (detalle_id) => {
  try {
    const res = await fetch(`http://localhost:3000/orders/detalle/${detalle_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    });
    
    // Actualización local
    ...
  } catch (error) {
    alert("Error al actualizar el estado del producto");
  }
};
```

### HistorialCocina

**Archivo:** `src/components/HistorialCocina.jsx`

**Descripción:** Visualización del historial de productos preparados en cocina.

**Endpoints utilizados:**
- `GET /orders/cocina/historial`

**Funcionalidades:**
- Filtrado por fecha
- Visualización de productos preparados
- Agrupación por orden
- Detalles de variantes y sabores

**Código relevante:**
```jsx
const cargarHistorial = async () => {
  setLoading(true);
  setError("");
  
  try {
    const res = await fetch(`http://localhost:3000/orders/cocina/historial?fecha=${fecha}`);
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Error al cargar historial");
    }
    
    // Organizamos los datos para mostrarlos agrupados por orden
    const historicoOrganizado = organizarHistorial(data);
    setHistorial(historicoOrganizado);
  } catch (error) {
    setError("No se pudo cargar el historial. Intenta de nuevo.");
  } finally {
    setLoading(false);
  }
};
```

### CrearOrden

**Archivo:** `src/components/CrearOrden.jsx`

**Descripción:** Formulario para crear nuevas órdenes y agregar productos.

**Endpoints utilizados:**
- `POST /orders`
- `GET /products`
- `GET /products/variantes/producto/:id`
- `POST /orders/:id/productos`

**Funcionalidades:**
- Creación de órdenes
- Selección de productos
- Selección de variantes/sabores
- Cantidades y notas especiales
- Cálculo de total

### GestionOrden

**Archivo:** `src/components/GestionOrden.jsx`

**Descripción:** Gestión de una orden existente (agregar productos, modificar, pagar).

**Endpoints utilizados:**
- `GET /orders/:id`
- `POST /orders/:id/productos`
- `POST /orders/:id/cancelar`
- `POST /pagos`
- `GET /pagos/orden/:id`
- `PUT /orders/:id/close`

**Funcionalidades:**
- Visualización de detalles de la orden
- Agregar productos adicionales
- Cancelar productos
- Registro de pagos
- Cierre de orden

### ListaOrdenes

**Archivo:** `src/components/ListaOrdenes.jsx`

**Descripción:** Lista de órdenes abiertas.

**Endpoints utilizados:**
- `GET /orders/open`

**Funcionalidades:**
- Visualización de órdenes abiertas
- Búsqueda y filtrado
- Navegación a gestión de una orden específica

**Código relevante:**
```jsx
const cargarOrdenes = async () => {
  setLoading(true);
  try {
    const res = await fetch("http://localhost:3000/orders/open");
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Error al cargar órdenes");
    }
    
    setOrdenes(data);
  } catch (error) {
    setError("No se pudieron cargar las órdenes. Intenta de nuevo.");
  } finally {
    setLoading(false);
  }
};
```

### DashboardFinanciero

**Archivo:** `src/components/DashboardFinanciero.jsx`

**Descripción:** Panel de estadísticas financieras.

**Endpoints utilizados:**
- `GET /reports/financiero`

**Funcionalidades:**
- Estadísticas de ventas
- Filtrado por período (semana, mes, trimestre, personalizado)
- Visualización de propinas
- Análisis de métodos de pago

**Código relevante:**
```jsx
const cargarEstadisticas = async () => {
  setLoading(true);
  setError("");
  
  try {
    const res = await fetch(`http://localhost:3000/reports/financiero?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Error al cargar estadísticas");
    }
    
    setStats(data);
  } catch (error) {
    setError("No se pudieron cargar las estadísticas financieras. Intenta de nuevo.");
  } finally {
    setLoading(false);
  }
};
```

### DashboardGerente

**Archivo:** `src/components/DashboardGerente.jsx`

**Descripción:** Panel de estadísticas para gerencia.

**Endpoints utilizados:**
- `GET /reports/gerente`
- `GET /reports/productos/populares`

**Funcionalidades:**
- Resumen de ventas
- Productos más vendidos
- Análisis por categoría
- Tendencias temporales

### AdminDashboard

**Archivo:** `src/components/AdminDashboard.jsx`

**Descripción:** Panel administrativo para gestión de empleados y configuración.

**Endpoints utilizados:**
- Varios endpoints de administración

**Funcionalidades:**
- Gestión de empleados
- Configuración del sistema
- Opciones avanzadas

### AgregarProducto

**Archivo:** `src/components/AgregarProducto.jsx`

**Descripción:** Formulario para agregar nuevos productos al catálogo.

**Endpoints utilizados:**
- `POST /products`
- `GET /products/variantes/categorias`
- `POST /products/variantes`

**Funcionalidades:**
- Creación de nuevos productos
- Asignación de categoría
- Configuración de variantes/sabores disponibles
- Precios y descripciones

## Sistema de Rutas

El frontend utiliza el sistema de enrutamiento de Astro con páginas que cargan los componentes React según la ruta:

- `/` - Página de inicio/login
- `/ordenes` - Lista de órdenes (meseros)
- `/orden/:id` - Gestión de una orden específica
- `/nueva-orden` - Creación de nueva orden
- `/cocina` - Panel de cocina (productos por preparar)
- `/cocina/historial` - Historial de cocina
- `/reportes/financiero` - Dashboard financiero
- `/reportes/gerente` - Dashboard para gerente
- `/admin` - Panel de administración
- `/productos/nuevo` - Agregar producto

## Utilidades

El frontend cuenta con varias utilidades comunes:

- **Autenticación:** Manejo de token JWT y verificación de roles
- **Formateo:** Funciones para formatear moneda, fechas y horas
- **Validación:** Validación de formularios
- **Notificaciones:** Sistema de alertas y notificaciones
- **Conexión API:** Funciones para comunicación con el backend 

#### GET /products/variantes/producto/:id

Usado para obtener las variantes disponibles para un producto específico (como sabores, tamaños, o ingredientes extras según la categoría).

##### Parámetros de consulta:
- `tipo`: Opcional, filtra por tipo de variante (sabor, tamano, ingredientes)

##### Ejemplo de uso:
```javascript
// Cargar sabores de pulque
const res = await fetch(`http://localhost:3000/products/variantes/producto/5?tipo=sabor`);
const sabores = await res.json();
```

## Componente: AgregarProducto

### Endpoints Utilizados

#### GET /products
- Obtiene la lista de productos disponibles

#### GET /products/variantes/categorias
- Obtiene las categorías de variantes disponibles

#### POST /products/variantes
- Crea una nueva variante para productos

### Comportamiento

Este componente permite agregar nuevos productos a una orden existente o crear una nueva orden con productos. 