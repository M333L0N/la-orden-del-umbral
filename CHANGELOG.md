# Bitácora — La Orden del Umbral

Formato: la sección **En curso** se actualiza mientras se trabaja. El comando «CIERRE ARCANO» la convierte en una versión cerrada (ver `CLAUDE.md`). Esta bitácora no depende de Git.

## En curso

Objetivo: v0.2.0, una expansión jugable completa. Incluye la Sala de la Orden, la tercera zona, 8 entradas por mago, hechizos que evolucionan en movimiento, nuevas mejoras de la orden y talentos, y la migración de partidas v0.1.

### Funcionalidades
- **Sala de la Orden** (botón fijo arriba y tecla S). Hay un portal vivo por zona abierta: muestra una versión simplificada de su escena real, con menos partículas, y un marco de piedra que late. Junto a cada portal aparecen el nombre, el saldo, la producción media y el próximo hito. Al pulsarlo se entra en la vista detallada; las compras siguen dentro. Una partida nueva abre en el bosque; después se recuerda la última vista, también la Sala. En pantallas estrechas los portales se apilan.
- **Coherencia entre portal y detalle.** Cada zona tiene un único estado visual. Sus efectos llevan el instante en que nacen, y los indicadores (carga del pulso, raíces cortadas, estrellas, alineación de la órbita) se leen de las fases de la simulación. Un pulso ocurrido con la Sala abierta se ve al entrar en la cripta. Cambiar de vista no acredita nada.
- **Jungla de las Mil Bocas** (id `jungle`, segunda en pantalla). Se descubre con 80/s automáticos en el bosque.
  - La herborista de poda marca raíces con la mano libre. Su Grimorio de Poda flota sobre la otra mano y poda solo.
  - Cada 5 podas o marcas, la secuencia de raíces del suelo florece. La secuencia se lee en los nudos (corrompido → cortado) y en un contador.
  - La Reina Injerto abre sus bocas al florecer.
  - Su moneda propia es la savia de la jungla. Funciona en paralelo y offline.
- **8 entradas por mago (24)**: foco, túnica, tocado, accesorio y 4 hechizos o rituales. Se descubren de forma gradual («Por descubrir: ??? — se revela con…»). Se conservan los IDs, niveles y nombres de la v0.1.
- **Hitos visuales separados de los económicos.** Formas en 0, 10, 50, 100, 150, 200 y 250 (tope artístico); los objetos con tope usan 10 y su tope.
  - El Círculo de Tiza culmina en el Nv 24 con su forma final y la tienda deja de anunciar niveles imposibles.
  - La apariencia se calcula desde el nivel real: un báculo Nv 70 importado se ve como Nv 50.
- **Hechizos que evolucionan en movimiento.** Cambian la trayectoria, la forma, el impacto o la reacción de la amenaza; los efectos decorativos no pagan nada extra.
  - Ejemplo, Lluvia: chispa → cometa curvo → se parte → fragmentos que convergen → constelación tras el cristal → segunda oleada → eclipse que revela al Ciervo.
  - Los focos cambian cómo canalizan: los fragmentos del báculo se abren al cargar y se cierran al disparar; el grimorio pasa una página, luego dos, y en su forma final varias páginas lanzan la hoja.
  - Túnica y tocado se ven por separado y reaccionan al lanzar.
- **Mano libre.** El lanzamiento manual nace del brazo libre con un gesto: una estrella blanca recta, un sello verde sobre la raíz o un sello ámbar que cae al círculo. Se distingue del ataque automático del foco.
- **Amenazas solo visuales.** El Ciervo Hueco se revela tras el cristal al recibir magia. La Reina Injerto abre sus bocas. El Rey sin Réquiem se materializa con la carga y se disipa con la campanada. No hay daño ni barras de vida.
- **Maestría de Chispa (cosmética).** Avanza con las chispas automáticas: estela bifurcada (250), trenzada (2500) y halo de estrellas (25000). Se conserva al refundar.
- **Tienda en filas compactas.** Cada fila tiene icono, nombre, nivel, precio, beneficio y una tecla. Un detalle desplegable muestra el próximo hito visual con una pista, el tope y el salto económico.
  - El orden va por precio: en ×1, el próximo nivel; en ×10, el lote real (recortado si llega al tope); en Máx, el próximo nivel, con el total real en el botón. Los completados van al final.
  - El orden no cambia bajo el cursor ni con el foco dentro.
  - Las teclas 1–8 siguen a la identidad del objeto, no a su posición.
  - La vista previa muestra el valor indirecto, por ejemplo «+136/s · cripta +272/pulso».
- **Mejoras de la orden** (4). Se conservan Confluencia (bosque → cripta) y Resonancia. Nuevas:
  - Polen Astral (la paga la jungla): N s de la Lluvia del bosque por floración.
  - Raíz Estelar (la paga el bosque): N s de la producción propia de la jungla por descarga de la Órbita.

  Cada aporte va en una sola dirección y lee la producción propia de la zona de origen, así que no se retroalimenta.
