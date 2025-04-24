-- Estructura de base de datos para Regente
-- Generado a partir de first_releasedb.txt

-- Crear base de datos
CREATE DATABASE regente WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';

-- Conectar a la base de datos
\c regente;

-- Tabla categoria_producto_tipo_variante
CREATE TABLE public.categoria_producto_tipo_variante (
    id integer NOT NULL,
    categoria_producto character varying(50) NOT NULL,
    tipo_variante character varying(50) NOT NULL
);

-- Secuencia para categoria_producto_tipo_variante
CREATE SEQUENCE public.categoria_producto_tipo_variante_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.categoria_producto_tipo_variante_id_seq OWNED BY public.categoria_producto_tipo_variante.id;

-- Tabla categorias_variantes
CREATE TABLE public.categorias_variantes (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    tipo character varying(50) NOT NULL
);

-- Secuencia para categorias_variantes
CREATE SEQUENCE public.categorias_variantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.categorias_variantes_id_seq OWNED BY public.categorias_variantes.id;

-- Tabla detalles_orden
CREATE TABLE public.detalles_orden (
    id integer NOT NULL,
    orden_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer DEFAULT 1,
    precio_unitario numeric(10,2) NOT NULL,
    empleado_id integer NOT NULL,
    sabor_id integer,
    notas text,
    tamano_id integer,
    preparado boolean DEFAULT false,
    tiempo_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tiempo_preparacion timestamp without time zone,
    ingrediente_id integer
);

-- Secuencia para detalles_orden
CREATE SEQUENCE public.detalles_orden_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.detalles_orden_id_seq OWNED BY public.detalles_orden.id;

-- Tabla empleados
CREATE TABLE public.empleados (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    usuario character varying(50) NOT NULL,
    password text NOT NULL,
    rol text NOT NULL,
    fecha_ingreso date DEFAULT CURRENT_DATE,
    activo boolean DEFAULT true,
    CONSTRAINT empleados_rol_check CHECK ((rol = ANY (ARRAY['admin'::text, 'mesero'::text, 'cocinero'::text, 'financiero'::text, 'gerente'::text])))
);

-- Secuencia para empleados
CREATE SEQUENCE public.empleados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.empleados_id_seq OWNED BY public.empleados.id;

-- Tabla grados
CREATE TABLE public.grados (
    id integer NOT NULL,
    nombre text NOT NULL,
    descuento numeric(5,2) NOT NULL
);

-- Secuencia para grados
CREATE SEQUENCE public.grados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.grados_id_seq OWNED BY public.grados.id;

-- Tabla codigos_promocionales
CREATE TABLE public.codigos_promocionales (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    porcentaje_descuento numeric(5,2) NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    activo boolean DEFAULT true,
    usos_maximos integer DEFAULT -1,
    usos_actuales integer DEFAULT 0,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Secuencia para codigos_promocionales
CREATE SEQUENCE public.codigos_promocionales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.codigos_promocionales_id_seq OWNED BY public.codigos_promocionales.id;

-- Tabla ordenes
CREATE TABLE public.ordenes (
    orden_id integer NOT NULL,
    preso_id integer,
    nombre_cliente character varying(255),
    total numeric(10,2) NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado text DEFAULT 'abierta'::text,
    empleado_id integer NOT NULL,
    total_bruto numeric(10,2),
    num_personas integer DEFAULT 1,
    codigo_descuento_id integer,
    CONSTRAINT ordenes_estado_check CHECK ((estado = ANY (ARRAY['abierta'::text, 'cerrada'::text])))
);

-- Secuencia para ordenes
CREATE SEQUENCE public.ordenes_orden_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.ordenes_orden_id_seq OWNED BY public.ordenes.orden_id;

-- Tabla pagos
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

-- Secuencia para pagos
CREATE SEQUENCE public.pagos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.pagos_id_seq OWNED BY public.pagos.id;

-- Tabla preso_grado
CREATE TABLE public.preso_grado (
    id integer NOT NULL,
    preso_id integer,
    grado_id integer,
    fecha_otorgado date DEFAULT CURRENT_DATE
);

-- Secuencia para preso_grado
CREATE SEQUENCE public.preso_grado_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.preso_grado_id_seq OWNED BY public.preso_grado.id;

-- Tabla presos
CREATE TABLE public.presos (
    id integer NOT NULL,
    reg_name text NOT NULL,
    res_tel text NOT NULL,
    igname text,
    bday text NOT NULL,
    mkt boolean NOT NULL,
    cellmate integer NOT NULL,
    referidos integer DEFAULT 0,
    fecha_registro date DEFAULT CURRENT_DATE
);

-- Secuencia para presos
CREATE SEQUENCE public.presos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.presos_id_seq OWNED BY public.presos.id;

-- Tabla producto_sabor
CREATE TABLE public.producto_sabor (
    id integer NOT NULL,
    producto_id integer,
    sabor_id integer
);

-- Secuencia para producto_sabor
CREATE SEQUENCE public.producto_sabor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.producto_sabor_id_seq OWNED BY public.producto_sabor.id;

-- Tabla productos
CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    precio numeric(10,2) NOT NULL,
    categoria character varying(50),
    costo numeric(10,2)
);

-- Secuencia para productos
CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;

-- Tabla sabores
CREATE TABLE public.sabores (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    categoria_id integer,
    disponible boolean DEFAULT true,
    precio_adicional numeric(10,2) DEFAULT 0
);

