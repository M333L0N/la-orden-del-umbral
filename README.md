# La Orden del Umbral

Juego incremental de navegador en español. HTML, CSS y JavaScript nativos: sin dependencias, sin compilación y sin conexión a internet.

## Jugar

- **Doble clic en `index.html`.** Funciona abierto como archivo local (`file://`).
- **Servidor estático (opcional).** Sirve la carpeta tal cual. Con Python, que ya viene instalado en muchos equipos:
  ```
  python -m http.server 8080
  ```
  y abre <http://localhost:8080>.
- **Docker (opcional).** Solo si ya tienes una imagen local de nginx (el comando no descarga nada):
  ```
  docker run --rm --pull=never -p 8080:80 -v "%cd%":/usr/share/nginx/html:ro nginx:alpine
  ```
  En PowerShell, usa `${PWD}` en lugar de `%cd%`. Si no tienes la imagen, el comando falla sin descargar nada; usa una de las opciones anteriores.

La partida se guarda sola en el navegador. Si el navegador bloquea el guardado local, el juego sigue funcionando y lo avisa. En ese caso, usa **Partida → Exportar JSON**.

### Controles

| Tecla | Acción |
|---|---|
| Espacio / clic en la escena | Lanzar con la mano libre: Chispa, marcar raíz, trazar sello, lanzar ascuas, soplo helado |
| 1–8 | Comprar la entrada con ese número (cada fila muestra su tecla; no depende del orden) |
| C | Cambiar la cantidad de compra: ×1, ×10 o Máx |
| Z | Siguiente zona abierta |
| S | Sala de la Orden: portales con los magos y sus jefes |
| M | Mesa Redonda: mejoras de la Orden, talentos, hazañas y refundar |
| A | Disipar una anomalía |
| Esc | Omitir la secuencia de refundación |

## Estructura

```
index.html          página: Sala (Portales y Mesa Redonda), vista detallada, tienda, secuencia de refundación
css/style.css       estilos (notebook, escritorio y móvil)
js/config.js        DATOS: 5 zonas × 8 entradas, precios, hitos, mejoras de la Orden, talentos, hazañas, curva de Ecos
js/sim.js           SIMULACIÓN pura: modelos de zona (pasivo + ciclos con fase + secuencias), compras, prestigio, dominios
js/save.js          GUARDADO: validación, migraciones v0.1→v0.2→v0.3, copias de seguridad, exportar/importar, offline (8 h)
js/art.js           pixel art de los tres primeros magos, focos, objetos
js/bosses.js        jefes (reposo, impacto, derrota) y magos del castillo y las cavernas
js/scene.js         escenas Canvas 2D 256×144, hechizos insignia, portales y Mesa; solo dibuja
js/ui.js            interfaz HTML: Sala, Mesa, tienda ordenada con vista previa, diálogos, refundación
js/main.js          controlador: arranque/migración, vistas, acciones, teclado, autoguardado
tools/              balance.js (ritmo, perfiles de 48 h, tramos), browser.js (prueba en Chrome/Edge + capturas), load.js
tests/              logic.test.js (Node), autotest.js (página real), scenarios.js, movil.html, fixtures/ (guardados v0.1 y v0.2 reales)
```

Para añadir una zona: define sus entradas y su condición de apertura en `config.js` (`zones`, `zoneOrder`), su modelo en `sim.js` (`MODELS.<id>`) y su escena y jefe en `scene.js`/`bosses.js`.

## Comprobar

Solo hace falta Node y un Chrome o Edge ya instalados:

```
node tests/logic.test.js                        # lógica, migraciones, ciclos, Ecos, balance (0 fallidas)
node tools/balance.js [--tramos] [--perfiles]   # tiempos simulados; tramos de ×10 que apenas aportan; perfiles de 48 h
node tools/browser.js [carpeta]                 # prueba en navegador real (file://, con recargas) + capturas + hojas de jefes e insignias
node tools/browser.js [carpeta] --responsive    # 1280×720, 1366×768, 1536×864, 1920×1080 y zoom 125 %
node tools/browser.js [carpeta] --solo-tiras    # hojas de contacto por entrada: estados visuales × cuadros
```

`ARCANE_ROOT=<carpeta> node tools/balance.js` mide otra versión del juego con la misma estrategia (útil para comparar antes/después).

Vistas de prueba (usan una partida aparte): `index.html#escena=sala10`, `mesa10`, `castillo10`, `cavernas100`, `confirmar10`, `refundacion10`; `index.html#jefes`; `index.html#insignias`; `index.html#tira=castle-phoenix`; `tests/movil.html` (360 px).