- **Talentos** (5). Se conservan los tres de la v0.1. Nuevos:
  - Semilla de la Fundadora: la jungla reabre con una raíz madura y las floraciones rinden +50 %.
  - Cielo Recordado: los 4 hechizos del bosque se ven desde el inicio y rinden +50 %; maestría ×2.

  Cada talento muestra «En la próxima partida: …».
- **Refundar** muestra el aporte de cada zona; la savia cuenta ×0,5.
- **Empezar desde cero** (Partida). Es distinto de refundar: avisa de que se pierden Ecos y talentos, ofrece exportar y pide marcar una casilla. Cancelar no toca nada.
- **Migración v0.1 → v0.2.**
  - Antes de sobrescribir se guarda el original tal cual en `ordenUmbral.save.respaldo-v1`, exportable desde Partida.
  - Si esa copia no se puede guardar, no se sobrescribe el original y se avisa para exportar.
  - Si un guardado no se puede migrar, se ofrece exportar el original o empezar de nuevo.
  - El tiempo offline previo a la actualización no genera contenido nuevo (ni floraciones ni maestría).
  - No se conceden Ecos por actualizar.

### Decisiones de diseño
- **Funciones de las entradas.** Cada mago repite el patrón: el foco automatiza; el accesorio refuerza al foco (Anillo, Collar, Medallón); la túnica o el hechizo produce de forma pasiva; el tocado modifica algo concreto (la Lluvia, el intervalo de poda, la Confluencia recibida). Así se evita que todo sea un multiplicador global.
- **Flor de las Mil Bocas.** Suma una cantidad fija por floración en vez de multiplicar sobre el Polen. Con multiplicadores encadenados, la jungla llegaba a 12 M/s a los 8 min.
- **Cielo Recordado.** No regala la Lluvia. Con ella gratis, la jungla se abría en el segundo 0.
- **Umbral de la jungla: 80/s.** Con 40/s quedaba demasiado cerca de la primera evolución.
- **Meta de refundación: 60 M → 1 000 M (1e9).** Con tres zonas y 24 entradas, 60 M llegaba a los ~15 min. Tu partida migrada conserva su maná generado, pero la meta ahora está más lejos.
- **Anillo: crecimiento ×1,7 → ×1,6.** En la v0.1 dejaba de convenir hacia el Nv 13–14: su recuperación pasaba de ~670 s en Nv 10 a ~5600 s en Nv 14, por encima de la Lluvia (~1500 s). En la simulación v0.2 llega al Nv 18 (antes 15).
- **Refundar conserva la maestría**, por ser del aprendiz y cosmética.

### Balance (`node tools/balance.js`)
Estrategia: 1 clic/s hasta el primer foco de cada zona; cada 20 s compra lo de mejor coste / (aumento en la zona que paga + ½ del aumento en las demás).

| Hito | Objetivo | v0.1 simulado | v0.2 simulado |
|---|---|---|---|
| Primer báculo | 10–20 s | 0:12 | 0:12 |
| Primera evolución | 2–5 min | 3:40 | 3:40 |
| Jungla descubierta | entre evolución y cripta | — | 5:20 |
| Grimorio y primera floración | — | — | 5:25 |
| Cripta | 10–20 min | 13:40 | 11:40 |
| Confluencia | — | 15:20 | 15:20 |
| Primer prestigio (3 Ecos) | 35–60 min | 48:03 | 39:36 |

Segunda partida (simulada): Báculos heredados 33:16, Cielo Recordado 33:43, Campanas eternas 34:21, Semilla de la Fundadora 36:42.

Aporte al total en la primera refundación (simulado): bosque 51 M, jungla 185 M (ya ponderada ×0,5) y cripta 1542 M.

**El bosque mientras se ahorra** (antes → después):
- En 50 min de la v0.1 hubo 122 compras; en la v0.2 hay 210 hasta el prestigio.
- Huecos más largos: v0.1 240 s (29–33 min), 200 s (19:00–22:20, esperando el anillo 8) y 160 s (13:40–16:20, esperando el báculo 35). v0.2: 220 s esperando Confluencia Nv 4 (una gran compra) y luego 80 s.
- Tramo 19:00–22:20: de 0 compras a 21 de 8 tipos (báculo, anillo, Prisma, Órbita…).
- Tramo 13:40–16:20: de 0 compras a 7, más la Lluvia de Cometas (Nv 10) y la maestría de Chispa II (14:55).

Todas las entradas se compran en 70 min de juego normal. Primera compra de cada una: Constelación 24:00, Letanía 20:20, Prisma 20:20, Injerto 18:20; el resto antes.

Todavía no hay tiempos observados jugando.

### Entradas por zona
Función y hito visual más fácil de probar. «Hojas» = hojas de contacto revisadas en Chrome (estados × cuadros); «lógica» = cubierto por `logic.test.js`.

