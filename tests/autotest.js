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
  function confirmBtn() { var b = document.querySelectorAll('#modal-actions button'); return b[b.length - 1]; }
  function save(step, extra) { sessionStorage.setItem(STEP_KEY, JSON.stringify(Object.assign({ step: step, out: out, fails: fails }, extra || {}))); }
  function finish() {
    var pre = document.createElement('pre'); pre.id = 'autotest-results';
    pre.textContent = out.join('\n') + '\n' + (fails ? 'FALLOS: ' + fails : 'TODO OK');
    document.body.appendChild(pre);
    document.title = fails ? 'AUTOTEST FALLO' : 'AUTOTEST OK';
    try { sessionStorage.removeItem(STEP_KEY); localStorage.removeItem(C.saveKey); [1, 2].forEach(function (v) { localStorage.removeItem(A.Save.backupKey(v)); }); } catch (e) { /* nada */ }
  }
  function rowOrder() { return A.UI.sortedIds(); }
  function loadFixture(src, cb) { var s = document.createElement('script'); s.src = src; s.onload = cb; document.body.appendChild(s); }

  // ---------------- Paso 1: recorrido de una partida nueva (5 zonas, Mesa, refundación) ----------------
  async function step1() {
    closeModal(); G.wipe(); await wait(30);
    ok(G.view === 'forest' && !$('#detail').hidden, 'partida nueva: abre en el bosque');
    ok(/10 lanzamientos para comprar el Báculo de Rama/.test(text('#goal')), 'meta inicial con datos reales', text('#goal'));
    ok(document.querySelectorAll('.balances .bal').length >= 6 && $('#bal-castle') && $('#bal-caverns').hidden, 'saldos de 5 zonas generados desde los datos (las cavernas aún ocultas)');
    for (var i = 0; i < 7; i++) click('#cast');
    $('#scene').focus(); key(' '); key(' '); key(' ');
    ok(Math.abs(G.state.zones.forest.mana - 10) < 1e-9, 'lanzar con botón y con Espacio');
    upd(); click('#items button[data-item="staff"]');
    ok(G.state.zones.forest.items.staff === 1, 'primer báculo comprado');
    skip(30);

    // --- Tienda: orden, atajos, ×10 con evolución y comparación ---
    var st = G.state; Object.assign(st.zones.forest.items, { staff: 9, robe: 6, ring: 1 }); st.zones.forest.mana = 50; st.zones.forest.generated = 2000;
    upd();
    var ord = rowOrder(), costs = ord.map(function (id) { return S.plan(st, 'forest', id, '1').cost; });
    ok(costs.every(function (c, i) { return i === 0 || costs[i - 1] <= c; }), 'filas ordenadas por coste');
    $('#items').dispatchEvent(new PointerEvent('pointerenter')); var frozen = rowOrder();
    st.zones.forest.items.robe = 30; upd();
    ok(rowOrder().join() === frozen.join(), 'con el cursor encima, las filas no cambian de lugar');
    $('#items').dispatchEvent(new PointerEvent('pointerleave')); upd();
    st.zones.forest.mana = 1e6; var rb = st.zones.forest.items.robe; key('2');
    ok(st.zones.forest.items.robe === rb + 1, 'tecla 2 compra la túnica aunque no sea la segunda fila');
    st.zones.forest.items.robe = 6; st.zones.forest.items.staff = 47; st.zones.forest.mana = S.costFor(C.zones.forest.items.staff, 47, 3) + 1; A.UI.clearBanners(); upd();
    click($('#items .irow[data-id="staff"] .more')); upd();
    var det = text('#items .irow[data-id="staff"] .detail');
    ok(/Llegar al Nv 50 ahora \(3 niveles\)/.test(det) && /%/.test(det), 'Nv 47: la vista previa ofrece llegar al Nv 50 e incluye el salto en la producción', det.slice(0, 220));
    ok(/Con esta compra/.test(det), 'el detalle muestra el efecto real de la compra (cálculo de la compra, con hitos y cruces)');
    click('.amt[data-amt="10"]'); st.zones.forest.items.staff = 5; st.zones.forest.mana = S.costFor(C.zones.forest.items.staff, 5, 10); A.UI.clearBanners(); upd();
    click('#items button[data-item="staff"]');
    ok(st.zones.forest.items.staff === 15 && /Báculo de Cristal/.test(text('#banner')), '×10 que cruza el Nv 10: evolución anunciada', text('#banner'));
    click('.amt[data-amt="1"]');

    // --- Jungla y Sala ---
    st.zones.forest.items.robe = 40; st.zones.forest.mana = 0; skip(1);
    ok(st.zones.jungle.unlocked && !st.zones.crypt.unlocked, 'la jungla se descubre antes que la cripta');
    key('s');
    ok(G.view === 'room' && G.roomTab === 'portals' && !$('#room-portals').hidden, 'tecla S: portales de la Sala');
    ok(document.querySelectorAll('.portal-cv').length === 2 && /Castillo/.test(text('#portals')), 'un portal por zona abierta; las selladas anuncian su condición');
    click('[data-portal="jungle"]');
    for (i = 0; i < 5; i++) click('#cast');
    ok(G.state.zones.jungle.cnt.bloom === 1, 'cinco marcas provocan una floración');
    upd(); click('#items button[data-item="grimoire"]');
    ok(G.state.zones.jungle.items.grimoire === 1, 'grimorio comprado');

    // --- Cripta y Mesa Redonda (compras de la orden desde la Mesa, con vuelta a la zona) ---
    st.zones.forest.items.robe = 200; skip(1);
    ok(st.zones.crypt.unlocked, 'la cripta se abre');
    G.openZone('crypt'); for (i = 0; i < 5; i++) click('#cast'); upd(); click('#items button[data-item="staff"]');
    ok(st.zones.crypt.items.staff === 1, 'Báculo de Latón comprado');
    st.zones.forest.mana = S.orderCost('confluence', 0);
    click('.tab-link[data-table="mesa-orden"]');
    ok(G.view === 'room' && G.roomTab === 'table' && !$('#room-table').hidden, 'el acceso «Orden ↗» de la tienda lleva a la Mesa Redonda');
    ok(/Duración: este ciclo/.test(text('#mesa-orden')) && /Moneda: maná del bosque/.test(text('#mesa-orden')), 'la Mesa distingue duración, moneda y condición');
    click('#mesa-orden button[data-order="confluence"]');
    ok(st.order.confluence === 1, 'Confluencia comprada desde la Mesa (implementación única)');
    ok(!$('#room-back').hidden && /Cripta/.test(text('#room-back')), 'hay un camino claro de vuelta a la zona');
    click('#room-back');
    ok(G.view === 'crypt', 'volver a la cripta desde la Mesa');
    key('m'); ok(G.view === 'room' && G.roomTab === 'table', 'tecla M: Mesa Redonda');
    $('#tab-table').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    ok(G.roomTab === 'portals', 'flechas entre las pestañas de la Sala (teclado)');
    G.openZone('forest'); st.zones.forest.mana = 1e9; upd();
    ok(/cripta \+.*\/pulso/.test(text('#items .irow[data-id="robe"] .gain')), 'la fila del bosque muestra el aporte a cada pulso de la cripta');

    // --- Coherencia Sala ↔ vista y sin producción extra ---
    G.openRoom('portals');
    var iv = S.cryptInterval(st); st.zones.crypt.cyc.pulse = iv * 0.999; skip(iv * 0.01 + 0.01);
    var pf = Sc.view('crypt').fx.filter(function (e) { return e.k === 'pulse'; });
    ok(pf.length >= 1, 'un pulso con la Sala abierta llega a la vista de la cripta');
    var t0 = pf[pf.length - 1].t0; G.openZone('crypt');
    ok(Sc.view('crypt').fx.some(function (e) { return e.k === 'pulse' && e.t0 === t0; }), 'al entrar por el portal se ve el mismo pulso');
    var frozenNow = G.now(); G.now = function () { return frozenNow; };
    var snap = C.zoneOrder.map(function (z) { return st.zones[z].mana; }).join();
    G.openRoom('portals'); G.openRoom('table'); G.openZone('jungle'); document.dispatchEvent(new Event('visibilitychange')); G.tick(); G.openZone('forest');
    ok(C.zoneOrder.map(function (z) { return st.zones[z].mana; }).join() === snap, 'cambiar de vista u ocultar la pestaña no acredita producción');
    G.now = function () { return Date.now() + offset; };

    // --- Castillo (primer ciclo) ---
    Object.assign(st.zones.crypt.items, { staff: 60, bell: 22, chalk: 20, medallion: 8 }); skip(1);
    ok(st.zones.castle.unlocked, 'el castillo se descubre en el primer ciclo');
    G.openZone('castle');
    ok(/lancero/i.test(text('#banner')) && G.state.zones.castle.introSeen, 'el lancero de brasas despierta');
    for (i = 0; i < 3; i++) click('#cast');
    ok(st.zones.castle.mana > 0, 'ascuas a mano dan brasa del castillo');
    st.zones.castle.mana = 20; upd(); click('#items button[data-item="lance"]');
    ok(st.zones.castle.items.lance === 1, 'la lanza automatiza el castillo');
    skip(3 * 6 + 0.5);
    ok((st.zones.castle.cnt.crack || 0) >= 6 && (st.zones.castle.cnt.thaw || 0) >= 1, 'grietas automáticas y primer deshielo sin clics', st.zones.castle.cnt);
    ok(/Red de grietas|red/i.test(text('#zone-stats')), 'se muestra la red de grietas');

    // --- Refundar desde la Mesa: ganar/perder/conservar, doble clic, omitir ---
    st.zones.forest.generated = C.prestige.goalTotal; st.zones.castle.cnt.thaw = 10; st.run.playTime = 40 * 60; // ciclo de 40 min
    G.openTable('mesa-refundar'); upd();
    ok(/Refundar ahora: \d+ Ecos/.test(text('#echo-summary')) && /Siguiente objetivo/.test(text('#echo-summary')), 'la Mesa muestra los Ecos de refundar ahora y el siguiente objetivo');
    var expected = S.echoInfo(st).gain;
    click('#btn-prestige');
    var body = text('#modal-body');
    ok(/Ganarás/.test(body) && /Perderás/.test(body) && /Conservarás/.test(body), 'antes de confirmar: qué ganas, qué pierdes y qué conservas');
    var cb = confirmBtn(); cb.click(); cb.click(); G.prestige();
    ok(G.state.prestige.echoes === expected && G.state.prestige.resets === 1, 'doble clic y llamada repetida: la recompensa se concede una sola vez (' + expected + ' Ecos)', G.state.prestige.echoes);
    ok(!$('#refound').hidden && document.querySelectorAll('#refound-portals canvas').length === 4, 'secuencia de refundación con los portales de las 4 zonas abiertas');
    ok(JSON.parse(localStorage.getItem(C.saveKey)).prestige.resets === 1, 'el estado nuevo ya está guardado antes de que acabe la animación');
    key('Escape');
    ok($('#refound').hidden && G.view === 'room' && G.roomTab === 'table', 'Esc omite la secuencia y lleva a los talentos de la Mesa');
    click('#talents button[data-talent="heirloom"]');
    ok(G.state.prestige.talents.heirloom === 1 && G.state.zones.forest.items.staff === 1, 'talento comprado desde la Mesa; la nueva partida ya tiene el báculo');

    // --- Cavernas (tras refundar + hito del castillo) ---
    var s2 = G.state; Object.assign(s2.zones.forest.items, { robe: 300 }); skip(1);
    Object.assign(s2.zones.crypt.items, { staff: 60, bell: 22, chalk: 20, medallion: 8 }); skip(1);
    ok(s2.zones.castle.unlocked && !s2.zones.caverns.unlocked, 'ciclo 2: el castillo reabre; las cavernas esperan su hito');
    s2.zones.castle.cnt.thaw = 10; skip(1);
    ok(s2.zones.caverns.unlocked, 'con 1 refundación y 10 deshielos en el ciclo se abren las cavernas');
    G.openZone('caverns'); s2.zones.caverns.mana = 50; upd(); click('#items button[data-item="mirror"]');
    skip(31);
    ok(s2.zones.caverns.items.mirror === 1 && (s2.zones.caverns.cnt.eye || 0) >= 1 && s2.zones.caverns.mana > 0, 'haz continuo y mirada del ojo en las cavernas');
    G.openRoom('portals'); A.UI.update(true);
    ok(document.querySelectorAll('.portal-cv').length === 5, 'la Sala muestra cinco portales');

    // --- Refundación interrumpida por recarga ---
    s2.zones.forest.generated = C.prestige.goalTotal * 2; s2.run.playTime = 30 * 60;
    var exp2 = s2.prestige.echoes + S.echoInfo(s2).gain;
    G.openTable('mesa-refundar'); click('#btn-prestige'); confirmBtn().click();
    ok(!$('#refound').hidden, 'secuencia en curso');
    offset = 0;
    save(2, { exp: exp2, resets: 2 });
    location.reload(); // recarga a mitad de la animación
  }

  // ---------------- Paso 2: tras recargar en mitad de la refundación ----------------
  async function step2(d) {
    await wait(60); closeModal();
    ok(G.state.prestige.echoes === d.exp && G.state.prestige.resets === d.resets, 'recargar a mitad de la secuencia no repite ni pierde la recompensa', [G.state.prestige.echoes, d.exp]);
    ok($('#refound').hidden, 'tras recargar no queda la secuencia a medias');
    // Empezar desde cero: cancelar y confirmar
    G.openZone('forest'); click('.tab[data-panel="game"]'); click('#btn-wipe');
    Array.prototype.find.call(document.querySelectorAll('#modal-actions button'), function (b) { return b.textContent === 'Cancelar'; }).click();
    ok(G.state.prestige.resets === 2, 'cancelar «empezar desde cero» deja la partida intacta');
    click('#btn-wipe'); click('#wipe-confirm');
    ok($('#modal').open && G.state.prestige.resets === 2, 'sin la casilla no borra');
    $('#wipe-ok').checked = true; click('#wipe-confirm');
    ok(G.state.prestige.resets === 0 && G.state.prestige.echoes === 0, 'confirmado: empieza de cero');
    // Preparar migración v0.2 real
    loadFixture('tests/fixtures/v02-avanzada.js', function () {
      G.saveNow = function () { return false; };
      [1, 2].forEach(function (v) { localStorage.removeItem(A.Save.backupKey(v)); });
      localStorage.setItem(C.saveKey, window.FIXTURE_V02);
      save(3, { raw: window.FIXTURE_V02 });
      location.reload();
    });
  }

  // ---------------- Paso 3: migración desde v0.2 ----------------
  async function step3(d) {
    await wait(60);
    var st = G.state, old = JSON.parse(d.raw);
    ok(localStorage.getItem(A.Save.backupKey(2)) === d.raw, 'v0.2: copia exacta del original antes de sobrescribir');
    ok(JSON.parse(localStorage.getItem(C.saveKey)).version === 3, 'el guardado principal ya está en formato v3');
    ok(st.prestige.echoes === old.prestige.echoes && st.prestige.talents.sky === 1 && st.prestige.talents.bells === 1 && st.prestige.resets === 2, 'Ecos, talentos y refundaciones conservados');
    ok(st.zones.crypt.items.chalk === 24 && st.zones.forest.items.staff === 120 && st.mastery.sparks >= 12345, 'compras y maestría conservadas');
    ok(/v0\.2/.test(text('#modal-body')), 'el informe offline distingue el tiempo previo a la actualización');
    closeModal();
    ok(G.view === 'room', 'se respeta la última vista guardada (la Sala)');
    G.openTable('mesa-talentos'); upd();
    ok(/Escuela del Cometa/.test(text('#talents')) && !$('#talents button[data-talent="comet"]').textContent.match(/Bloqueado/), 'la Escuela del Cometa queda disponible por el dominio ya logrado (Lluvia Nv 55)');
    G.openZone('forest'); click('.tab[data-panel="game"]'); upd();
    ok(/v0\.2/.test(text('#backup-buttons')), 'la copia v0.2 se puede exportar desde Partida');
    loadFixture('tests/fixtures/v01-refundada.js', function () {
      G.saveNow = function () { return false; };
      [1, 2].forEach(function (v) { localStorage.removeItem(A.Save.backupKey(v)); });
      localStorage.setItem(C.saveKey, window.FIXTURE_V01);
      save(4, { raw: window.FIXTURE_V01 });
      location.reload();
    });
  }

  // ---------------- Paso 4: migración desde v0.1 (ruta completa) y casos límite ----------------
  async function step4(d) {
    await wait(60); closeModal();
    var st = G.state;
    ok(localStorage.getItem(A.Save.backupKey(1)) === d.raw, 'v0.1: copia exacta del original');
    ok(st.zones.forest.items.staff === 70 && st.zones.crypt.items.bell === 15 && st.prestige.talents.heirloom === 1 && st.version === 3, 'v0.1 → v0.3: niveles y Báculos heredados conservados');
    G.openZone('forest'); upd();
    ok(/Báculo del Velo/.test(text('#items .irow[data-id="staff"] .name')), 'el báculo Nv 70 abre con su forma del Nv 50');
    // offline de más de 8 h y bloqueo de guardado
    G.saveNow = A.Game.saveNow; st.lastTick = Date.now() - 10 * 3600 * 1000;
    var rep = Save().applyOffline(st, Date.now());
    ok(rep.capped && Math.abs(rep.dt - 8 * 3600) < 1, 'offline limitado a 8 h');
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
  function Save() { return A.Save; }

  var pending = null;
  try { pending = JSON.parse(sessionStorage.getItem(STEP_KEY) || 'null'); } catch (e) { pending = null; }
  if (pending) { out = pending.out; fails = pending.fails; }
  var run = !pending ? step1() : pending.step === 2 ? step2(pending) : pending.step === 3 ? step3(pending) : step4(pending);
  run.catch(function (e) { ok(false, 'excepción: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); finish(); });
})();
