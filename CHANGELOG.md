# Bitácora — La Orden del Umbral

Formato: la sección **En curso** se actualiza mientras se trabaja. El comando «CIERRE ARCANO» la convierte en una versión cerrada (ver `CLAUDE.md`). Esta bitácora no depende de Git.

## En curso

_(Sin cambios desde v0.3.0.)_

## v0.3.0 — 2026-11-23 — Cerrada

Punto de partida: v0.2.0.

### Informe de cierre

````markdown
# La Orden del Umbral — v0.3.0 — 2026-11-23
Estado: Cerrada

## Qué se puede jugar ahora
Incremental de navegador en español: cinco magos en cinco zonas (bosque → jungla → cripta → castillo → cavernas). Cada mago paga sus objetos con el maná de su propia zona. Todas las zonas producen en paralelo, también offline (hasta 8 h). Cada mago se enfrenta a un jefe que reacciona a sus hechizos, pero no muere durante el ciclo. La Sala de la Orden tiene dos pestañas: Portales, para mirar a los magos, y Mesa Redonda, para mejoras, talentos y hazañas. Al refundar, una secuencia muestra caer a los cinco jefes y se ganan Ecos para talentos permanentes. La primera refundación llega en unos 35 min de juego simulado.

## Cambios y arreglos
- **Jefes en las cinco zonas.** Tienen vida infinita durante el ciclo: no hay barra de vida ni reaparición. Cada uno tiene pose de reposo, reacción al impacto y una derrota que solo ocurre en la refundación.
  - Bosque: el Ciervo Hueco, con pecho luminoso y astas.
  - Jungla: la Reina Injerto, una flor carnívora cuyas bocas se abren al florecer.
  - Cripta: el Rey sin Réquiem, que tiembla con cada toque.
  - Castillo: la Regente de Escarcha, fundida con su trono.
  - Cavernas: el Corazón de la Caldera, un coloso de lava con ojo y mano.
  - El ataque de cada mago apunta al jefe.
- **Hechizos insignia.** Tienen preparación, trayectoria, impacto y reacción del jefe. Los lanzamientos manuales salen de la mano libre y los automáticos del foco. Respetan el movimiento reducido y no cambian la ganancia.
- **Sala dividida en Portales (S) y Mesa Redonda (M).**
  - Los portales avisan con discreción cuando se puede refundar.
  - La Mesa reúne:
    - las mejoras de la Orden, con duración, coste, moneda y condición;
    - los talentos y las hazañas;
    - el aporte de cada zona;
    - los Ecos actuales, lo que falta para el siguiente y el talento al alcance.
  - Las compras usan una sola implementación en toda la interfaz.
- **Refundación con confirmación y secuencia.**
  - La confirmación separa lo que se gana, lo que se pierde y lo que se conserva.
  - Secuencia: portales encendidos, ataque culminante, caída de los jefes y apagado. Se puede omitir con Esc y tiene versión reducida.
  - La recompensa se guarda antes de la animación. Confirmar, omitir, hacer doble clic o recargar a mitad la otorgan exactamente una vez.
- **Castillo del Invierno Inmóvil** (zona 4).
  - Un lancero de brasas agrieta el hielo y cada 10 grietas llega un deshielo.
  - La decisión es entre calor sostenido y explotar el deshielo.
  - Se descubre en el primer ciclo, cuando la cripta produce 15 K/s.
  - Nueva mejora de la Orden, Réquiem: la cripta acelera el deshielo.
- **Cavernas del Sol Sepultado** (zona 5).
  - Un mago glacial con espejo de obsidiana; sus espejos de hielo lanzan rayos simultáneos.
  - La decisión es entre más superficies y más intensidad.
  - Se abren tras 1 refundación y 10 deshielos, y se anuncian antes.
- **Talentos.** A los 5 anteriores se suman 4 avanzados, con requisitos y coste creciente:
  - Cometa: requiere Lluvia Nv 50.
  - Forja: requiere 10 deshielos.
  - Pacto: requiere toda la Orden.
  - Reliquias: requiere 3 refundaciones. Guarda maná que se entrega al reabrir cada zona.
