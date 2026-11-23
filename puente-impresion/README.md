# Puente de impresión Regente

Programa que corre en una PC del bar, consulta la cola de impresión del backend
(Heroku) cada 2 segundos y manda las cuentas a la impresora térmica.

```
Teléfono mesera → Backend (Heroku) → este puente (PC del bar) → impresora (red o USB)
```

## Requisitos

- Node.js 18 o más nuevo (https://nodejs.org, versión LTS)
- La PC debe estar en la misma red que la impresora (modo red)
- El backend debe tener configurada la variable `PRINTER_TOKEN`

## Instalación

1. Copia esta carpeta (`puente-impresion/`) a la PC, por ejemplo a `C:\regente-puente\`.
2. Copia `config.example.json` a `config.json` y edítalo:
   - `api_url`: URL del backend (ej. `https://tu-app.herokuapp.com`)
   - `printer_token`: el MISMO valor que `PRINTER_TOKEN` en Heroku
   - `impresora.ip`: IP fija de la impresora en la red del bar
3. Prueba manualmente:
   ```
   node puente.js
   ```
   Debe decir "Puente iniciado". Imprime una cuenta desde Regente para verificar.

## Arranque automático en Windows

Opción simple (carpeta de inicio):

1. Crea un archivo `puente.vbs` junto a `puente.js` con:
   ```vbs
   CreateObject("Wscript.Shell").Run "node C:\regente-puente\puente.js", 0, False
   ```
   (el `0` lo corre sin ventana)
2. Presiona `Win+R`, escribe `shell:startup`, Enter.
3. Pega un acceso directo a `puente.vbs` en esa carpeta.

Con eso el puente arranca al encender la PC. Para verificar que corre:
Administrador de tareas → pestaña Detalles → buscar `node.exe`.

Opción robusta: instalarlo como servicio con [NSSM](https://nssm.cc)
(`nssm install RegentePuente "C:\Program Files\nodejs\node.exe" "C:\regente-puente\puente.js"`),
que además lo reinicia si truena.

## Configuración de la impresora (una sola vez)

1. Conéctala por cable de red al módem/switch del bar.
2. Imprime la auto prueba (encender con FEED presionado, soltar al primer sonido)
   para ver su IP.
3. Fija esa IP: resérvala en el router (recomendado) o configúrala estática.
   Si la IP de fábrica (192.168.123.100) no está en la subred del bar, usa la
   utilidad del fabricante o el método de la nota de abajo para cambiarla.
4. Pon la IP en `config.json`.

Nota: muchas impresoras genéricas aceptan cambio de IP vía su página web interna
(http://IP-de-la-impresora) estando tu PC en la misma subred temporal.

## Diagnóstico

- **"Sin conexión con el backend"**: revisa internet de la PC y que `printer_token`
  coincida con el de Heroku.
- **"Timeout conectando a la impresora"**: la impresora está apagada, sin cable,
  o la IP en `config.json` no es la correcta. Prueba: `ping IP-de-la-impresora`.
- **En Regente aparece "impresora sin conexión"**: el puente no está corriendo
  (PC apagada o el proceso murió). Reinicia la PC o corre `node puente.js` a mano.
- Las cuentas NO se pierden: quedan en cola y salen cuando el puente vuelve.