**Bosque del Velo**
| Entrada | Función | Hito más fácil | Comprobado |
|---|---|---|---|
| Báculo de Rama | Chispas automáticas | Nv 10: cristal atado, estela | navegador + hojas |
| Túnica Gastada | maná propio | Nv 10: tela teal con ribete | captura |
| Capucha de Astrónomo | Lluvia +20 %/nv | Nv 10: estrella de latón | hojas |
| Anillo de Cobre | báculo +25 %/nv | Nv 10: gema que destella al lanzar | hojas |
| Lluvia de Chispas | maná desde el cielo | Nv 10: cometa curvo; 50: se parte | hojas (7 estados) |
| Órbita Gemela | descarga cada 10 s | Nv 50: rayo vertical en la alineación | hojas |
| Prisma del Velo | maná por chispa automática | Nv 10: rayo bifurcado | hojas |
| Constelación del Ciervo | figura cada 28 chispas | Nv 50: la figura dibuja la testa | hojas + lógica |

**Jungla de las Mil Bocas**
| Entrada | Función | Hito más fácil | Comprobado |
|---|---|---|---|
| Grimorio de Poda | poda automática | Nv 50: pasa dos páginas | navegador + hojas |
| Túnica de Corteza | savia propia | Nv 10: vetas verdes | hojas |
| Tocado de Espinas | intervalo de poda (tope Nv 20) | Nv 10: hojas entre espinas | hojas + lógica |
| Collar de Semillas | poda +10 %/nv | Nv 10: brote al podar | hojas |
| Hoja de Siega | +4 por poda/nv | Nv 10: media luna en arco | hojas (7 estados) |
| Polen Errante | floración +20 %/nv | Nv 50: se divide sobre las raíces | hojas |
| Injerto de Luna | raíz lateral cada 12 s | Nv 10: brillo lunar | hojas + lógica |
| Flor de las Mil Bocas | +400 fijo por floración/nv | Nv 10: bocas con dientes | hojas |

**Cripta de las Campanas**
| Entrada | Función | Hito más fácil | Comprobado |
|---|---|---|---|
| Báculo de Latón | pulsos automáticos | Nv 10: gema ámbar | navegador + hojas |
| Vestidura de Vigilia | maná propio | Nv 10: ribete ámbar | hojas |
| Mitra del Último Eco | Confluencia recibida +10 %/nv | Nv 1: reemplaza el sombrero | hojas |
| Medallón Funerario | pulso base +15 %/nv | destella al pulsar | hojas |
| Campana | pulso +30 %/nv | Nv 10: doble onda | hojas (7 estados) |
| Círculo de Tiza | intervalo (tope Nv 24) | Nv 24: forma final con cilindro de runas | captura + lógica |
| Incienso de Vigilia | maná/s × campana | Nv 10: el humo sube en espiral | hojas |
| Letanía de la Corona | ½ pulso base/nv cada 6 pulsos | la corona se dibuja sobre el Rey | hojas + lógica |

### Verificación
- **Lógica** (`node tests/logic.test.js`): **111/111**. Cubre:
  - 8 entradas únicas por zona y su distribución (foco, túnica, tocado, accesorio, 4 hechizos).
  - Topes: ×10 recortado y sin cobro tras el tope.
  - Límites visuales 9/10/11 y 249/250/251; tiza 23/24.
  - Jungla: la marca manual provoca floración; jugar activo (2000 pasos) da lo mismo que offline (74,2 s); recarga a mitad de ciclo.
  - Mejoras cruzadas sin retroalimentación ni dobles cobros.
  - Vista previa con valor indirecto.
  - Migración con los fixtures v0.1 reales: niveles, Campana y Círculo de Tiza, Báculos heredados, Ecos sin extra, fase del pulso, jungla habilitada sin floraciones, offline legado sin maestría, no se repite ni duplica.
  - Validación de importaciones, offline de 8 h.
  - Prestigio con tres zonas (×0,5) y talentos nuevos.
  - Las 24 entradas compradas en la simulación; tiempos de balance dentro de los objetivos.
- **Navegador real** (`node tools/browser.js`; Chrome headless sobre `file://`, pulsando botones y teclas): **63/63**, con **tres recargas reales**. Cubre:
  - Partida nueva y mano libre.
  - Tienda: orden por precio en ×1 y ×10, orden congelado bajo el cursor, tecla 2 = túnica, Máx con total, evolución ×10 con su detalle.
  - Jungla y Sala (tecla S, portales, sellado anunciado, portal → jungla), floración por marcas, grimorio y podas automáticas.
  - Cripta, Confluencia y vista previa «cripta +X/pulso».
  - Pulso ocurrido en la Sala = mismo pulso al entrar; cambiar de vista u ocultar la pestaña no acredita.
  - Refundar con tres zonas y Cielo Recordado.
  - Empezar desde cero: cancelar, intentar sin casilla y confirmar.
  - Migración real desde un guardado v0.1 en el almacenamiento: copia exacta, v2, niveles, Báculo del Velo Nv 70, sin Ecos extra, informe que distingue la v0.1, botón de copia.
  - Segunda recarga sin repetir la migración ni duplicar; recarga a mitad de pulso exacta.
  - Offline de 8 h con los tres magos; tres portales; movimiento reducido; guardado bloqueado.
