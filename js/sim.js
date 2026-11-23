/* La Orden del Umbral — simulación económica (sin DOM, sin animaciones).
 * Todo depende del tiempo transcurrido: advance(state, dt) es la única forma de producir.
 * Cada zona se describe con un "modelo": producción pasiva continua + ciclos con fase
 * (pulsos, podas, alineaciones…) + secuencias que se completan cada N ciclos.
 */
(function (root) {
  'use strict';
  var A = root.Arcane = root.Arcane || {};
  var C = A.CONFIG;
  var S = A.Sim = {};
  var ZONES = C.zoneOrder;

  // ---------- Estado ----------
  S.newZone = function (zid) {
    var z = { mana: 0, generated: 0, items: {}, cyc: {}, cnt: {}, seq: {}, manual: 0 };
    C.zones[zid].itemOrder.forEach(function (id) { z.items[id] = 0; });
    if (zid !== 'forest') { z.unlocked = false; z.introSeen = false; }
    return z;
  };
  S.newState = function (prev, now) {
    now = now || Date.now();
    var st = {
      version: C.saveVersion, created: now, lastTick: now,
      zones: {},
      order: {},
      run: { playTime: 0, number: 1 },
      prestige: { echoes: 0, earnedTotal: 0, resets: 0, talents: {} },
      mastery: { sparks: 0 },
      // Registros de dominio (permanentes): desbloquean talentos avanzados
      records: { spellMax: 0, thawsMax: 0, allOrders: 0, cavernsSeen: 0 },
      reserve: {},
      settings: { reducedMotion: null, buyAmount: '1', view: 'forest', roomTab: 'portals' },
      last: {},
      flags: {}
    };
    ZONES.forEach(function (zid) { st.zones[zid] = S.newZone(zid); });
    C.orderOrder.forEach(function (id) { st.order[id] = 0; });
    C.talentOrder.forEach(function (id) { st.prestige.talents[id] = 0; });
    if (prev) {
      st.prestige = JSON.parse(JSON.stringify(prev.prestige));
      st.settings = JSON.parse(JSON.stringify(prev.settings));
      st.mastery = JSON.parse(JSON.stringify(prev.mastery || { sparks: 0 }));
      st.records = JSON.parse(JSON.stringify(prev.records || st.records));
      st.settings.view = 'forest';
      st.run.number = (prev.run && prev.run.number || 1) + 1;
    }
    S.applyStartTalents(st);
    return st;
  };
  S.applyStartTalents = function (st) {
    var t = st.prestige.talents;
    if (t.heirloom > 0 && st.zones.forest.items.staff < 1) st.zones.forest.items.staff = 1;
  };

  // ---------- Hitos económicos ----------
  S.milestoneMult = function (lvl) {
    var m = 1, M = C.milestones;
    for (var i = 0; i < M.list.length; i++) if (lvl >= M.list[i]) m *= M.mult[M.list[i]];
    var last = M.list[M.list.length - 1];
    if (lvl >= last + M.every) m *= Math.pow(M.afterMult, Math.floor((lvl - last) / M.every));
    return m;
  };
  S.nextMilestone = function (lvl) {
    var M = C.milestones;
    for (var i = 0; i < M.list.length; i++) if (lvl < M.list[i]) return M.list[i];
    var last = M.list[M.list.length - 1];
    return last + (Math.floor((lvl - last) / M.every) + 1) * M.every;
  };
  S.milestoneJump = function (target) { return C.milestones.mult[target] || C.milestones.afterMult; };
  var mm = S.milestoneMult;

  // ---------- Hitos visuales (separados de los económicos) ----------
  S.itemDef = function (zid, id) { return C.zones[zid].items[id]; };
  S.visualMilestones = function (zid, id) {
    var cap = S.itemCap(zid, id);
    if (isFinite(cap)) return cap > 10 ? [10, cap] : [cap];
    return C.visualMilestones.slice();
  };
  // Estado visual 0..6. Un objeto con tope usa 0, 1 y 6 (forma final en el tope).
  S.visualTier = function (zid, id, lvl) {
    var ms = S.visualMilestones(zid, id), n = 0;
    for (var i = 0; i < ms.length; i++) if (lvl >= ms[i]) n = i + 1;
    if (isFinite(S.itemCap(zid, id)) && n === ms.length) return 6;
    return n;
  };
  S.nextVisual = function (zid, id, lvl) {
    var ms = S.visualMilestones(zid, id);
    for (var i = 0; i < ms.length; i++) if (lvl < ms[i]) return { level: ms[i], index: i };
    return null; // forma final alcanzada
  };
  S.itemName = function (zid, id, lvl) {
    var names = S.itemDef(zid, id).names;
    return names[Math.min(names.length - 1, S.visualTier(zid, id, Math.max(0, lvl)))];
  };
  S.tierOf = function (lvl) { // compatibilidad: estado visual genérico sin tope
    var ms = C.visualMilestones, n = 0;
    for (var i = 0; i < ms.length; i++) if (lvl >= ms[i]) n = i + 1;
    return n;
  };

  // ---------- Topes mecánicos ----------
  var capCache = {};
  S.itemCap = function (zid, id) {
    var key = zid + '.' + id;
    if (capCache[key] !== undefined) return capCache[key];
    var cap = Infinity;
    if (zid === 'crypt' && id === 'chalk') cap = findCap(function (l) { return intervalFor(C.zones.crypt.pulse, C.zones.crypt.items.chalk, l); }, C.zones.crypt.pulse.minInterval);
    if (zid === 'jungle' && id === 'hat') cap = findCap(function (l) { return intervalFor(C.zones.jungle.prune, C.zones.jungle.items.hat, l); }, C.zones.jungle.prune.minInterval);
    if (zid === 'castle' && id === 'guide') cap = findCap(function (l) { return intervalFor(C.zones.castle.heat, C.zones.castle.items.guide, l); }, C.zones.castle.heat.minInterval);
    var dcap = C.zones[zid].items[id].cap;
    if (dcap) cap = Math.min(cap, dcap);
    capCache[key] = cap;
    return cap;
  };
  function findCap(f, min) { for (var l = 0; l < 3000; l++) if (f(l) <= min + 1e-12) return l; return 3000; }
  function intervalFor(P, def, lvl) {
    return Math.max(P.minInterval, P.baseInterval / (1 + def.perLevel * lvl * mm(lvl)));
  }
  S.chalkCap = function () { return S.itemCap('crypt', 'chalk'); };


  // ---------- Multiplicadores globales ----------
  var T = function (st, id) { return st.prestige.talents[id] || 0; };
  S.resonanceMult = function (st) { return 1 + C.order.resonance.perLevel * st.order.resonance; };
  S.veilMult = function (st) { return 1 + C.talents.veil.perLevel * T(st, 'veil'); };
  S.heirloomMult = function (st) { return T(st, 'heirloom') > 0 ? C.talents.heirloom.staffMult : 1; };
  S.bellsTalentMult = function (st) { return 1 + C.talents.bells.perLevel * T(st, 'bells'); };
  S.skyMult = function (st) { return T(st, 'sky') > 0 ? C.talents.sky.spellMult : 1; };
  S.seedMult = function (st) { return T(st, 'seed') > 0 ? C.talents.seed.bloomMult : 1; };
  S.cometMult = function (st) { return 1 + C.talents.comet.perLevel * T(st, 'comet'); };
  S.pactMult = function (st) { return 1 + C.talents.pact.perLevel * T(st, 'pact'); };

  S.castRate = function (staffLvl) {
    var R = C.zones.forest.castRate;
    return staffLvl > 0 ? Math.min(R.max, R.base + R.perLevel * staffLvl) : 0;
  };

  // ---------- Modelos de zona ----------
  // own=true: excluye los bonos que la zona RECIBE de otras (para alimentar a terceros sin bucles).
  // cross: producciones propias de las zonas de origen (se calculan una vez por avance).
  S.model = function (st, zid, items, own, cross) {
    items = items || st.zones[zid].items;
    return MODELS[zid](st, items, own, cross || (own ? null : S.crossSources(st)));
  };
  var MODELS = {};

  MODELS.forest = function (st, it, own, cross) {
    var I = C.zones.forest.items, Z = C.zones.forest, veil = S.veilMult(st), sky = S.skyMult(st);
    var ring = 1 + I.ring.perLevel * it.ring * mm(it.ring);
    var staff = it.staff * I.staff.perLevel * mm(it.staff) * ring * S.resonanceMult(st) * S.heirloomMult(st) * veil;
    var robe = (it.robe * I.robe.perLevel * mm(it.robe) + C.robeFocusShare * it.robe * staff / veil) * veil;
    var hood = 1 + I.hood.perLevel * it.hood * mm(it.hood);
    var spell = it.spell * I.spell.perLevel * mm(it.spell) * hood * veil * sky * S.cometMult(st);
    var casts = S.castRate(it.staff);
    var prism = it.staff > 0 ? staff * I.prism.perLevel * it.prism * mm(it.prism) * sky : 0;
    var cycles = [];
    var orbitBase = it.orbit * I.orbit.perLevel * mm(it.orbit) * veil * sky * S.cometMult(st);
    var rsec = C.order.rootstar.seconds[st.order.rootstar] || 0;
    var orbitRoot = (!own && cross && it.orbit > 0) ? rsec * cross.jungle * S.pactMult(st) : 0;
    if (it.orbit > 0) cycles.push({ id: 'orbit', interval: Z.orbit.interval, reward: orbitBase + orbitRoot, base: orbitBase, cross: orbitRoot, crossSeconds: rsec });
    if (it.constellation > 0 && casts > 0) {
      var cInt = Z.constellation.stars * Z.constellation.sparksPerStar / casts;
      cycles.push({ id: 'constellation', interval: cInt, reward: it.constellation * I.constellation.perLevel * mm(it.constellation) * veil * sky });
    }
    return { passive: staff + robe + spell + prism, parts: { staff: staff, robe: robe, spell: spell, prism: prism, ringMult: ring, hoodMult: hood, casts: casts }, cycles: cycles };
  };

  MODELS.jungle = function (st, it, own, cross) {
    var Z = C.zones.jungle, I = Z.items, P = Z.prune;
    var collar = 1 + I.collar.perLevel * it.collar * mm(it.collar);
    var prune = (it.grimoire * I.grimoire.perLevel * mm(it.grimoire) + it.sickle * I.sickle.perLevel * mm(it.sickle)) * collar;
    var interval = intervalFor(P, I.hat, it.hat);
    var flowPrune = it.grimoire > 0 ? prune / interval * (1 + P.bloomFactor) : 0; // flujo de poda incluida su floración básica
    var robe = it.robe * I.robe.perLevel * mm(it.robe) + C.robeFocusShare * it.robe * flowPrune;
    var pollen = 1 + I.pollen.perLevel * it.pollen * mm(it.pollen);
    var maw = it.maw * I.maw.perLevel * mm(it.maw);   // especialización: bono fijo por floración
    var unit = Math.max(prune, S.jungleManualBase(st, prune));
    var bloomBase = (P.seqLength * unit * P.bloomFactor * pollen + maw) * S.seedMult(st);
    var psec = C.order.pollen.seconds[st.order.pollen] || 0;
    var bloomAstral = (!own && cross) ? psec * cross.forestSpell * S.pactMult(st) : 0;
    var cycles = [];
    var bloom = { id: 'bloom', every: P.seqLength, reward: bloomBase + bloomAstral, base: bloomBase, cross: bloomAstral, crossSeconds: psec };
    if (it.grimoire > 0) cycles.push({ id: 'prune', interval: interval, reward: prune, seq: bloom });
    if (it.graft > 0 && it.grimoire > 0) cycles.push({ id: 'graft', interval: Z.graft.interval, reward: it.graft * (I.graft.perLevel * mm(it.graft) + 0.5 * prune) });
    return { passive: robe, parts: { robe: robe, prune: prune, interval: interval, collarMult: collar, pollenMult: pollen, mawMult: maw, bloom: bloom, unit: unit }, cycles: cycles };
  };
  S.jungleManualBase = function (st, prune) {
    var Z = C.zones.jungle;
    return Z.manualBase + Z.manualPruneFraction * (prune || 0);
  };

  MODELS.crypt = function (st, it, own, cross) {
    var Z = C.zones.crypt, I = Z.items, P = Z.pulse;
    var bell = 1 + I.bell.perLevel * it.bell * mm(it.bell);
    var medal = 1 + I.medallion.perLevel * it.medallion * mm(it.medallion);
    var base = it.staff * P.perLevel * mm(it.staff) * bell * medal * S.resonanceMult(st) * S.heirloomMult(st) * S.bellsTalentMult(st);
    var secs = C.order.confluence.seconds[st.order.confluence] || 0;
    var mitre = 1 + I.mitre.perLevel * it.mitre * mm(it.mitre);
    var conf = (!own && cross && it.staff > 0) ? secs * cross.forest * mitre * S.pactMult(st) : 0;
    var interval = intervalFor(P, I.chalk, it.chalk);
    var vest = it.vest * I.vest.perLevel * mm(it.vest) + C.robeFocusShare * it.vest * base / interval;
    var incense = it.incense * I.incense.perLevel * mm(it.incense) * bell;
    var cycles = [];
    if (it.staff > 0) {
      var lit = it.litany > 0 ? { id: 'litany', every: Z.litany.every, reward: it.litany * I.litany.perLevel * mm(it.litany) * base } : null;
      cycles.push({ id: 'pulse', interval: interval, reward: base + conf, base: base, cross: conf, crossSeconds: secs, seq: lit });
    }
    return { passive: vest + incense, parts: { base: base, bellMult: bell, medalMult: medal, mitreMult: mitre, confluence: conf, confluenceSeconds: secs, interval: interval, vest: vest, incense: incense }, cycles: cycles };
  };

  // Castillo: el calor abre grietas; cada red completa provoca un deshielo con descarga.
  MODELS.castle = function (st, it, own, cross) {
    var Z = C.zones.castle, I = Z.items, H = Z.heat;
    var bracer = 1 + I.bracer.perLevel * it.bracer * mm(it.bracer);
    var lanceHeat = it.lance * I.lance.perLevel * mm(it.lance) * bracer;
    var emberHeat = it.lance > 0 ? it.embers * I.embers.perLevel * mm(it.embers) : 0;
    var heat = lanceHeat + emberHeat;
    var interval = intervalFor(H, I.guide, it.guide);
    var crackHeat = heat * interval;                 // calor acumulado en cada grieta
    var helm = 1 + I.helm.perLevel * it.helm * mm(it.helm);
    var crackPay = crackHeat * H.crackPay + it.hammer * I.hammer.perLevel * mm(it.hammer);
    var thawBase = H.network * crackHeat * H.thawPay * helm + it.phoenix * I.phoenix.perLevel * mm(it.phoenix);
    var rsec = C.order.requiem.seconds[st.order.requiem] || 0;
    var thawCross = (!own && cross) ? rsec * cross.crypt * S.pactMult(st) : 0;
    var robe = it.robe * I.robe.perLevel * mm(it.robe) + C.robeFocusShare * it.robe * lanceHeat * H.crackPay;
    var cycles = [];
    var thaw = { id: 'thaw', every: H.network, reward: thawBase + thawCross, base: thawBase, cross: thawCross, crossSeconds: rsec };
    if (heat > 0) cycles.push({ id: 'crack', interval: interval, reward: crackPay, seq: thaw });
    return { passive: robe, parts: { robe: robe, heat: heat, lanceHeat: lanceHeat, emberHeat: emberHeat, crackHeat: crackHeat, crackPay: crackPay, helmMult: helm, bracerMult: bracer, thaw: thaw, interval: heat > 0 ? interval : Infinity }, cycles: cycles };
  };

  // Cavernas: haces continuos (espejo + espejos de hielo); cada 30 s el ojo se abre y rinden más.
  MODELS.caverns = function (st, it, own, cross) {
    var Z = C.zones.caverns, I = Z.items, B = Z.beams;
    var pendant = 1 + I.pendant.perLevel * it.pendant * mm(it.pendant);
    var main = it.mirror * I.mirror.perLevel * mm(it.mirror) * pendant;
    var mirrors = it.mirror > 0 ? it.shards : 0;
    var lens = it.lens * I.lens.perLevel * mm(it.lens);
    var diadem = 1 + I.diadem.perLevel * it.diadem * mm(it.diadem);
    var conv = 1 + B.convergence * mirrors;
    var perExtra = B.extraShare * main + lens;
    var beams = it.mirror > 0 ? ((main + lens) + mirrors * perExtra) * diadem * conv : 0;
    var windowLen = Math.min(B.maxWindow, B.baseWindow + I.gaze.perLevel * it.gaze);
    var wMult = B.windowMult + I.zenith.perLevel * it.zenith;   // lineal: especialización sin saltos explosivos
    var robe = it.robe * I.robe.perLevel * mm(it.robe) + C.robeFocusShare * it.robe * main;
    var cycles = [];
    if (beams > 0) cycles.push({ id: 'eye', interval: B.eyeInterval, reward: beams * (wMult - 1) * windowLen, base: beams * (wMult - 1) * windowLen });
    return { passive: robe + beams, parts: { robe: robe, beams: beams, main: main, mirrors: mirrors, perExtra: perExtra, lens: lens, diademMult: diadem, convergence: conv, window: windowLen, windowMult: wMult, pendantMult: pendant }, cycles: cycles };
  };

  // Producciones propias que alimentan los aportes cruzados (una dirección, sin bucles).
  S.crossSources = function (st) {
    var f = MODELS.forest(st, st.zones.forest.items, true, null);
    var j = S.isOpen(st, 'jungle') ? avgOf(MODELS.jungle(st, st.zones.jungle.items, true, null)) : 0;
    var c = S.isOpen(st, 'crypt') ? avgOf(MODELS.crypt(st, st.zones.crypt.items, true, null)) : 0;
    return { forest: avgOf(f), forestSpell: f.parts.spell, jungle: j, crypt: c };
  };
  function avgOf(m) {
    var r = m.passive;
    m.cycles.forEach(function (c) {
      if (!(c.interval > 0) || !isFinite(c.interval)) return;
      r += c.reward / c.interval;
      if (c.seq) r += c.seq.reward / (c.interval * c.seq.every);
    });
    return r;
  }
  S.isOpen = function (st, zid) { return zid === 'forest' || !!st.zones[zid].unlocked; };
  S.zoneProd = function (st, zid, items) {
    if (!S.isOpen(st, zid)) return 0;
    return avgOf(S.model(st, zid, items));
  };
  S.zoneOwnProd = function (st, zid) { return S.isOpen(st, zid) ? avgOf(S.model(st, zid, null, true)) : 0; };
  S.forestProd = function (st, items) { return S.zoneProd(st, 'forest', items); };
  S.cryptProd = function (st, items) { return S.zoneProd(st, 'crypt', items); };
  S.jungleProd = function (st, items) { return S.zoneProd(st, 'jungle', items); };
  S.totalProd = function (st) { var t = 0; ZONES.forEach(function (z) { t += S.zoneProd(st, z); }); return t; };

  // Atajos de compatibilidad y para la interfaz
  S.forestBreakdown = function (st, items) { var m = S.model(st, 'forest', items); var p = m.parts; p.total = avgOf(m); return p; };
  S.pulseBreakdown = function (st, items) {
    var m = S.model(st, 'crypt', items), p = m.parts;
    return { base: p.base, bellMult: p.bellMult, confluence: p.confluence, confluenceSeconds: p.confluenceSeconds, forestProd: S.crossSources(st).forest, total: p.base + p.confluence, interval: p.interval };
  };
  S.cryptInterval = function (st, items) { return MODELS.crypt(st, items || st.zones.crypt.items, true, null).parts.interval; };
  S.jungleInterval = function (st, items) { return MODELS.jungle(st, items || st.zones.jungle.items, true, null).parts.interval; };

  // ---------- Avance temporal ----------
  // opts.legacy: tiempo de una partida anterior a esta versión (no acredita contenido nuevo: maestrías).
  S.advance = function (st, dt, opts) {
    opts = opts || {};
    var out = { dt: dt, zones: {}, events: [], unlocked: [] };
    ZONES.forEach(function (z) { out.zones[z] = 0; });
    if (!(dt > 0)) return out;
    var cross = S.crossSources(st);
    ZONES.forEach(function (zid) {
      if (!S.isOpen(st, zid)) return;
      var z = st.zones[zid], m = S.model(st, zid, null, false, cross), gain = m.passive * dt;
      m.cycles.forEach(function (c) {
        if (!(c.interval > 0) || !isFinite(c.interval)) return;
        var ph = (z.cyc[c.id] || 0) + dt;
        var n = Math.floor(ph / c.interval + 1e-9);
        if (n > 0) ph -= n * c.interval;
        if (ph < 0) ph = 0;
        z.cyc[c.id] = ph;
        if (n <= 0) return;
        gain += n * c.reward;
        z.cnt[c.id] = (z.cnt[c.id] || 0) + n;
        var ev = { zone: zid, type: c.id, count: n, reward: c.reward, base: c.base, cross: c.cross || 0, crossSeconds: c.crossSeconds || 0 };
        out.events.push(ev);
        if (c.seq) {
          var idx = (z.seq[c.seq.id] || 0) + n, k = Math.floor(idx / c.seq.every);
          z.seq[c.seq.id] = idx - k * c.seq.every;
          if (k > 0) {
            gain += k * c.seq.reward;
            z.cnt[c.seq.id] = (z.cnt[c.seq.id] || 0) + k;
            out.events.push({ zone: zid, type: c.seq.id, count: k, reward: c.seq.reward, base: c.seq.base, cross: c.seq.cross || 0, crossSeconds: c.seq.crossSeconds || 0 });
          }
        }
      });
      z.mana += gain; z.generated += gain; out.zones[zid] = gain;
    });
    out.events.forEach(function (e) { st.last[e.zone + '.' + e.type] = { reward: e.reward, base: e.base, cross: e.cross, crossSeconds: e.crossSeconds }; });
    if (!opts.legacy) {
      var casts = S.castRate(st.zones.forest.items.staff);
      st.mastery.sparks += casts * dt * (T(st, 'sky') > 0 ? C.talents.sky.masteryMult : 1);
    }
    st.run.playTime += dt;
    out.unlocked = S.checkUnlock(st);
    S.updateRecords(st);
    return out;
  };
  S.updateRecords = function (st) {
    var r = st.records || (st.records = { spellMax: 0, thawsMax: 0, allOrders: 0, cavernsSeen: 0 });
    r.spellMax = Math.max(r.spellMax || 0, st.zones.forest.items.spell);
    r.thawsMax = Math.max(r.thawsMax || 0, st.zones.castle.cnt.thaw || 0);
    if (C.orderOrder.every(function (id) { return st.order[id] >= 1; })) r.allOrders = 1;
    if (st.zones.caverns.unlocked) r.cavernsSeen = 1;
  };
  S.masteryLevel = function (st) {
    var th = C.zones.forest.mastery.thresholds, n = 0;
    for (var i = 0; i < th.length; i++) if (st.mastery.sparks >= th[i]) n = i + 1;
    return n;
  };

  S.unlockRule = function (zid) { return C.zones[zid].unlockForestProd || 0; };
  // Progreso 0..1 hacia la apertura de una zona (para la interfaz y la regla)
  S.unlockProgress = function (st, zid) {
    var u = C.zones[zid].unlock; if (!u) return 1;
    if (zid === 'castle' && T(st, 'forge') > 0) return S.isOpen(st, 'crypt') ? 1 : 0;
    var parts = [];
    if (u.forestProd) parts.push(S.zoneOwnProd(st, 'forest') / u.forestProd);
    if (u.zoneProd) parts.push(S.isOpen(st, u.zoneProd[0]) ? S.zoneOwnProd(st, u.zoneProd[0]) / u.zoneProd[1] : 0);
    if (u.resets) parts.push(st.prestige.resets >= u.resets ? 1 : 0);
    if (u.cnt) parts.push(S.isOpen(st, u.cnt[0]) ? (st.zones[u.cnt[0]].cnt[u.cnt[1]] || 0) / u.cnt[2] : 0);
    return Math.min.apply(null, parts.map(function (v) { return Math.min(1, v); }));
  };
  S.unlockText = function (st, zid) {
    var u = C.zones[zid].unlock;
    if (zid === 'castle' && T(st, 'forge') > 0) return 'se abrirá junto con la cripta (Brasas Perpetuas)';
    if (u.text) return 'se abrirá cuando ' + u.text;
    return 'se abrirá cuando el bosque produzca ' + u.forestProd + '/s de forma automática';
  };
  S.checkUnlock = function (st) {
    var res = [];
    ZONES.forEach(function (zid) {
      if (zid === 'forest') return;
      var z = st.zones[zid];
      if (!z.unlocked && S.unlockProgress(st, zid) >= 1) {
        z.unlocked = true;
        if (zid === 'crypt' && T(st, 'heirloom') > 0 && z.items.staff < 1) z.items.staff = 1;
        if (zid === 'jungle' && T(st, 'seed') > 0) z.seq.bloom = C.zones.jungle.prune.seqLength - 1;
        if (zid === 'castle' && T(st, 'forge') > 0 && z.items.lance < 10) z.items.lance = 10;
        if (st.reserve && st.reserve[zid] > 0) { z.mana += st.reserve[zid]; delete st.reserve[zid]; } // la reserva no cuenta como maná generado del ciclo
        res.push(zid);
      }
    });
    return res;
  };

  // ---------- Lanzamiento manual (mano libre) ----------
  S.manualValue = function (st, zid) {
    if (zid === 'forest') return C.zones.forest.manualBase + C.zones.forest.manualProdSeconds * S.forestProd(st);
    if (zid === 'jungle') return S.jungleManualBase(st, S.model(st, 'jungle').parts.prune);
    if (zid === 'castle') { var ZC = C.zones.castle, pc = S.model(st, 'castle').parts; return ZC.manualBase + ZC.manualHeatSeconds * pc.heat * ZC.heat.crackPay; }
    if (zid === 'caverns') { var ZV = C.zones.caverns, pv = S.model(st, 'caverns').parts; return ZV.manualBase + ZV.manualBeamSeconds * pv.beams; }
    var Z = C.zones.crypt, base = st.zones.crypt.items.staff > 0 ? S.model(st, 'crypt').parts.base : 0;
    return Z.manualBase + Z.manualPulseFraction * base;
  };
  S.forestManual = function (st) { return S.manualValue(st, 'forest'); };
  S.cryptManual = function (st) { return S.manualValue(st, 'crypt'); };
  // Devuelve { gain, bloom } (la marca manual de raíz también avanza la secuencia de floración)
  S.manual = function (st, zid) {
    if (!S.isOpen(st, zid)) return { gain: 0 };
    var z = st.zones[zid], g = S.manualValue(st, zid), bloom = 0;
    z.manual = (z.manual || 0) + 1;
    if (zid === 'jungle') {
      var m = S.model(st, 'jungle'), b = m.parts.bloom;
      var idx = (z.seq.bloom || 0) + 1;
      if (idx >= b.every) { idx = 0; bloom = b.reward; z.cnt.bloom = (z.cnt.bloom || 0) + 1; st.last['jungle.bloom'] = { reward: b.reward, base: b.base, cross: b.cross, crossSeconds: b.crossSeconds }; }
      z.seq.bloom = idx;
    }
    z.mana += g + bloom; z.generated += g + bloom;
    var unl = S.checkUnlock(st);
    return { gain: g, bloom: bloom, unlocked: unl };
  };
  S.manualCast = function (st, zid) { return S.manual(st, zid).gain; }; // compatibilidad

  // ---------- Descubrimiento de entradas ----------
  S.isRevealed = function (st, zid, id) {
    var r = S.itemDef(zid, id).reveal, z = st.zones[zid];
    if (!r) return true;
    if (zid === 'forest' && T(st, 'sky') > 0 && S.itemDef(zid, id).slot === 'spell') return true; // Cielo Recordado
    if (z.items[id] > 0) return true;
    if (r.item) return z.items[r.item[0]] >= r.item[1];
    if (r.generated) return z.generated >= r.generated;
    if (r.blooms) return (z.cnt.bloom || 0) >= r.blooms;
    if (r.order) return st.order[r.order[0]] >= r.order[1];
    if (r.cnt) return (z.cnt[r.cnt[0]] || 0) >= r.cnt[1];
    return true;
  };
  S.revealText = function (zid, id) {
    var r = S.itemDef(zid, id).reveal;
    if (!r) return '';
    if (r.item) return S.itemDef(zid, r.item[0]).names[0] + ' Nv ' + r.item[1];
    if (r.generated) return 'generar ' + r.generated + ' de ' + C.zones[zid].currency;
    if (r.blooms) return 'primera floración';
    if (r.order) return C.order[r.order[0]].name + ' Nv ' + r.order[1];
    if (r.cnt) return r.cnt[1] + ' ' + ({ thaw: 'deshielo', crack: 'grieta', eye: 'mirada del ojo' }[r.cnt[0]] || r.cnt[0]) + (r.cnt[1] > 1 ? 's' : '');
    return '';
  };

  // ---------- Compras ----------
  S.costFor = function (def, lvl, n) {
    var g = def.growth;
    if (g === 1) return def.baseCost * n;
    return def.baseCost * Math.pow(g, lvl) * (Math.pow(g, n) - 1) / (g - 1);
  };
  S.maxAffordable = function (def, lvl, mana) {
    var g = def.growth, b = def.baseCost * Math.pow(g, lvl);
    var n = g === 1 ? Math.floor(mana / def.baseCost) : Math.floor(Math.log(mana * (g - 1) / b + 1) / Math.log(g));
    if (!isFinite(n) || n < 0) n = 0;
    while (n > 0 && S.costFor(def, lvl, n) > mana + 1e-9) n--;
    while (S.costFor(def, lvl, n + 1) <= mana + 1e-9) n++;
    return n;
  };
  // Cuántos niveles se comprarían con la cantidad pedida ('1', '10', 'max').
  S.plan = function (st, zid, id, amount) {
    var z = st.zones[zid], def = S.itemDef(zid, id), lvl = z.items[id];
    var room = S.itemCap(zid, id) - lvl;
    if (room <= 0) return { n: 0, cost: 0, affordable: false, capped: true, nextCost: 0 };
    var n = amount === 'max' ? S.maxAffordable(def, lvl, z.mana) : (parseInt(amount, 10) || 1);
    n = Math.min(n, room);
    if (amount === 'max' && n < 1) n = 1;
    var cost = S.costFor(def, lvl, n);
    return { n: n, cost: cost, affordable: n >= 1 && cost <= z.mana + 1e-9, capped: false, nextCost: S.costFor(def, lvl, 1), revealed: S.isRevealed(st, zid, id) };
  };
  // Vista previa: producción de cada zona antes/después y bonos por evento cruzado.
  S.preview = function (st, zid, id, n) {
    var before = snapshot(st);
    var save = st.zones[zid].items[id];
    st.zones[zid].items[id] = save + n;
    var after = snapshot(st);
    st.zones[zid].items[id] = save;
    return { before: before, after: after };
  };
  function snapshot(st) {
    var cross = S.crossSources(st), o = { prod: {}, events: {} };
    ZONES.forEach(function (zid) {
      if (!S.isOpen(st, zid)) { o.prod[zid] = 0; return; }
      var m = S.model(st, zid, null, false, cross);
      o.prod[zid] = avgOf(m);
      m.cycles.forEach(function (c) { o.events[zid + '.' + c.id] = c.reward; if (c.seq) o.events[zid + '.' + c.seq.id] = c.seq.reward; });
    });
    return o;
  }
  S.prodWith = function (st, zid, id, n) { return S.preview(st, zid, id, n).after.prod[zid]; };

  S.buy = function (st, zid, id, amount) {
    if (!S.isOpen(st, zid) || !S.isRevealed(st, zid, id)) return null;
    var p = S.plan(st, zid, id, amount);
    if (!p.affordable || p.n < 1) return null;
    var z = st.zones[zid], pv = S.preview(st, zid, id, p.n);
    var lvlBefore = z.items[id];
    var vBefore = S.visualTier(zid, id, lvlBefore);
    z.mana = Math.max(0, z.mana - p.cost);
    z.items[id] += p.n;
    var crossed = [];
    for (var m = S.nextMilestone(lvlBefore); m <= z.items[id]; m = S.nextMilestone(m)) crossed.push(m);
    var visualCrossed = S.visualMilestones(zid, id).filter(function (v) { return v > lvlBefore && v <= z.items[id]; });
    return {
      zone: zid, id: id, n: p.n, cost: p.cost, lvlBefore: lvlBefore, lvlAfter: z.items[id],
      before: pv.before.prod[zid], after: pv.after.prod[zid], preview: pv,
      crossed: crossed, visualCrossed: visualCrossed,
      tierBefore: vBefore, tierAfter: S.visualTier(zid, id, z.items[id]),
      unlocked: S.checkUnlock(st)
    };
  };

  // ---------- Mejoras de la orden ----------
  S.orderCost = function (id, lvl) { var d = C.order[id]; return d.baseCost * Math.pow(d.growth, lvl); };
  S.orderAvailable = function (st, id) {
    var d = id ? C.order[id] : null;
    if (!d) return S.isOpen(st, 'crypt'); // compatibilidad v0.1
    for (var i = 0; i < d.needs.length; i++) if (!S.isOpen(st, d.needs[i])) return false;
    return true;
  };
  S.orderUseful = function (st, id) {
    var n = C.order[id].needsItem;
    return !n || st.zones[n[0]].items[n[1]] >= n[2];
  };
  S.buyOrder = function (st, id) {
    var d = C.order[id], lvl = st.order[id];
    if (!S.orderAvailable(st, id) || lvl >= d.maxLevel) return null;
    var cost = S.orderCost(id, lvl), z = st.zones[d.pays];
    if (z.mana + 1e-9 < cost) return null;
    var before = snapshot(st);
    z.mana = Math.max(0, z.mana - cost);
    st.order[id]++;
    S.updateRecords(st);
    return { id: id, cost: cost, pays: d.pays, lvl: st.order[id], before: before, after: snapshot(st) };
  };

  // ---------- Prestigio ----------
  S.runContrib = function (st) {
    var o = {}, total = 0;
    ZONES.forEach(function (zid) { o[zid] = st.zones[zid].generated * C.prestige.weights[zid]; total += o[zid]; });
    o.total = total;
    return o;
  };
  S.runTotal = function (st) { return S.runContrib(st).total; };
  // Ecos base: floor(3·√(total/meta)) hasta tailFrom (12); después +3 por cada duplicación del total.
  // El tramo inicial es idéntico al de v0.2, así una partida migrada no pierde un Eco que tenía cerca.
  S.echoesFor = function (total) {
    var P = C.prestige;
    if (total < P.goalTotal) return 0;
    var tailT = S.tailTotal();
    if (total < tailT) return Math.floor(P.baseEchoes * Math.pow(total / P.goalTotal, P.exponent) + 1e-9);
    return P.tailFrom + Math.floor(P.tailPerDoubling * Math.log(total / tailT) / Math.LN2 + 1e-9);
  };
  S.tailTotal = function () { var P = C.prestige; return P.goalTotal * Math.pow(P.tailFrom / P.baseEchoes, 1 / P.exponent); };
  S.totalForEchoes = function (e) {
    var P = C.prestige;
    if (e <= P.tailFrom) return P.goalTotal * Math.pow(e / P.baseEchoes, 1 / P.exponent);
    return S.tailTotal() * Math.pow(2, (e - P.tailFrom) / P.tailPerDoubling);
  };
  S.canPrestige = function (st) { return S.isOpen(st, 'crypt') && S.runTotal(st) >= C.prestige.goalTotal; };
  // Hazañas del ciclo (Ecos adicionales por explorar más a fondo)
  S.featDone = function (st, f) {
    var c = f.check;
    if (c.open) return S.isOpen(st, c.open);
    if (c.cnt) return S.isOpen(st, c.cnt[0]) && (st.zones[c.cnt[0]].cnt[c.cnt[1]] || 0) >= c.cnt[2];
    if (c.allOrders) return C.orderOrder.every(function (id) { return st.order[id] >= 1; });
    return false;
  };
  S.featProgress = function (st, f) {
    var c = f.check;
    if (c.cnt) return { have: S.isOpen(st, c.cnt[0]) ? (st.zones[c.cnt[0]].cnt[c.cnt[1]] || 0) : 0, need: c.cnt[2] };
    if (c.allOrders) return { have: C.orderOrder.filter(function (id) { return st.order[id] >= 1; }).length, need: C.orderOrder.length };
    return { have: S.isOpen(st, c.open) ? 1 : 0, need: 1 };
  };
  S.featsActive = function (st) { return st.run.playTime >= C.featMinCycle; };
  S.featEchoes = function (st) { if (!S.featsActive(st)) return 0; return C.feats.reduce(function (a, f) { return a + (S.featDone(st, f) ? f.echoes : 0); }, 0); };
  S.featEchoesPending = function (st) { return C.feats.reduce(function (a, f) { return a + (S.featDone(st, f) ? f.echoes : 0); }, 0); };
  // Resumen de Ecos: lo que daría refundar ahora y cuánto falta para el siguiente
  // Tope de madurez: los Ecos base de un ciclo no superan 1 por cada maturityMinutes (las partidas migradas no lo tienen en su ciclo en curso)
  S.echoCap = function (st) { return (st.flags && st.flags.legacyCycle) ? Infinity : Math.max(1, Math.floor(st.run.playTime / 60 / C.prestige.maturityMinutes)); };
  S.echoInfo = function (st) {
    var total = S.runTotal(st), raw = S.echoesFor(total), cap = S.echoCap(st), base = Math.min(raw, cap), feats = S.featEchoes(st);
    var next = raw + 1, nextAt = S.totalForEchoes(Math.max(1, next));
    return { total: total, base: base, raw: raw, cap: cap, feats: feats, gain: S.canPrestige(st) ? base + feats : 0, nextAt: nextAt, toNext: Math.max(0, nextAt - total) };
  };
  S.prestige = function (st, now) {
    if (!S.canPrestige(st)) return null;
    S.updateRecords(st);
    var info = S.echoInfo(st), gained = info.base + info.feats;
    var ns = S.newState(st, now);
    ns.prestige.echoes += gained;
    ns.prestige.earnedTotal += gained;
    ns.prestige.resets++;
    // Reliquias del Umbral: cada zona abierta deja en reserva N s de su producción
    var rl = T(st, 'relics');
    if (rl > 0) ZONES.forEach(function (zid) {
      if (!S.isOpen(st, zid)) return;
      var amount = rl * C.talents.relics.perLevel * S.zoneProd(st, zid);
      if (zid === 'forest') ns.zones.forest.mana += amount; // no cuenta para la siguiente refundación
      else ns.reserve[zid] = amount;
    });
    return { state: ns, gained: gained, base: info.base, feats: info.feats, opened: ZONES.filter(function (z) { return S.isOpen(st, z); }) };
  };
  S.talentReqMet = function (st, id) {
    var r = C.talents[id].req; if (!r) return true;
    if (r.record === 'resets') return st.prestige.resets >= r.value;
    return ((st.records || {})[r.record] || 0) >= r.value;
  };
  S.talentReqProgress = function (st, id) {
    var r = C.talents[id].req; if (!r) return null;
    var have = r.record === 'resets' ? st.prestige.resets : ((st.records || {})[r.record] || 0);
    return { have: Math.min(have, r.value), need: r.value, text: r.text };
  };
  S.talentCost = function (id, lvl) { var d = C.talents[id]; return Math.round(d.baseCost * Math.pow(d.growth, lvl)); };
  S.buyTalent = function (st, id) {
    var d = C.talents[id], lvl = st.prestige.talents[id];
    if (lvl >= d.maxLevel || !S.talentReqMet(st, id)) return null;
    var cost = S.talentCost(id, lvl);
    if (st.prestige.echoes < cost) return null;
    st.prestige.echoes -= cost;
    st.prestige.talents[id]++;
    // Los talentos de inicio se aplican también a la partida en curso si aún no tiene lo que dan.
    S.applyStartTalents(st);
    if (id === 'heirloom' && st.zones.crypt.unlocked && st.zones.crypt.items.staff < 1) st.zones.crypt.items.staff = 1;
    if (id === 'forge') S.checkUnlock(st);
    return { id: id, cost: cost, lvl: st.prestige.talents[id] };
  };
})(typeof window !== 'undefined' ? window : globalThis);