- **Hazañas.** Objetivos de maestría que dan Ecos extra. Solo cuentan en ciclos de 20 min o más.
- **Vistas previas de compra.** Usan el mismo cálculo que la compra real. Por ejemplo, en Nv 47 avisan que ×3 alcanza la evolución del Nv 50 y lo comparan con la alternativa.
- **Pantalla adaptable.** Los portales y el lienzo usan escala entera según el ancho y el alto disponibles, sin scroll horizontal.
- **Migración v0.2 → v0.3:**
  - Antes de migrar se guarda una copia recuperable (`respaldo-v2`), que se puede exportar.
  - Las zonas nuevas no reciben ingresos retroactivos.
  - Las refundaciones previas cuentan para abrir las cavernas.
  - El ciclo migrado no sufre el tope de madurez.
  - Siguen funcionando la ruta desde v0.1, exportar, importar y «Empezar desde cero».
- **Arreglo:** el texto decía «1 Ecos». Ahora concuerda en singular y plural.

## Balance y decisiones
- **Objetivos de diseño:**
  - primera refundación en 35–60 min con al menos un talento;
  - castillo en el primer ciclo;
  - cavernas en el segundo.
- **Tiempos simulados** (`tools/balance.js`), v0.2 → v0.3:

  | Hito | v0.2 | v0.3 |
  |---|---|---|
  | Cripta | 11:40 | 11:20 |
  | Castillo | — | 20:40 |
  | Primera refundación | 39:36 | 34:55 (6 Ecos) |
  | Ciclo 2 con Báculos heredados | 33:16 | 29:21 (cavernas 19:03) |

- **Curva de Ecos:**
  - Es idéntica a v0.2 hasta 12 Ecos; después suma +3 por cada duplicación del maná.
  - Tope de madurez: 1 Eco base cada 4 min de ciclo.
  - Sin estos límites, el perfil activo superaba los 1000 Ecos en 48 h.
- **Ciclo corto frente a profundo:** 14,3 frente a 17,6 Ecos por hora.
- **Perfiles simulados de 48 h:**

  | Perfil | Tiempo activo | Refundaciones | Ecos | Pendientes |
  |---|---|---|---|---|
  | Breve | 1 h 36 min | 4 | 88 | 5 talentos |
  | Activo | 5 h 40 min | 17 | 230 | solo niveles repetibles |

- **Decisiones de compra** (cálculo real, v0.2 → v0.3):
  - Báculo Nv 47 → 50: +10,2 % → +12,5 %.
  - Con el coste de 1 nivel de Lluvia, llevar el báculo de Nv 31 a Nv 50: +13,1 % → +15,7 %. Prisma 1,3 % → 0,8 %.
  - Túnica ×10: +0,22 % → +1,35 %. Las túnicas suman ahora +0,5 % del foco por nivel.
- **Tramos sin compras útiles de ×10:** 12 → 10. Los que quedan son esperas por Polen y Confluencia.
- **Tiempos observados jugando:** aún no hay.

## Verificación
- **Prueba de lógica** (Node): 178/178. Cubre:
  - las 5 zonas: el juego activo da lo mismo que el offline y la recarga a mitad de ciclo continúa;
  - la curva de Ecos, el tope de madurez y las hazañas;
  - los talentos avanzados y las Reliquias;
  - que la refundación se aplique una sola vez;
  - la migración con partidas reales v0.1 y v0.2.
- **Prueba en navegador real** (Chrome headless sobre `file://`): 66/66, con recargas reales:
  - a mitad de la refundación;
  - durante la migración desde v0.2;
  - durante la migración desde v0.1.
- **Capturas revisadas a mano:**
  - jefes en reposo, impacto, derrota y portal;
  - fases de los hechizos insignia;
  - Sala con 5 zonas, Mesa, confirmación y secuencia;
  - 360 px.
- **Pantalla adaptable:** 1280×720, 1366×768, 1536×864 y 1920×1080, sin scroll horizontal. El zoom al 125 % se emuló con el tamaño de ventana equivalente.
- **Simulación económica:** tiempos por hito, Ecos por hora, perfiles de 48 h y tramos de ×10.
- **Sin comprobar:** fluidez real (las pruebas fuerzan los cuadros), Edge, Firefox, un móvil real y tiempos jugando.

## Qué conviene probar jugando
1. Con la partida migrada, abre los Portales (S) un minuto. ¿Se reconoce cada jefe y su reacción al golpe?
2. Abre la Mesa (M). ¿Queda claro cuántos Ecos darías ahora y qué falta para el siguiente?
3. Juega del castillo hasta las cavernas y refunda. ¿La secuencia se disfruta y omitirla se siente bien? ¿Las cavernas llegan en un buen momento?

## Pendientes conocidos
- El perfil activo agota casi todos los talentos en 48 h: falta contenido de largo plazo.
- La primera refundación simulada (34:55) roza el mínimo del objetivo. Hay que confirmarla con tiempos reales.
- Quedan 10 tramos de espera por compras grandes.
- Con 5 zonas a la vista, la fluidez en equipos modestos no está medida.
- No hay sonido.
````

