--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.9

-- Started on 2025-07-01 17:46:05 UTC

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
-- TOC entry 6 (class 2615 OID 89740352)
-- Name: _heroku; Type: SCHEMA; Schema: -; Owner: heroku_admin
--

CREATE SCHEMA _heroku;


ALTER SCHEMA _heroku OWNER TO heroku_admin;

--
-- TOC entry 7 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: u3tobu994lm3di
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO u3tobu994lm3di;

--
-- TOC entry 4601 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: u3tobu994lm3di
--

COMMENT ON SCHEMA public IS '';


--
-- TOC entry 2 (class 3079 OID 89740473)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- TOC entry 4603 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 264 (class 1255 OID 89740356)
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
-- TOC entry 265 (class 1255 OID 89740357)
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
-- TOC entry 266 (class 1255 OID 89740358)
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
-- TOC entry 267 (class 1255 OID 89740359)
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
-- TOC entry 268 (class 1255 OID 89740360)
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
-- TOC entry 269 (class 1255 OID 89740361)
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
-- TOC entry 274 (class 1255 OID 106470262)
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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 260 (class 1259 OID 106470345)
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
    CONSTRAINT compras_metodo_pago_check CHECK (((metodo_pago)::text = ANY ((ARRAY['efectivo'::character varying, 'tarjeta'::character varying, 'transferencia'::character varying])::text[])))
);


ALTER TABLE public.compras OWNER TO u3tobu994lm3di;

--
-- TOC entry 252 (class 1259 OID 106470277)
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
    marca character varying
);


ALTER TABLE public.insumos OWNER TO u3tobu994lm3di;

--
-- TOC entry 262 (class 1259 OID 106470367)
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
-- TOC entry 250 (class 1259 OID 106470264)
-- Name: proveedores; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    rfc character varying(13) NOT NULL,
    direccion text,
    telefono character varying(20),
    email character varying(100),
    contacto_nombre character varying(100),
    fecha_alta date DEFAULT CURRENT_DATE,
    activo boolean DEFAULT true
);


ALTER TABLE public.proveedores OWNER TO u3tobu994lm3di;

--
-- TOC entry 263 (class 1259 OID 106470389)
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
-- TOC entry 219 (class 1259 OID 93099759)
-- Name: categoria_producto_tipo_variante; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.categoria_producto_tipo_variante (
    id integer NOT NULL,
    categoria_producto character varying(50) NOT NULL,
    tipo_variante character varying(50) NOT NULL
);


ALTER TABLE public.categoria_producto_tipo_variante OWNER TO u3tobu994lm3di;

--
-- TOC entry 220 (class 1259 OID 93099763)
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
-- TOC entry 4605 (class 0 OID 0)
-- Dependencies: 220
-- Name: categoria_producto_tipo_variante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.categoria_producto_tipo_variante_id_seq OWNED BY public.categoria_producto_tipo_variante.id;


--
-- TOC entry 221 (class 1259 OID 93099764)
-- Name: categorias_variantes; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.categorias_variantes (
    id integer NOT NULL,
    nombre character varying(255) NOT NULL,
    tipo character varying(50) NOT NULL
);


ALTER TABLE public.categorias_variantes OWNER TO u3tobu994lm3di;

--
-- TOC entry 222 (class 1259 OID 93099769)
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
-- TOC entry 4606 (class 0 OID 0)
-- Dependencies: 222
-- Name: categorias_variantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.categorias_variantes_id_seq OWNED BY public.categorias_variantes.id;


--
-- TOC entry 223 (class 1259 OID 93099772)
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
-- TOC entry 224 (class 1259 OID 93099781)
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
-- TOC entry 4607 (class 0 OID 0)
-- Dependencies: 224
-- Name: codigos_promocionales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.codigos_promocionales_id_seq OWNED BY public.codigos_promocionales.id;


--
-- TOC entry 259 (class 1259 OID 106470344)
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
-- TOC entry 4608 (class 0 OID 0)
-- Dependencies: 259
-- Name: compras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.compras_id_seq OWNED BY public.compras.id;


--
-- TOC entry 225 (class 1259 OID 93099785)
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
    descripcion_sentencia text
);