-- Secuencia para sabores
CREATE SEQUENCE public.sabores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.sabores_id_seq OWNED BY public.sabores.id;

-- Configuración de los valores por defecto para las columnas ID
ALTER TABLE ONLY public.categoria_producto_tipo_variante ALTER COLUMN id SET DEFAULT nextval('public.categoria_producto_tipo_variante_id_seq'::regclass);
ALTER TABLE ONLY public.categorias_variantes ALTER COLUMN id SET DEFAULT nextval('public.categorias_variantes_id_seq'::regclass);
ALTER TABLE ONLY public.codigos_promocionales ALTER COLUMN id SET DEFAULT nextval('public.codigos_promocionales_id_seq'::regclass);
ALTER TABLE ONLY public.detalles_orden ALTER COLUMN id SET DEFAULT nextval('public.detalles_orden_id_seq'::regclass);
ALTER TABLE ONLY public.empleados ALTER COLUMN id SET DEFAULT nextval('public.empleados_id_seq'::regclass);
ALTER TABLE ONLY public.grados ALTER COLUMN id SET DEFAULT nextval('public.grados_id_seq'::regclass);
ALTER TABLE ONLY public.ordenes ALTER COLUMN orden_id SET DEFAULT nextval('public.ordenes_orden_id_seq'::regclass);
ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);
ALTER TABLE ONLY public.preso_grado ALTER COLUMN id SET DEFAULT nextval('public.preso_grado_id_seq'::regclass);
ALTER TABLE ONLY public.presos ALTER COLUMN id SET DEFAULT nextval('public.presos_id_seq'::regclass);
ALTER TABLE ONLY public.producto_sabor ALTER COLUMN id SET DEFAULT nextval('public.producto_sabor_id_seq'::regclass);
ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);
ALTER TABLE ONLY public.sabores ALTER COLUMN id SET DEFAULT nextval('public.sabores_id_seq'::regclass);

-- Claves primarias
ALTER TABLE ONLY public.categoria_producto_tipo_variante ADD CONSTRAINT categoria_producto_tipo_variante_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categorias_variantes ADD CONSTRAINT categorias_variantes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.codigos_promocionales ADD CONSTRAINT codigos_promocionales_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.detalles_orden ADD CONSTRAINT detalles_orden_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.empleados ADD CONSTRAINT empleados_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.grados ADD CONSTRAINT grados_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ordenes ADD CONSTRAINT ordenes_pkey PRIMARY KEY (orden_id);
ALTER TABLE ONLY public.pagos ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.preso_grado ADD CONSTRAINT preso_grado_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.presos ADD CONSTRAINT presos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.producto_sabor ADD CONSTRAINT producto_sabor_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.productos ADD CONSTRAINT productos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sabores ADD CONSTRAINT sabores_pkey PRIMARY KEY (id);

-- Restricciones únicas
ALTER TABLE ONLY public.categoria_producto_tipo_variante ADD CONSTRAINT categoria_producto_tipo_varia_categoria_producto_tipo_varia_key UNIQUE (categoria_producto, tipo_variante);
ALTER TABLE ONLY public.codigos_promocionales ADD CONSTRAINT codigos_promocionales_codigo_key UNIQUE (codigo);
ALTER TABLE ONLY public.empleados ADD CONSTRAINT empleados_usuario_key UNIQUE (usuario);
ALTER TABLE ONLY public.grados ADD CONSTRAINT grados_nombre_key UNIQUE (nombre);
ALTER TABLE ONLY public.producto_sabor ADD CONSTRAINT producto_sabor_producto_id_sabor_id_key UNIQUE (producto_id, sabor_id);

-- Claves foráneas
ALTER TABLE ONLY public.detalles_orden ADD CONSTRAINT detalles_orden_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.detalles_orden ADD CONSTRAINT detalles_orden_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.sabores(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.detalles_orden ADD CONSTRAINT detalles_orden_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes(orden_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.detalles_orden ADD CONSTRAINT detalles_orden_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.detalles_orden ADD CONSTRAINT detalles_orden_sabor_id_fkey FOREIGN KEY (sabor_id) REFERENCES public.sabores(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.detalles_orden ADD CONSTRAINT detalles_orden_tamano_id_fkey FOREIGN KEY (tamano_id) REFERENCES public.sabores(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.ordenes ADD CONSTRAINT ordenes_codigo_descuento_id_fkey FOREIGN KEY (codigo_descuento_id) REFERENCES public.codigos_promocionales(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.ordenes ADD CONSTRAINT ordenes_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ordenes ADD CONSTRAINT ordenes_preso_id_fkey FOREIGN KEY (preso_id) REFERENCES public.presos(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.pagos ADD CONSTRAINT pagos_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id);
ALTER TABLE ONLY public.pagos ADD CONSTRAINT pagos_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes(orden_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.preso_grado ADD CONSTRAINT preso_grado_grado_id_fkey FOREIGN KEY (grado_id) REFERENCES public.grados(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.preso_grado ADD CONSTRAINT preso_grado_preso_id_fkey FOREIGN KEY (preso_id) REFERENCES public.presos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.producto_sabor ADD CONSTRAINT producto_sabor_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.producto_sabor ADD CONSTRAINT producto_sabor_sabor_id_fkey FOREIGN KEY (sabor_id) REFERENCES public.sabores(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.sabores ADD CONSTRAINT sabores_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_variantes(id) ON DELETE CASCADE; 