### Notas de desarrollo de esta versión

#### Novedades
- **Jefes legibles en las cinco zonas**, con vida infinita durante el ciclo: no hay barra de vida, daño acumulado ni reaparición. Cada uno tiene pose de reposo, reacción al impacto y una derrota reservada a la secuencia de refundación (`js/bosses.js`).
  - **Ciervo Hueco** (bosque): cuerpo entero, pecho hueco luminoso y astas ramificadas. El cristal ya no lo tapa.
  - **Reina Injerto** (jungla): flor carnívora con mandíbula, corona de pétalos y raíces unidas a las raíces podadas. Las bocas se abren en cada floración.
  - **Rey sin Réquiem** (cripta): corpóreo, con corona, manto y armadura. Tiembla con cada toque y sigue visible entre pulsos.
  - **Regente de Escarcha** (castillo): trono fundido con su armadura; las grietas y el deshielo se ven sobre ella.
  - **Corazón de la Caldera** (cavernas): coloso de lava con un ojo dominante y una mano que reacciona.
  - El gesto de ataque de cada mago apunta al jefe o canaliza hacia él.
- **Hechizos insignia** con preparación, trayectoria, impacto y reacción del jefe. Los lanzamientos manuales salen de la mano libre y los automáticos del foco. Se conservan los hitos visuales y se respeta el movimiento reducido. Las partículas nunca cambian la ganancia.
- **Sala de la Orden dividida en Portales y Mesa Redonda**, con pestañas y teclado (S = portales, M = Mesa, Esc = omitir).
  - Los **portales** muestran mago y jefe. Una señal discreta lleva a la Mesa cuando se puede refundar.
  - La **Mesa** reúne magos despiertos, mejoras de la Orden (duración, coste, moneda y condición), talentos, aportes por zona, hazañas y «Refundar la Orden». Muestra los Ecos de ahora, lo que falta para el siguiente y el talento a tu alcance.
  - Todas las compras pasan por una sola implementación. La tienda tiene accesos «Orden ↗» y «Refundar ↗».
  - La confirmación muestra **Ganarás / Perderás / Conservarás**.
  - **Secuencia de refundación**: los portales se encienden, cada mago lanza su ataque culminante, los jefes caen y los portales se apagan. Se puede omitir y tiene versión reducida. El estado nuevo se calcula y se **guarda antes** de la animación: confirmar, omitir, hacer doble clic o recargar a mitad de la secuencia otorgan la recompensa exactamente una vez.
- **Castillo del Invierno Inmóvil** (4.ª zona): mago lancero de brasas.
  - Cada ascua agrieta el hielo y 10 grietas provocan un deshielo.
  - Decisión del jugador: calor sostenido (Brasas, Guía) frente a explotar el deshielo (Martillo, Fénix).
  - Se descubre en el primer ciclo: se abre cuando la cripta produce 15 K/s.
  - Nueva mejora de la Orden **Réquiem**: la cripta acelera el deshielo y se paga con maná de la cripta.
- **Cavernas del Sol Sepultado** (5.ª zona): mago glacial con espejo de obsidiana.
  - Los espejos de hielo lanzan rayos simultáneos.
  - Decisión: más superficies (Esquirlas) frente a más intensidad (Lente, Mirada, Cénit).
  - Se abren tras ≥ 1 refundación y 10 deshielos del castillo. Se anuncian antes en la Sala y en la Mesa. Las refundaciones de partidas migradas cuentan.
- Ambas zonas nuevas tienen 8 entradas, producen en paralelo aunque no estén visibles y también offline.
- **Talentos avanzados** (4 nuevos, con requisito y coste creciente), además de los 5 anteriores:
  - **Cometa** (6 Ecos, ×1,8, máx. 5; requiere Lluvia Nv 50 en algún ciclo);
  - **Forja** (10; requiere 10 deshielos en un ciclo);
  - **Pacto** (8, ×2, máx. 3; requiere todas las mejoras de la Orden);
  - **Reliquias** (12, ×2, máx. 3; requiere 3 refundaciones; guarda maná que se entrega al reabrir cada zona y no cuenta como maná generado).
