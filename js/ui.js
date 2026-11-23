/* La Orden del Umbral — interfaz HTML (saldos, Sala: Portales y Mesa Redonda, tienda, diálogos). */
(function (root) {
  'use strict';
  var A = root.Arcane = root.Arcane || {};
  var C = A.CONFIG, S = A.Sim;
  var UI = A.UI = {};
  var G;
  var ZONES = C.zoneOrder;
  var FOCUS = { forest: 'staff', jungle: 'grimoire', crypt: 'staff', castle: 'lance', caverns: 'mirror' };
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Formato de números en español ----------
  var SUFFIX = [[1e15, ' mil B'], [1e12, ' B'], [1e9, ' mil M'], [1e6, ' M'], [1e3, ' K']];
  A.fmt = function (n) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + A.fmt(-n);
    if (n >= 1e18) return n.toExponential(2).replace('.', ',');
    for (var i = 0; i < SUFFIX.length; i++) {
      if (n >= SUFFIX[i][0] * 0.9995) {
        var v = Math.max(1, n / SUFFIX[i][0]), t = v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0);
        if (t.indexOf('.') >= 0) t = t.replace(/\.?0+$/, '');
        return t.replace('.', ',') + SUFFIX[i][1];
      }
    }
    if (n < 10 && Math.floor(n) !== n) return n.toFixed(1).replace('.', ',');
    if (n < 100 && Math.abs(n - Math.round(n)) > 0.05) return n.toFixed(1).replace('.', ',');
    return String(Math.floor(n));
  };
  A.fmtRate = function (n) { return A.fmt(n) + '/s'; };
  A.fmtMult = function (n) { return '×' + (Math.round(n * 100) / 100).toString().replace('.', ','); };
  A.fmtTime = function (s) {
    s = Math.max(0, Math.round(s));
    if (s < 60) return s + ' s';
    var m = Math.floor(s / 60), h = Math.floor(m / 60);
    if (h > 0) return h + ' h ' + (m % 60) + ' min';
    return m + ' min' + (s % 60 ? ' ' + (s % 60) + ' s' : '');
  };
  A.fmtSec = function (s) { return (Math.round(s * 100) / 100).toString().replace('.', ',') + ' s'; };
  A.fmtPct = function (f) { return (Math.round(f * 1000) / 10).toString().replace('.', ',') + ' %'; };
  var fmt = A.fmt, fmtRate = A.fmtRate;
  function ecos(n, f) { return (f ? fmt(n) : n) + (n === 1 ? ' Eco' : ' Ecos'); }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; }
  function zc(z) { return C.zones[z]; }

  // ---------- Inicio ----------
  UI.init = function (game) {
    G = game;
    UI.structKey = {};
    // saldos de zona generados desde los datos (añadir una zona no toca el HTML)
    var bals = $('balances'), echoes = $('bal-echoes');
    ZONES.forEach(function (z) {
      var b = el('button', 'bal bal-' + z, '<span class="bal-name">' + zc(z).short + '</span><span class="bal-mana" id="mana-' + z + '">0</span><span class="bal-rate" id="rate-' + z + '"></span>');
      b.type = 'button'; b.id = 'bal-' + z;
      b.addEventListener('click', function () { G.openZone(z); });
      bals.insertBefore(b, echoes);
    });
    document.querySelectorAll('.tab[data-panel]').forEach(function (t) { t.addEventListener('click', function () { UI.showPanel(t.dataset.panel); }); });
    document.querySelectorAll('.tab-link').forEach(function (t) { t.addEventListener('click', function () { G.openTable(t.dataset.table); }); });
    document.querySelectorAll('.amt').forEach(function (b) { b.addEventListener('click', function () { G.setAmount(b.dataset.amt); }); });
    $('btn-room').addEventListener('click', function () { G.openRoom('portals'); });
    document.querySelectorAll('.room-tab').forEach(function (t) {
      t.addEventListener('click', function () { G.openRoom(t.dataset.room); });
      t.addEventListener('keydown', function (e) { // flechas entre pestañas (patrón tablist)
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault(); var other = t.dataset.room === 'portals' ? 'table' : 'portals'; G.openRoom(other); $('tab-' + other).focus();
      });
    });
    $('ready-sign').addEventListener('click', function () { G.openTable('mesa-refundar'); });
    $('room-back').addEventListener('click', function () { G.openZone(G.zone); });
    $('cast').addEventListener('click', function () { G.cast(); });
    $('btn-save').addEventListener('click', function () { G.saveNow(true); });
    $('btn-export').addEventListener('click', UI.exportFile);
    $('btn-copy').addEventListener('click', UI.copyExport);
    $('btn-import').addEventListener('click', function () { UI.importText($('import-text').value); });
    $('backup-buttons').addEventListener('click', function (e) { var b = e.target.closest('button[data-backup]'); if (b) UI.exportBackup(+b.dataset.backup); });
    $('import-file').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { $('import-text').value = r.result; UI.importText(r.result); }; r.readAsText(f);
    });
    $('opt-reduced').addEventListener('change', function (e) { G.setReduced(e.target.checked); });
    $('btn-wipe').addEventListener('click', UI.confirmWipe);
    $('anomaly-btn').addEventListener('click', function () { G.dispelAnomaly(); });
    $('refound-skip').addEventListener('click', function () { UI.endRefound(); });
    var list = $('items');
    list.addEventListener('click', function (e) {
      var more = e.target.closest('button.more');
      if (more) { var d = more.parentNode.querySelector('.detail'); var open = d.hidden; d.hidden = !open; more.setAttribute('aria-expanded', open); more.textContent = open ? '▾' : '▸'; UI.openDetails[more.parentNode.dataset.id] = open; UI.update(); return; }
      var b = e.target.closest('button[data-item]');
      if (b) G.buy(b.dataset.zone, b.dataset.item);
    });
    // El orden de la tienda se congela mientras el cursor o el foco están en la lista.
    list.addEventListener('pointerenter', function () { UI.freeze.pointer = true; });
    list.addEventListener('pointerleave', function () { UI.freeze.pointer = false; });
    list.addEventListener('focusin', function () { UI.freeze.focus = true; });
    list.addEventListener('focusout', function (e) { if (!list.contains(e.relatedTarget)) UI.freeze.focus = false; });
    // Mesa Redonda: compras de la orden, talentos y refundar (única implementación)
    $('mesa-orden').addEventListener('click', function (e) { var b = e.target.closest('button[data-order]'); if (b) G.buyOrder(b.dataset.order); });
    $('mesa-talentos').addEventListener('click', function (e) { var b = e.target.closest('button[data-talent]'); if (b) G.buyTalent(b.dataset.talent); });
    $('mesa-refundar').addEventListener('click', function (e) { if (e.target.closest('#btn-prestige')) UI.confirmPrestige(); });
    $('portals').addEventListener('click', function (e) { var b = e.target.closest('[data-portal]'); if (b) G.openZone(b.dataset.portal); });
  };
  UI.freeze = { pointer: false, focus: false };
  UI.openDetails = {};

  UI.showPanel = function (p) {
    G.panel = p;
    document.querySelectorAll('.tab[data-panel]').forEach(function (t) { t.setAttribute('aria-selected', t.dataset.panel === p ? 'true' : 'false'); });
    ['items', 'game'].forEach(function (id) { $('panel-' + id).hidden = id !== p; });
    UI.structKey = {};
    UI.update(true);
  };

  // ---------- Vista: Sala (Portales / Mesa) o detalle ----------
  UI.applyView = function () {
    var room = G.view === 'room', tab = G.roomTab || 'portals';
    $('room').hidden = !room; $('detail').hidden = room;
    $('btn-room').setAttribute('aria-pressed', room);
    $('room-label').textContent = room && tab === 'table' ? 'Mesa Redonda' : 'Portales';
    $('room-portals').hidden = tab !== 'portals'; $('room-table').hidden = tab !== 'table';
    $('tab-portals').setAttribute('aria-selected', tab === 'portals'); $('tab-table').setAttribute('aria-selected', tab === 'table');
    $('tab-portals').tabIndex = tab === 'portals' ? 0 : -1; $('tab-table').tabIndex = tab === 'table' ? 0 : -1;
    var back = $('room-back'); back.hidden = !room || !G.cameFromZone; back.textContent = '← Volver a ' + zc(G.zone).name;
    document.body.dataset.zone = room ? 'room' : G.zone;
    if (room && tab === 'portals') UI.buildRoom(true);
    if (room && tab === 'table') { UI.structKey.order = ''; UI.structKey.prestige = ''; UI.updateTable(G.state, true); }
  };
  UI.buildRoom = function (force) {
    var st = G.state, box = $('portals');
    var open = ZONES.filter(function (z) { return S.isOpen(st, z); });
    var key = open.join(',');
    if (!force && UI.structKey.room === key) return;
    UI.structKey.room = key;
    A.Scene.detachPortals();
    box.innerHTML = '';
    open.forEach(function (z) {
      var cell = el('div', 'portal portal-' + z);
      cell.innerHTML = '<button type="button" class="portal-btn" data-portal="' + z + '" aria-label="Entrar en ' + zc(z).name + '"><canvas class="portal-cv"></canvas></button>' +
        '<div class="portal-info"><h3>' + zc(z).name + '</h3><p class="p-mana"></p><p class="p-rate"></p><p class="p-hint"></p></div>';
      box.appendChild(cell);
      A.Scene.attachPortal(z, cell.querySelector('canvas'));
    });
    var locked = ZONES.filter(function (z) { return !S.isOpen(st, z); });
    if (locked.length) box.appendChild(el('div', 'portal portal-locked', '<div class="portal-sealed">' + locked.map(function (z) { return '<p><b>' + zc(z).name + '</b> · ' + S.unlockText(st, z) + ' (' + Math.floor(S.unlockProgress(st, z) * 100) + ' %)</p>'; }).join('') + '</div>'));
    UI.fitPortals();
  };
  // Reparte los portales según el ancho Y el alto disponibles: escala entera, sin que una sola tarjeta ocupe la pantalla.
  UI.fitPortals = function () {
    var box = $('portals'); if (!box || $('room').hidden) return;
    var cvs = box.querySelectorAll('.portal-cv'); if (!cvs.length) return;
    var cells = box.querySelectorAll('.portal').length;
    var cw = cvs[0].width, ch = cvs[0].height, gap = 12, pad = 18, info = 74;
    var availW = box.clientWidth, top = box.getBoundingClientRect().top + (root.scrollY || 0) - (root.scrollY || 0);
    var availH = Math.max(240, root.innerHeight - Math.max(110, top) - 12);
    // Reglas: con varias zonas, como máximo 2× (ninguna tarjeta ocupa la pantalla); al menos 2 columnas;
    // la primera fila debe caber en alto y el resto se recorre con desplazamiento vertical natural.
    var best = null, maxS = cells >= 2 ? 2 : 3;
    [3, 2, 1].some(function (s) {
      if (s > maxS) return false;
      var cellW = cw * s + pad, cols = Math.min(cells, Math.floor((availW + gap) / (cellW + gap)));
      if (cols < 1) return false;
      var rowH = ch * s + info + pad;
      if (s > 1 && (cols < Math.min(cells, 2) || rowH > availH)) return false;
      best = { s: s, cols: cols, cellW: cellW }; return true;
    });
    if (!best) best = { s: 1, cols: 1, cellW: cw + pad };
    var small = availW < cw + pad; // pantallas muy estrechas: escala no entera al ancho
    box.style.gridTemplateColumns = small ? '1fr' : 'repeat(' + best.cols + ', ' + best.cellW + 'px)';
    cvs.forEach(function (cv) {
      if (small) { cv.style.width = '100%'; cv.style.height = 'auto'; }
      else { cv.style.width = (cv.width * best.s) + 'px'; cv.style.height = (cv.height * best.s) + 'px'; }
    });
    UI.portalScale = small ? 0 : best.s;
  };
  function updateRoom(st) {
    UI.buildRoom(false);
    ZONES.forEach(function (z) {
      var cell = document.querySelector('.portal-' + z); if (!cell) return;
      cell.querySelector('.p-mana').innerHTML = '<b>' + fmt(st.zones[z].mana) + '</b> ' + zc(z).currency;
      cell.querySelector('.p-rate').textContent = 'Media: ' + fmtRate(S.zoneProd(st, z));
      cell.querySelector('.p-hint').textContent = UI.zoneHint(st, z);
    });
  }

  // ---------- Actualización periódica ----------
  UI.update = function (force) {
    var st = G.state, z = G.zone;
    document.body.className = document.body.className.replace(/\bzone-\w+\b/g, '').trim();
    if (G.view !== 'room') document.body.classList.add('zone-' + z);
    ZONES.forEach(function (zid) {
      var open = S.isOpen(st, zid), b = $('bal-' + zid);
      b.classList.toggle('locked', !open);
      b.classList.toggle('active', G.view !== 'room' && zid === z);
      b.setAttribute('aria-pressed', G.view !== 'room' && zid === z);
      b.hidden = !open && zid === 'caverns' && st.prestige.resets < 1 && S.unlockProgress(st, 'castle') < 1;
      $('mana-' + zid).textContent = open ? fmt(st.zones[zid].mana) : 'Sellada';
      $('rate-' + zid).textContent = !open ? Math.floor(S.unlockProgress(st, zid) * 100) + ' %'
        : (st.zones[zid].items[FOCUS[zid]] > 0 || zid === 'forest' ? fmtRate(S.zoneProd(st, zid)) : 'sin ' + zc(zid).focusLabel);
    });
    var showE = st.prestige.echoes > 0 || st.prestige.resets > 0 || S.canPrestige(st);
    $('bal-echoes').hidden = !showE; $('echoes').textContent = fmt(st.prestige.echoes);
    $('ready-sign').hidden = !(G.view === 'room' && G.roomTab !== 'table' && S.canPrestige(st));
    document.querySelectorAll('.tab-link[data-table="mesa-refundar"]').forEach(function (t) { setDot(t, S.canPrestige(st)); });
    if (G.view === 'room') { if (G.roomTab === 'table') UI.updateTable(st, force); else updateRoom(st); return; }

    $('zone-name').textContent = zc(z).name;
    var goals = UI.goals(st, z);
    $('goal').textContent = goals[0]; $('goal-sub').textContent = goals[1] || '';
    $('cast-label').textContent = zc(z).manualName;
    $('cast-gain').textContent = '+' + fmt(S.manualValue(st, z));
    $('zone-stats').innerHTML = UI.zoneStats(st, z);
    document.querySelectorAll('.amt').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.amt === st.settings.buyAmount ? 'true' : 'false'); });
    if (G.panel === 'items') UI.updateItems(st, z, force); else UI.updateGame(st);
  };
  function setDot(tab, on) { var d = tab.querySelector('.dot'); if (on && !d) tab.appendChild(el('span', 'dot')); if (!on && d) d.remove(); }

  UI.zoneStats = function (st, z) {
    var m = S.model(st, z), p = m.parts, avg = S.zoneProd(st, z), s;
    var cyc = function (id) { return m.cycles.filter(function (c) { return c.id === id; })[0]; };
    if (z === 'forest') {
      s = 'Producción media: <b>' + fmtRate(avg) + '</b>';
      var parts = [];
      if (st.zones.forest.items.staff) parts.push('báculo ' + fmtRate(p.staff) + (p.ringMult > 1 ? ' (anillo ' + A.fmtMult(p.ringMult) + ')' : ''));
      if (p.robe) parts.push('túnica ' + fmtRate(p.robe));
      if (p.spell) parts.push('lluvia ' + fmtRate(p.spell));
      if (p.prism) parts.push('prisma ' + fmtRate(p.prism));
      m.cycles.forEach(function (c) { parts.push((c.id === 'orbit' ? 'órbita ' : 'constelación ') + fmt(c.reward) + ' cada ' + A.fmtSec(c.interval) + (c.cross ? ' (Raíz Estelar +' + fmt(c.cross) + ')' : '')); });
      if (parts.length) s += '<br>' + parts.join(' · ');
      var ml = S.masteryLevel(st), th = C.zones.forest.mastery.thresholds;
      if (st.zones.forest.items.staff) s += '<br>Maestría de Chispa (cosmética): ' + (ml ? '<b>' + C.zones.forest.mastery.names[ml - 1] + '</b>' : 'ninguna') + (ml < th.length ? ' · ' + fmt(st.mastery.sparks) + ' / ' + fmt(th[ml]) + ' chispas' : ' · completa');
      return s;
    }
    if (z === 'jungle') {
      if (!st.zones.jungle.items.grimoire) return 'La herborista marca raíces a mano. Cada 5 marcas o podas, la secuencia florece. Con el grimorio, las podas son automáticas.';
      var b = p.bloom, idx = st.zones.jungle.seq.bloom || 0;
      return 'Poda: <b>' + fmt(p.prune) + '</b> cada <b>' + A.fmtSec(p.interval) + '</b> (mín. ' + A.fmtSec(C.zones.jungle.prune.minInterval) + ')' +
        '<br>Floración: <b>' + fmt(b.reward) + '</b>' + (b.cross ? ' = ' + fmt(b.base) + ' + ' + fmt(b.cross) + ' Polen Astral' : '') + ' · secuencia <b>' + idx + '/' + b.every + '</b>' +
        '<br>Media: <b>' + fmtRate(avg) + '</b>' + (p.robe ? ' · túnica ' + fmtRate(p.robe) : '');
    }
    if (z === 'crypt') {
      var c = st.zones.crypt;
      if (c.items.staff <= 0) return 'La maga traza sellos a mano. Con su báculo, los pulsos serán automáticos.';
      var charge = Math.min(1, (c.cyc.pulse || 0) / p.interval);
      return 'Pulso: <b>' + fmt(p.base + p.confluence) + '</b>' + (p.confluence > 0 ? ' = ' + fmt(p.base) + ' base + ' + fmt(p.confluence) + ' Confluencia' : '') +
        '<br>Intervalo: <b>' + A.fmtSec(p.interval) + '</b> (mín. ' + A.fmtSec(C.zones.crypt.pulse.minInterval) + ') · Media: <b>' + fmtRate(avg) + '</b>' +
        '<br>Carga: <b>' + Math.floor(charge * 100) + ' %</b> · Pulsos: ' + fmt(c.cnt.pulse || 0) + (c.items.litany ? ' · Letanía ' + (c.seq.litany || 0) + '/' + C.zones.crypt.litany.every : '');
    }
    if (z === 'castle') {
      var k = st.zones.castle;
      if (k.items.lance <= 0) return 'El lancero lanza ascuas a mano. Con su lanza, el calor abrirá grietas solas en la coraza de la Regente.';
      var th2 = p.thaw;
      return 'Calor: <b>' + fmtRate(p.heat) + '</b> (lanza ' + fmtRate(p.lanceHeat) + (p.emberHeat ? ' + ascuas ' + fmtRate(p.emberHeat) : '') + ') · una grieta cada ' + A.fmtSec(p.interval) + ' (mín. 1 s)' +
        '<br>Grieta: <b>' + fmt(p.crackPay) + '</b> cada ' + A.fmtSec(p.interval) + ' · red <b>' + (k.seq.thaw || 0) + '/' + th2.every + '</b>' +
        '<br>Deshielo: <b>' + fmt(th2.reward) + '</b>' + (th2.cross ? ' = ' + fmt(th2.base) + ' + ' + fmt(th2.cross) + ' Réquiem' : '') + ' · Media: <b>' + fmtRate(avg) + '</b> · deshielos: ' + (k.cnt.thaw || 0);
    }
    var v = st.zones.caverns;
    if (v.items.mirror <= 0) return 'La maga glaciar sopla frío a mano. Con su espejo de obsidiana, el haz será continuo.';
    var eye = cyc('eye'), ph = v.cyc.eye || 0, left = Math.max(0, C.zones.caverns.beams.eyeInterval - p.window - ph);
    return 'Haces: <b>' + (1 + p.mirrors) + '</b> (' + p.mirrors + ' espejos de hielo, convergencia ' + A.fmtMult(p.convergence) + ') · <b>' + fmtRate(p.beams) + '</b>' +
      '<br>Ojo de la Caldera: abierto ' + A.fmtSec(p.window) + ' de cada ' + A.fmtSec(C.zones.caverns.beams.eyeInterval) + ', haces ' + A.fmtMult(p.windowMult) + (left > 0 ? ' · se abre en ' + A.fmtSec(left) : ' · <b>¡abierto!</b>') +
      '<br>Media: <b>' + fmtRate(avg) + '</b>' + (eye ? ' · cada mirada +' + fmt(eye.reward) : '');
  };

  // ---------- Metas ----------
  UI.goals = function (st, z) {
    var f = st.zones.forest, j = st.zones.jungle, c = st.zones.crypt, main, fp = S.zoneOwnProd(st, 'forest');
    function manualTo(zid, item) { var n = Math.ceil((S.costFor(S.itemDef(zid, item), 0, 1) - st.zones[zid].mana) / S.manualValue(st, zid)); return n; }
    if (f.items.staff < 1) { var n = manualTo('forest', 'staff'); main = n > 0 ? n + (n === 1 ? ' lanzamiento' : ' lanzamientos') + ' para comprar el Báculo de Rama' : '¡Compra el Báculo de Rama! (tecla 1): lanzará Chispas solo'; }
    else if (f.items.staff < 10) main = 'Báculo de Rama ' + f.items.staff + '/10 · al evolucionar duplicará su producción';
    else if (S.isOpen(st, z) && z !== 'forest' && st.zones[z].items[FOCUS[z]] < 1) { var k = manualTo(z, FOCUS[z]); main = k > 0 ? k + ' lanzamientos a mano para ' + S.itemDef(z, FOCUS[z]).names[0] : '¡Compra ' + S.itemDef(z, FOCUS[z]).names[0] + '!'; }
    else if (!j.unlocked) main = 'Algo crece al sur: producción automática del bosque ' + fmt(fp) + ' / ' + fmt(S.unlockRule('jungle')) + ' por segundo';
    else if (!c.unlocked) main = 'Cripta de las Campanas: producción automática del bosque ' + fmt(fp) + ' / ' + fmt(S.unlockRule('crypt')) + ' por segundo';
    else if (c.items.staff < 1) main = 'La maga de la cripta espera su báculo';
    else if (st.order.confluence < 1) {
      var miss = S.orderCost('confluence', 0) - f.mana, fpr = S.forestProd(st);
      main = miss > 0 ? 'Confluencia: faltan ' + fmt(miss) + ' de maná del bosque' + (fpr > 0 ? ' (~' + A.fmtTime(miss / fpr) + ')' : '') : '¡Confluencia disponible en la Mesa Redonda!';
    } else if (!S.isOpen(st, 'castle')) main = 'Castillo del Invierno: ' + S.unlockText(st, 'castle') + ' (' + Math.floor(S.unlockProgress(st, 'castle') * 100) + ' %)';
    else if (!S.canPrestige(st)) { var tot = S.runTotal(st); main = 'Refundar la orden: ' + fmt(tot) + ' / ' + fmt(C.prestige.goalTotal) + ' de maná generado (' + Math.floor(tot / C.prestige.goalTotal * 100) + ' %)'; }
    else if (!S.isOpen(st, 'caverns') && st.prestige.resets >= 1) main = 'Cavernas del Sol Sepultado: ' + S.unlockText(st, 'caverns') + ' (' + Math.floor(S.unlockProgress(st, 'caverns') * 100) + ' %) · o refunda en la Mesa';
    else { var e = S.echoInfo(st); main = 'Puedes refundar la orden por ' + e.gain + (e.gain === 1 ? ' Eco' : ' Ecos') + ' (Mesa Redonda) · ' + (e.raw > e.base ? 'los Ecos del ciclo maduran: 1 más cada ' + C.prestige.maturityMinutes + ' min' : 'siguiente Eco a los ' + fmt(e.nextAt) + ' generados'); }
    return [main, UI.zoneHint(st, z)];
  };
  UI.zoneHint = function (st, z) {
    if (!S.isOpen(st, z)) return '';
    var zz = st.zones[z];
    if (zz.items[FOCUS[z]] < 1) return 'Sin automatizar: compra ' + S.itemDef(z, FOCUS[z]).names[0];
    var best = null;
    zc(z).itemOrder.forEach(function (id) {
      var lvl = zz.items[id]; if (lvl < 1) return;
      var nv = S.nextVisual(z, id, lvl); if (!nv) return;
      if (!best || nv.level - lvl < best.left) best = { id: id, lvl: lvl, nv: nv, left: nv.level - lvl };
    });
    var parts = [];
    if (z === 'jungle') parts.push('Floración ' + (zz.seq.bloom || 0) + '/' + C.zones.jungle.prune.seqLength + ' raíces');
    if (z === 'castle') parts.push('Red de grietas ' + (zz.seq.thaw || 0) + '/' + C.zones.castle.heat.network + ' · deshielos ' + (zz.cnt.thaw || 0));
    if (z === 'caverns') parts.push('Miradas del ojo: ' + (zz.cnt.eye || 0));
    if (best) parts.push(S.itemName(z, best.id, best.lvl) + ' ' + best.lvl + '/' + best.nv.level + ' → ' + S.itemDef(z, best.id).names[Math.min(6, S.visualTier(z, best.id, best.nv.level))]);
    var hid = zc(z).itemOrder.filter(function (id) { return !S.isRevealed(st, z, id); });
    if (hid.length) parts.push('Por descubrir: ??? (' + S.revealText(z, hid[0]) + ')');
    return parts.slice(0, 2).join(' · ');
  };

  // ---------- Tienda: filas compactas ordenadas por coste ----------
  UI.updateItems = function (st, z, force) {
    var box = $('items');
    if (!S.isOpen(st, z)) { box.innerHTML = '<p class="muted">Zona sellada: ' + S.unlockText(st, z) + '.</p>'; UI.structKey.items = ''; return; }
    var revealed = zc(z).itemOrder.filter(function (id) { return S.isRevealed(st, z, id); });
    var key = z + ':' + revealed.join(',');
    if (UI.structKey.items !== key) {
      var keepOrder = (UI.freeze.pointer || UI.freeze.focus) && UI.lastOrder && UI.lastOrder.zone === z ? UI.lastOrder.ids : null;
      UI.structKey.items = key;
      box.innerHTML = '';
      if (keepOrder) revealed = keepOrder.filter(function (id) { return revealed.indexOf(id) >= 0; }).concat(revealed.filter(function (id) { return keepOrder.indexOf(id) < 0; }));
      revealed.forEach(function (id) {
        var idx = zc(z).itemOrder.indexOf(id) + 1;
        var row = el('div', 'irow'); row.dataset.id = id;
        row.innerHTML = '<button type="button" class="buy" data-zone="' + z + '" data-item="' + id + '">' +
          '<canvas class="icon" width="24" height="28" aria-hidden="true"></canvas>' +
          '<span class="nm"><b class="name"></b> <span class="lvl"></span><span class="eff"></span></span>' +
          '<span class="price"><span class="cost"></span><span class="gain"></span></span>' +
          '<kbd class="key" title="Tecla ' + idx + '">' + idx + '</kbd></button>' +
          '<button type="button" class="more" aria-expanded="false" aria-label="Detalle y comparación">▸</button>' +
          '<div class="detail" hidden></div>';
        row._tier = -1;
        box.appendChild(row);
        if (UI.openDetails[id]) { row.querySelector('.detail').hidden = false; row.querySelector('.more').textContent = '▾'; row.querySelector('.more').setAttribute('aria-expanded', 'true'); }
      });
      var hidden = zc(z).itemOrder.filter(function (id) { return !S.isRevealed(st, z, id); });
      if (hidden.length) box.appendChild(el('p', 'discover', 'Por descubrir (' + hidden.length + '): ??? — se revela con <b>' + S.revealText(z, hidden[0]) + '</b>'));
    }
    var rows = Array.prototype.slice.call(box.querySelectorAll('.irow'));
    rows.forEach(function (row) { updateRow(st, z, row); });
    if (!UI.freeze.pointer && !UI.freeze.focus) {
      var amt = st.settings.buyAmount;
      var sorted = rows.slice().sort(function (a, b) { return sortKey(st, z, a.dataset.id, amt) - sortKey(st, z, b.dataset.id, amt) || zc(z).itemOrder.indexOf(a.dataset.id) - zc(z).itemOrder.indexOf(b.dataset.id); });
      if (sorted.some(function (r, i) { return r !== rows[i]; })) { var disc = box.querySelector('.discover'); sorted.forEach(function (r) { box.insertBefore(r, disc); }); }
    }
    UI.lastOrder = { zone: z, ids: UI.sortedIds() };
  };
  function sortKey(st, z, id, amt) { var p = S.plan(st, z, id, amt === 'max' ? '1' : amt); return p.capped ? Infinity : p.cost; }
  UI.sortedIds = function () { return Array.prototype.map.call(document.querySelectorAll('#items .irow'), function (r) { return r.dataset.id; }); };

  function itemEffect(st, z, id) {
    var m = S.model(st, z), p = m.parts, it = st.zones[z].items;
    var cyc = function (cid) { return m.cycles.filter(function (c) { return c.id === cid; })[0]; };
    var E = {
      forest: { staff: function () { return fmtRate(p.staff); }, ring: function () { return 'báculo ' + A.fmtMult(p.ringMult); }, robe: function () { return fmtRate(p.robe); }, hood: function () { return 'lluvia ' + A.fmtMult(p.hoodMult); }, spell: function () { return fmtRate(p.spell); }, prism: function () { return fmtRate(p.prism) + ' (' + fmt(p.casts) + ' chispas/s)'; }, orbit: function () { var o = cyc('orbit'); return o ? fmt(o.reward) + ' / ' + A.fmtSec(o.interval) : '—'; }, constellation: function () { var k = cyc('constellation'); return k ? fmt(k.reward) + ' / ' + A.fmtSec(k.interval) : '—'; } },
      jungle: { grimoire: function () { return fmt(p.prune) + ' por poda'; }, robe: function () { return fmtRate(p.robe); }, hat: function () { return 'poda cada ' + A.fmtSec(p.interval); }, collar: function () { return 'poda ' + A.fmtMult(p.collarMult); }, sickle: function () { return '+' + fmt(it.sickle * S.itemDef('jungle', 'sickle').perLevel * S.milestoneMult(it.sickle) * p.collarMult) + ' por poda'; }, pollen: function () { return 'floración ' + A.fmtMult(p.pollenMult); }, graft: function () { var gr = cyc('graft'); return gr ? fmt(gr.reward) + ' / ' + A.fmtSec(gr.interval) : '—'; }, maw: function () { return '+' + fmt(p.mawMult) + ' por floración'; } },
      crypt: { staff: function () { return 'pulso base ' + fmt(p.base); }, vest: function () { return fmtRate(p.vest); }, mitre: function () { return 'Confluencia ' + A.fmtMult(p.mitreMult); }, medallion: function () { return 'pulso ' + A.fmtMult(p.medalMult); }, bell: function () { return 'pulso ' + A.fmtMult(p.bellMult); }, chalk: function () { return 'cada ' + A.fmtSec(p.interval); }, incense: function () { return fmtRate(p.incense); }, litany: function () { var pl = cyc('pulse'); return pl && pl.seq ? fmt(pl.seq.reward) + ' cada ' + pl.seq.every + ' pulsos' : '—'; } },
      castle: { lance: function () { return 'calor ' + fmtRate(p.lanceHeat); }, robe: function () { return fmtRate(p.robe); }, helm: function () { return 'deshielo ' + A.fmtMult(p.helmMult); }, bracer: function () { return 'lanza ' + A.fmtMult(p.bracerMult); }, embers: function () { return 'calor ' + fmtRate(p.emberHeat); }, hammer: function () { return 'grieta ' + fmt(p.crackPay); }, guide: function () { return 'grieta cada ' + A.fmtSec(p.interval); }, phoenix: function () { return 'deshielo ' + fmt(p.thaw.base); } },
      caverns: { mirror: function () { return 'haz ' + fmtRate(p.main); }, robe: function () { return fmtRate(p.robe); }, diadem: function () { return 'haces ' + A.fmtMult(p.diademMult); }, pendant: function () { return 'espejo ' + A.fmtMult(p.pendantMult); }, shards: function () { return p.mirrors + ' espejos · convergencia ' + A.fmtMult(p.convergence); }, lens: function () { return '+' + fmtRate(p.lens) + ' por haz'; }, gaze: function () { return 'ojo abierto ' + A.fmtSec(p.window); }, zenith: function () { return 'ventana ' + A.fmtMult(p.windowMult); } }
    };
    return E[z] && E[z][id] ? E[z][id]() : '';
  }

  // Beneficio de comprar n niveles (usa el cálculo real de la compra: hitos y aportes cruzados incluidos)
  UI.gainText = function (st, z, id, n, full) {
    var pv = S.preview(st, z, id, n), b = pv.before, a = pv.after, parts = [];
    var d = a.prod[z] - b.prod[z];
    if (d > 1e-9) parts.push('+' + fmtRate(d) + (full && b.prod[z] > 0 ? ' (+' + A.fmtPct(d / b.prod[z]) + ' de la zona)' : ''));
    var labels = { 'crypt.pulse': ['pulso', 'cripta'], 'jungle.bloom': ['floración', 'jungla'], 'forest.orbit': ['órbita', 'bosque'], 'castle.thaw': ['deshielo', 'castillo'] };
    Object.keys(labels).forEach(function (k) {
      var zz = k.split('.')[0]; if (zz === z) return;
      var de = (a.events[k] || 0) - (b.events[k] || 0); if (de <= 1e-9) return;
      var dz = a.prod[zz] - b.prod[zz];
      parts.push(full ? labels[k][1] + ' +' + fmt(de) + ' por ' + labels[k][0] + ' (+' + fmtRate(dz) + ')' : labels[k][1] + ' +' + fmt(de) + '/' + labels[k][0]);
    });
    if (!parts.length) {
      if (z === 'forest' && id === 'ring' && !st.zones.forest.items.staff) return 'requiere báculo';
      if (z === 'forest' && id === 'hood' && !st.zones.forest.items.spell) return 'requiere Lluvia';
      if (z === 'crypt' && id === 'mitre' && !st.order.confluence) return 'requiere Confluencia';
      if (z !== 'forest' && st.zones[z].items[FOCUS[z]] < 1) return 'sin ' + zc(z).focusLabel + ' aún';
      return '+0/s';
    }
    return parts.join(' · ');
  };
  // Valor de una compra en producción total ponderada (la de la zona cuenta entera; el resto, a la mitad)
  function gainValue(st, z, id, n) {
    var pv = S.preview(st, z, id, n), v = 0;
    ZONES.forEach(function (zz) { v += (pv.after.prod[zz] - pv.before.prod[zz]) * (zz === z ? 1 : 0.5); });
    return v;
  }
  // Por el mismo gasto, ¿qué daría otra entrada de la zona? (para decidir antes de comprar)
  UI.alternative = function (st, z, id, cost) {
    var mine = gainValue(st, z, id, S.plan(st, z, id, st.settings.buyAmount).n), best = null;
    zc(z).itemOrder.forEach(function (o) {
      if (o === id || !S.isRevealed(st, z, o)) return;
      var def = S.itemDef(z, o), lvl = st.zones[z].items[o], n = Math.min(S.maxAffordable(def, lvl, cost), S.itemCap(z, o) - lvl);
      if (n < 1) return;
      var v = gainValue(st, z, o, n);
      if (!best || v > best.v) best = { id: o, n: n, v: v, cost: S.costFor(def, lvl, n) };
    });
    if (!best || best.v <= mine * 1.05) return null;
    return best;
  };

  function updateRow(st, z, row) {
    var id = row.dataset.id, lvl = st.zones[z].items[id], def = S.itemDef(z, id);
    var tier = S.visualTier(z, id, lvl);
    if (row._tier !== tier) { row._tier = tier; A.Scene.drawIcon(row.querySelector('.icon'), z, id, tier); }
    row.querySelector('.name').textContent = S.itemName(z, id, lvl);
    row.querySelector('.lvl').textContent = 'Nv ' + lvl;
    row.querySelector('.eff').textContent = lvl > 0 ? itemEffect(st, z, id) : def.desc;
    var btn = row.querySelector('.buy'), p = S.plan(st, z, id, st.settings.buyAmount);
    row.classList.toggle('done', p.capped);
    if (p.capped) { btn.disabled = true; btn.classList.remove('ok'); row.querySelector('.cost').textContent = 'Completado'; row.querySelector('.gain').textContent = 'forma final'; }
    else {
      var crossing = S.nextMilestone(lvl) <= lvl + p.n, vis = S.nextVisual(z, id, lvl), visCross = vis && vis.level <= lvl + p.n;
      btn.disabled = !p.affordable; btn.classList.toggle('ok', p.affordable);
      row.querySelector('.cost').innerHTML = '×' + p.n + ' · <b>' + fmt(p.cost) + '</b>';
      var g = UI.gainText(st, z, id, p.n, false);
      row.querySelector('.gain').textContent = (visCross ? '¡evoluciona! ' : crossing ? '¡salto ×' + S.milestoneJump(S.nextMilestone(lvl)) + '! ' : '') + g;
      btn.setAttribute('aria-label', 'Comprar ' + p.n + ' de ' + S.itemName(z, id, lvl) + ' por ' + fmt(p.cost) + ' de ' + zc(z).currency + '. ' + g);
    }
    var det = row.querySelector('.detail');
    if (!det.hidden) det.innerHTML = detailHtml(st, z, id, lvl, p);
  }
  function detailHtml(st, z, id, lvl, p) {
    var def = S.itemDef(z, id), h = '<p>' + def.desc + '</p>';
    h += '<p>Paga: <b class="pay-' + z + '">' + zc(z).currency + '</b>' + (p.capped ? '' : ' · siguiente nivel: ' + fmt(p.nextCost)) + '</p>';
    var vis = S.nextVisual(z, id, lvl), ms = S.visualMilestones(z, id);
    if (!vis) h += '<p class="next">Forma final alcanzada' + (p.capped ? '.' : ' (Nv ' + ms[ms.length - 1] + '). Más niveles siguen dando beneficio económico.') + '</p>';
    else h += '<p class="next">Próxima forma en Nv ' + vis.level + ': <b>' + S.itemName(z, id, vis.level) + '</b> — ' + def.hints[Math.min(def.hints.length - 1, vis.index)] + '.</p>';
    var cap = S.itemCap(z, id), nm = S.nextMilestone(lvl);
    if (isFinite(cap)) h += '<p class="muted">Tope mecánico: Nv ' + cap + '. Hitos visuales: ' + ms.join(' y ') + '.</p>';
    else if (!p.capped) {
      var toM = nm - lvl, mc = S.costFor(def, lvl, toM);
      h += '<p class="muted">Salto económico en Nv ' + nm + ' (×' + S.milestoneJump(nm) + '): faltan ' + toM + ' niveles por ' + fmt(mc) + (toM > p.n ? '' : ' — ¡incluido en esta compra!') + '.</p>';
      if (toM > p.n && toM <= 15) h += '<p>Llegar al Nv ' + nm + ' ahora (' + toM + ' niveles): ' + UI.gainText(st, z, id, toM, true) + '</p>';
    }
    if (!p.capped) {
      h += '<p>Con esta compra (×' + p.n + '): <b>' + UI.gainText(st, z, id, p.n, true) + '</b></p>';
      var alt = UI.alternative(st, z, id, p.cost);
      if (alt) h += '<p class="alt">Por el mismo gasto: <b>' + S.itemName(z, alt.id, st.zones[z].items[alt.id]) + ' ×' + alt.n + '</b> daría ' + UI.gainText(st, z, alt.id, alt.n, false) + '.</p>';
    }
    return h;
  }

  // ---------- MESA REDONDA: Ecos, refundar, mejoras de la orden, talentos, hazañas ----------
  UI.updateTable = function (st, force) {
    var cv = $('table-cv');
    if (cv && cv.parentNode.clientWidth && cv._fitW !== cv.parentNode.clientWidth) { cv._fitW = cv.parentNode.clientWidth; UI.fitTable(); }
    var e = S.echoInfo(st), reach = nextTalent(st);
    $('echo-summary').innerHTML =
      (S.canPrestige(st) ? '<p>Refundar ahora: <span class="big-num">' + ecos(e.gain) + '</span> (' + e.base + ' por maná generado + ' + e.feats + ' por hazañas)</p>'
        : '<p>Refundar: ' + fmt(e.total) + ' / ' + fmt(C.prestige.goalTotal) + ' de maná generado (' + Math.floor(e.total / C.prestige.goalTotal * 100) + ' %)' + (S.isOpen(st, 'crypt') ? '' : ' · requiere abrir la cripta') + '</p>') +
      '<p class="muted">Siguiente Eco con ' + fmt(e.toNext) + ' más · Tienes ' + ecos(st.prestige.echoes, true) + '.' + (e.raw > e.base ? ' Los Ecos maduran con el ciclo: ahora como máximo ' + e.cap + ' (1 cada ' + C.prestige.maturityMinutes + ' min); el maná ya daría ' + e.raw + '.' : '') + '</p>' +
      (reach ? '<p>Talento al alcance: <b>' + reach.name + '</b> (' + reach.cost + ' Ecos' + (reach.missing > 0 ? ', te faltan ' + reach.missing : ' — ya puedes comprarlo') + ')</p>' : '') +
      '<p class="next">Siguiente objetivo: ' + UI.nextObjective(st) + '</p>';
    UI.updatePrestige(st, force);
    UI.updateOrder(st, force);
    UI.updateTalents(st, force);
    UI.updateFeats(st);
  };
  UI.fitTable = function () {
    var cv = $('table-cv'); if (!cv || !cv.parentNode.clientWidth) return;
    var w = cv.parentNode.clientWidth, h = root.innerHeight * 0.45, s = Math.max(1, Math.min(3, Math.floor(Math.min(w / cv.width, h / cv.height))));
    cv.style.width = (cv.width * s) + 'px'; cv.style.height = (cv.height * s) + 'px';
  };
  function nextTalent(st) {
    var best = null;
    C.talentOrder.forEach(function (id) {
      var d = C.talents[id], lvl = st.prestige.talents[id];
      if (lvl >= d.maxLevel || !S.talentReqMet(st, id)) return;
      var cost = S.talentCost(id, lvl), gain = S.canPrestige(st) ? S.echoInfo(st).gain : 0;
      var missing = Math.max(0, cost - st.prestige.echoes - gain);
      if (!best || missing < best.missing || (missing === best.missing && cost < best.cost)) best = { id: id, name: d.name, cost: cost, missing: Math.max(0, cost - st.prestige.echoes) };
    });
    return best;
  }
  // El siguiente objetivo visible: por qué vale la pena otro ciclo
  UI.nextObjective = function (st) {
    var f = C.feats.filter(function (x) { return !S.featDone(st, x); })[0];
    if (f) { var pr = S.featProgress(st, f); return 'hazaña «' + f.name + '» (' + Math.min(pr.have, pr.need) + '/' + pr.need + ', +' + f.echoes + ' Eco' + (f.echoes > 1 ? 's' : '') + ' al refundar)'; }
    var t = C.talentOrder.filter(function (id) { return C.talents[id].req && !S.talentReqMet(st, id); })[0];
    if (t) { var r = S.talentReqProgress(st, t); return 'dominio para «' + C.talents[t].name + '»: ' + r.text + ' (' + r.have + '/' + r.need + ')'; }
    var nt = nextTalent(st);
    return nt ? 'reunir ' + nt.cost + ' Ecos para «' + nt.name + '»' : 'todas las hazañas y dominios cumplidos';
  };

  UI.updatePrestige = function (st, force) {
    var box = $('mesa-refundar');
    if (force || UI.structKey.prestige !== 'p') {
      UI.structKey.prestige = 'p';
      box.innerHTML = '<h3>Refundar la Orden</h3><div id="pr-status"></div><button type="button" class="primary" id="btn-prestige">Refundar la Orden…</button>';
    }
    var c = S.runContrib(st), goal = C.prestige.goalTotal, e = S.echoInfo(st), w = C.prestige.weights;
    $('pr-status').innerHTML = '<ul class="list"><li>' + (S.isOpen(st, 'crypt') ? '✓' : '✗') + ' Explorar la Cripta de las Campanas</li>' +
      '<li>' + (c.total >= goal ? '✓' : '✗') + ' Generar ' + fmt(goal) + ' de maná en este ciclo: <b>' + fmt(c.total) + '</b></li></ul>' +
      '<div class="bar"><i style="width:' + Math.min(100, c.total / goal * 100) + '%"></i></div>' +
      '<p class="muted">Aporte por zona: ' + ZONES.filter(function (z) { return c[z] > 0 || S.isOpen(st, z); }).map(function (z) { return zc(z).short + ' <b>' + fmt(c[z]) + '</b>' + (w[z] !== 1 ? ' (×' + String(w[z]).replace('.', ',') + ')' : ''); }).join(' · ') + '. Cuenta el maná <b>generado</b>: comprar nunca reduce la recompensa.</p>' +
      '<p>Ecos al refundar ahora: <span class="big-num">' + e.gain + '</span>' + (e.feats ? ' (incluye ' + e.feats + ' de hazañas)' : '') + '</p>';
    $('btn-prestige').disabled = !S.canPrestige(st) || !!G.refounding;
  };

  UI.updateOrder = function (st, force) {
    var box = $('mesa-orden'), key = 'o:' + ZONES.map(function (z) { return S.isOpen(st, z); }).join(',');
    if (force || UI.structKey.order !== key) {
      UI.structKey.order = key;
      box.innerHTML = '<h3>Mejoras de la Orden · solo este ciclo</h3><p class="muted small">Duran hasta refundar. Cada una conecta dos magos en una sola dirección y dice qué saldo la paga.</p>';
      C.orderOrder.forEach(function (id) {
        var d = C.order[id], card = el('div', 'card'); card.dataset.id = id;
        card.innerHTML = '<h4><span>' + d.name + '</span><span class="lvl"></span></h4><p class="eff">' + d.desc + '</p><p class="meta"></p><div class="explain"></div>' +
          '<button type="button" class="buy wide" data-order="' + id + '"><span class="cost"></span><span class="pay"></span></button>';
        box.appendChild(card);
      });
    }
    Array.prototype.forEach.call(box.querySelectorAll('.card'), function (card) { updateOrderCard(st, card); });
  };
  function updateOrderCard(st, card) {
    var id = card.dataset.id, d = C.order[id], lvl = st.order[id], max = lvl >= d.maxLevel, open = S.orderAvailable(st, id);
    card.classList.toggle('locked', !open);
    card.querySelector('.lvl').textContent = 'Nv ' + lvl + '/' + d.maxLevel;
    var cost = S.orderCost(id, lvl), z = st.zones[d.pays];
    card.querySelector('.meta').innerHTML = 'Duración: <b>este ciclo</b> · Moneda: <b class="pay-' + d.pays + '">' + zc(d.pays).currency + '</b> · Condición: ' + d.needs.map(function (n) { return zc(n).name + (S.isOpen(st, n) ? ' ✓' : ' (sellada)'); }).join(', ') + (d.needsItem ? ' · requiere ' + S.itemDef(d.needsItem[0], d.needsItem[1]).names[0] : '');
    var ex = card.querySelector('.explain'), html = '', src = S.crossSources(st);
    if (!open) html = 'Se desbloquea al abrir ' + d.needs.map(function (n) { return zc(n).name; }).join(' y ') + '.';
    else if (d.to) {
      var srcVal = { confluence: src.forest, pollen: src.forestSpell, rootstar: src.jungle, requiem: src.crypt }[id];
      var ev = { confluence: 'crypt.pulse', pollen: 'jungle.bloom', rootstar: 'forest.orbit', requiem: 'castle.thaw' }[id];
      var evName = { confluence: 'pulso de la cripta', pollen: 'floración', rootstar: 'descarga de la Órbita', requiem: 'deshielo' }[id];
      var lp = st.last[ev];
      html = 'Fuente: ' + zc(d.from).short + ' produce (propio) <b>' + fmtRate(srcVal) + '</b>.';
      if (lvl > 0 && lp) html += '<br><b>Nv ' + lvl + ':</b> último ' + evName + ': ' + fmt(lp.base) + ' + ' + fmt(lp.cross) + ' = <b>' + fmt(lp.reward) + '</b>.';
      if (!max) {
        var first = Object.keys(st.zones[d.to].items)[0];
        st.order[id]++; var after = S.preview(st, d.to, first, 0).after; st.order[id]--;
        var before = S.preview(st, d.to, first, 0).before;
        html += '<br><b>Con Nv ' + (lvl + 1) + ':</b> ' + d.seconds[lvl + 1] + ' s × ' + fmtRate(srcVal) + (S.pactMult(st) > 1 ? ' × Pacto' : '') + ' por ' + evName + ' · ' + fmt(before.events[ev] || 0) + ' → <b>' + fmt(after.events[ev] || 0) + '</b> · media de ' + zc(d.to).short + ' ' + fmtRate(before.prod[d.to]) + ' → <b>' + fmtRate(after.prod[d.to]) + '</b>';
        if (!S.orderUseful(st, id)) html += '<br><i>Aún sin efecto: necesitas ' + S.itemDef(d.needsItem[0], d.needsItem[1]).names[0] + '.</i>';
      }
    } else {
      var fNow = S.forestBreakdown(st).staff, pNow = S.pulseBreakdown(st).base;
      st.order.resonance++; var fN = S.forestBreakdown(st).staff, pN = S.pulseBreakdown(st).base; st.order.resonance--;
      html = 'Multiplicador actual de ambos báculos: <b>' + A.fmtMult(S.resonanceMult(st)) + '</b>.';
      if (!max) html += '<br><b>Con Nv ' + (lvl + 1) + ':</b> báculo del bosque ' + fmtRate(fNow) + ' → <b>' + fmtRate(fN) + '</b> · pulso base ' + fmt(pNow) + ' → <b>' + fmt(pN) + '</b>';
    }
    ex.innerHTML = html;
    var btn = card.querySelector('.buy');
    btn.disabled = !open || max || z.mana + 1e-9 < cost;
    btn.classList.toggle('ok', !btn.disabled);
    btn.querySelector('.cost').textContent = max ? 'Nivel máximo' : fmt(cost);
    var pay = btn.querySelector('.pay'); pay.textContent = max ? '' : 'paga: ' + zc(d.pays).currency + ' (tienes ' + fmt(z.mana) + ')'; pay.className = 'pay pay-' + d.pays;
  }

  UI.updateTalents = function (st, force) {
    var box = $('mesa-talentos');
    if (force || UI.structKey.talents !== 't') {
      UI.structKey.talents = 't';
      box.innerHTML = '<h3>Talentos permanentes · <span id="pr-echoes"></span> Ecos</h3><p class="muted small">Se compran con Ecos y duran para siempre. Los avanzados piden un dominio previo.</p><div id="talents"></div>';
      var tb = box.querySelector('#talents');
      C.talentOrder.forEach(function (id) {
        var d = C.talents[id], card = el('div', 'card' + (d.tier ? ' advanced' : '')); card.dataset.id = id;
        card.innerHTML = '<h4><span>' + d.name + (d.tier ? ' <small class="tag">avanzado</small>' : '') + '</span><span class="lvl"></span></h4><p class="eff">' + d.desc + '</p>' +
          '<p class="req"></p><p class="next">En la próxima partida: ' + d.nextRun + '</p>' +
          '<button type="button" class="buy wide" data-talent="' + id + '"><span class="cost"></span><span class="gain"></span></button>';
        tb.appendChild(card);
      });
    }
    $('pr-echoes').textContent = fmt(st.prestige.echoes);
    Array.prototype.forEach.call(box.querySelectorAll('#talents .card'), function (card) {
      var id = card.dataset.id, d = C.talents[id], lvl = st.prestige.talents[id], max = lvl >= d.maxLevel, cost = S.talentCost(id, lvl), btn = card.querySelector('.buy'), req = S.talentReqProgress(st, id), met = S.talentReqMet(st, id);
      card.querySelector('.lvl').textContent = 'Nv ' + lvl + (d.maxLevel > 1 ? '/' + d.maxLevel : '');
      card.querySelector('.req').innerHTML = req ? (met ? '✓ ' : '🔒 ') + 'Requisito: ' + req.text + ' (' + req.have + '/' + req.need + ')' : '';
      card.querySelector('.req').hidden = !req;
      btn.disabled = max || !met || st.prestige.echoes < cost; btn.classList.toggle('ok', !btn.disabled);
      btn.querySelector('.cost').textContent = max ? 'Aprendido' : !met ? 'Bloqueado · ' + cost + ' Ecos' : cost + ' Ecos';
      btn.querySelector('.gain').textContent = lvl ? 'activo' : '';
    });
  };
  UI.updateFeats = function (st) {
    var box = $('mesa-hazanas');
    var feats = C.feats.map(function (f) { var pr = S.featProgress(st, f), done = S.featDone(st, f); return '<li>' + (done ? '✓' : '·') + ' ' + f.name + ' — <b>+' + f.echoes + ' Eco' + (f.echoes > 1 ? 's' : '') + '</b> al refundar' + (done ? '' : ' (' + Math.min(pr.have, pr.need) + '/' + pr.need + ')') + '</li>'; }).join('');
    var rec = st.records || {};
    var cyc = st.run.playTime, need = C.featMinCycle;
    box.innerHTML = '<h3>Hazañas de este ciclo</h3><p class="muted small">Suman Ecos al refundar si el ciclo dura al menos ' + Math.round(need / 60) + ' min (llevas ' + A.fmtTime(cyc) + (cyc >= need ? ' ✓' : '; ahora sumarían 0 de ' + S.featEchoesPending(st)) + '). Recompensan quedarse a explorar el castillo y las cavernas.</p><ul class="list">' + feats + '</ul>' +
      '<h3>Dominios (permanentes)</h3><ul class="list"><li>Lluvia de Chispas máxima: Nv ' + (rec.spellMax || 0) + '</li><li>Más deshielos en un ciclo: ' + (rec.thawsMax || 0) + '</li><li>Cinco mejoras de la Orden a la vez: ' + (rec.allOrders ? 'sí' : 'aún no') + '</li><li>Refundaciones: ' + st.prestige.resets + '</li><li>Cavernas descubiertas: ' + (rec.cavernsSeen ? 'sí' : 'aún no') + '</li></ul>';
  };

  UI.updateGame = function (st) {
    $('opt-reduced').checked = G.reduced;
    var ok = A.Save.storageOk;
    $('save-status').textContent = G.noOverwrite ? 'Guardado automático en pausa para no sobrescribir tu partida original (ver aviso). Exporta antes de continuar.'
      : ok === false ? 'El navegador no permite guardar en este modo (archivo local o modo privado). La sesión sigue jugable: usa «Exportar JSON» para conservar la partida.'
        : 'La partida se guarda sola cada ' + C.autosaveSeconds + ' s y al cerrar. Último guardado: ' + (G.lastSaved ? new Date(G.lastSaved).toLocaleTimeString('es') : '—') + '.';
    var vers = [1, 2].filter(function (v) { return A.Save.readBackup(v); });
    $('backup-row').hidden = !vers.length;
    var bb = $('backup-buttons'), want = vers.join(',');
    if (bb.dataset.v !== want) { bb.dataset.v = want; bb.innerHTML = vers.map(function (v) { return '<button type="button" data-backup="' + v + '">Exportar copia v0.' + v + '</button>'; }).join(' '); }
  };

  // ---------- Diálogos ----------
  UI.modal = function (html, buttons) {
    var d = $('modal');
    $('modal-body').innerHTML = html;
    var act = $('modal-actions'); act.innerHTML = '';
    buttons.forEach(function (b) {
      var btn = el('button', b.cls || '', b.label); btn.type = 'button'; if (b.id) btn.id = b.id;
      btn.addEventListener('click', function () { if (b.keep && b.fn) { b.fn(btn); return; } if (btn.dataset.used) return; btn.dataset.used = '1'; d.close(); if (b.fn) b.fn(); });
      act.appendChild(btn);
    });
    if (d.open) d.close();
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    var first = act.querySelector('button:last-child'); if (first) first.focus();
  };
  UI.confirm = function (html, okLabel, fn, danger) { UI.modal(html, [{ label: 'Cancelar' }, { label: okLabel, cls: danger ? 'danger' : 'primary', fn: fn }]); };
  UI.modalOpen = function () { return $('modal').open; };

  // Antes de confirmar: qué ganas, qué pierdes y qué conservas
  UI.confirmPrestige = function () {
    var st = G.state; if (!S.canPrestige(st) || G.refounding) return;
    var e = S.echoInfo(st), opened = ZONES.filter(function (z) { return S.isOpen(st, z); });
    var featsDone = C.feats.filter(function (f) { return S.featDone(st, f); });
    var rl = st.prestige.talents.relics || 0;
    UI.confirm('<h2>Refundar la Orden</h2>' +
      '<p><b>Ganarás:</b> <span class="big-num">' + ecos(e.gain) + '</span> (' + e.base + ' por ' + fmt(e.total) + ' de maná generado' + (featsDone.length ? ' + ' + e.feats + ' por hazañas: ' + featsDone.map(function (f) { return f.name; }).join(', ') : '') + '). Tendrás ' + (st.prestige.echoes + e.gain) + '.</p>' +
      '<p><b>Perderás (se reinicia):</b></p><ul class="list"><li>Maná y entradas de ' + opened.map(function (z) { return zc(z).short; }).join(', ') + '.</li><li>Las mejoras de la Orden de este ciclo.</li><li>Las zonas vuelven a sellarse y reabren con sus condiciones.</li></ul>' +
      '<p><b>Conservarás:</b></p><ul class="list"><li>Ecos y talentos permanentes.</li><li>Dominios y maestría de Chispa.</li>' + (rl ? '<li>Reliquias: ' + rl * C.talents.relics.perLevel + ' s de la producción de cada zona abierta.</li>' : '') + '<li>Ajustes y número de refundaciones (' + (st.prestige.resets + 1) + ' tras esta).</li></ul>' +
      '<p class="muted">Verás a tus magos vencer a sus jefes. Puedes omitir la escena: la recompensa se entrega una sola vez al confirmar.</p>', 'Refundar ahora', function () { G.prestige(); });
  };

  // Secuencia de refundación: portales de las zonas abiertas; cada mago lanza su ataque culminante y su jefe cae.
  // El cambio de estado ya ocurrió (y se guardó) antes: omitir, recargar o repetir no cambia la recompensa.
  UI.playRefound = function (oldState, result) {
    var box = $('refound'), wrap = $('refound-portals'), reduced = G.reduced;
    wrap.innerHTML = '';
    var zones = result.opened, canvases = {};
    zones.forEach(function (z) {
      var cell = el('div', 'rf-cell', '<canvas width="216" height="124"></canvas><p>' + zc(z).mageName + ' vs ' + { forest: 'Ciervo Hueco', jungle: 'Reina Injerto', crypt: 'Rey sin Réquiem', castle: 'Regente de Escarcha', caverns: 'Corazón de la Caldera' }[z] + '</p>');
      wrap.appendChild(cell); canvases[z] = cell.querySelector('canvas');
      if (!reduced) A.Scene.culminate(z, oldState);
    });
    $('refound-text').textContent = '+' + ecos(result.gained) + '. Los jefes caen y los portales se apagan…';
    box.hidden = false;
    var cols = Math.min(zones.length, root.innerWidth < 700 ? 1 : 3), s = Math.max(1, Math.min(2, Math.floor((root.innerWidth - 60) / cols / 216)));
    Object.keys(canvases).forEach(function (z) { canvases[z].style.width = 216 * s + 'px'; canvases[z].style.height = 124 * s + 'px'; });
    $('refound-skip').focus();
    var t0 = performance.now(), dur = reduced ? 1500 : 4200, buf = document.createElement('canvas'); buf.width = 256; buf.height = 144;
    var bg = buf.getContext('2d'); bg.imageSmoothingEnabled = false;
    UI.refoundRunning = true;
    function step(now) {
      if (!UI.refoundRunning) return;
      var el2 = now - t0, wall = Date.now();
      zones.forEach(function (z, i) {
        var local = Math.max(0, el2 - i * (reduced ? 0 : 250)), d = reduced ? Math.min(1, local / dur) : Math.max(0, Math.min(1, (local - 1500) / 1800));
        A.Scene.drawZone(bg, z, oldState, wall / 1000, true, { defeat: d });
        var cr = A.Scene.portalCrop[z], g2 = canvases[z].getContext('2d'); g2.imageSmoothingEnabled = false;
        g2.fillStyle = '#000'; g2.fillRect(0, 0, 216, 124);
        g2.drawImage(buf, cr.x, cr.y, 216, 124, 0, 0, 216, 124);
      });
      if (el2 >= dur + (reduced ? 0 : zones.length * 250)) { UI.endRefound(); return; }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };
  UI.endRefound = function () {
    if (!UI.refoundRunning && $('refound').hidden) return;
    UI.refoundRunning = false;
    $('refound').hidden = true;
    if (G.afterRefound) { var f = G.afterRefound; G.afterRefound = null; f(); }
  };

  UI.confirmWipe = function () {
    var st = G.state;
    UI.modal('<h2>Empezar desde cero</h2><p>Esto <b>no es refundar</b>: borra la partida completa, incluidos <b>' + ecos(st.prestige.echoes, true) + '</b>, los talentos aprendidos (' + (C.talentOrder.filter(function (id) { return st.prestige.talents[id] > 0; }).map(function (id) { return C.talents[id].name; }).join(', ') || 'ninguno') + '), los dominios y la maestría.</p>' +
      '<p>Te recomendamos exportar antes.</p><label class="check"><input type="checkbox" id="wipe-ok"> Entiendo que pierdo Ecos y talentos</label><p class="muted" id="wipe-msg"></p>',
      [{ label: 'Exportar antes', keep: true, fn: function () { UI.exportFile(); $('wipe-msg').textContent = 'Exportado. Ahora puedes confirmar.'; } },
       { label: 'Cancelar' },
       { label: 'Empezar desde cero', cls: 'danger', id: 'wipe-confirm', keep: true, fn: function () { if (!$('wipe-ok').checked) { $('wipe-msg').textContent = 'Marca la casilla para confirmar.'; return; } $('modal').close(); G.wipe(); } }]);
  };

  UI.offlineReport = function (rep) {
    var st = G.state, names = { forest: 'El aprendiz', jungle: 'La herborista', crypt: 'La maga', castle: 'El lancero', caverns: 'La maga glaciar' }, cnt = rep.counts || {};
    var words = { pulse: 'pulsos', litany: 'letanías', prune: 'podas', bloom: 'floraciones', graft: 'injertos', orbit: 'órbitas', constellation: 'constelaciones', crack: 'grietas', thaw: 'deshielos', eye: 'miradas del ojo' };
    var html = '<h2>Mientras no estabas</h2><p>Pasaron ' + A.fmtTime(rep.rawSeconds) + (rep.capped ? ' (se acreditan como máximo 8 h)' : '') + '.</p><ul class="list">';
    ZONES.forEach(function (z) {
      if (!S.isOpen(st, z)) return;
      var c = cnt[z] || {}, extra = Object.keys(c).filter(function (k) { return words[k]; }).map(function (k) { return fmt(c[k]) + ' ' + words[k]; });
      var cr = rep.crossTotals || {}, ck = { crypt: 'crypt.pulse', jungle: 'jungle.bloom', forest: 'forest.orbit', castle: 'castle.thaw' }[z];
      html += '<li><b>' + names[z] + '</b> generó <b class="pay-' + z + '">' + fmt(rep.zones[z] || 0) + '</b> de ' + zc(z).currency + (extra.length ? ': ' + extra.join(', ') : '') + (ck && cr[ck] ? ' (incluye ' + fmt(cr[ck]) + ' de aportes de la Orden)' : '') + '.</li>';
    });
    html += '</ul>';
    if (rep.legacy) html += '<p class="muted">Tu partida viene de una versión anterior (v0.' + (st.flags.migratedFrom || 1) + '): el tiempo previo a la actualización solo acredita lo que ya existía (sin contenido nuevo retroactivo).</p>';
    if (rep.unlocked && rep.unlocked.length) html += '<p><b>Se abrió: ' + rep.unlocked.map(function (z) { return zc(z).name; }).join(', ') + '.</b></p>';
    UI.modal(html, [{ label: 'Continuar', cls: 'primary' }]);
  };

  // ---------- Exportar / importar ----------
  function download(text, name) {
    try { var blob = new Blob([text], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); return true; }
    catch (e) { $('import-text').value = text; return false; }
  }
  UI.exportFile = function () { G.saveNow(); var ok = download(A.Save.exportText(G.state), 'orden-del-umbral-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'); UI.log(ok ? 'Partida exportada como archivo JSON.' : 'No se pudo descargar: el JSON está en el cuadro de texto.'); };
  UI.exportBackup = function (v) { var raw = A.Save.readBackup(v || 1); if (!raw) return; download(raw, 'orden-del-umbral-respaldo-v0.' + (v || 1) + '.json'); UI.log('Copia del guardado v0.' + (v || 1) + ' exportada tal cual.'); };
  UI.exportRaw = function (raw) { download(raw, 'orden-del-umbral-original.json'); };
  UI.copyExport = function () {
    var text = A.Save.exportText(G.state); $('import-text').value = text;
    var done = function () { UI.log('Partida copiada al portapapeles.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { $('import-text').select(); UI.log('Selecciona y copia el texto del cuadro.'); });
    else { $('import-text').select(); try { document.execCommand('copy'); done(); } catch (e) { UI.log('Copia el texto del cuadro manualmente.'); } }
  };
  UI.importText = function (text) {
    var msg = $('import-msg'), r = A.Save.parse(text || '');
    if (!r.ok) { msg.textContent = 'No se importó (tu partida actual sigue intacta): ' + r.errors.slice(0, 4).join(' · '); return; }
    var s = r.state;
    UI.confirm('<h2>Importar partida</h2><p>El guardado es válido' + (r.migratedFrom ? ' (formato v0.' + r.migratedFrom + ', se migrará)' : '') + ':</p><ul class="list">' +
      ZONES.map(function (z) { return '<li>' + zc(z).name + ': ' + (S.isOpen(s, z) ? fmt(s.zones[z].mana) + ' · ' + fmtRate(S.zoneProd(s, z)) : 'sellada') + '</li>'; }).join('') +
      '<li>Ecos: ' + fmt(s.prestige.echoes) + ' · refundaciones: ' + s.prestige.resets + '</li></ul><p>¿Reemplazar la partida actual? (No se acredita tiempo offline al importar.)</p>', 'Reemplazar', function () { G.replaceState(s); msg.textContent = 'Partida importada correctamente.'; });
  };

  // ---------- Registro y anuncios ----------
  UI.log = function (html) { var box = $('log'), p = el('p', '', html); box.insertBefore(p, box.firstChild); while (box.childNodes.length > 8) box.removeChild(box.lastChild); };
  var bannerTimer = null, bannerQueue = [];
  UI.banner = function (html, ms) {
    var b = $('banner');
    if (!b.hidden && bannerTimer) { if (bannerQueue.length < 4) bannerQueue.push([html, ms]); return; }
    b.innerHTML = html; b.hidden = false; clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { b.hidden = true; bannerTimer = null; var n = bannerQueue.shift(); if (n) UI.banner(n[0], n[1]); }, ms || 3500);
  };
  UI.clearBanners = function () { bannerQueue = []; clearTimeout(bannerTimer); bannerTimer = null; $('banner').hidden = true; };
  UI.notice = function (html) { var n = $('notice'); if (!html) { n.hidden = true; return; } n.innerHTML = html; n.hidden = false; };
})(typeof window !== 'undefined' ? window : globalThis);