ALTER TABLE public.detalles_orden OWNER TO u3tobu994lm3di;

--
-- TOC entry 226 (class 1259 OID 93099796)
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
-- TOC entry 4609 (class 0 OID 0)
-- Dependencies: 226
-- Name: detalles_orden_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.detalles_orden_id_seq OWNED BY public.detalles_orden.id;


--
-- TOC entry 227 (class 1259 OID 93099802)
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
-- TOC entry 228 (class 1259 OID 93099810)
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
-- TOC entry 4610 (class 0 OID 0)
-- Dependencies: 228
-- Name: empleados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.empleados_id_seq OWNED BY public.empleados.id;


--
-- TOC entry 229 (class 1259 OID 93099815)
-- Name: grados; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.grados (
    id integer NOT NULL,
    nombre text NOT NULL,
    descuento numeric(5,2) NOT NULL
);


ALTER TABLE public.grados OWNER TO u3tobu994lm3di;

--
-- TOC entry 230 (class 1259 OID 93099820)
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
-- TOC entry 4611 (class 0 OID 0)
-- Dependencies: 230
-- Name: grados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.grados_id_seq OWNED BY public.grados.id;


--
-- TOC entry 254 (class 1259 OID 106470291)
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
-- TOC entry 253 (class 1259 OID 106470290)
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
-- TOC entry 4612 (class 0 OID 0)
-- Dependencies: 253
-- Name: insumo_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.insumo_proveedor_id_seq OWNED BY public.insumo_proveedor.id;


--
-- TOC entry 251 (class 1259 OID 106470276)
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
-- TOC entry 4613 (class 0 OID 0)
-- Dependencies: 251
-- Name: insumos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.insumos_id_seq OWNED BY public.insumos.id;


--
-- TOC entry 261 (class 1259 OID 106470366)
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
-- TOC entry 4614 (class 0 OID 0)
-- Dependencies: 261
-- Name: items_compra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.items_compra_id_seq OWNED BY public.items_compra.id;


--
-- TOC entry 258 (class 1259 OID 106470326)
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
-- TOC entry 257 (class 1259 OID 106470325)
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
-- TOC entry 4615 (class 0 OID 0)
-- Dependencies: 257
-- Name: items_requisicion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.items_requisicion_id_seq OWNED BY public.items_requisicion.id;


--
-- TOC entry 231 (class 1259 OID 93099821)
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
-- TOC entry 232 (class 1259 OID 93099830)
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
-- TOC entry 4616 (class 0 OID 0)
-- Dependencies: 232
-- Name: ordenes_orden_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.ordenes_orden_id_seq OWNED BY public.ordenes.orden_id;


--
-- TOC entry 233 (class 1259 OID 93099832)
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
-- TOC entry 234 (class 1259 OID 93099841)
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
-- TOC entry 4617 (class 0 OID 0)
-- Dependencies: 234
-- Name: pagos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.pagos_id_seq OWNED BY public.pagos.id;


--
-- TOC entry 235 (class 1259 OID 93099849)
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
-- TOC entry 236 (class 1259 OID 93099854)
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
-- TOC entry 4618 (class 0 OID 0)
-- Dependencies: 236
-- Name: preso_grado_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.preso_grado_id_seq OWNED BY public.preso_grado.id;


--
-- TOC entry 237 (class 1259 OID 93099857)
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
-- TOC entry 238 (class 1259 OID 93099866)
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
-- TOC entry 4619 (class 0 OID 0)
-- Dependencies: 238
-- Name: presos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.presos_id_seq OWNED BY public.presos.id;


--
-- TOC entry 239 (class 1259 OID 93099867)
-- Name: producto_sabor; Type: TABLE; Schema: public; Owner: u3tobu994lm3di
--

CREATE TABLE public.producto_sabor (
    id integer NOT NULL,
    producto_id integer,
    sabor_id integer
);


ALTER TABLE public.producto_sabor OWNER TO u3tobu994lm3di;

--
-- TOC entry 240 (class 1259 OID 93099870)
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
-- TOC entry 4620 (class 0 OID 0)
-- Dependencies: 240
-- Name: producto_sabor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.producto_sabor_id_seq OWNED BY public.producto_sabor.id;