- **Capturas y hojas de contacto** (Chrome headless, revisadas a mano):
  - Sala en escritorio (3 portales a 2×) y 360 px (apilados).
  - Jungla Nv 10.
  - Hojas de Lluvia, Órbita, Hoja de Siega y Campana con 7 estados × 6–8 cuadros. En las hojas, los cuadros se fuerzan desde el test: prueban el render y la trayectoria, no la fluidez.
- **Arreglos encontrados al verificar:**
  - Los efectos nacidos al impactar (constelación, prisma, chispas) se perdían porque la lista se reemplazaba al recorrerla.
  - Un cuadro tardío saltaba el impacto de la Lluvia.
  - Los efectos posteriores al impacto usaban el reloj real en lugar del tiempo del cuadro.
  - Una actualización forzada reordenaba la tienda bajo el cursor.
  - El detalle de una fila se abría vacío.
- **Sin comprobar:**
  - Fluidez real con los 4 hechizos activos y la Sala de fondo durante minutos (CPU).
  - Edge, Firefox y un móvil real.
  - Las hojas de los hechizos restantes revisadas una por una a tamaño completo: se generan con `--solo-tiras`, pero solo inspeccioné en detalle las 4 citadas.

## v0.1.0 — 2026-11-20 — Cerrada

Punto de partida: carpeta vacía (proyecto inicial).

### Informe de cierre

````markdown
# La Orden del Umbral — v0.1.0 — 2026-11-20
Estado: Cerrada

## Qué se puede jugar ahora
Juego incremental de navegador en español: HTML, CSS y JS nativos que abren con doble clic, con pixel art propio en Canvas. El jugador empieza como un aprendiz que lanza Chispas a mano contra un cristal en el Bosque del Velo. Compra un báculo que lanza solo y equipa anillo, túnica y un hechizo, que evolucionan a la vista en los niveles 10, 50, 100 y cada 50 después. Al alcanzar 400 de maná por segundo en el bosque se abre la Cripta de las Campanas. Allí una maga traza sellos y luego libera pulsos automáticos, con su propio saldo, mientras el bosque sigue produciendo. «Confluencia» une ambas zonas. Al final se puede «Refundar la orden» a cambio de Ecos, y gastarlos en un talento permanente que cambia la partida siguiente.

## Cambios y arreglos
- **Bosque del Velo.** Lanzamiento manual (+1 de maná y +0,25 s de la producción automática). Cuatro objetos con funciones distintas:
  - Báculo de Rama: lanza solo; cuesta 10.
  - Anillo: refuerza el báculo, +25 % por nivel.
  - Túnica: produce por sí misma.
  - Hechizo Lluvia de Chispas: cae del cielo sobre el cristal.

  La escena muestra chispas en arco del báculo al cristal (también las automáticas), motas de la túnica y lluvia del hechizo.
- **Cripta de las Campanas.** Se abre con 400/s automáticos en el bosque. Se puede entrar y salir libremente.
  - La maga despierta con una animación y traza sellos a mano hasta comprar su báculo; desde ahí carga y libera pulsos solos.
  - Campana: +30 % de potencia por nivel.
  - Círculo de tiza: acorta el intervalo hasta un mínimo de 1,5 s.
  - La carga se ve en la escena (sellos que se encienden, un haz y una barra); al liberarse, un pulso sube a la campana y la hace oscilar. Junto a la escena se ven la recompensa por pulso, el intervalo y la media por segundo.
- **Evoluciones.** Saltos de potencia en Nv 10 (×2), 50 (×3), 100 (×2) y cada 50 después (×2), cada uno con nombre y arte propios:
  - Nv 10: túnica teal y báculo con cristal.
  - Nv 50: manto con capucha y báculo tallado con fragmentos flotantes.
  - Nv 100 o más: aura, runas en órbita y núcleo blanco, combinados.
  - La transformación se ve en la escena: alterna sprite viejo y nuevo con destello y columna de luz.
  - La tienda anticipa el próximo hito. La compra ×1, ×10 o Máx cobra el coste acumulado exacto y aplica todos los hitos atravesados. Cada compra muestra en el registro la producción antes y después.
- **Mejoras de la orden.**
  - Confluencia (la paga el bosque): cada pulso suma unos segundos de la producción automática del bosque, y el bosque conserva su maná. Antes de comprar se explica con los números actuales; después se desglosa en base + Confluencia.
  - Resonancia de Báculos (la paga la cripta): +50 % a ambos báculos.
- **Prestigio.** Requiere explorar la cripta y generar 60 M de maná sumando ambas zonas. Los Ecos dependen del maná generado, así que comprar nunca los reduce. El diálogo de confirmación muestra los Ecos, lo que se reinicia y lo que se conserva. Hay tres talentos: Báculos heredados, Campanas eternas y Memoria del Velo.
- **Anomalía mágica.** Aparece en la escena cada 70–130 s. Disiparla con un clic o la tecla A da 20 s de producción; ignorarla no afecta nada.
- **Guardado y offline.**
  - Autoguardado local; exportar e importar JSON con validación previa; migraciones versionadas.
  - Si el navegador bloquea el guardado, el juego avisa y sigue siendo jugable.
  - Se acreditan hasta 8 h offline, con un informe por mago. Se conserva la fase del pulso al recargar. Ambas zonas producen aunque una esté oculta.