- **Hazañas** (objetivos de maestría): +Ecos por abrir el castillo, 10 deshielos, toda la Orden, abrir las cavernas y 30 miradas. Solo cuentan en ciclos de ≥ 20 min.
- **Vistas previas** basadas en el cálculo real de la compra. Por ejemplo, en Nv 47 la tienda avisa que ×3 alcanza la evolución del Nv 50 y compara con la alternativa.
- **Textos:** «Eco/Ecos» concuerdan con el número en la Mesa, la confirmación, la secuencia y «Empezar desde cero». Antes decía «1 Ecos».
- **Diseño adaptable**: la cuadrícula de portales se ajusta al alto disponible (escala entera máx. 2×) y el lienzo del detalle usa una escala entera limitada por ancho y alto.

#### Balance y decisiones (tiempos simulados con `node tools/balance.js`)
- **Objetivos de diseño:** primera refundación en 35–60 min con al menos un talento; castillo descubrible en el primer ciclo; cavernas en el segundo.
- **Tiempos simulados**, v0.2 → v0.3:

  | Hito | v0.2 | v0.3 |
  |---|---|---|
  | Jungla | 5:20 | 5:20 |
  | Cripta | 11:40 | 11:20 |
  | Castillo | — | 20:40 |
  | 10 deshielos | — | 23:43 |
  | Primera refundación | 39:36 | 34:55 (6 Ecos: 3 + 3 de hazañas) |
  | Ciclo 2 con Báculos heredados | 33:16 | 29:21 (cavernas 19:03) |
  | Ciclo 2 con Cielo Recordado | 33:43 | 30:03 (cavernas 21:03) |

  34:55 queda 5 s bajo el objetivo. Con 6 Ecos alcanzan 1–3 talentos: Báculos heredados, Cielo y Semilla.
- **Curva de Ecos:** √ idéntica a v0.2 hasta 12 Ecos, para no quitar Ecos a partidas migradas cercanas a su siguiente recompensa. Desde ahí se suman +3 por cada duplicación del total.
  - **Tope de madurez:** máx(1, ⌊duración del ciclo / 4 min⌋) Ecos base. El ciclo migrado queda exento (`flags.legacyCycle`).
  - Sin esto, el perfil activo superaba los 1000 Ecos en 48 h.
- **Ecos por hora (ciclo 2):** corto (refundar en 29:21) 7 Ecos = **14,3/h**; profundo (30 miradas, 34:07) 10 Ecos = **17,6/h**. Profundizar rinde algo más sin castigar el ciclo corto.
- **Perfiles de 48 h:**
  - **Breve** (4 × 12 min/día, recoge offline): 1 h 36 min activo, 4 refundaciones, 88 Ecos. Compra Báculos, Cielo, Semilla, Campanas ×2, Velo, Cometa ×3, Forja y Pacto ×2. Quedan Campanas, Velo, Cometa, Pacto y Reliquias.
  - **Activo** (2 × 60 + 2 × 25 min/día): 5 h 40 min activo, 17 refundaciones, 230 Ecos. Compra todos los talentos (Campanas ×4, Velo ×3, Cometa ×4, Pacto ×3, Reliquias ×2). Quedan los niveles repetibles de Campanas, Velo, Cometa y Reliquias.
- **Decisiones de compra (cálculo real de la compra, misma partida)**, v0.2 → v0.3:
  - **A) Báculo Nv 47 → 50** (×3, 56,7 K): +10,2 % → **+12,5 %** del bosque. Un solo nivel: +0,10 % → +0,12 %. El salto del Nv 50 se anuncia en la vista previa.
  - **B) Báculo Nv 31 con 159,7 K** (lo que cuesta 1 nivel de Lluvia): báculo hasta Nv 50 +13,1 % → **+15,7 %**; Lluvia ×1 +5,1 % (igual); Prisma 1,3 % → 0,8 %. El Prisma era una trampa barata: coste base 900, crecimiento ×1,4 y +1,5 %/nivel.
  - **C) Túnica de Corteza ×10** (Nv 30, 558,5 K): +0,22 % → **+1,35 %** de la jungla. Ahora las túnicas suman +0,5 % del foco por nivel (`robeFocusShare` 0,005); antes eran casi inútiles.
- **Tramos muertos de ×10** (`--tramos`): 12 → 10. Los que quedan son esperas deliberadas por compras grandes (Polen, Confluencia), y mientras tanto queda la Túnica u Órbita con +0,2–0,6 %.
- **Otros ajustes:**
  - Polen: crecimiento ×1,85.
  - Castillo: grietas a ritmo fijo de 3 s → 1 s (antes llegaba a 0,03 s).
  - Cénit: lineal +0,15 (llegaba a ×153).
  - Apertura del castillo: cripta 15 K/s.
- **Tiempos observados jugando:** todavía no hay.