--
-- TOC entry 241 (class 1259 OID 93099871)
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
-- TOC entry 242 (class 1259 OID 93099874)
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
-- TOC entry 4621 (class 0 OID 0)
-- Dependencies: 242
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 243 (class 1259 OID 93099875)
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
-- TOC entry 244 (class 1259 OID 93099881)
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
-- TOC entry 4622 (class 0 OID 0)
-- Dependencies: 244
-- Name: productos_sentencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.productos_sentencias_id_seq OWNED BY public.productos_sentencias.id;


--
-- TOC entry 249 (class 1259 OID 106470263)
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
-- TOC entry 4623 (class 0 OID 0)
-- Dependencies: 249
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- TOC entry 256 (class 1259 OID 106470310)
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
-- TOC entry 255 (class 1259 OID 106470309)
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
-- TOC entry 4624 (class 0 OID 0)
-- Dependencies: 255
-- Name: requisiciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.requisiciones_id_seq OWNED BY public.requisiciones.id;


--
-- TOC entry 245 (class 1259 OID 93099884)
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
-- TOC entry 246 (class 1259 OID 93099891)
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
-- TOC entry 4625 (class 0 OID 0)
-- Dependencies: 246
-- Name: sabores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.sabores_id_seq OWNED BY public.sabores.id;


--
-- TOC entry 247 (class 1259 OID 93099892)
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
-- TOC entry 248 (class 1259 OID 93099898)
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
-- TOC entry 4626 (class 0 OID 0)
-- Dependencies: 248
-- Name: sentencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: u3tobu994lm3di
--

ALTER SEQUENCE public.sentencias_id_seq OWNED BY public.sentencias.id;


--
-- TOC entry 4273 (class 2604 OID 93099901)
-- Name: categoria_producto_tipo_variante id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.categoria_producto_tipo_variante ALTER COLUMN id SET DEFAULT nextval('public.categoria_producto_tipo_variante_id_seq'::regclass);


--
-- TOC entry 4274 (class 2604 OID 93099902)
-- Name: categorias_variantes id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.categorias_variantes ALTER COLUMN id SET DEFAULT nextval('public.categorias_variantes_id_seq'::regclass);


--
-- TOC entry 4275 (class 2604 OID 93099903)
-- Name: codigos_promocionales id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.codigos_promocionales ALTER COLUMN id SET DEFAULT nextval('public.codigos_promocionales_id_seq'::regclass);


--
-- TOC entry 4327 (class 2604 OID 106470348)
-- Name: compras id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.compras ALTER COLUMN id SET DEFAULT nextval('public.compras_id_seq'::regclass);


--
-- TOC entry 4280 (class 2604 OID 93099904)
-- Name: detalles_orden id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden ALTER COLUMN id SET DEFAULT nextval('public.detalles_orden_id_seq'::regclass);


--
-- TOC entry 4286 (class 2604 OID 93099905)
-- Name: empleados id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.empleados ALTER COLUMN id SET DEFAULT nextval('public.empleados_id_seq'::regclass);


--
-- TOC entry 4289 (class 2604 OID 93099906)
-- Name: grados id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.grados ALTER COLUMN id SET DEFAULT nextval('public.grados_id_seq'::regclass);


--
-- TOC entry 4320 (class 2604 OID 106470294)
-- Name: insumo_proveedor id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumo_proveedor ALTER COLUMN id SET DEFAULT nextval('public.insumo_proveedor_id_seq'::regclass);


--
-- TOC entry 4316 (class 2604 OID 106470280)
-- Name: insumos id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumos ALTER COLUMN id SET DEFAULT nextval('public.insumos_id_seq'::regclass);


--
-- TOC entry 4330 (class 2604 OID 106470370)
-- Name: items_compra id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_compra ALTER COLUMN id SET DEFAULT nextval('public.items_compra_id_seq'::regclass);


--
-- TOC entry 4324 (class 2604 OID 106470329)
-- Name: items_requisicion id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_requisicion ALTER COLUMN id SET DEFAULT nextval('public.items_requisicion_id_seq'::regclass);


