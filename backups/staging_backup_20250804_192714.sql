--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.9 (Debian 16.9-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _heroku; Type: SCHEMA; Schema: -; Owner: heroku_admin
--

CREATE SCHEMA _heroku;


ALTER SCHEMA _heroku OWNER TO heroku_admin;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: u3tobu994lm3di
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO u3tobu994lm3di;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: u3tobu994lm3di
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: create_ext(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.create_ext() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  schemaname TEXT;
  databaseowner TEXT;

  r RECORD;

BEGIN

  IF tg_tag = 'CREATE EXTENSION' and current_user != 'rds_superuser' THEN
    FOR r IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        CONTINUE WHEN r.command_tag != 'CREATE EXTENSION' OR r.object_type != 'extension';

        schemaname = (
            SELECT n.nspname
            FROM pg_catalog.pg_extension AS e
            INNER JOIN pg_catalog.pg_namespace AS n
            ON e.extnamespace = n.oid
            WHERE e.oid = r.objid
        );

        databaseowner = (
            SELECT pg_catalog.pg_get_userbyid(d.datdba)
            FROM pg_catalog.pg_database d
            WHERE d.datname = current_database()
        );
        --RAISE NOTICE 'Record for event trigger %, objid: %,tag: %, current_user: %, schema: %, database_owenr: %', r.object_identity, r.objid, tg_tag, current_user, schemaname, databaseowner;
        IF r.object_identity = 'address_standardizer_data_us' THEN
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'us_gaz');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'us_lex');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'us_rules');
        ELSIF r.object_identity = 'amcheck' THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.bt_index_check TO %I;', schemaname, databaseowner);
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.bt_index_parent_check TO %I;', schemaname, databaseowner);
        ELSIF r.object_identity = 'dict_int' THEN
            EXECUTE format('ALTER TEXT SEARCH DICTIONARY %I.intdict OWNER TO %I;', schemaname, databaseowner);
        ELSIF r.object_identity = 'pg_partman' THEN
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'part_config');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'part_config_sub');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT, UPDATE, INSERT, DELETE', databaseowner, 'custom_time_partitions');
        ELSIF r.object_identity = 'pg_stat_statements' THEN
            EXECUTE format('GRANT EXECUTE ON FUNCTION %I.pg_stat_statements_reset TO %I;', schemaname, databaseowner);
        ELSIF r.object_identity = 'postgis' THEN
            PERFORM _heroku.postgis_after_create();
        ELSIF r.object_identity = 'postgis_raster' THEN
            PERFORM _heroku.postgis_after_create();
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT', databaseowner, 'raster_columns');
            PERFORM _heroku.grant_table_if_exists(schemaname, 'SELECT', databaseowner, 'raster_overviews');
        ELSIF r.object_identity = 'postgis_topology' THEN
            PERFORM _heroku.postgis_after_create();
            EXECUTE format('GRANT USAGE ON SCHEMA topology TO %I;', databaseowner);
            EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA topology TO %I;', databaseowner);
            PERFORM _heroku.grant_table_if_exists('topology', 'SELECT, UPDATE, INSERT, DELETE', databaseowner);
            EXECUTE format('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA topology TO %I;', databaseowner);
        ELSIF r.object_identity = 'postgis_tiger_geocoder' THEN
            PERFORM _heroku.postgis_after_create();
            EXECUTE format('GRANT USAGE ON SCHEMA tiger TO %I;', databaseowner);
            EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tiger TO %I;', databaseowner);
            PERFORM _heroku.grant_table_if_exists('tiger', 'SELECT, UPDATE, INSERT, DELETE', databaseowner);

            EXECUTE format('GRANT USAGE ON SCHEMA tiger_data TO %I;', databaseowner);
            EXECUTE format('GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tiger_data TO %I;', databaseowner);
            PERFORM _heroku.grant_table_if_exists('tiger_data', 'SELECT, UPDATE, INSERT, DELETE', databaseowner);
        END IF;
    END LOOP;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.create_ext() OWNER TO heroku_admin;