#### Migración v0.2 → v0.3 (`saveVersion` 3, migración 2)
- Antes de migrar se guarda una **copia recuperable** (`respaldo-v2`, exportable desde Partida). La ruta v0.1 → v0.2 → v0.3 se conserva.
- Se añaden castillo, cavernas, Réquiem, talentos nuevos, registros y hazañas en cero. **Sin ingresos retroactivos** para las zonas nuevas: producen desde que se abren.
- Registros deducidos de forma conservadora: solo `spellMax` (desde la Lluvia actual). Deshielos y miradas no se inventan.
- Las refundaciones previas cuentan para abrir las cavernas. Una partida avanzada puede abrir el castillo enseguida si su cripta ya supera 15 K/s.
- El ciclo migrado no sufre el tope de madurez (`legacyCycle`): conserva los Ecos que tenía a la vista.
- Exportar e importar, y «Empezar desde cero», siguen funcionando.

#### Verificación
- **Prueba de lógica** (`node tests/logic.test.js`): **178/178** tras las últimas ediciones. Cubre:
  - 8 entradas por zona en las 5 zonas;
  - castillo y cavernas: activo = offline y recarga a mitad de ciclo;
  - Réquiem sin retroalimentación;
  - curva de Ecos idéntica a v0.2 hasta 12, cola, madurez y hazañas con ciclo mínimo;
  - requisitos y costes de los talentos avanzados;
  - Reliquias fuera del maná generado;
  - refundación aplicada una sola vez;
  - migración con los fixtures reales v0.1 y v0.2 (`v02-avanzada`), incluida una partida cerca de su siguiente Eco;
  - balance dentro de los objetivos.
- **Prueba en navegador real** (Chrome headless sobre `file://`): **66/66**, con tres recargas reales: a mitad de la refundación, migración v0.2 y migración v0.1. Cubre:
  - pestañas Portales/Mesa con teclado;
  - compra de mejoras y talentos desde la Mesa;
  - confirmación Ganarás/Perderás/Conservarás;
  - omitir, doble clic y recarga sin duplicar la recompensa;
  - castillo y cavernas;
  - «Empezar desde cero».
- **Capturas revisadas a mano:**
  - hoja de jefes (reposo, impacto, insignia, derrota 50 %/100 % y portal, por jefe);
  - hoja de fases de los hechizos insignia;
  - Sala con 5 zonas en pantalla baja, Mesa, tienda, detalle, confirmación y secuencia de refundación;
  - 360 px (`tests/movil.html`).
- **Responsive** (`--responsive`): viewports efectivos 1258×588, 1344×636, 1514×732 y 1898×948, y zoom 125 % emulado con 1207×559. Ninguno tiene scroll horizontal.
  - Portales a 2×: 2 columnas en 1280 y 1366, 3 en tamaños mayores.
  - Detalle a 512 px en notebook y 768 px en escritorio.
  - El zoom 125 % se emula con el viewport CSS equivalente, no con el zoom del navegador.
- **Sin comprobar:**
  - fluidez real (los cuadros se fuerzan desde la prueba);
  - Edge, Firefox y un móvil real;
  - tiempos jugando de verdad.
  - Detalle menor: en la captura de la confirmación, la cabecera fija aparecía algo desplazada tras `scrollIntoView`.

#### Pendientes conocidos
- El perfil activo agota casi todos los talentos en 48 h. Solo quedan niveles repetibles: falta contenido de largo plazo.
- Quedan 10 tramos de espera por compras grandes (Polen, Confluencia).
- La primera refundación simulada (34:55) roza el límite inferior del objetivo. Conviene confirmarla con tiempos observados.

## v0.2.0 — 2026-11-20 — Cerrada

Punto de partida: v0.1.0.

### Informe de cierre

````markdown
# La Orden del Umbral — v0.2.0 — 2026-11-20
Estado: Cerrada

## Qué se puede jugar ahora
Juego incremental de navegador en español: HTML, CSS y JS nativos que abren con doble clic, con pixel art propio en Canvas. Tres magos trabajan en paralelo, cada uno con su moneda y 8 entradas de tienda: el aprendiz astral del Bosque del Velo, la herborista de poda de la Jungla de las Mil Bocas y la maga de la Cripta de las Campanas. Una «Sala de la Orden» los muestra a la vez a través de portales vivos. Mejoras de la orden conectan las zonas en una sola dirección. Se puede refundar a cambio de Ecos y elegir entre 5 talentos permanentes. Las partidas de la v0.1 se migran conservando su progreso.

