import { useState, useEffect } from "react";
import { getEmpleadoId } from "../utils/auth";
import { API_URL } from "../utils/api.js";
import ProductSelector from "./ProductSelector";

export default function AgregarProducto({ orden_id }) {
  const [enviando, setEnviando] = useState(false);
  const [ordenInfo, setOrdenInfo] = useState(null);
  const [mostrarSelector, setMostrarSelector] = useState(true);

  useEffect(() => {
    cargarOrdenInfo();
  }, []);


  const cargarOrdenInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${orden_id}/resumen`);
      const data = await res.json();
      if (res.ok) {
        setOrdenInfo(data);
      }
    } catch (error) {
      console.error("Error al cargar información de la orden:", error);
    }
  };

  const handleProductsSelected = async (productosSeleccionados) => {
    if (productosSeleccionados.length === 0) {
      return;
    }
    
    try {
      setEnviando(true);
      
      // Calcular el total incluyendo los costos adicionales de variantes
      const total = productosSeleccionados.reduce((sum, prod) => {
        return sum + (prod.precio * prod.cantidad);
      }, 0);
      
      console.log("Agregando productos a orden:", productosSeleccionados);
      
      const response = await fetch(`${API_URL}/orders/${orden_id}/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          empleado_id: getEmpleadoId(),
          productos: productosSeleccionados.map(p => {
            // Producto normal o de sentencia
            const productoData = {
              producto_id: p.esSentencia ? null : p.id, // null si es la sentencia principal
              cantidad: p.cantidad,
              precio_unitario: p.precio, // Precio del ítem (sentencia, componente o producto normal)
              sabor_id: p.sabor_id || null,
              tamano_id: p.tamano_id || null,
              ingrediente_id: p.ingrediente_id || null,
              notas: p.notas || null,

              // --- Campos específicos para Sentencias ---
              sentencia_id: p.sentencia_id || null,
              sentencia_instance_id: p.sentencia_instance_id || null,
              es_sentencia_principal: p.esSentencia || false,
              es_parte_sentencia: p.es_parte_sentencia || false,
              nombre_sentencia: p.esSentencia ? p.nombre : null,
              descripcion_sentencia: p.esSentencia ? p.descripcion : null,
              es_para_llevar: p.es_para_llevar || false,
              para_llevar_precio: p.para_llevar_precio || 0
            };

            console.log("Enviando producto:", productoData);
            return productoData;
          })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar productos');
      }

      const data = await response.json();
      alert("Productos agregados con éxito");
      window.location.href = `/ordenes/${orden_id}`;
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (!mostrarSelector) {
    return (
      <div className="text-center py-8">
        <p className="text-lg mb-4">Productos agregados con éxito</p>
        <a 
          href={`/ordenes/${orden_id}`}
          className="bg-amarillo text-negro px-6 py-2 rounded font-bold inline-block"
        >
          Volver a la Orden
        </a>
      </div>
    );
  }

  return (
    <ProductSelector
      onProductsSelected={handleProductsSelected}
      onClose={() => window.location.href = `/ordenes/${orden_id}`}
      showCustomerName={true}
      customerName={ordenInfo?.cliente || ""}
      orderId={orden_id}
    />
  );
} 