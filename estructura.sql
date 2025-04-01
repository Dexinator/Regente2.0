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
    empleado_id INT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE, -- ✅ Se agrega referencia a empleados
    num_personas INT DEFAULT 1 -- ✅ Nueva columna para registrar número de personas
);

detalles_orden
CREATE TABLE detalles_orden (
    id SERIAL PRIMARY KEY, 
    orden_id INT NOT NULL REFERENCES ordenes(orden_id) ON DELETE CASCADE, 
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE, 
    cantidad INT DEFAULT 1, 
    precio_unitario NUMERIC(10,2) NOT NULL, 
    empleado_id INT NOT NULL REFERENCES empleados(id) ON DELETE CASCADE, -- ✅ Se agrega referencia a empleados
    sabor_id INT REFERENCES sabores(id) ON DELETE SET NULL,
    tamano_id INT REFERENCES sabores(id) ON DELETE SET NULL, -- Referencia al tamaño (también en tabla sabores)
    preparado BOOLEAN DEFAULT FALSE, -- Indica si el producto ya fue preparado
    tiempo_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Momento en que se creó el detalle
    tiempo_preparacion TIMESTAMP -- Momento en que se marcó como preparado
);

CREATE TABLE public.pagos (
    id integer NOT NULL,
    orden_id integer,
    metodo text NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    empleado_id integer,
    propina numeric(10,2) DEFAULT 0,
    porcentaje_propina numeric(5,2),
    CONSTRAINT pagos_metodo_check CHECK ((metodo = ANY (ARRAY['efectivo'::text, 'tarjeta'::text, 'transferencia'::text, 'otro'::text])))
);

-- Nueva estructura para gestionar variantes/sabores de productos
CREATE TABLE categorias_variantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL -- 'pulque', 'platillo', etc.
);

CREATE TABLE sabores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id INT REFERENCES categorias_variantes(id) ON DELETE CASCADE,
    disponible BOOLEAN DEFAULT TRUE,
    precio_adicional NUMERIC(10, 2) DEFAULT 0
);

CREATE TABLE producto_sabor (
    id SERIAL PRIMARY KEY,
    producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
    sabor_id INT REFERENCES sabores(id) ON DELETE CASCADE,
    UNIQUE(producto_id, sabor_id)
);

-- Tabla de mapeo entre categorías de productos y tipos de variantes
CREATE TABLE categoria_producto_tipo_variante (
    id SERIAL PRIMARY KEY,
    categoria_producto VARCHAR(50) NOT NULL, -- Debe coincidir con los valores en productos.categoria
    tipo_variante VARCHAR(50) NOT NULL, -- Debe coincidir con los valores en categorias_variantes.tipo
    UNIQUE(categoria_producto, tipo_variante)
);

-- Ejemplos de relaciones entre categorías y tipos de variantes
-- INSERT INTO categoria_producto_tipo_variante (categoria_producto, tipo_variante) VALUES
-- ('Tostadas', 'platillo'),
-- ('Molletes', 'platillo'),
-- ('Pulques', 'pulque');