- **Interfaz.** Escena junto a la tienda en escritorio y apiladas en móvil. Saldos, producción y zona activa siempre visibles. Meta concreta calculada con datos reales (p. ej. «3 lanzamientos para comprar el Báculo de Rama», «Báculo de Rama 8/10 · al evolucionar duplicará su producción»). Teclado (Espacio, 1–4, C, Z, A), foco visible y movimiento reducido.
- **Arreglos durante la versión:**
  - El saldo de Ecos aparecía desde el inicio; ahora solo aparece al poder refundar.
  - Los números grandes mostraban «1000 mil M»; ahora pasan a la unidad siguiente.
  - La campana se veía diminuta tras el pulso; ahora es más grande.
  - Si una evolución y la apertura de la cripta coincidían, un anuncio tapaba al otro; ahora se muestran en cola, y la cola se vacía al cambiar de zona.
  - Las animaciones y los temporizadores de la interfaz dependían del reloj de los cuadros de animación; ahora usan el reloj del sistema.

## Balance y decisiones
- **Objetos del bosque** (coste base · crecimiento · efecto):
  - Báculo de Rama: 10 · ×1,17 · 0,5/s por nivel.
  - Anillo: 300 · ×1,7 · +25 % al báculo.
  - Túnica: 80 · ×1,18 · 2,5/s.
  - Lluvia de Chispas: 6000 · ×1,2 · 30/s.
- **Objetos de la cripta:**
  - Báculo de Latón: 15 · ×1,25 · pulso de 5 por nivel.
  - Campana: 100 · ×1,8 · +30 %.
  - Círculo de tiza: 80 · ×1,8 · intervalo = 5 s / (1 + 0,05 · nivel · hito), con mínimo de 1,5 s (se alcanza en el Nv 24). Sello manual: 3.
- **Umbrales y orden:**
  - Cripta: 400/s automáticos en el bosque.
  - Confluencia: 40 K ×5 por nivel; 3/5/8/12/18 s; máx. 5.
  - Resonancia: 8 K ×6 por nivel; +50 %; máx. 10.
  - Prestigio: 60 M generados; Ecos = ⌊3·√(total/60 M)⌋.
- **Talentos:**
  - Báculos heredados (2 Ecos): empiezas con el primer báculo y ambos báculos rinden ×1,5.
  - Campanas eternas (2, luego 4, 8…): pulsos +100 % por nivel.
  - Memoria del Velo (3): bosque +25 %.
- **Ajuste durante el desarrollo:**
  - Primer intento: prestigio a los ~6 min y cripta a los ~3 min, porque la cripta crecía de forma explosiva.
  - Cambios: costes y crecimientos más altos, pulso base 8 → 5, umbral de la cripta 300 → 400/s, meta 4 M → 60 M.
- **Tiempos** (objetivo de diseño → simulado):

  | Hito | Objetivo | Simulado |
  |---|---|---|
  | Primer báculo | 10–20 s | 0:12 |
  | Primera evolución | 2–5 min | 3:40 |
  | Cripta | 10–20 min | 13:40 |
  | Confluencia | — | 15:20 |
  | Primer prestigio (3 Ecos) | 35–60 min | 48:03 |
  | 4 Ecos | — | 56:13 |

  Estrategia simulada: 1 clic/s solo hasta el primer báculo de cada zona; cada 20 s compra lo de mejor coste/aumento de producción total, o ahorra para ello.
- **Segunda partida (simulada):** con Báculos heredados, cripta 10:00 y prestigio 35:29; con Campanas eternas, prestigio 38:44.
- **Tiempos observados jugando:** todavía no hay.
- **Decisiones:**
  - Cada mago paga con su propio maná. Confluencia la paga el bosque y Resonancia la cripta.
  - A Báculos heredados se le añadió ×1,5, porque solo con el báculo inicial la partida siguiente cambiaba unos 10 s.
  - La cripta vuelve a sellarse al refundar.
  - Importar una partida no acredita tiempo offline.

