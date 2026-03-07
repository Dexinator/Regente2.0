Aquí tienes el documento ajustado para desarrollar el sistema con las especificaciones actualizadas:

---

# Documento Técnico: Sistema de Gestión de Compras y Gastos para Bar

## **Base de Datos (PostgreSQL)**
### Tablas Principales:

#### 1. **Insumos**
```sql


CREATE TABLE insumos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,        -- Ej: "Canela en polvo"
    descripcion TEXT,                    -- Ej: "Canela marca McCornick"
    categoria VARCHAR(50),               -- Ej: "Especias", "Bebidas"
    proveedor VARCHAR(100),              -- Ej: "Walmart"
    precio NUMERIC(10,2) NOT NULL,       -- Precio por unidad (Ej: $100)
    cantidad NUMERIC(10,2) NOT NULL,     -- Stock actual (Ej: 50)
    unidad VARCHAR(20) NOT NULL          -- Ej: "gr", "kg", "litros"
);
```

#### 2. **Requisiciones**
```sql
CREATE TABLE requisiciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),  -- Quien creó la requisición
    fecha_solicitud DATE DEFAULT CURRENT_DATE,
    completada BOOLEAN DEFAULT FALSE         -- Estado (Pendiente/Completada)
);

CREATE TABLE items_requisicion (
    id SERIAL PRIMARY KEY,
    requisicion_id INT REFERENCES requisiciones(id),
    insumo_id INT REFERENCES insumos(id)
);
```

#### 3. **Compras**
```sql
CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    requisicion_id INT REFERENCES requisiciones(id),
    usuario_id INT REFERENCES usuarios(id),   -- Quien realizó la compra
    fecha_compra DATE DEFAULT CURRENT_DATE,
    total NUMERIC(10,2),
    metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia'))
);

CREATE TABLE items_compra (
    id SERIAL PRIMARY KEY,
    compra_id INT REFERENCES compras(id),
    insumo_id INT REFERENCES insumos(id),
    cantidad_comprada NUMERIC(10,2) NOT NULL,
    costo_unitario NUMERIC(10,2) NOT NULL    -- Precio real pagado
);
```

#### 4. **Empleados y Asistencia**
```sql
CREATE TABLE empleados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sueldo_diario NUMERIC(10,2) NOT NULL,    -- Ej: $250.00
    cargo VARCHAR(50)                        -- Ej: "Mesero", "Cocinero"
);

CREATE TABLE asistencia (
    id SERIAL PRIMARY KEY,
    empleado_id INT REFERENCES empleados(id),
    fecha DATE DEFAULT CURRENT_DATE,
    asistio BOOLEAN DEFAULT FALSE
);
```

#### 5. **Gastos**
```sql
CREATE TABLE gastos_fijos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,           -- Ej: "Renta local"
    monto NUMERIC(10,2) NOT NULL,
    fecha_pago_dia INT CHECK (fecha_pago_dia BETWEEN 1 AND 31),  -- Ej: 15 (día del mes)
    metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia'))
);

CREATE TABLE gastos_variables (
    id SERIAL PRIMARY KEY,
    descripcion TEXT NOT NULL,              -- Ej: "Compra emergente de jitomate"
    monto NUMERIC(10,2) NOT NULL,
    fecha DATE DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    categoria VARCHAR(50)                   -- Ej: "Emergencia", "Insumos"
);
```

---

## **Flujos Clave**

### 1. **Gestión de Compras**
- **Pantalla de Requisiciones:**
  - Lista de insumos con stock bajo (ej: cantidad < 20% del promedio histórico).
  - Cualquier usuario puede crear requisiciones sin aprobación.
  - Filtros: Completadas/Pendientes.

- **Pantalla de Compras Pendientes:**
  - Tabla con: Insumo, Cantidad requerida, Unidad, Usuario solicitante.
  - Acciones: 
    - Marcar como comprado → Abre modal para registrar costo real y método de pago.
    - Auto-actualiza stock de insumos al confirmar.

### 2. **Control de Asistencias**
- **Pantalla de Registro Diario:**
  - Grid con lista de empleados y checkbox "Asistió".
  - Solo accesible para gerente.
  - Historial visual por semana (días marcados en verde/rojo).

- **Cálculo de Pagos:**
  ```sql
  -- Query ejemplo para pagos semanales
  SELECT 
    e.id,
    e.nombre,
    COUNT(a.id) AS dias_asistencia,
    (e.sueldo_diario * COUNT(a.id)) AS total_pago
  FROM empleados e
  LEFT JOIN asistencia a ON e.id = a.empleado_id 
    AND a.fecha BETWEEN '2024-03-01' AND '2024-03-07'
  GROUP BY e.id;
  ```

### 3. **Registro de Gastos**
- **Interfaz Unificada:**
  - Switch para seleccionar tipo de gasto (fijo/variable/empleado).
  - Para empleados: Auto-completar monto basado en asistencias registradas.
  - Validación: No permitir gastos mayores al saldo disponible en el método de pago seleccionado.

---

## **Requerimientos Técnicos**

### Frontend (Astro + React):
- **Componentes clave:**
  - `TablaDinamica`: Reutilizable para listar insumos, requisiciones y gastos.
  - `ModalPago`: Formulario estándar para registrar método de pago y monto.
  - `CalendarioAsistencias`: Grid interactivo para marcar días.

- **Librerías recomendadas:**
  - `react-table` para filtros y paginación.
  - `zod` para validación de formularios.
  - `date-fns` para manejo de fechas.

### Backend (Node.js):
- **Endpoints críticos:**
  ```javascript
  // Actualizar stock al completar compra
  app.post('/api/compras', async (req, res) => {
    const { insumo_id, cantidad_comprada } = req.body;
    await pool.query(
      'UPDATE insumos SET cantidad = cantidad + $1 WHERE id = $2',
      [cantidad_comprada, insumo_id]
    );
    // ...resto de lógica
  });

  // Generar reporte de gastos mensual
  app.get('/api/reportes/gastos', async (req, res) => {
    const { mes } = req.query;
    const query = `
      SELECT 'fijos' AS tipo, nombre, monto FROM gastos_fijos
      UNION ALL
      SELECT 'variables' AS tipo, descripcion AS nombre, monto FROM gastos_variables
      WHERE EXTRACT(MONTH FROM fecha) = $1
    `;
    const result = await pool.query(query, [mes]);
    // ...formatear datos
  });
  ```

---

## **Escenario de Uso Ejemplo**

**Contexto:** El cocinero José nota que la canela se está terminando.

1. **Crear Requisición:**
   - José accede a la pantalla de requisiciones.
   - Busca "canela" → Click en "Nueva Requisición".
   - Ingresa cantidad necesaria: 200gr.

2. **Compra:**
   - Gerente Marta ve la requisición pendiente en la pantalla de compras.
   - Compra 150gr en Walmart a $95 → Registra: 
     - Método: Efectivo
     - Actualiza stock automáticamente a 180gr.

3. **Pago de Nómina:**
   - Sistema calcula que Pedro (mesero) trabajó 5 días ($250 diarios → $1,250 total).
   - Marta registra el pago vía transferencia, vinculando automáticamente las asistencias de la semana.

---

**Notas Finales:**
- Priorizar la sincronización en tiempo real del stock de insumos.
- Agregar tooltips con historial de precios al comprar insumos.