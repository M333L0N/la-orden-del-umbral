/* La Orden del Umbral — guardado local, exportación/importación, validación y migraciones. */
(function (root) {
  'use strict';
  var A = root.Arcane = root.Arcane || {};
  var C = A.CONFIG, S = A.Sim;
  var Save = A.Save = {};
  var ZONES = C.zoneOrder;

  Save.storageOk = null; // null = sin probar, true/false tras el primer intento

  function storage() { try { return root.localStorage || null; } catch (e) { return null; } }
  function get(key) { var ls = storage(); if (!ls) return null; try { return ls.getItem(key); } catch (e) { return null; } }
  function set(key, val) { var ls = storage(); if (!ls) return false; try { ls.setItem(key, val); return ls.getItem(key) === val; } catch (e) { return false; } }

  Save.write = function (st) {
    var ok = set(C.saveKey, JSON.stringify(st));
    Save.storageOk = ok;
    return ok;
  };
  Save.readRaw = function () {
    var ls = storage();
    if (!ls) { Save.storageOk = false; return null; }
    try { return ls.getItem(C.saveKey); } catch (e) { Save.storageOk = false; return null; }
  };
  Save.clear = function () { var ls = storage(); try { if (ls) ls.removeItem(C.saveKey); } catch (e) { /* nada */ } };

  // ---------- Copia de seguridad del guardado original antes de migrar ----------
  Save.backupKey = function (version) { return C.saveKey + C.backupSuffix + version; };
  // Guarda el texto original tal cual. Nunca sobrescribe una copia previa. Devuelve true si la copia existe.
  Save.backupOriginal = function (raw, version) {
    var key = Save.backupKey(version), prev = get(key);
    if (prev !== null) return true;
    return set(key, raw);
  };
  Save.readBackup = function (version) { return get(Save.backupKey(version)); };

  // ---------- Migraciones (por IDs estables) ----------
  Save.migrations = {
    // v0.1 → v0.2: tercera zona (jungla), 8 entradas por mago, ciclos genéricos, maestría, vista.
    1: function (d) {
      var o = JSON.parse(JSON.stringify(d));
      var f = o.zones.forest || {}, c = o.zones.crypt || {};
      f.items = f.items || {};
      ['hood', 'orbit', 'prism', 'constellation'].forEach(function (k) { if (f.items[k] === undefined) f.items[k] = 0; });
      f.cyc = {}; f.cnt = {}; f.seq = {}; f.manual = f.casts || 0; delete f.casts;
      c.items = c.items || {};
      ['vest', 'mitre', 'medallion', 'incense', 'litany'].forEach(function (k) { if (c.items[k] === undefined) c.items[k] = 0; });
      c.cyc = { pulse: c.phase || 0 };          // conserva la fase del pulso
      c.cnt = { pulse: c.pulses || 0 }; c.seq = {}; c.manual = c.seals || 0;
      delete c.phase; delete c.pulses; delete c.seals;
      o.zones.jungle = S.newZone('jungle');      // contenido nuevo: empieza vacío (sin floraciones pasadas)
      o.order = o.order || {};
      if (o.order.pollen === undefined) o.order.pollen = 0;
      if (o.order.rootstar === undefined) o.order.rootstar = 0;
      o.prestige = o.prestige || {};
      o.prestige.talents = o.prestige.talents || {};
      if (o.prestige.talents.seed === undefined) o.prestige.talents.seed = 0;
      if (o.prestige.talents.sky === undefined) o.prestige.talents.sky = 0;
      o.mastery = { sparks: 0 };
      o.settings = o.settings || {};
      o.settings.view = 'forest';
      o.last = {};
      if (o.lastPulse) o.last['crypt.pulse'] = { reward: o.lastPulse.total, base: o.lastPulse.base, cross: o.lastPulse.confluence, crossSeconds: o.lastPulse.seconds };
      delete o.lastPulse;
      o.flags = { migratedFrom: 1, legacyOffline: true };
      o.version = 2;
      return o;
    }
  };

  Save.migrate = function (d) {
    if (typeof d.version !== 'number') d.version = 1; // los guardados v0.1 sin versión
    var from = d.version;
    while (d.version < C.saveVersion) {
      var m = Save.migrations[d.version];
      if (!m) throw new Error('No hay migración desde la versión ' + d.version);
      d = m(d);
    }
    return { data: d, from: from };
  };

  // ---------- Validación ----------
  function num(v, path, errs, opts) {
    opts = opts || {};
    if (v === undefined && opts.def !== undefined) return opts.def;
    if (typeof v !== 'number' || !isFinite(v)) { errs.push(path + ' no es un número válido'); return 0; }
    if (v < 0) { errs.push(path + ' es negativo'); return 0; }
    if (opts.int && Math.floor(v) !== v) errs.push(path + ' debe ser entero');
    return v;
  }
  function numMap(src, path, errs) {
    var o = {};
    if (src === undefined) return o;
    if (!src || typeof src !== 'object' || Array.isArray(src)) { errs.push(path + ' no es un objeto'); return o; }
    Object.keys(src).forEach(function (k) { o[k] = num(src[k], path + '.' + k, errs); });
    return o;
  }

  // Devuelve { ok, state, errors, migratedFrom }. Nunca modifica la partida actual.
  Save.parse = function (text) {
    var d;
    try { d = JSON.parse(text); } catch (e) { return { ok: false, errors: ['El texto no es JSON válido.'] }; }
    if (!d || typeof d !== 'object' || Array.isArray(d)) return { ok: false, errors: ['El guardado no es un objeto.'] };
    if (d.game && d.data) d = d.data; // envoltorio de exportación
    if (typeof d.version === 'number' && d.version > C.saveVersion) return { ok: false, errors: ['El guardado es de una versión más nueva (' + d.version + ').'] };
    if (!d.zones || typeof d.zones !== 'object' || !d.zones.forest || !d.zones.crypt) return { ok: false, errors: ['Faltan las zonas.'] };
    var mig;
    try { mig = Save.migrate(d); } catch (e) { return { ok: false, errors: ['No se pudo migrar: ' + e.message] }; }
    d = mig.data;
    var errs = [], st = S.newState(null, Date.now());
    try {
      ZONES.forEach(function (zid) {
        var src = d.zones[zid], dst = st.zones[zid];
        if (!src || typeof src !== 'object') { errs.push('falta la zona ' + zid); return; }
        dst.mana = num(src.mana, zid + '.mana', errs);
        dst.generated = num(src.generated, zid + '.generated', errs);
        if (!src.items || typeof src.items !== 'object') { errs.push(zid + '.items falta'); return; }
        C.zones[zid].itemOrder.forEach(function (id) {
          var v = num(src.items[id], zid + '.' + id, errs, { int: true, def: 0 });
          if (v > S.itemCap(zid, id)) errs.push(zid + '.' + id + ' supera su máximo');
          dst.items[id] = v;
        });
        dst.cyc = numMap(src.cyc, zid + '.cyc', errs);
        dst.cnt = numMap(src.cnt, zid + '.cnt', errs);
        dst.seq = numMap(src.seq, zid + '.seq', errs);
        dst.manual = num(src.manual, zid + '.manual', errs, { def: 0 });
        if (zid !== 'forest') { dst.unlocked = !!src.unlocked; dst.introSeen = !!src.introSeen; }
      });
      if (d.order) C.orderOrder.forEach(function (id) {
        var v = num(d.order[id], 'order.' + id, errs, { int: true, def: 0 });
        if (v > C.order[id].maxLevel) errs.push('order.' + id + ' supera el máximo');
        st.order[id] = v;
      });
      if (d.prestige) {
        st.prestige.echoes = num(d.prestige.echoes, 'prestige.echoes', errs, { def: 0 });
        st.prestige.earnedTotal = num(d.prestige.earnedTotal, 'prestige.earnedTotal', errs, { def: 0 });
        st.prestige.resets = num(d.prestige.resets, 'prestige.resets', errs, { int: true, def: 0 });
        var t = d.prestige.talents || {};
        C.talentOrder.forEach(function (id) {
          var v = num(t[id], 'talento ' + id, errs, { int: true, def: 0 });
          if (v > C.talents[id].maxLevel) errs.push('talento ' + id + ' supera el máximo');
          st.prestige.talents[id] = v;
        });
      }
      st.mastery.sparks = num(d.mastery && d.mastery.sparks, 'mastery.sparks', errs, { def: 0 });
      if (d.run) {
        st.run.playTime = num(d.run.playTime, 'run.playTime', errs, { def: 0 });
        st.run.number = num(d.run.number, 'run.number', errs, { int: true, def: 1 }) || 1;
      }
      if (d.settings) {
        st.settings.reducedMotion = typeof d.settings.reducedMotion === 'boolean' ? d.settings.reducedMotion : null;
        st.settings.buyAmount = ['1', '10', 'max'].indexOf(d.settings.buyAmount) >= 0 ? d.settings.buyAmount : '1';
        st.settings.view = (d.settings.view === 'room' || ZONES.indexOf(d.settings.view) >= 0) ? d.settings.view : 'forest';
      }
      if (d.last && typeof d.last === 'object') st.last = d.last;
      st.flags = (d.flags && typeof d.flags === 'object') ? d.flags : {};
      st.created = typeof d.created === 'number' ? d.created : Date.now();
      st.lastTick = num(d.lastTick, 'lastTick', errs);
    } catch (e) { errs.push(e.message); }
    if (errs.length) return { ok: false, errors: errs };
    if (mig.from < C.saveVersion) S.checkUnlock(st); // habilita la jungla si la partida ya cumple su condición
    return { ok: true, state: st, migratedFrom: mig.from < C.saveVersion ? mig.from : null };
  };

  Save.exportText = function (st) {
    return JSON.stringify({ game: 'La Orden del Umbral', exported: new Date().toISOString(), data: st }, null, 1);
  };

  // Progreso offline: acredita hasta 8 h desde lastTick. Un guardado recién migrado acredita su
  // tiempo pendiente sin contenido nuevo (modo "legacy"). Devuelve el informe.
  Save.applyOffline = function (st, now) {
    var raw = (now - st.lastTick) / 1000;
    var elapsed = Math.max(0, Math.min(raw, C.offlineCapSeconds));
    var legacy = !!(st.flags && st.flags.legacyOffline);
    var before = {};
    ZONES.forEach(function (z) { before[z] = st.zones[z].cnt ? JSON.parse(JSON.stringify(st.zones[z].cnt)) : {}; });
    var rep = S.advance(st, elapsed, { legacy: legacy });
    if (st.flags) delete st.flags.legacyOffline;
    rep.rawSeconds = Math.max(0, raw);
    rep.capped = raw > C.offlineCapSeconds;
    rep.legacy = legacy;
    rep.counts = {};
    ZONES.forEach(function (z) {
      var c = {}, a = st.zones[z].cnt || {};
      Object.keys(a).forEach(function (k) { var d = a[k] - (before[z][k] || 0); if (d > 0) c[k] = d; });
      rep.counts[z] = c;
    });
    rep.crossTotals = {};
    rep.events.forEach(function (e) { if (e.cross) rep.crossTotals[e.zone + '.' + e.type] = (rep.crossTotals[e.zone + '.' + e.type] || 0) + e.cross * e.count; });
    st.lastTick = now;
    return rep;
  };
})(typeof window !== 'undefined' ? window : globalThis);