## Cambios y arreglos
- **Sala de la Orden** (botón fijo y tecla S).
  - Un portal por zona abierta, con una versión simplificada y animada de su escena real.
  - Junto a cada portal: nombre, saldo, producción media y próximo hito. Al pulsarlo se entra en la vista detallada; las compras se hacen dentro.
  - Una partida nueva abre en el bosque; después se recuerda la última vista, incluida la Sala. En móvil los portales se apilan.
  - El portal y la vista detallada comparten estado: un pulso ocurrido con la Sala abierta se ve al entrar. Cambiar de vista u ocultar la pestaña no acredita producción.
- **Tercera zona: Jungla de las Mil Bocas.** Se descubre con 80/s automáticos en el bosque, entre la primera evolución y la cripta; en pantalla aparece entre ambas.
  - La herborista marca raíces con la mano libre. Su grimorio flotante poda solo.
  - Cada 5 podas o marcas, la secuencia de raíces visible en el suelo florece con más valor. La Reina Injerto, una flor parasitaria, abre sus bocas.
  - Funciona en paralelo y offline.
- **8 entradas por mago (24)**: foco, túnica, tocado, accesorio y 4 hechizos o rituales.
  - Se descubren de forma gradual, anunciando la condición.
  - Bosque: Capucha de Astrónomo, Órbita Gemela, Prisma del Velo y Constelación del Ciervo.
  - Cripta: Vestidura de Vigilia, Mitra del Último Eco, Medallón Funerario, Incienso de Vigilia y Letanía de la Corona.
  - Se conservan los IDs, niveles y efectos de la v0.1.
- **Evolución visual separada de la económica.** Formas en Nv 0, 10, 50, 100, 150, 200 y 250 (tope artístico); los saltos económicos siguen en 10, 50, 100 y cada 50.
  - Los hechizos cambian en movimiento, con trayectoria, forma, impacto o reacción de la amenaza. Ejemplo, la Lluvia: chispa → cometa curvo → se parte → fragmentos convergentes → constelación tras el cristal → segunda oleada → eclipse que revela al Ciervo.
  - Los focos cambian cómo canalizan; túnica y tocado evolucionan por separado y se ven sobre el personaje.
  - La apariencia se calcula desde el nivel real: un báculo Nv 70 importado se ve como Nv 50.
- **Mano libre.** El lanzamiento manual nace de la mano libre con un gesto visible y se distingue del ataque automático del foco.
- **Amenazas solo visuales.** El Ciervo Hueco (bosque), la Reina Injerto (jungla) y el Rey sin Réquiem (cripta) reaccionan a la magia sin daño ni barras de vida.
- **Maestría de Chispa (cosmética).** Estela bifurcada, trenzada y halo de estrellas, ganados con chispas automáticas mientras se ahorra. Se conserva al refundar.
- **Tienda en filas compactas.**
  - Ordenada por precio: ×1 por el próximo nivel; ×10 por el lote real (recortado si llega al tope); Máx por el próximo nivel, con el total en el botón. Los completados van al final.
  - El orden no cambia bajo el cursor ni con el foco dentro. Las teclas 1–8 van ligadas a cada objeto y se ven en la fila.
  - El detalle desplegable muestra el próximo hito visual con una pista, o «Forma final alcanzada».
  - La vista previa muestra el valor indirecto, por ejemplo «+136/s · cripta +272/pulso».
- **Mejoras de la orden.** Se suman Polen Astral (Lluvia del bosque → cada floración) y Raíz Estelar (producción de la jungla → cada descarga de la Órbita). Cada aporte lee la producción propia de su zona de origen, así que no se retroalimenta.
- **Talentos.** Se suman Semilla de la Fundadora (la jungla reabre con una raíz madura; floraciones +50 %) y Cielo Recordado (los 4 hechizos del bosque visibles desde el inicio, +50 %; maestría ×2). Cada talento dice qué cambiará en la próxima partida.
- **Refundar** muestra el aporte de cada zona.
- **«Empezar desde cero»** (Partida), separado de refundar: advierte de que se pierden Ecos y talentos, ofrece exportar y exige marcar una casilla.
- **Migración v0.1 → v0.2.**
  - Antes de sobrescribir guarda una copia exacta del original, exportable.
  - Si no puede guardar esa copia, no sobrescribe el original.
  - Ante un guardado que no se puede migrar, ofrece exportarlo o empezar de nuevo.
  - El tiempo offline previo a la actualización no genera contenido nuevo.
  - No concede Ecos.
