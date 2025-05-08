-- Tabla para sentencias (promociones)
CREATE TABLE sentencias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL,
    activa BOOLEAN DEFAULT TRUE
);

-- Tabla para relacionar productos con sentencias
CREATE TABLE productos_sentencias (
    id SERIAL PRIMARY KEY,
    sentencia_id INT NOT NULL REFERENCES sentencias(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INT DEFAULT 1,
    sabor_id INT REFERENCES sabores(id) ON DELETE SET NULL,
    tamano_id INT REFERENCES sabores(id) ON DELETE SET NULL,
    ingrediente_id INT REFERENCES sabores(id) ON DELETE SET NULL,
    es_opcional BOOLEAN DEFAULT FALSE, -- Indica si el producto es opcional
    grupo_opcion INT, -- Productos con mismo grupo_opcion son opciones mutuamente excluyentes
    precio_unitario NUMERIC(10, 2) DEFAULT 0, -- Precio unitario para este producto dentro de la sentencia
    UNIQUE(sentencia_id, producto_id, sabor_id, tamano_id, ingrediente_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_sentencias_activa ON sentencias(activa);
CREATE INDEX idx_productos_sentencias_sentencia_id ON productos_sentencias(sentencia_id);

-- Datos iniciales para las sentencias
INSERT INTO sentencias (nombre, descripcion, precio) VALUES
('Infracción', 'Sentencia leve para infracciones menores', 85.00),
('El Apando', 'Sentencia media para delitos moderados', 170.00),
('Noche en los Separos', 'Sentencia grave para delitos mayores', 185.00),
('Pena Capital', 'Sentencia máxima para los delitos más graves', 125.00);

-- Insertar productos para "Infracción"
INSERT INTO productos_sentencias (sentencia_id, producto_id, cantidad, sabor_id, tamano_id, es_opcional, grupo_opcion) VALUES
(1, 22, 1, 37, NULL, FALSE, NULL), -- Brebaje con sabor Tradicional
(1, 10, 1, NULL, NULL, TRUE, 1), -- Cerveza Popular (opción 1)
(1, 31, 1, NULL, 12, TRUE, 1); -- Natural con tamaño Medio litro (opción 2)

-- Insertar productos para "El Apando"
INSERT INTO productos_sentencias (sentencia_id, producto_id, cantidad, sabor_id, tamano_id, es_opcional, grupo_opcion) VALUES
(2, 34, 1, NULL, 12, FALSE, NULL), -- Especial con tamaño Medio litro
(2, 22, 1, 37, NULL, FALSE, NULL), -- Brebaje con sabor Tradicional
(2, 5, 1, NULL, NULL, FALSE, NULL); -- Molletes

-- Insertar productos para "Noche en los Separos"
INSERT INTO productos_sentencias (sentencia_id, producto_id, cantidad, sabor_id, tamano_id, es_opcional, grupo_opcion) VALUES
(3, 22, 1, 37, NULL, FALSE, NULL), -- Brebaje con sabor Tradicional
(3, 10, 2, NULL, NULL, TRUE, 1), -- 2 Cervezas Populares (opción 1)
(3, 32, 1, NULL, 15, TRUE, 1), -- Temporada con tamaño Litro Temporada (opción 2)
(3, 5, 1, NULL, NULL, FALSE, NULL); -- Molletes

-- Insertar productos para "Pena Capital"
INSERT INTO productos_sentencias (sentencia_id, producto_id, cantidad, sabor_id, tamano_id, es_opcional, grupo_opcion) VALUES
(4, 22, 1, 37, NULL, FALSE, NULL), -- Brebaje con sabor Tradicional
(4, 31, 1, NULL, 12, FALSE, NULL), -- Natural con tamaño Medio litro
(4, 10, 1, NULL, NULL, FALSE, NULL); -- Cerveza Popular 