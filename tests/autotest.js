/* Prueba automática dentro del navegador real (index.html#autotest). Pulsa botones y teclas reales.
 * Usa la clave 'ordenUmbral.autotest' (no toca la partida real). Incluye recargas reales de la página.
 * Resultado: <pre id="autotest-results"> y document.title = "AUTOTEST OK|FALLO".
 */
(function () {
  'use strict';
  var A = window.Arcane, G = A.Game, S = A.Sim, C = A.CONFIG, Sc = A.Scene;
  var STEP_KEY = 'ordenUmbral.autotest.step';
  var out = [], fails = 0;
  function ok(c, name, extra) { out.push((c ? '✓ ' : '✗ ') + name + (c || extra === undefined ? '' : '  → ' + JSON.stringify(extra))); if (!c) fails++; }
  function $(s) { return document.querySelector(s); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function click(sel) { var e = typeof sel === 'string' ? $(sel) : sel; if (!e) throw new Error('No existe ' + sel); e.click(); }
  function key(k) { document.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); }
  function text(sel) { var e = $(sel); return e ? e.textContent : ''; }
  function upd() { A.UI.update(true); }
  var offset = 0;
  G.now = function () { return Date.now() + offset; };
  function skip(sec) { offset += sec * 1000; G.tick(); A.UI.update(true); }
  function closeModal() { var d = $('#modal'); if (d.open) d.close(); }
  function save(step, extra) { sessionStorage.setItem(STEP_KEY, JSON.stringify(Object.assign({ step: step, out: out, fails: fails }, extra || {}))); }
  function finish() {
    var pre = document.createElement('pre'); pre.id = 'autotest-results';
    pre.textContent = out.join('\n') + '\n' + (fails ? 'FALLOS: ' + fails : 'TODO OK');
    document.body.appendChild(pre);
    document.title = fails ? 'AUTOTEST FALLO' : 'AUTOTEST OK';
    try { sessionStorage.removeItem(STEP_KEY); localStorage.removeItem(C.saveKey); localStorage.removeItem(A.Save.backupKey(1)); } catch (e) { /* nada */ }
  }
  function rowOrder() { return A.UI.sortedIds(); }

  // ---------------- Paso 1: recorrido de una partida nueva ----------------
  async function step1() {
    closeModal(); G.wipe(); await wait(30);
    ok(G.view === 'forest' && !$('#detail').hidden, 'partida nueva: abre en el bosque');
    ok(/10 lanzamientos para comprar el Báculo de Rama/.test(text('#goal')), 'meta inicial con datos reales', text('#goal'));
    for (var i = 0; i < 7; i++) click('#cast');
    $('#scene').focus(); key(' '); key(' '); key(' ');
    ok(Math.abs(G.state.zones.forest.mana - 10) < 1e-9, 'lanzar con botón y con Espacio (+1 cada uno)');
    ok(Sc.view('forest').fx.some(function (e) { return e.k === 'manual'; }), 'el lanzamiento manual nace de la mano libre (efecto propio, distinto de la chispa del báculo)');
    upd();
    var rows = document.querySelectorAll('#items .irow');
    ok(rows.length === 1 && /Por descubrir \(7\)/.test(text('#items')), 'al inicio solo se ve el báculo y se anuncia la próxima entrada por descubrir', text('#items').slice(0, 120));
    click('#items button[data-item="staff"]');
    ok(G.state.zones.forest.items.staff === 1, 'primer báculo comprado desde la fila');
    skip(30);
    ok(G.state.zones.forest.mana > 0, 'el aprendiz produce solo');

    // --- Tienda ordenada por coste, atajos estables y orden congelado bajo el cursor ---
    var st = G.state; Object.assign(st.zones.forest.items, { staff: 9, robe: 6, ring: 1 }); st.zones.forest.mana = 50; st.zones.forest.generated = 2000;
    upd();
    var ord = rowOrder(), costs = ord.map(function (id) { return S.plan(st, 'forest', id, '1').cost; });
    ok(costs.every(function (c, i) { return i === 0 || costs[i - 1] <= c; }), '×1: filas ordenadas por coste del próximo nivel', ord.map(function (id, i) { return id + ':' + Math.round(costs[i]); }));
    ok(Array.prototype.every.call(document.querySelectorAll('#items .irow'), function (r) { return r.querySelector('kbd').textContent === String(C.zones.forest.itemOrder.indexOf(r.dataset.id) + 1); }), 'cada fila muestra su tecla real (1–8 según su identidad, no su posición)');
    $('#items').dispatchEvent(new PointerEvent('pointerenter'));
    var frozen = rowOrder();
    st.zones.forest.items.robe = 30; upd();
    ok(rowOrder().join() === frozen.join(), 'con el cursor encima, las filas no cambian de lugar');
    $('#items').dispatchEvent(new PointerEvent('pointerleave')); upd();
    ok(rowOrder().join() !== frozen.join(), 'al salir el cursor se reordenan');
    st.zones.forest.mana = 1e6; var rb = st.zones.forest.items.robe, sb = st.zones.forest.items.staff;
    key('2');
    ok(st.zones.forest.items.robe === rb + 1 && st.zones.forest.items.staff === sb, 'tecla 2 compra la túnica aunque no sea la segunda fila');
    click('.amt[data-amt="10"]'); upd();
    var o10 = rowOrder(), c10 = o10.map(function (id) { return S.plan(st, 'forest', id, '10').cost; });
    ok(c10.every(function (c, i) { return i === 0 || c10[i - 1] <= c; }), '×10: orden por coste real del lote');
    click('.amt[data-amt="max"]'); upd();
    var row = $('#items .irow[data-id="staff"]');
    ok(/×\d+ · /.test(row.querySelector('.cost').textContent), 'Máx: el botón muestra la cantidad y el total real');
    click('.amt[data-amt="10"]');
    st.zones.forest.items.robe = 6; st.zones.forest.items.ring = 1;
    st.zones.forest.items.staff = 5; st.zones.forest.mana = S.costFor(C.zones.forest.items.staff, 5, 10); A.UI.clearBanners(); upd();
    click('#items button[data-item="staff"]');
    ok(st.zones.forest.items.staff === 15 && /Evolución/.test(text('#banner')) && /Báculo de Cristal/.test(text('#banner')), '×10 que cruza el Nv 10: anuncio de evolución', text('#banner'));
    ok(Sc.evolving('forest'), 'la escena reproduce la transformación');
    click($('#items .irow[data-id="staff"] .more'));
    ok(/Próxima forma en Nv 50/.test(text('#items .irow[data-id="staff"] .detail')), 'el detalle anticipa el próximo hito visual y su pista', text('#items .irow[data-id="staff"] .detail').slice(0, 140));
    click('.amt[data-amt="1"]');

    // --- Jungla ---
    st.zones.forest.items.robe = 40; st.zones.forest.mana = 0; skip(1);
    ok(st.zones.jungle.unlocked && !st.zones.crypt.unlocked, 'la jungla se descubre antes que la cripta');
    key('s');
    ok(G.view === 'room' && !$('#room').hidden && $('#detail').hidden, 'tecla S: Sala de la Orden');
    ok(document.querySelectorAll('.portal-cv').length === 2 && /Portal sellado/.test(text('#portals')), 'un portal por zona abierta y el sellado anunciado');
    ok(/savia de la jungla/.test(text('.portal-jungle')) && /Media:/.test(text('.portal-jungle')), 'junto al portal: saldo y producción media');
    click('[data-portal="jungle"]');
    ok(G.view === 'jungle' && G.state.zones.jungle.introSeen && /herborista/.test(text('#banner')), 'el portal abre la jungla y la herborista despierta');
    for (i = 0; i < 5; i++) click('#cast');
    ok(G.state.zones.jungle.cnt.bloom === 1, 'cinco marcas a mano provocan una floración');
    upd();
    click('#items button[data-item="grimoire"]');
    ok(G.state.zones.jungle.items.grimoire === 1, 'Grimorio de Poda comprado con savia');
    var pr0 = G.state.zones.jungle.cnt.prune || 0; skip(10);
    ok((G.state.zones.jungle.cnt.prune || 0) > pr0, 'podas automáticas sin clics');
    ok(/Floración/.test(text('#zone-stats')) && /secuencia/.test(text('#zone-stats')), 'se muestra la secuencia y el valor de la floración');

    // --- Cripta, Confluencia y valor indirecto ---
    st.zones.forest.items.robe = 200; skip(1);
    ok(st.zones.crypt.unlocked, 'la cripta se abre');
    key('z'); ok(G.view === 'crypt', 'tecla Z recorre las zonas abiertas'); // jungla → cripta
    for (i = 0; i < 5; i++) click('#cast');
    upd(); click('#items button[data-item="staff"]');
    ok(st.zones.crypt.items.staff === 1, 'Báculo de Latón comprado');
    st.zones.forest.mana = S.orderCost('confluence', 0);
    click('.tab[data-panel="order"]'); upd();
    ok(/Con Nv 1:/.test(text('#panel-order .card[data-id="confluence"] .explain')), 'Confluencia explicada con números antes de comprar');
    click('#panel-order button[data-order="confluence"]');
    ok(st.order.confluence === 1, 'Confluencia comprada');
    click('.tab[data-panel="items"]'); G.openZone('forest'); st.zones.forest.mana = 1e9; upd();
    ok(/cripta \+.*\/pulso/.test(text('#items .irow[data-id="robe"] .gain')), 'la fila del bosque muestra cuánto añade a cada pulso de la cripta', text('#items .irow[data-id="robe"] .gain'));

    // --- Coherencia Sala ↔ vista y sin producción extra al cambiar de vista ---
    G.openRoom();
    var iv = S.cryptInterval(st); st.zones.crypt.cyc.pulse = iv * 0.999; skip(iv * 0.01 + 0.01);
    var pulseFx = Sc.view('crypt').fx.filter(function (e) { return e.k === 'pulse'; });
    ok(pulseFx.length >= 1, 'un pulso ocurrido con la Sala abierta llega a la vista de la cripta');
    Sc.renderPortals(st, Date.now());
    var t0 = pulseFx[pulseFx.length - 1].t0;
    G.openZone('crypt');
    ok(Sc.view('crypt').fx.some(function (e) { return e.k === 'pulse' && e.t0 === t0; }), 'al entrar por el portal se ve el mismo pulso (mismo instante)');
    var frozenNow = G.now(); G.now = function () { return frozenNow; };
    var snap = C.zoneOrder.map(function (z) { return st.zones[z].mana; }).join();
    G.openRoom(); G.openZone('jungle'); G.openRoom(); document.dispatchEvent(new Event('visibilitychange')); G.tick(); G.openZone('forest');
    ok(C.zoneOrder.map(function (z) { return st.zones[z].mana; }).join() === snap, 'abrir la Sala, cambiar de vista o volver a la pestaña no acredita producción extra');
    G.now = function () { return Date.now() + offset; };
    G.openRoom();
    ok(G.state.settings.view === 'room', 'se recuerda la Sala como última vista');

    // --- Refundar con tres zonas ---
    G.openZone('forest');
    st.zones.forest.generated = C.prestige.goalTotal; st.zones.jungle.generated = 1e6; st.zones.crypt.generated = 1e6;
    click('.tab[data-panel="prestige"]'); upd();
    ok(/Aporte por zona: Bosque .* Jungla .* Cripta/.test(text('#pr-status')), 'se muestra el aporte de cada zona al total', text('#pr-status').slice(0, 200));
    ok(/En la próxima partida:/.test(text('#talents .card[data-id="sky"]')), 'cada talento dice qué cambia en la próxima partida');
    click('#btn-prestige');
    var btns = document.querySelectorAll('#modal-actions button'); click(btns[btns.length - 1]);
    ok(G.state.prestige.echoes === 3 && !G.state.zones.jungle.unlocked && !G.state.zones.crypt.unlocked && G.view === 'forest', 'refundación: 3 Ecos, zonas selladas, vuelve al bosque');
    click('#talents button[data-talent="sky"]');
    ok(G.state.prestige.talents.sky === 1 && S.isRevealed(G.state, 'forest', 'orbit'), 'Cielo Recordado: los hechizos del bosque visibles desde el inicio');

    // --- Empezar desde cero: cancelar y confirmar ---
    click('.tab[data-panel="game"]'); click('#btn-wipe');
    ok(/no es refundar/.test(text('#modal-body')) && /Ecos/.test(text('#modal-body')), 'el diálogo distingue «empezar desde cero» de refundar');
    Array.prototype.find.call(document.querySelectorAll('#modal-actions button'), function (b) { return b.textContent === 'Cancelar'; }).click();
    ok(G.state.prestige.echoes === 1 && G.state.prestige.talents.sky === 1, 'cancelar deja la partida intacta');
    click('#btn-wipe'); click('#wipe-confirm');
    ok($('#modal').open && G.state.prestige.talents.sky === 1, 'sin marcar la casilla no borra');
    $('#wipe-ok').checked = true; click('#wipe-confirm');
    ok(G.state.prestige.echoes === 0 && G.state.prestige.talents.sky === 0 && G.state.prestige.resets === 0, 'confirmado: empieza de cero sin Ecos ni talentos');

    // --- Preparar migración real: guardado v0.1 en el almacenamiento y recarga ---
    offset = 0;
    var s = document.createElement('script'); s.src = 'tests/fixtures/v01-refundada.js';
    s.onload = function () {
      G.saveNow = function () { return false; }; // evita que esta sesión pise el fixture antes de recargar
      localStorage.removeItem(A.Save.backupKey(1));
      localStorage.setItem(C.saveKey, window.FIXTURE_V01);
      save(2, { raw: window.FIXTURE_V01 });
      location.reload();
    };
    document.body.appendChild(s);
  }

  // ---------------- Paso 2: tras recargar con un guardado v0.1 ----------------
  async function step2(d) {
    await wait(60);
    var st = G.state, raw = d.raw, old = JSON.parse(raw);
    ok(localStorage.getItem(A.Save.backupKey(1)) === raw, 'antes de sobrescribir se guardó la copia original v0.1 tal cual');
    ok(JSON.parse(localStorage.getItem(C.saveKey)).version === 2, 'el guardado principal ya está en formato v2');
    ok(st.zones.forest.items.staff === 70 && st.zones.crypt.items.bell === 15 && st.zones.crypt.items.chalk === 20 && st.prestige.talents.heirloom === 1, 'niveles, Campana, Círculo de Tiza y Báculos heredados conservados');
    ok(st.zones.crypt.unlocked && st.zones.jungle.unlocked, 'la cripta sigue abierta y la jungla se habilita');
    ok(st.prestige.echoes === old.prestige.echoes, 'no se conceden Ecos por actualizar');
    ok(/El aprendiz/.test(text('#modal-body')) && /v0\.1/.test(text('#modal-body')), 'el informe offline distingue el tiempo previo a la actualización');
    closeModal();
    G.openZone('forest'); upd();
    ok(/Báculo del Velo/.test(text('#items .irow[data-id="staff"] .name')), 'el báculo Nv 70 abre directamente con su forma del Nv 50');
    click('.tab[data-panel="game"]'); upd();
    ok(!$('#backup-row').hidden, 'la copia v0.1 se puede exportar desde Partida');
    var gen = C.zoneOrder.map(function (z) { return st.zones[z].generated; });
    G.saveNow();
    save(3, { gen: gen, t: st.lastTick, prodF: S.forestProd(st), prodC: S.cryptProd(st), raw: raw });
    location.reload();
  }

  // ---------------- Paso 3: segunda recarga (no repetir la migración ni duplicar) ----------------
  async function step3(d) {
    await wait(60);
    var st = G.state, el = (st.lastTick - d.t) / 1000;
    ok(localStorage.getItem(A.Save.backupKey(1)) === d.raw, 'la copia v0.1 no se sobrescribe al recargar');
    ok(!$('#modal').open || !/v0\.1/.test(text('#modal-body')), 'la migración no se repite');
    var dF = st.zones.forest.generated - d.gen[0];
    ok(dF >= 0 && dF <= d.prodF * (el + 0.5) + 1e-6, 'recargar solo acredita el tiempo transcurrido (sin duplicar)', [dF, d.prodF * el]);
    // Recarga real a mitad de un pulso
    var ivr = S.cryptInterval(st);
    st.zones.crypt.cyc.pulse = ivr * 0.5; st.lastTick = Date.now(); G.saveNow();
    save(4, { snap: JSON.parse(localStorage.getItem(C.saveKey)), iv: ivr, reward: S.pulseBreakdown(st).total });
    location.reload();
  }

  // ---------------- Paso 4: fase del pulso tras recarga, offline, bloqueo de guardado ----------------
  async function step4(d) {
    await wait(60);
    var s = G.state, snap = d.snap, el = (s.lastTick - snap.lastTick) / 1000;
    var expP = Math.floor((d.iv * 0.5 + el) / d.iv + 1e-9);
    ok(s.zones.crypt.cnt.pulse - snap.zones.crypt.cnt.pulse === expP, 'recarga real a mitad de pulso: pulsos exactos', [s.zones.crypt.cnt.pulse - snap.zones.crypt.cnt.pulse, expP]);
    ok(Math.abs(s.zones.crypt.cyc.pulse - ((d.iv * 0.5 + el) - expP * d.iv)) < 1e-6, 'la fase del pulso continúa');
    s.lastTick = Date.now() - 10 * 3600 * 1000; G.saveNow();
    var rep = G.boot();
    ok(rep && rep.capped && Math.abs(rep.dt - 8 * 3600) < 1, 'offline limitado a 8 h');
    A.UI.offlineReport(rep);
    ok(/El aprendiz/.test(text('#modal-body')) && /La herborista/.test(text('#modal-body')) && /La maga/.test(text('#modal-body')), 'informe offline por mago (tres zonas)');
    closeModal();
    G.openRoom(); A.UI.update(true);
    ok(document.querySelectorAll('.portal-cv').length === 3, 'la Sala muestra tres portales');
    click('.tab[data-panel="game"]');
    G.openZone('forest'); click('.tab[data-panel="game"]'); click('#opt-reduced');
    ok(G.reduced && document.body.classList.contains('reduced'), 'movimiento reducido');
    click('#opt-reduced');
    // Guardado bloqueado
    G.wipe();
    var desc = Object.getOwnPropertyDescriptor(window, 'localStorage');
    try {
      Object.defineProperty(window, 'localStorage', { configurable: true, get: function () { throw new Error('bloqueado'); } });
      G.boot(); A.UI.update(true);
      ok(!$('#notice').hidden && /exporta/.test(text('#notice')), 'guardado bloqueado: aviso con la opción de exportar');
      click('#cast');
      ok(G.state.zones.forest.mana === 1, 'guardado bloqueado: la partida sigue jugable');
    } catch (e) { ok(false, 'no se pudo simular el bloqueo: ' + e.message); }
    if (desc) Object.defineProperty(window, 'localStorage', desc); else delete window.localStorage;
    A.Save.storageOk = null; A.UI.notice(null);
    finish();
  }

  var pending = null;
  try { pending = JSON.parse(sessionStorage.getItem(STEP_KEY) || 'null'); } catch (e) { pending = null; }
  if (pending) { out = pending.out; fails = pending.fails; }
  var run = !pending ? step1() : pending.step === 2 ? step2(pending) : pending.step === 3 ? step3(pending) : step4(pending);
  run.catch(function (e) { ok(false, 'excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); finish(); });
})();
