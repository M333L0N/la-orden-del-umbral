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
    saveVersion: 2,
    backupSuffix: '.respaldo-v',      // copia del guardado original antes de migrar: <saveKey>.respaldo-v1
    autosaveSeconds: 5,
    offlineCapSeconds: 8 * 3600,
    offlineReportMinSeconds: 30,

    // Orden de presentación (peligrosidad creciente). Los ids son permanentes.
    zoneOrder: ['forest', 'jungle', 'crypt'],

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
            desc: 'Absorbe la niebla y genera maná por sí misma.',
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
            slot: 'spell', kind: 'perCast', baseCost: 600, growth: 1.25, perLevel: 0.6, reveal: { item: ['staff', 10] },
            names: ['Prisma del Velo', 'Prisma Bifurcado', 'Prisma en Abanico', 'Prisma de Rebote', 'Prisma Triangular', 'Prisma Espiral', 'Prisma del Ciervo'],
            desc: 'Cada chispa automática se refracta en el cristal y suma maná por impacto.',
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
            desc: 'La corteza absorbe la humedad: genera savia por sí misma.',
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
            slot: 'spell', kind: 'bloomMult', baseCost: 1500, growth: 2.0, perLevel: 0.2, reveal: { blooms: 1 },
            names: ['Polen Errante', 'Polen de Esporas', 'Polen Dividido', 'Polen en Espiral', 'Sendero de Polen', 'Polen en Flor', 'Tormenta Dorada'],
            desc: 'Una nube sigue la secuencia de raíces: +20 % a cada floración por nivel.',
            hints: ['la nube deja esporas al moverse', 'la nube se divide sobre cada raíz', 'la nube gira en espiral', 'ilumina el camino de la secuencia', 'florece en el aire', 'tormenta dorada al florecer']
          },
          graft: {
            slot: 'spell', kind: 'cycle', baseCost: 3000, growth: 1.3, perLevel: 80, reveal: { item: ['sickle', 3] },
            names: ['Injerto de Luna', 'Brote Lunar', 'Flor Creciente', 'Injerto Doble', 'Enredadera Lunar', 'Flor de Luna', 'Luna Llena'],
            desc: 'Cada 12 s madura una raíz lateral; la maga la corta y suma savia.',
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
            desc: 'La vigilia de la maga genera maná sin esperar al pulso.',
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
      }
    },

    // Mejoras de la orden: duran la partida; cada aporte va en UNA dirección y lee la
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
      }
    },
    orderOrder: ['confluence', 'resonance', 'pollen', 'rootstar'],

    prestige: {
      goalTotal: 1e9,          // maná total generado en la partida para poder refundar
      baseEchoes: 3,
      exponent: 0.5,
      // Peso de cada zona en el total: la savia de la jungla cuenta a la mitad (su economía es rápida y barata)
      weights: { forest: 1, jungle: 0.5, crypt: 1 }
    },

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
      }
    },
    talentOrder: ['heirloom', 'sky', 'seed', 'bells', 'veil'],

    anomaly: { minDelay: 70, maxDelay: 130, lifetime: 18, rewardSeconds: 20, minReward: 15 },

    // Límite de partículas por vista (la economía nunca depende de esto)
    fx: { detailParticles: 220, portalParticles: 40, reducedParticles: 30 }
  };
})(typeof window !== 'undefined' ? window : globalThis);