--
-- TOC entry 4290 (class 2604 OID 93099907)
-- Name: ordenes orden_id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.ordenes ALTER COLUMN orden_id SET DEFAULT nextval('public.ordenes_orden_id_seq'::regclass);


--
-- TOC entry 4294 (class 2604 OID 93099908)
-- Name: pagos id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);


--
-- TOC entry 4297 (class 2604 OID 93099909)
-- Name: preso_grado id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.preso_grado ALTER COLUMN id SET DEFAULT nextval('public.preso_grado_id_seq'::regclass);


--
-- TOC entry 4299 (class 2604 OID 93099910)
-- Name: presos id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.presos ALTER COLUMN id SET DEFAULT nextval('public.presos_id_seq'::regclass);


--
-- TOC entry 4302 (class 2604 OID 93099911)
-- Name: producto_sabor id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.producto_sabor ALTER COLUMN id SET DEFAULT nextval('public.producto_sabor_id_seq'::regclass);


--
-- TOC entry 4303 (class 2604 OID 93099912)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 4304 (class 2604 OID 93099913)
-- Name: productos_sentencias id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias ALTER COLUMN id SET DEFAULT nextval('public.productos_sentencias_id_seq'::regclass);


--
-- TOC entry 4313 (class 2604 OID 106470267)
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- TOC entry 4321 (class 2604 OID 106470313)
-- Name: requisiciones id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.requisiciones ALTER COLUMN id SET DEFAULT nextval('public.requisiciones_id_seq'::regclass);


--
-- TOC entry 4308 (class 2604 OID 93099914)
-- Name: sabores id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.sabores ALTER COLUMN id SET DEFAULT nextval('public.sabores_id_seq'::regclass);


--
-- TOC entry 4311 (class 2604 OID 93099915)
-- Name: sentencias id; Type: DEFAULT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.sentencias ALTER COLUMN id SET DEFAULT nextval('public.sentencias_id_seq'::regclass);


--
-- TOC entry 4337 (class 2606 OID 93099923)
-- Name: categoria_producto_tipo_variante categoria_producto_tipo_varia_categoria_producto_tipo_varia_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.categoria_producto_tipo_variante
    ADD CONSTRAINT categoria_producto_tipo_varia_categoria_producto_tipo_varia_key UNIQUE (categoria_producto, tipo_variante);


--
-- TOC entry 4339 (class 2606 OID 93099925)
-- Name: categoria_producto_tipo_variante categoria_producto_tipo_variante_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.categoria_producto_tipo_variante
    ADD CONSTRAINT categoria_producto_tipo_variante_pkey PRIMARY KEY (id);


--
-- TOC entry 4341 (class 2606 OID 93099927)
-- Name: categorias_variantes categorias_variantes_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.categorias_variantes
    ADD CONSTRAINT categorias_variantes_pkey PRIMARY KEY (id);


--
-- TOC entry 4343 (class 2606 OID 93099929)
-- Name: codigos_promocionales codigos_promocionales_codigo_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.codigos_promocionales
    ADD CONSTRAINT codigos_promocionales_codigo_key UNIQUE (codigo);


--
-- TOC entry 4345 (class 2606 OID 93099931)
-- Name: codigos_promocionales codigos_promocionales_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.codigos_promocionales
    ADD CONSTRAINT codigos_promocionales_pkey PRIMARY KEY (id);


--
-- TOC entry 4407 (class 2606 OID 106470355)
-- Name: compras compras_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_pkey PRIMARY KEY (id);


--
-- TOC entry 4348 (class 2606 OID 93099933)
-- Name: detalles_orden detalles_orden_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_pkey PRIMARY KEY (id);


--
-- TOC entry 4350 (class 2606 OID 93099935)
-- Name: empleados empleados_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_pkey PRIMARY KEY (id);


--
-- TOC entry 4352 (class 2606 OID 93099937)
-- Name: empleados empleados_usuario_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_usuario_key UNIQUE (usuario);


--
-- TOC entry 4354 (class 2606 OID 93099939)
-- Name: grados grados_nombre_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.grados
    ADD CONSTRAINT grados_nombre_key UNIQUE (nombre);


