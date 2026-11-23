/**
 * Generador de tickets ESC/POS para la impresora de cuentas (80 mm, 48 columnas).
 * Produce un Buffer listo para mandarse crudo al puerto 9100 de la impresora.
 */

const ESC = 0x1b;
const GS = 0x1d;

const ANCHO = 48; // columnas en fuente A sobre 72 mm de área de impresión

// Mapa de caracteres CP850 (página de códigos que usa la impresora para español)
const CP850 = {
  "á": 0xa0, "é": 0x82, "í": 0xa1, "ó": 0xa2, "ú": 0xa3,
  "Á": 0xb5, "É": 0x90, "Í": 0xd6, "Ó": 0xe0, "Ú": 0xe9,
  "ñ": 0xa4, "Ñ": 0xa5, "ü": 0x81, "Ü": 0x9a,
  "¿": 0xa8, "¡": 0xad, "°": 0xf8, "·": 0xfa, "×": 0x9e
};

/** Codifica un string a bytes CP850 (lo no mapeable sale como '?') */
const codificar = (texto) => {
  const bytes = [];
  for (const ch of String(texto)) {
    const code = ch.codePointAt(0);
    if (code < 0x80) bytes.push(code);
    else if (CP850[ch] !== undefined) bytes.push(CP850[ch]);
    else bytes.push(0x3f); // '?'
  }
  return Buffer.from(bytes);
};

const dinero = (n) => `$${Number(n).toFixed(2)}`;

/** Línea con texto a la izquierda y monto a la derecha, en ANCHO columnas */
const lineaMonto = (izq, der, ancho = ANCHO) => {
  izq = String(izq);
  der = String(der);
  const maxIzq = ancho - der.length - 1;
  if (izq.length > maxIzq) izq = izq.slice(0, maxIzq - 1) + "…".replace("…", "."); // recorte simple ASCII
  return izq + " ".repeat(Math.max(1, ancho - izq.length - der.length)) + der + "\n";
};

/** Divide texto largo en líneas de máximo `ancho`, con prefijo de sangría */
const envolver = (texto, prefijo, ancho = ANCHO) => {
  const palabras = String(texto).split(/\s+/);
  const lineas = [];
  let actual = prefijo;
  for (const p of palabras) {
    if ((actual + " " + p).trim().length > ancho) {
      lineas.push(actual);
      actual = " ".repeat(prefijo.length) + p;
    } else {
      actual = actual === prefijo ? prefijo + p : actual + " " + p;
    }
  }
  if (actual.trim()) lineas.push(actual);
  return lineas.join("\n") + "\n";
};

class TicketBuilder {
  constructor() {
    this.partes = [];
    this.cmd(ESC, 0x40); // reset
    this.cmd(ESC, 0x74, 0x02); // página de códigos CP850
  }
  cmd(...bytes) { this.partes.push(Buffer.from(bytes)); return this; }
  texto(t) { this.partes.push(codificar(t)); return this; }
  centrar() { return this.cmd(ESC, 0x61, 0x01); }
  izquierda() { return this.cmd(ESC, 0x61, 0x00); }
  negritas(on) { return this.cmd(ESC, 0x45, on ? 1 : 0); }
  tamano(n) { return this.cmd(GS, 0x21, n); } // 0x00 normal, 0x01 doble alto, 0x11 doble alto+ancho
  separador() { return this.texto("-".repeat(ANCHO) + "\n"); }
  cortar() { return this.cmd(0x0a, 0x0a, 0x0a, 0x0a).cmd(GS, 0x56, 0x00); }
  build() { return Buffer.concat(this.partes); }
}

const describirVariantes = (p) => {
  const partes = [];
  if (p.sabor_nombre) partes.push(p.sabor_nombre);
  if (p.tamano_nombre) partes.push(p.tamano_nombre);
  if (p.ingrediente_nombre) partes.push(`extra ${p.ingrediente_nombre}`);
  return partes.join(" / ");
};

const formatearFecha = (fecha) => {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return d.toLocaleString("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false
  });
};

/**
 * Genera el ticket de cuenta a partir del resumen de la orden
 * (salida de getOrderResumen) más datos extra.
 *
 * @param {object} resumen  salida de getOrderResumen
 * @param {object} extras   { mesero, fecha, tipo: 'cuenta'|'recibo', metodoPago }
 * @returns {Buffer} bytes ESC/POS
 */