- **Arreglos durante la versión:**
  - Antes, en v0.1, el Círculo de Tiza anunciaba un hito en Nv 50 que nunca alcanzaba. Ahora culmina con su forma final en su tope real (Nv 24) y la tienda solo anuncia hitos alcanzables.
  - Los efectos nacidos al impactar (constelación, prisma, chispas) se perdían y un cuadro tardío saltaba el impacto de la Lluvia. Ahora se conservan y el impacto se dispara siempre.
  - La tienda podía reordenarse bajo el cursor tras una actualización. Ahora conserva el orden visible.
  - El detalle de una fila se abría vacío hasta el siguiente refresco. Ahora muestra el contenido al abrirse.
- **Proyecto:** se añadió `.gitignore` (partidas exportadas, capturas e instrucciones locales de Claude Code). El código vive en un repositorio privado de GitHub. Se revisó que no contiene datos del equipo.

## Balance y decisiones
- **Objetivos de diseño:** cripta en 10–20 min y primer prestigio en 35–60 min; la jungla debe aparecer entre la primera evolución y la cripta.
- **Tiempos simulados** (estrategia: 1 clic/s hasta el primer foco de cada zona; cada 20 s compra lo de mejor coste / aumento de producción, valorando ½ el aporte a otras zonas), v0.1 → v0.2:

  | Hito | v0.1 | v0.2 |
  |---|---|---|
  | Primer báculo | 0:12 | 0:12 |
  | Primera evolución | 3:40 | 3:40 |
  | Jungla | — | 5:20 |
  | Grimorio y primera floración | — | 5:25 |
  | Cripta | 13:40 | 11:40 |
  | Confluencia | 15:20 | 15:20 |
  | Primer prestigio | 48:03 | 39:36 |

- **Segunda partida (simulada):** Báculos heredados 33:16, Cielo Recordado 33:43, Campanas eternas 34:21, Semilla de la Fundadora 36:42. Los talentos compiten entre sí.
- **Tiempos observados jugando:** todavía no hay.
- **Cambios de valores:**
  - Meta de refundación: 60 M → 1 000 M de maná generado. Con 3 zonas y 24 entradas, 60 M se alcanzaba hacia los 15 min. Las partidas migradas conservan su maná generado, pero la meta queda más lejos.
  - La savia de la jungla cuenta ×0,5 en el total. Aporte simulado en la primera refundación: bosque 51 M, jungla 185 M (ya ponderada) y cripta 1542 M.
  - Anillo: crecimiento ×1,7 → ×1,6. En la v0.1 dejaba de convenir hacia el Nv 13–14: su recuperación pasaba de ~670 s en Nv 10 a ~5600 s en Nv 14, por encima de la Lluvia (~1500 s). En la simulación v0.2 llega al Nv 18 (antes 15).
- **Jungla:** umbral de 80/s.
  - La Flor de las Mil Bocas suma +400 fijos por floración y nivel, en lugar de multiplicar: con multiplicadores encadenados, la jungla llegaba a 12 M/s a los 8 min.
  - Crecimientos de coste de ×1,3 a ×2,0.
- **Cielo Recordado** no regala la Lluvia: con ella gratis, la jungla se abría en el segundo 0.
- **Bosque mientras se ahorra:**
  - Compras: 122 en 50 min (v0.1) → 210 hasta el prestigio (v0.2).
  - Tramo 19:00–22:20: de 0 compras (esperando el anillo 8) a 21 de 8 tipos.
  - Tramo 13:40–16:20: de 0 compras a 7, más la evolución de la Lluvia y la maestría de Chispa II.
  - Hueco más largo: 240 s → 220 s, esperando Confluencia Nv 4, una gran compra deliberada.
- Las 24 entradas se compran en 70 min de juego normal simulado. Las últimas en aparecer: Constelación 24:00, Letanía y Prisma 20:20.

## Verificación
- **Prueba de lógica** (Node, `tests/logic.test.js`): **111/111**. Cubre:
  - catálogo de 8 entradas por zona;
  - compras ×10 y Máx con topes;
  - límites visuales 9/10/11 y 249/250/251, y la tiza en 23/24;
  - ciclos de jungla: jugar activo da lo mismo que offline, y la recarga a mitad de ciclo continúa;
  - mejoras cruzadas sin retroalimentación ni dobles cobros;
  - migración con guardados v0.1 reales generados con el código v0.1 (Campana, Círculo de Tiza, Báculos heredados, fase de pulso, sin Ecos extra, sin floraciones ni maestría retroactivas, sin repetirse);
  - validación de importaciones y offline de 8 h;
  - prestigio con tres zonas y talentos nuevos.
