# Manejo de Precios y Descuentos en Regente 2.0

## Enfoque implementado: Precios Unitarios Sin Descuento

En Regente 2.0 se implementa un sistema donde **los precios unitarios de los productos se guardan siempre sin aplicar descuentos**, y los descuentos se calculan y aplican solamente al total de la orden.

### Ventajas del enfoque

1. **Mayor transparencia contable**: Siempre se conoce el precio original de cada producto, facilitando auditorías y análisis financieros.
2. **Flexibilidad con descuentos**: Permite añadir, modificar o eliminar descuentos sin necesidad de recalcular cada línea de detalle.
3. **Consistencia histórica**: Si una orden se cierra con descuento, siempre puedes consultar cuánto habría costado sin él.
4. **Soporte para cancelaciones**: Al mantener los precios originales, las cancelaciones son exactamente el precio negativo del producto original.

### Cómo funciona el sistema

#### 1. Almacenamiento de precios

- Todos los productos se guardan en `detalles_orden` con su precio unitario original.
- Las cancelaciones se guardan con el mismo precio unitario pero en negativo.

#### 2. Cálculo de totales

- **Total Bruto (`total_bruto`)**: Suma de todos los productos (precio unitario × cantidad) sin aplicar descuentos.
- **Total con Descuento (`total`)**: Total bruto multiplicado por el factor de descuento: `total_bruto * (1 - porcentaje_descuento_total / 100)`.

#### 3. Tipos de descuentos

El sistema admite dos tipos de descuentos que se pueden aplicar simultáneamente:

- **Códigos Promocionales**: Descuentos temporales aplicados específicamente a una orden.
- **Descuentos por Grado**: Descuentos asociados al grado de un preso (cliente).

Los descuentos se aplican de forma acumulativa (se suman sus porcentajes).

#### 4. Cierre de Orden

Al cerrar una orden:

1. Se recalcula el total bruto sumando todos los productos (considerando cancelaciones).
2. Se aplican los descuentos vigentes para calcular el total final.
3. Se verifica que los pagos cubran al menos el total con descuento.

### Archivos principales del sistema

- **backend/src/models/orders.model.js**: 
  - Contiene las funciones `createOrder`, `addProductsToOrder` y `closeOrder`
  - Todos guardan precios unitarios originales sin aplicar descuentos

- **backend/src/models/promociones.model.js**:
  - Implementa `recalcularOrdenConDescuento` para actualizar totales
  - Gestiona la aplicación y eliminación de códigos promocionales

- **frontend/src/components/GestionOrden.jsx**:
  - Muestra el total bruto y el total con descuento
  - Visualiza los descuentos aplicados y el ahorro generado

### Consideraciones Técnicas

#### Backend

Los cálculos con descuentos se realizan al nivel de la orden completa, no al nivel individual de producto:

```javascript
// Cálculo del descuento total (promociones.model.js)
const porcentaje_descuento_total = porcentaje_descuento_codigo + porcentaje_descuento_grado;
const factor_descuento = (100 - porcentaje_descuento_total) / 100;

// Cálculo del total con descuento
const total_con_descuento = total_bruto * factor_descuento;
```

#### Frontend

El componente `GestionOrden` implementa una lógica condicional para mostrar los totales:

```jsx
{(orden.codigo_promocional || (orden.descuento_grado && parseFloat(orden.descuento_grado) > 0)) ? (
  <>
    <p className="text-gray-300"><span className="font-bold">Total sin descuento:</span> ${parseFloat(orden.total_bruto || 0).toFixed(2)}</p>
    <p className="text-amarillo font-bold">Total a cobrar: ${parseFloat(orden.total || 0).toFixed(2)}</p>
  </>
) : (
  <p className="font-bold">Total: ${parseFloat(orden.total || 0).toFixed(2)}</p>
)}
```

## Ejemplo de cálculos

1. Una orden con productos por valor de $100 (total_bruto = $100)
2. Se aplica un código promocional del 10% y un descuento por grado del 5%
3. El descuento total es 15% (10% + 5%)
4. El total con descuento es: $100 × (1 - 15/100) = $85
5. Si se realiza un pago por $85, la diferencia es $0 y el estado_pago es "pagado"
6. Si se realiza un pago por $80, la diferencia es -$5 y el estado_pago es "pendiente"

## Resolución de problemas comunes

Si se observan discrepancias en los totales:

1. Verificar que todos los productos tengan su precio unitario original (sin descuento).
2. Ejecutar `recalcularOrdenConDescuento(orden_id)` para actualizar los totales.
3. Comprobar que las cancelaciones tengan el precio negativo correcto.
4. Revisar que la función `closeOrder` esté calculando correctamente los totales con el valor absoluto de los precios. 