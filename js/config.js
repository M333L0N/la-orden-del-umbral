/* La Orden del Umbral — datos de contenido y balance.
 * Todos los precios, rendimientos, multiplicadores, umbrales e hitos viven aquí.
 * Identidad de zona (id estable) separada de su posición en pantalla (zoneOrder).
 */
(function (root) {
  'use strict';
  var A = root.Arcane = root.Arcane || {};

  // Pistas de evolución visual reutilizables por tipo de pieza (se pueden sobrescribir por objeto).
  A.CONFIG = {
    saveKey: 'ordenUmbral.save',
    saveVersion: 3,
    backupSuffix: '.respaldo-v',      // copia del guardado original antes de migrar: <saveKey>.respaldo-v1
    autosaveSeconds: 5,
    offlineCapSeconds: 8 * 3600,
    offlineReportMinSeconds: 30,

    // Orden de presentación (peligrosidad creciente). Los ids son permanentes.
    zoneOrder: ['forest', 'jungle', 'crypt', 'castle', 'caverns'],

    // Saltos ECONÓMICOS (sin cambios desde v0.1): Nv 10 ×2, 50 ×3, 100 ×2 y cada 50 después ×2.
    milestones: {
      list: [10, 50, 100],
      every: 50,
      mult: { 10: 2, 50: 3, 100: 2 },
      afterMult: 2
    },
    // Hitos VISUALES (separados): forma inicial, 10, 50, 100, 150, 200 y 250 (tope artístico).
    // Un objeto con tope mecánico (cap) usa [10, cap]: su forma final llega en el cap.
    visualMilestones: [10, 50, 100, 150, 200, 250],
    // Túnicas (v0.3): además de su producción propia, cada nivel suma este % de lo que rinde el foco del mago.
    robeFocusShare: 0.005,

    zones: {
      forest: {
        name: 'Bosque del Velo', short: 'Bosque',
        mage: 'el aprendiz', mageName: 'Aprendiz astral',
        currency: 'maná del bosque',
        manualName: 'Lanzar Chispa', manualBase: 1, manualProdSeconds: 0.25,
        focusLabel: 'báculo',
        // Chispas automáticas por segundo (economía del Prisma, la Constelación y la maestría; la escena usa lo mismo)
        castRate: { base: 0.6, perLevel: 0.12, max: 6 },
        orbit: { interval: 10 },                     // Órbita Gemela: alineación cada 10 s
        constellation: { stars: 7, sparksPerStar: 4 },// Constelación: 28 chispas por figura
        mastery: {                                   // maestría de Chispa (COSMÉTICA, se conserva al refundar)
          thresholds: [250, 2500, 25000],
          names: ['Estela bifurcada', 'Estela trenzada', 'Halo de estrellas']
        },
        items: {
          staff: {
            slot: 'focus', kind: 'gen', baseCost: 10, growth: 1.17, perLevel: 0.5,
            names: ['Báculo de Rama', 'Báculo de Cristal', 'Báculo del Velo', 'Báculo Astral', 'Báculo Cometario', 'Báculo de Constelación', 'Báculo del Eclipse'],
            desc: 'Lanza Chispas solo contra el cristal.',
            hints: ['un cristal atado en la punta; la chispa deja estela', 'horquilla tallada con fragmentos que flotan', 'los fragmentos se separan al cargar y se cierran al disparar', 'un anillo de luz gira alrededor de la punta al canalizar', 'dispara dos chispas gemelas en espiral', 'núcleo de eclipse: la chispa sale negra con corona blanca']
          },
          robe: {
            slot: 'robe', kind: 'gen', baseCost: 80, growth: 1.18, perLevel: 2.5, reveal: { item: ['staff', 1] },
            names: ['Túnica Gastada', 'Túnica del Velo', 'Manto del Umbral', 'Vestidura Astral', 'Manto de Nebulosa', 'Manto Estelar', 'Manto del Firmamento'],
            desc: 'Absorbe la niebla: genera maná por sí misma y +0,5 % de lo que rinde el báculo por nivel.',
            hints: ['tela teal con ribete luminoso', 'manto oscuro con borde turquesa', 'runas bordadas en el bajo', 'el bordado se ilumina al lanzar', 'el borde del manto se levanta al lanzar', 'estrellas vivas recorren la tela']
          },
          hood: {
            slot: 'hat', kind: 'spellMult', target: 'spell', baseCost: 1500, growth: 1.6, perLevel: 0.2, reveal: { item: ['spell', 1] },
            names: ['Capucha de Astrónomo', 'Capucha de Latón', 'Capucha del Catalejo', 'Capucha Cónica', 'Capucha Lunar', 'Capucha del Astrolabio', 'Capucha de Constelaciones'],
            desc: 'Observa el cielo: +20 % a la Lluvia de Chispas por nivel.',
            hints: ['broche de estrella de latón', 'lente de catalejo sobre un ojo', 'punta alta con estrella', 'una luna diminuta gira alrededor', 'anillo de astrolabio sobre la cabeza', 'corona de estrellas que se alinea con el báculo']
          },
          ring: {
            slot: 'accessory', kind: 'mult', target: 'staff', baseCost: 300, growth: 1.6, perLevel: 0.25, reveal: { item: ['staff', 3] },
            names: ['Anillo de Cobre', 'Anillo de Plata Viva', 'Anillo Solar', 'Anillo del Eclipse', 'Anillo de Marea', 'Anillo Binario', 'Anillo del Umbral'],
            desc: 'Refuerza el báculo: +25 % de su producción por nivel.',
            hints: ['gema turquesa; destella al lanzar', 'chispas en órbita al canalizar', 'banda violeta con corona blanca', 'dos gemas que se persiguen', 'doble anillo entrelazado', 'anillo de luz que rodea la mano al lanzar']
          },
          spell: {
            slot: 'spell', kind: 'gen', baseCost: 6000, growth: 1.2, perLevel: 30, reveal: { generated: 1500 },
            names: ['Lluvia de Chispas', 'Lluvia de Cometas', 'Tormenta Estelar', 'Cielo Desgarrado', 'Lluvia Convergente', 'Segunda Oleada', 'Eclipse del Ciervo'],
            desc: 'Hechizo aprendido: la magia cae del cielo sobre el cristal.',
            hints: ['cometa de núcleo visible y cola curva', 'el cometa se abre en dos fragmentos antes de impactar', 'los fragmentos rodean el cristal y convergen', 'la convergencia traza una constelación tras el cristal', 'la constelación lanza una segunda oleada', 'eclipse breve que revela al Ciervo Hueco']
          },
          orbit: {
            slot: 'spell', kind: 'cycle', baseCost: 1200, growth: 1.22, perLevel: 60, reveal: { item: ['robe', 5] },
            names: ['Órbita Gemela', 'Órbita con Estela', 'Órbita Alineada', 'Órbita Inclinada', 'Órbita Resonante', 'Órbita en Ocho', 'Órbita Solar'],
            desc: 'Dos fragmentos giran alrededor del cristal; cada 10 s se alinean y descargan maná.',
            hints: ['los fragmentos dejan estela', 'la alineación traza un rayo a través del cristal', 'órbita inclinada con lunas menores', 'la descarga se expande como anillo', 'los fragmentos cruzan sus órbitas en ocho', 'se funden en un sol diminuto antes de estallar']
          },
          prism: {
            slot: 'spell', kind: 'perCast', baseCost: 900, growth: 1.4, perLevel: 0.015, reveal: { item: ['staff', 10] },
            names: ['Prisma del Velo', 'Prisma Bifurcado', 'Prisma en Abanico', 'Prisma de Rebote', 'Prisma Triangular', 'Prisma Espiral', 'Prisma del Ciervo'],
            desc: 'Cada chispa automática se refracta en el cristal: +1,5 % al rendimiento del báculo por nivel (con sus saltos), para invertir mientras ahorras.',
            hints: ['el rayo refractado se bifurca', 'abanico de tres rayos', 'los rayos rebotan en el arco y vuelven', 'un prisma triangular se dibuja en el cristal', 'los rayos salen en espiral', 'los rayos encienden las astas del Ciervo']
          },
          constellation: {
            slot: 'spell', kind: 'figure', baseCost: 25000, growth: 1.25, perLevel: 400, reveal: { item: ['spell', 3] },
            names: ['Constelación del Ciervo', 'Constelación Titilante', 'Testa Estelar', 'Ciervo Revelado', 'Ciervo que Mira', 'Ciervo del Meteoro', 'Ciervo Hueco Despierto'],
            desc: 'Las chispas automáticas encienden estrellas entre las astas del Ciervo; al completar la figura se acredita su recompensa.',
            hints: ['las estrellas titilan en cruz', 'la figura dibuja la testa del Ciervo', 'la silueta del Ciervo se rellena', 'el Ciervo gira la cabeza', 'la figura suelta un meteoro hacia el cristal', 'el Ciervo completo sale del cristal']
          }
        },
        itemOrder: ['staff', 'robe', 'hood', 'ring', 'spell', 'orbit', 'prism', 'constellation']
      },

      jungle: {
        name: 'Jungla de las Mil Bocas', short: 'Jungla',
        mage: 'la herborista', mageName: 'Herborista de poda',
        currency: 'savia de la jungla',
        manualName: 'Marcar raíz', manualBase: 2, manualPruneFraction: 0.1,
        focusLabel: 'grimorio',
        unlockForestProd: 80,             // producción automática del bosque (maná/s) para descubrirla
        unlock: { forestProd: 80 },
        prune: { baseInterval: 3, minInterval: 1, seqLength: 5, bloomFactor: 1.5 },
        graft: { interval: 12 },
        items: {
          grimoire: {
            slot: 'focus', kind: 'prune', baseCost: 12, growth: 1.32, perLevel: 4,
            names: ['Grimorio de Poda', 'Grimorio Musgoso', 'Grimorio de Raíz', 'Grimorio Abierto', 'Grimorio de Esporas', 'Herbario Vivo', 'Herbario de las Mil Páginas'],
            desc: 'Flota sobre su mano y poda raíces solo. Cada nivel suma valor por poda.',
            hints: ['las tapas se cubren de musgo', 'pasa dos páginas a la vez', 'se abre del todo y brilla al podar', 'suelta esporas al pasar página', 'las páginas se despliegan alrededor', 'varias páginas lanzan la hoja juntas']
          },
          robe: {
            slot: 'robe', kind: 'gen', baseCost: 50, growth: 1.22, perLevel: 2, reveal: { item: ['grimoire', 1] },
            names: ['Túnica de Corteza', 'Corteza Húmeda', 'Corteza con Musgo', 'Manto de Liquen', 'Manto de Helechos', 'Manto Florido', 'Manto de la Fundadora'],
            desc: 'La corteza absorbe la humedad: genera savia por sí misma y +0,5 % del flujo de poda por nivel.',
            hints: ['manchas húmedas y vetas verdes', 'musgo en los hombros', 'liquen luminoso en el bajo', 'helechos que se agitan al podar', 'flores sanas en el borde', 'la corteza brilla con vetas ácidas']
          },
          hat: {
            slot: 'hat', kind: 'interval', baseCost: 60, growth: 1.9, perLevel: 0.05, reveal: { item: ['grimoire', 2] },
            names: ['Tocado de Espinas', 'Tocado de Hojas', 'Corona de Espinas', 'Corona Ácida', 'Corona de Ramas', 'Corona Florida', 'Corona de la Reina Vencida'],
            desc: 'Agudiza los sentidos: acorta el intervalo entre podas.',
            hints: ['hojas entre las espinas', 'corona definitiva de espinas floridas']
          },
          collar: {
            slot: 'accessory', kind: 'mult', target: 'grimoire', baseCost: 200, growth: 2.0, perLevel: 0.1, reveal: { item: ['grimoire', 3] },
            names: ['Collar de Semillas', 'Collar Germinado', 'Collar de Brotes', 'Collar de Vainas', 'Collar de Esporas', 'Collar Florecido', 'Collar del Ciclo'],
            desc: 'Refuerza el grimorio: +10 % del valor de poda por nivel.',
            hints: ['una semilla brota al podar', 'brotes visibles en el icono', 'las vainas se abren al podar', 'suelta esporas al podar', 'florece en el icono', 'semillas que orbitan la mano']
          },
          sickle: {
            slot: 'spell', kind: 'prunePlus', baseCost: 400, growth: 1.35, perLevel: 4, reveal: { item: ['robe', 2] },
            names: ['Hoja de Siega', 'Hoja Creciente', 'Poda Bifurcada', 'Hoja Bumerán', 'Siega Verde', 'Abanico de Hojas', 'Guadaña Lunar'],
            desc: 'Una hoja curva recorre la raíz marcada: +4 de savia por poda por nivel.',
            hints: ['media luna que vuela en arco', 'la hoja se bifurca al impactar', 'la hoja vuelve como bumerán', 'deja un tajo verde sobre la raíz', 'tres hojas en abanico', 'una guadaña lunar barre toda la fila']
          },
          pollen: {
            slot: 'spell', kind: 'bloomMult', baseCost: 1500, growth: 1.85, perLevel: 0.2, reveal: { blooms: 1 },
            names: ['Polen Errante', 'Polen de Esporas', 'Polen Dividido', 'Polen en Espiral', 'Sendero de Polen', 'Polen en Flor', 'Tormenta Dorada'],
            desc: 'Una nube sigue la secuencia de raíces: +20 % a cada floración por nivel.',
            hints: ['la nube deja esporas al moverse', 'la nube se divide sobre cada raíz', 'la nube gira en espiral', 'ilumina el camino de la secuencia', 'florece en el aire', 'tormenta dorada al florecer']
          },
          graft: {
            slot: 'spell', kind: 'cycle', baseCost: 3000, growth: 1.3, perLevel: 80, reveal: { item: ['sickle', 3] },
            names: ['Injerto de Luna', 'Brote Lunar', 'Flor Creciente', 'Injerto Doble', 'Enredadera Lunar', 'Flor de Luna', 'Luna Llena'],
            desc: 'Cada 12 s madura una raíz lateral; la maga la corta y suma savia (80 + media poda por nivel).',
            hints: ['el brote brilla como la luna', 'el brote se abre en media luna', 'maduran dos brotes', 'una enredadera trepa al madurar', 'la flor de luna se abre', 'un halo de luna llena al cortar']
          },
          maw: {
            slot: 'spell', kind: 'bloomFlat', baseCost: 20000, growth: 1.5, perLevel: 400, reveal: { item: ['pollen', 3] },
            names: ['Flor de las Mil Bocas', 'Flor Dentada', 'Bocas en Cadena', 'Pétalos Desatados', 'Bocas de Esporas', 'Reina Alzada', 'Mil Bocas'],
            desc: 'Especialización: la flor de la Reina se abre al cerrar cada ciclo y suma 400 de savia por nivel a cada floración.',
            hints: ['las bocas muestran dientes', 'las bocas se abren en cadena', 'los pétalos se despliegan y retroceden', 'las bocas escupen esporas', 'la flor se alza sobre el tallo', 'un anillo de mil bocas se abre a la vez']
          }
        },
        itemOrder: ['grimoire', 'robe', 'hat', 'collar', 'sickle', 'pollen', 'graft', 'maw']
      },

      crypt: {
        name: 'Cripta de las Campanas', short: 'Cripta',
        mage: 'la maga', mageName: 'Maga de las campanas',
        currency: 'maná de la cripta',
        manualName: 'Trazar sello', manualBase: 3, manualPulseFraction: 0.1,
        focusLabel: 'báculo',
        unlockForestProd: 400,
        unlock: { forestProd: 400 },
        pulse: { perLevel: 5, baseInterval: 5, minInterval: 1.5 },
        litany: { every: 6 },             // pulsos para completar la corona
        items: {
          staff: {
            slot: 'focus', kind: 'pulse', baseCost: 15, growth: 1.25, perLevel: 1,
            names: ['Báculo de Latón', 'Báculo de Ámbar', 'Báculo Creciente', 'Báculo del Tañido', 'Báculo de Vigilia', 'Báculo del Coro', 'Báculo del Último Tañido'],
            desc: 'Carga y libera pulsos de maná automáticamente.',
            hints: ['gema ámbar en garra de latón', 'media luna de latón con orbe', 'la luna se abre al cargar', 'cuelgan dos campanillas', 'tres orbes cantan al cargar', 'el orbe se vuelve una campana de luz']
          },
          vest: {
            slot: 'robe', kind: 'gen', baseCost: 200, growth: 1.25, perLevel: 3, reveal: { item: ['staff', 2] },
            names: ['Vestidura de Vigilia', 'Vestidura de Ámbar', 'Hábito del Coro', 'Hábito de Velas', 'Hábito de Ceniza', 'Hábito Consagrado', 'Hábito del Réquiem'],
            desc: 'La vigilia genera maná sin esperar al pulso y +0,5 % del pulso base por segundo por nivel.',
            hints: ['ribete ámbar', 'estola con sellos', 'gotas de cera luminosa', 'el bajo se oscurece como ceniza', 'los sellos se iluminan al pulsar', 'la estola flota al pulsar']
          },
          mitre: {
            slot: 'hat', kind: 'confMult', baseCost: 2000, growth: 1.8, perLevel: 0.1, reveal: { order: ['confluence', 1] },
            names: ['Mitra del Último Eco', 'Mitra Ambarina', 'Mitra Rúnica', 'Mitra de Campanilla', 'Mitra del Halo', 'Mitra Doble', 'Mitra del Eco Eterno'],
            desc: 'Amplifica el eco del bosque: +10 % a la Confluencia recibida por nivel.',
            hints: ['banda ámbar', 'runa en el frente', 'campanilla colgante', 'medio halo detrás', 'doble punta', 'una corona de eco flota encima']
          },
          medallion: {
            slot: 'accessory', kind: 'pulseMult2', baseCost: 1500, growth: 2.4, perLevel: 0.15, reveal: { item: ['bell', 2] },
            names: ['Medallón Funerario', 'Medallón de Ámbar', 'Medallón Rúnico', 'Medallón del Coro', 'Medallón de Cera', 'Medallón Doble', 'Medallón del Réquiem'],
            desc: 'Refuerza el báculo de latón: +15 % al pulso base por nivel.',
            hints: ['destella ámbar al pulsar', 'runa grabada', 'resuena con la campana', 'gotea cera luminosa', 'dos caras que giran', 'irradia un anillo al pulsar']
          },
          bell: {
            slot: 'spell', kind: 'pulseMult', baseCost: 100, growth: 1.8, perLevel: 0.3,
            names: ['Campana Agrietada', 'Campana Remendada', 'Campana de Ámbar', 'Campana del Umbral', 'Campana del Doble Tañido', 'Campana de Luz', 'Campana del Réquiem'],
            desc: 'Ritual: amplifica el pulso, +30 % de potencia por nivel.',
            hints: ['doble onda al tañer', 'la onda arrastra runas', 'tañe dos veces (eco)', 'la onda es un anillo de runas', 'columna de luz desde la campana', 'el tañido deshace al Rey en motas']
          },
          chalk: {
            slot: 'spell', kind: 'interval', baseCost: 80, growth: 1.8, perLevel: 0.05,
            names: ['Círculo de Tiza', 'Doble Círculo', 'Círculo de Sellos', 'Círculo de Sellos', 'Círculo de Sellos', 'Círculo de Sellos', 'Círculo Perfecto'],
            desc: 'Ritual: acorta el intervalo entre pulsos.',
            hints: ['doble círculo con sellos que giran', 'forma definitiva: el círculo proyecta un cilindro de runas']
          },
          incense: {
            slot: 'spell', kind: 'incense', baseCost: 800, growth: 1.3, perLevel: 2, reveal: { item: ['chalk', 3] },
            names: ['Incienso de Vigilia', 'Humo en Espiral', 'Humo Gemelo', 'Humo Rúnico', 'Humo de Santos', 'Anillos de Humo', 'Humo Coronado'],
            desc: 'Un hilo de humo recorre el círculo entre campanadas: maná por segundo × la potencia de la campana.',
            hints: ['el humo forma una espiral', 'dos hilos de humo', 'el humo dibuja runas', 'rostros de santos en el humo', 'anillos de humo que suben', 'el humo corona al Rey']
          },
          litany: {
            slot: 'spell', kind: 'litany', baseCost: 200000, growth: 2.0, perLevel: 0.5, reveal: { item: ['chalk', 10] },
            names: ['Letanía de la Corona', 'Corona Enjoyada', 'Corona Cantada', 'Corona Giratoria', 'Onda del Suelo', 'Corona Impuesta', 'Purificación'],
            desc: 'Cada 6 pulsos se completa una corona sobre el Rey: la onda de purificación paga medio pulso base por nivel.',
            hints: ['la corona luce joyas', 'notas del canto alrededor', 'la corona gira', 'la onda recorre el suelo', 'la corona desciende sobre el Rey', 'la onda purifica toda la cripta']
          }
        },
        itemOrder: ['staff', 'vest', 'mitre', 'medallion', 'bell', 'chalk', 'incense', 'litany']
      },

      castle: {
        name: 'Castillo del Invierno Inmóvil', short: 'Castillo',
        mage: 'el lancero', mageName: 'Lancero de brasas',
        currency: 'brasa del castillo',
        manualName: 'Lanzar ascuas', manualBase: 6, manualHeatSeconds: 2,
        focusLabel: 'lanza',
        unlock: { zoneProd: ['crypt', 15000], text: 'la cripta produzca 15 K/s' },
        // El calor abre grietas en la coraza de la Regente; al completar la red, deshielo y descarga.
        // Ritmo fijo: una grieta cada 3 s (la Grieta Guía lo acorta hasta 1 s); el calor decide cuánto paga cada una.
        heat: { baseInterval: 3, minInterval: 1, network: 6, crackPay: 0.5, thawPay: 1.5 },
        items: {
          lance: {
            slot: 'focus', kind: 'heat', baseCost: 20, growth: 1.27, perLevel: 1.2,
            names: ['Lanza de Brasas', 'Lanza Candente', 'Lanza de Forja', 'Lanza Fundida', 'Lanza de Lava', 'Lanza del Sol Bajo', 'Lanza del Deshielo'],
            desc: 'Canaliza fuego contra la coraza: calor por segundo.',
            hints: ['la punta arde con llama viva', 'aletas de forja que se abren al cargar', 'la lanza gotea metal fundido', 'un remolino de chispas rodea el asta', 'la punta lanza dos lenguas de fuego', 'la lanza se vuelve un rayo de sol']
          },
          robe: {
            slot: 'robe', kind: 'gen', baseCost: 300, growth: 1.22, perLevel: 4, reveal: { item: ['lance', 1] },
            names: ['Gambesón de Brasas', 'Gambesón Tiznado', 'Cota Ardiente', 'Cota de Ascuas', 'Cota de Forja', 'Cota Solar', 'Cota del Último Fuego'],
            desc: 'Guarda el calor: brasa por segundo sin atacar y +0,5 % de lo que rinde la lanza por nivel.',
            hints: ['costuras incandescentes', 'placas de cota al rojo', 'ascuas en los hombros', 'el borde humea al lanzar', 'símbolos solares en el pecho', 'la cota brilla como un horno']
          },
          helm: {
            slot: 'hat', kind: 'thawMult', baseCost: 800, growth: 1.6, perLevel: 0.25, reveal: { cnt: ['thaw', 1] },
            names: ['Yelmo de Fragua', 'Yelmo Tiznado', 'Yelmo de Cresta', 'Yelmo de Cuernos', 'Yelmo de Llama', 'Yelmo Solar', 'Yelmo del Deshielo'],
            desc: 'Explota el deshielo: +25 % a cada descarga por nivel.',
            hints: ['visera ennegrecida', 'cresta de chispas', 'cuernos de metal rojo', 'la cresta se vuelve llama', 'corona solar', 'el yelmo arde al descargar']
          },
          bracer: {
            slot: 'accessory', kind: 'mult', target: 'lance', baseCost: 500, growth: 1.6, perLevel: 0.25, reveal: { item: ['lance', 3] },
            names: ['Brazal de Hollín', 'Brazal Candente', 'Brazal de Forja', 'Brazal Rúnico', 'Brazal de Lava', 'Brazal Solar', 'Brazal Eterno'],
            desc: 'Refuerza la lanza: +25 % de su calor por nivel.',
            hints: ['destella al lanzar', 'runas que se encienden', 'gotea fuego', 'anillo de chispas', 'brilla como el sol', 'llama perpetua']
          },
          embers: {
            slot: 'spell', kind: 'heatFlat', baseCost: 2000, growth: 1.3, perLevel: 5, reveal: { item: ['robe', 3] },
            names: ['Lluvia de Ascuas', 'Ascuas Gemelas', 'Ascuas en Arco', 'Enjambre de Ascuas', 'Ascuas Espirales', 'Tormenta de Ascuas', 'Sol de Ascuas'],
            desc: 'Calor sostenido: ascuas que caen sobre la coraza, +5 de calor/s por nivel.',
            hints: ['caen de dos en dos', 'trazan arcos sobre el trono', 'un enjambre rodea a la Regente', 'giran en espiral antes de caer', 'tormenta que tiñe el cielo', 'un pequeño sol estalla sobre el trono']
          },
          hammer: {
            slot: 'spell', kind: 'crackFlat', baseCost: 1500, growth: 1.3, perLevel: 15, reveal: { cnt: ['crack', 6] },
            names: ['Martillo de Rescoldo', 'Martillo Doble', 'Martillo de Eco', 'Martillo Rúnico', 'Martillo de Ola', 'Martillo Solar', 'Martillo del Trono'],
            desc: 'Cada grieta paga además +15 de brasa por nivel.',
            hints: ['golpea dos veces', 'deja un eco de ondas', 'runas en cada grieta', 'onda de calor por la coraza', 'chispas solares', 'el trono tiembla con cada golpe']
          },
          guide: {
            slot: 'spell', kind: 'crackInterval', baseCost: 400, growth: 1.8, perLevel: 0.06, reveal: { item: ['lance', 5] },
            names: ['Grieta Guía', 'Grieta Ramificada', 'Grieta Guía', 'Grieta Guía', 'Grieta Guía', 'Grieta Guía', 'Red Perfecta'],
            desc: 'Las grietas se abren más a menudo (de cada 3 s hasta cada 1 s). Más deshielos: favorece martillo y fénix.',
            hints: ['las grietas se ramifican', 'forma definitiva: la red de grietas brilla completa']
          },
          phoenix: {
            slot: 'spell', kind: 'thawFlat', baseCost: 30000, growth: 1.45, perLevel: 600, reveal: { item: ['helm', 3] },
            names: ['Fénix del Deshielo', 'Fénix de Dos Alas', 'Fénix en Picado', 'Fénix Rodeante', 'Fénix de Lava', 'Fénix Solar', 'Fénix del Trono'],
            desc: 'Especialización: en cada deshielo un fénix suma 600 de brasa por nivel.',
            hints: ['abre dos alas de fuego', 'cae en picado sobre la coraza', 'rodea el trono antes de golpear', 'deja estela de lava', 'brilla como un sol', 'se posa en el trono y lo funde']
          }
        },
        itemOrder: ['lance', 'robe', 'helm', 'bracer', 'embers', 'hammer', 'guide', 'phoenix']
      },

      caverns: {
        name: 'Cavernas del Sol Sepultado', short: 'Cavernas',
        mage: 'la maga glaciar', mageName: 'Maga glaciar',
        currency: 'escarcha de las cavernas',
        manualName: 'Soplo helado', manualBase: 10, manualBeamSeconds: 1,
        focusLabel: 'espejo',
        unlock: { resets: 1, cnt: ['castle', 'thaw', 10], text: 'hayas refundado al menos una vez y el castillo sume 10 deshielos en este ciclo' },
        // Haces de frío continuos; cada 30 s el ojo de la Caldera se abre y los haces rinden más.
        beams: { extraShare: 0.4, convergence: 0.1, eyeInterval: 30, baseWindow: 4, maxWindow: 12, windowMult: 3 },
        items: {
          mirror: {
            slot: 'focus', kind: 'beam', baseCost: 50, growth: 1.3, perLevel: 3,
            names: ['Espejo de Obsidiana', 'Espejo Escarchado', 'Espejo Biselado', 'Espejo Gemelo', 'Espejo Polar', 'Espejo Austral', 'Espejo del Sol Frío'],
            desc: 'Concentra frío en un haz continuo contra la Caldera.',
            hints: ['marco escarchado', 'bisel que divide el haz', 'dos caras que giran', 'aurora en el cristal', 'el haz se trenza', 'un sol frío brilla en el espejo']
          },
          robe: {
            slot: 'robe', kind: 'gen', baseCost: 500, growth: 1.22, perLevel: 5, reveal: { item: ['mirror', 1] },
            names: ['Abrigo de Escarcha', 'Abrigo Nevado', 'Manto de Hielo', 'Manto de Aurora', 'Manto Polar', 'Manto Austral', 'Manto del Invierno Eterno'],
            desc: 'El frío que la rodea condensa escarcha y +0,5 % del haz del espejo por nivel.',
            hints: ['copos en los hombros', 'cristales en el bajo', 'la aurora recorre la tela', 'el borde se congela al lanzar', 'estrellas polares', 'una ventisca la rodea']
          },
          diadem: {
            slot: 'hat', kind: 'beamMult', baseCost: 2000, growth: 1.8, perLevel: 0.2, reveal: { item: ['mirror', 3] },
            names: ['Diadema Glacial', 'Diadema de Carámbanos', 'Diadema Prismática', 'Corona Polar', 'Corona de Aurora', 'Corona Austral', 'Corona del Sol Frío'],
            desc: 'Intensidad: +20 % a todos los haces por nivel.',
            hints: ['carámbanos colgantes', 'prisma en la frente', 'puntas de hielo', 'aurora sobre la cabeza', 'estrella austral', 'halo de sol frío']
          },
          pendant: {
            slot: 'accessory', kind: 'mult', target: 'mirror', baseCost: 1500, growth: 1.8, perLevel: 0.25, reveal: { item: ['mirror', 5] },
            names: ['Colgante de Cuarzo Frío', 'Colgante Escarchado', 'Colgante Prismático', 'Colgante Polar', 'Colgante de Aurora', 'Colgante Austral', 'Colgante del Sol Frío'],
            desc: 'Refuerza el espejo: +25 % a su haz por nivel.',
            hints: ['destella al lanzar', 'divide la luz', 'gira al canalizar', 'aurora breve', 'estrella fría', 'sol frío diminuto']
          },
          shards: {
            slot: 'spell', kind: 'mirrors', baseCost: 3000, growth: 4.5, perLevel: 1, cap: 6, reveal: { item: ['robe', 2] },
            names: ['Espejos de Hielo', 'Espejos de Hielo', 'Espejos de Hielo', 'Espejos de Hielo', 'Espejos de Hielo', 'Espejos de Hielo', 'Corona de Espejos'],
            desc: 'Superficies: +1 espejo de hielo por nivel (máx. 6). Cada uno mantiene su propio haz y aumenta la convergencia.',
            hints: ['forma definitiva: seis espejos en corona sobre la Caldera']
          },
          lens: {
            slot: 'spell', kind: 'beamFlat', baseCost: 2500, growth: 1.35, perLevel: 5, reveal: { item: ['shards', 1] },
            names: ['Haz Concentrado', 'Haz Afilado', 'Haz Trenzado', 'Haz Prismático', 'Haz Polar', 'Haz de Aurora', 'Haz del Cero Absoluto'],
            desc: 'Intensidad por haz: cada haz (incluidos los de los espejos) suma +5 de escarcha/s por nivel.',
            hints: ['el haz se estrecha y brilla', 'dos hebras trenzadas', 'el haz se descompone en colores', 'escarcha que cruje en el aire', 'cortinas de aurora', 'el haz congela el aire a su paso']
          },
          gaze: {
            slot: 'spell', kind: 'window', baseCost: 5000, growth: 1.7, perLevel: 0.5, cap: 16, reveal: { cnt: ['eye', 3] },
            names: ['Mirada Sostenida', 'Mirada Fija', 'Mirada Fija', 'Mirada Fija', 'Mirada Fija', 'Mirada Fija', 'Mirada Inquebrantable'],
            desc: 'Mantiene abierto el ojo de la Caldera: +0,5 s de ventana por nivel (de 4 s hasta 12 s).',
            hints: ['el ojo tarda más en cerrarse', 'forma definitiva: el ojo queda abierto 12 s']
          },
          zenith: {
            slot: 'spell', kind: 'windowMult', baseCost: 40000, growth: 1.45, perLevel: 0.15, linear: true, reveal: { item: ['gaze', 3] },
            names: ['Cénit Helado', 'Cénit Doble', 'Cénit Cristalino', 'Cénit Polar', 'Cénit de Aurora', 'Cénit Austral', 'Cénit del Sol Frío'],
            desc: 'Especialización: durante la ventana del ojo los haces rinden ×3 y +0,15 por nivel.',
            hints: ['dos columnas de frío', 'el ojo se cubre de cristal', 'estrella polar sobre el ojo', 'aurora sobre la caverna', 'cruz austral', 'el sol frío eclipsa el ojo']
          }
        },
        itemOrder: ['mirror', 'robe', 'diadem', 'pendant', 'shards', 'lens', 'gaze', 'zenith']
      }
    },

    // Mejoras de la orden: duran el ciclo; cada aporte va en UNA dirección y lee la
    // producción PROPIA de la zona de origen (sin bonos recibidos), así no se retroalimentan.
    order: {
      confluence: {
        name: 'Confluencia', from: 'forest', to: 'crypt', pays: 'forest', needs: ['crypt'],
        baseCost: 40000, growth: 5, maxLevel: 5, seconds: [0, 3, 5, 8, 12, 18],
        desc: 'Cada pulso de la cripta suma unos segundos de la producción propia del bosque. El bosque conserva su maná.'
      },
      resonance: {
        name: 'Resonancia de Báculos', pays: 'crypt', needs: ['crypt'],
        baseCost: 8000, growth: 6, maxLevel: 10, perLevel: 0.5,
        desc: 'Ambos báculos vibran al unísono: +50 % al báculo del bosque y al pulso base de la cripta.'
      },
      pollen: {
        name: 'Polen Astral', from: 'forest', to: 'jungle', pays: 'jungle', needs: ['jungle'], needsItem: ['forest', 'spell', 1],
        baseCost: 20000, growth: 8, maxLevel: 5, seconds: [0, 15, 30, 50, 80, 120],
        desc: 'Cada floración de la jungla recibe un bono de N segundos de la Lluvia de Chispas del bosque.'
      },
      rootstar: {
        name: 'Raíz Estelar', from: 'jungle', to: 'forest', pays: 'forest', needs: ['jungle'], needsItem: ['forest', 'orbit', 1],
        baseCost: 15000, growth: 5, maxLevel: 5, seconds: [0, 2, 4, 6, 9, 12],
        desc: 'Cada descarga de la Órbita Gemela suma N segundos de la producción propia de la jungla al bosque.'
      },
      requiem: {
        name: 'Deshielo del Réquiem', from: 'crypt', to: 'castle', pays: 'crypt', needs: ['castle'],
        baseCost: 2e6, growth: 6, maxLevel: 5, seconds: [0, 2, 4, 7, 11, 16],
        desc: 'Cada deshielo del castillo suma N segundos de la producción propia de la cripta. Da motivos para volver a la cripta.'
      }
    },
    orderOrder: ['confluence', 'resonance', 'pollen', 'rootstar', 'requiem'],

    prestige: {
      goalTotal: 1e9,          // maná total generado en el ciclo para poder refundar
      baseEchoes: 3,
      exponent: 0.5,           // Ecos base = floor(3·√(total/meta)) — igual que en v0.2 hasta 12 Ecos
      tailFrom: 12,            // por encima: +tailPerDoubling Ecos cada vez que se duplica el total
      tailPerDoubling: 3,
      maturityMinutes: 4,      // los Ecos base maduran con el ciclo: como máximo 1 por cada 4 min (mínimo 1)
      // Peso de cada zona en el total: la savia de la jungla cuenta a la mitad (su economía es rápida y barata)
      weights: { forest: 1, jungle: 0.5, crypt: 1, castle: 1, caverns: 1 }
    },

    // Hazañas del ciclo: Ecos adicionales al refundar si se cumplieron en el ciclo actual.
    // Recompensan quedarse a explorar el castillo y las cavernas.
    // Solo cuentan si el ciclo dura al menos featMinCycle segundos (premian profundizar, no repetir ciclos cortos).
    featMinCycle: 1200,
    feats: [
      { id: 'castleOpen', name: 'Abrir la primera grieta en la Regente', echoes: 1, check: { cnt: ['castle', 'crack', 1] } },
      { id: 'thaws10', name: 'Diez deshielos en el castillo', echoes: 1, check: { cnt: ['castle', 'thaw', 10] } },
      { id: 'fullOrder', name: 'Las cinco mejoras de la Orden activas', echoes: 1, check: { allOrders: 1 } },
      { id: 'cavernsOpen', name: 'Despertar a la maga glaciar', echoes: 1, check: { open: 'caverns' } },
      { id: 'windows30', name: 'Treinta miradas del ojo de la Caldera', echoes: 2, check: { cnt: ['caverns', 'eye', 30] } }
    ],

    talents: {
      heirloom: {
        name: 'Báculos heredados', baseCost: 2, growth: 1, maxLevel: 1, staffMult: 1.5,
        desc: 'Empiezas con el Báculo de Rama, la maga de la cripta despierta con su báculo y ambos báculos rinden un 50 % más.',
        nextRun: 'El aprendiz lanza solo desde el primer segundo; la cripta abre con su báculo.'
      },
      bells: {
        name: 'Campanas eternas', baseCost: 2, growth: 2, maxLevel: 10, perLevel: 1.0,
        desc: 'Los pulsos de la cripta son permanentemente más potentes: +100 % por nivel.',
        nextRun: 'Cada pulso de la cripta vale el doble por nivel; la maga muestra un aura.'
      },
      veil: {
        name: 'Memoria del Velo', baseCost: 3, growth: 2, maxLevel: 10, perLevel: 0.25,
        desc: 'El bosque recuerda: +25 % a toda la producción del bosque por nivel.',
        nextRun: 'Todo el bosque produce +25 % por nivel desde el inicio.'
      },
      seed: {
        name: 'Semilla de la Fundadora', baseCost: 2, growth: 1, maxLevel: 1, bloomMult: 1.5,
        desc: 'La jungla reabre con una raíz madura (la primera marca provoca una floración) y todas las floraciones rinden +50 %.',
        nextRun: 'Al descubrir la jungla, tu primera marca a mano ya produce una floración.'
      },
      sky: {
        name: 'Cielo Recordado', baseCost: 2, growth: 1, maxLevel: 1, spellMult: 1.5, masteryMult: 2,
        desc: 'Los cuatro hechizos del bosque se descubren desde el inicio y rinden +50 %; la maestría de Chispa avanza al doble.',
        nextRun: 'Ves y puedes comprar Lluvia, Órbita, Prisma y Constelación desde el primer minuto, con +50 % de rendimiento.'
      },
      // --- Talentos avanzados (v0.3): requisito de dominio visible y costes crecientes ---
      comet: {
        name: 'Escuela del Cometa', baseCost: 6, growth: 1.8, maxLevel: 5, perLevel: 1.0, tier: 'avanzado',
        req: { record: 'spellMax', value: 50, text: 'Lleva la Lluvia de Chispas al Nv 50 en algún ciclo' },
        desc: 'Especializa la magia astral: la Lluvia y la Órbita rinden +100 % por nivel y la Lluvia de Cometas aparece ya en su forma de Nv 10.',
        nextRun: 'Desde la primera lluvia verás cometas con cola, y cada nivel duplica la Lluvia y la Órbita.'
      },
      forge: {
        name: 'Brasas Perpetuas', baseCost: 10, growth: 1, maxLevel: 1, tier: 'avanzado',
        req: { record: 'thawsMax', value: 10, text: 'Consigue 10 deshielos del castillo en un mismo ciclo' },
        desc: 'Cambia el arranque del castillo: se descubre al abrir la cripta y el lancero despierta con la lanza en Nv 10.',
        nextRun: 'El castillo abre junto a la cripta y su lanza ya está evolucionada.'
      },
      pact: {
        name: 'Pacto de la Mesa', baseCost: 8, growth: 2, maxLevel: 3, perLevel: 0.5, tier: 'avanzado',
        req: { record: 'allOrders', value: 1, text: 'Ten activas las cinco mejoras de la Orden en un mismo ciclo' },
        desc: 'Mejora la interacción entre magos: cada aporte cruzado de la Orden (Confluencia, Polen, Raíz, Deshielo) rinde +50 % por nivel.',
        nextRun: 'Las mejoras de la Orden valen más desde su primer nivel.'
      },
      relics: {
        name: 'Reliquias del Umbral', baseCost: 12, growth: 2, maxLevel: 3, perLevel: 60, tier: 'avanzado',
        req: { record: 'resets', value: 3, text: 'Refunda la Orden 3 veces' },
        desc: 'Prepara el ciclo siguiente: al refundar, cada zona abierta guarda 60 s de su producción por nivel, que recibe al volver a abrirse.',
        nextRun: 'Cada zona reabre con un saldo inicial guardado del ciclo anterior.'
      }
    },
    talentOrder: ['heirloom', 'sky', 'seed', 'bells', 'veil', 'comet', 'forge', 'pact', 'relics'],

    anomaly: { minDelay: 70, maxDelay: 130, lifetime: 18, rewardSeconds: 20, minReward: 15 },

    // Límite de partículas por vista (la economía nunca depende de esto)
    fx: { detailParticles: 220, portalParticles: 40, reducedParticles: 30 }
  };
})(typeof window !== 'undefined' ? window : globalThis);