- **Prueba en navegador real** (Chrome headless sobre `file://`, pulsando botones y teclas): **63/63**, con tres recargas reales de la página. Cubre:
  - tienda ordenada, orden congelado bajo el cursor y atajos;
  - Sala y portales, y la coherencia de un pulso entre portal y detalle;
  - ninguna producción extra al cambiar de vista;
  - jungla y cripta, Confluencia con vista previa por pulso;
  - refundar con tres zonas;
  - «Empezar desde cero» cancelado, sin casilla y confirmado;
  - migración real desde v0.1 con copia exacta y segunda recarga sin duplicar;
  - pulso tras recarga, offline de 8 h, movimiento reducido y guardado bloqueado.
- **Capturas y hojas de contacto** (Chrome headless, revisadas a mano):
  - Sala en escritorio (3 portales) y en 360 px.
  - Zonas en varios niveles; forma final del Círculo de Tiza.
  - Hojas de 7 estados × varios cuadros de Lluvia, Órbita, Hoja de Siega y Campana.

  Los cuadros se fuerzan desde la prueba: prueban el render, no la fluidez.
- **Sin comprobar:**
  - fluidez real con muchos efectos y la Sala abierta durante minutos;
  - Edge, Firefox y un móvil real;
  - revisión detallada de las hojas de las otras 20 entradas (se generan con `node tools/browser.js <carpeta> --solo-tiras`).

## Qué conviene probar jugando
1. **Con tu partida migrada, abre la Sala (S) y míralo un minuto.** ¿Se reconoce cada mago, su foco y su hechizo a través del portal? ¿Es agradable dejarlo de fondo?
2. **Desde cero, juega hasta la cripta.** ¿La jungla da algo que hacer mientras el bosque trabaja? ¿Se nota la estela bifurcada de la maestría mientras ahorras?
3. **Compra ×10 de la Lluvia (o de un hechizo) que cruce el Nv 10 o el 50 y mírala caer varias veces.** ¿El cambio de trayectoria se distingue a tamaño normal o solo se nota en el nombre?

## Pendientes conocidos
- La meta de refundación subió a 1 000 M: las partidas migradas desde v0.1 tardarán más en volver a refundar. Valorarlo con tiempos observados.
- Personajes de 16×24 px en escenas de 256×144: su legibilidad sigue pendiente de criterio humano.
- Con 4 hechizos activos la escena del bosque puede saturarse; el límite de partículas es una protección, no está ajustado con observación real.
- El Tocado de Espinas y el Círculo de Tiza solo tienen 3 formas (inicial, 10 y tope), por su tope mecánico.
- En pantallas menores de 512 px la escena y los portales se escalan a tamaño no entero.
- No hay sonido (fuera de alcance en esta versión).
````

### Notas de desarrollo de esta versión

Objetivo: v0.2.0, una expansión jugable completa. Incluye la Sala de la Orden, la tercera zona, 8 entradas por mago, hechizos que evolucionan en movimiento, nuevas mejoras de la orden y talentos, y la migración de partidas v0.1.

#### Funcionalidades
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

#### Decisiones de diseño
- **Funciones de las entradas.** Cada mago repite el patrón: el foco automatiza; el accesorio refuerza al foco (Anillo, Collar, Medallón); la túnica o el hechizo produce de forma pasiva; el tocado modifica algo concreto (la Lluvia, el intervalo de poda, la Confluencia recibida). Así se evita que todo sea un multiplicador global.
- **Flor de las Mil Bocas.** Suma una cantidad fija por floración en vez de multiplicar sobre el Polen. Con multiplicadores encadenados, la jungla llegaba a 12 M/s a los 8 min.
- **Cielo Recordado.** No regala la Lluvia. Con ella gratis, la jungla se abría en el segundo 0.
- **Umbral de la jungla: 80/s.** Con 40/s quedaba demasiado cerca de la primera evolución.
- **Meta de refundación: 60 M → 1 000 M (1e9).** Con tres zonas y 24 entradas, 60 M llegaba a los ~15 min. Tu partida migrada conserva su maná generado, pero la meta ahora está más lejos.
- **Anillo: crecimiento ×1,7 → ×1,6.** En la v0.1 dejaba de convenir hacia el Nv 13–14: su recuperación pasaba de ~670 s en Nv 10 a ~5600 s en Nv 14, por encima de la Lluvia (~1500 s). En la simulación v0.2 llega al Nv 18 (antes 15).
- **Refundar conserva la maestría**, por ser del aprendiz y cosmética.

#### Balance (`node tools/balance.js`)
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

#### Entradas por zona
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

#### Verificación
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
