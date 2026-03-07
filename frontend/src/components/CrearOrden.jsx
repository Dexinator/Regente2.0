import { useEffect, useState } from "react";
import { getEmpleadoId } from "../utils/auth";
import { API_URL } from "../utils/api.js";
import ProductSelector from "./ProductSelector";

export default function CrearOrden() {
    const [presos, setPresos] = useState([]);
    const [presoSeleccionado, setPresoSeleccionado] = useState(null);
    const [nombreLibre, setNombreLibre] = useState("");
    const [numPersonas, setNumPersonas] = useState(1);
    
    const [productosSeleccionados, setProductosSeleccionados] = useState([]);

    // Estado para código promocional
    const [codigoPromocional, setCodigoPromocional] = useState("");
    const [codigoValido, setCodigoValido] = useState(null);
    const [verificandoCodigo, setVerificandoCodigo] = useState(false);

    const [filtroPreso, setFiltroPreso] = useState("");

    // Estado para manejar la creación de la orden
    const [creandoOrden, setCreandoOrden] = useState(false);

    useEffect(() => {
        // Cargar presos
        fetch(`${API_URL}/clients`)
        .then((res) => res.json())
        .then((data) => setPresos(data))
        .catch((err) => console.error("Error cargando presos:", err));
    }, []);

    const handleProductsSelected = (productos) => {
        setProductosSeleccionados(productos);
    };

    // Función para validar código promocional
    const validarCodigoPromocional = async () => {
        if (!codigoPromocional.trim()) {
            setCodigoValido(null);
            return;
        }
        
        try {
            setVerificandoCodigo(true);
            
            const response = await fetch(`${API_URL}/promociones/validar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ codigo: codigoPromocional.trim() }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                setCodigoValido({ valid: false, message: error.error });
                return;
            }
            
            const result = await response.json();
            if (result.valid) {
                setCodigoValido({ 
                    valid: true, 
                    message: `Código válido: ${result.codigo.porcentaje_descuento}% de descuento`,
                    data: result.codigo
                });
            } else {
                setCodigoValido({ valid: false, message: "Código inválido o expirado" });
            }
        } catch (error) {
            setCodigoValido({ valid: false, message: error.message });
        } finally {
            setVerificandoCodigo(false);
        }
    };

    const quitarProducto = (id, sabor_id, tamano_id, ingrediente_id, notas) => {
        setProductosSeleccionados(prev => 
            prev
            .map(p => (
                p.id === id && 
                p.sabor_id === sabor_id && 
                p.tamano_id === tamano_id &&
                p.ingrediente_id === ingrediente_id &&
                ((p.notas || "") === (notas || "")) 
                    ? { ...p, cantidad: p.cantidad - 1 } 
                    : p
            ))
            .filter(p => p.cantidad > 0)
        );
    };

    const aumentarCantidad = (id, sabor_id, tamano_id, ingrediente_id, notas) => {
        setProductosSeleccionados(prev =>
            prev.map(p => 
                p.id === id && 
                p.sabor_id === sabor_id && 
                p.tamano_id === tamano_id &&
                p.ingrediente_id === ingrediente_id &&
                ((p.notas || "") === (notas || ""))
                    ? { ...p, cantidad: p.cantidad + 1 }
                    : p
            )
        );
    };

    const eliminarSentenciaCompleta = (sentenciaId) => {
        if (!confirm("¿Deseas eliminar esta sentencia y todos sus productos?")) return;
        
        setProductosSeleccionados(prev => 
            prev.filter(p => p.sentencia_id !== sentenciaId)
        );
    };

    const crearOrden = async () => {
        if (productosSeleccionados.length === 0) {
            alert("Agrega al menos un producto");
            return;
        }
        
        try {
            setCreandoOrden(true);
            
            // Calcular el total incluyendo los costos adicionales de variantes
            const total = productosSeleccionados.reduce((sum, prod) => {
                return sum + (prod.precio * prod.cantidad);
            }, 0);
            
            console.log("Creando orden con productos:", productosSeleccionados);
            
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    preso_id: presoSeleccionado?.id,
                    nombre_cliente: presoSeleccionado ? presoSeleccionado.reg_name : nombreLibre,
                    total: total,
                    empleado_id: getEmpleadoId(),
                    num_personas: numPersonas,
                    codigo_promocional: codigoValido?.valid ? codigoPromocional.trim() : null,
                    productos: productosSeleccionados.map(p => {
                        const productoData = {
                            producto_id: p.esSentencia ? null : p.id,
                            cantidad: p.cantidad,
                            precio_unitario: p.precio,
                            sabor_id: p.sabor_id || null,
                            tamano_id: p.tamano_id || null,
                            ingrediente_id: p.ingrediente_id || null,
                            notas: p.notas || null,
                            sentencia_id: p.sentencia_id || null,
                            sentencia_instance_id: p.sentencia_instance_id || null,
                            es_sentencia_principal: p.esSentencia || false,
                            es_parte_sentencia: p.es_parte_sentencia || false,
                            nombre_sentencia: p.esSentencia ? p.nombre : null,
                            descripcion_sentencia: p.esSentencia ? p.descripcion : null,
                            es_para_llevar: p.es_para_llevar || false,
                            para_llevar_precio: p.para_llevar_precio || 0
                        };
                        return productoData;
                    })
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear la orden');
            }

            const data = await response.json();
            alert("Orden creada con éxito");
            window.location.href = "/ordenes";
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        } finally {
            setCreandoOrden(false);
        }
    };

    return (
        <div className="space-y-8">
            <h2 className="text-lg font-bold text-amarillo">Datos del Cliente</h2>
            
            {/* Búsqueda de presos */}
            <div>
                <label className="block mb-2 text-amarillo font-bold">Buscar preso</label>
                <div className="relative">
                    <input
                        type="text"
                        value={filtroPreso}
                        onChange={e => setFiltroPreso(e.target.value)}
                        placeholder="Buscar por nombre, celda o número de teléfono"
                        className="w-full bg-vino text-white p-2 rounded"
                    />
                </div>
                
                {filtroPreso && (
                    <div className="mt-2 bg-negro rounded overflow-hidden max-h-40 overflow-y-auto">
                        {presos
                        .filter(p => 
                            p.reg_name.toLowerCase().includes(filtroPreso.toLowerCase()) ||
                            (p.igname && p.igname.toLowerCase().includes(filtroPreso.toLowerCase())) ||
                            p.res_tel.includes(filtroPreso)
                        )
                        .slice(0, 5)
                        .map(preso => (
                            <button
                                key={preso.id}
                                onClick={() => {
                                    setPresoSeleccionado(preso);
                                    setFiltroPreso("");
                                    setNombreLibre("");
                                }}
                                className="w-full text-left p-2 hover:bg-vino/30 flex justify-between items-center border-b border-gray-800"
                            >
                                <div>
                                    <p>{preso.reg_name}</p>
                                    {preso.igname && <p className="text-xs text-gray-400">IG: {preso.igname}</p>}
                                </div>
                                <p className="text-sm text-gray-400">Celda {preso.cellmate}</p>
                            </button>
                        ))}
                    </div>
                )}
                
                {presoSeleccionado && (
                    <div className="mt-2 p-3 bg-vino/30 rounded flex justify-between">
                        <div>
                            <p className="font-bold">{presoSeleccionado.reg_name}</p>
                            <p className="text-sm text-gray-300">TEL: {presoSeleccionado.res_tel}</p>
                            {presoSeleccionado.igname && <p className="text-sm text-gray-300">IG: {presoSeleccionado.igname}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm">Compañero de Celda {presoSeleccionado.cellmate}</p>
                            <button
                                onClick={() => setPresoSeleccionado(null)}
                                className="text-gray-300 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {!presoSeleccionado && (
                <div>
                    <label className="block mb-2 text-amarillo font-bold">O nombre de referencia</label>
                    <input
                        type="text"
                        value={nombreLibre}
                        onChange={(e) => {
                            setNombreLibre(e.target.value);
                            setPresoSeleccionado(null);
                        }}
                        placeholder="Ej. Chica de blanco"
                        className="w-full bg-vino text-white p-2 rounded"
                    />
                </div>
            )}
            
            {/* Campo para número de personas */}
            <div>
                <label className="block mb-2 text-amarillo font-bold">Número de personas</label>
                <div className="flex items-center gap-3 bg-negro rounded p-2 w-full">
                    <button 
                        onClick={() => setNumPersonas(prev => Math.max(1, prev - 1))}
                        className="bg-vino px-3 py-1 rounded-full font-bold"
                    >
                        -
                    </button>
                    <span className="flex-1 text-center text-xl font-bold">{numPersonas}</span>
                    <button 
                        onClick={() => setNumPersonas(prev => prev + 1)}
                        className="bg-vino px-3 py-1 rounded-full font-bold"
                    >
                        +
                    </button>
                </div>
            </div>
            
            {/* Campo para código promocional */}
            <div>
                <label className="block mb-2 text-amarillo font-bold">Código Promocional (opcional)</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={codigoPromocional}
                        onChange={(e) => setCodigoPromocional(e.target.value.toUpperCase())}
                        onBlur={validarCodigoPromocional}
                        placeholder="Ej. VERANO2023"
                        className="flex-1 bg-vino text-white p-2 rounded uppercase"
                    />
                    <button 
                        onClick={validarCodigoPromocional}
                        className="bg-amarillo text-negro px-3 rounded font-bold"
                        disabled={verificandoCodigo || !codigoPromocional.trim()}
                    >
                        Validar
                    </button>
                </div>
                {verificandoCodigo && (
                    <p className="text-gray-400 text-sm mt-1">Verificando código...</p>
                )}
                {codigoValido && (
                    <p className={`text-sm mt-1 ${codigoValido.valid ? 'text-green-500' : 'text-red-500'}`}>
                        {codigoValido.message}
                    </p>
                )}
            </div>
            
            {/* Selector de productos */}
            <ProductSelector
                onProductsSelected={handleProductsSelected}
                onClose={() => window.location.href = "/ordenes"}
                initialProducts={productosSeleccionados}
                hideProductSummary={true}
            />
            
            {/* Lista de productos seleccionados */}
            <div className="space-y-3 my-6">
                {productosSeleccionados.length > 0 && (
                    <div className="bg-negro rounded p-4 space-y-3">
                        <h3 className="font-bold text-amarillo">Productos seleccionados</h3>
                        {productosSeleccionados.map((producto, index) => (
                            <div 
                                key={`${index}-${producto.id}-${producto.sabor_id}-${producto.tamano_id}-${producto.ingrediente_id}`} 
                                className="bg-negro p-3 rounded flex justify-between items-start border-b border-gray-800 pb-3"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{producto.nombre}</span>
                                        {producto.esSentencia && (
                                            <span className="bg-amarillo text-negro px-2 py-0.5 rounded-full text-xs">
                                                Sentencia
                                            </span>
                                        )}
                                        {producto.es_parte_sentencia && (
                                            <span className="bg-amarillo/30 text-amarillo px-2 py-0.5 rounded-full text-xs">
                                                Incluido
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Mostrar información de variantes si existe */}
                                    <div className="text-xs text-gray-400 mt-1">
                                        {/* Mostrar sabor si existe */}
                                        {producto.sabor_nombre && (
                                            <div className="flex justify-between mt-1">
                                                <span>Sabor: {producto.sabor_nombre}</span>
                                                {parseFloat(producto.precio_adicional) > 0 && (
                                                    <span className="text-amarillo">+${parseFloat(producto.precio_adicional).toFixed(2)}</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Mostrar tamaño si existe */}
                                        {producto.tamano_nombre && (
                                            <div className="flex justify-between mt-1">
                                                <span>Tamaño: {producto.tamano_nombre}</span>
                                                {parseFloat(producto.tamano_precio) > 0 && (
                                                    <span className="text-amarillo">+${parseFloat(producto.tamano_precio).toFixed(2)}</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Mostrar ingrediente si existe */}
                                        {producto.ingrediente_nombre && (
                                            <div className="flex justify-between mt-1">
                                                <span>Ingrediente: {producto.ingrediente_nombre}</span>
                                                {parseFloat(producto.ingrediente_precio) > 0 && (
                                                    <span className="text-amarillo">+${parseFloat(producto.ingrediente_precio).toFixed(2)}</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Mostrar notas si existen */}
                                        {producto.notas && (
                                            <div className="mt-2 italic">"{producto.notas}"</div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        {/* Botones para modificar cantidad */}
                                        {!producto.es_parte_sentencia && (
                                            <>
                                                <button
                                                    onClick={() => quitarProducto(
                                                        producto.id, 
                                                        producto.sabor_id, 
                                                        producto.tamano_id, 
                                                        producto.ingrediente_id,
                                                        producto.notas
                                                    )}
                                                    className="bg-vino px-2 rounded-full"
                                                >
                                                    -
                                                </button>
                                                <span className="font-bold">{producto.cantidad}</span>
                                                <button
                                                    onClick={() => aumentarCantidad(
                                                        producto.id, 
                                                        producto.sabor_id, 
                                                        producto.tamano_id, 
                                                        producto.ingrediente_id,
                                                        producto.notas
                                                    )}
                                                    className="bg-vino px-2 rounded-full"
                                                >
                                                    +
                                                </button>
                                            </>
                                        )}
                                        {producto.es_parte_sentencia && (
                                            <span className="font-bold">{producto.cantidad}x</span>
                                        )}
                                        {/* Botón para eliminar sentencia completa */}
                                        {producto.esSentencia && (
                                            <button
                                                onClick={() => eliminarSentenciaCompleta(producto.sentencia_id)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs ml-2"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Mostrar precio */}
                                    <div className="text-sm">
                                        {!producto.es_parte_sentencia && (
                                            <>${(producto.precio * producto.cantidad).toFixed(2)}</>
                                        )}
                                        {producto.es_parte_sentencia && producto.precio > 0 && (
                                            <>+${parseFloat(producto.precio).toFixed(2)}</>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {productosSeleccionados.length === 0 && (
                    <div className="bg-negro/50 rounded p-4 text-center">
                        <p className="text-gray-400">No hay productos seleccionados</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold">
                    ${productosSeleccionados
                        .reduce((total, p) => {
                            if (p.es_parte_sentencia && !p.esSentencia) {
                                // Para productos de sentencia, solo sumamos los costos adicionales
                                return total + (p.precio * p.cantidad);
                            } else {
                                // Para productos normales o sentencias principales, sumamos el precio completo
                                return total + (p.precio * p.cantidad);
                            }
                        }, 0)
                        .toFixed(2)}
                </span>
            </div>

            <button
                onClick={crearOrden}
                className="w-full bg-amarillo text-negro py-3 rounded font-bold"
                disabled={creandoOrden}
            >
                {creandoOrden ? "Creando orden..." : "Crear Orden"}
            </button>
        </div>
    );
}