--
-- TOC entry 4356 (class 2606 OID 93099941)
-- Name: grados grados_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.grados
    ADD CONSTRAINT grados_pkey PRIMARY KEY (id);


--
-- TOC entry 4395 (class 2606 OID 106470298)
-- Name: insumo_proveedor insumo_proveedor_insumo_id_proveedor_id_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumo_proveedor
    ADD CONSTRAINT insumo_proveedor_insumo_id_proveedor_id_key UNIQUE (insumo_id, proveedor_id);


--
-- TOC entry 4397 (class 2606 OID 106470296)
-- Name: insumo_proveedor insumo_proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumo_proveedor
    ADD CONSTRAINT insumo_proveedor_pkey PRIMARY KEY (id);


--
-- TOC entry 4391 (class 2606 OID 106470289)
-- Name: insumos insumos_nombre_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_nombre_key UNIQUE (nombre);


--
-- TOC entry 4393 (class 2606 OID 106470287)
-- Name: insumos insumos_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumos
    ADD CONSTRAINT insumos_pkey PRIMARY KEY (id);


--
-- TOC entry 4415 (class 2606 OID 106470373)
-- Name: items_compra items_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_compra
    ADD CONSTRAINT items_compra_pkey PRIMARY KEY (id);


--
-- TOC entry 4405 (class 2606 OID 106470333)
-- Name: items_requisicion items_requisicion_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_requisicion
    ADD CONSTRAINT items_requisicion_pkey PRIMARY KEY (id);


--
-- TOC entry 4359 (class 2606 OID 93099943)
-- Name: ordenes ordenes_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_pkey PRIMARY KEY (orden_id);


--
-- TOC entry 4361 (class 2606 OID 93099945)
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- TOC entry 4363 (class 2606 OID 93099947)
-- Name: preso_grado preso_grado_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.preso_grado
    ADD CONSTRAINT preso_grado_pkey PRIMARY KEY (id);


--
-- TOC entry 4365 (class 2606 OID 93099949)
-- Name: presos presos_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.presos
    ADD CONSTRAINT presos_pkey PRIMARY KEY (id);


--
-- TOC entry 4367 (class 2606 OID 93099951)
-- Name: producto_sabor producto_sabor_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.producto_sabor
    ADD CONSTRAINT producto_sabor_pkey PRIMARY KEY (id);


--
-- TOC entry 4369 (class 2606 OID 93099953)
-- Name: producto_sabor producto_sabor_producto_id_sabor_id_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.producto_sabor
    ADD CONSTRAINT producto_sabor_producto_id_sabor_id_key UNIQUE (producto_id, sabor_id);


--
-- TOC entry 4371 (class 2606 OID 93099955)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 4374 (class 2606 OID 93099957)
-- Name: productos_sentencias productos_sentencias_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_pkey PRIMARY KEY (id);


--
-- TOC entry 4376 (class 2606 OID 93099959)
-- Name: productos_sentencias productos_sentencias_sentencia_id_producto_id_sabor_id_tama_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_sentencia_id_producto_id_sabor_id_tama_key UNIQUE (sentencia_id, producto_id, sabor_id, tamano_id, ingrediente_id);


--
-- TOC entry 4385 (class 2606 OID 106470273)
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- TOC entry 4387 (class 2606 OID 106470275)
-- Name: proveedores proveedores_rfc_key; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_rfc_key UNIQUE (rfc);


--
-- TOC entry 4401 (class 2606 OID 106470319)
-- Name: requisiciones requisiciones_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.requisiciones
    ADD CONSTRAINT requisiciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4378 (class 2606 OID 93099961)
-- Name: sabores sabores_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.sabores
    ADD CONSTRAINT sabores_pkey PRIMARY KEY (id);


--
-- TOC entry 4381 (class 2606 OID 93099965)
-- Name: sentencias sentencias_pkey; Type: CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.sentencias
    ADD CONSTRAINT sentencias_pkey PRIMARY KEY (id);


--
-- TOC entry 4346 (class 1259 OID 93099966)
-- Name: idx_codigos_promocionales_codigo; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_codigos_promocionales_codigo ON public.codigos_promocionales USING btree (codigo);


