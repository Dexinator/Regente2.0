--
-- PostgreSQL database dump
--

\restrict aiVcnBddyAzbuILNAjTA7j2LT7koTtwGPdZLKEszZlqzmUgaD6qQZwfzyHQNURG

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
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
-- Data for Name: insumos; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.insumos VALUES (1, '1 Lt. Botella', 'Botella para llevar pulque', 'Desechables', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (2, 'Vaso liso 1 lt', 'Vaso de uso y p llevar', 'Desechables', 'bolsa', '2025-01-01', true, 'Reyma', 1.000);
INSERT INTO public.insumos VALUES (3, '1/2 Lt. Botella', 'Botella para llevar pulque', 'Desechables', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (4, 'Vaso Liso 1/2 Lt', 'Vaso de uso y p llevar', 'Desechables', 'bolsa', '2025-01-01', true, 'Reyma', 1.000);
INSERT INTO public.insumos VALUES (5, '2 Lt. Botella', 'Botella para llevar pulque', 'Desechables', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (6, '420 Beer', 'Cerveza Cannabica', 'Cerveza Artesanal', '6 Piezas', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (7, 'Cabeza de Lomo', 'Carne base de la carne árabe', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (8, 'Aceite 5Lts', 'Galón de 5 Lts', 'Suministros', 'Litro', '2025-01-01', true, 'Impperial', 1.000);
INSERT INTO public.insumos VALUES (9, 'Aceitunas', 'Por definir', 'Botana', 'Por definir', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (10, 'Agua Botella', 'Por definir', 'Bebidas y Gaseosas', 'pza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (11, 'Agua embotellada', 'Por definir', 'Bebidas y Gaseosas', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (12, 'Agua Mineral Botella 355 Ml', 'Por definir', 'Bebidas y Gaseosas', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (13, 'Aguamiel', 'Por definir', 'Pulquería', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (14, 'Ajo', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (15, 'Albahaca', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (16, 'Apio', 'Por definir', 'Frutas y Verduras', 'Por definir', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (17, 'Arándano', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (18, 'Azucar', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (19, 'Bicarbonato', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (20, 'Bolsa de té', 'Por definir', 'Bebidas y Gaseosas', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (21, 'Bolsa Hielo', 'Por definir', 'Bebidas y Gaseosas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (22, 'Bolsas P/ Salsa', 'Por definir', 'Desechables', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (23, 'Salsa Botanera', 'Galón de 4 Lts', 'Suministros', 'unidad', '2025-01-01', true, 'La Botanera', 1.000);
INSERT INTO public.insumos VALUES (24, 'Chile de Árbol', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', false, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (25, 'Chile Chiltepín', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', false, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (26, 'Chile Chipotle', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (27, 'Chile Habanero', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (28, 'Chile Poblano', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (29, 'Chile en Polvo', 'Por definir', 'Suministros', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (30, 'Chile Xalapeño', 'Tambien conocido como cuaresmeño', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (31, 'Cacahuate crudo', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (32, 'Cacahuate Enchilado c/ Ajo', '2x Bolsa de 500gr', 'Botana', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (33, 'Cacao', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (34, 'Café en Grano', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (35, 'Café Soluble', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (36, 'Mezcal Canábico lt', 'precio por litro', 'Mezcal', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (37, 'Canela', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (38, 'Carbón', 'Por definir', 'Suministros', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (39, 'Cardamomo', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (40, 'Carne Árabe', 'Carne de cerdo marinada con especias y cocinada', 'Alimentos Preparados', 'kg', '2025-01-01', true, 'David Loro', 1.000);
INSERT INTO public.insumos VALUES (41, 'Abierta de Cerdo', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (42, 'Carta Blanca', 'Por definir', 'Cerveza Comercial', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (43, 'Cebolla', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (44, 'Champiñón', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', false, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (45, 'Chapulines', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (46, 'Charales', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (47, 'Chicharrín de harina cuadrado', 'base de Chicharrín preparado', 'Bases', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (48, 'Chocolate abuelita Caja', 'Caja c/ 6 oz', 'Suministros', 'unidad', '2025-01-01', true, 'Abuelita', 1.000);
INSERT INTO public.insumos VALUES (49, 'Chorizo Argentino', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (50, 'Churritos c/ Ajo', '2x Bolsa de 500gr', 'Botana', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (51, 'Cloro', 'Por definir', 'Limpieza', 'Lt', '2025-01-01', true, 'A granel', 1.000);
INSERT INTO public.insumos VALUES (52, 'Coca-Cola Retornable 3 Lts', 'Por definir', 'Bebidas y Gaseosas', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (53, 'Coca-Cola Botella 355 Ml', 'Por definir', 'Bebidas y Gaseosas', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (54, 'Colorantes', 'Por definir', 'Suministros', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (55, 'Comino', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (56, 'Contenedor Molletes PlÃ¡stico', 'Por definir', 'Desechables', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (57, 'Corona', 'Por definir', 'Cerveza Comercial', '24 Piezas', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (58, 'Destilado pulque ', 'Por definir', 'Bebidas Artesanales', 'Por definir', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (59, 'Detergente en Polvo', 'Por definir', 'Limpieza', 'Kg', '2025-01-01', true, 'Roma', 1.000);
INSERT INTO public.insumos VALUES (60, 'Dulces Tehuanos', 'Por definir', 'Dulces', 'bolsa', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (61, 'Elote', 'Por definir', 'Frutas y Verduras', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (62, 'Epazote', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (63, 'Esencia de Arándano', 'Por definir', 'Suministros', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (64, 'Esencia de Uva', 'Por definir', 'Suministros', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (65, 'Mezcal Espadín 42°', 'Por definir', 'Mezcal', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (66, 'Mezcal Espadín 49°', 'Por definir', 'Mezcal', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (67, 'Fibra Metalica', 'Por definir', 'Limpieza', 'Pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (68, 'Finca las Moras ', 'Vino', 'Bebidas y Gaseosas', '6 Piezas', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (69, 'Frijol Negro', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Michigan', 1.000);
INSERT INTO public.insumos VALUES (70, 'Frijoles Refritos', 'Frijoles negros hervidos y refritos.', 'Alimentos Preparados', 'l', '2025-01-01', true, 'David Loro', 1.000);
INSERT INTO public.insumos VALUES (71, 'Fruta Curado Carta', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (72, 'Fruta Curado Especial', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (73, 'Fruta Mezcal', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (74, 'Fruta Curado Temporada', 'Fruta de la que se compra mucha a bajo precio para que funja como el sabor del curado de temporada', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (75, 'Galleta animalito', 'Por definir', 'Suministros', 'Gr', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (76, 'Gas', 'Por definir', 'Suministros', 'mes', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (77, 'Pulpa de Guanábana ', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (78, 'Heroica Mutante', 'Por definir', 'Cerveza Artesanal', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (79, 'Hierbabuena', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (80, 'Hoja de Aguacate', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (81, 'Hoja de Pimienta', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (82, 'Huitlacoche', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (83, 'Huitlacoche Cocinado', 'Huitlachoche refrito', 'Alimentos Preparados', 'kg', '2025-01-01', true, 'David Loro', 1.000);
INSERT INTO public.insumos VALUES (84, 'Imperial Stout', 'Por definir', 'Cerveza Artesanal', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (85, 'Jabón Manos', 'Por definir', 'Limpieza', 'Lt', '2025-01-01', true, 'A granel', 1.000);
INSERT INTO public.insumos VALUES (86, 'Jabón Trastes', 'Por definir', 'Limpieza', 'Lt', '2025-01-01', true, 'A granel', 1.000);
INSERT INTO public.insumos VALUES (87, 'Jarabes', 'Por definir', 'Suministros', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (88, 'Jitomate', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (89, 'Jugo Maggi 800ml', 'Botella 800ml', 'Suministros', 'unidad', '2025-01-01', true, 'Maggi', 1.000);
INSERT INTO public.insumos VALUES (90, 'Laurel', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (91, 'Lavanda', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (92, 'Leche Alpura Deslactosada', 'Caja individual', 'Lácteos', 'Lt', '2025-01-01', true, 'Alpura', 1.000);
INSERT INTO public.insumos VALUES (93, 'Lechuga China', 'Por definir', 'Frutas y Verduras', 'Pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (94, 'Leviatán', 'Por definir', 'Cerveza Artesanal', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (95, 'Licor Blanco 50lts.', 'Licor de Caña de Mahuixtlán, Veracruz.
', 'Bebidas Artesanales', 'Lt', '2025-01-01', true, 'El Cañero', 1.000);
INSERT INTO public.insumos VALUES (96, 'Limón C/Semilla', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (97, 'Limón S/Semilla', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (98, 'Limpiador Aromatizante', 'Por definir', 'Limpieza', 'Lt', '2025-01-01', true, 'A granel', 1.000);
INSERT INTO public.insumos VALUES (99, 'Mamey', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (100, 'Luz', 'Por definir', 'Pagos', 'Mes', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (101, 'Manteca', 'Por definir', 'Suministros', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (102, 'Manzana', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (103, 'Mayo Vegana', 'Por definir', 'Suministros', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (104, 'Mayonesa McCormick con Jugo de Limones 3.4 Kg', 'Envase de 3.4kg', 'Suministros', 'Lt', '2025-01-01', true, 'McCormick', 1.000);
INSERT INTO public.insumos VALUES (105, 'Miel', 'Por definir', 'Suministros', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (106, 'Minerva Ipa', 'Por definir', 'Cerveza Artesanal', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (107, 'Minerva Stout', 'Por definir', 'Cerveza Artesanal', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (108, 'Mezcal Mitre Espadín', 'Por definir', 'Mezcal', 'Ml', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (109, 'Negra Modelo', 'Por definir', 'Cerveza Comercial', '12 Piezas', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (110, 'Nopal', 'Por definir', 'Frutas y Verduras', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (111, 'Ocote', 'Por definir', 'Suministros', 'Pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (112, 'Oregano', 'Por definir', 'Especias y Condimientos', 'gr', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (113, 'Pacífico Clara', 'Por definir', 'Cerveza Comercial', '24 Piezas', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (114, 'Papel Estrasa Rosa', 'Color Rosa', 'Desechables', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (115, 'Papel Higienico', 'Por definir', 'Desechables', 'Pieza', '2025-01-01', true, 'Kirkland', 1.000);
INSERT INTO public.insumos VALUES (116, 'Paprika', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (117, 'Mezcal de Pechuga 50°', 'Por definir', 'Mezcal', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (118, 'Pepita de Calabaza', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (119, 'Perejil', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (120, 'Pericón', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (121, 'Piloncillo', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (122, 'Pimienta Negra', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (123, 'Piña', 'Por definir', 'Frutas y Verduras', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (124, 'Pipian', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (125, 'Pipián Tostado', 'Pepita de calabaza tostada y molida en molcajete con sal.', 'Alimentos Preparados', 'gr', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (126, 'Plátano Horneado', 'Plátano macho horneado', 'Alimentos Preparados', 'gr', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (127, 'Plátano Macho', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (128, 'Plátano Tabasco', 'Por definir', 'Frutas y Verduras', 'kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (129, 'Pollo Crudo (pierna y muslo)', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (130, 'Pollo DLC', 'Pierna y muslo de pollo macerado en especias y hervido.', 'Alimentos Preparados', 'Kg', '2025-01-01', true, 'David Loro', 1.000);
INSERT INTO public.insumos VALUES (131, 'Porter', 'Por definir', 'Cerveza Artesanal', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (132, 'Pulque', 'Por definir', 'Pulquería', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (133, 'Queso Añejo', 'Por definir', 'Lácteos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (134, 'Queso Gouda Connosur', 'Por definir', 'Lácteos', 'Kg', '2025-01-01', true, 'Cono sur', 1.000);
INSERT INTO public.insumos VALUES (135, 'Queso de Hebra', 'Por definir', 'Lácteos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (136, 'Q. Manchego', 'Por definir', 'Lácteos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (137, 'Queso P/Nachos Biolac', 'Imitación de queso liquido', 'Lácteos', 'Lt', '2025-01-01', true, 'Biolac', 1.000);
INSERT INTO public.insumos VALUES (138, 'Q. Parmesano', 'Por definir', 'Lácteos', 'Kg', '2025-01-01', true, 'Reggianito St. Clément', 1.000);
INSERT INTO public.insumos VALUES (139, 'Q. Vegano', 'Por definir', 'Lácteos', 'gr', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (140, 'Reservado', 'Vino', 'Bebidas y Gaseosas', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (141, 'Semilla Cilantro', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (142, 'Sal', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (143, 'Salsa inglesa  980ml', 'Botella 980ml', 'Suministros', 'unidad', '2025-01-01', true, 'Crosse & Blackwell', 1.000);
INSERT INTO public.insumos VALUES (144, 'Salsa Verde', 'Salsa de la casa', 'Alimentos Preparados', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (145, 'Sangría Casera Refresco', 'Por definir', 'Bebidas y Gaseosas', 'piezas', '2025-01-01', true, 'Sangría Casera', 1.000);
INSERT INTO public.insumos VALUES (146, 'Semilla de Cilantro', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (147, 'Servilleta Familiar Café', 'Unidad de 400pz', 'Desechables', 'unidad', '2025-01-01', true, 'Familiar', 1.000);
INSERT INTO public.insumos VALUES (148, 'Sirena', 'Por definir', 'Cerveza Artesanal', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (149, 'Stella Artois', 'Por definir', 'Cerveza Comercial', '24 Piezas', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (150, 'Chile En Polvo Tajin', 'Por definir', 'Suministros', 'gr', '2025-01-01', true, 'Tajin', 1.000);
INSERT INTO public.insumos VALUES (151, 'Tapas Lt Reyma', 'Por definir', 'Desechables', 'bolsa', '2025-01-01', true, 'Reyma', 1.000);
INSERT INTO public.insumos VALUES (152, 'Tequesquite', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (153, 'Tlalitos', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (154, 'Toalla Interdoblada Institucional', 'Por definir', 'Desechables', 'Pieza', '2025-01-01', true, 'Greymoon', 1.000);
INSERT INTO public.insumos VALUES (155, 'Tocino Ahumado', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (156, 'Tomillo', 'Por definir', 'Especias y Condimientos', 'gr', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (157, 'Torito de Guanabana', 'Por definir', 'Bebidas Artesanales', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (158, 'Torito de Jobo', 'Por definir', 'Bebidas Artesanales', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (159, 'Torta de Agua', 'Base de los molletes', 'Bases', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (160, 'Tortillas', 'Por definir', 'Bases', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (161, 'Tostadas', 'Por definir', 'Bases', 'Pieza', '2025-01-01', true, 'Very', 1.000);
INSERT INTO public.insumos VALUES (162, 'Totopos', 'Por definir', 'Bases', 'gr', '2025-01-01', true, 'Very', 1.000);
INSERT INTO public.insumos VALUES (163, 'Trabajo Cocinero', 'Por definir', 'Pagos', 'Mes', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (164, 'Tutti Frutti Refresco', 'Por definir', 'Bebidas y Gaseosas', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (165, 'Vainilla 500ml', 'Botella 500ml', 'Suministros', 'unidad', '2025-01-01', true, 'Sayes', 1.000);
INSERT INTO public.insumos VALUES (166, 'Victoria', 'Por definir', 'Cerveza Comercial', '24 Piezas', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (167, 'Vinagre Blanco 1lt', 'Por definir', 'Especias y Condimientos', 'Lt', '2025-01-01', true, 'Clemente', 1.000);
INSERT INTO public.insumos VALUES (168, 'Vinagre Manzana', 'Por definir', 'Especias y Condimientos', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (169, 'Vino Caja Lt', 'Vino', 'Bebidas y Gaseosas', 'Lt', '2025-01-01', true, 'Don Simón', 1.000);
INSERT INTO public.insumos VALUES (170, 'Cilantro', 'Por definir', 'Frutas y Verduras', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (171, 'Ingredientes Molletes Sencillos', 'Por definir', 'Por definir', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (172, 'Pollo Crudo (Pechuga)', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (173, 'Chicharrón Natural', 'tlalitos cortado ', 'Alimentos Preparados', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (174, 'Maíz Palomero', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (175, 'Finca las Moras Malbec', 'Vino', 'Bebidas y Gaseosas', '6 Piezas', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (176, 'Reservado Merlot', 'Vino', 'Bebidas y Gaseosas', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (177, 'Reservado Rosado', 'Vino', 'Bebidas y Gaseosas', 'pza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (178, 'Promedio Vino', 'Por definir', 'Por definir', 'ml', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (179, 'Ingrediente Promedio', 'Por definir', 'Por definir', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (180, 'Champiñón Cocinado', 'Champiñones cocinados con especias', 'Alimentos Preparados', 'Kg', '2025-01-01', false, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (181, 'Chileatole', 'Chileatole casero', 'Alimentos Preparados', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (182, 'Refresco promedio', 'Por definir', 'Por definir', 'piezas', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (183, 'Prefermento Temporada', 'Por definir', 'Por definir', 'ml', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (184, 'Prefermento Carta', 'Por definir', 'Por definir', 'ml', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (185, 'Prefermento Especial', 'Por definir', 'Por definir', 'ml', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (186, 'Licor 96% ', 'Licor de Caña de grado de 96% traido de Tlacotalpan, Ver.', 'Bebidas Artesanales', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (187, 'Champiñones Cocinados', 'Champiñones cocinados en especias.', 'Alimentos Preparados', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (188, 'Chorizo Argentino Cocinado', 'Chorizo argentino cocinado con especias.', 'Alimentos Preparados', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (189, 'Agua Garrafón', 'Agua de garrafon', 'Bebidas y Gaseosas', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (190, 'Agua Garrafón Extra', 'Garrafón extra caro', 'Bebidas y Gaseosas', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (191, 'Tepache', 'Tepache preparado en casa.', 'Alimentos Preparados', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (192, 'Contenedor Nachos Plástico', 'Contenedor Nachos Plástico', 'Desechables', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (193, 'Jaleas de Tejocote', 'Hechas artesanalmente en el centro de Puebla. Compradas a granel en dulcerÃ­a del centro', 'Dulces', 'kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (194, 'Chipiletas', 'Por definir', 'Dulces', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (195, 'Internet', 'Por definir', 'Pagos', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (196, 'Agua, Drenaje y Saneamiento', 'Por definir', 'Pagos', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (197, 'Refrendo Licencia de Funcionamiento', 'Por definir', 'Pagos', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (198, 'Carpeta de Protección Civil', 'Por definir', 'Pagos', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (199, 'Pulpa de Maracuyá', 'Por definir', 'Especias y Condimientos', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (200, 'Chicharrón Chile y Cebolla', 'Tlalito cortado con chile y cebolla', 'Alimentos Preparados', 'kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (202, 'Azucar Moscabado', 'Por definir', 'Especias y Condimientos', 'Kg', '2025-01-01', true, 'Dominó', 1.000);
INSERT INTO public.insumos VALUES (203, 'Pulque de Punta', 'Por definir', 'Pulquería', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (204, 'Coca-Cola Lata 355 Ml', 'Por definir', 'Bebidas y Gaseosas', 'Pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (205, 'Agua Mineral 2 Lts', 'Por definir', 'Bebidas y Gaseosas', 'Pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (206, 'Hidromiel', 'Por definir', 'Cerveza Artesanal', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (207, 'Hidromiel de Café', 'Por definir', 'Cerveza Artesanal', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (208, 'Mantarraya', 'Por definir', 'Cerveza Artesanal', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (209, 'Agua de Garrafón con Envase', 'Por definir', 'Bebidas y Gaseosas', 'pieza', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (210, 'Mezcal Canábico Mayoreo', 'Precio mayoreo', 'Mezcal', 'Lt', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (211, 'Chistorra', 'Por definir', 'Proteínas', 'Kg', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (212, 'Licor Blanco & Envase 50lts.', 'Licor de Caña de grado de 96% traido de Mahuixtlán, Ver.', 'Bebidas Artesanales', 'Lt', '2025-01-01', true, 'El Cañero', 1.000);
INSERT INTO public.insumos VALUES (213, 'Transporte de Insumos', 'Costo pagado por transportar insumos hacia EPN', 'Suministros', 'unidad', '2025-01-01', true, 'Por definir', 1.000);
INSERT INTO public.insumos VALUES (214, 'Guantes Latex', 'Por definir', 'Limpieza', 'Pieza', '2025-01-01', true, 'Genérico', 1.000);
INSERT INTO public.insumos VALUES (215, 'Esponja', 'Por definir', 'Limpieza', 'Pieza', '2025-01-01', true, 'Genérico', 1.000);
INSERT INTO public.insumos VALUES (216, 'Estropajo Loza', 'Por definir', 'Limpieza', 'Pieza', '2025-01-01', true, 'Genérico', 1.000);
INSERT INTO public.insumos VALUES (217, 'Queso p/Nachos Rancherito', 'Imitación de queso liquido', 'Lácteos', 'Lt', '2025-01-01', true, 'Rancherito', 1.000);
INSERT INTO public.insumos VALUES (218, 'Tarugos', 'Dulces de chamoy', 'Dulces', 'kg', '2025-01-01', true, 'Por definir', 1.000);


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.proveedores VALUES (1, 'Pulque Don Seve', '1', 'Prol. de la 15 Ote. 4, Michatenco, 72823 Pue.', '221 595 3594', '', 'Don Severino', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (2, 'Bodega Carmen', '2', 'C. 2 Ote. 817, Santiago Xicotenco, 72810 San AndrÃ©s Cholula, Pue.', '222 533 9251', '', 'Monserrat López', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (3, 'La Pastora', '3', 'Servi Plaza Momoxpan, Bello Horizonte, 72754 Heroica Puebla de Zaragoza, Pue.', '222 238 4759', '', '', '2025-01-01', false, NULL);
INSERT INTO public.proveedores VALUES (4, 'Frutería Cecilia y Lucero', '4', 'Av. Maximino A. Camacho 1214 A, Centro, 72810 San Andrés Cholula, Pue.', '221 387 4858', '', 'Pascual & Liliana', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (5, 'Walmart', '5', '', '', '', '', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (6, '', '6', '', '', '', '', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (7, 'Depósito Rosato', '7', 'C. 2 Sur, Centro San Andrés Cholula, 72810 San Andrés Cholula, Pue.', '', '', '', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (8, 'Miscelanea Susy', '8', 'C. 3 Ote. 405, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.', '', '', '', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (9, 'El Bosque Pulque Puro', '9', 'A Domicilio', '222 788 0637', '', 'Yeyo', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (10, 'Deposito Las Torres', '10', 'Calle 8 Nte 607, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.', '', '', 'Doña Susana', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (11, 'Erika Tepache Real', '11', 'A Domicilio', '556 630 3873', '', 'Erika', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (12, '420 Beer', '12', 'A Domicilio', '222 162 5958', '', 'Diego Palacios', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (13, 'Yurnel', '13', 'A Domicilio', '221 272 4557', '', 'Manu Arcant', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (14, 'El Cañero', '14', 'A Domicilio - Xalapa', '228 274 5724', '', 'Óscar David Carrera Sánchez', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (15, 'Cervecería Tiburón', '15', 'A Domicilio - Xalapa', '228 138 0248', '', 'Rafael', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (16, 'Toritos Dayra', '16', 'A Domicilio - Xalapa', '288 113 9424', '', 'Dayra Del Carmen Arando', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (17, 'Panadería Nadia', '17', 'Calle 3 Sur 711, Santa María Cuaco, 72815 San Andrés Cholula, Pue.', '', '', '', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (18, 'Panadería Ángel', '18', '2 ORIENTE 818 SANTIAGO XICOTENCO SAN ANDRES CHOLULA, 72810 Puebla, Pue.', '220 342 5682', '', 'Abraham', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (19, 'Panadería La Providencia', '19', 'Av. Maximino A. Camacho 1000, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.', '', '', '', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (20, 'Agua San Andres', '20', 'Calle 2 Ote. 205. San Andrés Cholula, Pue. México.', '222 676 4074', '', '', '2025-01-01', true, NULL);
INSERT INTO public.proveedores VALUES (21, 'Dulcería Centro', '21', '', '', '', '', '2025-01-01', false, NULL);
INSERT INTO public.proveedores VALUES (22, 'Juan Elotes', '22', 'A Domicilio', '221 157 0398', '', 'Juan', '2025-01-01', false, NULL);
INSERT INTO public.proveedores VALUES (23, 'Don Goyo', '23', 'A Domicilio', '222 757 5977', '', 'Benjamín Carreto', '2025-01-01', false, NULL);
INSERT INTO public.proveedores VALUES (24, 'Coraje Con Agallas', '24', '', '', '', '', '2025-01-01', false, NULL);
INSERT INTO public.proveedores VALUES (25, 'Salchichonería Chyo III', '25', 'Esquina Calle 8 Oriente, Calle 8 Nte, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.', '', '', '', '2025-01-01', false, NULL);
INSERT INTO public.proveedores VALUES (26, 'Erika Palacios', '26', 'A Domicilio', '243 138 2442', '', 'Erika Palacios', '2025-01-01', false, NULL);
INSERT INTO public.proveedores VALUES (27, 'Ginez', '27', '', '', '', '', '2025-01-01', false, NULL);
INSERT INTO public.proveedores VALUES (28, 'Costco', '28', '', '', '', '', '2025-01-01', false, NULL);
INSERT INTO public.proveedores VALUES (29, 'Tienda donde se compra el gas', '29', 'Calle 12 Nte. 1002, Santiago Xicotenco, 72810 San Andrés Cholula, Pue.', '', '', '', '2025-01-01', false, NULL);


--
-- Data for Name: insumo_proveedor; Type: TABLE DATA; Schema: public; Owner: root
--

INSERT INTO public.insumo_proveedor VALUES (129, 13, 1, 30.00);
INSERT INTO public.insumo_proveedor VALUES (130, 132, 1, 22.00);
INSERT INTO public.insumo_proveedor VALUES (131, 13, 9, 50.00);
INSERT INTO public.insumo_proveedor VALUES (132, 132, 9, 45.00);
INSERT INTO public.insumo_proveedor VALUES (133, 203, 9, 90.00);
INSERT INTO public.insumo_proveedor VALUES (134, 47, 2, 41.00);
INSERT INTO public.insumo_proveedor VALUES (135, 161, 2, 24.00);
INSERT INTO public.insumo_proveedor VALUES (136, 162, 2, 24.00);
INSERT INTO public.insumo_proveedor VALUES (137, 32, 2, 78.00);
INSERT INTO public.insumo_proveedor VALUES (138, 50, 2, 84.00);
INSERT INTO public.insumo_proveedor VALUES (139, 2, 2, 61.00);
INSERT INTO public.insumo_proveedor VALUES (140, 114, 2, 30.00);
INSERT INTO public.insumo_proveedor VALUES (141, 147, 2, 25.00);
INSERT INTO public.insumo_proveedor VALUES (142, 151, 2, 36.00);
INSERT INTO public.insumo_proveedor VALUES (143, 19, 2, 19.00);
INSERT INTO public.insumo_proveedor VALUES (144, 24, 2, 140.00);
INSERT INTO public.insumo_proveedor VALUES (145, 26, 2, 166.00);
INSERT INTO public.insumo_proveedor VALUES (146, 37, 2, 400.00);
INSERT INTO public.insumo_proveedor VALUES (147, 55, 2, 150.00);
INSERT INTO public.insumo_proveedor VALUES (148, 77, 2, 83.00);
INSERT INTO public.insumo_proveedor VALUES (149, 116, 2, 110.00);
INSERT INTO public.insumo_proveedor VALUES (150, 118, 2, 140.00);
INSERT INTO public.insumo_proveedor VALUES (151, 121, 2, 33.00);
INSERT INTO public.insumo_proveedor VALUES (152, 122, 2, 200.00);
INSERT INTO public.insumo_proveedor VALUES (153, 141, 2, 75.00);
INSERT INTO public.insumo_proveedor VALUES (154, 142, 2, 12.00);
INSERT INTO public.insumo_proveedor VALUES (155, 167, 2, 18.00);
INSERT INTO public.insumo_proveedor VALUES (156, 174, 2, 22.00);
INSERT INTO public.insumo_proveedor VALUES (157, 202, 2, 44.00);
INSERT INTO public.insumo_proveedor VALUES (158, 14, 2, 125.00);
INSERT INTO public.insumo_proveedor VALUES (159, 17, 2, 130.00);
INSERT INTO public.insumo_proveedor VALUES (160, 27, 2, 85.00);
INSERT INTO public.insumo_proveedor VALUES (161, 28, 2, 30.00);
INSERT INTO public.insumo_proveedor VALUES (162, 30, 2, 24.00);
INSERT INTO public.insumo_proveedor VALUES (163, 43, 2, 14.00);
INSERT INTO public.insumo_proveedor VALUES (164, 61, 2, 7.50);
INSERT INTO public.insumo_proveedor VALUES (165, 88, 2, 16.00);
INSERT INTO public.insumo_proveedor VALUES (166, 93, 2, 20.00);
INSERT INTO public.insumo_proveedor VALUES (167, 96, 2, 20.00);
INSERT INTO public.insumo_proveedor VALUES (168, 97, 2, 12.00);
INSERT INTO public.insumo_proveedor VALUES (169, 110, 2, 2.00);
INSERT INTO public.insumo_proveedor VALUES (170, 127, 2, 21.00);
INSERT INTO public.insumo_proveedor VALUES (171, 128, 2, 26.00);
INSERT INTO public.insumo_proveedor VALUES (172, 92, 2, 26.00);
INSERT INTO public.insumo_proveedor VALUES (173, 133, 2, 125.00);
INSERT INTO public.insumo_proveedor VALUES (174, 135, 2, 125.00);
INSERT INTO public.insumo_proveedor VALUES (175, 137, 2, 36.00);
INSERT INTO public.insumo_proveedor VALUES (176, 67, 2, 10.00);
INSERT INTO public.insumo_proveedor VALUES (177, 44, 2, 95.00);
INSERT INTO public.insumo_proveedor VALUES (178, 69, 2, 33.00);
INSERT INTO public.insumo_proveedor VALUES (179, 82, 2, 45.00);
INSERT INTO public.insumo_proveedor VALUES (180, 129, 2, 91.00);
INSERT INTO public.insumo_proveedor VALUES (181, 153, 2, 140.00);
INSERT INTO public.insumo_proveedor VALUES (182, 8, 2, 168.00);
INSERT INTO public.insumo_proveedor VALUES (183, 23, 2, 79.50);
INSERT INTO public.insumo_proveedor VALUES (184, 38, 2, 18.00);
INSERT INTO public.insumo_proveedor VALUES (185, 48, 2, 99.00);
INSERT INTO public.insumo_proveedor VALUES (186, 75, 2, 41.00);
INSERT INTO public.insumo_proveedor VALUES (187, 89, 2, 230.00);
INSERT INTO public.insumo_proveedor VALUES (188, 101, 2, 45.00);
INSERT INTO public.insumo_proveedor VALUES (189, 104, 2, 288.00);
INSERT INTO public.insumo_proveedor VALUES (190, 105, 2, 110.00);
INSERT INTO public.insumo_proveedor VALUES (191, 143, 2, 165.00);
INSERT INTO public.insumo_proveedor VALUES (192, 150, 2, 80.00);
INSERT INTO public.insumo_proveedor VALUES (193, 165, 2, 27.00);
INSERT INTO public.insumo_proveedor VALUES (194, 172, 2, 123.00);
INSERT INTO public.insumo_proveedor VALUES (195, 153, 3, 120.00);
INSERT INTO public.insumo_proveedor VALUES (196, 155, 3, 240.00);
INSERT INTO public.insumo_proveedor VALUES (197, 71, 4, 30.00);
INSERT INTO public.insumo_proveedor VALUES (198, 72, 4, 60.00);
INSERT INTO public.insumo_proveedor VALUES (199, 74, 4, 90.00);
INSERT INTO public.insumo_proveedor VALUES (200, 123, 4, 40.00);
INSERT INTO public.insumo_proveedor VALUES (201, 7, 6, 120.00);
INSERT INTO public.insumo_proveedor VALUES (202, 41, 6, 110.00);
INSERT INTO public.insumo_proveedor VALUES (203, 153, 6, 120.00);
INSERT INTO public.insumo_proveedor VALUES (204, 155, 6, 220.00);
INSERT INTO public.insumo_proveedor VALUES (205, 211, 6, 140.00);
INSERT INTO public.insumo_proveedor VALUES (206, 101, 6, 40.00);
INSERT INTO public.insumo_proveedor VALUES (207, 95, 14, 750.00);
INSERT INTO public.insumo_proveedor VALUES (208, 186, 14, 60.00);
INSERT INTO public.insumo_proveedor VALUES (209, 212, 14, 920.00);
INSERT INTO public.insumo_proveedor VALUES (210, 159, 17, 3.00);
INSERT INTO public.insumo_proveedor VALUES (211, 159, 18, 3.00);
INSERT INTO public.insumo_proveedor VALUES (212, 159, 19, 3.50);
INSERT INTO public.insumo_proveedor VALUES (213, 189, 20, 17.00);
INSERT INTO public.insumo_proveedor VALUES (214, 209, 20, 110.00);
INSERT INTO public.insumo_proveedor VALUES (215, 193, 21, 160.00);
INSERT INTO public.insumo_proveedor VALUES (216, 61, 22, 5.00);
INSERT INTO public.insumo_proveedor VALUES (217, 36, 23, 660.00);
INSERT INTO public.insumo_proveedor VALUES (218, 210, 23, 600.00);
INSERT INTO public.insumo_proveedor VALUES (219, 159, 25, 4.50);
INSERT INTO public.insumo_proveedor VALUES (220, 213, 26, 500.00);
INSERT INTO public.insumo_proveedor VALUES (221, 6, 12, 500.00);
INSERT INTO public.insumo_proveedor VALUES (222, 65, 11, 345.00);
INSERT INTO public.insumo_proveedor VALUES (223, 58, 11, 324.00);
INSERT INTO public.insumo_proveedor VALUES (224, 66, 11, 527.00);
INSERT INTO public.insumo_proveedor VALUES (225, 117, 24, 1068.00);
INSERT INTO public.insumo_proveedor VALUES (226, 104, 3, 289.99);
INSERT INTO public.insumo_proveedor VALUES (227, 134, 3, 166.90);
INSERT INTO public.insumo_proveedor VALUES (228, 136, 3, 166.90);
INSERT INTO public.insumo_proveedor VALUES (229, 138, 3, 239.96);
INSERT INTO public.insumo_proveedor VALUES (230, 133, 3, 136.00);
INSERT INTO public.insumo_proveedor VALUES (231, 137, 3, 31.00);
INSERT INTO public.insumo_proveedor VALUES (232, 217, 3, 38.00);
INSERT INTO public.insumo_proveedor VALUES (233, 76, 29, 210.00);
INSERT INTO public.insumo_proveedor VALUES (234, 18, 8, 22.50);
INSERT INTO public.insumo_proveedor VALUES (235, 42, 5, 79.00);
INSERT INTO public.insumo_proveedor VALUES (236, 68, 5, 159.00);
INSERT INTO public.insumo_proveedor VALUES (237, 106, 5, 45.00);
INSERT INTO public.insumo_proveedor VALUES (238, 107, 5, 45.00);
INSERT INTO public.insumo_proveedor VALUES (239, 108, 5, 790.00);
INSERT INTO public.insumo_proveedor VALUES (240, 139, 5, 120.00);
INSERT INTO public.insumo_proveedor VALUES (241, 140, 5, 130.00);
INSERT INTO public.insumo_proveedor VALUES (242, 175, 5, 159.00);
INSERT INTO public.insumo_proveedor VALUES (243, 177, 5, 145.00);
INSERT INTO public.insumo_proveedor VALUES (244, 176, 5, 130.00);


--
-- Name: insumo_proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.insumo_proveedor_id_seq', 244, true);


--
-- Name: insumos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.insumos_id_seq', 218, true);


--
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 29, true);


--
-- PostgreSQL database dump complete
--

\unrestrict aiVcnBddyAzbuILNAjTA7j2LT7koTtwGPdZLKEszZlqzmUgaD6qQZwfzyHQNURG