export const generarTicketCuenta = (resumen, extras = {}) => {
  const t = new TicketBuilder();
  const esRecibo = extras.tipo === "recibo";

  // ── Encabezado ──
  t.centrar().tamano(0x11).texto("EL PALACIO NEGRO\n").tamano(0x00);
  t.texto("Pulquería\n");
  t.separador();

  // ── Datos de la orden ──
  t.izquierda();
  t.negritas(true).texto(`${esRecibo ? "RECIBO DE PAGO" : "CUENTA"} - Orden #${resumen.orden_id}\n`).negritas(false);
  t.texto(`Cliente: ${resumen.cliente}\n`);
  if (extras.mesero) t.texto(`Atendió: ${extras.mesero}\n`);
  t.texto(`Fecha: ${formatearFecha(extras.fecha || new Date())}\n`);
  if (resumen.num_personas > 1) t.texto(`Personas: ${resumen.num_personas}\n`);
  t.separador();

  // ── Productos ──
  const productos = resumen.productos || [];
  const principales = productos.filter((p) => !p.sentencia_detalle_orden_padre_id && p.cantidad_neta > 0);

  for (const p of principales) {
    const nombreLinea = `${p.cantidad_neta}  ${p.nombre}`;
    t.texto(lineaMonto(nombreLinea, dinero(p.subtotal_neto)));

    const variantes = describirVariantes(p);
    if (variantes) t.texto(envolver(variantes, "   · "));

    if (p.es_sentencia_principal) {
      const componentes = productos.filter(
        (c) => c.sentencia_detalle_orden_padre_id === p.id_detalle_original && c.cantidad_neta > 0
      );
      for (const c of componentes) {
        const varC = describirVariantes(c);
        const desc = `${c.cantidad_neta > 1 ? c.cantidad_neta + " " : ""}${c.nombre}${varC ? ` (${varC})` : ""}`;
        if (c.subtotal_neto > 0.009) {
          t.texto(lineaMonto(`   · ${desc}`, `+${dinero(c.subtotal_neto)}`));
        } else {
          t.texto(envolver(desc, "   · "));
        }
        if (c.notas) t.texto(envolver(`Nota: ${c.notas}`, "     "));
      }
    }

    if (p.notas) t.texto(envolver(`Nota: ${p.notas}`, "   "));
  }
  t.separador();

  // ── Totales ──
  const totalBruto = Number(resumen.total_bruto || 0);
  const total = Number(resumen.total || 0);
  const descuento = totalBruto - total;

  if (descuento > 0.009) {
    t.texto(lineaMonto("Subtotal", dinero(totalBruto)));
    const partesDesc = [];
    if (resumen.nombre_grado && Number(resumen.descuento_grado) > 0) {
      partesDesc.push(`${resumen.nombre_grado} ${Number(resumen.descuento_grado).toFixed(0)}%`);
    }
    if (resumen.codigo_promocional) {
      partesDesc.push(`${resumen.codigo_promocional} ${Number(resumen.porcentaje_descuento || 0).toFixed(0)}%`);
    }
    const etiqueta = partesDesc.length ? `Descuento (${partesDesc.join(" + ")})` : "Descuento";
    t.texto(lineaMonto(etiqueta, `-${dinero(descuento)}`));
  }

  t.negritas(true).tamano(0x01); // doble alto, mismo ancho de columna
  t.texto(lineaMonto("TOTAL", dinero(total)));
  t.tamano(0x00).negritas(false);

  const pagado = Number(resumen.total_pagado || 0);
  if (pagado > 0.009) {
    t.texto(lineaMonto("Pagado", dinero(pagado)));
    const resta = total - pagado;
    if (resta > 0.009) {
      t.negritas(true).texto(lineaMonto("RESTA", dinero(resta))).negritas(false);
    }
  }
  t.separador();

  // ── Propina sugerida (solo en la cuenta, no en recibo) ──
  if (!esRecibo) {
    const prop = (pct) => `$${Math.round((total * pct) / 100)}`;
    t.centrar();
    t.texto("Propina sugerida (voluntaria):\n");
    t.texto(`10%: ${prop(10)}   15%: ${prop(15)}   20%: ${prop(20)}\n`);
    t.separador();
  }

  if (esRecibo && extras.metodoPago) {
    t.centrar().negritas(true).texto(`PAGADO - ${extras.metodoPago}\n`).negritas(false);
    t.separador();
  }

  // ── Pie ──
  t.centrar();
  t.texto("Este documento no es un comprobante fiscal.\n");
  t.texto("¡Gracias por su visita!\n");
  t.cortar();

  return t.build();
};