--
-- TOC entry 4408 (class 1259 OID 106470404)
-- Name: idx_compras_fecha; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_compras_fecha ON public.compras USING btree (fecha_compra);


--
-- TOC entry 4409 (class 1259 OID 106470402)
-- Name: idx_compras_proveedor; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_compras_proveedor ON public.compras USING btree (proveedor_id);


--
-- TOC entry 4410 (class 1259 OID 106470403)
-- Name: idx_compras_usuario; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_compras_usuario ON public.compras USING btree (usuario_id);


--
-- TOC entry 4388 (class 1259 OID 106470397)
-- Name: idx_insumos_categoria; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_insumos_categoria ON public.insumos USING btree (categoria);


--
-- TOC entry 4389 (class 1259 OID 106470396)
-- Name: idx_insumos_nombre; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_insumos_nombre ON public.insumos USING btree (nombre);


--
-- TOC entry 4411 (class 1259 OID 106470405)
-- Name: idx_items_compra_compra; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_items_compra_compra ON public.items_compra USING btree (compra_id);


--
-- TOC entry 4412 (class 1259 OID 106470406)
-- Name: idx_items_compra_insumo; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_items_compra_insumo ON public.items_compra USING btree (insumo_id);


--
-- TOC entry 4413 (class 1259 OID 106470407)
-- Name: idx_items_compra_req_item; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_items_compra_req_item ON public.items_compra USING btree (requisicion_item_id);


--
-- TOC entry 4402 (class 1259 OID 106470401)
-- Name: idx_items_req_insumo; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_items_req_insumo ON public.items_requisicion USING btree (insumo_id);


--
-- TOC entry 4403 (class 1259 OID 106470400)
-- Name: idx_items_req_requisicion; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_items_req_requisicion ON public.items_requisicion USING btree (requisicion_id);


--
-- TOC entry 4357 (class 1259 OID 93099967)
-- Name: idx_ordenes_codigo_descuento_id; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_ordenes_codigo_descuento_id ON public.ordenes USING btree (codigo_descuento_id);


--
-- TOC entry 4372 (class 1259 OID 93099968)
-- Name: idx_productos_sentencias_sentencia_id; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_productos_sentencias_sentencia_id ON public.productos_sentencias USING btree (sentencia_id);


--
-- TOC entry 4382 (class 1259 OID 106470394)
-- Name: idx_proveedores_nombre; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_proveedores_nombre ON public.proveedores USING btree (nombre);


--
-- TOC entry 4383 (class 1259 OID 106470395)
-- Name: idx_proveedores_rfc; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_proveedores_rfc ON public.proveedores USING btree (rfc);


--
-- TOC entry 4398 (class 1259 OID 106470399)
-- Name: idx_requisiciones_completada; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_requisiciones_completada ON public.requisiciones USING btree (completada);


--
-- TOC entry 4399 (class 1259 OID 106470398)
-- Name: idx_requisiciones_usuario; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_requisiciones_usuario ON public.requisiciones USING btree (usuario_id);


--
-- TOC entry 4379 (class 1259 OID 93099969)
-- Name: idx_sentencias_activa; Type: INDEX; Schema: public; Owner: u3tobu994lm3di
--

CREATE INDEX idx_sentencias_activa ON public.sentencias USING btree (activa);


--
-- TOC entry 4449 (class 2620 OID 106470408)
-- Name: items_compra trigger_actualizar_requisicion; Type: TRIGGER; Schema: public; Owner: u3tobu994lm3di
--

CREATE TRIGGER trigger_actualizar_requisicion AFTER INSERT ON public.items_compra FOR EACH ROW WHEN ((new.requisicion_item_id IS NOT NULL)) EXECUTE FUNCTION public.actualizar_estado_requisicion();


--
-- TOC entry 4444 (class 2606 OID 106470356)
-- Name: compras compras_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- TOC entry 4445 (class 2606 OID 106470361)
-- Name: compras compras_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.empleados(id);


--
-- TOC entry 4416 (class 2606 OID 93099970)
-- Name: detalles_orden detalles_orden_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;


--
-- TOC entry 4417 (class 2606 OID 93099975)
-- Name: detalles_orden detalles_orden_ingrediente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- TOC entry 4418 (class 2606 OID 93099981)
-- Name: detalles_orden detalles_orden_orden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes(orden_id) ON DELETE CASCADE;


