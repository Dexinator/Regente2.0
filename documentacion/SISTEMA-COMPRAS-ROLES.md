# Sistema de Compras - Implementación para Gerente y Cocinero

## Introducción

Este documento describe la implementación del sistema de compras para los roles de **Gerente** y **Cocinero** en Regente 2.0. El sistema de compras, que previamente solo estaba disponible para el rol de **Admin**, ahora ha sido extendido para permitir acceso a estos roles adicionales.

## Objetivo

Permitir que tanto gerentes como cocineros puedan acceder y utilizar el sistema de compras completo, incluyendo:
- Gestión de proveedores
- Administración de insumos
- Creación y seguimiento de requisiciones
- Registro de compras
- Análisis de precios

## Implementación

### 1. Páginas Creadas

#### 1.1 Página de Compras para Gerente
**Archivo:** `frontend/src/pages/gerente/compras.astro`

```astro
---
import PrivateLayout from "../../layouts/PrivateLayout.astro";
import ComprasPanel from "../../components/compras/ComprasPanel.jsx";
---
 
<PrivateLayout title="Sistema de Compras | Regente">
  <ComprasPanel client:load />
</PrivateLayout>
```

**Ruta de acceso:** `/gerente/compras`

#### 1.2 Página de Compras para Cocinero
**Archivo:** `frontend/src/pages/cocinero/compras.astro`

```astro
---
import PrivateLayout from "../../layouts/PrivateLayout.astro";
import ComprasPanel from "../../components/compras/ComprasPanel.jsx";
---
 
<PrivateLayout title="Sistema de Compras | Regente">
  <ComprasPanel client:load />
</PrivateLayout>
```

**Ruta de acceso:** `/cocinero/compras`

### 2. Actualización del Sistema de Navegación

#### 2.1 Rutas Válidas Actualizadas
**Archivo:** `frontend/src/components/NavMenu.jsx`

Se actualizó la función `checkRoutePermission` para incluir las nuevas rutas:

```javascript
const validRoutes = {
  "mesero": ["/ordenes", "/entregar", "/cocina"],
  "cocinero": ["/cocina", "/entregar", "/cocinero/compras"],        // ⬅️ Nueva ruta
  "gerente": ["/reportes/gerente", "/gerente/compras"],             // ⬅️ Nueva ruta
  "financiero": ["/reportes/financiero"],
  "admin": ["/admin", "/admin/compras"],
  "administrador": ["/admin", "/admin/compras"]
};
```

#### 2.2 Menú del Cocinero Actualizado

Se agregó el enlace al sistema de compras en el menú del cocinero:

```jsx
{/* Menú para Cocinero */}
{userRole === "cocinero" && (
  <>
    <a href="/cocina" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
      Pedidos Pendientes
    </a>
    <a href="/cocina/historial" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
      Historial
    </a>
    <a href="/entregar" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
      Por Entregar
    </a>
    <a href="/cocinero/compras" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
      Sistema de Compras  {/* ⬅️ Nuevo enlace */}
    </a>
  </>
)}
```

#### 2.3 Menú del Gerente Actualizado

Se agregó el enlace al sistema de compras en el menú del gerente:

```jsx
{/* Menú para Gerente */}
{userRole === "gerente" && (
  <>
    <a href="/reportes/gerente" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
      Dashboard
    </a>
    <a href="/reportes/gerente/ventas" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
      Reporte de Ventas
    </a>
    <a href="/reportes/gerente/empleados" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
      Gestión de Empleados
    </a>
    <a href="/gerente/compras" className="text-white text-xl font-bold py-3 px-6 rounded-full bg-vino w-full max-w-xs text-center">
      Sistema de Compras  {/* ⬅️ Nuevo enlace */}
    </a>
  </>
)}
```

## Funcionalidades Disponibles

### Para Gerente
El gerente tiene acceso completo al sistema de compras con todas las funcionalidades:

- **Gestión de Proveedores**: Crear, editar, eliminar y consultar proveedores
- **Administración de Insumos**: Gestionar el catálogo de insumos y sus categorías
- **Requisiciones**: Ver, crear y gestionar requisiciones de insumos
- **Compras**: Registrar compras, agregar items, gestionar proveedores
- **Análisis de Precios**: Consultar históricos de precios y comparativas entre proveedores

