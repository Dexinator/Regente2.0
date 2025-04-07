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

-- TABLAS DE CATÁLOGO
CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio_base DECIMAL(10, 2) NOT NULL,
  categoria_id INT REFERENCES categorias(id) ON DELETE CASCADE,
  imagen VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE variantes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL, -- 'sabor', 'tamaño', 'ingrediente', etc.
  descripcion TEXT,
  precio_adicional DECIMAL(10, 2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categorias_variantes (
  id SERIAL PRIMARY KEY,
  categoria_id INT REFERENCES categorias(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'sabores', 'tamaños', 'ingredientes', etc.
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE
);

-- TABLAS OPERATIVAS
CREATE TABLE ordenes (
  id SERIAL PRIMARY KEY,
  mesa_id INT,
  empleado_id INT NOT NULL,
  cliente_nombre VARCHAR(100),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado VARCHAR(20) DEFAULT 'pendiente',
  total DECIMAL(10, 2) DEFAULT 0,
  propina DECIMAL(10, 2) DEFAULT 0,
  forma_pago VARCHAR(20)
);

CREATE TABLE detalles_orden (
  id SERIAL PRIMARY KEY,
  orden_id INT REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  empleado_id INT NOT NULL,
  sabor_id INT REFERENCES variantes(id) ON DELETE SET NULL,
  tamano_id INT REFERENCES variantes(id) ON DELETE SET NULL,
  ingrediente_id INT REFERENCES variantes(id) ON DELETE SET NULL,
  notas TEXT,
  estado VARCHAR(20) DEFAULT 'pendiente',
  tiempo_preparacion TIMESTAMP,
  cancelado BOOLEAN DEFAULT FALSE
);

CREATE TABLE empleados (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  rol VARCHAR(50) NOT NULL,
  pin VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mesas (
  id SERIAL PRIMARY KEY,
  numero INT NOT NULL UNIQUE,
  capacidad INT,
  estado VARCHAR(20) DEFAULT 'disponible',
  activo BOOLEAN DEFAULT TRUE
);

-- TABLAS DE RELACIÓN
CREATE TABLE producto_variante (
  id SERIAL PRIMARY KEY,
  producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
  variante_id INT REFERENCES variantes(id) ON DELETE CASCADE,
  precio_adicional DECIMAL(10, 2) DEFAULT 0,
  UNIQUE(producto_id, variante_id)
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

-- Ejemplos de relaciones entre categorías y tipos de variantes
-- INSERT INTO categoria_producto_tipo_variante (categoria_producto, tipo_variante) VALUES
-- ('Tostadas', 'platillo'),
-- ('Molletes', 'platillo'),
-- ('Pulques', 'pulque'),
-- ('Cena', 'ingredientes');

-- Ejemplos de ingredientes extra para cenas
-- INSERT INTO categorias_variantes (nombre, tipo) VALUES ('Ingredientes Extra', 'ingredientes');
-- Suponiendo que el ID para 'Ingredientes Extra' es 1:
-- INSERT INTO sabores (nombre, categoria_id, disponible, precio_adicional) VALUES
-- ('Carne árabe', 1, TRUE, 15),
-- ('Chorizo argentino', 1, TRUE, 15),
-- ('Manzana con tocino', 1, TRUE, 15),
-- ('Champiñones', 1, TRUE, 15);

-- Para cada producto de categoría "Cena", crear relaciones con los ingredientes:
-- INSERT INTO producto_sabor (producto_id, sabor_id)
-- SELECT p.id, s.id
-- FROM productos p, sabores s
-- WHERE p.categoria = 'Cena' 
-- AND s.categoria_id = (SELECT id FROM categorias_variantes WHERE tipo = 'ingredientes');