--
-- TOC entry 4419 (class 2606 OID 93099987)
-- Name: detalles_orden detalles_orden_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 4420 (class 2606 OID 93099995)
-- Name: detalles_orden detalles_orden_sabor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_sabor_id_fkey FOREIGN KEY (sabor_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- TOC entry 4421 (class 2606 OID 93100002)
-- Name: detalles_orden detalles_orden_tamano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT detalles_orden_tamano_id_fkey FOREIGN KEY (tamano_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- TOC entry 4422 (class 2606 OID 93100007)
-- Name: detalles_orden fk_detalles_orden_sentencia; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT fk_detalles_orden_sentencia FOREIGN KEY (sentencia_id) REFERENCES public.sentencias(id) ON DELETE SET NULL;


--
-- TOC entry 4423 (class 2606 OID 93100013)
-- Name: detalles_orden fk_detalles_orden_sentencia_padre; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.detalles_orden
    ADD CONSTRAINT fk_detalles_orden_sentencia_padre FOREIGN KEY (sentencia_detalle_orden_padre_id) REFERENCES public.detalles_orden(id) ON DELETE CASCADE;


--
-- TOC entry 4439 (class 2606 OID 106470299)
-- Name: insumo_proveedor insumo_proveedor_insumo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumo_proveedor
    ADD CONSTRAINT insumo_proveedor_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.insumos(id);


--
-- TOC entry 4440 (class 2606 OID 106470304)
-- Name: insumo_proveedor insumo_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.insumo_proveedor
    ADD CONSTRAINT insumo_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- TOC entry 4446 (class 2606 OID 106470374)
-- Name: items_compra items_compra_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_compra
    ADD CONSTRAINT items_compra_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id) ON DELETE CASCADE;


--
-- TOC entry 4447 (class 2606 OID 106470379)
-- Name: items_compra items_compra_insumo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_compra
    ADD CONSTRAINT items_compra_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.insumos(id);


--
-- TOC entry 4448 (class 2606 OID 106470384)
-- Name: items_compra items_compra_requisicion_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_compra
    ADD CONSTRAINT items_compra_requisicion_item_id_fkey FOREIGN KEY (requisicion_item_id) REFERENCES public.items_requisicion(id);


--
-- TOC entry 4442 (class 2606 OID 106470339)
-- Name: items_requisicion items_requisicion_insumo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_requisicion
    ADD CONSTRAINT items_requisicion_insumo_id_fkey FOREIGN KEY (insumo_id) REFERENCES public.insumos(id);


--
-- TOC entry 4443 (class 2606 OID 106470334)
-- Name: items_requisicion items_requisicion_requisicion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.items_requisicion
    ADD CONSTRAINT items_requisicion_requisicion_id_fkey FOREIGN KEY (requisicion_id) REFERENCES public.requisiciones(id) ON DELETE CASCADE;


--
-- TOC entry 4424 (class 2606 OID 93100019)
-- Name: ordenes ordenes_codigo_descuento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_codigo_descuento_id_fkey FOREIGN KEY (codigo_descuento_id) REFERENCES public.codigos_promocionales(id) ON DELETE SET NULL;


--
-- TOC entry 4425 (class 2606 OID 93100025)
-- Name: ordenes ordenes_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id) ON DELETE CASCADE;


--
-- TOC entry 4426 (class 2606 OID 93100030)
-- Name: ordenes ordenes_preso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_preso_id_fkey FOREIGN KEY (preso_id) REFERENCES public.presos(id) ON DELETE SET NULL;


--
-- TOC entry 4427 (class 2606 OID 93100035)
-- Name: pagos pagos_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id);


--
-- TOC entry 4428 (class 2606 OID 93100040)
-- Name: pagos pagos_orden_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES public.ordenes(orden_id) ON DELETE CASCADE;


--
-- TOC entry 4429 (class 2606 OID 93100045)
-- Name: preso_grado preso_grado_grado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.preso_grado
    ADD CONSTRAINT preso_grado_grado_id_fkey FOREIGN KEY (grado_id) REFERENCES public.grados(id) ON DELETE CASCADE;


