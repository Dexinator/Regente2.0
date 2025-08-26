--
-- PostgreSQL database dump
--

\restrict SCqE8cIRxNQAABa3DeQa6AUqBiWOL327cHN8oAULP52BhUlfOmKosxdu3sBLbVz

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.10 (Debian 16.10-1.pgdg13+1)

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
-- Name: insumo_proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.insumo_proveedor_id_seq', 12, true);


--
-- Name: insumos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.insumos_id_seq', 218, true);


--
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: u3tobu994lm3di
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 29, true);


--
-- PostgreSQL database dump complete
--

\unrestrict SCqE8cIRxNQAABa3DeQa6AUqBiWOL327cHN8oAULP52BhUlfOmKosxdu3sBLbVz

