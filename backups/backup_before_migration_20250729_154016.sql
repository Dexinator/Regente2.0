--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Debian 16.9-1.pgdg120+1)
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
-- Data for Name: insumos; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.insumos (id, nombre, descripcion, categoria, unidad_medida_default, fecha_alta, activo, marca, cantidad_por_unidad) FROM stdin;
1	1 Lt. Botella	Por definir	Desechables	pieza	2025-05-15	t	Por definir	1.000
3	1/2 Lt. Botella	Por definir	Desechables	pieza	2025-05-17	t	Por definir	1.000
5	2 Lt. Botella	Por definir	Desechables	pieza	2025-05-19	t	Por definir	1.000
6	420 Beer	Por definir	Cerveza Artesanal	pieza	2025-05-20	t	Por definir	1.000
7	Abierta	Por definir	Proteína Animal	Kg	2025-05-21	t	Por definir	1.000
9	Aceitunas	Por definir	Botana	Por definir	2025-05-23	t	Por definir	1.000
11	Agua embotellada	Por definir	Gaseosas	pieza	2025-05-26	t	Por definir	1.000
12	Agua mineral	Por definir	Gaseosas	pieza	2025-05-27	t	Por definir	1.000
13	Aguamiel	Por definir	Pulquería	Kg	2025-05-28	t	Por definir	1.000
14	Ajo	Por definir	Verduras	Kg	2025-05-29	t	Por definir	1.000
15	Albahaca	Por definir	Condimentos	Kg	2025-05-30	t	Por definir	1.000
16	Apio	Por definir	Verduras	Por definir	2025-05-31	t	Por definir	1.000
17	Arándano	Por definir	Fruta	Kg	2025-06-01	t	Por definir	1.000
22	Bolsas P/ Salsa	Por definir	Desechables	Kg	2025-06-06	t	Por definir	1.000
24	C. Árbol	Por definir	Especias	NA	2025-06-08	t	Por definir	1.000
25	Chile Chilpetín	Por definir	Especias	Kg	2025-06-09	t	Por definir	1.000
26	Chile Chipotle	Por definir	Especias	Kg	2025-06-10	t	Por definir	1.000
27	Chile Habanero	Por definir	Verduras	Kg	2025-06-11	t	Por definir	1.000
28	Chile Poblano	Por definir	Verduras	Kg	2025-06-12	t	Por definir	1.000
29	Chile en Polvo	Por definir	Condimentos	Kg	2025-06-13	t	Por definir	1.000
30	Chile Xalapeño	Por definir	Verduras	Kg	2025-06-14	t	Por definir	1.000
32	Cacahuate Enchilado c/ Ajo	Por definir	Botana	Kg	2025-06-16	t	Por definir	1.000
34	Café Cafetera	Por definir	Especias	Kg	2025-06-18	t	Por definir	1.000
35	Café Sol.	Por definir	Especias	Kg	2025-06-19	t	Por definir	1.000
36	Canabico 42°	Por definir	Mezcal	Lt	2025-06-20	t	Por definir	1.000
37	Canela	Por definir	Condimentos	Kg	2025-06-21	t	Por definir	1.000
38	Carbón	Por definir	Herramientas	Kg	2025-06-22	t	Por definir	1.000
39	Cardamomo	Por definir	Condimentos	Kg	2025-06-23	t	Por definir	1.000
41	Carne p/ Árabe	Por definir	Proteína Animal	Kg	2025-06-25	t	Por definir	1.000
42	Carta Blanca	Por definir	Cerveza Popular	pieza	2025-06-26	t	Por definir	1.000
43	Cebolla	Por definir	Verduras	Kg	2025-06-29	t	Por definir	1.000
44	Champiñón	Por definir	Proteína Alternativa	Kg	2025-06-30	t	Por definir	1.000
45	Chapulines	Por definir	Proteína Alternativa	Kg	2025-07-01	t	Por definir	1.000
46	Charales	Por definir	Proteína Animal	Kg	2025-07-02	t	Por definir	1.000
49	Chorizo Argentino	Por definir	Proteína Animal	Kg	2025-07-05	t	Por definir	1.000
50	Churritos c/ Ajo	Por definir	Botana	gr	2025-07-06	t	Por definir	1.000
51	Cloro	Por definir	Limpieza	Lt	2025-07-07	t	Genérico	1.000
52	Coca retornable	Por definir	Gaseosas	pieza	2025-07-08	t	Por definir	1.000
53	Coca-Cola 	Por definir	Gaseosas	pieza	2025-07-09	t	Por definir	1.000
54	Colorantes	Por definir	Aditivos	Kg	2025-07-11	t	Por definir	1.000
55	Comino	Por definir	Especias	Kg	2025-07-12	t	Por definir	1.000
57	Corona	Por definir	Cerveza Popular	pieza	2025-07-14	t	Por definir	1.000
58	Destilado pulque 	Por definir	Bebidas Artesanales	Por definir	2025-07-17	t	Por definir	1.000
59	Detergente en Polvo	Por definir	Limpieza	Kg	2025-07-18	t	Roma	1.000
60	Dulces Tehuanos	Por definir	Dulces	bolsa	2025-07-19	t	Por definir	1.000
61	Elote	Por definir	Verduras	pieza	2025-07-20	t	Por definir	1.000
62	Epazote	Por definir	Especias	Kg	2025-07-21	t	Por definir	1.000
63	Esc. Arándano	Por definir	Aditivos	Kg	2025-07-22	t	Por definir	1.000
64	Esc. Uva	Por definir	Aditivos	Kg	2025-07-23	t	Por definir	1.000
65	Espadín 42°	Por definir	Mezcal	Lt	2025-07-24	t	Por definir	1.000
66	Espadín 49°	Por definir	Mezcal	Lt	2025-07-25	t	Por definir	1.000
68	Finca las Moras 	Por definir	Vino	pieza	2025-07-27	t	Por definir	1.000
69	Frijol Negro	Por definir	Proteína Vegetal	Kg	2025-07-29	t	Michigan	1.000
75	Galleta animalito	Por definir	Aditivos	Gr	2025-08-04	t	Por definir	1.000
76	Gas	Por definir	Herramientas	mes	2025-08-05	t	Por definir	1.000
78	Heroica Mutante	Por definir	Cerveza Artesanal	pieza	2025-08-07	t	Por definir	1.000
79	Hierbabuena	Por definir	Condimentos	Kg	2025-08-08	t	Por definir	1.000
80	Hoja de Aguacate	Por definir	Especias	Kg	2025-08-09	t	Por definir	1.000
81	Hoja de Pimienta	Por definir	Especias	Kg	2025-08-10	t	Por definir	1.000
82	Huitlacoche	Por definir	Proteína Alternativa	Kg	2025-08-11	t	Por definir	1.000
84	Imperial Stout	Por definir	Cerveza Artesanal	pieza	2025-08-13	t	Por definir	1.000
47	Chicharrón Harina Cuadrado	Por definir	Bases	pza	2025-07-03	t	Por definir	1.000
70	Frijoles Refritos	Frijoles negros hervidos y refritos.	Alimentos Procesados	l	2025-07-30	t	David Loro	1.000
2	Vaso liso 1 lt	Por definir	Desechables	bolsa	2025-05-16	t	Reyma	1.000
10	Agua Botella	Por definir	Bebida	pza	2025-05-25	t	Por definir	1.000
56	Contenedor Molletes Plástico	Por definir	Desechables	pieza	2025-07-13	t	Por definir	1.000
4	Vaso Liso 1/2 Lt	Por definir	Desechables	bolsa	2025-05-18	t	Reyma	1.000
71	Fruta Curado Carta	Por definir	Fruta	Kg	2025-07-31	t	Por definir	1.000
72	Fruta Curado Especial	Por definir	Fruta	Kg	2025-08-01	t	Por definir	1.000
73	Fruta Mezcal	Por definir	Fruta	Kg	2025-08-02	t	Por definir	1.000
31	Cacahuate crudo	Por definir	Granos	Kg	2025-06-15	t	Por definir	1.000
33	Cacao	Por definir	Granos	Kg	2025-06-17	t	Por definir	1.000
67	Fibra Metalica	Por definir	Limpieza	Pieza	2025-07-26	t	Por definir	1.000
85	Jabón Manos	Por definir	Limpieza	Lt	2025-08-14	t	Genérico	1.000
77	Pulpa de Guanábana 	Por definir	Pulpa	Kg	2025-08-06	t	Por definir	1.000
20	Bolsa de Té	Por definir	Bebida	pieza	2025-06-04	t	Por definir	1.000
21	Bolsa Hielo	Por definir	Bebida	Kg	2025-06-05	t	Por definir	1.000
18	Azucar	Por definir	Abarrotes y Despensa	Kg	2025-06-02	t	Por definir	1.000
8	Aceite	Por definir	Abarrotes y Despensa	Kg	2025-05-22	t	Por definir	1.000
19	Bicarbonato	Por definir	Abarrotes y Despensa	Kg	2025-06-03	t	Por definir	1.000
48	Chocolate abuelita 	Por definir	Abarrotes y Despensa	pieza	2025-07-04	t	Por definir	1.000
86	Jabón Trastes	Por definir	Limpieza	Lt	2025-08-15	t	Genérico	1.000
87	Jarabes	Por definir	Aditivos	Kg	2025-08-16	t	Por definir	1.000
88	Jitomate	Por definir	Verduras	Kg	2025-08-17	t	Por definir	1.000
89	Jugo maggi 	Por definir	Aditivos	ml	2025-08-18	t	Por definir	1.000
90	Laurel	Por definir	Especias	Kg	2025-08-19	t	Por definir	1.000
91	Lavanda	Por definir	Condimentos	Kg	2025-08-20	t	Por definir	1.000
92	Leche	Por definir	Lácteos	Lt	2025-08-21	t	Alpura	1.000
93	Lechuga	Por definir	Verduras	gr	2025-08-23	t	Por definir	1.000
94	Leviatán 	Por definir	Cerveza Artesanal	pieza	2025-08-24	t	Por definir	1.000
96	Limón	Por definir	Fruta	piezas	2025-08-26	t	Por definir	1.000
97	Limón Sin Semilla	Por definir	Fruta	piezas	2025-08-27	t	Por definir	1.000
98	Limpiador Aromatizante	Por definir	Limpieza	Lt	2025-08-28	t	Genérico	1.000
99	Lomo de Cabeza	Por definir	Proteína Animal	Kg	2025-08-29	t	Por definir	1.000
100	Luz	Por definir	Pagos	Mes	2025-08-30	t	Por definir	1.000
101	Manteca	Por definir	Aditivos	Kg	2025-08-31	t	Por definir	1.000
103	Mayo Vegana	Por definir	Aderezo	Lt	2025-09-02	t	Por definir	1.000
105	Miel	Por definir	Aditivos	Kg	2025-09-05	t	Por definir	1.000
106	Minerva Ipa	Por definir	Cerveza Artesanal	pieza	2025-09-07	t	Por definir	1.000
107	Minerva Stout	Por definir	Cerveza Artesanal	pieza	2025-09-08	t	Por definir	1.000
108	Mitre	Por definir	Mezcal	Ml	2025-09-09	t	Por definir	1.000
109	Negra Modelo	Por definir	Cerveza Célebre	pieza	2025-09-10	t	Por definir	1.000
110	Nopal	Por definir	Verduras	pieza	2025-09-12	t	Por definir	1.000
111	Ocote	Por definir	Herramientas	Pieza	2025-09-14	t	Por definir	1.000
112	Oregano	Por definir	Especias	gr	2025-09-15	t	Por definir	1.000
113	Pacífico Clara	Por definir	Cerveza Popular	pieza	2025-09-16	t	Por definir	1.000
114	Papel Estrasa	Por definir	Desechables	pieza	2025-09-20	t	Por definir	1.000
115	Papel Higienico	Por definir	Desechables	Pieza	2025-09-21	t	Kirkland	1.000
116	Paprika	Por definir	Especias	Kg	2025-09-22	t	Por definir	1.000
117	Pechuga 50°	Por definir	Mezcal	Lt	2025-09-23	t	Por definir	1.000
119	Perejil	Por definir	Especias	Kg	2025-09-25	t	Por definir	1.000
120	Pericón	Por definir	Condimentos	Kg	2025-09-26	t	Por definir	1.000
121	Piloncillo	Por definir	Aditivos	Kg	2025-09-27	t	Por definir	1.000
122	Pimienta Negra	Por definir	Especias	Kg	2025-09-28	t	Por definir	1.000
124	Pipian	Por definir	Proteína Vegetal	Kg	2025-09-30	t	Por definir	1.000
127	Plátano Macho	Por definir	Fruta	Kg	2025-10-03	t	Por definir	1.000
129	Pollo	Por definir	Proteína Animal	Kg	2025-10-05	t	Por definir	1.000
131	Porter	Por definir	Cerveza Artesanal	pieza	2025-10-07	t	Por definir	1.000
132	Pulque	Por definir	Pulquería	Lt	2025-10-08	t	Por definir	1.000
133	Q. Añejo	Por definir	Lácteos	Kg	2025-10-09	t	Por definir	1.000
134	Q. Gouda	Por definir	Lácteos	Kg	2025-10-10	t	Cono sur	1.000
135	Q. Hebra	Por definir	Lácteos	Kg	2025-10-11	t	Por definir	1.000
136	Q. Manchego	Por definir	Lácteos	Kg	2025-10-12	t	Por definir	1.000
137	Q. Nachos	Por definir	Lácteos	Kg	2025-10-14	t	Por definir	1.000
138	Q. Parmesano	Por definir	Lácteos	Kg	2025-10-15	t	Reggianito St, Clément	1.000
139	Q. Vegano	Por definir	Lácteos	gr	2025-10-16	t	Por definir	1.000
140	Reservado	Por definir	Vino	pieza	2025-10-17	t	Por definir	1.000
141	Semilla Cilantro	Por definir	Granos	Kg	2025-10-19	t	Por definir	1.000
142	Sal	Por definir	Especias	Kg	2025-10-20	t	Por definir	1.000
143	Salsa inglesa 	Por definir	Aditivos	Lt	2025-10-22	t	Por definir	1.000
144	Salsa Verde	Por definir	Alimentos Procesados	Kg	2025-10-23	t	Por definir	1.000
145	Sangría	Por definir	Gaseosas	piezas	2025-10-24	t	Por definir	1.000
146	Semilla de Cilantro	Por definir	Granos	Kg	2025-10-25	t	Por definir	1.000
147	Servilleta	Por definir	Desechables	bolsa	2025-10-26	t	Por definir	1.000
148	Sirena	Por definir	Cerveza Artesanal	pieza	2025-10-27	t	Por definir	1.000
149	Stella Artois	Por definir	Cerveza Célebre	pieza	2025-10-28	t	Por definir	1.000
150	Tajin	Por definir	Aditivos	gr	2025-10-30	t	Por definir	1.000
152	Tequesquite	Por definir	Especias	Kg	2025-11-01	t	Por definir	1.000
153	Tlalitos	Por definir	Proteína Animal	Kg	2025-11-02	t	Por definir	1.000
154	Toalla Interdoblada Institucional	Por definir	Desechables	Pieza	2025-11-04	t	Greymoon	1.000
155	Tocino	Por definir	Proteína Animal	Kg	2025-11-05	t	Por definir	1.000
156	Tomillo	Por definir	Especias	gr	2025-11-06	t	Por definir	1.000
157	Torito de Guanabana	Por definir	Bebidas Artesanales	pieza	2025-11-07	t	Por definir	1.000
158	Torito de Jobo	Por definir	Bebidas Artesanales	pieza	2025-11-08	t	Por definir	1.000
159	Torta	Por definir	Bases	pieza	2025-11-09	t	Por definir	1.000
160	Tortillas	Por definir	Bases	Kg	2025-11-10	t	Por definir	1.000
161	Tostadas	Por definir	Bases	Pieza	2025-11-11	t	Por definir	1.000
162	Totopos	Por definir	Bases	gr	2025-11-12	t	Por definir	1.000
163	Trabajo Cocinero	Por definir	Pagos	Mes	2025-11-13	t	Por definir	1.000
164	Tutti Frutti	Por definir	Gaseosas	pieza	2025-11-14	t	Por definir	1.000
165	Vainilla	Por definir	Condimentos	Lt	2025-11-15	t	Por definir	1.000
166	Victoria	Por definir	Cerveza Popular	pieza	2025-11-16	t	Por definir	1.000
167	Vinagre Blanco	Por definir	Especias	Lt	2025-11-19	t	Por definir	1.000
168	Vinagre Manzana	Por definir	Especias	Lt	2025-11-20	t	Por definir	1.000
171	Ingredientes Molletes Sencillos	Por definir	Por definir	pieza	2025-11-23	t	Por definir	1.000
126	Plátano Cocido	Plátano Macho Asado	Alimentos Procesados	gr	2025-10-02	t	Por definir	1.000
130	Pollo DLC	Pierna y muslo de pollo macerado en especias y hervido.	Alimentos Procesados	Kg	2025-10-06	t	David Loro	1.000
151	Tapas Lt Reyma	Por definir	Desechables	bolsa	2025-10-31	t	Reyma	1.000
102	Manzana	Por definir	Fruta	Kg	2025-09-01	t	Por definir	1.000
123	Piña	Por definir	Fruta	pieza	2025-09-29	t	Por definir	1.000
128	Plátano Tabasco	Por definir	Fruta	kg	2025-10-04	t	Por definir	1.000
118	Pepita de Calabaza	Por definir	Granos	Kg	2025-09-24	t	Por definir	1.000
172	Chile Verde	Por definir	Verduras	Kg	2025-11-24	t	Por definir	1.000
170	Cilantro	Por definir	Verduras	Kg	2025-11-22	t	Por definir	1.000
169	Vino Caja Lt	Por definir	Vino	l	2025-11-21	t	Don Simón	1.000
175	Finca las Moras Malbec	Por definir	Vino	pieza	2025-11-27	t	Por definir	1.000
176	Reservado Merlot	Por definir	Vino	pieza	2025-11-29	t	Por definir	1.000
177	Reservado Rosado	Por definir	Vino	pza	2025-11-30	t	Por definir	1.000
178	Promedio Vino	Por definir	Por definir	ml	2025-12-02	t	Por definir	1.000
179	Ingrediente Promedio	Por definir	Por definir	Kg	2025-12-03	t	Por definir	1.000
182	Refresco promedio	Por definir	Por definir	piezas	2025-12-06	t	Por definir	1.000
183	Prefermento Temporada	Por definir	Por definir	ml	2025-12-07	t	Por definir	1.000
184	Prefermento Carta	Por definir	Por definir	ml	2025-12-08	t	Por definir	1.000
185	Prefermento Especial	Por definir	Por definir	ml	2025-12-09	t	Por definir	1.000
180	Champiñón Cocinado	Por definir	Alimentos Procesados	Kg	2025-12-04	t	Por definir	1.000
173	Chicharron Preparado	Por definir	Alimentos Procesados	Por definir	2025-11-25	t	Por definir	1.000
181	Chileatole	Por definir	Alimentos Procesados	Kg	2025-12-05	t	Por definir	1.000
174	Maíz Palomero	Por definir	Granos	Kg	2025-11-26	t	Por definir	1.000
104	Mayonesa McCormick con Jugo de Limones 3.4 Kg	Envase de 3.4kg	Aderezo	Lt	2025-09-03	t	McCormick	1.000
95	Licor Blanco 50lts.	Licor de Caña de Mahuixtlán, Veracruz.\n	Aditivos	pza	2025-08-25	t	El Cañero	1.000
186	Licor 96% 	Licor de Caña de grado de 96% traido de Tlacotalpan, Ver.	Aditivos	l	2025-07-03	t	Artesanal	1.000
83	Huitlacoche Cocinado	Huitlachoche refrito	Alimentos Procesados	kg	2025-08-12	t	David Loro	1.000
40	Carne Árabe	Lomo de cabeza de cerdo marinado con especias y cocinado.	Alimentos Procesados	l	2025-06-24	t	David Loro	1.000
125	Pipián Tostado	Pepita de calabaza tostada y molida en molcajete con sal.	Alimentos Procesados	gr	2025-10-01	t	Por definir	1.000
187	Champiñones Cocinados	Champiñones cocinados en especias.		unidad	2025-07-03	t	David Loro	1.000
188	Chorizo Argentino Cocinado	Chorizo argentino cocinado con especias.		unidad	2025-07-03	t	David Loro	1.000
189	Agua Garrafón		Bebida	unidad	2025-07-03	t		1.000
190	Agua Garrafón Extra	Garraón extra caro	Bebida	unidad	2025-07-03	t		1.000
191	Tepache	Tepache preparado en casa.	Bebidas Artesanales	l	2025-07-03	t	Tepachulo	1.000
192	Contenedor Nachos Plástico		Desechables	unidad	2025-07-03	t		1.000
193	Jaleas de Tejocote	Hechas artesanalmente en el centro de Puebla. Compradas a granel en dulcería del centro	Dulces	kg	2025-07-03	t		1.000
194	Chipiletas		Dulces	unidad	2025-07-03	t		1.000
74	Fruta Curado Temporada	Fruta de la que se compra mucha a bajo precio para que funja como el sabor del curado de temporada	Fruta	Kg	2025-08-03	t	Por definir	1.000
195	Internet		Pagos	unidad	2025-07-03	t		1.000
196	Agua, Drenaje y Saneamiento		Pagos	unidad	2025-07-03	t		1.000
197	Refrendo Licencia de Funcionamiento		Pagos	unidad	2025-07-03	t		1.000
198	Carpeta de Protección Civil		Pagos	unidad	2025-07-03	t		1.000
199	Pulpa de Maracuyá		Pulpa	unidad	2025-07-03	t		1.000
23	Botanera	Por definir	Abarrotes y Despensa	Lt	2025-06-07	t	Por definir	1.000
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.proveedores (id, nombre, rfc, direccion, telefono, email, contacto_nombre, fecha_alta, activo, dias_compra) FROM stdin;
1	Bodega Carmen		C. 2 Ote. 817, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.	222 533 9251		Monserrat López	2025-07-06	\N	["miercoles","sabado"]
23	Bodega Carmen	lord	C. 2 Ote. 817, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.	221 533 9251		Monserrat López	2025-07-06	\N	["jueves"]
27	Bodega Carmen	XXX	C. 2 Ote. 817, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.	221 533 9251		Monserrat López	2025-07-06	t	["miercoles"]
29	Carnicería Fernanda	XXXX999999XX9	Locales 35, 35 y 36. Mercado de San Pedro	2271169097	lala@lala.com	Fernanda	2025-07-06	t	["miercoles"]
26	Pulque Don Seve	XXXX999999XX8	Prol. de la 15 Ote. 4, Michatenco, 72823 Pue.	221 595 3594	123@123.com	don seve	2025-07-06	\N	["jueves","viernes","sabado"]
30	La Pastora	1234	123	123	123@lele.com	laslala	2025-07-06	t	["miercoles"]
32	Don Seve	aaa	aoqen	1234567	i@i.com	Seve	2025-07-06	\N	["martes","domingo"]
\.


--
-- Data for Name: insumo_proveedor; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.insumo_proveedor (id, insumo_id, proveedor_id, precio_referencia) FROM stdin;
\.


--
-- Name: insumo_proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.insumo_proveedor_id_seq', 1, false);


--
-- Name: insumos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.insumos_id_seq', 218, true);


--
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 33, true);


--
-- PostgreSQL database dump complete
--