## Verificación
- **Prueba de lógica (Node, 66/66):** cubre compras ×10 y Máx que cruzan hitos (coste exacto y multiplicadores), determinismo (1000 pasos = un salto de 37 s), tope de la tiza y Confluencia (el bosque no pierde maná). También recarga a mitad de pulso sin duplicar ni perder, límite de 8 h y reloj que retrocede, siete tipos de JSON inválido rechazados, migración, prestigio y talentos, y tiempos de balance dentro de los objetivos.
- **Prueba en navegador real (Chrome headless sobre file://, 61/61):** pulsa botones y teclas de la página de verdad y recorre todo el camino:
  1. Partida nueva y primer báculo.
  2. Compra ×10 que cruza el Nv 10, con anuncio y transformación.
  3. Apertura de la cripta y despertar de la maga; báculo de la maga y pulsos automáticos.
  4. Confluencia explicada, comprada y desglosada; anomalía.
  5. Refundar → 3 Ecos → talento → nueva partida con el efecto aplicado.
  6. Exportar, rechazar un JSON inválido e importar.
  7. Recarga real de la página a mitad de pulso (fase y pulsos exactos).
  8. Offline de 10 h limitado a 8 h, movimiento reducido y guardado bloqueado (aviso, sin dejar de jugar).
- **Servidor estático:** la misma prueba por HTTP local (`python -m http.server`) pasó cuando tenía 57 comprobaciones.
- **Capturas revisadas a mano** (Chrome headless): bosque en Nv 1, 10, 50, 100 y 150; cripta en Nv 1, 10, 50 y 100; tres evoluciones a mitad de animación; vista de 360 px sin desbordar. En headless los cuadros de animación se fuerzan desde el test: prueba el render, no la fluidez.
- **Simulación económica:** `node tools/balance.js` (ver la tabla de tiempos).
- **Sin comprobar:**
  - Fluidez de la animación en un navegador interactivo.
  - Edge, Firefox y un móvil real.
  - Un offline real de horas con el reloj del sistema.
  - El comando Docker del README: no hay una imagen de nginx local.

## Qué conviene probar jugando
1. **Primeros 4 minutos:** compra el báculo y súbelo al Nv 10 con ×10. ¿Se distingue a simple vista la transformación (destello y columna de luz) y el nuevo báculo con cristal? Los personajes miden 16×24 px: ¿se leen bien a tu tamaño de pantalla?
2. **Tras abrir la cripta:** lee la explicación de Confluencia en la pestaña «Orden» antes de comprarla y fíjate después en el desglose del pulso. ¿Se entiende? ¿Sientes que vale la pena volver al bosque para subir su producción?
3. **Recarga y tiempo fuera:** recarga la página durante un pulso: la carga debe seguir donde iba, sin un pulso extra. Cierra el juego unos minutos y vuelve: debe aparecer el informe de lo que ganó cada mago.

## Pendientes conocidos
- El arte de Nv 50 del círculo de tiza nunca se ve, porque el objeto llega a su tope en el Nv 24.
- El tamaño de los personajes (16×24 en una escena de 256×144) está pendiente de que alguien lo valore jugando; si resulta pequeño, la opción es redibujar los sprites más grandes o acercar la cámara.
- El balance solo está simulado, sin tiempos observados jugando. El anillo encarece mucho en niveles altos (×1,7 por nivel), lo que en la práctica lo frena en torno al Nv 15–20.
- En pantallas de menos de 512 px la escena se escala a un tamaño no entero, con píxeles algo irregulares.
- No hay sonido.
````

### Notas de desarrollo de esta versión

#### Funcionalidades
- **Bosque del Velo.** El aprendiz lanza Chispa contra un cristal (+1 de maná por lanzamiento y +0,25 s de la producción automática). Objetos:
  - Báculo de Rama (10 de maná): lanza solo.
  - Anillo: +25 % al báculo por nivel.
  - Túnica: genera maná por sí misma.
  - Hechizo Lluvia de Chispas: cae del cielo sobre el cristal.
- **Cripta de las Campanas.** Se abre cuando el bosque produce 400/s de forma automática; el umbral se ve en la barra superior y en la meta. Se puede entrar y salir libremente (tecla Z o el saldo «Cripta»). La maga despierta con una animación y traza sellos a mano hasta comprar su Báculo de Latón; desde ese momento carga y libera pulsos solos.
  - Campana: aumenta la potencia del pulso.
  - Círculo de tiza: acorta el intervalo hasta un mínimo de 1,5 s, que se alcanza en el Nv 24; a partir de ahí no admite más niveles.
  - La escena muestra la carga con sellos que se encienden, un haz del báculo al círculo y una barra bajo la campana. Junto a la escena se ven la recompensa por pulso, el intervalo y la media por segundo.
  - Cada zona tiene su propio saldo.
- **Evoluciones.** Saltos de potencia en Nv 10 (×2), 50 (×3), 100 (×2) y cada 50 después (×2). Cada estado tiene un nombre (p. ej. Báculo de Rama → de Cristal → del Velo → Astral) y un arte propio:
  - Nv 10: túnica teal con ribete y cristal atado al báculo.
  - Nv 50: manto con capucha, báculo tallado en horquilla con fragmentos flotantes, anillo dorado con chispas en órbita y campana con runas.
  - Nv 100 o más: se combinan aura, runas en órbita y núcleo blanco, en mayor cantidad según el nivel.
  - La transformación se ve en la escena: alterna el sprite viejo y el nuevo, con destello y columna de luz, y un anuncio.
  - La tienda anticipa el próximo hito y su efecto. Se puede comprar ×1, ×10 o Máx, con el coste acumulado exacto y aplicando todos los hitos atravesados.
- **Mejoras de la orden.**
  - Confluencia (la paga el bosque): cada pulso suma N s de la producción automática del bosque y el bosque conserva su maná. Antes de comprar explica el efecto con los números actuales; después desglosa el último pulso en base + Confluencia.
  - Resonancia de Báculos (la paga la cripta): +50 % a ambos báculos.
- **Prestigio «Refundar la orden».** Requiere explorar la cripta y generar 60 M de maná en la partida (ambas zonas). Ecos = ⌊3·√(total/60 M)⌋, calculados sobre el maná **generado**, así que comprar nunca los reduce. Antes de confirmar, el diálogo muestra los Ecos, lo que se reinicia y lo que se conserva. Talentos:
  - Báculos heredados (2 Ecos): empiezas con el Báculo de Rama, la maga despierta con su báculo y ambos báculos rinden ×1,5.
  - Campanas eternas (2 Ecos, luego 4, 8…): pulsos +100 % por nivel; la maga muestra un aura.
  - Memoria del Velo (3 Ecos): +25 % a la producción del bosque.
- **Anomalía mágica.** Aparece cada 70–130 s en la escena activa y dura 18 s. Disiparla con un clic o la tecla A da 20 s de producción de esa zona. Si se ignora, la producción sigue igual.
- **Guardado.** Automático cada 5 s, al comprar y al cerrar o ocultar la pestaña.
  - Exportar a archivo o al portapapeles, e importar desde texto o archivo. El JSON se valida antes de reemplazar la partida; los errores no tocan la partida actual.
  - Si un guardado local está dañado, se guarda una copia aparte y empieza una partida nueva.
  - Si el navegador bloquea el guardado, la sesión sigue y se avisa que se puede exportar.
  - Hay migraciones versionadas (`saveVersion` 1).
- **Offline.** Se acreditan hasta 8 h, con un informe por mago (aprendiz, maga, pulsos y la parte de Confluencia). Se conserva la fase del pulso. Las dos zonas producen aunque una esté oculta. Si la pestaña estuvo dormida más de 2 min, se trata como offline.
- **Interfaz.**
  - Escena junto a la tienda en escritorio; apiladas en móvil.
  - Saldos, producción y zona activa siempre visibles en una barra fija.
  - Meta concreta calculada con datos reales, más una pista de la evolución más cercana.
  - Registro de cuánto aportó cada compra (antes → después).
  - Teclado: Espacio, 1–4, C, Z y A. Foco visible.
  - Opción de movimiento reducido, que por defecto sigue `prefers-reduced-motion`.

#### Decisiones de diseño
- **Saldos y pagos.** Cada mago paga sus objetos con su propio maná. Las mejoras de la orden cruzan zonas: Confluencia la paga el bosque y Resonancia la cripta, así que cada zona financia la mejora que alimenta a la otra.
- **Producción continua.** La producción automática del bosque es continua. Las chispas visibles son solo representación, y el número flotante agrega la producción real cada 1,2 s.
- **Clics opcionales.** Después del primer báculo de cada zona, los clics no son necesarios. El lanzamiento manual escala un poco con la producción (+0,25 s en el bosque y +10 % del pulso en la cripta) para que el juego activo no quede en cero.
- **Talento Báculos heredados.** Además de «empezar con el primer báculo», da ×1,5 a ambos báculos. Solo con el báculo inicial, la diferencia era de unos 10 s (inapreciable). Con ×1,5, la segunda partida se nota (prestigio a los ~35 min frente a ~39 min con Campanas eternas).
- **Prestigio y cripta.** Al refundar, la cripta vuelve a sellarse y se reabre con el mismo umbral.
- **Importación.** Importar una partida no acredita tiempo offline, para que restaurar una copia antigua no regale horas.
- **Círculo de tiza.** Tiene tope (Nv 24) porque reduce el intervalo hasta un mínimo. Por eso su arte de Nv 50 no se llega a ver en la cripta.

#### Balance (`js/config.js`)
| Objeto | Coste base | Crecimiento | Efecto por nivel |
|---|---|---|---|
| Báculo de Rama | 10 | ×1,17 | 0,5/s |
| Anillo | 300 | ×1,7 | +25 % al báculo |
| Túnica | 80 | ×1,18 | 2,5/s |
| Lluvia de Chispas | 6000 | ×1,2 | 30/s |
| Báculo de Latón | 15 | ×1,25 | pulso 5 |
| Campana | 100 | ×1,8 | +30 % al pulso |
| Círculo de tiza | 80 | ×1,8 | intervalo 5 s/(1+0,05·nv·hito), mín. 1,5 s |

Otros valores:
- Sello manual: 3 de maná.
- Confluencia: 40 K ×5 por nivel; 3/5/8/12/18 s; máx. 5.
- Resonancia: 8 K ×6 por nivel; +50 %; máx. 10.
- Cripta: se abre con 400/s automáticos en el bosque.
- Prestigio: meta de 60 M generados.

Ajuste del balance:
- Primer intento: el prestigio llegaba a los 6 min y la cripta a los 3 min, porque la cripta crecía de forma explosiva.
- Cambios: crecimientos y costes más altos, pulso base 8 → 5, umbral de la cripta 300 → 400/s, meta 4 M → 60 M.

Tiempos simulados con `node tools/balance.js`. Estrategia: 1 clic/s tras 2 s de lectura, solo hasta el primer báculo de cada zona; cada 20 s compra el objeto o la mejora con mejor relación coste/aumento de producción total, y si no le alcanza, ahorra para ese objeto.

| Hito | Objetivo | Simulado |
|---|---|---|
| Primer báculo | 10–20 s | 0:12 |
| Primera evolución | 2–5 min | 3:40 |
| Cripta | 10–20 min | 13:40 |
| Báculo de la maga | — | 13:45 |
| Confluencia | — | 15:20 |
| Prestigio (3 Ecos) | 35–60 min | 48:03 |
| 4 Ecos | — | 56:13 |

Segunda partida:
- Con Báculos heredados: cripta 10:00 y prestigio 35:29.
- Con Campanas eternas: cripta 13:40 y prestigio 38:44.

Todavía no hay tiempos observados jugando.

#### Verificación (resultados concretos)
- **Prueba de lógica** (`node tests/logic.test.js`): **66/66**. Cubre:
  - Primer báculo con el 10.º lanzamiento.
  - Compra ×10 de Nv 5 a 15: coste acumulado exacto y ×2 aplicado.
  - Compra Máx de Nv 8 a 53, atravesando 10 y 50 (×6).
  - Hitos 100, 150 y 200.
  - Determinismo: 1000 pasos dan lo mismo que 37 s de golpe.
  - Tope de la tiza.
  - Confluencia: el bono es 3 s × la producción del bosque y el bosque no pierde maná.
  - Resonancia ×1,5.
  - Recarga a mitad de pulso sin duplicar ni perder; aplicar dos veces el mismo instante no vuelve a acreditar.
  - Límite de 8 h; un reloj que retrocede no suma ni resta.
  - Guardar sin localStorage no rompe la sesión.
  - Exportar e importar; rechazo de 7 tipos de JSON inválido; migración de guardados sin versión.
  - Prestigio: requisitos, Ecos, que comprar no los reduzca, qué se reinicia, talentos y su efecto en la siguiente partida.
  - Tiempos de balance dentro de los objetivos.
- **Prueba en navegador real** (`node tools/browser.js`): Chrome headless sobre `file://`, con `index.html#autotest` pulsando botones y teclas reales de la página. **61/61**. Recorrido: partida nueva → meta «10 lanzamientos» → lanzar con clic y con Espacio → comprar el báculo → producción sin clics → ×10 atravesando Nv 10, con anuncio y transformación → tecla 3 → cripta sellada bajo el umbral → apertura → Z → la maga despierta → 5 sellos → báculo de la maga → pulsos automáticos → Confluencia explicada, comprada y desglosada → anomalía → refundar con el diálogo → 3 Ecos → Báculos heredados → la nueva partida produce desde el primer segundo → exportar, rechazar un JSON inválido e importar → **recarga real de la página a mitad de pulso** (fase y pulsos exactos, sin duplicar) → offline de 10 h limitado a 8 h con informe por mago → movimiento reducido → localStorage bloqueado (aviso, se sigue jugando y explica cómo exportar).
- **Servidor estático:** la misma prueba sobre `http://127.0.0.1` (`python -m http.server`) dio **57/57** (la versión de la prueba de ese momento, antes de añadir las 4 últimas comprobaciones).
- **Capturas revisadas** (Chrome headless):
  - Bosque en Nv 1, 10, 50, 100 y 150; cripta en Nv 1, 10, 50 y 100.
  - Evoluciones a mitad de animación: báculo a Nv 10, túnica a Nv 50 y campana a Nv 10.
  - Vista de 360 px con `tests/movil.html`: se apila sin desbordar.

  En headless solo corren unos 2 cuadros de animación por carga, así que los escenarios dibujan 1,5 s de cuadros forzados. Eso prueba el render (proyectiles en arco, lluvia, haz del pulso, corriente de Confluencia), no la fluidez.
- **Arreglos durante el desarrollo:**
  - El saldo de Ecos se veía antes de tiempo, porque `[hidden]` quedaba anulado por el CSS.
  - Aparecía «1000 mil M» por redondeo.
  - La campana era demasiado pequeña.
  - Una fila del sprite medía 15 px.
  - Los temporizadores de UI y la escena dependían del timestamp de requestAnimationFrame (ahora usan el reloj de pared, con dt ≥ 0).
  - El anuncio de apertura de la cripta tapaba al de evolución (ahora hay una cola, que se vacía al cambiar de zona).
- **Sin comprobar:**
  - Fluidez de la animación en un navegador interactivo.
  - Edge y Firefox.
  - Un móvil real.
  - Un offline real de horas con el reloj del sistema.
  - Si las evoluciones se distinguen a simple vista a tamaño real: necesita criterio humano.
  - El comando Docker: no hay imagen nginx local.
