Presos (así llamamos a nuestros clientes)

CREATE TABLE presos (
    id SERIAL PRIMARY KEY, 
    reg_name TEXT NOT NULL, 
    res_tel TEXT NOT NULL, 
    IGname TEXT, 
    Bday TEXT NOT NULL, 
    mkt BOOLEAN NOT NULL, -- ✅ Ahora usa BOOLEAN en lugar de INT
    cellmate INT NOT NULL, 
    referidos INT DEFAULT 0, 
    fecha_registro DATE DEFAULT CURRENT_DATE
);

Productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY, 
    nombre VARCHAR(255) NOT NULL, 
    precio NUMERIC(10, 2) NOT NULL, 
    categoria VARCHAR(50)
);

Empleados
CREATE TABLE empleados (
    id SERIAL PRIMARY KEY, 
    nombre VARCHAR(255) NOT NULL, 
    usuario VARCHAR(50) UNIQUE NOT NULL, 
    password TEXT NOT NULL, 
    rol TEXT CHECK (rol IN ('admin', 'mesero', 'cocinero', 'financiero')) NOT NULL, 
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT TRUE -- ✅ Se agrega columna para indicar si sigue trabajando (1 = activo, 0 = inactivo)
);

Ordenes
CREATE TABLE ordenes (
    orden_id SERIAL PRIMARY KEY, -- ✅ Se cambia id por orden_id
    preso_id INT REFERENCES presos(id) ON DELETE SET NULL, 
    nombre_cliente VARCHAR(255), 
    total NUMERIC(10, 2) NOT NULL, 
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    estado TEXT CHECK (estado IN ('abierta', 'cerrada')) DEFAULT 'abierta',
    empleado_id INT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE -- ✅ Se agrega referencia a empleados
);

detalles_orden
CREATE TABLE detalles_orden (
    id SERIAL PRIMARY KEY, 
    orden_id INT NOT NULL REFERENCES ordenes(orden_id) ON DELETE CASCADE, 
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE, 
    cantidad INT DEFAULT 1, 
    precio_unitario NUMERIC(10,2) NOT NULL, 
    empleado_id INT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE -- ✅ Se agrega referencia a empleados
);