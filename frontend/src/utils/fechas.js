// Helpers de fecha CDMX-aware.
// La operación del negocio es en America/Mexico_City. La base de datos guarda
// timestamps en hora local CDMX, así que las fechas que enviamos al backend
// deben ser días CDMX, no días UTC del navegador.

const TZ = 'America/Mexico_City';

// Devuelve "YYYY-MM-DD" del día actual en CDMX, independiente de la zona del navegador.
export function hoyCDMX() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Convierte un Date (o algo parseable como Date) a "YYYY-MM-DD" en CDMX.
export function fechaCDMX(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date instanceof Date ? date : new Date(date));
}

// Día de la semana en CDMX (0=domingo ... 6=sábado), independiente del navegador.
export function diaSemanaCDMX(date = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(date instanceof Date ? date : new Date(date));
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[partes];
}