### Para Cocinero
El cocinero tiene acceso completo al sistema de compras, lo que le permite:

- **Crear Requisiciones**: Solicitar insumos necesarios para la cocina
- **Gestionar Insumos**: Consultar y administrar el inventario de insumos
- **Consultar Proveedores**: Ver información de proveedores disponibles
- **Registrar Compras**: Documentar compras realizadas
- **Análisis de Precios**: Consultar precios históricos para tomar mejores decisiones

## Beneficios de la Implementación

### 1. **Descentralización de la Gestión**
- Los gerentes pueden gestionar compras sin depender del administrador
- Los cocineros pueden crear requisiciones directamente cuando detecten necesidades

### 2. **Mejor Control de Inventario**
- Los cocineros, al estar en contacto directo con los insumos, pueden realizar un seguimiento más preciso
- Las requisiciones se generan en tiempo real según las necesidades reales

### 3. **Optimización del Proceso**
- Reducción de tiempos de espera para requisiciones
- Mayor autonomía para cada rol en la gestión de compras

### 4. **Transparencia**
- Todos los roles involucrados pueden consultar el estado de requisiciones y compras
- Mejor trazabilidad de los procesos de adquisición

## Seguridad y Permisos

### Autenticación
- El sistema mantiene la autenticación JWT existente
- Cada rol solo puede acceder a sus rutas permitidas
- El middleware de autenticación valida el token en todas las operaciones

### Autorización
- Aunque gerente y cocinero tienen acceso al sistema de compras, la autorización a nivel de backend sigue siendo controlada por los middlewares existentes
- Las operaciones sensibles pueden requerir permisos específicos según la implementación del backend

## Rutas del Sistema

| Rol | Ruta | Descripción |
|-----|------|-------------|
| Admin | `/admin/compras` | Sistema de compras para administrador |
| Gerente | `/gerente/compras` | Sistema de compras para gerente |
| Cocinero | `/cocinero/compras` | Sistema de compras para cocinero |

## Componentes Reutilizados

### ComprasPanel.jsx
El sistema reutiliza completamente el componente `ComprasPanel.jsx` existente, que incluye:

- **ProveedoresPanel**: Gestión de proveedores
- **InsumosPanel**: Administración de insumos
- **RequisicionesPanel**: Manejo de requisiciones
- **ComprasListado**: Registro de compras

Esto asegura:
- **Consistencia**: La misma interfaz para todos los roles
- **Mantenimiento**: Un solo componente para mantener
- **Funcionalidad**: Todas las características disponibles para todos los roles

## Consideraciones Técnicas

### 1. **Estructura de Archivos**
- Las páginas siguen el patrón establecido de Astro
- Se respeta la estructura de carpetas por rol
- Reutilización máxima de componentes existentes

### 2. **Sistema de Rutas**
- Las rutas siguen el patrón `/{rol}/compras`
- Integración completa con el sistema de navegación existente
- Validación de permisos en el frontend

### 3. **Backend**
- El backend existente del sistema de compras no requiere modificaciones
- Los endpoints están disponibles para todos los roles autenticados
- La autorización específica se maneja a nivel de middleware

## Testing

### Casos de Prueba Recomendados

1. **Acceso por Rol**
   - Verificar que gerente puede acceder a `/gerente/compras`
   - Verificar que cocinero puede acceder a `/cocinero/compras`
   - Verificar redirección correcta desde rutas no permitidas

2. **Funcionalidad Completa**
   - Crear requisiciones como cocinero
   - Gestionar compras como gerente
   - Consultar análisis de precios en ambos roles

3. **Navegación**
   - Verificar enlaces en menús hamburguesa
   - Comprobar navegación entre secciones del sistema de compras

## Conclusión

La implementación del sistema de compras para gerente y cocinero amplía significativamente las capacidades de gestión del restaurante, permitiendo una administración más eficiente y descentralizada de los insumos. Al reutilizar los componentes existentes, se mantiene la consistencia de la interfaz mientras se expanden las funcionalidades a más roles.

Esta implementación representa un paso importante hacia una gestión más autónoma y eficiente de los recursos del restaurante, permitiendo que cada rol contribuya activamente en el proceso de adquisición de insumos. 