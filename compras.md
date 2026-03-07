Implementación de compras para sistema Regente

---

## **Esquema de Base de Datos Ajustado**

### 1. **Proveedores**
```sql
CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    rfc VARCHAR(13) NOT NULL UNIQUE -- Ej: "XAXX010101000"
);
```

### 2. **Insumos** 
```sql
CREATE TABLE insumos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE, -- Ej: "Canela en polvo"
    descripcion TEXT,
    categoria VARCHAR(50) -- Ej: "Especias", "Bebidas",
    proveedores --Lista de proveedores que lo tienen [Walmart, Target, etc]
);
```

### 3. **Requisiciones**
```sql
CREATE TABLE requisiciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    fecha_solicitud DATE DEFAULT CURRENT_DATE,
    completada BOOLEAN DEFAULT FALSE
);

CREATE TABLE items_requisicion (
    id SERIAL PRIMARY KEY,
    requisicion_id INT REFERENCES requisiciones(id),
    insumo_id INT REFERENCES insumos(id)
);
```

### 4. **Compras**
```sql
CREATE TABLE compras (
    id SERIAL PRIMARY KEY,
    proveedor_id INT REFERENCES proveedores(id), -- Nuevo
    usuario_id INT REFERENCES usuarios(id),
    fecha_compra DATE DEFAULT CURRENT_DATE,
    total NUMERIC(10,2),
    metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    facturo? BOOLEAN DEFAULT FALSE -- ¿El usuario solicitó factura?
);

CREATE TABLE items_compra (
    id SERIAL PRIMARY KEY,
    compra_id INT REFERENCES compras(id),
    insumo_id INT REFERENCES insumos(id),
    precio NUMERIC(10,2) NOT NULL, -- Precio unitario en la compra
    cantidad NUMERIC(10,2) NOT NULL, -- Ej: 50 (unidades compradas)
    unidad VARCHAR(20) NOT NULL -- Ej: "gr", "kg", "litros"
);
```

Flujo de ejemplo:
1. El cocinero José se da cuenta que queda poca canela. Abre la pantalla de requisiciones y selecciona la canela de la lista de insumos, también tiene la posibilidad de crear un insumo nuevo en caso de no estar en la lista. Así, crea una requesición que en este caso solo tiene la canela pero podrían ser más productos.
2. Juanita, la encargada de compras abre su pantalla de Compras por hacer y ve todos los items_requisicion, los puede ordenar por proveedor para que al ir a cada súper mercado o proveedor pueda ver la lista de lo que puede comprar ahí. En este caso, Juanita va comprar la Canela a Walmart porque le queda más cerca.
Juanita registra que hace una compra en Walmart y pone todos los item que compró aquí, los items_requisicion están de fácil adición para agregar a la lista de items_compra pero también puede agregar items que no estaban en la lista de items_requisicion. En este caso agrega la Canela que se pidió pero también compró una escoba que hacía falta en el negocio, agrega las dos cosas a la lista, pagó con tarjeta, selecciona que sí pidió factura y registra la compra.
3. Paquito, El gerente a fin de mes está interesado en ver el histórico del precio de la canela y su relación de precio unitario por cada proveedor, es así que accede a la pantalla de Análisis de compras y obtiene la información de todas las compras que se han hecho de Canela y puede ver la información agrupada por proveedor y cómo se ha comportado el precio de la canela por gramo en el último año.
