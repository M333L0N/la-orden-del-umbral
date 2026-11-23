/* La Orden del Umbral — controlador: arranque y migración, bucle, vistas, acciones, teclado, autoguardado. */
(function (root) {
  'use strict';
  var A = root.Arcane = root.Arcane || {};
  var C = A.CONFIG, S = A.Sim, Save = A.Save, UI = A.UI, Scene = A.Scene;
  var ZONES = C.zoneOrder;
  var FOCUS = { forest: 'staff', jungle: 'grimoire', crypt: 'staff', castle: 'lance', caverns: 'mirror' };
  var INTRO = {
    jungle: ['La herborista despierta', 'Marca raíces a mano hasta conseguir su grimorio', 'En la jungla, una herborista de poda corta las raíces de la Reina Injerto. Su moneda es la <b>savia de la jungla</b>.'],
    crypt: ['La maga despierta', 'Traza sellos a mano hasta conseguir su propio báculo', 'En la cripta, una maga despierta frente al Rey sin Réquiem. Su moneda es el <b>maná de la cripta</b>.'],
    castle: ['El lancero despierta', 'Lanza ascuas a mano hasta conseguir su lanza', 'En el castillo, un lancero de brasas desafía a la Regente de Escarcha. El calor abre grietas en su coraza; al completar la red, deshielo. Su moneda es la <b>brasa del castillo</b>.'],
    caverns: ['La maga glaciar despierta', 'Sopla frío a mano hasta conseguir su espejo de obsidiana', 'En las cavernas, una maga glaciar concentra frío contra el Corazón de la Caldera. Cada 30 s su ojo se abre. Su moneda es la <b>escarcha de las cavernas</b>.']
  };

  var G = A.Game = {
    state: null, zone: 'forest', view: 'forest', roomTab: 'portals', panel: 'items', reduced: false,
    lastSaved: 0, anomaly: null, nextAnomalyAt: 0, noOverwrite: false, frames: 0, refounding: false, cameFromZone: false,
    now: function () { return Date.now(); }
  };

  // Modo de prueba automática: usa otra clave de guardado para no tocar la partida real.
  var AUTOTEST = /autotest|escena=|tira=|jefes|insignias/.test(location.hash);
  if (AUTOTEST) C.saveKey = 'ordenUmbral.autotest';

  // ---------- Arranque (incluye migraciones) ----------
  G.boot = function () {
    var now = G.now(), raw = Save.readRaw(), rep = null;
    G.state = null; G.noOverwrite = false;
    UI.notice(null);
    if (raw) {
      var r = Save.parse(raw);
      if (r.ok) {
        if (r.migratedFrom) {
          // Antes de sobrescribir un guardado antiguo, se conserva el original tal cual.
          if (!Save.backupOriginal(raw, r.migratedFrom)) {
            G.noOverwrite = true;
            UI.notice('No se pudo guardar una copia de tu partida v0.' + r.migratedFrom + ' en este navegador, así que <b>no se sobrescribirá</b>. Puedes jugar, pero exporta (Partida → Exportar JSON) para conservar el progreso.');
          } else UI.log('Tu partida v0.' + r.migratedFrom + ' se actualizó. La copia original está en Partida → «Exportar copia v0.' + r.migratedFrom + '».');
        }
        G.state = r.state;
        rep = Save.applyOffline(G.state, now);
      } else {
        G.noOverwrite = true; G.badRaw = raw;
        G.state = S.newState(null, now);
        setTimeout(function () {
          UI.modal('<h2>No se pudo cargar tu partida</h2><p>' + r.errors.slice(0, 3).join('<br>') + '</p><p>El guardado original <b>sigue intacto</b>. Puedes exportarlo o empezar una partida nueva (que lo reemplazará).</p>',
            [{ label: 'Exportar original', keep: true, fn: function () { UI.exportRaw(raw); } },
             { label: 'Empezar partida nueva', cls: 'danger', fn: function () { try { localStorage.setItem(C.saveKey + '.danado', raw); } catch (e) { /* nada */ } G.noOverwrite = false; G.wipe(); } }]);
        }, 50);
      }
    }
    if (!G.state) G.state = S.newState(null, now);
    var v = G.state.settings.view;
    G.view = (v === 'room' || (ZONES.indexOf(v) >= 0 && S.isOpen(G.state, v))) ? v : 'forest';
    G.roomTab = G.state.settings.roomTab === 'table' ? 'table' : 'portals';
    G.zone = G.view === 'room' ? 'forest' : G.view;
    G.saveNow();
    if (Save.storageOk === false && !G.noOverwrite) UI.notice('Este navegador no permite guardar al abrir el juego como archivo local. Puedes jugar igual: exporta la partida desde «Partida» para conservarla.');
    return rep;
  };

  G.saveNow = function (manual) {
    if (G.noOverwrite) { if (manual) UI.log('Guardado en pausa para proteger tu partida original: usa «Exportar JSON».'); return false; }
    var ok = Save.write(G.state);
    if (ok) G.lastSaved = Date.now();
    if (manual) UI.log(ok ? 'Partida guardada.' : 'No se pudo guardar localmente: usa «Exportar JSON».');
    return ok;
  };

  // ---------- Tiempo y economía ----------
  G.tick = function () {
    var st = G.state, now = G.now(), dt = (now - st.lastTick) / 1000;
    if (dt <= 0) { if (dt < -5) st.lastTick = now; return; }
    var rep;
    if (dt > 120) { // el equipo o la pestaña estuvieron dormidos: se trata como offline (mismo cálculo)
      rep = Save.applyOffline(st, now);
      if (rep.rawSeconds >= C.offlineReportMinSeconds && !UI.modalOpen()) UI.offlineReport(rep);
    } else { rep = S.advance(st, dt); st.lastTick = now; }
    // Los eventos se entregan a la vista de su zona (aunque no esté a la vista): portal y detalle coinciden.
    if (dt <= 120) rep.events.forEach(function (e) { Scene.event(e); });
    (rep.unlocked || []).forEach(onUnlock);
  };

  function onUnlock(z) {
    var name = C.zones[z].name;
    UI.log('<b>' + name + ' se ha abierto.</b> Entra desde la Sala de la Orden, su saldo arriba o la tecla Z.');
    UI.banner('<strong>¡Un nuevo portal se abre!</strong><br>' + name, 5000);
    UI.structKey = {};
    G.saveNow();
  }

  // ---------- Vistas ----------
  G.openRoom = function (tab) {
    if (G.view !== 'room') G.cameFromZone = true;
    G.view = 'room'; G.roomTab = tab === 'table' ? 'table' : 'portals';
    G.state.settings.view = 'room'; G.state.settings.roomTab = G.roomTab;
    Scene.setMainVisible(false);
    UI.clearBanners();
    UI.applyView(); fitCanvas(); UI.update(true); G.saveNow();
  };
  // Lleva a una sección concreta de la Mesa Redonda, con camino de vuelta a la zona
  G.openTable = function (section) {
    G.openRoom('table');
    var sec = section && document.getElementById(section);
    if (sec && sec.scrollIntoView) sec.scrollIntoView({ block: 'start' });
    if (sec) { var f = sec.querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll: true }); }
  };
  G.openZone = function (z) {
    if (!S.isOpen(G.state, z)) { UI.log(C.zones[z].name + ' sigue sellada: ' + S.unlockText(G.state, z) + '.'); return; }
    var changed = G.zone !== z || G.view === 'room';
    G.zone = z; G.view = z; G.state.settings.view = z; G.cameFromZone = false;
    Scene.setZone(z); Scene.setMainVisible(true);
    if (G.anomaly && G.anomaly.zone !== z) clearAnomaly();
    if (changed) UI.clearBanners();
    UI.structKey = {};
    UI.applyView();
    fitCanvas(); // el lienzo pudo ajustarse mientras estaba oculto (arranque en la Sala)
    var zz = G.state.zones[z];
    if (z !== 'forest' && !zz.introSeen) {
      zz.introSeen = true;
      Scene.awaken(z);
      var t = INTRO[z]; UI.banner('<strong>' + t[0] + '</strong><br>' + t[1], 5000); UI.log(t[2]);
    }
    UI.update(true); G.saveNow();
  };
  G.switchZone = G.openZone; // compatibilidad
  G.nextZone = function () {
    var open = ZONES.filter(function (z) { return S.isOpen(G.state, z); });
    var i = G.view === 'room' ? -1 : open.indexOf(G.zone);
    G.openZone(open[(i + 1) % open.length]);
  };

  // ---------- Acciones ----------
  G.cast = function () {
    if (G.view === 'room') return;
    var z = G.zone; if (!S.isOpen(G.state, z)) return;
    var seqBefore = G.state.zones[z].seq ? (G.state.zones[z].seq.bloom || 0) : 0;
    var r = S.manual(G.state, z);
    r.seqBefore = seqBefore;
    Scene.manual(z, r);
    (r.unlocked || []).forEach(onUnlock);
    return r;
  };

  G.buy = function (zone, id) {
    var st = G.state, r = S.buy(st, zone, id, st.settings.buyAmount);
    if (!r) return null;
    var Z = C.zones[zone], name = S.itemName(zone, id, r.lvlBefore);
    var msg = '<b>' + name + '</b> +' + r.n + ' (Nv ' + r.lvlBefore + '→' + r.lvlAfter + ') · pagaste ' + A.fmt(r.cost) + ' de ' + Z.currency + '. ' +
      Z.short + ': ' + A.fmtRate(r.before) + ' → <b>' + A.fmtRate(r.after) + '</b>' + (r.before > 0 ? ' (+' + A.fmtPct((r.after - r.before) / r.before) + ')' : '');
    var pb = r.preview.before, pa = r.preview.after;
    [['crypt.pulse', 'pulso de la cripta'], ['jungle.bloom', 'floración'], ['forest.orbit', 'órbita'], ['castle.thaw', 'deshielo']].forEach(function (k) {
      if (k[0].split('.')[0] === zone) return;
      var d = (pa.events[k[0]] || 0) - (pb.events[k[0]] || 0);
      if (d > 1e-9) msg += ' · ' + k[1] + ' +' + A.fmt(d);
    });
    UI.log(msg);
    if (r.visualCrossed.length) {
      var newName = S.itemName(zone, id, r.lvlAfter);
      if (G.zone === zone) Scene.evolve(zone, id, r.tierBefore, r.tierAfter);
      var final = !S.nextVisual(zone, id, r.lvlAfter);
      UI.banner('<strong>¡Evolución!</strong> ' + name + ' → <strong>' + newName + '</strong><br>Nv ' + r.visualCrossed.join(', ') + (final ? ' · forma final' : ''), 4000);
      UI.log('Evolución visual: <b>' + newName + '</b>' + (r.crossed.length ? ' · salto económico ×' + r.crossed.reduce(function (m, lv) { return m * S.milestoneJump(lv); }, 1) : '') + '.');
      UI.structKey = {};
    }
    (r.unlocked || []).forEach(onUnlock);
    G.saveNow(); UI.update();
    return r;
  };
  G.buyIndex = function (n) {
    var ids = C.zones[G.zone].itemOrder, id = ids[n - 1];
    if (!id || !S.isRevealed(G.state, G.zone, id)) return null;
    return G.buy(G.zone, id);
  };

  G.buyOrder = function (id) {
    var r = S.buyOrder(G.state, id); if (!r) return null;
    var d = C.order[id], msg = '<b>' + d.name + ' Nv ' + r.lvl + '</b> · pagaste ' + A.fmt(r.cost) + ' de ' + C.zones[d.pays].currency + '. ';
    if (d.to) {
      var ev = { confluence: 'crypt.pulse', pollen: 'jungle.bloom', rootstar: 'forest.orbit', requiem: 'castle.thaw' }[id];
      msg += 'Cada evento recibe ' + d.seconds[r.lvl] + ' s de ' + C.zones[d.from].short.toLowerCase() + ': ' + A.fmt(r.before.events[ev] || 0) + ' → <b>' + A.fmt(r.after.events[ev] || 0) + '</b>; ' + C.zones[d.to].short + ' ' + A.fmtRate(r.before.prod[d.to]) + ' → <b>' + A.fmtRate(r.after.prod[d.to]) + '</b>. La zona de origen conserva su maná.';
    } else msg += 'Bosque ' + A.fmtRate(r.before.prod.forest) + ' → <b>' + A.fmtRate(r.after.prod.forest) + '</b>; cripta ' + A.fmtRate(r.before.prod.crypt) + ' → <b>' + A.fmtRate(r.after.prod.crypt) + '</b>.';
    UI.log(msg); G.saveNow(); UI.update(true);
    return r;
  };

  // Refundar: el estado nuevo se calcula, se aplica y se GUARDA antes de la animación.
  // Omitirla, hacer doble clic o recargar a mitad no puede volver a conceder Ecos.
  G.prestige = function () {
    if (G.refounding) return null;
    var old = G.state, r = S.prestige(old, G.now()); if (!r) return null;
    G.refounding = true;
    UI.clearBanners();
    G.state = r.state;
    G.zone = 'forest'; G.view = 'room'; G.roomTab = 'table'; G.state.settings.view = 'room'; G.state.settings.roomTab = 'table';
    clearAnomaly();
    G.saveNow();
    UI.log('<b>La Orden renace.</b> Ganaste ' + r.gained + ' Ecos' + (r.feats ? ' (' + r.feats + ' por hazañas)' : '') + '. Elige un talento permanente.');
    G.afterRefound = function () {
      G.refounding = false;
      Scene.setZone('forest'); Scene.setMainVisible(false);
      UI.structKey = {}; UI.applyView(); UI.update(true);
      G.openTable('mesa-talentos');
      UI.banner('<strong>La Orden renace</strong><br>+' + r.gained + ' Ecos · elige un talento', 5000);
    };
    UI.playRefound(old, r);
    return r;
  };
  G.buyTalent = function (id) {
    var r = S.buyTalent(G.state, id); if (!r) return null;
    UI.log('Talento aprendido: <b>' + C.talents[id].name + '</b> (Nv ' + r.lvl + '). ' + C.talents[id].nextRun);
    G.saveNow(); UI.update(true);
    return r;
  };

  G.setAmount = function (a) { G.state.settings.buyAmount = a; UI.update(true); };
  G.cycleAmount = function () { var o = ['1', '10', 'max'], i = o.indexOf(G.state.settings.buyAmount); G.setAmount(o[(i + 1) % 3]); };
  G.setReduced = function (v) { G.reduced = !!v; G.state.settings.reducedMotion = G.reduced; Scene.setReduced(G.reduced); document.body.classList.toggle('reduced', G.reduced); G.saveNow(); };
  G.replaceState = function (s) {
    s.lastTick = G.now();
    if (s.flags) delete s.flags.legacyOffline; // importar nunca acredita tiempo offline
    G.state = s; G.noOverwrite = false; UI.notice(null);
    G.zone = 'forest'; G.view = s.settings.view === 'room' ? 'room' : 'forest'; G.roomTab = s.settings.roomTab || 'portals';
    Scene.setZone('forest'); Scene.setMainVisible(G.view !== 'room');
    applySettings(); G.saveNow(); UI.structKey = {}; UI.applyView(); UI.update(true);
    UI.log('Partida importada.');
  };
  G.wipe = function () {
    Save.clear(); UI.clearBanners();
    G.noOverwrite = false; UI.notice(null);
    G.state = S.newState(null, G.now());
    G.zone = 'forest'; G.view = 'forest'; G.roomTab = 'portals'; Scene.setZone('forest'); Scene.setMainVisible(true);
    clearAnomaly();
    applySettings(); G.saveNow(); UI.structKey = {}; UI.applyView(); UI.showPanel('items');
    UI.log('Partida nueva desde cero.');
  };

  // ---------- Anomalías ----------
  function scheduleAnomaly(now) { var a = C.anomaly; G.nextAnomalyAt = now + (a.minDelay + Math.random() * (a.maxDelay - a.minDelay)) * 1000; }
  function clearAnomaly() { G.anomaly = null; Scene.setAnomaly(null); var b = document.getElementById('anomaly-btn'); if (b) b.hidden = true; }
  function updateAnomaly(now, ignoreHidden) {
    if (G.anomaly && now > G.anomaly.expires) { clearAnomaly(); scheduleAnomaly(now); }
    if (!G.anomaly && G.view !== 'room' && G.state.zones.forest.items.staff > 0 && now >= G.nextAnomalyAt && (ignoreHidden || !document.hidden)) {
      var z = G.zone;
      G.anomaly = { zone: z, x: 90 + Math.random() * 40, y: 20 + Math.random() * 30, expires: now + C.anomaly.lifetime * 1000 };
      Scene.setAnomaly(G.anomaly);
      document.getElementById('anomaly-btn').hidden = false;
    }
  }
  G.updateAnomaly = updateAnomaly;
  G.dispelAnomaly = function () {
    var a = G.anomaly; if (!a) return 0;
    var z = a.zone, st = G.state, amount = Math.max(C.anomaly.minReward, C.anomaly.rewardSeconds * S.zoneProd(st, z));
    st.zones[z].mana += amount; st.zones[z].generated += amount;
    Scene.anomalyBurst(a.x, a.y, amount);
    UI.log('Anomalía disipada: +' + A.fmt(amount) + ' de ' + C.zones[z].currency + ' (' + C.anomaly.rewardSeconds + ' s de producción).');
    clearAnomaly(); scheduleAnomaly(G.now());
    (S.checkUnlock(st) || []).forEach(onUnlock);
    return amount;
  };

  // ---------- Teclado ----------
  function onKey(e) {
    if (!document.getElementById('refound').hidden) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); UI.endRefound(); } return; }
    if (UI.modalOpen()) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'textarea' || tag === 'input') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === ' ' || (k === 'Enter' && e.target.id === 'scene')) {
      if (tag === 'button' && k === ' ') return;
      e.preventDefault(); G.cast();
    } else if (/^[1-8]$/.test(k)) { if (G.view !== 'room') G.buyIndex(+k); }
    else if (k === 'c' || k === 'C') G.cycleAmount();
    else if (k === 'z' || k === 'Z') G.nextZone();
    else if (k === 's' || k === 'S') G.openRoom('portals');
    else if (k === 'm' || k === 'M') G.openRoom('table');
    else if (k === 'a' || k === 'A') G.dispelAnomaly();
  }

  // Escala entera del lienzo principal según el ancho Y el alto disponibles
  function fitCanvas() {
    var wrap = document.getElementById('scene-wrap'), cv = document.getElementById('scene');
    var w = wrap.clientWidth, topbar = document.querySelector('.topbar').offsetHeight;
    var hAvail = root.innerHeight - topbar - 190;
    var s = Math.min(Math.floor(w / Scene.W), Math.max(2, Math.floor(hAvail / Scene.H)));
    if (s >= 2) { cv.style.width = (Scene.W * s) + 'px'; cv.style.height = (Scene.H * s) + 'px'; }
    else { cv.style.width = '100%'; cv.style.height = 'auto'; }
    var ov = document.getElementById('overlay');
    ov.style.left = cv.offsetLeft + 'px'; ov.style.width = cv.offsetWidth + 'px'; ov.style.right = 'auto';
    UI.fitPortals(); UI.fitTable();
  }
  G.fitCanvas = fitCanvas;
  function applySettings() {
    var pref = G.state.settings.reducedMotion;
    if (pref === null) pref = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    G.reduced = pref; Scene.setReduced(pref); document.body.classList.toggle('reduced', pref);
  }

  // ---------- Inicio ----------
  function start() {
    Scene.init(document.getElementById('scene'), document.getElementById('overlay'));
    UI.init(G);
    var rep = G.boot();
    applySettings();
    Scene.setZone(G.zone); Scene.setMainVisible(G.view !== 'room');
    UI.applyView();
    fitCanvas();
    root.addEventListener('resize', function () { fitCanvas(); UI.structKey.room = ''; });
    document.addEventListener('keydown', onKey);
    document.getElementById('scene').addEventListener('click', function (e) {
      var p = Scene.toScene(e.clientX, e.clientY);
      if (G.anomaly && Scene.anomalyHit(p.x, p.y)) { G.dispelAnomaly(); return; }
      G.cast();
    });
    scheduleAnomaly(G.now());
    UI.update(true);
    if (rep && rep.rawSeconds >= C.offlineReportMinSeconds) UI.offlineReport(rep);
    if (G.state.zones.forest.manual === 0 && G.state.prestige.resets === 0 && G.state.zones.forest.items.staff === 0) UI.log('Un aprendiz de túnica gastada se detiene ante un cristal en el Bosque del Velo. Tras él aguarda el Ciervo Hueco. Lanza Chispas con la mano libre (Espacio o clic en la escena).');
    else UI.log('Partida cargada.');

    var uiAcc = 0, saveAcc = 0, last = Date.now();
    function frame() {
      G.frames++;
      G.tick();
      var wall = Date.now(), dtm = Math.max(0, Math.min(1000, wall - last)); last = wall;
      uiAcc += dtm; saveAcc += dtm;
      updateAnomaly(G.now());
      if (G.view === 'room') { if (G.roomTab === 'table') Scene.drawTable(document.getElementById('table-cv'), G.state, wall); else Scene.renderPortals(G.state, wall); }
      else Scene.render(G.state, wall);
      if (uiAcc > 200) { uiAcc = 0; UI.update(); }
      if (saveAcc > C.autosaveSeconds * 1000) { saveAcc = 0; G.saveNow(); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    setInterval(function () { if (document.hidden) G.tick(); }, 1000);
    setInterval(function () { if (document.hidden) G.saveNow(); }, C.autosaveSeconds * 1000);
    document.addEventListener('visibilitychange', function () { G.tick(); G.saveNow(); });
    root.addEventListener('pagehide', function () { G.tick(); G.saveNow(); });
    root.addEventListener('beforeunload', function () { G.tick(); G.saveNow(); });

    if (AUTOTEST) {
      var s = document.createElement('script');
      s.src = /escena=|tira=|jefes|insignias/.test(location.hash) ? 'tests/scenarios.js' : 'tests/autotest.js';
      document.body.appendChild(s);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window);
