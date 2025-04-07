-- 1. Agregar la columna ingrediente_id a la tabla detalles_orden
ALTER TABLE detalles_orden 
ADD COLUMN ingrediente_id INT REFERENCES variantes(id) ON DELETE SET NULL;

-- 2. Crear la categoría de variantes para ingredientes extra
INSERT INTO categorias_variantes (nombre, tipo) 
VALUES ('Ingredientes Extra', 'ingredientes');

-- Crear categoría de variantes para sabores genéricos (para otros productos)
INSERT INTO categorias_variantes (nombre, tipo) 
VALUES ('Sabores Genéricos', 'sabor_generico');

-- 3. Agregar los ingredientes extra a la tabla sabores
-- Primero obtenemos el ID de la categoría de ingredientes que acabamos de crear
WITH ingredientes_id AS (
  SELECT id FROM categorias_variantes WHERE tipo = 'ingredientes' LIMIT 1
)
INSERT INTO sabores (nombre, categoria_id, disponible, precio_adicional) 
VALUES 
  ('Carne árabe', (SELECT id FROM ingredientes_id), TRUE, 15),
  ('Chorizo argentino', (SELECT id FROM ingredientes_id), TRUE, 15),
  ('Manzana con tocino', (SELECT id FROM ingredientes_id), TRUE, 15),
  ('Champiñones', (SELECT id FROM ingredientes_id), TRUE, 15);

-- 4. Crear la relación entre la categoría de productos "Cena" y el tipo de variante "ingredientes"
INSERT INTO categoria_producto_tipo_variante (categoria_producto, tipo_variante)
VALUES ('Cena', 'ingredientes');

-- Crear relación entre otras categorías y sus tipos de variantes
INSERT INTO categoria_producto_tipo_variante (categoria_producto, tipo_variante)
VALUES ('Otros', 'sabor_generico');

-- 5. Para cada producto de categoría "Cena", crear relaciones con los ingredientes
INSERT INTO producto_sabor (producto_id, sabor_id)
SELECT p.id, s.id
FROM productos p, sabores s
WHERE p.categoria = 'Cena' 
AND s.categoria_id = (SELECT id FROM categorias_variantes WHERE tipo = 'ingredientes');

-- NOTA: Si necesitas revertir estos cambios, puedes usar las siguientes consultas:

-- Eliminar la columna ingrediente_id
-- ALTER TABLE detalles_orden DROP COLUMN ingrediente_id;

-- Eliminar las relaciones entre productos de cena e ingredientes
-- DELETE FROM producto_sabor 
-- WHERE sabor_id IN (
--   SELECT s.id FROM variantes s 
--   JOIN categorias_variantes cv ON s.categoria_id = cv.id 
--   WHERE cv.tipo = 'ingredientes'
-- );

-- Eliminar los ingredientes
-- DELETE FROM variantes 
-- WHERE categoria_id = (SELECT id FROM categorias_variantes WHERE tipo = 'ingredientes');

-- Eliminar la relación entre categoría Cena y tipo ingredientes
-- DELETE FROM categoria_producto_tipo_variante 
-- WHERE categoria_producto = 'Cena' AND tipo_variante = 'ingredientes';

-- Eliminar la categoría de variantes de ingredientes
-- DELETE FROM categorias_variantes WHERE tipo = 'ingredientes';

-- INSERTAR DATOS PARA PRUEBAS (si es necesario)
-- Ejemplo de inserción de variantes para probar sabores, tamaños e ingredientes extra
INSERT INTO variantes (nombre, categoria, descripcion, precio_adicional) VALUES
  ('Chile', 'sabor', 'Sabor picante', 0),
  ('Sal', 'sabor', 'Sabor salado', 0),
  ('Extra grande', 'tamaño', 'Tamaño más grande', 15),
  ('Queso extra', 'ingrediente', 'Ingrediente adicional queso', 10),
  ('Original', 'sabor', 'Sabor original del producto', 0),
  ('Especial', 'sabor', 'Sabor especial', 5);

-- Ejemplo de asignación de variantes a productos
INSERT INTO producto_variante (producto_id, variante_id, precio_adicional)
VALUES 
  (1, 1, 0), -- Producto 1 tiene variante 1 (Chile)
  (1, 2, 0), -- Producto 1 tiene variante 2 (Sal)
  (2, 3, 15), -- Producto 2 tiene variante 3 (Extra grande) con precio adicional
  (3, 5, 0), -- Producto 3 tiene variante 5 (Original) - ejemplo para otros productos
  (3, 6, 5); -- Producto 3 tiene variante 6 (Especial) con precio adicional

-- ESTOS PUEDEN SER EJEMPLOS DE ELIMINACIONES SI NECESITAS ELIMINAR DATOS
-- DELETE FROM producto_variante
-- WHERE producto_id = 1 AND variante_id IN (1, 2); 