--
-- TOC entry 4430 (class 2606 OID 93100050)
-- Name: preso_grado preso_grado_preso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.preso_grado
    ADD CONSTRAINT preso_grado_preso_id_fkey FOREIGN KEY (preso_id) REFERENCES public.presos(id) ON DELETE CASCADE;


--
-- TOC entry 4431 (class 2606 OID 93100055)
-- Name: producto_sabor producto_sabor_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.producto_sabor
    ADD CONSTRAINT producto_sabor_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 4432 (class 2606 OID 93100060)
-- Name: producto_sabor producto_sabor_sabor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.producto_sabor
    ADD CONSTRAINT producto_sabor_sabor_id_fkey FOREIGN KEY (sabor_id) REFERENCES public.sabores(id) ON DELETE CASCADE;


--
-- TOC entry 4433 (class 2606 OID 93100065)
-- Name: productos_sentencias productos_sentencias_ingrediente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_ingrediente_id_fkey FOREIGN KEY (ingrediente_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- TOC entry 4434 (class 2606 OID 93100070)
-- Name: productos_sentencias productos_sentencias_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 4435 (class 2606 OID 93100075)
-- Name: productos_sentencias productos_sentencias_sabor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_sabor_id_fkey FOREIGN KEY (sabor_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- TOC entry 4436 (class 2606 OID 93100080)
-- Name: productos_sentencias productos_sentencias_sentencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_sentencia_id_fkey FOREIGN KEY (sentencia_id) REFERENCES public.sentencias(id) ON DELETE CASCADE;


--
-- TOC entry 4437 (class 2606 OID 93100086)
-- Name: productos_sentencias productos_sentencias_tamano_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.productos_sentencias
    ADD CONSTRAINT productos_sentencias_tamano_id_fkey FOREIGN KEY (tamano_id) REFERENCES public.sabores(id) ON DELETE SET NULL;


--
-- TOC entry 4441 (class 2606 OID 106470320)
-- Name: requisiciones requisiciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.requisiciones
    ADD CONSTRAINT requisiciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.empleados(id);


--
-- TOC entry 4438 (class 2606 OID 93100091)
-- Name: sabores sabores_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: u3tobu994lm3di
--

ALTER TABLE ONLY public.sabores
    ADD CONSTRAINT sabores_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias_variantes(id) ON DELETE CASCADE;


--
-- TOC entry 4602 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: u3tobu994lm3di
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT CREATE ON SCHEMA public TO PUBLIC;


--
-- TOC entry 4604 (class 0 OID 0)
-- Dependencies: 284
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint); Type: ACL; Schema: public; Owner: rdsadmin
--

GRANT ALL ON FUNCTION public.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint) TO u3tobu994lm3di;


--
-- TOC entry 4269 (class 3466 OID 89740364)
-- Name: extension_before_drop; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER extension_before_drop ON ddl_command_start
   EXECUTE FUNCTION _heroku.extension_before_drop();


ALTER EVENT TRIGGER extension_before_drop OWNER TO heroku_admin;

--
-- TOC entry 4270 (class 3466 OID 89740366)
-- Name: log_create_ext; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER log_create_ext ON ddl_command_end
   EXECUTE FUNCTION _heroku.create_ext();


ALTER EVENT TRIGGER log_create_ext OWNER TO heroku_admin;

--
-- TOC entry 4271 (class 3466 OID 89740377)
-- Name: log_drop_ext; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER log_drop_ext ON sql_drop
   EXECUTE FUNCTION _heroku.drop_ext();


ALTER EVENT TRIGGER log_drop_ext OWNER TO heroku_admin;

--
-- TOC entry 4272 (class 3466 OID 89740378)
-- Name: validate_extension; Type: EVENT TRIGGER; Schema: -; Owner: heroku_admin
--

CREATE EVENT TRIGGER validate_extension ON ddl_command_end
   EXECUTE FUNCTION _heroku.validate_extension();


ALTER EVENT TRIGGER validate_extension OWNER TO heroku_admin;

-- Completed on 2025-07-01 17:46:15 UTC

--
-- PostgreSQL database dump complete
--