--
-- Name: drop_ext(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.drop_ext() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  schemaname TEXT;
  databaseowner TEXT;

  r RECORD;

BEGIN

  IF tg_tag = 'DROP EXTENSION' and current_user != 'rds_superuser' THEN
    FOR r IN SELECT * FROM pg_event_trigger_dropped_objects()
    LOOP
      CONTINUE WHEN r.object_type != 'extension';

      databaseowner = (
            SELECT pg_catalog.pg_get_userbyid(d.datdba)
            FROM pg_catalog.pg_database d
            WHERE d.datname = current_database()
      );

      --RAISE NOTICE 'Record for event trigger %, objid: %,tag: %, current_user: %, database_owner: %, schemaname: %', r.object_identity, r.objid, tg_tag, current_user, databaseowner, r.schema_name;

      IF r.object_identity = 'postgis_topology' THEN
          EXECUTE format('DROP SCHEMA IF EXISTS topology');
      END IF;
    END LOOP;

  END IF;
END;
$$;


ALTER FUNCTION _heroku.drop_ext() OWNER TO heroku_admin;

--
-- Name: extension_before_drop(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.extension_before_drop() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  query TEXT;

BEGIN
  query = (SELECT current_query());

  -- RAISE NOTICE 'executing extension_before_drop: tg_event: %, tg_tag: %, current_user: %, session_user: %, query: %', tg_event, tg_tag, current_user, session_user, query;
  IF tg_tag = 'DROP EXTENSION' and not pg_has_role(session_user, 'rds_superuser', 'MEMBER') THEN
    -- DROP EXTENSION [ IF EXISTS ] name [, ...] [ CASCADE | RESTRICT ]
    IF (regexp_match(query, 'DROP\s+EXTENSION\s+(IF\s+EXISTS)?.*(plpgsql)', 'i') IS NOT NULL) THEN
      RAISE EXCEPTION 'The plpgsql extension is required for database management and cannot be dropped.';
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.extension_before_drop() OWNER TO heroku_admin;

--
-- Name: grant_table_if_exists(text, text, text, text); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.grant_table_if_exists(alias_schemaname text, grants text, databaseowner text, alias_tablename text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

BEGIN

  IF alias_tablename IS NULL THEN
    EXECUTE format('GRANT %s ON ALL TABLES IN SCHEMA %I TO %I;', grants, alias_schemaname, databaseowner);
  ELSE
    IF EXISTS (SELECT 1 FROM pg_tables WHERE pg_tables.schemaname = alias_schemaname AND pg_tables.tablename = alias_tablename) THEN
      EXECUTE format('GRANT %s ON TABLE %I.%I TO %I;', grants, alias_schemaname, alias_tablename, databaseowner);
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.grant_table_if_exists(alias_schemaname text, grants text, databaseowner text, alias_tablename text) OWNER TO heroku_admin;

--
-- Name: postgis_after_create(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.postgis_after_create() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    schemaname TEXT;
    databaseowner TEXT;
BEGIN
    schemaname = (
        SELECT n.nspname
        FROM pg_catalog.pg_extension AS e
        INNER JOIN pg_catalog.pg_namespace AS n ON e.extnamespace = n.oid
        WHERE e.extname = 'postgis'
    );
    databaseowner = (
        SELECT pg_catalog.pg_get_userbyid(d.datdba)
        FROM pg_catalog.pg_database d
        WHERE d.datname = current_database()
    );

    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.st_tileenvelope TO %I;', schemaname, databaseowner);
    EXECUTE format('GRANT SELECT, UPDATE, INSERT, DELETE ON TABLE %I.spatial_ref_sys TO %I;', schemaname, databaseowner);
END;
$$;


ALTER FUNCTION _heroku.postgis_after_create() OWNER TO heroku_admin;

--
-- Name: validate_extension(); Type: FUNCTION; Schema: _heroku; Owner: heroku_admin
--

CREATE FUNCTION _heroku.validate_extension() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$

DECLARE

  schemaname TEXT;
  r RECORD;

BEGIN

  IF tg_tag = 'CREATE EXTENSION' and current_user != 'rds_superuser' THEN
    FOR r IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
      CONTINUE WHEN r.command_tag != 'CREATE EXTENSION' OR r.object_type != 'extension';

      schemaname = (
        SELECT n.nspname
        FROM pg_catalog.pg_extension AS e
        INNER JOIN pg_catalog.pg_namespace AS n
        ON e.extnamespace = n.oid
        WHERE e.oid = r.objid
      );

      IF schemaname = '_heroku' THEN
        RAISE EXCEPTION 'Creating extensions in the _heroku schema is not allowed';
      END IF;
    END LOOP;
  END IF;
END;
$$;


ALTER FUNCTION _heroku.validate_extension() OWNER TO heroku_admin;

--
-- Name: actualizar_estado_requisicion(); Type: FUNCTION; Schema: public; Owner: u3tobu994lm3di
--

CREATE FUNCTION public.actualizar_estado_requisicion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
  BEGIN
      -- Actualizar el estado del item de requisición
      UPDATE items_requisicion
      SET completado = TRUE
      WHERE id = NEW.requisicion_item_id;

      -- Verificar si todos los items de la requisición están completados
      IF NOT EXISTS (
          SELECT 1 FROM items_requisicion
          WHERE requisicion_id = (
              SELECT requisicion_id FROM items_requisicion WHERE id = NEW.requisicion_item_id
          )
          AND completado = FALSE
      ) THEN
          -- Si todos están completados, actualizar la requisición
          UPDATE requisiciones
          SET completada = TRUE, fecha_completada = CURRENT_TIMESTAMP
          WHERE id = (
              SELECT requisicion_id FROM items_requisicion WHERE id = NEW.requisicion_item_id
          );
      END IF;

      RETURN NEW;
  END;
  $$;


ALTER FUNCTION public.actualizar_estado_requisicion() OWNER TO u3tobu994lm3di;

--
-- Name: actualizar_inventario(); Type: FUNCTION; Schema: public; Owner: u3tobu994lm3di
--

CREATE FUNCTION public.actualizar_inventario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.ultima_actualizacion := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_inventario() OWNER TO u3tobu994lm3di;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: compras; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.compras (
    id integer NOT NULL,
    proveedor_id integer,
    usuario_id integer,
    fecha_compra timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total numeric(10,2) NOT NULL,
    metodo_pago character varying(20),
    solicito_factura boolean DEFAULT false,
    numero_factura character varying(50),
    notas text,
    CONSTRAINT compras_metodo_pago_check CHECK (((metodo_pago)::text = ANY (ARRAY[('efectivo'::character varying)::text, ('tarjeta'::character varying)::text, ('transferencia'::character varying)::text])))
);


ALTER TABLE public.compras OWNER TO u3tobu994lm3di;

--
-- Name: insumos; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.insumos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    categoria character varying(50),
    unidad_medida_default character varying(20) DEFAULT 'unidad'::character varying NOT NULL,
    fecha_alta date DEFAULT CURRENT_DATE,
    activo boolean DEFAULT true,
    marca character varying(100),
    cantidad_por_unidad numeric(10,3) DEFAULT 1
);


ALTER TABLE public.insumos OWNER TO u3tobu994lm3di;

--
-- Name: items_compra; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.items_compra (
    id integer NOT NULL,
    compra_id integer,
    insumo_id integer,
    requisicion_item_id integer,
    precio_unitario numeric(10,2) NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    unidad character varying(20) NOT NULL,
    subtotal numeric(10,2) GENERATED ALWAYS AS ((precio_unitario * cantidad)) STORED
);


ALTER TABLE public.items_compra OWNER TO u3tobu994lm3di;

--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    rfc character varying(13),
    direccion text,
    telefono character varying(20),
    email character varying(100),
    contacto_nombre character varying(100),
    fecha_alta date DEFAULT CURRENT_DATE,
    activo boolean DEFAULT true,
    dias_compra json
);


ALTER TABLE public.proveedores OWNER TO u3tobu994lm3di;

--
-- Name: analisis_precios_insumos; Type: VIEW; Schema: public; Owner: u3tobu994lm3di
--

CREATE VIEW public.analisis_precios_insumos AS
 SELECT i.id AS insumo_id,
    i.nombre AS insumo_nombre,
    i.categoria,
    p.id AS proveedor_id,
    p.nombre AS proveedor_nombre,
    ic.unidad,
    avg(ic.precio_unitario) AS precio_promedio,
    min(ic.precio_unitario) AS precio_minimo,
    max(ic.precio_unitario) AS precio_maximo,
    count(ic.id) AS num_compras,
    max(c.fecha_compra) AS ultima_compra
   FROM (((public.insumos i
     JOIN public.items_compra ic ON ((i.id = ic.insumo_id)))
     JOIN public.compras c ON ((ic.compra_id = c.id)))
     JOIN public.proveedores p ON ((c.proveedor_id = p.id)))
  GROUP BY i.id, i.nombre, i.categoria, p.id, p.nombre, ic.unidad
  ORDER BY i.nombre, p.nombre;


ALTER VIEW public.analisis_precios_insumos OWNER TO u3tobu994lm3di;

--
-- Name: categoria_producto_tipo_variante; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.categoria_producto_tipo_variante (
    id integer NOT NULL,
    categoria_producto character varying(50) NOT NULL,
    tipo_variante character varying(50) NOT NULL
);


ALTER TABLE public.categoria_producto_tipo_variante OWNER TO u3tobu994lm3di;

--
-- Name: categoria_producto_tipo_variante_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.categoria_producto_tipo_variante_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categoria_producto_tipo_variante_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: categoria_producto_tipo_variante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.categoria_producto_tipo_variante_id_seq OWNED BY public.categoria_producto_tipo_variante.id;


--
-- Name: categorias_variantes; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.categorias_variantes (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    tipo character varying(50) NOT NULL
);


ALTER TABLE public.categorias_variantes OWNER TO u3tobu994lm3di;

--
-- Name: categorias_variantes_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.categorias_variantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_variantes_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: categorias_variantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.categorias_variantes_id_seq OWNED BY public.categorias_variantes.id;


--
-- Name: codigos_promocionales; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.codigos_promocionales (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    porcentaje_descuento numeric(5,2) NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    activo boolean DEFAULT true,
    usos_maximos integer DEFAULT '-1'::integer,
    usos_actuales integer DEFAULT 0,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.codigos_promocionales OWNER TO u3tobu994lm3di;

--
-- Name: codigos_promocionales_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.codigos_promocionales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.codigos_promocionales_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: codigos_promocionales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.codigos_promocionales_id_seq OWNED BY public.codigos_promocionales.id;


--
-- Name: compras_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.compras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compras_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: compras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.compras_id_seq OWNED BY public.compras.id;


--
-- Name: detalles_orden; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.detalles_orden (
    id integer NOT NULL,
    orden_id integer NOT NULL,
    producto_id integer,
    cantidad integer DEFAULT 1,
    precio_unitario numeric(10,2) NOT NULL,
    empleado_id integer NOT NULL,
    sabor_id integer,
    notas text,
    tamano_id integer,
    preparado boolean DEFAULT false,
    tiempo_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tiempo_preparacion timestamp without time zone,
    ingrediente_id integer,
    entregado boolean DEFAULT false,
    tiempo_entrega timestamp without time zone,
    sentencia_id integer,
    es_sentencia_principal boolean DEFAULT false NOT NULL,
    sentencia_detalle_orden_padre_id integer,
    nombre_sentencia character varying(255),
    descripcion_sentencia text,
    es_para_llevar boolean DEFAULT false
);


ALTER TABLE public.detalles_orden OWNER TO u3tobu994lm3di;

--
-- Name: detalles_orden_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.detalles_orden_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalles_orden_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: detalles_orden_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.detalles_orden_id_seq OWNED BY public.detalles_orden.id;


--
-- Name: empleados; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

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


ALTER TABLE public.empleados OWNER TO u3tobu994lm3di;

--
-- Name: empleados_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.empleados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empleados_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: empleados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.empleados_id_seq OWNED BY public.empleados.id;


--
-- Name: grados; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.grados (
    id integer NOT NULL,
    nombre text NOT NULL,
    descuento numeric(5,2) NOT NULL
);


ALTER TABLE public.grados OWNER TO u3tobu994lm3di;

--
-- Name: grados_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.grados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grados_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: grados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.grados_id_seq OWNED BY public.grados.id;


--
-- Name: insumo_proveedor; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.insumo_proveedor (
    id integer NOT NULL,
    insumo_id integer,
    proveedor_id integer,
    precio_referencia numeric(10,2)
);


ALTER TABLE public.insumo_proveedor OWNER TO u3tobu994lm3di;

--
-- Name: insumo_proveedor_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.insumo_proveedor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.insumo_proveedor_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: insumo_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.insumo_proveedor_id_seq OWNED BY public.insumo_proveedor.id;


--
-- Name: insumos_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.insumos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.insumos_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: insumos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.insumos_id_seq OWNED BY public.insumos.id;


--
-- Name: inventario; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.inventario (
    id integer NOT NULL,
    insumo_id integer,
    cantidad_actual numeric(10,2) DEFAULT 0 NOT NULL,
    unidad character varying(20) NOT NULL,
    stock_minimo numeric(10,2) DEFAULT 0,
    stock_maximo numeric(10,2) DEFAULT 0,
    ultima_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventario OWNER TO u3tobu994lm3di;

--
-- Name: inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.inventario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventario_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.inventario_id_seq OWNED BY public.inventario.id;


--
-- Name: items_compra_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.items_compra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_compra_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: items_compra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.items_compra_id_seq OWNED BY public.items_compra.id;


--
-- Name: items_requisicion; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.items_requisicion (
    id integer NOT NULL,
    requisicion_id integer,
    insumo_id integer,
    cantidad numeric(10,2) NOT NULL,
    unidad character varying(20) NOT NULL,
    urgencia character varying(20) DEFAULT 'normal'::character varying,
    completado boolean DEFAULT false
);


ALTER TABLE public.items_requisicion OWNER TO u3tobu994lm3di;

--
-- Name: items_requisicion_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.items_requisicion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.items_requisicion_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: items_requisicion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.items_requisicion_id_seq OWNED BY public.items_requisicion.id;


--
-- Name: ordenes; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

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


ALTER TABLE public.ordenes OWNER TO u3tobu994lm3di;

--
-- Name: ordenes_orden_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.ordenes_orden_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordenes_orden_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: ordenes_orden_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.ordenes_orden_id_seq OWNED BY public.ordenes.orden_id;


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

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


ALTER TABLE public.pagos OWNER TO u3tobu994lm3di;

--
-- Name: pagos_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.pagos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagos_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: pagos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.pagos_id_seq OWNED BY public.pagos.id;


--
-- Name: preso_grado; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.preso_grado (
    id integer NOT NULL,
    preso_id integer,
    grado_id integer,
    fecha_otorgado date DEFAULT CURRENT_DATE
);


ALTER TABLE public.preso_grado OWNER TO u3tobu994lm3di;

--
-- Name: preso_grado_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.preso_grado_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preso_grado_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: preso_grado_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.preso_grado_id_seq OWNED BY public.preso_grado.id;


--
-- Name: presos; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

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


ALTER TABLE public.presos OWNER TO u3tobu994lm3di;

--
-- Name: presos_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.presos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.presos_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: presos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.presos_id_seq OWNED BY public.presos.id;


--
-- Name: producto_sabor; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.producto_sabor (
    id integer NOT NULL,
    producto_id integer,
    sabor_id integer
);


ALTER TABLE public.producto_sabor OWNER TO u3tobu994lm3di;

--
-- Name: producto_sabor_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.producto_sabor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.producto_sabor_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: producto_sabor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.producto_sabor_id_seq OWNED BY public.producto_sabor.id;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    precio numeric(10,2) NOT NULL,
    categoria character varying(50),
    costo numeric(10,2)
);


ALTER TABLE public.productos OWNER TO u3tobu994lm3di;

--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- Name: productos_sentencias; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.productos_sentencias (
    id integer NOT NULL,
    sentencia_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer DEFAULT 1,
    sabor_id integer,
    tamano_id integer,
    ingrediente_id integer,
    es_opcional boolean DEFAULT false,
    grupo_opcion integer,
    precio_unitario numeric(10,2) DEFAULT 0
);


ALTER TABLE public.productos_sentencias OWNER TO u3tobu994lm3di;

--
-- Name: productos_sentencias_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.productos_sentencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_sentencias_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: productos_sentencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.productos_sentencias_id_seq OWNED BY public.productos_sentencias.id;


--
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proveedores_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- Name: requisiciones; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.requisiciones (
    id integer NOT NULL,
    usuario_id integer,
    fecha_solicitud timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_completada timestamp without time zone,
    completada boolean DEFAULT false,
    notas text
);


ALTER TABLE public.requisiciones OWNER TO u3tobu994lm3di;

--
-- Name: requisiciones_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.requisiciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.requisiciones_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: requisiciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.requisiciones_id_seq OWNED BY public.requisiciones.id;


--
-- Name: sabores; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.sabores (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    categoria_id integer,
    disponible boolean DEFAULT true,
    precio_adicional numeric(10,2) DEFAULT 0
);


ALTER TABLE public.sabores OWNER TO u3tobu994lm3di;

--
-- Name: sabores_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.sabores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sabores_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: sabores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.sabores_id_seq OWNED BY public.sabores.id;


--
-- Name: sentencias; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.sentencias (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    descripcion text,
    precio numeric(10,2) NOT NULL,
    activa boolean DEFAULT true
);


ALTER TABLE public.sentencias OWNER TO u3tobu994lm3di;

--
-- Name: sentencias_id_seq; Type: SEQUENCE; Schema: public; Owner: u3tobu994lm3di
--

CREATE SEQUENCE public.sentencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sentencias_id_seq OWNER TO u3tobu994lm3di;

--
-- Name: sentencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.sentencias_id_seq OWNED BY public.sentencias.id;


--
-- Name: categoria_producto_tipo_variante id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.categoria_producto_tipo_variante ALTER COLUMN id SET DEFAULT nextval('public.categoria_producto_tipo_variante_id_seq'::regclass);


--
-- Name: categorias_variantes id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.categorias_variantes ALTER COLUMN id SET DEFAULT nextval('public.categorias_variantes_id_seq'::regclass);


--
-- Name: codigos_promocionales id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.codigos_promocionales ALTER COLUMN id SET DEFAULT nextval('public.codigos_promocionales_id_seq'::regclass);


--
-- Name: compras id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.compras ALTER COLUMN id SET DEFAULT nextval('public.compras_id_seq'::regclass);


--
-- Name: detalles_orden id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden ALTER COLUMN id SET DEFAULT nextval('public.detalles_orden_id_seq'::regclass);


--
-- Name: empleados id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.empleados ALTER COLUMN id SET DEFAULT nextval('public.empleados_id_seq'::regclass);


--
-- Name: grados id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.grados ALTER COLUMN id SET DEFAULT nextval('public.grados_id_seq'::regclass);


--
-- Name: insumo_proveedor id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumo_proveedor ALTER COLUMN id SET DEFAULT nextval('public.insumo_proveedor_id_seq'::regclass);


--
-- Name: insumos id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumos ALTER COLUMN id SET DEFAULT nextval('public.insumos_id_seq'::regclass);


--
-- Name: inventario id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.inventario ALTER COLUMN id SET DEFAULT nextval('public.inventario_id_seq'::regclass);


--
-- Name: items_compra id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_compra ALTER COLUMN id SET DEFAULT nextval('public.items_compra_id_seq'::regclass);


--
-- Name: items_requisicion id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_requisicion ALTER COLUMN id SET DEFAULT nextval('public.items_requisicion_id_seq'::regclass);


--
-- Name: ordenes orden_id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.ordenes ALTER COLUMN orden_id SET DEFAULT nextval('public.ordenes_orden_id_seq'::regclass);


--
-- Name: pagos id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);


--
-- Name: preso_grado id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.preso_grado ALTER COLUMN id SET DEFAULT nextval('public.preso_grado_id_seq'::regclass);


--
-- Name: presos id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.presos ALTER COLUMN id SET DEFAULT nextval('public.presos_id_seq'::regclass);


--
-- Name: producto_sabor id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.producto_sabor ALTER COLUMN id SET DEFAULT nextval('public.producto_sabor_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- Name: productos_sentencias id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias ALTER COLUMN id SET DEFAULT nextval('public.productos_sentencias_id_seq'::regclass);


--
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- Name: requisiciones id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.requisiciones ALTER COLUMN id SET DEFAULT nextval('public.requisiciones_id_seq'::regclass);


--
-- Name: sabores id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.sabores ALTER COLUMN id SET DEFAULT nextval('public.sabores_id_seq'::regclass);


--
-- Name: sentencias id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.sentencias ALTER COLUMN id SET DEFAULT nextval('public.sentencias_id_seq'::regclass);


--
-- Data for Name: categoria_producto_tipo_variante; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.categoria_producto_tipo_variante (id, categoria_producto, tipo_variante) FROM stdin;
1	Cenas	sabor_comida
2	Cenas	ingrediente_extra
3	Pulque	tamano
4	Pulque	sabor_comida
5	Cerveza	sabor_comida
6	Cerveza Artesanal	sabor_comida
7	Otras Bebidas	sabor_comida
8	Otras Bebidas	ingrediente_extra
9	Antojitos	sabor_comida
10	Sentencias	sabor_comida
11	Sentencias	ingrediente_extra
12	Preparados	ingrediente_extra
\.


--
-- Data for Name: categorias_variantes; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.categorias_variantes (id, nombre, tipo) FROM stdin;
1	Sabores de comida	sabor_comida
6	Tamaños de pulque	tamano
7	Ingredientes Extra	ingrediente_extra
10	Sabores de cerveza Minerva	sabor_comida
11	Sabores de cerveza Tiburon	sabor_comida
12	Sabores de Brebaje	sabor_comida
13	Sabores de Vino	sabor_comida
14	Sabores de Torito	sabor_comida
15	Extras Tepache	ingrediente_extra
17	Sabores Itacate	sabor_comida
18	Sabores Infraccion	sabor_comida
19	Sabores Pena capital	sabor_comida
20	Sabores Noche en los separos	sabor_comida
2	Sabores de pulque Natural	sabor_comida
3	Sabores de pulque Temporada	sabor_comida
4	Sabores de pulque A la Carta	sabor_comida
5	Sabores de pulque Especial	sabor_comida
55	EXTRA vino tinto - barra libre	sabor_comida
21	Extras Cadena perpetua	ingrediente_extra
56	Extra cadena perpetua ESPECIAL	sabor_comida
16	Extras Agua de sabor	ingrediente_extra
58	Sabores de Refresco	sabor_comida
59	Sabores de Hidromiel	sabor_comida
\.


--
-- Data for Name: codigos_promocionales; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.codigos_promocionales (id, codigo, porcentaje_descuento, fecha_inicio, fecha_fin, activo, usos_maximos, usos_actuales, fecha_creacion) FROM stdin;
6	CENTINELAS	15.00	2025-04-24	2025-12-31	t	-1	0	2025-04-25 22:28:55.97621
1	BIENVENIDA	10.00	2025-04-24	2026-04-24	t	100	5	2025-04-24 17:03:42.859645
5	GUARDIA	5.00	2025-04-24	2025-12-31	t	-1	1	2025-04-25 22:28:55.97621
4	CARCELERX	10.00	2025-04-24	2025-12-31	t	-1	1	2025-04-25 22:27:20.313271
2	YEIPI	100.00	2025-04-24	2025-12-31	t	-1	6	2025-04-25 22:20:56.136738
\.


--
-- Data for Name: compras; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.compras (id, proveedor_id, usuario_id, fecha_compra, total, metodo_pago, solicito_factura, numero_factura, notas) FROM stdin;
\.


--
-- Data for Name: detalles_orden; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.detalles_orden (id, orden_id, producto_id, cantidad, precio_unitario, empleado_id, sabor_id, notas, tamano_id, preparado, tiempo_creacion, tiempo_preparacion, ingrediente_id, entregado, tiempo_entrega, sentencia_id, es_sentencia_principal, sentencia_detalle_orden_padre_id, nombre_sentencia, descripcion_sentencia, es_para_llevar) FROM stdin;
1	387	\N	1	170.00	5	\N	\N	\N	f	2025-07-02 19:49:32.525842	\N	\N	f	\N	2	t	\N	El Apando	Sentencia media para delitos moderados	f
2	387	\N	1	125.00	5	\N	\N	\N	f	2025-07-02 19:49:32.525842	\N	\N	f	\N	4	t	\N	Pena Capital	Sentencia máxima para los delitos más graves	f
3	387	\N	2	185.00	5	\N	\N	\N	f	2025-07-02 19:49:32.525842	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
4	387	\N	2	85.00	5	\N	\N	\N	f	2025-07-02 19:49:32.525842	\N	\N	f	\N	1	t	\N	Infracción	Sentencia leve para infracciones menores	f
210	429	40	1	235.00	5	138	\N	\N	f	2025-08-03 18:27:02.535515	\N	\N	f	\N	\N	f	\N	\N	\N	f
19	388	\N	1	170.00	5	\N	\N	\N	f	2025-07-10 02:24:51.849714	\N	\N	f	\N	2	t	\N	El Apando	Sentencia media para delitos moderados	f
20	388	\N	1	85.00	5	\N	\N	\N	f	2025-07-10 02:24:51.849714	\N	\N	f	\N	1	t	\N	Infracción	Sentencia leve para infracciones menores	f
21	388	\N	1	185.00	5	\N	\N	\N	f	2025-07-10 02:24:51.849714	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
22	388	\N	1	125.00	5	\N	\N	\N	f	2025-07-10 02:24:51.849714	\N	\N	f	\N	4	t	\N	Pena Capital	Sentencia máxima para los delitos más graves	f
43	389	\N	1	85.00	5	\N	\N	\N	f	2025-07-10 03:13:51.874073	\N	\N	f	\N	1	t	\N	Infracción	Sentencia leve para infracciones menores	f
48	389	\N	1	140.00	5	\N	\N	\N	f	2025-07-17 01:14:23.54933	\N	\N	f	\N	2	t	\N	El Apando	Sentencia media para delitos moderados	f
49	389	\N	1	85.00	5	\N	\N	\N	f	2025-07-17 01:14:23.54933	\N	\N	f	\N	1	t	\N	Infracción	Sentencia leve para infracciones menores	f
50	389	\N	1	155.00	5	\N	\N	\N	f	2025-07-17 01:14:23.54933	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
72	420	\N	1	140.00	5	\N	\N	\N	f	2025-07-17 01:46:01.355712	\N	\N	f	\N	6	t	\N	Sangrias 3x2	Jueves 3 sangrías al precio de 2	f
73	420	\N	1	125.00	5	\N	\N	\N	f	2025-07-17 01:46:01.355712	\N	\N	f	\N	4	t	\N	Pena Capital	Sentencia máxima para los delitos más graves	f
74	420	\N	1	155.00	5	\N	\N	\N	f	2025-07-17 01:46:01.355712	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
24	388	34	1	0.00	5	11	\N	\N	t	2025-07-10 02:24:51.849714	2025-07-10 03:15:19.463009	\N	t	2025-08-03 17:56:10.746191	2	f	19	\N	\N	f
33	388	9	1	0.00	5	\N	\N	\N	t	2025-07-10 02:24:51.849714	2025-07-10 03:15:22.7719	\N	t	2025-08-03 17:56:11.148632	4	f	22	\N	\N	f
10	387	49	1	0.00	5	\N	\N	\N	t	2025-07-02 19:49:32.525842	2025-08-03 17:57:28.039493	\N	t	2025-08-03 18:07:45.807574	4	f	2	\N	\N	f
12	387	22	1	0.00	5	37	\N	\N	t	2025-07-02 19:49:32.525842	2025-08-03 18:05:54.185547	\N	t	2025-08-03 18:07:46.472752	3	f	3	\N	\N	f
8	387	22	1	0.00	5	37	\N	\N	t	2025-07-02 19:49:32.525842	2025-08-03 17:57:24.071404	\N	t	2025-08-03 18:07:45.533337	4	f	2	\N	\N	f
32	388	22	1	0.00	5	37	\N	\N	t	2025-07-10 02:24:51.849714	2025-08-03 18:05:03.493153	\N	t	2025-08-03 18:07:52.006938	4	f	22	\N	\N	f
27	388	31	1	0.00	5	\N	\N	12	t	2025-07-10 02:24:51.849714	2025-08-03 17:57:29.838705	\N	t	2025-08-03 18:07:51.927427	1	f	20	\N	\N	f
31	388	31	1	0.00	5	\N	\N	12	t	2025-07-10 02:24:51.849714	2025-08-03 18:05:03.894659	\N	t	2025-08-03 18:07:52.051814	4	f	22	\N	\N	f
18	387	9	1	0.00	5	\N	\N	\N	t	2025-07-02 19:49:32.525842	2025-08-03 17:57:28.242717	\N	t	2025-08-03 18:07:45.854504	1	f	4	\N	\N	f
14	387	10	1	0.00	5	\N	\N	\N	t	2025-07-02 19:49:32.525842	2025-08-03 17:57:28.430041	\N	t	2025-08-03 18:07:45.869059	3	f	3	\N	\N	f
9	387	31	1	0.00	5	\N	\N	12	t	2025-07-02 19:49:32.525842	2025-08-03 18:04:58.625521	\N	t	2025-08-03 18:07:45.945835	4	f	2	\N	\N	f
23	388	22	1	0.00	5	37	\N	\N	t	2025-07-10 02:24:51.849714	2025-08-03 18:05:41.535446	\N	t	2025-08-03 18:07:52.069053	2	f	19	\N	\N	f
26	388	22	1	0.00	5	37	\N	\N	t	2025-07-10 02:24:51.849714	2025-08-03 18:05:54.360101	\N	t	2025-08-03 18:07:52.069659	1	f	20	\N	\N	f
39	389	11	1	120.00	5	136	\N	\N	t	2025-07-10 02:30:25.987103	2025-08-03 17:57:34.247459	\N	t	2025-08-03 18:07:55.443233	\N	f	\N	\N	\N	f
40	389	1	1	50.00	5	\N	\N	\N	t	2025-07-10 02:30:25.987103	2025-08-03 17:57:35.108165	\N	t	2025-08-03 18:07:55.4547	\N	f	\N	\N	\N	f
38	389	30	1	75.00	5	\N	\N	\N	t	2025-07-10 02:30:25.987103	2025-08-03 17:57:32.740664	\N	t	2025-08-03 18:07:55.410357	\N	f	\N	\N	\N	f
42	389	23	1	95.00	5	134	\N	\N	t	2025-07-10 02:30:25.987103	2025-08-03 17:57:35.694107	\N	t	2025-08-03 18:07:55.547838	\N	f	\N	\N	\N	f
37	389	57	1	10.00	5	\N	\N	\N	t	2025-07-10 02:30:25.987103	2025-08-03 17:57:32.431777	\N	t	2025-08-03 18:07:55.464677	\N	f	\N	\N	\N	f
44	389	22	1	0.00	5	37	\N	\N	t	2025-07-10 03:13:51.874073	2025-08-03 18:05:03.841218	\N	t	2025-08-03 18:07:55.593616	1	f	43	\N	\N	f
35	389	53	1	5.00	5	\N	\N	\N	t	2025-07-10 02:30:25.987103	2025-08-03 18:05:03.555132	\N	t	2025-08-03 18:07:55.575231	\N	f	\N	\N	\N	f
41	389	47	1	65.00	5	83	\N	\N	t	2025-07-10 02:30:25.987103	2025-08-03 18:05:03.745188	\N	t	2025-08-03 18:07:55.578291	\N	f	\N	\N	\N	f
15	387	32	1	0.00	5	\N	\N	15	t	2025-07-02 19:49:32.525842	2025-08-03 17:57:26.070366	\N	t	2025-08-03 18:07:46.487042	3	f	3	\N	\N	f
13	387	5	1	0.00	5	\N	\N	\N	t	2025-07-02 19:49:32.525842	2025-08-03 18:05:35.495342	\N	t	2025-08-03 18:07:46.309662	3	f	3	\N	\N	f
46	389	27	1	105.00	5	\N	\N	\N	t	2025-07-17 01:11:39.030555	2025-08-03 18:05:04.179989	45	t	2025-08-03 18:07:55.667794	\N	f	\N	\N	\N	f
52	389	34	1	0.00	5	10	\N	\N	t	2025-07-17 01:14:23.54933	2025-08-03 18:05:43.327806	\N	t	2025-08-03 18:07:56.018848	2	f	48	\N	\N	f
36	389	52	1	10.00	5	\N	\N	\N	t	2025-07-10 02:30:25.987103	2025-08-03 17:57:31.845172	\N	t	2025-08-03 18:07:55.358313	\N	f	\N	\N	\N	f
47	389	42	1	75.00	5	\N	\N	\N	t	2025-07-17 01:11:39.030555	2025-08-03 18:05:34.468544	47	t	2025-08-03 18:07:55.761557	\N	f	\N	\N	\N	f
45	389	31	1	0.00	5	\N	\N	12	t	2025-07-10 03:13:51.874073	2025-08-03 18:05:03.941642	\N	t	2025-08-03 18:07:55.758424	1	f	43	\N	\N	f
34	389	54	1	10.00	5	\N	\N	\N	t	2025-07-10 02:30:25.987103	2025-08-03 18:05:43.106595	\N	t	2025-08-03 18:07:55.969246	\N	f	\N	\N	\N	f
60	420	23	1	95.00	5	134	\N	\N	t	2025-07-17 01:36:10.286206	2025-08-03 18:05:48.936382	\N	t	2025-08-03 18:07:59.501243	\N	f	\N	\N	\N	f
53	389	5	1	30.00	5	54	\N	\N	t	2025-07-17 01:14:23.54933	2025-08-03 18:05:43.325183	\N	t	2025-08-03 18:07:55.989649	2	f	48	\N	\N	f
75	420	47	1	50.00	5	49	\N	\N	t	2025-07-17 01:46:01.355712	2025-08-03 18:06:14.491955	\N	t	2025-08-03 18:07:59.999807	\N	f	\N	\N	\N	f
61	420	26	1	55.00	5	43	\N	\N	t	2025-07-17 01:36:10.286206	2025-08-03 18:05:58.886029	\N	t	2025-08-03 18:07:59.50527	\N	f	\N	\N	\N	f
55	389	49	1	0.00	5	\N	\N	\N	t	2025-07-17 01:14:23.54933	2025-08-03 18:05:45.363413	\N	t	2025-08-03 18:07:56.063723	1	f	49	\N	\N	f
63	420	34	1	135.00	5	10	\N	19	t	2025-07-17 01:36:10.286206	2025-08-03 18:06:02.554706	\N	t	2025-08-03 18:07:59.546557	\N	f	\N	\N	\N	f
54	389	22	1	0.00	5	37	\N	\N	t	2025-07-17 01:14:23.54933	2025-08-03 18:05:58.577505	\N	t	2025-08-03 18:07:56.204868	1	f	49	\N	\N	f
5	387	22	1	0.00	5	37	\N	\N	t	2025-07-02 19:49:32.525842	2025-08-03 18:05:35.579737	\N	t	2025-08-03 18:07:46.414169	2	f	1	\N	\N	f
59	420	7	1	110.00	5	96	\N	\N	t	2025-07-17 01:36:10.286206	2025-08-03 18:05:19.566105	114	t	2025-08-03 18:07:59.455547	\N	f	\N	\N	\N	f
57	389	32	1	0.00	5	\N	\N	15	t	2025-07-17 01:14:23.54933	2025-08-03 18:05:15.861178	\N	t	2025-08-03 18:07:55.75886	3	f	50	\N	\N	f
64	420	33	1	70.00	5	\N	\N	12	t	2025-07-17 01:36:10.286206	2025-08-03 18:05:22.696218	\N	t	2025-08-03 18:07:59.456111	\N	f	\N	\N	\N	f
66	420	31	1	50.00	5	\N	\N	12	t	2025-07-17 01:38:12.497831	2025-08-03 18:06:03.93518	\N	t	2025-08-03 18:07:59.549701	\N	f	\N	\N	\N	f
70	420	32	1	60.00	5	6	\N	12	t	2025-07-17 01:40:41.53372	2025-08-03 18:06:05.392804	\N	t	2025-08-03 18:07:59.660655	\N	f	\N	\N	\N	f
65	420	45	1	40.00	5	140	\N	\N	t	2025-07-17 01:36:51.041518	2025-08-03 18:06:03.627474	\N	t	2025-08-03 18:07:59.733178	\N	f	\N	\N	\N	f
69	420	33	1	115.00	5	8	\N	17	t	2025-07-17 01:39:40.374164	2025-08-03 18:06:10.724076	\N	t	2025-08-03 18:07:59.851478	\N	f	\N	\N	\N	f
77	420	31	1	0.00	5	\N	\N	12	t	2025-07-17 01:46:01.355712	2025-08-03 18:06:09.552752	\N	t	2025-08-03 18:07:59.854205	4	f	73	\N	\N	f
68	420	27	1	105.00	5	\N	\N	\N	t	2025-07-17 01:38:54.372978	2025-08-03 18:06:11.414567	45	t	2025-08-03 18:07:59.858927	\N	f	\N	\N	\N	f
67	420	27	1	145.00	5	\N	\N	\N	t	2025-07-17 01:38:54.372978	2025-08-03 18:06:12.235327	46	t	2025-08-03 18:07:59.871471	\N	f	\N	\N	\N	f
11	387	55	1	61.00	5	\N	\N	\N	t	2025-07-02 19:49:32.525842	2025-08-03 17:57:24.450997	\N	t	2025-08-03 18:07:45.529874	\N	f	\N	\N	\N	f
164	427	\N	1	155.00	5	\N	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
165	427	\N	1	140.00	5	\N	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	f	\N	2	t	\N	El Apando	Sentencia media para delitos moderados	f
166	427	\N	1	140.00	5	\N	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	f	\N	6	t	\N	Sangrias 3x2	Jueves 3 sangrías al precio de 2	f
167	427	\N	1	125.00	5	\N	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	f	\N	4	t	\N	Pena Capital	Sentencia máxima para los delitos más graves	f
168	427	\N	1	85.00	5	\N	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	f	\N	1	t	\N	Infracción	Sentencia leve para infracciones menores	f
87	421	58	1	45.00	2	\N	\N	\N	f	2025-07-19 20:43:47.865179	\N	\N	f	\N	\N	f	\N	\N	\N	f
88	421	58	-1	-45.00	2	\N	CANCELACIÓN	\N	f	2025-07-19 20:44:07.635353	\N	\N	f	\N	\N	f	\N	\N	\N	f
90	422	7	-1	-115.00	2	100	CANCELACIÓN	\N	f	2025-07-19 20:59:28.801863	\N	69	f	\N	\N	f	\N	\N	\N	f
91	422	7	-1	-115.00	2	100	CANCELACIÓN	\N	f	2025-07-19 21:08:38.164364	\N	69	f	\N	\N	f	\N	\N	\N	f
92	423	\N	1	155.00	2	\N	\N	\N	f	2025-07-22 21:26:17.582407	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
169	427	22	1	0.00	5	37	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	f	\N	3	f	164	\N	\N	f
96	423	\N	1	155.00	2	\N	\N	\N	f	2025-07-22 21:28:00.414374	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
172	427	22	1	0.00	5	37	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	f	\N	2	f	165	\N	\N	f
100	423	\N	2	155.00	2	\N	\N	\N	f	2025-07-22 21:29:11.111151	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
176	427	22	1	0.00	5	37	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	f	\N	4	f	167	\N	\N	f
178	427	9	1	0.00	5	\N	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	f	\N	4	f	167	\N	\N	f
179	427	22	1	0.00	5	37	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	f	\N	1	f	168	\N	\N	f
106	423	\N	1	140.00	2	\N	\N	\N	f	2025-07-22 21:29:51.071398	\N	\N	f	\N	2	t	\N	El Apando	Sentencia media para delitos moderados	f
173	427	5	1	30.00	5	50	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	t	2025-08-03 18:16:47.154571	2	f	165	\N	\N	f
170	427	5	1	30.00	5	50	\N	\N	f	2025-08-03 18:14:08.865242	\N	\N	t	2025-08-03 18:16:46.928637	3	f	164	\N	\N	f
110	423	\N	1	140.00	2	\N	\N	\N	f	2025-07-22 21:30:42.424096	\N	\N	f	\N	2	t	\N	El Apando	Sentencia media para delitos moderados	f
177	427	31	1	0.00	5	\N	\N	12	t	2025-08-03 18:14:08.865242	2025-08-03 18:22:30.982516	\N	f	\N	4	f	167	\N	\N	f
180	427	31	1	0.00	5	\N	\N	12	t	2025-08-03 18:14:08.865242	2025-08-03 18:22:33.289711	\N	f	\N	1	f	168	\N	\N	f
174	427	34	1	0.00	5	10	\N	\N	t	2025-08-03 18:14:08.865242	2025-08-03 18:22:24.005823	\N	f	\N	2	f	165	\N	\N	f
114	423	5	-1	-30.00	2	51	CANCELACIÓN	\N	f	2025-07-22 21:41:16.255252	\N	\N	f	\N	\N	f	\N	\N	\N	f
115	424	\N	2	155.00	5	\N	\N	\N	f	2025-07-23 16:21:07.84197	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
200	427	31	1	0.00	5	\N	\N	12	t	2025-08-03 18:16:36.558	2025-08-03 18:22:48.170364	\N	f	\N	1	f	193	\N	\N	f
197	427	21	1	0.00	5	\N	\N	\N	t	2025-08-03 18:14:08.865	2025-08-03 18:22:27.487505	\N	f	\N	6	f	166	\N	\N	f
171	427	32	1	0.00	5	7	\N	\N	t	2025-08-03 18:14:08.865242	2025-08-03 18:22:35.249726	\N	f	\N	3	f	164	\N	\N	f
119	425	\N	2	155.00	5	\N	\N	\N	f	2025-07-23 16:30:28.334713	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
198	427	21	1	0.00	5	\N	\N	\N	t	2025-08-03 18:14:08.865	2025-08-03 18:22:37.6329	\N	f	\N	6	f	166	\N	\N	f
175	427	21	1	0.00	5	\N	\N	\N	t	2025-08-03 18:14:08.865242	2025-08-03 18:22:39.781412	\N	f	\N	6	f	166	\N	\N	f
123	425	\N	1	155.00	5	\N	\N	\N	f	2025-07-23 16:47:01.86183	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
199	428	21	1	0.00	5	\N	\N	\N	t	2025-08-03 18:15:36.47	2025-08-03 18:22:42.811827	\N	f	\N	6	f	185	\N	\N	f
127	425	\N	1	155.00	5	\N	\N	\N	f	2025-07-23 16:47:30.160877	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
132	426	\N	1	155.00	2	\N	\N	\N	f	2025-07-25 21:48:57.215966	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
212	429	32	1	60.00	5	6	\N	12	t	2025-08-03 18:27:02.535515	2025-08-03 18:28:20.906096	\N	f	\N	\N	f	\N	\N	\N	t
214	429	32	1	430.00	5	7	\N	16	t	2025-08-03 18:27:02.535515	2025-08-03 18:36:18.66323	\N	f	\N	\N	f	\N	\N	\N	f
213	429	35	1	90.00	5	\N	\N	\N	t	2025-08-03 18:27:02.535515	2025-08-03 18:36:19.814472	\N	f	\N	\N	f	\N	\N	\N	f
30	388	5	1	30.00	5	51	\N	\N	t	2025-07-10 02:24:51.849714	2025-07-10 03:15:16.833253	\N	t	2025-08-03 17:54:45.505423	3	f	21	\N	\N	f
211	429	34	1	135.00	5	11	\N	19	f	2025-08-03 18:27:02.535515	\N	\N	f	\N	\N	f	\N	\N	\N	f
143	387	22	1	0.00	5	37	\N	\N	t	2025-07-02 19:49:32.525	2025-08-03 18:04:54.18297	\N	t	2025-08-03 18:07:45.940255	3	f	3	\N	\N	f
7	387	34	1	0.00	5	\N	\N	12	t	2025-07-02 19:49:32.525842	2025-08-03 17:55:57.622612	\N	t	2025-08-03 17:56:13.181753	2	f	1	\N	\N	f
125	425	9	1	0.00	5	\N	\N	\N	f	2025-07-23 16:47:01.86183	\N	\N	f	\N	3	f	123	\N	\N	f
16	387	22	1	0.00	5	\N	\N	\N	t	2025-07-02 19:49:32.525842	2025-08-03 18:05:03.340158	\N	t	2025-08-03 18:07:46.292665	1	f	4	\N	\N	f
141	389	47	1	65.00	5	83	\N	\N	t	2025-07-10 02:30:25.987	2025-08-03 17:57:35.556691	\N	t	2025-08-03 18:07:55.451141	\N	f	\N	\N	\N	f
80	420	15	1	150.00	5	145	\N	\N	t	2025-07-17 01:46:01.355712	2025-08-03 18:06:14.802316	\N	t	2025-08-03 18:08:00.030509	\N	f	\N	\N	\N	f
79	420	10	1	0.00	5	\N	\N	\N	t	2025-07-17 01:46:01.355712	2025-08-03 18:06:14.994267	\N	t	2025-08-03 18:08:00.042421	4	f	73	\N	\N	f
86	420	6	1	90.00	5	52	\N	\N	t	2025-07-19 00:48:59.020276	2025-08-03 18:06:16.591316	\N	t	2025-08-03 18:08:00.427234	\N	f	\N	\N	\N	f
131	425	34	1	135.00	2	11	\N	19	t	2025-07-25 21:47:30.513007	2025-08-03 18:07:11.298084	\N	t	2025-08-03 18:08:01.576513	\N	f	\N	\N	\N	f
89	422	7	1	115.00	2	100	\N	\N	f	2025-07-19 20:58:54.830533	\N	69	f	\N	\N	f	\N	\N	\N	f
138	387	5	1	0.00	5	\N	\N	\N	t	2025-07-02 19:49:32.525	2025-08-03 17:57:22.008245	\N	t	2025-08-03 18:07:45.521724	3	f	3	\N	\N	f
6	387	5	1	0.00	5	\N	\N	\N	t	2025-07-02 19:49:32.525842	2025-08-03 18:05:02.540728	\N	t	2025-08-03 18:07:45.960168	2	f	1	\N	\N	f
139	387	10	1	0.00	5	\N	\N	\N	t	2025-07-02 19:49:32.525	2025-08-03 17:57:25.275511	\N	t	2025-08-03 18:07:46.326063	3	f	3	\N	\N	f
140	387	22	1	0.00	5	\N	\N	\N	t	2025-07-02 19:49:32.525	2025-08-03 17:57:27.580232	\N	t	2025-08-03 18:07:46.341486	1	f	4	\N	\N	f
146	388	49	1	0.00	5	\N	\N	\N	t	2025-07-10 02:24:51.849	2025-08-03 18:05:03.744716	\N	t	2025-08-03 18:07:52.009233	3	f	21	\N	\N	f
29	388	49	1	0.00	5	\N	\N	\N	t	2025-07-10 02:24:51.849714	2025-08-03 18:05:35.364481	\N	t	2025-08-03 18:07:52.052428	3	f	21	\N	\N	f
144	389	54	1	10.00	5	\N	\N	\N	t	2025-07-10 02:30:25.987	2025-08-03 18:05:03.324084	\N	t	2025-08-03 18:07:55.531317	\N	f	\N	\N	\N	f
145	389	54	1	10.00	5	\N	\N	\N	t	2025-07-10 02:30:25.987	2025-08-03 18:05:03.56341	\N	t	2025-08-03 18:07:55.57464	\N	f	\N	\N	\N	f
147	389	54	1	10.00	5	\N	\N	\N	t	2025-07-10 02:30:25.987	2025-08-03 18:05:39.484682	\N	t	2025-08-03 18:07:55.810823	\N	f	\N	\N	\N	f
142	389	54	1	10.00	5	\N	\N	\N	t	2025-07-10 02:30:25.987	2025-08-03 17:57:36.082627	\N	t	2025-08-03 18:07:56.222736	\N	f	\N	\N	\N	f
81	420	22	1	0.00	5	37	\N	\N	t	2025-07-17 01:46:01.355712	2025-08-03 18:06:14.134184	\N	t	2025-08-03 18:07:59.996631	3	f	74	\N	\N	f
129	425	5	1	30.00	5	60	\N	\N	t	2025-07-23 16:47:30.160877	2025-08-03 18:07:12.435637	\N	t	2025-08-03 18:08:01.707341	3	f	127	\N	\N	f
130	425	32	1	0.00	5	6	\N	\N	t	2025-07-23 16:47:30.160877	2025-08-03 18:07:15.633401	\N	t	2025-08-03 18:08:01.708217	3	f	127	\N	\N	f
58	389	5	1	30.00	5	61	\N	\N	t	2025-07-17 01:14:23.54933	2025-08-03 18:05:43.10704	\N	t	2025-08-03 18:07:56.013782	3	f	50	\N	\N	f
56	389	22	1	0.00	5	37	\N	\N	t	2025-07-17 01:14:23.54933	2025-08-03 18:05:44.213269	\N	t	2025-08-03 18:07:56.025245	3	f	50	\N	\N	f
182	428	6	1	105.00	5	50	\N	\N	f	2025-08-03 18:15:20.596022	\N	70	t	2025-08-03 18:16:51.014225	\N	f	\N	\N	\N	f
183	428	8	1	60.00	5	78	\N	\N	f	2025-08-03 18:15:20.596022	\N	\N	t	2025-08-03 18:16:50.923238	\N	f	\N	\N	\N	f
184	428	7	1	110.00	5	104	\N	\N	t	2025-08-03 18:15:20.596022	2025-08-03 18:22:16.049007	114	f	\N	\N	f	\N	\N	\N	f
201	428	5	-1	-90.00	5	4	CANCELACIÓN	\N	f	2025-08-03 18:23:05.018791	\N	\N	f	\N	\N	f	\N	\N	\N	f
181	428	5	1	90.00	5	4	\N	\N	f	2025-08-03 18:15:20.596022	\N	\N	t	2025-08-03 18:30:18.656214	\N	f	\N	\N	\N	t
215	430	8	1	60.00	5	78	\N	\N	f	2025-08-03 18:35:51.958172	\N	\N	f	\N	\N	f	\N	\N	\N	f
216	430	8	1	75.00	5	78	\N	\N	f	2025-08-03 18:35:51.958172	\N	69	f	\N	\N	f	\N	\N	\N	f
217	430	7	1	100.00	5	99	\N	\N	f	2025-08-03 18:35:51.958172	\N	\N	f	\N	\N	f	\N	\N	\N	f
218	430	7	1	110.00	5	100	\N	\N	f	2025-08-03 18:35:51.958172	\N	114	f	\N	\N	f	\N	\N	\N	f
219	430	6	1	60.00	5	49	\N	\N	f	2025-08-03 18:35:51.958172	\N	\N	f	\N	\N	f	\N	\N	\N	f
220	430	6	1	90.00	5	1	\N	\N	f	2025-08-03 18:35:51.958172	\N	\N	f	\N	\N	f	\N	\N	\N	f
221	430	5	1	90.00	5	51	\N	\N	f	2025-08-03 18:35:51.958172	\N	\N	f	\N	\N	f	\N	\N	\N	f
222	430	5	1	90.00	5	60	\N	\N	f	2025-08-03 18:35:51.958172	\N	\N	f	\N	\N	f	\N	\N	\N	f
223	430	5	1	105.00	5	50	\N	\N	f	2025-08-03 18:35:51.958172	\N	24	f	\N	\N	f	\N	\N	\N	f
62	420	40	1	175.00	5	139	\N	\N	t	2025-07-17 01:36:10.286206	2025-08-03 18:36:09.881402	\N	f	\N	\N	f	\N	\N	\N	f
224	429	34	1	135.00	5	11	\N	19	t	2025-08-03 18:27:02.535	2025-08-03 18:36:55.466561	\N	f	\N	\N	f	\N	\N	\N	f
242	431	40	-1	-235.00	5	138	CANCELACIÓN	\N	f	2025-08-04 00:50:02.709839	\N	\N	f	\N	\N	f	\N	\N	\N	f
243	431	34	-2	-135.00	5	10	CANCELACIÓN	19	f	2025-08-04 00:50:09.197014	\N	\N	f	\N	\N	f	\N	\N	\N	f
244	431	32	-1	-430.00	5	7	CANCELACIÓN	16	f	2025-08-04 00:50:15.495343	\N	\N	f	\N	\N	f	\N	\N	\N	f
245	431	31	-1	-50.00	5	\N	CANCELACIÓN	12	f	2025-08-04 00:50:20.302744	\N	\N	f	\N	\N	f	\N	\N	\N	f
240	431	32	1	430.00	5	7	\N	16	f	2025-08-04 00:49:29.014452	\N	\N	f	\N	\N	f	\N	\N	\N	f
253	431	32	1	430.00	5	7	\N	16	f	2025-08-04 00:49:29.014	\N	\N	f	\N	\N	f	\N	\N	\N	f
185	428	\N	2	140.00	5	\N	\N	\N	f	2025-08-03 18:15:36.470885	\N	\N	f	\N	6	t	\N	Sangrias 3x2	Jueves 3 sangrías al precio de 2	f
254	431	40	1	235.00	5	138	\N	\N	t	2025-08-04 00:49:29.014	2025-08-04 01:24:24.562801	\N	f	\N	\N	f	\N	\N	\N	f
202	428	6	-1	-105.00	5	50	CANCELACIÓN	\N	f	2025-08-03 18:23:08.374465	\N	70	f	\N	\N	f	\N	\N	\N	f
255	431	34	1	135.00	5	10	\N	19	t	2025-08-04 00:49:29.014	2025-08-04 01:24:27.475962	\N	f	\N	\N	f	\N	\N	\N	f
99	423	5	1	30.00	2	60	\N	\N	t	2025-07-22 21:28:00.414374	2025-08-03 18:06:21.892016	\N	t	2025-08-03 18:08:06.761351	3	f	96	\N	\N	f
238	431	40	1	235.00	5	138	\N	\N	t	2025-08-04 00:49:29.014452	2025-08-04 01:24:30.231647	\N	f	\N	\N	f	\N	\N	\N	f
103	423	5	1	30.00	2	50	\N	\N	t	2025-07-22 21:29:11.111151	2025-08-03 18:06:22.679929	\N	t	2025-08-03 18:08:06.847683	3	f	100	\N	\N	f
239	431	34	2	135.00	5	10	\N	19	f	2025-08-04 00:49:29.014452	\N	\N	f	\N	\N	f	\N	\N	\N	f
17	387	31	1	0.00	5	\N	\N	12	t	2025-07-02 19:49:32.525842	2025-08-03 18:05:35.898137	\N	t	2025-08-03 18:07:46.473074	1	f	4	\N	\N	f
28	388	22	1	0.00	5	37	\N	\N	t	2025-07-10 02:24:51.849714	2025-08-03 17:57:30.827572	\N	t	2025-08-03 18:07:51.92804	3	f	21	\N	\N	f
25	388	5	1	30.00	5	61	\N	\N	t	2025-07-10 02:24:51.849714	2025-08-03 17:57:30.945415	\N	t	2025-08-03 18:07:51.928404	2	f	19	\N	\N	f
51	389	22	1	0.00	5	37	\N	\N	t	2025-07-17 01:14:23.54933	2025-08-03 18:06:02.188762	\N	t	2025-08-03 18:07:56.205454	2	f	48	\N	\N	f
71	420	11	1	120.00	5	135	\N	\N	t	2025-07-17 01:42:45.251047	2025-08-03 18:06:05.894921	\N	t	2025-08-03 18:07:59.661196	\N	f	\N	\N	\N	f
148	420	21	1	0.00	5	\N	\N	\N	t	2025-07-17 01:46:01.355	2025-08-03 18:06:07.393846	\N	t	2025-08-03 18:07:59.850387	6	f	72	\N	\N	f
78	420	22	1	0.00	5	37	\N	\N	t	2025-07-17 01:46:01.355712	2025-08-03 18:06:09.454939	\N	t	2025-08-03 18:07:59.85099	4	f	73	\N	\N	f
85	420	5	1	60.00	5	49	\N	\N	t	2025-07-19 00:48:59.020276	2025-08-03 18:06:16.842239	\N	t	2025-08-03 18:08:00.427857	\N	f	\N	\N	\N	f
84	420	7	1	100.00	5	96	\N	\N	t	2025-07-19 00:48:59.020276	2025-08-03 18:06:52.628584	\N	t	2025-08-03 18:08:00.584526	\N	f	\N	\N	\N	f
83	420	5	1	30.00	5	4	\N	\N	t	2025-07-17 01:46:01.355712	2025-08-03 18:06:54.622248	\N	t	2025-08-03 18:08:00.584879	3	f	74	\N	\N	f
159	420	9	1	0.00	5	\N	\N	\N	t	2025-07-17 01:46:01.355	2025-08-03 18:06:56.278601	\N	t	2025-08-03 18:08:00.585532	3	f	74	\N	\N	f
82	420	9	1	0.00	5	\N	\N	\N	t	2025-07-17 01:46:01.355712	2025-08-03 18:06:58.762873	\N	t	2025-08-03 18:08:00.600579	3	f	74	\N	\N	f
160	420	21	1	0.00	5	\N	\N	\N	t	2025-07-17 01:46:01.355	2025-08-03 18:07:01.072752	\N	t	2025-08-03 18:08:00.620726	6	f	72	\N	\N	f
76	420	21	1	0.00	5	\N	\N	\N	t	2025-07-17 01:46:01.355712	2025-08-03 18:07:03.334527	\N	t	2025-08-03 18:08:00.71096	6	f	72	\N	\N	f
156	425	22	1	0.00	5	37	\N	\N	t	2025-07-23 16:30:28.334	2025-08-03 18:06:45.508837	\N	t	2025-08-03 18:08:01.402979	3	f	119	\N	\N	f
157	425	49	1	0.00	5	\N	\N	\N	t	2025-07-23 16:30:28.334	2025-08-03 18:06:46.191916	\N	t	2025-08-03 18:08:01.572712	3	f	119	\N	\N	f
158	425	5	1	30.00	5	60	\N	\N	t	2025-07-23 16:30:28.334	2025-08-03 18:06:48.793651	\N	t	2025-08-03 18:08:01.576069	3	f	119	\N	\N	f
124	425	22	1	0.00	5	37	\N	\N	t	2025-07-23 16:47:01.86183	2025-08-03 18:07:15.146231	\N	t	2025-08-03 18:08:01.708744	3	f	123	\N	\N	f
128	425	22	1	0.00	5	37	\N	\N	t	2025-07-23 16:47:30.160877	2025-08-03 18:07:18.063776	\N	t	2025-08-03 18:08:01.778222	3	f	127	\N	\N	f
162	425	49	1	0.00	5	\N	\N	\N	t	2025-07-23 16:30:28.334	2025-08-03 18:07:20.521187	\N	t	2025-08-03 18:08:01.924303	3	f	119	\N	\N	f
126	425	5	1	30.00	5	61	\N	\N	t	2025-07-23 16:47:01.86183	2025-08-03 18:07:18.984315	\N	t	2025-08-03 18:08:01.924791	3	f	123	\N	\N	f
122	425	5	1	30.00	5	60	\N	\N	t	2025-07-23 16:30:28.334713	2025-08-03 18:07:21.141331	\N	t	2025-08-03 18:08:01.925207	3	f	119	\N	\N	f
120	425	22	1	0.00	5	37	\N	\N	t	2025-07-23 16:30:28.334713	2025-08-03 18:07:25.168805	\N	t	2025-08-03 18:08:01.983917	3	f	119	\N	\N	f
163	425	49	1	0.00	5	\N	\N	\N	t	2025-07-23 16:30:28.334	2025-08-03 18:07:22.842835	\N	t	2025-08-03 18:08:01.986856	3	f	119	\N	\N	f
121	425	49	1	0.00	5	\N	\N	\N	t	2025-07-23 16:30:28.334713	2025-08-03 18:07:25.481682	\N	t	2025-08-03 18:08:02.003004	3	f	119	\N	\N	f
161	425	9	1	0.00	5	\N	\N	\N	t	2025-07-23 16:47:01.861	2025-08-03 18:07:16.926318	\N	t	2025-08-03 18:08:02.060563	3	f	123	\N	\N	f
136	426	33	1	115.00	2	8	\N	17	t	2025-07-25 21:48:57.215966	2025-08-03 18:07:08.045143	\N	t	2025-08-03 18:08:03.726999	\N	f	\N	\N	\N	f
137	426	9	1	0.00	2	\N	\N	\N	t	2025-07-25 21:48:57.215	2025-08-03 18:07:09.873285	\N	t	2025-08-03 18:08:03.727451	3	f	132	\N	\N	f
133	426	22	1	0.00	2	37	\N	\N	t	2025-07-25 21:48:57.215966	2025-08-03 18:07:09.410611	\N	t	2025-08-03 18:08:03.73029	3	f	132	\N	\N	f
135	426	5	1	45.00	2	4	\N	\N	t	2025-07-25 21:48:57.215966	2025-08-03 18:07:16.463576	21	t	2025-08-03 18:08:03.738806	3	f	132	\N	\N	f
134	426	9	1	0.00	2	\N	\N	\N	t	2025-07-25 21:48:57.215966	2025-08-03 18:07:13.782092	\N	t	2025-08-03 18:08:03.874894	3	f	132	\N	\N	f
95	423	32	1	0.00	2	6	\N	\N	t	2025-07-22 21:26:17.582407	2025-08-03 18:06:20.953714	\N	t	2025-08-03 18:08:06.723918	3	f	92	\N	\N	f
93	423	22	1	0.00	2	37	\N	\N	t	2025-07-22 21:26:17.582407	2025-08-03 18:06:18.502352	\N	t	2025-08-03 18:08:06.754364	3	f	92	\N	\N	f
97	423	22	1	0.00	2	37	\N	\N	t	2025-07-22 21:28:00.414374	2025-08-03 18:06:23.443678	\N	t	2025-08-03 18:08:06.851871	3	f	96	\N	\N	f
94	423	5	1	30.00	2	51	\N	\N	t	2025-07-22 21:26:17.582407	2025-08-03 18:06:20.293847	\N	t	2025-08-03 18:08:06.853716	3	f	92	\N	\N	f
150	423	49	1	0.00	2	\N	\N	\N	t	2025-07-22 21:28:00.414	2025-08-03 18:06:23.833532	\N	t	2025-08-03 18:08:06.861542	3	f	96	\N	\N	f
105	423	5	1	30.00	2	61	\N	\N	t	2025-07-22 21:29:11.111151	2025-08-03 18:06:24.372482	\N	t	2025-08-03 18:08:06.883554	3	f	100	\N	\N	f
151	423	10	1	0.00	2	\N	\N	\N	t	2025-07-22 21:29:11.111	2025-08-03 18:06:25.156024	\N	t	2025-08-03 18:08:06.98542	3	f	100	\N	\N	f
152	423	49	1	0.00	2	\N	\N	\N	t	2025-07-22 21:29:11.111	2025-08-03 18:06:26.590356	\N	t	2025-08-03 18:08:07.004748	3	f	100	\N	\N	f
98	423	49	1	0.00	2	\N	\N	\N	t	2025-07-22 21:28:00.414374	2025-08-03 18:06:25.367431	\N	t	2025-08-03 18:08:07.005224	3	f	96	\N	\N	f
153	423	22	1	0.00	2	37	\N	\N	t	2025-07-22 21:29:11.111	2025-08-03 18:06:27.047563	\N	t	2025-08-03 18:08:07.015482	3	f	100	\N	\N	f
104	423	10	1	0.00	2	\N	\N	\N	t	2025-07-22 21:29:11.111151	2025-08-03 18:06:28.148164	\N	t	2025-08-03 18:08:07.105864	3	f	100	\N	\N	f
108	423	34	1	0.00	2	11	\N	\N	t	2025-07-22 21:29:51.071398	2025-08-03 18:06:32.71637	\N	t	2025-08-03 18:08:07.139916	2	f	106	\N	\N	f
102	423	49	1	0.00	2	\N	\N	\N	t	2025-07-22 21:29:11.111151	2025-08-03 18:06:32.854128	\N	t	2025-08-03 18:08:07.14853	3	f	100	\N	\N	f
112	423	34	1	0.00	2	11	\N	\N	t	2025-07-22 21:30:42.424096	2025-08-03 18:06:50.935418	\N	t	2025-08-03 18:08:07.246728	2	f	110	\N	\N	f
186	428	21	1	0.00	5	\N	\N	\N	t	2025-08-03 18:15:36.470885	2025-08-03 18:36:12.831324	\N	f	\N	6	f	185	\N	\N	f
225	430	8	-1	-75.00	5	78	CANCELACIÓN	\N	f	2025-08-03 18:38:24.599367	\N	69	f	\N	\N	f	\N	\N	\N	f
226	430	6	-1	-90.00	5	1	CANCELACIÓN	\N	f	2025-08-03 18:38:33.888999	\N	\N	f	\N	\N	f	\N	\N	\N	f
227	430	5	-1	-105.00	5	50	CANCELACIÓN	\N	f	2025-08-03 18:38:40.641499	\N	24	f	\N	\N	f	\N	\N	\N	f
228	430	7	3	100.00	5	96	\N	\N	f	2025-08-03 18:38:56.613082	\N	\N	f	\N	\N	f	\N	\N	\N	f
248	432	8	1	60.00	5	78	\N	\N	f	2025-08-04 01:07:31.488002	\N	\N	f	\N	\N	f	\N	\N	\N	t
249	432	6	1	60.00	5	49	\N	\N	f	2025-08-04 01:07:31.488002	\N	\N	f	\N	\N	f	\N	\N	\N	t
247	432	32	1	100.00	5	7	\N	15	t	2025-08-04 01:07:31.488002	2025-08-04 01:09:06.926649	\N	f	\N	\N	f	\N	\N	\N	t
256	431	34	1	135.00	5	10	\N	19	t	2025-08-04 00:49:29.014	2025-08-04 01:24:32.850809	\N	f	\N	\N	f	\N	\N	\N	f
241	431	31	2	50.00	5	\N	\N	12	f	2025-08-04 00:49:29.014452	\N	\N	f	\N	\N	f	\N	\N	\N	f
257	431	31	1	50.00	5	\N	\N	12	t	2025-08-04 00:49:29.014	2025-08-04 01:24:34.978813	\N	f	\N	\N	f	\N	\N	\N	f
246	432	34	1	135.00	5	11	\N	19	f	2025-08-04 01:07:31.488002	\N	\N	t	2025-08-04 01:34:53.170775	\N	f	\N	\N	\N	t
109	423	5	1	30.00	2	61	\N	\N	t	2025-07-22 21:29:51.071398	2025-08-03 18:06:37.000447	\N	t	2025-08-03 18:08:07.152483	2	f	106	\N	\N	f
101	423	22	1	0.00	2	37	\N	\N	t	2025-07-22 21:29:11.111151	2025-08-03 18:06:34.27901	\N	t	2025-08-03 18:08:07.155407	3	f	100	\N	\N	f
111	423	22	1	0.00	2	37	\N	\N	t	2025-07-22 21:30:42.424096	2025-08-03 18:06:39.429255	\N	t	2025-08-03 18:08:07.20984	2	f	110	\N	\N	f
107	423	22	1	0.00	2	37	\N	\N	t	2025-07-22 21:29:51.071398	2025-08-03 18:07:02.450977	\N	t	2025-08-03 18:08:07.281545	2	f	106	\N	\N	f
113	423	5	1	30.00	2	61	\N	\N	t	2025-07-22 21:30:42.424096	2025-08-03 18:06:39.579666	\N	t	2025-08-03 18:08:07.368584	2	f	110	\N	\N	f
118	424	5	1	30.00	5	60	\N	\N	t	2025-07-23 16:21:07.84197	2025-08-03 18:06:42.267511	\N	t	2025-08-03 18:08:08.057657	3	f	115	\N	\N	f
117	424	9	1	0.00	5	\N	\N	\N	t	2025-07-23 16:21:07.84197	2025-08-03 18:06:42.853212	\N	t	2025-08-03 18:08:08.0642	3	f	115	\N	\N	f
155	424	9	1	0.00	5	\N	\N	\N	t	2025-07-23 16:21:07.841	2025-08-03 18:06:40.107802	\N	t	2025-08-03 18:08:08.067588	3	f	115	\N	\N	f
154	422	7	1	115.00	2	100	\N	\N	t	2025-07-19 20:58:54.83	2025-08-03 18:06:35.837083	69	t	2025-08-03 18:08:11.015424	\N	f	\N	\N	\N	f
188	427	\N	1	155.00	5	\N	\N	\N	f	2025-08-03 18:16:13.160192	\N	\N	f	\N	3	t	\N	Noche en los Separos	Sentencia grave para delitos mayores	f
189	427	22	1	0.00	5	37	\N	\N	f	2025-08-03 18:16:13.160192	\N	\N	f	\N	3	f	188	\N	\N	f
187	428	7	1	100.00	5	99	\N	\N	f	2025-08-03 18:15:57.222097	\N	\N	f	\N	\N	f	\N	\N	\N	f
190	427	5	1	30.00	5	61	\N	\N	f	2025-08-03 18:16:13.160192	\N	\N	t	2025-08-03 18:19:27.623866	3	f	188	\N	\N	f
191	427	32	1	0.00	5	6	\N	\N	t	2025-08-03 18:16:13.160192	2025-08-03 18:22:44.85543	\N	f	\N	3	f	188	\N	\N	f
203	428	21	1	0.00	5	\N	\N	\N	t	2025-08-03 18:15:36.47	2025-08-03 18:23:57.06897	\N	f	\N	6	f	185	\N	\N	f
204	428	21	1	0.00	5	\N	\N	\N	t	2025-08-03 18:15:36.47	2025-08-03 18:23:58.973707	\N	f	\N	6	f	185	\N	\N	f
229	430	7	-1	-100.00	5	96	CANCELACIÓN	\N	f	2025-08-03 18:39:20.782374	\N	\N	f	\N	\N	f	\N	\N	\N	f
250	432	25	1	130.00	5	\N	\N	\N	f	2025-08-04 01:12:39.300935	\N	\N	f	\N	\N	f	\N	\N	\N	f
259	434	7	1	100.00	5	100	\N	\N	f	2025-08-04 01:34:41.175445	\N	\N	f	\N	\N	f	\N	\N	\N	f
260	434	7	1	115.00	5	100	\N	\N	f	2025-08-04 01:34:41.175445	\N	24	f	\N	\N	f	\N	\N	\N	f
261	434	5	1	90.00	5	4	\N	\N	f	2025-08-04 01:34:41.175445	\N	\N	f	\N	\N	f	\N	\N	\N	f
262	434	5	1	105.00	5	4	\N	\N	f	2025-08-04 01:34:41.175445	\N	24	f	\N	\N	f	\N	\N	\N	f
258	432	34	1	135.00	5	11	\N	19	f	2025-08-04 01:07:31.488	\N	\N	f	\N	\N	f	\N	\N	\N	f
116	424	22	1	0.00	5	37	\N	\N	t	2025-07-23 16:21:07.84197	2025-08-03 18:06:43.679666	\N	t	2025-08-03 18:08:08.067798	3	f	115	\N	\N	f
149	422	7	1	115.00	2	100	\N	\N	t	2025-07-19 20:58:54.83	2025-08-03 18:06:19.327093	69	t	2025-08-03 18:08:11.011465	\N	f	\N	\N	\N	f
193	427	\N	2	85.00	5	\N	\N	\N	f	2025-08-03 18:16:36.558251	\N	\N	f	\N	1	t	\N	Infracción	Sentencia leve para infracciones menores	f
194	427	22	2	0.00	5	37	\N	\N	f	2025-08-03 18:16:36.558251	\N	\N	f	\N	1	f	193	\N	\N	f
192	428	7	1	100.00	5	99	\N	\N	f	2025-08-03 18:15:57.222	\N	\N	f	\N	\N	f	\N	\N	\N	f
195	427	31	1	0.00	5	\N	\N	12	t	2025-08-03 18:16:36.558251	2025-08-03 18:22:49.899522	\N	f	\N	1	f	193	\N	\N	f
205	428	7	-1	-100.00	5	99	CANCELACIÓN	\N	f	2025-08-03 18:24:13.048157	\N	\N	f	\N	\N	f	\N	\N	\N	f
206	428	21	1	0.00	5	\N	\N	\N	t	2025-08-03 18:15:36.47	2025-08-03 18:24:30.154811	\N	f	\N	6	f	185	\N	\N	f
207	428	21	1	0.00	5	\N	\N	\N	t	2025-08-03 18:15:36.47	2025-08-03 18:24:33.306323	\N	f	\N	6	f	185	\N	\N	f
208	429	40	-1	-235.00	5	138	CANCELACIÓN	\N	f	2025-08-03 18:24:41.853723	\N	\N	f	\N	\N	f	\N	\N	\N	f
209	429	40	1	235.00	5	138	\N	\N	t	2025-08-03 18:21:28.423	2025-08-03 18:36:15.294124	\N	f	\N	\N	f	\N	\N	\N	f
196	429	40	1	235.00	5	138	\N	\N	t	2025-08-03 18:21:28.42384	2025-08-03 18:36:25.296436	\N	f	\N	\N	f	\N	\N	\N	f
230	430	8	-1	-60.00	5	78	CANCELACIÓN	\N	f	2025-08-04 00:34:04.980732	\N	\N	f	\N	\N	f	\N	\N	\N	f
231	430	7	-1	-100.00	5	99	CANCELACIÓN	\N	f	2025-08-04 00:34:09.321121	\N	\N	f	\N	\N	f	\N	\N	\N	f
232	430	7	-1	-110.00	5	100	CANCELACIÓN	\N	f	2025-08-04 00:34:12.302608	\N	114	f	\N	\N	f	\N	\N	\N	f
233	430	6	-1	-60.00	5	49	CANCELACIÓN	\N	f	2025-08-04 00:34:15.803373	\N	\N	f	\N	\N	f	\N	\N	\N	f
234	430	5	-1	-90.00	5	51	CANCELACIÓN	\N	f	2025-08-04 00:34:19.364347	\N	\N	f	\N	\N	f	\N	\N	\N	f
235	430	5	-1	-90.00	5	60	CANCELACIÓN	\N	f	2025-08-04 00:34:22.588596	\N	\N	f	\N	\N	f	\N	\N	\N	f
236	430	7	-1	-100.00	5	96	CANCELACIÓN	\N	f	2025-08-04 00:34:26.617486	\N	\N	f	\N	\N	f	\N	\N	\N	f
237	430	7	-1	-100.00	5	96	CANCELACIÓN	\N	f	2025-08-04 00:34:31.176081	\N	\N	f	\N	\N	f	\N	\N	\N	f
251	433	58	1	45.00	5	\N	\N	\N	f	2025-08-04 01:17:27.058551	\N	\N	f	\N	\N	f	\N	\N	\N	f
252	433	43	1	40.00	5	\N	\N	\N	t	2025-08-04 01:17:27.058551	2025-08-04 01:21:58.365269	\N	f	\N	\N	f	\N	\N	\N	f
\.


--
-- Data for Name: empleados; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.empleados (id, nombre, usuario, password, rol, fecha_ingreso, activo) FROM stdin;
1	Administrador Principal	admin	$2b$10$hvIIKer42IRd0i/dJQt9I.7.TFxqAr2oOLJ/NYrXlwjVaUdQZxORe	admin	2025-04-10	t
2	Testmesero	mesera1	$2b$10$L/oz1c/e0h1xHJhD7pvV6uiNv1E0asq5Q3vZVkOqTseIpWh9gvL9C	mesero	2025-04-10	t
3	Testcocinero	deivid	$2b$10$CNr5qigSlJxxVnIGE65rbeCndxFZ04VtjdbRfMxNJ6xCLHeJKlfRq	cocinero	2025-04-10	t
4	David	Alcaide	$2b$10$z9UpDNTU2Lkl64JsaShZ3uTa6ITVGBsbhIw5bEtH4s7Rf.QkWF0zi	cocinero	2025-04-10	t
5	Jennifer	Lajennis	$2b$10$96R8VmGqO2xx9bbvDZsLGeouECqqUGmJvSwfR4NvmNXIutCbF8R4u	mesero	2025-04-10	t
6	Antonio	Tepachulo	$2b$10$NNC6E.zQkA2gPmGf13dKtO6dH0ABKuE9Dy/yXa9hgfbhKlEu07RNq	cocinero	2025-04-10	t
7	Jennis2	Jennis2	$2b$10$vWeM1x6rqZ2L3cA.aPu/EOO3N/OYQuq/t9yuweXev5JSEFYdFyGdy	gerente	2025-04-10	t
\.


--
-- Data for Name: grados; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.grados (id, nombre, descuento) FROM stdin;
1	Carcelero del mes	5.00
\.


--
-- Data for Name: insumo_proveedor; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.insumo_proveedor (id, insumo_id, proveedor_id, precio_referencia) FROM stdin;
1	13	1	30.00
2	132	1	22.00
3	13	9	50.00
4	132	9	45.00
5	203	9	90.00
6	47	2	41.00
7	161	2	24.00
8	162	2	24.00
9	2	2	61.00
10	3	2	4.00
11	1	2	4.00
12	203	16	90.00
\.


--
-- Data for Name: insumos; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.insumos (id, nombre, descripcion, categoria, unidad_medida_default, fecha_alta, activo, marca, cantidad_por_unidad) FROM stdin;
1	1 Lt. Botella	Botella para llevar pulque	Desechables	pieza	2025-05-15	t	Por definir	1.000
2	Vaso liso 1 lt	Vaso de uso y p llevar	Desechables	bolsa	2025-05-16	t	Reyma	1.000
3	1/2 Lt. Botella	Botella para llevar pulque	Desechables	pieza	2025-05-17	t	Por definir	1.000
13	Aguamiel	Por definir	Pulquería	Kg	2025-05-28	t	Por definir	1.000
47	Cacahuate Japonés	Por definir	Botana	Kg	2025-06-21	t	Por definir	1.000
132	Pulque	Por definir	Pulquería	litro	2025-07-18	t	Por definir	1.000
161	Sal	Por definir	Especias y Condimentos	Kg	2025-08-17	t	Por definir	1.000
162	Salsa Barbicue	Por definir	Especias y Condimentos	litro	2025-08-18	t	Por definir	1.000
203	Torito Blanco	Por definir	Bebidas Artesanales	litro	2025-11-09	t	Por definir	1.000
\.


--
-- Data for Name: inventario; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.inventario (id, insumo_id, cantidad_actual, unidad, stock_minimo, stock_maximo, ultima_actualizacion) FROM stdin;
\.


--
-- Data for Name: items_compra; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.items_compra (id, compra_id, insumo_id, requisicion_item_id, precio_unitario, cantidad, unidad) FROM stdin;
\.


--
-- Data for Name: items_requisicion; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.items_requisicion (id, requisicion_id, insumo_id, cantidad, unidad, urgencia, completado) FROM stdin;
\.


--
-- Data for Name: ordenes; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.ordenes (orden_id, preso_id, nombre_cliente, total, fecha, estado, empleado_id, total_bruto, num_personas, codigo_descuento_id) FROM stdin;
4	357	\N	465.00	2025-04-11 00:58:27.492961	cerrada	5	465.00	1	\N
5	\N	Bill	60.00	2025-04-11 00:59:38.687609	cerrada	5	60.00	1	\N
6	\N	Rosana	120.00	2025-04-11 01:01:30.588622	cerrada	5	120.00	1	\N
10	2	\N	155.00	2025-04-11 01:46:28.8891	cerrada	5	155.00	1	\N
8	\N	Maria lentes	200.00	2025-04-11 01:13:28.487856	cerrada	5	200.00	1	\N
38	\N	Joseline amiga hannia lentes	180.00	2025-04-11 03:51:17.121928	cerrada	5	180.00	1	\N
20	\N	Karen Lopez amiga hannia	425.00	2025-04-11 02:41:52.92473	cerrada	5	425.00	1	\N
41	\N	Romina barra fuera	400.00	2025-04-11 04:01:51.702684	cerrada	5	400.00	1	\N
11	\N	Eduardo zamora	360.00	2025-04-11 02:15:38.956607	cerrada	5	360.00	1	\N
33	\N	Javier Sala colombia	255.00	2025-04-11 03:38:30.946826	cerrada	5	255.00	2	\N
23	\N	Johann lentes	270.00	2025-04-11 02:52:04.469676	cerrada	5	270.00	1	\N
25	\N	Andrés amigo Laura 	45.00	2025-04-11 03:01:22.251758	cerrada	5	45.00	1	\N
17	203	\N	170.00	2025-04-11 02:29:21.349455	cerrada	5	170.00	1	\N
47	\N	Freddy	540.00	2025-04-11 05:11:42.528959	cerrada	5	540.00	4	\N
46	\N	Paolo 	60.00	2025-04-11 04:55:15.573674	cerrada	5	60.00	1	\N
42	\N	Pablo hannia lentes 	265.00	2025-04-11 04:13:28.63923	cerrada	5	265.00	1	\N
39	\N	Brenda amiga hannia sillón rosa	170.00	2025-04-11 03:54:11.140902	cerrada	5	170.00	1	\N
35	\N	Sofía triana amiga lau	145.00	2025-04-11 03:44:25.143529	cerrada	5	145.00	1	\N
28	\N	Mariana Ospina sala	755.00	2025-04-11 03:26:50.640171	cerrada	5	755.00	4	\N
44	\N	Sebastian  hannia	135.00	2025-04-11 04:40:24.331398	cerrada	5	135.00	3	\N
40	\N	Valeria Camacho colombia roberto	135.00	2025-04-11 03:59:02.01415	cerrada	5	135.00	1	\N
45	\N	Daniel lentes	135.00	2025-04-11 04:51:46.893769	cerrada	5	135.00	1	\N
34	\N	Carlos amigo Laura lentes	460.00	2025-04-11 03:41:06.145209	cerrada	5	460.00	1	\N
37	\N	Nicolas Luengas colombia	130.00	2025-04-11 03:47:43.79838	cerrada	5	130.00	1	\N
26	\N	Francisco amigo laura	140.00	2025-04-11 03:02:04.147229	cerrada	5	140.00	1	\N
12	\N	Santiago col	170.00	2025-04-11 02:19:18.118953	cerrada	5	170.00	1	\N
21	\N	Felipe moreno amigo lau	140.00	2025-04-11 02:44:16.189163	cerrada	5	140.00	1	\N
27	\N	Jorge bezares	135.00	2025-04-11 03:11:56.450635	cerrada	5	135.00	2	\N
36	\N	Laura Sanabria amiga lau	310.00	2025-04-11 03:45:33.006842	cerrada	5	310.00	1	\N
30	173	\N	180.00	2025-04-11 03:31:03.860823	cerrada	5	180.00	1	\N
29	172	\N	125.00	2025-04-11 03:30:24.267627	cerrada	5	125.00	1	\N
16	\N	Lalo	120.00	2025-04-11 02:25:25.483849	cerrada	5	120.00	1	\N
13	27	\N	165.00	2025-04-11 02:21:45.624276	cerrada	5	165.00	1	\N
24	\N	Linett amiga laura	600.00	2025-04-11 02:54:20.044473	cerrada	5	600.00	1	\N
9	5	\N	135.00	2025-04-11 01:23:16.613879	cerrada	5	135.00	1	\N
43	\N	Monse hannia	115.00	2025-04-11 04:14:35.120609	cerrada	5	115.00	1	\N
31	244	\N	275.00	2025-04-11 03:32:56.311282	cerrada	5	275.00	1	\N
32	178	\N	135.00	2025-04-11 03:33:48.796144	cerrada	5	135.00	1	\N
14	26	\N	30.00	2025-04-11 02:22:31.213244	cerrada	5	30.00	1	\N
15	\N	Ilse amix Ximena 	120.00	2025-04-11 02:24:07.171676	cerrada	5	120.00	1	\N
7	1	\N	0.00	2025-04-11 01:02:39.976069	cerrada	5	0.00	1	\N
18	380	\N	0.00	2025-04-11 02:31:26.250047	cerrada	5	0.00	1	\N
19	\N	Veronica urquina	0.00	2025-04-11 02:38:42.44008	cerrada	5	0.00	1	\N
22	\N	Felipe moreno amigo lau	0.00	2025-04-11 02:46:19.85195	cerrada	5	0.00	1	\N
67	\N	Johan lentes pelon	0.00	2025-04-12 00:11:13.258133	cerrada	5	0.00	2	\N
68	\N	María lentes pelo largo	0.00	2025-04-12 00:16:03.565705	cerrada	5	0.00	1	\N
71	\N	Nath bancas blusa blanca	290.00	2025-04-12 01:03:30.777302	cerrada	5	290.00	1	\N
70	319	\N	345.00	2025-04-12 00:45:19.220422	cerrada	5	345.00	1	\N
69	267	\N	100.00	2025-04-12 00:43:10.982852	cerrada	5	100.00	1	\N
72	49	\N	270.00	2025-04-12 01:54:53.963719	cerrada	5	270.00	2	\N
73	\N	Tessa cuello tortuga	130.00	2025-04-12 02:31:20.289412	cerrada	5	130.00	1	\N
74	\N	Maria jardín 	185.00	2025-04-12 02:33:40.328517	cerrada	5	185.00	2	\N
76	153	\N	435.00	2025-04-12 03:19:13.192839	cerrada	5	435.00	1	\N
75	369	\N	740.00	2025-04-12 02:53:42.759309	cerrada	5	740.00	4	\N
84	267	\N	300.00	2025-04-12 05:00:11.839465	cerrada	5	300.00	4	\N
80	12	\N	480.00	2025-04-12 04:12:45.640785	cerrada	5	480.00	1	\N
83	\N	Alfonso	270.00	2025-04-12 04:46:24.32805	cerrada	5	270.00	1	\N
77	11	\N	1130.00	2025-04-12 03:33:36.208061	cerrada	5	1130.00	2	\N
78	\N	Niklas	1075.00	2025-04-12 03:49:56.77122	cerrada	5	1075.00	4	\N
79	\N	Sillón rojo juliana	370.00	2025-04-12 04:01:50.637942	cerrada	5	370.00	2	\N
82	\N	Andre casa verde	485.00	2025-04-12 04:33:12.571056	cerrada	5	485.00	1	\N
86	\N	Chica roji	0.00	2025-04-12 21:42:25.28463	cerrada	5	0.00	2	\N
95	\N	Brandon suéter rojo	185.00	2025-04-13 01:48:48.121282	cerrada	5	185.00	1	\N
98	\N	Soria	135.00	2025-04-13 02:09:58.38888	cerrada	5	135.00	1	\N
92	\N	Miranda sueter amarillo	185.00	2025-04-13 01:36:48.469837	cerrada	5	185.00	1	\N
89	\N	Fernanda tres chicas	575.00	2025-04-13 01:24:33.778718	cerrada	5	575.00	3	\N
94	\N	Ernesto lira chamarra guinda	180.00	2025-04-13 01:48:11.579349	cerrada	5	180.00	1	\N
91	\N	Cris snowden	240.00	2025-04-13 01:34:49.248914	cerrada	5	240.00	1	\N
90	12	\N	245.00	2025-04-13 01:33:09.416612	cerrada	5	245.00	1	\N
96	\N	Gaby suéter gatitos 	170.00	2025-04-13 01:50:20.472004	cerrada	5	170.00	1	\N
88	2	\N	170.00	2025-04-13 01:08:01.108885	cerrada	5	170.00	1	\N
101	\N	Torito	505.00	2025-04-13 03:53:12.490566	cerrada	5	505.00	2	\N
102	\N	Lala y Dominique 	400.00	2025-04-13 04:32:19.874422	cerrada	5	400.00	1	\N
97	\N	Amigo Cris snowden 	160.00	2025-04-13 02:02:09.087562	cerrada	5	160.00	1	\N
87	\N	Lilo suéter verde pelo corto	280.00	2025-04-13 00:59:39.127091	cerrada	5	280.00	2	\N
99	432	\N	80.00	2025-04-13 03:25:57.163285	cerrada	5	80.00	1	\N
93	\N	Wendy chamarra blanca lentes	130.00	2025-04-13 01:46:36.215024	cerrada	5	130.00	1	\N
103	\N	Cris nir	225.00	2025-04-13 04:48:43.107475	cerrada	5	225.00	2	\N
100	\N	Chico gorra fuente	455.00	2025-04-13 03:41:15.042559	cerrada	5	455.00	2	\N
104	56	\N	135.00	2025-04-13 05:02:45.962035	cerrada	5	135.00	1	\N
108	98	\N	135.00	2025-04-14 01:50:04.451998	cerrada	5	135.00	1	\N
105	\N	Javi	100.00	2025-04-14 01:44:47.321373	cerrada	5	100.00	1	\N
107	5	\N	140.00	2025-04-14 01:48:14.531567	cerrada	5	140.00	1	\N
110	\N	Komori	1055.00	2025-04-14 02:21:07.557592	cerrada	5	1055.00	3	\N
111	\N	Vanessa	45.00	2025-04-14 05:22:05.696166	cerrada	5	45.00	1	\N
133	7	\N	0.00	2025-04-19 23:02:06.3913	cerrada	5	0.00	1	\N
135	2	\N	70.00	2025-04-22 01:14:52.159555	cerrada	5	70.00	1	\N
134	\N	Aaron 	230.00	2025-04-22 00:55:04.905124	cerrada	5	230.00	2	\N
140	219	\N	125.00	2025-04-22 02:52:04.614329	cerrada	5	125.00	1	\N
137	20	\N	310.00	2025-04-22 02:03:39.385219	cerrada	5	310.00	1	\N
138	\N	Bibi	190.00	2025-04-22 02:33:06.332755	cerrada	5	190.00	1	\N
139	303	\N	390.00	2025-04-22 02:43:09.394032	cerrada	5	390.00	2	\N
141	402	\N	225.00	2025-04-22 04:13:00.275021	cerrada	5	225.00	1	\N
142	224	\N	120.00	2025-04-22 04:26:14.737646	cerrada	5	120.00	2	\N
81	91	\N	0.00	2025-04-12 04:28:58.153678	cerrada	5	0.00	3	\N
106	1	\N	0.00	2025-04-14 01:46:05.489888	cerrada	5	0.00	1	\N
109	239	\N	0.00	2025-04-14 01:51:07.457465	cerrada	5	0.00	1	\N
136	153	\N	0.00	2025-04-22 02:03:03.67283	cerrada	5	0.00	1	\N
144	\N	TEST2404	180.00	2025-04-24 18:31:54.073399	cerrada	2	200.00	1	1
143	2	\N	505.80	2025-04-24 17:57:32.275057	cerrada	2	562.00	1	1
85	\N	Falsa 	558.00	2025-04-12 05:09:17.225583	cerrada	5	620.00	1	1
145	\N	Jardin	90.00	2025-04-25 01:03:00.307984	cerrada	5	90.00	2	\N
146	\N	Ana	180.00	2025-04-25 01:15:12.302671	cerrada	5	180.00	2	\N
148	\N	Roma	1120.00	2025-04-25 01:41:35.671361	cerrada	5	1120.00	4	\N
149	\N	Carlos	150.00	2025-04-25 01:50:42.78525	cerrada	5	150.00	1	\N
150	\N	Rosana	280.00	2025-04-25 01:54:01.171032	cerrada	5	280.00	2	\N
151	5	\N	190.00	2025-04-25 01:54:34.293507	cerrada	5	190.00	1	\N
152	\N	Macetas	385.00	2025-04-25 02:14:42.44485	cerrada	5	385.00	3	\N
153	260	\N	505.00	2025-04-25 02:26:53.148864	cerrada	5	505.00	2	\N
166	27	\N	90.00	2025-04-25 04:44:14.130513	cerrada	5	90.00	1	\N
203	\N	Chica suéter verde	1080.00	2025-04-29 01:46:07.075591	cerrada	5	1080.00	1	\N
168	\N	Jardin	285.00	2025-04-25 05:35:58.379279	cerrada	5	285.00	4	\N
165	380	\N	220.00	2025-04-25 04:40:07.607869	cerrada	5	220.00	1	\N
164	\N	Sillón rojo	405.00	2025-04-25 04:38:43.309151	cerrada	5	405.00	3	\N
162	\N	Bibi	385.00	2025-04-25 03:43:22.907394	cerrada	5	385.00	1	\N
161	\N	Ximena	260.00	2025-04-25 03:40:36.051793	cerrada	5	260.00	1	\N
159	\N	Sofia barra concreto 	125.00	2025-04-25 03:13:56.595855	cerrada	5	125.00	2	\N
158	\N	Odette	500.00	2025-04-25 03:06:00.217046	cerrada	5	500.00	2	\N
157	\N	Mar	230.00	2025-04-25 02:53:48.816681	cerrada	5	230.00	1	\N
156	173	\N	360.00	2025-04-25 02:49:30.606751	cerrada	5	400.00	1	1
155	20	\N	340.00	2025-04-25 02:47:45.392404	cerrada	5	340.00	1	\N
154	91	\N	346.50	2025-04-25 02:40:53.227605	cerrada	5	385.00	1	1
147	1	\N	0.00	2025-04-25 01:27:29.668922	cerrada	5	605.00	3	2
163	\N	Mar lentes 	395.00	2025-04-25 04:07:42.525522	cerrada	5	395.00	2	\N
169	369	\N	700.00	2025-04-25 07:28:56.917927	cerrada	5	700.00	6	\N
237	\N	Jardin 2	595.00	2025-05-02 05:37:29.020564	cerrada	5	595.00	5	\N
217	\N	Jardin 2	355.00	2025-05-02 01:13:50.909372	cerrada	5	355.00	2	\N
192	\N	Mesa cuadrada 1	90.00	2025-04-27 03:49:26.113417	cerrada	5	90.00	2	\N
225	\N	Sala gris	630.00	2025-05-02 02:54:02.023382	cerrada	5	630.00	3	\N
178	\N	Familia jenni	1030.00	2025-04-26 03:43:48.247667	cerrada	5	1030.00	1	\N
188	\N	Alexis y noemi	590.00	2025-04-27 03:23:45.68342	cerrada	5	590.00	2	\N
182	8	\N	55.00	2025-04-26 05:19:05.680229	cerrada	5	55.00	1	\N
180	\N	Manel	55.00	2025-04-26 04:38:12.342456	cerrada	5	55.00	1	\N
176	\N	Mesa fuera	545.00	2025-04-26 03:30:36.837299	cerrada	5	545.00	2	\N
184	357	\N	215.00	2025-04-27 00:19:27.585672	cerrada	5	215.00	1	\N
194	\N	Seli	430.00	2025-04-27 04:03:20.18681	cerrada	5	430.00	2	\N
233	\N	Bernardo 	200.00	2025-05-02 05:31:10.848681	cerrada	5	200.00	2	\N
207	\N	Diego y bill	135.00	2025-04-29 02:15:25.21458	cerrada	5	135.00	2	\N
215	\N	Jafet	205.00	2025-05-02 01:10:37.498018	cerrada	5	205.00	1	\N
197	\N	Barra	75.00	2025-04-27 05:20:54.999194	cerrada	5	75.00	2	\N
195	\N	Jardin	280.00	2025-04-27 04:53:05.697524	cerrada	5	280.00	3	\N
190	\N	Barra	210.00	2025-04-27 03:40:38.618893	cerrada	5	210.00	1	\N
186	\N	Jardib	620.00	2025-04-27 02:59:00.253403	cerrada	5	620.00	2	\N
205	\N	Antonio	90.00	2025-04-29 01:53:17.868269	cerrada	5	90.00	1	\N
246	\N	Ram	985.00	2025-05-03 01:44:21.810373	cerrada	2	985.00	2	\N
209	49	\N	185.00	2025-04-29 03:00:25.054644	cerrada	5	185.00	2	\N
227	\N	barra concreto	735.00	2025-05-02 03:10:57.280309	cerrada	5	735.00	2	\N
199	\N	Komori	270.00	2025-04-28 03:19:06.213377	cerrada	5	270.00	1	\N
201	\N	Gerardo	90.00	2025-04-28 03:55:52.637264	cerrada	5	90.00	1	\N
211	\N	Sala	1195.00	2025-05-02 01:07:17.682249	cerrada	5	1195.00	12	\N
213	\N	Fernando	150.00	2025-05-02 01:09:28.626827	cerrada	5	150.00	1	\N
219	27	\N	213.75	2025-05-02 02:26:18.437864	cerrada	5	225.00	3	5
250	\N	Jardin	45.00	2025-05-03 03:16:45.841967	cerrada	5	45.00	1	\N
238	\N	Vini	50.00	2025-05-02 05:37:51.23251	cerrada	5	50.00	1	\N
231	\N	Fer sillón gris	150.00	2025-05-02 05:27:22.12263	cerrada	5	150.00	1	\N
256	251	\N	835.00	2025-05-04 00:42:44.736077	cerrada	5	835.00	1	\N
223	\N	Carlos vlych	365.00	2025-05-02 02:39:21.006732	cerrada	5	365.00	2	\N
235	\N	Emmanuel bellA	295.00	2025-05-02 05:34:20.889268	cerrada	5	295.00	2	\N
240	\N	Elian	160.00	2025-05-02 05:42:08.151203	cerrada	5	160.00	1	\N
221	\N	Sala	1330.00	2025-05-02 02:29:51.475817	cerrada	5	1330.00	4	\N
229	179	\N	555.00	2025-05-02 04:38:04.206738	cerrada	5	555.00	1	\N
248	\N	Chimi 	315.00	2025-05-03 02:43:47.300892	cerrada	5	315.00	1	\N
244	\N	Gisela 	340.00	2025-05-03 01:09:42.327246	cerrada	5	340.00	2	\N
254	\N	Mesa verde	360.00	2025-05-03 05:30:29.656351	cerrada	5	360.00	5	\N
252	\N	Noemi	315.00	2025-05-03 05:09:19.818495	cerrada	5	315.00	3	\N
258	\N	Natalia	210.00	2025-05-04 01:14:46.585404	cerrada	5	210.00	1	\N
261	\N	Andre amigo alan	985.00	2025-05-04 01:20:23.707575	cerrada	5	985.00	2	\N
264	1	\N	0.00	2025-05-04 07:39:44.709637	cerrada	5	315.00	1	2
266	380	\N	220.00	2025-05-04 07:52:10.667515	cerrada	5	220.00	2	\N
268	\N	Tito	50.00	2025-05-04 08:11:05.5059	cerrada	5	50.00	1	\N
270	\N	verde	205.00	2025-05-04 08:18:07.616399	cerrada	5	205.00	2	\N
272	\N	Cesar	560.00	2025-05-04 08:22:16.082199	cerrada	5	560.00	2	\N
274	\N	Chema	455.00	2025-05-04 08:34:01.386441	cerrada	5	455.00	2	\N
276	203	\N	405.00	2025-05-04 08:37:16.042294	cerrada	5	405.00	2	\N
278	63	\N	585.00	2025-05-04 08:41:05.662405	cerrada	5	585.00	1	\N
167	\N	Gerardo 	180.00	2025-04-25 05:04:19.813367	cerrada	5	180.00	1	\N
160	\N	Cam	445.00	2025-04-25 03:18:29.475662	cerrada	5	445.00	3	\N
187	\N	Sala	240.00	2025-04-27 03:14:38.853	cerrada	5	240.00	3	\N
204	\N	Sillón rosa	240.00	2025-04-29 01:51:26.982768	cerrada	5	240.00	2	\N
189	\N	Sala rosa	145.00	2025-04-27 03:27:46.042028	cerrada	5	145.00	2	\N
230	\N	Roma	390.00	2025-05-02 04:59:28.854038	cerrada	5	390.00	2	\N
173	\N	chicas para llevar	235.00	2025-04-26 00:52:53.601613	cerrada	5	235.00	1	\N
193	\N	Angel lentes	200.00	2025-04-27 03:57:29.181324	cerrada	5	200.00	2	\N
259	\N	Adrian rastas	260.00	2025-05-04 01:18:33.233713	cerrada	5	260.00	1	\N
175	\N	Sillón rojo	350.00	2025-04-26 03:16:19.848396	cerrada	5	350.00	3	\N
280	\N	Alonso	595.00	2025-05-05 00:39:39.45634	cerrada	5	595.00	1	\N
196	\N	Mesa cuadrada 	90.00	2025-04-27 05:11:58.273859	cerrada	5	90.00	1	\N
191	\N	Casa verde 	870.00	2025-04-27 03:48:32.959262	cerrada	5	870.00	6	\N
232	\N	Prima roma	150.00	2025-05-02 05:30:24.711285	cerrada	5	150.00	2	\N
289	148	\N	380.00	2025-05-05 03:53:06.921727	cerrada	5	380.00	4	\N
174	\N	Jumpei	245.00	2025-04-26 02:06:27.005598	cerrada	5	245.00	1	\N
172	1	\N	0.00	2025-04-26 00:36:48.352614	cerrada	5	230.00	1	2
179	\N	Mauricio	1185.00	2025-04-26 04:06:40.726131	cerrada	5	1185.00	5	\N
177	\N	Fer quezada	280.00	2025-04-26 03:32:12.167463	cerrada	5	280.00	2	\N
171	220	\N	380.00	2025-04-26 00:29:36.309725	cerrada	5	380.00	2	\N
263	\N	Cristi poesía árbol 	765.00	2025-05-04 01:26:02.389463	cerrada	5	765.00	1	\N
183	\N	Gisela	160.00	2025-04-26 06:08:19.807915	cerrada	5	160.00	2	\N
170	\N	Jardin	1045.00	2025-04-26 00:28:33.396337	cerrada	5	1045.00	5	\N
200	\N	Mesa rosa	225.00	2025-04-28 03:54:34.139874	cerrada	5	225.00	1	\N
181	1	\N	0.00	2025-04-26 04:39:39.709281	cerrada	5	250.00	2	2
198	\N	Jardin	485.00	2025-04-28 03:16:38.825652	cerrada	5	485.00	3	\N
185	\N	Chicos de expo	445.00	2025-04-27 01:22:56.753354	cerrada	5	445.00	5	\N
214	251	\N	160.00	2025-05-02 01:10:02.333559	cerrada	5	160.00	1	\N
257	\N	Miranda	75.00	2025-05-04 00:47:30.672425	cerrada	5	75.00	1	\N
202	6	\N	0.00	2025-04-29 00:39:40.837416	cerrada	5	0.00	3	\N
224	\N	Maco	315.00	2025-05-02 02:40:09.337146	cerrada	5	315.00	1	\N
234	\N	Ximena 	365.00	2025-05-02 05:33:15.032279	cerrada	5	365.00	2	\N
239	\N	Hannia	324.00	2025-05-02 05:39:00.644193	cerrada	5	360.00	4	4
228	\N	Anapaula cumple bella	135.00	2025-05-02 03:24:47.463683	cerrada	5	135.00	1	\N
236	\N	Frida	250.00	2025-05-02 05:36:00.63431	cerrada	5	250.00	2	\N
267	\N	Jardin	320.00	2025-05-04 08:10:23.045997	cerrada	5	320.00	2	\N
216	\N	Bill	320.00	2025-05-02 01:12:10.468709	cerrada	5	320.00	1	\N
206	1	\N	0.00	2025-04-29 01:59:51.725214	cerrada	5	785.00	1	2
241	\N	Otros	210.00	2025-05-02 06:39:39.765702	cerrada	5	210.00	1	\N
210	\N	Barra	135.00	2025-04-29 04:39:01.79634	cerrada	5	135.00	3	\N
208	153	\N	250.00	2025-04-29 02:50:02.736076	cerrada	5	250.00	1	\N
279	63	\N	205.00	2025-05-05 00:11:06.401742	cerrada	5	205.00	2	\N
245	31	\N	1360.00	2025-05-03 01:11:26.411931	cerrada	5	1360.00	4	\N
269	303	\N	1010.00	2025-05-04 08:14:34.163754	cerrada	5	1010.00	1	\N
253	\N	Jardin	180.00	2025-05-03 05:20:31.122601	cerrada	5	180.00	2	\N
251	\N	Escaladores	555.00	2025-05-03 04:40:27.470979	cerrada	5	555.00	4	\N
222	\N	Anuar	295.00	2025-05-02 02:30:32.916161	cerrada	5	295.00	2	\N
218	\N	Gisela	85.00	2025-05-02 02:24:42.924798	cerrada	5	85.00	2	\N
255	357	\N	175.00	2025-05-04 00:17:36.971102	cerrada	5	175.00	1	\N
220	49	\N	455.00	2025-05-02 02:27:29.321446	cerrada	5	455.00	1	\N
271	\N	Bancas pulpo	335.00	2025-05-04 08:20:10.714946	cerrada	5	335.00	1	\N
212	\N	Lalo	465.00	2025-05-02 01:09:00.315433	cerrada	5	465.00	3	\N
226	\N	Antonio	360.00	2025-05-02 02:56:55.150359	cerrada	5	360.00	2	\N
262	\N	Cristi poesía árbol 	145.00	2025-05-04 01:25:51.423086	abierta	5	145.00	1	\N
298	\N	Macetas 	335.00	2025-05-06 03:02:39.7263	cerrada	5	335.00	2	\N
247	\N	tito	90.00	2025-05-03 02:34:05.974709	cerrada	2	90.00	1	\N
288	\N	Acapulco 	460.00	2025-05-05 03:25:48.585541	cerrada	5	460.00	2	\N
273	\N	Hanni	150.00	2025-05-04 08:32:00.102958	cerrada	5	150.00	2	\N
249	98	\N	140.00	2025-05-03 02:44:57.241602	cerrada	5	140.00	1	\N
265	\N	Bancas	310.00	2025-05-04 07:43:00.809838	cerrada	5	310.00	3	\N
287	\N	Sillón gris	295.00	2025-05-05 02:53:52.714337	cerrada	5	295.00	2	\N
260	\N	Rafa taboada	250.00	2025-05-04 01:19:05.229041	cerrada	5	250.00	1	\N
275	\N	otramiel	225.00	2025-05-04 08:35:30.079699	cerrada	5	225.00	2	\N
285	\N	Noemi	1055.00	2025-05-05 02:47:07.272641	cerrada	5	1055.00	1	\N
286	\N	Luis	670.00	2025-05-05 02:49:55.622707	cerrada	5	670.00	1	\N
277	\N	Isaac	140.00	2025-05-04 08:38:46.2697	cerrada	5	140.00	2	\N
284	\N	Ficus	655.00	2025-05-05 02:33:05.592122	cerrada	5	655.00	2	\N
282	12	\N	460.00	2025-05-05 01:09:26.016721	cerrada	5	460.00	1	\N
296	49	\N	230.00	2025-05-06 02:03:45.104774	cerrada	5	230.00	1	\N
283	\N	Sillón gris	300.00	2025-05-05 01:26:55.327402	cerrada	5	300.00	1	\N
290	3	\N	66.50	2025-05-05 04:06:19.354461	cerrada	5	70.00	1	\N
299	\N	Niklas	440.00	2025-05-06 04:32:47.891542	cerrada	5	440.00	4	\N
281	357	\N	320.00	2025-05-05 00:58:32.401345	cerrada	5	320.00	1	\N
292	\N	Taller 	100.00	2025-05-06 00:34:48.104162	cerrada	5	100.00	1	\N
291	1	\N	0.00	2025-05-06 00:18:21.036303	cerrada	5	230.00	1	2
294	203	\N	485.00	2025-05-06 01:31:14.844666	cerrada	5	485.00	4	\N
295	161	\N	75.00	2025-05-06 01:42:13.453596	cerrada	5	75.00	1	\N
293	\N	Talleristas	95.00	2025-05-06 01:19:21.769551	cerrada	5	95.00	1	\N
297	20	\N	455.00	2025-05-06 02:08:39.824515	cerrada	5	455.00	1	\N
300	\N	Prueba 1	400.00	2025-05-07 15:49:21.296436	abierta	5	400.00	3	\N
301	\N	Prueba 2	465.00	2025-05-07 15:50:34.483226	abierta	5	465.00	2	\N
302	\N	Prueba 3	750.00	2025-05-07 16:04:20.149606	abierta	5	750.00	4	\N
303	\N	Prueba 4	510.00	2025-05-07 16:09:09.640757	abierta	5	510.00	2	\N
304	\N	Prueba ?	145.00	2025-05-07 16:29:11.495348	abierta	5	145.00	1	\N
315	\N	chca	85.00	2025-05-13 22:58:42.085298	abierta	2	85.00	1	\N
316	431	\N	445.00	2025-05-13 23:37:37.44412	abierta	2	445.00	1	\N
317	\N	TEST88	530.00	2025-05-14 00:06:55.648939	abierta	2	530.00	1	\N
318	\N	UFFF	210.00	2025-05-14 00:18:40.785185	abierta	2	210.00	1	\N
319	\N	UFF2	315.00	2025-05-14 00:21:23.717867	abierta	2	315.00	1	\N
321	\N	Pulpito	340.00	2025-05-14 17:13:44.600032	abierta	5	340.00	3	\N
320	\N	Torito falso	285.00	2025-05-14 17:11:49.6951	abierta	5	285.00	2	\N
322	\N	Barra	230.00	2025-05-14 17:14:30.98957	abierta	5	230.00	1	\N
353	\N	ww	230.00	2025-05-20 19:40:39.503825	abierta	2	230.00	1	\N
386	\N	Fake 1	765.00	2025-05-22 02:46:45.406524	abierta	5	765.00	1	\N
387	\N	probando sentencias 1234	896.00	2025-07-02 19:49:32.525842	abierta	5	896.00	1	\N
388	\N	Probando sentencias 9 junio	625.00	2025-07-10 02:24:51.849714	abierta	5	625.00	1	\N
420	\N	probando	2175.00	2025-07-17 01:36:10.286206	abierta	5	2175.00	1	\N
421	\N	WAWE	45.00	2025-07-19 20:43:47.865179	abierta	2	45.00	1	\N
389	\N	Otros productos nuevos	1250.00	2025-07-10 02:30:25.987103	abierta	5	1250.00	1	\N
422	\N	DAIVD1907	115.00	2025-07-19 20:58:54.830533	abierta	2	115.00	1	\N
423	\N	NN	1050.00	2025-07-22 21:26:17.582407	abierta	2	1050.00	1	\N
424	\N	Probando probando 123	340.00	2025-07-23 16:21:07.84197	abierta	5	340.00	1	\N
425	\N	probando de nuevo	875.00	2025-07-23 16:30:28.334713	abierta	5	875.00	1	\N
426	\N	OEOE	315.00	2025-07-25 21:48:57.215966	abierta	2	315.00	1	\N
433	\N	Revisando botones	85.00	2025-08-04 01:17:27.058551	abierta	5	85.00	1	\N
434	\N	probando ordenes iguales on ing extra	410.00	2025-08-04 01:34:41.175445	abierta	5	410.00	1	\N
427	\N	Está es la buena	1060.00	2025-08-03 18:14:08.865242	abierta	5	1060.00	5	\N
428	\N	Una más 	550.00	2025-08-03 18:15:20.596022	abierta	5	550.00	6	\N
429	\N	Pulqueando	1320.00	2025-08-03 18:21:28.42384	abierta	5	1320.00	1	\N
430	\N	Probando cancelaciones	0.00	2025-08-03 18:35:51.958172	abierta	5	0.00	2	\N
431	\N	prpbanco cancelaciones de pulque	1035.00	2025-08-04 00:49:29.014452	abierta	5	1035.00	1	\N
432	\N	Probando para llevar	620.00	2025-08-04 01:07:31.488002	abierta	5	620.00	1	\N
\.


--
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.pagos (id, orden_id, metodo, monto, fecha, empleado_id, propina, porcentaje_propina) FROM stdin;
4	4	tarjeta	465.00	2025-04-11 01:53:25.250887	5	46.50	10.00
5	5	tarjeta	210.00	2025-04-11 01:54:31.061516	5	21.00	10.00
6	6	efectivo	130.00	2025-04-11 02:27:34.284866	5	0.00	\N
7	10	efectivo	225.00	2025-04-11 03:09:36.723796	5	0.00	\N
8	8	efectivo	20.00	2025-04-11 03:16:51.105499	5	0.00	\N
9	8	efectivo	90.00	2025-04-11 03:16:58.27695	5	0.00	\N
10	8	efectivo	60.00	2025-04-11 03:18:04.549235	5	10.00	\N
11	8	efectivo	70.00	2025-04-11 03:18:26.838967	5	0.00	\N
12	38	tarjeta	180.00	2025-04-11 03:52:28.090575	5	0.00	\N
13	20	tarjeta	425.00	2025-04-11 04:34:51.838227	5	42.50	10.00
14	41	tarjeta	400.00	2025-04-11 04:35:57.551054	5	40.00	10.00
15	11	tarjeta	360.00	2025-04-11 04:36:56.403191	5	36.00	10.00
16	33	tarjeta	255.00	2025-04-11 04:47:31.25805	5	25.50	10.00
17	28	tarjeta	315.00	2025-04-11 04:49:55.255903	5	0.00	\N
18	24	efectivo	100.00	2025-04-11 04:51:11.322198	5	0.00	\N
19	45	efectivo	135.00	2025-04-11 04:52:29.656618	5	0.00	\N
20	13	efectivo	120.00	2025-04-11 04:53:35.179279	5	0.00	\N
21	46	tarjeta	60.00	2025-04-11 04:55:42.311833	5	0.00	\N
22	23	tarjeta	280.00	2025-04-11 05:01:13.733027	5	28.00	10.00
23	26	efectivo	140.00	2025-04-11 05:04:15.243655	5	0.00	\N
24	34	tarjeta	230.00	2025-04-11 05:13:53.859266	5	23.00	10.00
25	34	tarjeta	230.00	2025-04-11 05:14:36.964559	5	23.00	10.00
26	42	tarjeta	265.00	2025-04-11 05:17:58.430453	5	26.50	10.00
27	12	efectivo	170.00	2025-04-11 05:18:54.437279	5	0.00	\N
28	21	efectivo	140.00	2025-04-11 05:20:49.343613	5	0.00	\N
29	25	efectivo	45.00	2025-04-11 05:21:49.913835	5	0.00	\N
30	47	tarjeta	540.00	2025-04-11 05:23:57.510785	5	54.00	10.00
31	17	tarjeta	170.00	2025-04-11 05:24:33.039949	5	0.00	\N
32	39	efectivo	170.00	2025-04-11 05:26:36.825405	5	0.00	\N
33	28	efectivo	285.00	2025-04-11 05:28:02.220106	5	0.00	\N
34	35	tarjeta	145.00	2025-04-11 05:30:03.502989	5	0.00	\N
35	28	tarjeta	230.00	2025-04-11 05:31:25.912127	5	0.00	\N
36	44	tarjeta	135.00	2025-04-11 05:32:36.369267	5	13.50	10.00
37	40	tarjeta	135.00	2025-04-11 05:33:28.224776	5	13.50	10.00
38	24	tarjeta	500.00	2025-04-11 05:34:49.974258	5	50.00	10.00
39	37	efectivo	130.00	2025-04-11 05:36:11.279749	5	0.00	\N
40	27	efectivo	135.00	2025-04-11 05:42:05.422563	5	0.00	\N
41	19	efectivo	170.00	2025-04-11 05:43:43.706317	5	0.00	\N
42	36	efectivo	200.00	2025-04-11 05:45:43.778637	5	0.00	\N
43	36	efectivo	110.00	2025-04-11 05:46:20.857753	5	0.00	\N
44	30	tarjeta	180.00	2025-04-11 05:52:00.135986	5	18.00	10.00
45	29	tarjeta	125.00	2025-04-11 05:52:40.556161	5	18.75	15.00
46	16	tarjeta	120.00	2025-04-11 05:59:52.453689	5	0.00	\N
47	13	tarjeta	85.00	2025-04-11 06:00:18.941148	5	0.00	\N
48	9	transferencia	135.00	2025-04-11 06:07:33.828059	5	15.00	\N
49	32	tarjeta	75.00	2025-04-11 06:08:20.566219	5	0.00	\N
50	32	tarjeta	1.00	2025-04-11 06:10:37.792344	5	7.50	\N
51	43	tarjeta	115.00	2025-04-11 06:11:13.176948	5	17.25	15.00
52	31	efectivo	275.00	2025-04-11 06:12:00.269679	5	0.00	\N
53	18	tarjeta	216.00	2025-04-11 06:22:27.93952	5	17.00	\N
54	32	efectivo	60.00	2025-04-11 06:24:19.932849	5	0.00	\N
55	14	efectivo	30.00	2025-04-11 06:27:07.035407	5	0.00	\N
56	15	efectivo	120.00	2025-04-11 06:28:10.146023	5	0.00	\N
67	71	tarjeta	290.00	2025-04-12 02:12:39.986648	5	0.00	\N
68	70	tarjeta	345.00	2025-04-12 02:18:58.427112	5	34.50	10.00
69	69	tarjeta	100.00	2025-04-12 02:19:17.482203	5	10.00	10.00
70	73	tarjeta	130.00	2025-04-12 02:59:41.035926	5	0.00	\N
71	72	tarjeta	270.00	2025-04-12 03:36:33.637609	5	27.00	10.00
72	74	efectivo	185.00	2025-04-12 03:44:09.469855	5	0.00	\N
73	76	tarjeta	435.00	2025-04-12 03:53:13.240231	5	43.50	10.00
74	75	tarjeta	115.00	2025-04-12 04:38:54.882374	5	11.50	10.00
75	75	tarjeta	216.00	2025-04-12 04:39:35.187961	5	21.60	10.00
76	75	tarjeta	107.00	2025-04-12 04:40:14.267706	5	10.70	10.00
77	75	tarjeta	170.00	2025-04-12 04:40:39.515701	5	17.00	10.00
78	75	tarjeta	108.00	2025-04-12 04:41:05.759103	5	10.80	10.00
79	75	efectivo	24.00	2025-04-12 04:42:29.591882	5	0.00	\N
80	81	tarjeta	556.00	2025-04-12 04:51:23.443513	5	55.60	10.00
81	77	efectivo	70.00	2025-04-12 04:56:16.238755	5	0.00	\N
82	77	tarjeta	40.00	2025-04-12 04:56:39.925474	5	4.00	10.00
83	82	efectivo	105.00	2025-04-12 05:36:15.171792	5	0.00	\N
84	84	efectivo	120.00	2025-04-12 05:57:09.773506	5	0.00	\N
85	84	tarjeta	50.00	2025-04-12 05:57:42.589048	5	5.00	10.00
86	84	tarjeta	130.00	2025-04-12 05:58:31.11789	5	13.00	10.00
87	77	tarjeta	68.00	2025-04-12 06:02:58.535458	5	0.00	\N
88	82	tarjeta	153.00	2025-04-12 06:04:43.681099	5	0.00	\N
89	82	efectivo	6.00	2025-04-12 06:04:50.759138	5	0.00	\N
90	82	tarjeta	215.00	2025-04-12 06:05:58.499037	5	21.50	10.00
91	80	transferencia	250.00	2025-04-12 06:12:17.369498	5	0.00	\N
92	80	transferencia	230.00	2025-04-12 06:13:45.740224	5	0.00	\N
93	77	transferencia	90.00	2025-04-12 06:16:21.60089	5	0.00	\N
94	77	efectivo	83.00	2025-04-12 06:16:34.464846	5	0.00	\N
95	83	efectivo	270.00	2025-04-12 06:18:14.403018	5	0.00	\N
96	77	efectivo	70.00	2025-04-12 06:19:28.212498	5	0.00	\N
97	77	transferencia	35.00	2025-04-12 06:19:38.933297	5	0.00	\N
98	77	tarjeta	98.00	2025-04-12 06:22:14.25203	5	9.80	10.00
99	77	tarjeta	68.00	2025-04-12 06:23:56.099499	5	6.80	10.00
100	77	tarjeta	120.00	2025-04-12 06:24:26.84911	5	12.00	10.00
101	77	tarjeta	70.00	2025-04-12 06:24:53.601673	5	7.00	10.00
102	77	tarjeta	165.00	2025-04-12 06:25:38.287622	5	16.50	10.00
103	77	tarjeta	160.00	2025-04-12 06:26:16.804307	5	16.00	10.00
104	78	tarjeta	1075.00	2025-04-12 06:27:31.950169	5	107.50	10.00
105	79	tarjeta	185.00	2025-04-12 06:29:05.725696	5	18.50	10.00
106	79	tarjeta	185.00	2025-04-12 06:29:40.576196	5	18.50	10.00
107	82	efectivo	6.00	2025-04-12 06:31:05.181242	5	0.00	\N
108	95	tarjeta	185.00	2025-04-13 02:43:49.902676	5	27.75	15.00
109	98	efectivo	135.00	2025-04-13 03:13:50.483904	5	0.00	\N
110	92	efectivo	185.00	2025-04-13 03:17:32.345549	5	0.00	\N
111	88	tarjeta	45.00	2025-04-13 03:21:56.768193	5	4.50	10.00
112	97	tarjeta	110.00	2025-04-13 03:22:50.672401	5	11.00	10.00
113	89	tarjeta	169.00	2025-04-13 03:33:40.189959	5	16.90	10.00
114	89	tarjeta	154.00	2025-04-13 03:35:00.651169	5	15.40	10.00
115	89	tarjeta	200.00	2025-04-13 03:35:22.230652	5	30.00	15.00
116	89	tarjeta	55.00	2025-04-13 03:35:44.423673	5	5.50	10.00
117	94	tarjeta	180.00	2025-04-13 03:48:33.056166	5	27.00	15.00
118	91	efectivo	390.00	2025-04-13 03:58:37.355032	5	0.00	\N
119	90	tarjeta	245.00	2025-04-13 04:00:46.162977	5	36.75	15.00
120	96	efectivo	170.00	2025-04-13 04:16:29.595623	5	0.00	\N
121	88	tarjeta	125.00	2025-04-13 05:05:51.110587	5	0.00	\N
122	101	efectivo	510.00	2025-04-13 05:20:57.578612	5	60.00	\N
123	102	efectivo	230.00	2025-04-13 05:34:40.680735	5	0.00	\N
124	102	efectivo	170.00	2025-04-13 05:34:59.464273	5	0.00	\N
125	97	efectivo	80.00	2025-04-13 05:42:50.412719	5	0.00	\N
126	87	efectivo	280.00	2025-04-13 05:43:26.629206	5	0.00	\N
127	99	tarjeta	80.00	2025-04-13 05:48:15.073879	5	8.00	10.00
128	93	tarjeta	130.00	2025-04-13 05:50:19.355804	5	13.00	10.00
129	103	efectivo	225.00	2025-04-13 05:56:04.71378	5	0.00	\N
130	100	tarjeta	445.00	2025-04-13 05:58:01.856711	5	0.00	\N
131	100	efectivo	10.00	2025-04-13 05:58:49.84054	5	0.00	\N
132	104	tarjeta	135.00	2025-04-13 06:01:12.862802	5	27.00	20.00
133	108	tarjeta	135.00	2025-04-14 03:10:59.635025	5	13.50	10.00
134	105	efectivo	100.00	2025-04-14 03:14:30.038629	5	0.00	\N
135	107	transferencia	140.00	2025-04-14 04:27:51.574741	5	25.00	\N
136	110	efectivo	1055.00	2025-04-14 05:05:51.629579	5	158.25	15.00
137	111	efectivo	45.00	2025-04-14 05:22:16.683552	5	0.00	\N
166	135	tarjeta	70.00	2025-04-22 02:05:25.726499	5	0.00	\N
167	134	efectivo	230.00	2025-04-22 03:09:42.94609	5	0.00	\N
168	140	tarjeta	125.00	2025-04-22 03:49:55.518732	5	12.50	10.00
169	136	tarjeta	75.00	2025-04-22 04:50:43.598947	5	7.50	10.00
170	136	tarjeta	50.00	2025-04-22 04:51:39.109867	5	5.00	10.00
171	137	tarjeta	90.00	2025-04-22 04:53:04.124751	5	10.00	\N
172	137	tarjeta	220.00	2025-04-22 04:56:47.684926	5	22.00	10.00
173	138	tarjeta	140.00	2025-04-22 05:07:23.49251	5	21.00	15.00
174	138	tarjeta	50.00	2025-04-22 05:07:38.938744	5	7.50	15.00
175	139	tarjeta	430.00	2025-04-22 05:10:14.997556	5	43.00	10.00
176	141	tarjeta	75.00	2025-04-22 05:17:51.555579	5	7.50	10.00
177	141	tarjeta	150.00	2025-04-22 05:19:19.487579	5	15.00	10.00
178	142	efectivo	120.00	2025-04-22 05:28:44.938935	5	0.00	\N
179	85	efectivo	333.00	2025-04-24 18:09:56.015858	2	0.00	\N
180	144	efectivo	180.00	2025-04-24 18:33:17.98478	2	0.00	\N
181	145	efectivo	100.00	2025-04-25 01:15:23.294696	5	0.00	\N
182	155	tarjeta	340.00	2025-04-25 02:55:11.876291	5	0.00	\N
183	146	tarjeta	180.00	2025-04-25 03:24:58.273209	5	27.00	15.00
184	154	efectivo	366.00	2025-04-25 03:32:34.502211	5	36.60	10.00
185	151	transferencia	190.00	2025-04-25 03:35:51.132851	5	0.00	\N
186	149	transferencia	150.00	2025-04-25 03:36:13.769077	5	0.00	\N
187	150	efectivo	285.00	2025-04-25 03:37:26.101024	5	0.00	\N
188	159	tarjeta	125.00	2025-04-25 04:03:23.008402	5	12.50	10.00
189	164	efectivo	135.00	2025-04-25 04:55:53.019702	5	0.00	\N
190	153	tarjeta	520.00	2025-04-25 05:02:01.959959	5	52.00	10.00
191	167	tarjeta	190.00	2025-04-25 05:05:08.511968	5	28.50	15.00
192	161	tarjeta	260.00	2025-04-25 05:09:51.506628	5	31.20	\N
193	160	tarjeta	385.00	2025-04-25 05:27:09.749803	5	38.50	10.00
194	160	tarjeta	60.00	2025-04-25 05:27:49.282108	5	6.00	10.00
195	166	tarjeta	90.00	2025-04-25 05:30:11.782294	5	9.00	10.00
196	164	efectivo	180.00	2025-04-25 05:33:56.559515	5	0.00	\N
198	157	tarjeta	230.00	2025-04-25 05:43:15.778388	5	23.00	10.00
199	148	tarjeta	1150.00	2025-04-25 05:46:47.63537	5	115.00	10.00
200	168	tarjeta	285.00	2025-04-25 06:58:07.810989	5	28.50	10.00
201	165	efectivo	220.00	2025-04-25 06:58:58.241976	5	0.00	\N
202	164	efectivo	90.00	2025-04-25 06:59:19.376056	5	0.00	\N
203	162	tarjeta	47.00	2025-04-25 06:59:47.425249	5	7.05	15.00
204	162	tarjeta	154.00	2025-04-25 06:59:55.286598	5	23.10	15.00
205	162	efectivo	47.00	2025-04-25 07:00:08.650647	5	0.00	\N
206	162	efectivo	139.00	2025-04-25 07:00:44.977865	5	20.85	15.00
207	158	efectivo	500.00	2025-04-25 07:19:40.539535	5	0.00	\N
208	156	tarjeta	125.00	2025-04-25 07:22:51.701201	5	12.50	10.00
209	156	tarjeta	255.00	2025-04-25 07:22:58.279839	5	0.00	\N
210	152	tarjeta	385.00	2025-04-25 07:25:08.591747	5	38.50	10.00
211	169	efectivo	100.00	2025-04-25 07:29:12.670144	5	0.00	\N
212	169	efectivo	235.00	2025-04-25 07:29:23.526444	5	35.25	15.00
213	169	tarjeta	60.00	2025-04-25 07:29:30.586824	5	6.00	10.00
214	169	tarjeta	70.00	2025-04-25 07:29:36.295011	5	10.50	15.00
215	169	tarjeta	115.00	2025-04-25 07:29:48.331035	5	11.50	10.00
216	169	efectivo	70.00	2025-04-25 07:29:52.985115	5	0.00	\N
217	169	efectivo	50.00	2025-04-25 07:30:07.970541	5	0.00	\N
197	163	tarjeta	395.00	2025-04-25 05:42:50.214912	5	39.50	10.00
218	173	efectivo	235.00	2025-04-26 01:10:24.789828	5	0.00	\N
219	174	efectivo	245.00	2025-04-26 02:38:22.44551	5	0.00	\N
220	171	tarjeta	380.00	2025-04-26 03:01:12.732145	5	38.00	10.00
221	170	tarjeta	535.00	2025-04-26 03:58:17.403381	5	53.50	10.00
222	170	tarjeta	510.00	2025-04-26 03:58:56.17104	5	51.00	10.00
223	175	efectivo	350.00	2025-04-26 04:33:00.198783	5	0.00	\N
224	177	tarjeta	280.00	2025-04-26 04:34:00.46696	5	28.00	10.00
225	178	tarjeta	500.00	2025-04-26 05:14:19.916009	5	50.00	10.00
226	178	tarjeta	530.00	2025-04-26 05:15:31.853456	5	53.00	10.00
227	182	tarjeta	55.00	2025-04-26 05:19:32.898189	5	0.00	\N
228	176	tarjeta	545.00	2025-04-26 05:35:22.711222	5	54.50	10.00
229	179	tarjeta	305.00	2025-04-26 05:36:38.031909	5	45.75	15.00
230	179	tarjeta	135.00	2025-04-26 05:37:11.646928	5	13.50	10.00
231	179	tarjeta	150.00	2025-04-26 05:38:20.588135	5	15.00	10.00
232	179	tarjeta	165.00	2025-04-26 05:42:03.932702	5	9.50	\N
233	179	tarjeta	430.00	2025-04-26 05:56:24.219816	5	0.00	\N
234	180	efectivo	55.00	2025-04-26 05:56:54.090601	5	0.00	\N
235	183	tarjeta	75.00	2025-04-26 06:09:33.400986	5	7.50	10.00
236	183	efectivo	82.00	2025-04-26 06:09:42.007549	5	0.00	\N
237	183	efectivo	3.00	2025-04-26 06:09:45.842692	5	0.00	\N
238	184	tarjeta	215.00	2025-04-27 01:06:56.113094	5	0.00	\N
239	185	tarjeta	240.00	2025-04-27 01:42:46.04142	5	24.00	10.00
240	185	tarjeta	60.00	2025-04-27 02:03:08.00439	5	9.00	15.00
241	185	tarjeta	145.00	2025-04-27 02:14:06.897208	5	14.50	10.00
242	190	tarjeta	135.00	2025-04-27 03:42:14.602161	5	13.50	10.00
243	190	efectivo	75.00	2025-04-27 03:44:26.771871	5	0.00	\N
244	187	efectivo	60.00	2025-04-27 03:56:47.060206	5	0.00	\N
245	187	tarjeta	90.00	2025-04-27 04:17:09.686892	5	9.00	10.00
246	187	tarjeta	90.00	2025-04-27 04:23:50.592697	5	9.00	10.00
247	189	tarjeta	145.00	2025-04-27 04:36:11.275921	5	21.75	15.00
248	193	efectivo	200.00	2025-04-27 05:03:48.754758	5	0.00	\N
249	192	efectivo	90.00	2025-04-27 05:04:45.48603	5	0.00	\N
250	191	tarjeta	180.00	2025-04-27 05:07:31.415815	5	0.00	\N
251	191	tarjeta	30.00	2025-04-27 05:08:55.151228	5	3.00	10.00
252	191	tarjeta	100.00	2025-04-27 05:15:56.823115	5	15.00	15.00
253	191	tarjeta	220.00	2025-04-27 05:17:35.086015	5	33.00	15.00
254	191	tarjeta	145.00	2025-04-27 05:18:57.105529	5	21.75	15.00
255	188	tarjeta	590.00	2025-04-27 05:22:44.940318	5	59.00	10.00
256	194	efectivo	430.00	2025-04-27 05:26:15.708226	5	43.00	10.00
257	195	tarjeta	280.00	2025-04-27 06:09:53.202254	5	56.00	20.00
258	197	tarjeta	75.00	2025-04-27 06:13:14.773906	5	7.50	10.00
259	196	efectivo	90.00	2025-04-27 06:13:28.652332	5	0.00	\N
260	191	tarjeta	235.00	2025-04-27 06:16:24.875883	5	23.50	10.00
261	186	tarjeta	620.00	2025-04-27 06:16:57.945216	5	0.00	\N
262	199	tarjeta	270.00	2025-04-28 04:54:11.611476	5	27.00	10.00
263	200	tarjeta	225.00	2025-04-28 05:07:22.61541	5	22.50	10.00
264	198	efectivo	340.00	2025-04-28 05:29:01.589655	5	0.00	\N
265	201	efectivo	90.00	2025-04-28 05:34:58.501242	5	0.00	\N
266	198	tarjeta	145.00	2025-04-28 05:35:22.815893	5	50.00	\N
267	207	tarjeta	135.00	2025-04-29 03:29:58.151361	5	13.50	10.00
268	205	tarjeta	90.00	2025-04-29 03:30:29.77351	5	9.00	10.00
269	209	tarjeta	185.00	2025-04-29 03:48:27.548652	5	18.50	10.00
270	204	efectivo	240.00	2025-04-29 04:27:59.047479	5	0.00	\N
271	210	efectivo	50.00	2025-04-29 04:39:17.056312	5	0.00	\N
272	210	tarjeta	85.00	2025-04-29 04:39:46.40371	5	8.50	10.00
273	208	tarjeta	250.00	2025-04-29 05:02:49.833599	5	25.00	10.00
274	203	efectivo	1140.00	2025-04-29 05:09:49.435207	5	110.00	\N
280	215	tarjeta	205.00	2025-05-02 01:52:48.213482	5	20.50	10.00
281	211	tarjeta	1195.00	2025-05-02 02:31:12.140579	5	119.50	10.00
282	213	efectivo	150.00	2025-05-02 02:32:20.358664	5	0.00	\N
283	217	tarjeta	355.00	2025-05-02 03:07:20.141251	5	53.25	15.00
284	216	tarjeta	320.00	2025-05-02 03:44:51.669252	5	32.00	10.00
285	222	tarjeta	295.00	2025-05-02 04:20:00.900703	5	44.25	15.00
286	218	tarjeta	85.00	2025-05-02 04:26:22.963116	5	8.50	10.00
287	223	efectivo	365.00	2025-05-02 04:32:31.473289	5	0.00	\N
288	220	tarjeta	455.00	2025-05-02 04:34:21.963888	5	45.50	10.00
289	212	efectivo	475.00	2025-05-02 04:38:58.496573	5	0.00	\N
290	226	tarjeta	180.00	2025-05-02 04:54:08.904121	5	18.00	10.00
291	226	efectivo	180.00	2025-05-02 04:54:30.054034	5	20.00	\N
292	230	tarjeta	380.00	2025-05-02 05:00:26.430154	5	38.00	10.00
293	230	tarjeta	10.00	2025-05-02 05:14:54.995536	5	1.00	10.00
294	227	tarjeta	735.00	2025-05-02 05:16:19.416279	5	73.50	10.00
295	219	tarjeta	85.50	2025-05-02 05:18:11.959699	5	8.55	10.00
296	219	tarjeta	135.00	2025-05-02 05:18:27.487288	5	13.50	10.00
297	231	efectivo	150.00	2025-05-02 05:27:33.767917	5	50.00	\N
298	232	tarjeta	150.00	2025-05-02 05:30:37.107421	5	15.00	10.00
299	233	tarjeta	120.00	2025-05-02 05:32:05.506273	5	0.00	\N
300	233	tarjeta	80.00	2025-05-02 05:32:08.975631	5	0.00	\N
301	214	tarjeta	160.00	2025-05-02 05:34:55.720591	5	16.00	10.00
302	238	tarjeta	50.00	2025-05-02 05:37:59.312922	5	0.00	\N
303	239	tarjeta	45.00	2025-05-02 05:39:14.682982	5	6.75	15.00
304	224	tarjeta	315.00	2025-05-02 05:40:55.835838	5	31.50	10.00
305	235	efectivo	200.00	2025-05-02 05:52:49.089606	5	0.00	\N
306	235	tarjeta	95.00	2025-05-02 05:52:53.607827	5	9.50	10.00
307	234	tarjeta	365.00	2025-05-02 05:58:06.787383	5	54.75	15.00
308	240	tarjeta	60.00	2025-05-02 05:58:21.0697	5	9.00	15.00
309	240	tarjeta	100.00	2025-05-02 05:59:36.282484	5	15.00	15.00
310	221	tarjeta	444.00	2025-05-02 06:02:19.47342	5	66.60	15.00
311	221	tarjeta	444.00	2025-05-02 06:02:57.502116	5	66.60	15.00
312	221	tarjeta	444.00	2025-05-02 06:03:28.52882	5	66.60	15.00
313	239	tarjeta	195.00	2025-05-02 06:07:14.022114	5	19.50	10.00
314	237	efectivo	125.00	2025-05-02 06:10:47.590612	5	0.00	\N
315	239	efectivo	90.00	2025-05-02 06:16:32.041342	5	0.00	\N
316	228	efectivo	135.00	2025-05-02 06:17:32.232674	5	0.00	\N
317	237	efectivo	50.00	2025-05-02 06:18:54.343081	5	0.00	\N
318	237	efectivo	340.00	2025-05-02 06:22:32.987325	5	34.00	10.00
319	229	transferencia	555.00	2025-05-02 06:26:15.557076	5	0.00	\N
320	237	efectivo	120.00	2025-05-02 06:27:56.753695	5	0.00	\N
321	236	transferencia	250.00	2025-05-02 06:32:27.107922	5	0.00	\N
322	225	tarjeta	630.00	2025-05-02 06:37:39.294951	5	63.00	10.00
323	241	tarjeta	110.00	2025-05-02 06:39:50.734285	5	0.00	\N
324	241	efectivo	100.00	2025-05-02 06:39:57.411046	5	0.00	\N
346	247	efectivo	90.00	2025-05-03 03:17:37.386426	5	0.00	\N
347	248	tarjeta	345.00	2025-05-03 03:32:47.861496	5	51.75	15.00
348	249	tarjeta	140.00	2025-05-03 04:04:02.247015	5	14.00	10.00
349	245	tarjeta	250.00	2025-05-03 04:06:28.205843	5	0.00	\N
350	245	tarjeta	170.00	2025-05-03 04:07:10.287336	5	17.00	10.00
351	245	tarjeta	1.00	2025-05-03 04:07:19.332852	5	25.00	\N
352	245	tarjeta	170.00	2025-05-03 04:08:15.440383	5	17.00	10.00
353	245	tarjeta	190.00	2025-05-03 04:10:03.66702	5	19.00	10.00
354	245	efectivo	200.00	2025-05-03 04:10:47.757374	5	0.00	\N
355	245	efectivo	265.00	2025-05-03 04:11:25.572572	5	0.00	\N
356	245	efectivo	15.00	2025-05-03 04:13:24.201714	5	0.00	\N
357	245	tarjeta	120.00	2025-05-03 04:13:59.327342	5	12.00	10.00
358	252	tarjeta	315.00	2025-05-03 05:32:10.026117	5	47.25	15.00
359	244	tarjeta	340.00	2025-05-03 05:51:41.390448	5	34.00	10.00
360	246	tarjeta	492.50	2025-05-03 06:13:08.958257	5	49.25	10.00
361	246	tarjeta	492.50	2025-05-03 06:13:47.651377	5	49.25	10.00
362	251	efectivo	130.00	2025-05-03 06:15:22.020414	5	0.00	\N
363	251	efectivo	100.00	2025-05-03 06:15:41.297341	5	0.00	\N
364	251	efectivo	85.00	2025-05-03 06:15:51.96317	5	0.00	\N
365	251	efectivo	80.00	2025-05-03 06:16:25.38522	5	0.00	\N
366	251	tarjeta	160.00	2025-05-03 06:16:55.255255	5	16.00	10.00
367	253	tarjeta	180.00	2025-05-03 06:19:19.495628	5	18.00	10.00
368	254	tarjeta	360.00	2025-05-03 06:21:18.205877	5	36.00	10.00
369	250	efectivo	65.00	2025-05-03 06:56:01.003523	5	0.00	\N
370	255	tarjeta	175.00	2025-05-04 00:28:41.352893	5	0.00	\N
371	265	tarjeta	345.00	2025-05-04 07:43:21.640975	5	51.75	15.00
372	256	efectivo	850.00	2025-05-04 07:49:22.80397	5	0.00	\N
373	258	efectivo	95.00	2025-05-04 07:50:14.418068	5	0.00	\N
374	258	tarjeta	115.00	2025-05-04 07:50:21.789584	5	11.50	10.00
375	266	tarjeta	220.00	2025-05-04 07:52:28.561798	5	22.00	10.00
376	260	efectivo	20.00	2025-05-04 07:53:30.128381	5	0.00	\N
377	260	efectivo	1230.00	2025-05-04 07:53:52.630333	5	0.00	\N
378	259	efectivo	259.00	2025-05-04 07:55:12.771801	5	0.00	\N
379	259	efectivo	1.00	2025-05-04 07:55:33.770101	5	0.00	\N
380	261	tarjeta	185.00	2025-05-04 07:57:56.859052	5	18.50	10.00
381	261	tarjeta	240.00	2025-05-04 07:58:07.563467	5	24.00	10.00
382	261	tarjeta	90.00	2025-05-04 07:58:14.36897	5	9.00	10.00
383	261	tarjeta	75.00	2025-05-04 07:58:23.478366	5	7.50	10.00
384	261	tarjeta	175.00	2025-05-04 07:58:33.742184	5	17.50	10.00
385	261	efectivo	85.00	2025-05-04 07:58:38.318508	5	0.00	\N
386	261	tarjeta	50.00	2025-05-04 07:59:48.748191	5	5.00	10.00
387	261	tarjeta	84.00	2025-05-04 08:02:01.754193	5	0.00	\N
388	261	tarjeta	1.00	2025-05-04 08:02:41.897405	5	0.00	\N
389	263	tarjeta	205.00	2025-05-04 08:04:56.035386	5	20.50	10.00
390	263	transferencia	225.00	2025-05-04 08:05:07.718162	5	35.00	\N
391	263	tarjeta	165.00	2025-05-04 08:05:21.472967	5	24.75	15.00
392	263	tarjeta	205.00	2025-05-04 08:05:40.093926	5	20.50	10.00
393	257	efectivo	75.00	2025-05-04 08:06:26.254053	5	0.00	\N
394	267	tarjeta	320.00	2025-05-04 08:10:34.865899	5	0.00	\N
395	268	efectivo	50.00	2025-05-04 08:11:14.866146	5	0.00	\N
396	269	tarjeta	1010.00	2025-05-04 08:15:19.759512	5	113.50	\N
397	270	efectivo	205.00	2025-05-04 08:18:20.395854	5	0.00	\N
398	271	tarjeta	97.50	2025-05-04 08:20:29.038547	5	9.75	10.00
399	271	tarjeta	30.00	2025-05-04 08:20:35.858427	5	3.00	10.00
400	271	tarjeta	207.50	2025-05-04 08:20:46.861293	5	20.75	10.00
401	272	tarjeta	295.00	2025-05-04 08:22:33.707816	5	29.50	10.00
402	272	tarjeta	275.00	2025-05-04 08:22:40.603559	5	27.50	10.00
403	273	tarjeta	150.00	2025-05-04 08:32:24.339436	5	15.00	10.00
404	274	tarjeta	145.00	2025-05-04 08:34:18.507753	5	14.50	10.00
405	274	tarjeta	310.00	2025-05-04 08:34:23.736972	5	31.00	10.00
406	275	tarjeta	225.00	2025-05-04 08:35:42.346452	5	22.50	10.00
407	276	tarjeta	435.00	2025-05-04 08:37:48.688746	5	43.50	10.00
408	277	tarjeta	70.00	2025-05-04 08:39:00.371835	5	0.00	\N
409	277	efectivo	70.00	2025-05-04 08:39:06.839922	5	0.00	\N
410	278	tarjeta	415.00	2025-05-04 08:41:25.898512	5	62.25	15.00
411	278	tarjeta	450.00	2025-05-04 08:41:36.953551	5	45.00	10.00
412	281	tarjeta	70.00	2025-05-05 02:07:51.500496	5	7.00	10.00
413	282	efectivo	115.00	2025-05-05 02:29:09.227708	5	11.50	10.00
414	282	efectivo	210.00	2025-05-05 02:30:01.787508	5	21.00	10.00
415	282	efectivo	135.00	2025-05-05 02:31:57.592228	5	0.00	\N
416	283	tarjeta	300.00	2025-05-05 02:38:18.10206	5	30.00	10.00
417	279	tarjeta	215.00	2025-05-05 03:15:15.930537	5	32.25	15.00
418	279	tarjeta	135.00	2025-05-05 03:15:56.252848	5	20.25	15.00
419	280	efectivo	250.00	2025-05-05 03:27:23.504652	5	37.50	15.00
420	280	efectivo	300.00	2025-05-05 03:27:40.00832	5	0.00	\N
421	280	efectivo	45.00	2025-05-05 03:30:45.485069	5	35.00	\N
422	287	efectivo	295.00	2025-05-05 03:55:13.197589	5	0.00	\N
423	290	efectivo	70.00	2025-05-05 04:30:17.862817	5	0.00	\N
424	285	efectivo	475.00	2025-05-05 04:34:52.625397	5	0.00	\N
425	286	efectivo	180.00	2025-05-05 04:37:28.264838	5	0.00	\N
426	286	efectivo	235.00	2025-05-05 04:38:22.145982	5	0.00	\N
427	286	tarjeta	265.00	2025-05-05 04:40:15.963939	5	39.75	15.00
428	285	tarjeta	580.00	2025-05-05 04:45:39.361095	5	58.00	10.00
429	289	efectivo	380.00	2025-05-05 05:05:33.755142	5	38.00	10.00
430	284	tarjeta	655.00	2025-05-05 05:11:53.507159	5	65.50	10.00
431	288	tarjeta	460.00	2025-05-05 05:16:48.544923	5	46.00	10.00
432	281	tarjeta	250.00	2025-05-05 05:18:13.418023	5	25.00	10.00
433	295	efectivo	75.00	2025-05-06 02:52:39.578878	5	0.00	\N
434	292	efectivo	100.00	2025-05-06 03:04:13.165137	5	0.00	\N
435	296	tarjeta	230.00	2025-05-06 03:12:14.040354	5	23.00	10.00
436	294	tarjeta	345.00	2025-05-06 03:17:55.011703	5	34.50	10.00
437	294	tarjeta	160.00	2025-05-06 03:19:01.830975	5	16.00	10.00
438	297	efectivo	200.00	2025-05-06 04:07:46.165151	5	0.00	\N
439	297	tarjeta	275.00	2025-05-06 04:08:38.015133	5	27.50	10.00
440	298	efectivo	335.00	2025-05-06 04:31:07.543305	5	0.00	\N
441	293	efectivo	100.00	2025-05-06 04:31:45.758848	5	0.00	\N
442	299	tarjeta	440.00	2025-05-06 05:08:53.488789	5	88.00	20.00
\.


--
-- Data for Name: preso_grado; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.preso_grado (id, preso_id, grado_id, fecha_otorgado) FROM stdin;
1	3	1	2025-03-23
\.


--
-- Data for Name: presos; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.presos (id, reg_name, res_tel, igname, bday, mkt, cellmate, referidos, fecha_registro) FROM stdin;
1	Jorge	2226803262		3/26/1997	f	1	5	2025-03-03
2	Paco Chucho	2213333854	Pacochuchs	12/10/1992	t	1	3	2025-03-03
3	Paco Chucho	2213333854	Pacochuchs	12/10/1992	t	1	0	2025-03-03
4	David Loro	2288241181		11/12/1991	t	1	0	2025-03-03
5	Serch	5519079955	Awesomeserch	1/17/1997	t	0	4	2025-03-03
6	Jennifer	9211097752		1/16/1993	t	2	2	2025-03-03
7	Rene	3330370516	@crodian	4/3/1989	t	6	1	2025-03-03
8	Rene	3330370516	@crodian	4/3/1989	t	6	0	2025-03-03
9	Gerardo	2227352207	Ilgameshlara	1/16/1993	t	0	0	2025-03-03
10	Samuel	5547633824		9/26/1993	f	0	0	2025-03-03
11	Alan	5529454183	@g.o_alan	9/3/1999	t	0	1	2025-03-03
12	Rodrigo	5638995046	@glenrjui	9/13/2002	t	0	7	2025-03-03
13	Rafael garcia	4434805070	@_rafagd	3/17/2003	t	0	3	2025-03-03
14	Rafael garcia	4434805070	@_rafagd	3/17/2003	t	0	0	2025-03-03
15	Allisson	7971014559	@allisson_maltes	5/24/1997	t	0	0	2025-03-03
16	Daniela	5543453312	@danielaricostraff	9/26/1990	f	0	0	2025-03-03
17	José Vigil	2223830696	Chema_vigil6	3/6/1998	t	0	3	2025-03-03
18	Shantal	2212746541	La.musa.cosmica 	3/30/2000	t	0	0	2025-03-03
19	Rosari	2226963697	@saherrosy	9/2/1996	t	0	0	2025-03-03
20	Carlos Arturo Nuñez 	2225993386	arturonf	11/4/1995	f	0	5	2025-03-03
21	Fabio Camacho guerrero	7822426009	Fabio.cg	8/4/1996	t	20	0	2025-03-03
22	Ivana del rio	7224357178	@ivanadelriobl	7/21/1998	t	0	2	2025-03-03
23	Andrea casas	2293255107	@andyyych	6/3/1998	f	22	0	2025-03-03
24	Emilia canales	5640008373		11/3/1999	t	22	0	2025-03-03
25	Ada asurim	2227884330	Ada_asurim	2/15/1991	t	0	1	2025-03-03
26	Ximena tapia morales	7225392647	@xine__tapia	7/8/2002	t	0	1	2025-03-03
27	Yei-Cipactli Rhydian Cuitláhuac Ixcóatl van der Kroft Martínez	6241560915		3/26/1999	t	0	11	2025-03-03
28	Mitzi del castillo guzman	2292554362		12/18/2004	t	27	0	2025-03-03
29	Narda Marlet serret guzman	7828200488	@limonarda	8/5/2004	t	0	0	2025-03-03
30	Alejandro chavez	2211670691	@astourjean	5/8/1996	t	27	0	2025-03-03
31	Vero Velázquez 	2223806289	Veronicavel_19	9/19/1996	t	0	1	2025-03-03
32	Joaquín palafox	2221847088	Joaquin_palafox	8/11/1999	t	31	0	2025-03-03
33	Mitzi vergara	2331156324	Mitzivergara22	9/22/2004	t	0	1	2025-03-03
34	José Eduardo lopez	9931062734		3/22/2002	t	0	1	2025-03-03
35	María lopez	9934034684	Looez6441	6/15/2004	t	34	0	2025-03-03
36	Andrea ugalde	5530405799	3dvivas	12/2/1996	t	0	3	2025-03-03
37	Julieta tellez	2225633529	Julest.irl	1/24/2001	t	36	0	2025-03-03
38	Luis zainos 	2461288815	@zain0s.rl	7/2/2002	t	0	0	2025-03-03
39	Antonio flores	2228183301	@bxlmxrx	10/29/2002	t	5	0	2025-03-03
40	Alonso marquina	2211678869	@alonso_marquinars	5/24/1996	t	5	0	2025-03-03
41	Aaron borja	2223623957	@aaronborja97	2/14/1997	t	0	1	2025-03-03
42	Alina tellez	2221074919	@aaliinaalee	1/9/2001	t	41	0	2025-03-03
43	Eduardo ortega	2211068600	@_lalo_volovan	8/29/2002	t	0	1	2025-03-03
44	Rodrigo alvarez	2215710874		8/15/2005	t	43	0	2025-03-03
45	Gerardo Apango	2223582886	Gerandroid	10/23/1997	t	0	0	2025-03-03
46	Fernando escalante	2226951944	Ferescalante18	7/13/1999	t	0	0	2025-03-03
47	Daniela serrano	2223778476	Dann.semilla	9/24/1989	t	0	0	2025-03-03
48	Sara reyes	2225011185	@malappecora	5/14/1999	t	0	1	2025-03-03
49	Paola medellin	2222068756	Pmedelln	8/19/1992	t	0	2	2025-03-03
50	Alan Lopez 	2221865460	Alan.lopezmartinez	6/24/1989	t	0	1	2025-03-03
51	Pablo tenorio	5541855819	Pablotnr	10/11/1998	f	50	0	2025-03-03
52	Karla hermosillo	2225645202	Koralaaaaaa	9/25/1999	t	49	0	2025-03-03
53	Giorgio farid	2213322750	Giorgiolinetti	9/18/1998	t	0	1	2025-03-03
54	Angélica ruiz	2211112691	Acilegnaziur	12/12/1996	t	53	0	2025-03-03
55	Jenaro perrz	2211983322	Sie7e_capas	8/17/1993	t	48	0	2025-03-03
56	Romario marquez	2225067579	Romariojesus	9/8/1994	t	0	5	2025-03-03
57	Javiera vasquez	2225067579	Ja_vf	7/11/1996	f	56	0	2025-03-03
58	Naila dicha	5575444993	Nailadiag	9/8/1993	t	56	0	2025-03-03
59	Emiliano bello	7757572614	Emiliano.beio	11/15/2000	t	0	3	2025-03-03
60	Daniela morales	7775131055	Dan_2m	4/7/2000	t	0	0	2025-03-03
61	Daniela Morales	7751310551	Dan_2m	4/7/2000	t	0	1	2025-03-03
62	Edin gonzalez	2281012458	Ender.sense	2/15/1998	t	0	0	2025-03-03
63	Cris azcuaga	5576571239	@consome_d_cris	1/3/2003	t	0	6	2025-03-03
64	Roben malpas	5576571239	Roben.malpas	10/10/2003	t	0	0	2025-03-03
65	Samo barrios	2216599879	Samotanuki	6/13/1997	t	63	0	2025-03-03
66	Eduardo solano	2214315892	Lalo.zs.3	5/15/2003	t	0	1	2025-03-03
67	Alberto gracia	2221091329	Joven_galeno	8/3/1999	t	66	0	2025-03-03
68	Miranda ramos	2221098923	Miramoos_	10/15/1999	t	0	1	2025-03-03
69	Javier granados	2215270865	Javo.granados	1/15/1988	t	68	1	2025-03-03
70	Antonio elizalde	2214151570		12/18/1999	t	0	1	2025-03-03
71	Fátima almonte	2211327370	Faty.ortegaa	8/4/2001	t	70	0	2025-03-03
72	Aldo Javier guzman	2211072029	Aldojavierguzman	2/18/2003	t	0	0	2025-03-03
73	Enrique perez	2223420660	Qp.moreno	8/15/1995	t	0	3	2025-03-03
74	Lulú farrera	2221854680	Lulu_farrera	2/11/2000	t	0	0	2025-03-03
75	Ana Paula carrillo	4491921392	Paulaestodo	7/4/1996	t	0	1	2025-03-03
76	Fabiana arollo	4491117558	Lafamulan	4/8/1998	t	75	0	2025-03-03
77	Luis Enrique cardenas	4493464488	Soythisquique	10/15/1996	t	75	0	2025-03-03
78	Fer flores	2221142552	Fer.flooo	12/3/1989	t	0	1	2025-03-03
79	Iván pablo	2226733294	Edgar.ivan.ph	10/23/1999	t	0	0	2025-03-03
80	Cesar sarmiento	2224166151	Sarmiento_921	1/22/1988	t	78	0	2025-03-03
81	Axel Capdeville 	5565574821	Rascharcutero	7/11/1991	t	0	0	2025-03-03
82	Diana vigil	2221267463	Diana_vesca	1/29/1995	f	17	0	2025-03-03
83	Testing	1234567899		7/9/1990	f	0	0	2025-03-03
84	Testing	1234567899		7/9/1990	f	0	0	2025-03-03
85	Elena Rendón 	7441920929		9/12/2001	t	27	0	2025-03-03
86	Miguel angel colex	2215898159	Angelcolex01	6/9/2001	t	0	0	2025-03-03
87	Testing	1234567899		7/9/1990	f	0	0	2025-03-03
88	Testing	1234567899		7/9/1990	f	0	0	2025-03-03
89	Testing	1234567899		7/9/1990	f	0	0	2025-03-03
90	Carolina Montaño	7475455944	Caromonthd	1/20/1997	t	0	1	2025-03-03
91	José Carlos crespo	8112881879	Cdcrespo	11/21/1995	t	90	8	2025-03-03
92	Airam cisneros	2211334838	Cisneros.airam	11/7/1995	t	91	0	2025-03-03
93	Frida Gómez espinosa 	7712401628	Fri_gomezp	7/29/2000	t	59	0	2025-03-03
94	Eduardo flores	2223270982		11/17/2004	t	0	1	2025-03-03
95	Hannia hernandez	2225980237	Hannia_her03	7/17/2004	t	94	0	2025-03-03
96	Alexis zuñiga	2221788974	Vaaloartee	6/7/2024	f	0	1	2025-03-03
97	Noemí boivin	2229045249		5/14/1993	t	0	0	2025-03-03
98	Luis Rubén Martínez 	9211194390	Luis__ruben99	12/4/1999	t	0	0	2025-03-03
99	Melanie Sarabia 	6241298586	Melaniesarabiaf	11/11/2001	t	0	3	2025-03-03
100	Amanda Craviotto	5575681189	Amandacraviotto	2/14/2001	t	0	3	2025-03-03
101	Rodrigo García 	7771359934		1/13/2001	f	99	0	2025-03-03
102	Liza Queen	5532429769		6/22/2001	f	99	0	2025-03-03
103	Mary Hierro 	5561996649		2/14/2001	f	99	0	2025-03-03
104	Cinthia Dayana Amaro	2212261863		8/15/2001	f	100	0	2025-03-03
105	Alberto Bravo 	7715670955		4/3/1996	f	100	0	2025-03-03
106	Luis Saucedo 	7711172614		5/3/2001	f	100	0	2025-03-03
107	Gabriel Mancilla 	2221837225	Manci0020	4/29/2003	t	0	1	2025-03-03
108	Yessyca yazmin	2215630978	Yessymar0012	9/30/2004	t	107	0	2025-03-03
109	Jan Niklas	2227763287		3/2/1992	t	0	1	2025-03-03
110	Marcos hernandez	9616039212	Makonucamendi	12/6/1989	t	49	0	2025-03-03
111	Angel castañeda	2215249295	Kassady_z	12/26/2002	t	0	0	2025-03-03
112	Pao sosa 	2224411078		3/12/2003	t	0	0	2025-03-03
113	Dana mixcoatl	2221082013	Danna	5/17/2003	t	0	0	2025-03-03
114	Alan paez calderon	2228045907	Alan_capz	7/1/2003	t	0	0	2025-03-03
115	Jesús rotunno	6121377500	Salazar.rotunno	10/6/1998	t	0	0	2025-03-03
116	Paola guerrero	2221345323		6/27/1989	t	91	0	2025-03-03
117	Angel Santamaría 	2212845772	Angeman98	7/1/1998	t	91	0	2025-03-03
118	Leo feria	2225057305	Leo31_feria	10/15/1995	t	91	0	2025-03-03
119	Victor canales	2461796279	Victorcali00	2/21/2000	t	27	0	2025-03-03
120	Marco coutiño	9613038585	Marco_cou	10/15/2001	t	61	0	2025-03-03
121	Alixes casillas	7441449573	Ali.cmtz	9/16/1995	t	91	0	2025-03-03
122	Karla herrera	2216542670	Karla_hm09	4/9/2000	t	56	2	2025-03-03
123	Osmar lezama	2211654804	Lr.osmar	2/16/1993	t	56	0	2025-03-03
124	Claudia Vivas Ofarrill	5530405799		6/19/1968	f	36	0	2025-03-03
125	Jose Leonardo Ugalde Garcia	5554026442		11/26/1959	f	36	0	2025-03-03
126	Juan perez	5530433051	Juanperezmijangos	8/7/2001	t	0	1	2025-03-03
127	Denise zacatelco	5540145477	Denice_zl	1/19/2002	t	126	0	2025-03-03
128	Atzi portilla	2227949366	Atziportillaaa	10/29/1993	t	0	0	2025-03-03
129	Laura mcgregor 	2223873459	Laurademaiz	3/9/1989	t	0	0	2025-03-03
130	Jimena cinta	2227818131	Jack.jjcc	10/23/1996	t	2	0	2025-03-03
131	José Antonio Espinosa 	2211688700	Antonio11es	8/15/2002	t	0	0	2025-03-03
132	Araceli Soto	4441436906		9/6/1975	f	91	0	2025-03-03
133	Carlos Crespo Bravo	8112881879		5/16/1971	f	91	0	2025-03-03
134	Paola Guadalupe Crespo	4443563733		5/28/1999	f	91	0	2025-03-03
135	Rigel Cerón 	2224459199	Orionida	2/19/1995	t	0	0	2025-03-03
136	Elvira piñeiro	2221232006	Elviruri	9/19/1996	t	0	0	2025-03-03
137	Andrea Méndez 	2228506076	Handymdz	12/4/1998	f	0	0	2025-03-03
138	Tanya Galicia	2212405556	Tatysgirl	7/27/1987	t	0	0	2025-03-03
139	Tomás Castillo 	7751549365	Tomitx_	4/28/1996	f	0	0	2025-03-03
140	Priscila Rodríguez 	2223575899	_prisc	6/21/1998	t	0	1	2025-03-03
141	Sebastián Ontiveros 	2221111998		3/18/1994	t	17	2	2025-03-03
142	Paulina Arantxa Herrera	2225387774	Paulhgz	2/16/1998	t	17	0	2025-03-03
143	Lev Schlegel	2461476378		8/20/1995	t	0	1	2025-03-03
144	Alejandro Rebolledo	2294828959	Alexrebolledo_	7/26/2001	f	143	0	2025-03-03
145	Mauricio Rodriguez	2211730636	Mauricio_loustaunau	4/24/1997	f	0	2	2025-03-03
146	Iván talavera 	2228583546	Ivanatalaverita	9/28/2001	f	145	0	2025-03-03
147	Alejandro sosa	2293569276	Alex_scarrillo	3/19/1999	f	145	0	2025-03-03
148	Seli Sánchez 	6674770836	Selischz	5/3/1992	t	0	0	2025-03-03
149	Anahi Rodríguez 	9931041106	Anahi.rgz	9/27/2005	f	0	0	2025-03-03
150	Andrea rodriguez	9933597369	Argueez	9/8/1999	f	0	0	2025-03-03
151	Eugenio Mora	2221062303	Eugeniomorp	7/7/1994	f	0	2	2025-03-03
152	Jonatan Melchor Fuentes 	9511204012	Dahh.jonas	2/24/2004	f	0	0	2025-03-03
153	Ixchel Vazquez 	9811212570	Paulabienetre	6/16/1999	f	0	10	2025-03-03
154	Ana Gladys Roman	2223849416	Anagladysyoga	2/20/1988	f	0	2	2025-03-03
155	Gladis Chavez	2224355276		4/12/1956	f	0	0	2025-03-03
156	Renata Romero 	2212266604	_mr_ranita_	11/4/2005	f	154	0	2025-03-03
157	Jessica Romero 	2227087391	Mont_jess	7/20/1986	f	154	0	2025-03-03
158	Nadhezda Gaspar Perez	2224809860	Nadhez.gaspar	2/24/1977	f	0	0	2025-03-03
159	Vanessa Utrilla	2229071361	Sailorjupiter5	3/20/2000	t	0	1	2025-03-03
160	Ricardo Robles	2223587924	Rickgoldandsilverpawnshop	1/14/1997	t	159	0	2025-03-03
161	Odette Fajardo 	5532037268	Odette.fajardo	12/29/1989	t	0	1	2025-03-03
162	Artemisa García 	5530696762	Artemisa_yunuen	12/31/1994	t	161	0	2025-03-03
163	Paola Núñez 	9512268415	Porplacer	2/12/2000	t	0	0	2025-03-03
164	Gerardo Alvarez	4441118080	Geralvarezp	3/17/1993	f	0	1	2025-03-03
165	Eric Cetina	2288370969	Ehauvery	5/5/1997	f	164	0	2025-03-03
166	Antonio rodriguez	2221132945		6/19/1969	f	140	0	2025-03-03
167	Marjaa castellanos 	2212342999	M.a.r.j.a.a	9/3/1993	t	56	1	2025-03-03
168	Dana ron	2293173319	Dana.ron	11/9/1993	f	167	0	2025-03-03
169	Miguel Guzman	2282337548	Miike.enllamas	11/19/1990	t	0	0	2025-03-03
170	Mónica arteaga	7225056289		12/7/2005	f	27	0	2025-03-03
171	Esmeralda Rosiles	2711975366	Esrosmart	9/21/1999	t	153	0	2025-03-03
172	Adrian sosa	7221009433	Adrianwiedfeldt	7/2/1999	t	0	2	2025-03-03
173	Alexis marquez	5580273188	Alexisgmx	5/7/2001	t	0	0	2025-03-03
174	Antonella Gogeascoechea	2288354012	Antonellagohz	10/19/2001	f	59	0	2025-03-03
175	Rosilu Gutiérrez 	2291164690	Rosilu7	6/7/1996	t	153	0	2025-03-03
176	Anais Salazar	4551400620	Anais.al.azar	8/11/2002	f	27	0	2025-03-03
177	Salma Garcia	2214019282	Salmagdo	12/1/1997	f	153	0	2025-03-03
178	Karla flores	2211464177	Karlafvcello	9/12/2001	t	27	2	2025-03-03
179	Isabella moreira	5544510315	X.green._.goddess.x	4/30/2002	t	26	3	2025-03-03
180	Valeria brebeen	2212685452	Valeriabrebeen	2/5/2001	t	0	3	2025-03-03
181	Julia sanchez	2223362211	Julia.scj	5/18/2000	t	180	0	2025-03-03
182	Sebastián estrada	7441604123	Sebas.x14	7/20/2001	t	180	0	2025-03-03
183	Sebastián estrada	7441604123	Sebas.x14	7/20/2001	t	180	0	2025-03-03
184	Ellie muro	2225309703	Ellie_mmv	8/22/1998	t	0	1	2025-03-03
185	Amadeo segura	2214354475	Amadeo_s_	6/15/2004	t	184	0	2025-03-03
186	Roberto Centeno	2231076652	Tito_cen	9/30/1998	t	0	1	2025-03-03
187	Andrea Lopez Paez 	2224389088	Andreaapaeez	2/16/2002	t	186	0	2025-03-03
188	Vian Flores	2215958087	V.i.a.n.n	6/11/1998	f	151	0	2025-03-03
189	Carlos lara	2224863656	Blunox1604	4/16/1995	f	151	0	2025-03-03
190	summer ren	2223281914	S4mmer_ren	8/26/1999	t	63	0	2025-03-03
191	Antonio	2491107964	Marcanthony	1/24/2002	t	63	0	2025-03-03
192	La Amandis	2228145712	La.amandisss	2/20/2004	t	63	0	2025-03-03
193	Luis Arcadio	2211105134	Li.ft_______	6/24/1999	t	63	0	2025-03-03
194	Gerardo león 	9818214130	Gerardoleon.cvsn	12/30/1996	t	153	0	2025-03-03
195	Sergio 	7714044761		9/4/2001	t	59	0	2025-03-03
196	Jorge mexicano	2221112394	Jorgemexicano14	5/5/1999	f	122	0	2025-03-03
197	Alondra goytia	9531113948	Aloondragoytia	8/8/1999	f	122	0	2025-03-03
198	Adrian garcia	2229030204	Adrian@michus	7/3/1998	t	0	0	2025-03-03
199	Ramsés ulises	2214000594	Ramburger	10/20/1996	t	0	0	2025-03-03
200	Aldo garcia	2212067313	Aldo garcia.g1	3/26/2000	t	0	0	2025-03-03
201	Santiago torres	2226759098		10/6/1996	t	0	0	2025-03-03
202	Santiago torres	2226759098		10/6/1996	t	0	1	2025-03-03
203	Laura Cardenas 	5562456324	Amarillacb	5/31/1993	t	0	20	2025-03-03
204	Mariana Gabriela Ramírez Ponce 	2227080165	Marianarmzpo	2/6/1997	t	202	0	2025-03-03
205	Luis Enrique guzman	2227083487	Luisgzno	5/5/1994	f	109	0	2025-03-03
206	Silas	5559092750		6/18/2001	f	27	0	2025-03-03
207	Giselle manrique	5568863094		3/15/2001	f	27	0	2025-03-03
208	Deniss guerra	5539063194	Casatlacuache	1/30/1991	t	0	3	2025-03-03
209	Frida Lara	5539737753	Fridalai	5/13/1994	t	208	0	2025-03-03
210	Paola Ponce huerta	2222176899	Pao.ph10	10/1/1996	t	208	0	2025-03-03
211	Marco Hernández Contreras 	2225723271		2/21/1986	t	208	0	2025-03-03
212	Alejandra flores	2221524149	Alejandrafloresarce	12/19/2000	t	0	2	2025-03-03
213	Enrique lombardini	5519084203	Luislombardini	8/9/1998	t	212	0	2025-03-03
214	Alexis lopez	2213827951	Ale_lo_c	7/30/1999	t	212	0	2025-03-03
215	Sarahí aroyo	5531043176	Saris0308	8/3/1991	t	0	2	2025-03-03
216	Mario olvera	2224029818	Marioolverav	4/16/1986	t	0	0	2025-03-03
217	Paola dieguez carrillo	7775600105	Paola.diegueZ	2/4/2001	t	215	0	2025-03-03
218	Romina Macias	2462086925	Romimaciaas	11/7/1999	t	215	0	2025-03-03
219	Milena cañon	2228470939	Mil.lenaria	6/13/1992	t	0	0	2025-03-03
220	Valeria Treviño 	4434652178	Vale_tre	10/7/1996	t	0	2	2025-03-03
221	Amauri Gracidas Sarmiento 	2227789395	Amaurygracidas.arte	1/5/1993	t	0	0	2025-03-03
222	Claudia garcia	2225081688	Clauddy_	3/17/1995	t	220	0	2025-03-03
223	Jhovanny Altamirano	2221236710	Jho_altamirano	9/18/1988	t	220	0	2025-03-03
224	Azul Capdevielle	5548001505	_blue_cheese__	9/6/2001	t	0	0	2025-03-03
225	Sebastián Villagrán	5537412956	_svillagran	5/1/1998	t	0	0	2025-03-03
226	Fernanda Quezada	2225846269	Ferr_quezada	11/28/1993	t	0	1	2025-03-03
227	Karen Morales 	2225540589	Krenmf	8/24/1991	t	226	0	2025-03-03
228	David de los Santos	2221728211	David.dlsc	8/15/2001	t	20	0	2025-03-03
229	Mary Paz	2221636228	Marypaz_ga	7/31/1985	t	0	0	2025-03-03
230	Ramiro	2224179300	Willyneas.tat	9/16/1999	t	0	2	2025-03-03
231	Iker	2222003282	Ikeruribe9	5/10/1999	t	230	0	2025-03-03
232	Humberto 	2225233940	Humberto Méndez 	1/7/1999	t	230	0	2025-03-03
233	Josefina astutti	9989370821	Josefinaastutti 	8/30/1988	f	96	0	2025-03-03
234	José René Mendoza	2227682839		11/10/1960	t	7	0	2025-03-03
235	Corayma reyes urrego	9995501513	Chi.koritaa	11/12/1998	t	73	0	2025-03-03
236	Gabriel Juarez	2218250269	Gabri_el_ivan	6/10/1989	t	0	0	2025-03-03
237	Fito Díaz Ordaz 	2228137260	Fito_064	6/4/2004	t	63	0	2025-03-03
238	Alex Nurob	9621150063	Alexnurz	4/2/1994	f	0	0	2025-03-03
239	Manel Martos	5539010870		6/3/1977	f	0	0	2025-03-03
240	Montserrat Moran Linares	3411105919	adamichelada	12/2/1999	f	0	0	2025-03-03
241	Fabio	2222511462	fabio_arnoldo	12/18/2001	t	0	0	2025-03-03
242	Karla Flores	2211464177	karlafvcello	9/12/2021	t	0	0	2025-03-03
243	Ximena Tapia	7225392647	xime__tapia	7/8/2022	t	0	0	2025-03-03
244	Hannia Jara Contreras	2211234367	jara.hannia	4/12/2002	t	0	0	2025-03-03
245	Gibran Godoy	9994119789	ggodoy	2/4/1989	t	0	0	2025-03-03
246	Javier Soria	2211658728	soria_cuautencos	1/31/2002	t	179	0	2025-03-03
247	Emilio Xoconostle	2211185639	Ermolindo	7/1/1996	t	0	0	2025-03-03
248	Henry Swartwooe	2281930528	hrgt02	1/4/2002	t	0	0	2025-03-03
249	Daniel Espinosa	5511584495	dani_y_ya	12/13/1999	t	0	0	2025-03-03
250	Sara Reyes Lara	2225011185	malappecora	5/14/1999	t	0	0	2025-03-03
251	Luis Eduardo Camarena 	2221582154	camosmic	1/26/2001	t	0	0	2025-03-03
252	Mauricio Galvan	9932454234	mehmau	8/3/1996	t	0	0	2025-03-03
253	Natasha Konz	5579229985	natshakonzz	12/25/1998	t	0	0	2025-03-03
254	Ilana Flores	5559092750	ila_flo12	11/30/1998	t	0	1	2025-03-03
255	Eugenia Chavelas	7226477697	eugeniacgia	10/4/2002	t	0	0	2025-03-03
256	Adal Lagunes	2229543196	adalqarmando	3/14/1997	t	0	0	2025-03-03
257	Urby Eduardo Marquez	9211150059	urby_edu	10/7/1992	t	0	0	2025-03-03
258	Dilan Alexis Hernández	6647957852	ergotnauta	1/10/1995	t	0	0	2025-03-03
259	Miguel Zapata	5538030274		11/24/1979	t	0	0	2025-03-03
260	Amauri Gracidas	2227789395	amaurygracidas.arte	1/5/1993	t	0	0	2025-03-03
261	Alicia Guadalupe Heredia	6647266967	heredia.alicia	1/24/1995	t	0	0	2025-03-03
262	Erika Ledezma	2224896548	ledezmaakire	8/15/1974	t	0	0	2025-03-03
263	Alejandra Torres	2224903523	jfowr	7/1/1993	t	0	0	2025-03-03
264	David Martínez	2211736949	davicho.mg	4/22/2001	t	0	0	2025-03-03
265	Elisa Castillo	2223077239		5/8/2003	f	0	0	2025-03-03
266	Mar Gomez	4423694700	Margmzr	11/3/2002	t	0	0	2025-03-03
267	José Luis Meyo	2225125371	_solomeyo	7/18/1997	t	0	7	2025-03-03
268	Nuria Arroyo	4421601140		12/15/2001	f	267	0	2025-03-03
269	Javier Vargas	2299848390	chavchupics	1/19/1993	t	0	1	2025-03-03
270	Carlos Aragón	9371412731	aragonlugo	12/23/1998	f	0	0	2025-03-03
271	Marie Oropeza	2228627604	_marieoropeza	11/15/2000	f	0	0	2025-03-03
272	Regina Proal	2212105550	proal_regina	11/3/2000	t	0	0	2025-03-03
273	Laura Borja Cisneros	2222501969	lau_borja_c	12/18/2000	t	0	3	2025-03-03
274	Ercilia Roman	2223587496	ercirm	12/18/2000	t	0	0	2025-03-03
275	Ainara Negrete	2291058112	ainaranegrete	2/20/1991	t	269	0	2025-03-03
276	Blanka Sandoval	2211506605	Blanka_con_k_	9/5/1997	t	267	0	2025-03-03
277	Patricio Magaña	9982401205		6/30/1999	t	0	0	2025-03-03
278	TEST	1234856489		2/1/2222	f	0	0	2025-03-03
279	Stephanie Quiroz	9212714726	stephani.q	10/3/1992	t	0	0	2025-03-03
280	TEST	5555555555		11/12/1997	f	0	0	2025-03-03
281	TEST	5555555555		11/12/1997	f	0	0	2025-03-03
282	Jordi Fernandez	3223844233	Andres_bladell	8/29/2001	t	20	0	2025-03-03
283	Abraham Esli	5587004197	Abraham_ag2	2/25/2003	t	27	0	2025-03-03
284	test5	2222222222		11/14/1997	f	0	0	2025-03-03
285	Alex Noriega	5528445303		7/1/1999	f	5	0	2025-03-03
286	Adriano probano	1245454545		11/11/1996	f	0	0	2025-03-03
287	Liliana munive	2225207277	Lina_murz	8/30/1988	t	0	1	2025-03-03
288	América munive	2223066483	Merimunive	11/12/1975	t	287	0	2025-03-03
289	Gigie Fierro 	2222172027	@gigiefierro	6/16/1993	t	0	0	2025-03-03
290	Carlos ornelas	2227066899	Charlieornelas7	6/7/1996	t	0	0	2025-03-03
291	Uriel Hidalgo Lerma 	2224598870	Uriel.hidalgo.l	7/26/1987	t	0	0	2025-03-03
292	Miguel Guzmán 	2228813115	@miguelokchis	8/8/1995	t	0	0	2025-03-03
293	Angela Pajara 	4423154198	angel.ixuk	3/20/1989	f	0	0	2025-03-03
294	Paco Rubín	2222776621	paco_rubin	10/7/1981	f	0	0	2025-03-03
295	Hannia	2226535054	@hamisoto 	8/6/1998	t	141	1	2025-03-03
296	Vanessa Utrilla	2229071361	sailorjupiter5	3/20/2000	t	0	0	2025-03-03
297	Enrique Perez	2223420660	qp.moreno	8/15/1995	t	73	0	2025-03-03
298	Kenia Moreno	222-752-6010		8/13/1998	t	295	0	2025-03-03
299	Alejandro Solano	5560587876	@vicalexsolano	11/17/2024	t	12	0	2025-03-03
300	Adolfo Jui 	5235468437	fof0_ken	6/28/2005	t	12	0	2025-03-03
301	Mario Valencia N	2227054348		4/2/1985	t	25	0	2025-03-03
302	Axel Coronel	2225602441	axel_thehuman	11/7/1995	t	141	0	2025-03-03
303	melissa salazar	2224460011	floressmelissa	10/26/1998	t	73	0	2025-03-03
304	Judith Cardenas 	6675253458		9/18/1990	f	0	0	2025-03-03
305	Odette	2223389247		3/13/1998	t	0	0	2025-03-03
306	Daniel Peñuela	2225432208	pm.daniel	9/21/1999	t	0	0	2025-03-03
307	Mariana Cabrera 	2228439428	_maar.cg	4/9/1998	t	0	0	2025-03-03
308	Laura Leticia Ruiz Sandoval 	2224651478	Lettruiz	1/3/1990	t	0	0	2025-03-03
309	Romoalda	2222939143	Miel	5/30/1988	t	0	0	2025-03-03
310	bill bill	9711224671	queerbill	1/22/1990	t	0	0	2025-03-03
311	Juan Angel Nuñez 	2225772047	@juan.anm	4/12/1997	t	0	0	2025-03-03
312	Mener M Ramírez 	2222171133	Menerramirez	12/27/1982	t	0	0	2025-03-03
313	Lino Terrones	5738012478	linocrte	12/18/1991	t	0	0	2025-03-03
314	Iván Alí Laguna 	9987344936	alo_ali_	12/17/1979	t	0	0	2025-03-03
315	Iván Alí Laguna 	9987344936	alo_ali_	12/17/1979	t	0	0	2025-03-03
316	Diego alvarez	7773635349	Diegoalvarezquintana	8/3/2001	t	267	0	2025-03-03
317	Marco bravo	2224261972	Marcosaysdoit	9/20/1990	t	267	0	2025-03-03
318	Marissa Zarate	2224240274		4/8/1993	t	267	0	2025-03-03
319	Alejandro bravo	2221271023	Alex.sanz612	12/6/2000	t	267	0	2025-03-03
320	Josefina Delgado	5528093860		12/24/1962	f	0	0	2025-03-03
321	Diego Ruiz gonzalez	2315935330	Yeyoruizz	8/10/2000	t	0	0	2025-03-03
322	ERIC DIAZ	2224814262	Diaz_e7	2/28/2003	t	20	0	2025-03-03
323	Pamela mazatle	2227738853	Pamemelas	8/28/1999	t	0	0	2025-03-03
324	Pamela mazatle	2227738853	Pamemelas	8/28/1999	t	0	0	2025-03-03
325	Aldito	5549456188		10/2/1983	f	69	0	2025-03-03
326	Gia reyes	2211606439	Giareyezzz	8/8/2002	t	273	0	2025-03-03
327	Luisa soriano	2227530422	Luisas_photobooth	12/27/1999	t	273	0	2025-03-03
328	Victor Martinez 	7711605041	Domno_acerbus	2/26/1989	t	0	0	2025-03-03
329	Damaso	2222010673	dam_ar	10/24/1991	t	0	0	2025-03-03
330	Valeria 	2221270401	Valee_cuevas	1/2/2002	t	27	0	2025-03-03
331	Rodrigo Córdova 	2212896701	@rockdrigocx	3/1/1999	t	153	0	2025-03-03
332	Lizbeth	5580929768	@lizflaminghot_	8/3/2000	t	153	0	2025-03-03
333	Karime 	2211678034		11/28/2000	t	153	0	2025-03-03
334	Gabriel Isai Galaviz Loaiza 	2225797710	gabrielgalaviz__	9/14/1999	f	172	0	2025-03-03
335	Chriss Badillo 	2216077679	chriss.badillo.mx	5/8/2025	t	89905	0	2025-03-03
336	Omar Castañeda 	2221529790		10/7/1980	t	0	0	2025-03-03
337	Max	2225241881		12/31/1997	t	0	0	2025-03-03
338	Lizbeth	5580929768	@lizflaminghot_	8/3/2000	t	153	0	2025-03-03
339	Rodrigo Córdova 	2212896701	@rockdrigocx	3/1/1999	t	153	0	2025-03-03
340	Lizbeth	5580929768	@lizflaminghot_	8/3/2000	t	153	0	2025-03-03
341	Gabriel Isai Galaviz Loaiza 	2225797710	gabrielgalaviz__	9/14/1999	f	172	0	2025-03-03
342	Manuel Carvajal 	2212724557		5/29/1998	t	0	5	2025-03-03
343	David López roman	2222222222	Davichotaa 	11/12/1991	t	1	0	2025-03-03
344	Ana Sofia 	2212401715		2/15/2006	t	342	0	2025-03-03
345	Yessica castillo 	2225680945	Yessica_castillo2407	7/24/2000	t	342	0	2025-03-03
346	Yessica castillo 	2225680945	Yessica_castillo2407	7/24/2000	t	342	0	2025-03-03
347	Natalia zuñiga	2224460685		5/20/2001	t	342	0	2025-03-03
348	Iñaki berumen	5577885831	Inaki_berumen_	6/9/2003	t	0	0	2025-03-03
349	Ivonne cano	2212561949	Ivonneeecs	3/6/2003	f	0	0	2025-03-03
350	Luis Juárez 	2215281650	Karadefuchy	5/21/1989	t	0	0	2025-03-03
351	Angel Cervantes 	5520382756	Angelcerva2	10/27/1989	t	0	2	2025-03-03
352	Johanna Hernández 	2721327857		4/7/1988	t	351	0	2025-03-03
353	Alvaro	9211217056		5/8/1992	t	351	0	2025-03-03
354	Alejandra Corona	4432220874	_coralec	4/18/2002	t	13	0	2025-03-03
355	Valeria García 	4432866790	_val.gd	2/2/2002	f	13	0	2025-03-03
356	Alejandra Corona	4432220874	_coralec	4/18/2002	t	13	0	2025-03-03
357	Diego Segura	2211734883		12/27/1990	t	0	0	2025-03-03
358	Emiliano Nuñez	3318885367	@emiliano_nunez.va	9/21/2025	t	254	0	2025-03-03
359	Ana Paula	6692407098	anapaula_riv	2/14/2025	t	179	0	2025-03-03
360	Ana Paula	6692407098	anapaula_riv	2/14/2025	t	179	0	2025-03-03
361	Issai 	9841588889	@issai_limias	8/18/1991	t	0	0	2025-03-03
362	Ricardo Galindez Reyes	7773024452	Ricardo_galindez_25	1/3/2002	t	0	0	2025-03-03
363	Mariana sanchez	2222998767	Marianaconeja	1/15/1985	f	0	0	2025-03-03
364	Alejandra villegas 	2228480859	ale. Villegas 	3/30/2025	t	0	0	2025-03-03
365	Emilia de la Vega	5519033347	em_v.c 	10/13/2000	t	0	2	2025-03-03
366	Daniela Rojo 	2223810056	dannielarojo	9/13/1999	t	365	0	2025-03-03
367	Estefania Cazares 	2223810056	staminagal	11/12/1990	t	365	0	2025-03-03
368	Adri	6391069663	Adrianalzes	6/11/2004	t	0	0	2025-03-03
369	DannyBoy	7223476266	Thedannyboy20	3/24/2025	t	0	0	2025-03-03
370	Andre Molina Jiménez 	2226341576	andru_mj	3/16/2003	t	0	1	2025-03-03
371	dafne	2481796454	D4fffne	2/21/2000	f	370	0	2025-03-03
372	Adri	6391069663	Adrianalzes	6/11/2004	t	0	0	2025-03-03
373	Miguel Herrera	2225053409	Miguelherrmer	8/9/1997	t	342	0	2025-03-03
374	Eduardo 	2204351093	Lalo zs 3	5/15/2002	t	0	0	2025-03-03
375	Diego	2224977427	dsalamanca_c	6/23/2001	t	273	0	2025-03-03
376	Adri	6391069663	Adrianalzes	6/11/2004	t	0	0	2025-03-03
377	Adri	6391069663	Adrianalzes	6/11/2004	t	0	0	2025-03-03
378	Ana	2221089518		6/9/2004	t	0	0	2025-03-03
379	Adri	6391069663	Adrianalzes	6/11/2004	t	0	0	2025-03-03
380	Scarlett	2214132106	scarlettav	3/25/1997	t	0	0	2025-03-03
381	Anny Tablero 	7821474713	annytablero	10/8/1997	t	0	0	2025-03-03
382	Mark 	2223445301	dibujosfeos.inc	3/13/1998	t	0	0	2025-03-03
383	Adri	6391069663	Adrianalzes	6/11/2004	t	0	0	2025-03-03
384	Adri	6391069663	Adrianalzes	6/11/2004	t	0	0	2025-03-03
385	Patricia Rangel	4731193290	@patiipami	3/23/1993	f	203	0	2025-03-03
386	Paulina Probst	1764263977		3/8/2001	t	0	2	2025-03-03
387	Hannah Seita	2202456194		9/16/2005	t	386	0	2025-03-03
388	Karla Flores 	2211464177	@karlafvcello	9/21/2001	t	178	0	2025-03-03
389	Karla Flores 	2211464177	@karlafvcello	9/12/2001	t	178	0	2025-03-03
390	Hannah Seita	2202456194		9/16/2005	t	386	0	2025-03-03
391	Adri	6391069663	Adrianalzes	6/11/2004	t	0	0	2025-03-03
392	Josselyn 	2221471716		4/23/2002	t	0	0	2025-03-03
393	Josselyn 	2221471716		4/23/2002	t	0	0	2025-03-03
394	Adri	6391069663	Adrianalzes	6/11/2004	t	0	0	2025-03-03
395	Rafael Salguero Rivera	7712005369	Rafasalgriv		t	20	0	2025-03-03
396	Adri	6391069663	Adrianalzes	6/11/2004	t	0	0	2025-03-03
397	Alan	5529454183		2/27/2025	t	11	0	2025-03-03
398	Daniella	5531486111	daniella.go	4/6/2000	t	12	0	2025-03-03
399	Gigi	4271165985	gigiromanortega	12/6/2025	t	12	0	2025-03-03
400	paulina	9211199628	paulinacomett	5/15/2000	t	12	0	2025-03-03
401	paulina	9211199628	paulinacomett	5/15/2000	t	12	0	2025-03-03
402	Gigi	4271165985	gigiromanortega	12/6/2025	t	12	0	2025-03-03
403	Jesus	5549124079		12/5/1998	t	203	0	2025-03-03
404	May	5623765965	maynativas	8/5/1991	t	203	0	2025-03-03
405	Pilar	2227062458	Pilar	6/30/1994	t	203	0	2025-03-03
406	Valeria de León 	9611441694	Valedeleonr	5/21/1996	t	203	0	2025-03-03
407	Fabiola 	9211818646	espejodelmundo	4/24/1996	t	203	0	2025-03-03
408	Daphne	2225327995	Daphneesparza	8/19/1993	t	203	0	2025-03-03
409	Ruben	4772902646	@rubenolveram	4/23/1992	f	203	0	2025-03-03
410	Santiago Gómez 	5538512749	@muerte_en_sanborns	3/13/1997	t	203	0	2025-03-03
411	Alfredo	2226637640			t	203	0	2025-03-03
412	Carlos	2226080471	203	2/3/1989	t	203	0	2025-03-03
413	Juan Marco Rivera	8111950268		8/20/1988	f	203	0	2025-03-03
414	Violeta Guillén 	9612331769		2/1/1997	t	203	0	2025-03-03
415	Violeta Guillén 	9612331769		2/28/1997	t	203	0	2025-03-03
416	Daphne	2225327995	Daphneesparza	8/19/1993	t	203	0	2025-03-03
417	Juan Marco Rivera	8111950268		8/20/1988	f	203	0	2025-03-03
418	Carlos	2226080471	203	2/3/1989	t	203	0	2025-03-03
419	Eric	5540582506		4/5/1987	t	1	0	2025-03-03
420	Fabiola 	9211818646	espejodelmundo	4/24/1996	t	203	0	2025-03-03
421	Valeria de León 	9611441694	Valedeleonr	5/21/1996	t	203	0	2025-03-03
422	May	5623765965	maynativas	8/5/1991	t	203	0	2025-03-03
423	Rut Lomeña	2226803262		7/22/1993	f	2	0	2025-03-05
424	Mario Barquero	2217705343	@mario_barquero	9/29/1999	t	0	0	2025-03-07
425	Sebastian Jara	5539858121		12/1/2000	f	33	0	2025-03-07
426	Alejandra 	7711898826		4/8/1991	t	5	0	2025-03-08
427	Ruth Edith 	9631037687	@lacotzitia	7/26/2025	t	0	1	2025-03-08
428	Anel Carrillo 	9631648044		2/13/2025	t	427	0	2025-03-08
429	Fernando Escalante 	2226951944		7/13/1999	t	0	0	2025-03-08
430	Mario Barquero	2217705343	@mario_barquero	9/29/1999	t	0	0	2025-03-08
431	Diego Buenfil	9993570037	Diego_Buenfil 	3/21/2002	t	0	0	2025-03-16
432	Mauricio Gener	2201751896	mau_gener	8/16/2001	t	0	0	2025-03-16
\.


--
-- Data for Name: producto_sabor; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.producto_sabor (id, producto_id, sabor_id) FROM stdin;
20	5	21
21	5	60
22	5	50
23	5	61
24	5	4
25	5	66
26	5	67
27	5	54
28	5	51
29	5	24
30	5	55
31	5	22
32	5	75
33	5	23
34	5	58
35	5	59
36	5	56
37	5	49
38	6	69
39	6	72
40	6	55
41	6	70
42	6	75
43	6	58
44	6	1
45	6	50
46	6	2
47	6	4
48	6	52
49	6	67
50	6	65
51	6	49
52	7	69
53	7	24
54	7	73
55	7	22
56	7	57
57	7	76
58	7	59
59	7	74
60	7	114
61	7	96
62	7	97
63	7	100
64	7	99
65	7	102
66	7	103
67	7	104
68	7	101
69	7	49
70	8	69
71	8	24
72	8	73
73	8	22
74	8	57
75	8	76
76	8	74
77	8	78
78	8	82
79	8	79
80	8	81
81	8	84
82	8	85
83	8	83
84	8	49
85	11	36
86	11	35
87	11	33
88	11	34
89	11	136
90	11	135
91	22	37
92	22	38
96	23	134
97	23	41
98	23	39
99	23	40
103	26	42
104	26	43
105	31	12
106	31	13
107	31	14
108	32	12
109	32	16
110	32	15
111	33	12
112	33	17
113	33	18
114	34	20
115	34	19
116	34	12
117	34	10
118	34	11
119	47	82
120	47	83
121	47	49
122	1	49
123	1	83
124	1	82
125	42	47
126	42	48
127	27	45
128	27	46
130	40	138
131	40	139
132	45	140
133	45	141
134	45	142
135	45	143
136	33	8
137	33	9
138	32	6
139	32	7
140	15	144
141	15	145
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.productos (id, nombre, precio, categoria, costo) FROM stdin;
2	Cacahuates	45.00	Botana	13.50
3	Churritos de maiz	50.00	Botana	15.00
4	Palomitas	45.00	Botana	13.50
10	Victoria	45.00	Cerveza	13.50
12	Cerveza Heróica	120.00	Cerveza Artesanal	36.00
16	Mezcal de la Casa 42	90.00	Mezcal	27.00
17	Mezcal Alacran	110.00	Mezcal	33.00
18	Mezcal Cannabico	120.00	Mezcal	36.00
19	Mezcal Pechuga	160.00	Mezcal	48.00
20	Mezcal Tobala	150.00	Mezcal	39.00
25	Mezcal Espadin 49	130.00	Mezcal	40.00
45	Refresco	40.00	Otras Bebidas	12.00
21	Sangria palaciega	70.00	Preparados	21.00
24	Rusa	50.00	Preparados	15.00
28	Pulcuba	75.00	Preparados	31.50
43	Café	40.00	Preparados	12.00
44	Té	30.00	Preparados	9.00
30	Tepachela	75.00	Preparados	19.50
35	Convoy Pulquero	90.00	Pulque	27.00
52	Cigarros	10.00	EXTRAS	4.00
15	Hidromiel Yurnel	150.00	Cerveza Artesanal	60.00
51	Modelo Negra	55.00	Cerveza	25.00
50	Modelo Especial	55.00	Cerveza	25.00
54	Dulces 10	10.00	EXTRAS	5.00
53	Dulces 5	5.00	EXTRAS	2.50
14	Cerveza 420	250.00	Cerveza Artesanal	116.00
9	Corona	45.00	Cerveza	14.50
13	Cerveza Minerva	80.00	Cerveza Artesanal	40.00
29	Pacifico	45.00	Cerveza	17.50
49	Carta blanca	45.00	Cerveza	13.50
56	Tarro limón y sal	10.00	Preparados	4.98
57	Tarro con salsas	10.00	Preparados	5.00
46	Postre 85	85.00	Antojitos	45.00
58	Postre 45	45.00	Antojitos	20.00
5	Molletes	60.00	Cenas	18.00
6	Tostadas	60.00	Cenas	18.00
7	Nachos	80.00	Cenas	24.00
8	Chicharrin	45.00	Cenas	13.50
11	Cerveza Tiburón	120.00	Cerveza Artesanal	36.00
22	Brebajes	50.00	Otras Bebidas	15.00
55	Kombucha	60.00	Otras Bebidas	30.00
23	Copa Vino	95.00	Otras Bebidas	28.50
26	Toritos	55.00	Otras Bebidas	16.50
31	Natural	50.00	Pulque	15.00
32	Temporada	60.00	Pulque	18.00
33	A la Carta	70.00	Pulque	21.00
34	Especial 	75.00	Pulque	22.50
27	Tepache	75.00	Preparados	22.50
47	Itacate	50.00	Antojitos	15.00
1	Chileatole	50.00	Antojitos	15.00
90	Para llevar	10.00	EXTRAS	0.00
42	Agua Sabor	45.00	Preparados	13.50
40	Cadena perpetua	175.00	Pulque	52.50
\.


--
-- Data for Name: productos_sentencias; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.productos_sentencias (id, sentencia_id, producto_id, cantidad, sabor_id, tamano_id, ingrediente_id, es_opcional, grupo_opcion, precio_unitario) FROM stdin;
40	4	31	1	\N	12	\N	f	\N	0.00
41	4	22	1	37	\N	\N	f	\N	0.00
42	4	9	1	\N	\N	\N	t	1	0.00
43	4	10	1	\N	\N	\N	t	1	0.00
44	4	49	1	\N	\N	\N	t	1	0.00
51	1	22	1	37	\N	\N	f	\N	0.00
52	1	31	1	\N	12	\N	t	1	0.00
53	1	49	1	\N	\N	\N	t	1	0.00
54	1	9	1	\N	\N	\N	t	1	0.00
55	1	10	1	\N	\N	\N	t	1	0.00
56	2	5	1	\N	\N	\N	f	\N	0.00
57	2	22	1	37	\N	\N	f	\N	0.00
58	2	34	1	\N	12	\N	f	\N	0.00
65	3	49	2	\N	\N	\N	t	1	0.00
66	3	10	2	\N	\N	\N	t	1	0.00
67	3	9	2	\N	\N	\N	t	1	0.00
68	3	5	1	\N	\N	\N	f	\N	0.00
69	3	22	1	37	\N	\N	f	\N	0.00
70	3	32	1	\N	15	\N	t	1	0.00
71	5	40	1	\N	\N	\N	f	\N	0.00
72	6	21	3	\N	\N	\N	f	\N	0.00
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.proveedores (id, nombre, rfc, direccion, telefono, email, contacto_nombre, fecha_alta, activo, dias_compra) FROM stdin;
1	Pulque Don Seve	1	Prol. de la 15 Ote. 4, Michatenco, 72823 Pue.	221 595 3594		Don Severino	2025-12-07	t	[]
2	Bodega Carmen	2	C. 2 Ote. 817, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.	222 533 9251		Monserrat López	2025-12-07	t	["jueves","sabado"]
3	La Pastora	3	Servi Plaza Momoxpan, Bello Horizonte, 72754 Heroica Puebla de Zaragoza, Pue.	222 238 4759			2025-01-01	t	[]
4	Frutería Cecilia y Lucero	4	Av. Maximino A. Camacho 1214 A, Centro, 72810 San Andrés Cholula, Pue.	221 387 4858		Pascual & Liliana	2025-12-07	t	[]
5	Walmart	5					2025-12-07	t	[]
6	Sin nombre	6					2025-12-07	t	[]
7	Depósito Rosato	7	C. 2 Sur, Centro San Andrés Cholula, 72810 San Andrés Cholula, Pue.				2025-12-07	t	["jueves"]
8	Miscelanea Susy	8	C. 3 Ote. 405, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.				2025-12-07	t	[]
9	El Bosque Pulque Puro	9	A Domicilio	222 788 0637		Yeyo	2025-12-07	t	["viernes"]
10	Deposito Las Torres	10	Calle 8 Nte 607, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.			Doña Susana	2025-12-07	t	[]
11	Erika Tepache Real	11	A Domicilio	556 630 3873		Erika	2025-12-07	t	[]
12	420 Beer	12	A Domicilio	222 162 5958		Diego Palacios	2025-12-07	t	[]
13	Yurnel	13	A Domicilio	221 272 4557		Manu Arcant	2025-12-07	t	[]
14	El Cañero	14	A Domicilio - Xalapa	228 274 5724		Óscar David Carrera Sánchez	2025-12-07	t	[]
15	Cervecería Tiburón	15	A Domicilio - Xalapa	228 138 0248		Rafael	2025-12-07	t	[]
16	Toritos Dayra	16	A Domicilio - Xalapa	288 113 9424		Dayra Del Carmen Arando	2025-12-07	t	[]
17	Panadería Nadia	17	Calle 3 Sur 711, Santa María Cuaco, 72815 San Andrés Cholula, Pue.				2025-12-07	t	["jueves","sabado"]
18	Panadería Ángel	18	2 ORIENTE 818 SANTIAGO XICOTENCO SAN ANDRES CHOLULA, 72810 Puebla, Pue.	220 342 5682		Abraham	2025-12-07	t	["jueves","sabado"]
19	Panadería La Providencia	19	Av. Maximino A. Camacho 1000, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.				2025-12-07	t	[]
20	Agua San Andres	20		222 544 0909		Luis	2025-12-07	t	[]
21	Chicos Malos	21		222 116 6625		José	2025-12-07	t	[]
22	Morelos	22	Av. Morelos 406, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.				2025-12-07	t	[]
23	Bodega Carmen	23		223 195 8477			2025-12-07	t	[]
24	Dos Marías	24	Cholula pue.			Laura o Pamela	2025-12-07	t	[]
25	Super Farmacia	25	14 oriente 1224, Barrio de San Juan Aquiahuac, 72810 San Andrés Cholula, Pue.				2025-12-07	t	[]
26	Pulque Don Seve	26		221 595 3594			2025-12-07	t	[]
27	Bodega Carmen	27		222 533 9251			2025-12-07	t	[]
28	La Quebradora	28		222 191 1420			2025-12-07	t	[]
29	Carnicería Fernanda	29	C. 5 Sur 703-interior b, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.				2025-12-07	t	[]
\.


--
-- Data for Name: requisiciones; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.requisiciones (id, usuario_id, fecha_solicitud, fecha_completada, completada, notas) FROM stdin;
1	4	2025-07-04 17:50:35.701866	2025-07-08 15:52:29.393799	t	Jueves  de 03 de Julio
2	4	2025-07-06 21:14:09.540876	2025-07-08 15:52:40.461239	t	fdssdf
\.


--
-- Data for Name: sabores; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.sabores (id, nombre, descripcion, categoria_id, disponible, precio_adicional) FROM stdin;
1	Carne árabe	Carne árabe casera - molletes	1	t	30.00
2	Chorizo argentino	Chorizo argentino especial - molletes	1	t	30.00
3	Manzana con tocino	Manzana caramelizada con tocino - molletes	1	t	30.00
4	Hongos	Champiñones salteados - molletes	1	t	30.00
5	Sin sabor	Pulque natural	2	t	0.00
10	Vino	Pulque con vino	5	t	0.00
12	Medio litro	Tamaño estándar (medio litro)	6	t	0.00
13	Litro Natural	Un litro	6	t	30.00
14	5 Litros Natural	Cinco litros	6	t	290.00
15	Litro Temporada	Un litro	6	t	40.00
17	Litro A la Carta	Un litro	6	t	45.00
21	Carne árabe	Extra árabe - molletes	7	t	15.00
22	Chorizo argentino	Extra Chorizo - molletes	7	t	15.00
23	Manzana con tocino	Extra Manzana tocino - molletes	7	t	15.00
24	Champiñones	Extra Champiñones - molletes	7	t	15.00
31	Stout	Stout	10	t	0.00
32	IPA	IPA	10	t	0.00
33	Leviatan	Leviatan	11	t	0.00
34	Porter	Porter	11	t	0.00
35	Imperial stout	Imperial stout	11	t	0.00
36	Hidromiel sirena	Hidromiel sirena	11	t	0.00
37	Tradicional	Tradicional	12	t	0.00
39	Malbec	Malbec	13	t	0.00
40	Merlot	Merlot	13	t	0.00
41	Rosado	Rosado	13	t	0.00
42	Cacahuate	Torito cacahuate	14	t	0.00
43	Jobo	Torito jobo	14	t	0.00
44	Mamey	Torito mamey	14	t	0.00
49	Sencillos	Volver a lo simple	1	t	0.00
50	Chicharron	Sabrosura chicharronera - molletes	1	t	30.00
51	Pollo	El pollo ricolino - molletes	1	t	30.00
52	Mango	Sutil pero delicioso. Ya hace falta - molletes	1	t	30.00
53	Pepita Tostada	Como mis emociones- tostadas - molletes	1	t	30.00
54	Platano	Este si ya es para gerrer@s - molletes	1	t	30.00
55	Chicharron	Extra Chicharron - molletes	7	t	15.00
56	Pollo	Extra Pollo - molletes	7	t	15.00
57	Mango	Extra Mango - molletes	7	t	15.00
58	Pepita Tostada	Extra Pepita Tostada - molletes	7	t	15.00
59	Platano	Extra Platano - molletes	7	t	15.00
60	Carne árabe	Carne árabe casera - tostadas	1	t	30.00
61	Chorizo argentino	Chorizo argentino especial - tostadas	1	t	30.00
63	Hongos	Champiñones salteados - tostadas	1	t	30.00
64	Chicharron	Sabrosura chicharronera - tostadas	1	t	30.00
65	Pollo	El pollo ricolino - tostadas	1	t	30.00
66	Mango	Sutil pero delicioso. Ya hace falta - tostadas	1	t	30.00
67	Pepita Tostada	Como mis emociones- tostadas - tostadas	1	t	30.00
69	Carne árabe	Extra árabe - tostadas	7	t	15.00
70	Chorizo argentino	Extra Chorizo - tostadas	7	t	15.00
72	Champiñones	Extra Champiñones - tostadas	7	t	15.00
73	Chicharron	Extra Chicharron - tostadas	7	t	15.00
74	Pollo	Extra Pollo - tostadas	7	t	15.00
75	Mango	Extra Mango - tostadas	7	t	15.00
76	Pepita Tostada	Extra Pepita Tostada - tostadas	7	t	15.00
78	Carne árabe	Carne árabe casera - chicharrin	1	t	15.00
79	Chorizo argentino	Chorizo argentino especial - chicharrin	1	t	15.00
81	Hongos	Champiñones salteados - chicharrin	1	t	15.00
82	Chicharron	Sabrosura chicharronera - chicharrin	1	t	15.00
83	Pollo	El pollo ricolino - chicharrin	1	t	15.00
84	Mango	Sutil pero delicioso. Ya hace falta - chicharrin	1	t	15.00
85	Pepita Tostada	Como mis emociones- chicharrin - chicharrin	1	t	15.00
87	Carne árabe	Extra árabe - chicharrin	7	t	10.00
88	Chorizo argentino	Extra Chorizo - chicharrin	7	t	10.00
90	Champiñones	Extra Champiñones - chicharrin	7	t	10.00
91	Chicharron	Extra Chicharron - chicharrin	7	t	10.00
92	Pollo	Extra Pollo - chicharrin	7	t	10.00
93	Mango	Extra Mango - chicharrin	7	t	10.00
94	Pepita Tostada	Extra Pepita Tostada - chicharrin	7	t	10.00
96	Carne árabe	Carne árabe casera - nachos	1	t	20.00
97	Chorizo argentino	Chorizo argentino especial - nachos	1	t	20.00
98	Manzana con tocino	Manzana caramelizada con tocino - nachos	1	t	20.00
99	Hongos	Champiñones salteados - nachos	1	t	20.00
16	5 Litros Temporada	Cinco litros	6	t	370.00
18	5 Litros A la Carta	Cinco litros	6	t	435.00
19	Litro Especial	Un litro	6	t	60.00
20	5 Litros Especial	Cinco litros	6	t	480.00
100	Chicharron	Sabrosura chicharronera - nachos	1	t	20.00
101	Pollo	El pollo ricolino - nachos	1	t	20.00
102	Mango	Sutil pero delicioso. Ya hace falta - nachos	1	t	20.00
6	Mamey	Pulque con mango	3	t	0.00
135	Blonde ale temporada	\N	11	t	0.00
45	Con licor	Tepache con licor	15	t	30.00
47	Con licor	Agua con licor	16	t	30.00
46	Con mezcal	Tepache con mezcal	15	t	70.00
137	EXTRA VINO TINTO	\N	21	t	60.00
144	Regular	Hidromiel regular	59	t	0.00
145	Café	Hidromiel con café	59	t	0.00
103	Pepita Tostada	Como mis emociones- nachos - nachos	1	t	20.00
104	Platano	Este si ya es para gerrer@s - nachos	1	t	20.00
105	Carne árabe	Extra árabe - nachos	7	t	10.00
106	Chorizo argentino	Extra Chorizo - nachos	7	t	10.00
107	Manzana con tocino	Extra Manzana tocino - nachos	7	t	10.00
108	Champiñones	Extra Champiñones - nachos	7	t	10.00
109	Chicharron	Extra Chicharron - nachos	7	t	10.00
110	Pollo	Extra Pollo - nachos	7	t	10.00
111	Mango	Extra Mango - nachos	7	t	10.00
112	Pepita Tostada	Extra Pepita Tostada - nachos	7	t	10.00
113	Platano	Extra Platano - nachos	7	t	10.00
114	Queso	Extra Queso - nachos	7	t	10.00
115	Carne árabe	Carne árabe casera - itacate	17	t	30.00
116	Chorizo argentino	Chorizo argentino especial - itacate	17	t	30.00
117	Manzana con tocino	Manzana caramelizada con tocino - itacate	17	t	30.00
118	Hongos	Champiñones salteados - itacate	17	t	30.00
119	Chicharron	Sabrosura chicharronera - itacate	17	t	30.00
120	Pollo	El pollo ricolino - itacate	17	t	30.00
121	Mango	Sutil pero delicioso. Ya hace falta - itacate	17	t	30.00
122	Pepita Tostada	Como mis emociones- itacate - itacate	17	t	30.00
123	Platano	Este si ya es para gerrer@s - itacate	17	t	30.00
124	Corona	Chelas de infraccion	18	t	0.00
125	Victoria	Chelas de infraccion	18	t	0.00
126	Carta blanca	Chelas de infraccion	18	t	0.00
127	Corona	Chelas de pena catpital	19	t	0.00
128	Victoria	Chelas de pena catpital	19	t	0.00
129	Carta blanca	Chelas de pena catpital	19	t	0.00
130	Corona	Chelas de noche en los separos	20	t	0.00
131	Victoria	Chelas de noche en los separos	20	t	0.00
132	Carta blanca	Chelas de noche en los separos	20	t	0.00
38	Especial	Especial	12	t	15.00
9	Pay de Limon	Pulque con Pay de limon	4	t	0.00
7	Mamey	Pulque con mango	3	t	0.00
8	Moras	Pulque con mamey	4	t	0.00
11	Pina Qleada	Pina Colada	5	t	0.00
134	De la casa	Copa de vino de la casa	13	t	0.00
136	Mantarraya hazy IPA	\N	11	t	0.00
133	Curado especial	Con Extra de Especial	56	t	60.00
48	Con mezcal	Agua con mezcal	16	t	70.00
138	Extra especial	Sabor extra especial para Cadena perpetua	5	t	60.00
139	NOOO especial	Sabor NOOO especial para Cadena perpetua	5	t	0.00
140	Coca-Cola Regular	Refresco Coca-Cola regular	58	t	0.00
141	Coca-Cola Sin Azúcar	Refresco Coca-Cola sin azúcar	58	t	0.00
142	Sangría Casera	Refresco de sangría casera	58	t	0.00
143	Agua Mineral	Agua mineral	58	t	0.00
\.


--
-- Data for Name: sentencias; Type: TABLE DATA; Schema: public; Owner: u3tobu994lm3di
--

COPY public.sentencias (id, nombre, descripcion, precio, activa) FROM stdin;
4	Pena Capital	Sentencia máxima para los delitos más graves	125.00	t
1	Infracción	Sentencia leve para infracciones menores	85.00	t
2	El Apando	Sentencia media para delitos moderados	140.00	t
3	Noche en los Separos	Sentencia grave para delitos mayores	155.00	t
5	Cadena perpetua	Bara libre de pulque	175.00	f
6	Sangrias 3x2	Jueves 3 sangrías al precio de 2	140.00	t
\.


--
-- Name: categoria_producto_tipo_variante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.categoria_producto_tipo_variante_id_seq', 44, true);


--
-- Name: categorias_variantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.categorias_variantes_id_seq', 59, true);


--
-- Name: codigos_promocionales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.codigos_promocionales_id_seq', 7, false);


--
-- Name: compras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.compras_id_seq', 1, false);


--
-- Name: detalles_orden_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.detalles_orden_id_seq', 262, true);


--
-- Name: empleados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.empleados_id_seq', 8, false);


--
-- Name: grados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.grados_id_seq', 2, false);


--
-- Name: insumo_proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.insumo_proveedor_id_seq', 12, true);


--
-- Name: insumos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.insumos_id_seq', 218, true);


--
-- Name: inventario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.inventario_id_seq', 1, false);


--
-- Name: items_compra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.items_compra_id_seq', 1, false);


--
-- Name: items_requisicion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.items_requisicion_id_seq', 33, true);


--
-- Name: ordenes_orden_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.ordenes_orden_id_seq', 434, true);


--
-- Name: pagos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.pagos_id_seq', 443, false);


--
-- Name: preso_grado_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.preso_grado_id_seq', 2, false);


--
-- Name: presos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.presos_id_seq', 433, false);


--
-- Name: producto_sabor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.producto_sabor_id_seq', 141, true);


--
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.productos_id_seq', 90, true);


--
-- Name: productos_sentencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.productos_sentencias_id_seq', 97, true);


--
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 29, true);


--
-- Name: requisiciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.requisiciones_id_seq', 33, true);


--
-- Name: sabores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.sabores_id_seq', 145, true);


--
-- Name: sentencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.sentencias_id_seq', 37, true);


--
-- Name: categoria_producto_tipo_variante categoria_producto_tipo_varia_categoria_producto_tipo_varia_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.categoria_producto_tipo_variante
    ADD CONSTRAINT categoria_producto_tipo_varia_categoria_producto_tipo_varia_key UNIQUE (categoria_producto, tipo_variante);


--
-- Name: categoria_producto_tipo_variante categoria_producto_tipo_variante_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.categoria_producto_tipo_variante
    ADD CONSTRAINT categoria_producto_tipo_variante_pkey PRIMARY KEY (id);


--
-- Name: categorias_variantes categorias_variantes_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.categorias_variantes
    ADD CONSTRAINT categorias_variantes_pkey PRIMARY KEY (id);


--
-- Name: codigos_promocionales codigos_promocionales_codigo_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.codigos_promocionales
    ADD CONSTRAINT codigos_promocionales_codigo_key UNIQUE (codigo);


--
-- Name: codigos_promocionales codigos_promocionales_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.codigos_promocionales
    ADD CONSTRAINT codigos_promocionales_pkey PRIMARY KEY (id);


--
-- Name: compras compras_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_pkey PRIMARY KEY (id);


--
-- Name: detalles_orden detalles_orden_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_pkey PRIMARY KEY (id);


--
-- Name: empleados empleados_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_pkey PRIMARY KEY (id);


--
-- Name: empleados empleados_usuario_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_usuario_key UNIQUE (usuario);


--
-- Name: grados grados_nombre_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.grados
    ADD CONSTRAINT grados_nombre_key UNIQUE (nombre);


--
-- Name: grados grados_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.grados
    ADD CONSTRAINT grados_pkey PRIMARY KEY (id);


--
-- Name: insumo_proveedor insumo_proveedor_insumo_id_proveedor_id_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumo_proveedor
    ADD CONSTRAINT insumo_proveedor_insumo_id_proveedor_id_key UNIQUE (insumo_id, proveedor_id);


--
-- Name: insumo_proveedor insumo_proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumo_proveedor
    ADD CONSTRAINT insumo_proveedor_pkey PRIMARY KEY (id);


--
-- Name: insumos insumos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_nombre_key UNIQUE (nombre);


--
-- Name: insumos insumos_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_pkey PRIMARY KEY (id);


--
-- Name: inventario inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_pkey PRIMARY KEY (id);


--
-- Name: items_compra items_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_compra
    ADD CONSTRAINT items_compra_pkey PRIMARY KEY (id);


--
-- Name: items_requisicion items_requisicion_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_requisicion
    ADD CONSTRAINT items_requisicion_pkey PRIMARY KEY (id);


--
-- Name: ordenes ordenes_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_pkey PRIMARY KEY (orden_id);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: preso_grado preso_grado_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.preso_grado
    ADD CONSTRAINT preso_grado_pkey PRIMARY KEY (id);


--
-- Name: presos presos_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.presos
    ADD CONSTRAINT presos_pkey PRIMARY KEY (id);


--
-- Name: producto_sabor producto_sabor_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.producto_sabor
    ADD CONSTRAINT producto_sabor_pkey PRIMARY KEY (id);


--
-- Name: producto_sabor producto_sabor_producto_id_sabor_id_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.producto_sabor
    ADD CONSTRAINT producto_sabor_producto_id_sabor_id_key UNIQUE (producto_id, sabor_id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: productos_sentencias productos_sentencias_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_pkey PRIMARY KEY (id);


--
-- Name: productos_sentencias productos_sentencias_sentencia_id_producto_id_sabor_id_tama_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_sentencia_id_producto_id_sabor_id_tama_key UNIQUE (sentencia_id, producto_id, sabor_id, tamano_id, ingrediente_id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: requisiciones requisiciones_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.requisiciones
    ADD CONSTRAINT requisiciones_pkey PRIMARY KEY (id);


--
-- Name: sabores sabores_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.sabores
    ADD CONSTRAINT sabores_pkey PRIMARY KEY (id);


--
-- Name: sentencias sentencias_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.sentencias
    ADD CONSTRAINT sentencias_pkey PRIMARY KEY (id);


--
-- Name: idx_codigos_promocionales_codigo; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_codigos_promocionales_codigo ON public.codigos_promocionales USING btree (codigo);


--
-- Name: idx_compras_fecha; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_compras_fecha ON public.compras USING btree (fecha_compra);


--
-- Name: idx_compras_proveedor; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_compras_proveedor ON public.compras USING btree (proveedor_id);


--
-- Name: idx_compras_usuario; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_compras_usuario ON public.compras USING btree (usuario_id);


--
-- Name: idx_insumos_categoria; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_insumos_categoria ON public.insumos USING btree (categoria);


--
-- Name: idx_insumos_nombre; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_insumos_nombre ON public.insumos USING btree (nombre);


--
-- Name: idx_items_compra_compra; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_items_compra_compra ON public.items_compra USING btree (compra_id);


--
-- Name: idx_items_compra_insumo; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_items_compra_insumo ON public.items_compra USING btree (insumo_id);


--
-- Name: idx_items_compra_req_item; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_items_compra_req_item ON public.items_compra USING btree (requisicion_item_id);


--
-- Name: idx_items_req_insumo; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_items_req_insumo ON public.items_requisicion USING btree (insumo_id);


--
-- Name: idx_items_req_requisicion; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_items_req_requisicion ON public.items_requisicion USING btree (requisicion_id);


--
-- Name: idx_ordenes_codigo_descuento_id; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_ordenes_codigo_descuento_id ON public.ordenes USING btree (codigo_descuento_id);


--
-- Name: idx_productos_sentencias_sentencia_id; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_productos_sentencias_sentencia_id ON public.productos_sentencias USING btree (sentencia_id);


--
-- Name: idx_proveedores_nombre; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_proveedores_nombre ON public.proveedores USING btree (nombre);


--
-- Name: idx_proveedores_rfc; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_proveedores_rfc ON public.proveedores USING btree (rfc);


--
-- Name: idx_requisiciones_completada; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_requisiciones_completada ON public.requisiciones USING btree (completada);


--
-- Name: idx_requisiciones_usuario; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_requisiciones_usuario ON public.requisiciones USING btree (usuario_id);


--
-- Name: idx_sentencias_activa; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_sentencias_activa ON public.sentencias USING btree (activa);


--
-- Name: inventario_insumo_id_unidad_key; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE UNIQUE INDEX inventario_insumo_id_unidad_key ON public.inventario USING btree (insumo_id, unidad);


--
-- Name: proveedores_rfc_unique; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE UNIQUE INDEX proveedores_rfc_unique ON public.proveedores USING btree (rfc) WHERE ((rfc IS NOT NULL) AND ((rfc)::text <> ''::text));


--
-- Name: inventario trigger_actualizar_inventario; Type: TRIGGER; Schema: public; Owner: u3tobu994lm3di
--

CREATE TRIGGER trigger_actualizar_inventario BEFORE UPDATE ON public.inventario FOR EACH ROW EXECUTE FUNCTION public.actualizar_inventario();


--
-- Name: items_compra trigger_actualizar_requisicion; Type: TRIGGER; Schema: public; Owner: u3tobu994lm3di
--

CREATE TRIGGER trigger_actualizar_requisicion AFTER INSERT ON public.items_compra FOR EACH ROW WHEN ((new.requisicion_item_id IS NOT NULL)) EXECUTE FUNCTION public.actualizar_estado_requisicion();


--
-- Name: compras compras_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: compras compras_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.empleados(id);


--
-- Name: detalles_orden detalles_orden_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;


--
-- Name: detalles_orden detalles_orden_ingrediente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- Name: detalles_orden detalles_orden_orden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes(orden_id) ON DELETE CASCADE;


--
-- Name: detalles_orden detalles_orden_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: detalles_orden detalles_orden_sabor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_sabor_id_fkey FOREIGN KEY (sabor_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- Name: detalles_orden detalles_orden_tamano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_tamano_id_fkey FOREIGN KEY (tamano_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- Name: detalles_orden fk_detalles_orden_sentencia; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT fk_detalles_orden_sentencia FOREIGN KEY (sentencia_id) REFERENCES public.sentencias(id) ON DELETE SET NULL;


--
-- Name: detalles_orden fk_detalles_orden_sentencia_padre; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT fk_detalles_orden_sentencia_padre FOREIGN KEY (sentencia_detalle_orden_padre_id) REFERENCES public.detalles_orden(id) ON DELETE CASCADE;


--
-- Name: insumo_proveedor insumo_proveedor_insumo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumo_proveedor
    ADD CONSTRAINT insumo_proveedor_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.insumos(id);


--
-- Name: insumo_proveedor insumo_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumo_proveedor
    ADD CONSTRAINT insumo_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: inventario inventario_insumo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.inventario
    ADD CONSTRAINT inventario_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.insumos(id) ON DELETE CASCADE;


--
-- Name: items_compra items_compra_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_compra
    ADD CONSTRAINT items_compra_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id) ON DELETE CASCADE;


--
-- Name: items_compra items_compra_insumo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_compra
    ADD CONSTRAINT items_compra_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.insumos(id);


--
-- Name: items_compra items_compra_requisicion_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_compra
    ADD CONSTRAINT items_compra_requisicion_item_id_fkey FOREIGN KEY (requisicion_item_id) REFERENCES public.items_requisicion(id);


--
-- Name: items_requisicion items_requisicion_insumo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_requisicion
    ADD CONSTRAINT items_requisicion_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.insumos(id);


--
-- Name: items_requisicion items_requisicion_requisicion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_requisicion
    ADD CONSTRAINT items_requisicion_requisicion_id_fkey FOREIGN KEY (requisicion_id) REFERENCES public.requisiciones(id) ON DELETE CASCADE;


--
-- Name: ordenes ordenes_codigo_descuento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_codigo_descuento_id_fkey FOREIGN KEY (codigo_descuento_id) REFERENCES public.codigos_promocionales(id) ON DELETE SET NULL;


--
-- Name: ordenes ordenes_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;


--
-- Name: ordenes ordenes_preso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_preso_id_fkey FOREIGN KEY (preso_id) REFERENCES public.presos(id) ON DELETE SET NULL;


--
-- Name: pagos pagos_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id);


--
-- Name: pagos pagos_orden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes(orden_id) ON DELETE CASCADE;


--
-- Name: preso_grado preso_grado_grado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.preso_grado
    ADD CONSTRAINT preso_grado_grado_id_fkey FOREIGN KEY (grado_id) REFERENCES public.grados(id) ON DELETE CASCADE;


--
-- Name: preso_grado preso_grado_preso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.preso_grado
    ADD CONSTRAINT preso_grado_preso_id_fkey FOREIGN KEY (preso_id) REFERENCES public.presos(id) ON DELETE CASCADE;


--
-- Name: producto_sabor producto_sabor_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.producto_sabor
    ADD CONSTRAINT producto_sabor_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: producto_sabor producto_sabor_sabor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.producto_sabor
    ADD CONSTRAINT producto_sabor_sabor_id_fkey FOREIGN KEY (sabor_id) REFERENCES public.sabores(id) ON DELETE CASCADE;


--
-- Name: productos_sentencias productos_sentencias_ingrediente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- Name: productos_sentencias productos_sentencias_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: productos_sentencias productos_sentencias_sabor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_sabor_id_fkey FOREIGN KEY (sabor_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- Name: productos_sentencias productos_sentencias_sentencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_sentencia_id_fkey FOREIGN KEY (sentencia_id) REFERENCES public.sentencias(id) ON DELETE CASCADE;


--
-- Name: productos_sentencias productos_sentencias_tamano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_tamano_id_fkey FOREIGN KEY (tamano_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- Name: requisiciones requisiciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.requisiciones
    ADD CONSTRAINT requisiciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.empleados(id);


--
-- Name: sabores sabores_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.sabores
    ADD CONSTRAINT sabores_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_variantes(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: u3tobu994lm3di
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint); Type: ACL; Schema: public; Owner: rdsadmin
--

GRANT ALL ON FUNCTION public.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO u3tobu994lm3di;


--
-- Name: extension_before_drop; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER extension_before_drop ON ddl_command_start
   EXECUTE FUNCTION _heroku.extension_before_drop();


ALTER EVENT TRIGGER extension_before_drop OWNER TO heroku_admin;

--
-- Name: log_create_ext; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER log_create_ext ON ddl_command_end
   EXECUTE FUNCTION _heroku.create_ext();


ALTER EVENT TRIGGER log_create_ext OWNER TO heroku_admin;

--
-- Name: log_drop_ext; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER log_drop_ext ON sql_drop
   EXECUTE FUNCTION _heroku.drop_ext();


ALTER EVENT TRIGGER log_drop_ext OWNER TO heroku_admin;

--
-- Name: validate_extension; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER validate_extension ON ddl_command_end
   EXECUTE FUNCTION _heroku.validate_extension();


ALTER EVENT TRIGGER validate_extension OWNER TO heroku_admin;

--
-- PostgreSQL database dump complete
--

