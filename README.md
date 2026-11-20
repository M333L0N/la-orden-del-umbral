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
| Espacio / clic en la escena | Lanzar con la mano libre: Chispa (bosque), marcar raíz (jungla), trazar sello (cripta) |
| 1–8 | Comprar la entrada con ese número (cada fila muestra su tecla; no depende del orden) |
| C | Cambiar la cantidad de compra: ×1, ×10 o Máx |
| Z | Siguiente zona abierta |
| S | Sala de la Orden (portales con los tres magos) |
| A | Disipar una anomalía |

## Estructura

```
index.html          página: Sala de la Orden, vista detallada y tienda
css/style.css       estilos (escritorio: escena junto a la tienda; móvil: apiladas)
js/config.js        DATOS: zonas, 8 entradas por mago, precios, hitos económicos y visuales, mejoras, talentos
js/sim.js           SIMULACIÓN pura: modelos de zona (pasivo + ciclos con fase + secuencias), compras, prestigio
js/save.js          GUARDADO: validación, migración v0.1→v0.2, copia de seguridad, exportar/importar, offline (8 h)
js/art.js           pixel art: personajes en capas (túnica, tocado, foco), amenazas, objetos
js/scene.js         escenas Canvas 2D 256×144 y portales; solo dibuja (lee las fases económicas)
js/ui.js            interfaz HTML: Sala, tienda ordenada, metas, paneles, diálogos
js/main.js          controlador: arranque/migración, vistas, acciones, teclado, autoguardado
tools/              balance.js (ritmo simulado), browser.js (prueba en Chrome/Edge + capturas + hojas de contacto), load.js
tests/              logic.test.js (Node), autotest.js (en la página real), scenarios.js, movil.html, fixtures/ (guardados v0.1 reales)
```

Para añadir una zona: define sus entradas en `config.js` (`zones` y `zoneOrder`), su modelo en `sim.js` (`MODELS.<id>`: producción pasiva y ciclos) y su escena en `scene.js`.

## Comprobar

Solo hace falta Node y un Chrome o Edge ya instalados:

```
node tests/logic.test.js                      # lógica, migración, ciclos, balance (0 fallidas)
node tools/balance.js                         # tiempos simulados, huecos del bosque, compras por entrada
node tools/browser.js [carpeta]               # prueba en navegador real (file://, con recargas) + capturas
node tools/browser.js [carpeta] --solo-tiras  # hojas de contacto: estados visuales × cuadros de cada animación
```

Vistas de prueba (usan una partida aparte): `index.html#escena=sala50`, `bosque10`, `jungla100`, `cripta1`, `evo-crypt-chalk-24`; `index.html#tira=forest-spell` (cualquier `zona-entrada`); `tests/movil.html` (360 px).
