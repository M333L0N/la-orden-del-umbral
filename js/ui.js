/* La Orden del Umbral — interfaz HTML (textos, tienda, Sala de la Orden, paneles, diálogos). */
(function (root) {
  'use strict';
  var A = root.Arcane = root.Arcane || {};
  var C = A.CONFIG, S = A.Sim;
  var UI = A.UI = {};
  var G;
  var ZONES = C.zoneOrder;
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Formato de números en español ----------
  var SUFFIX = [[1e15, ' mil B'], [1e12, ' B'], [1e9, ' mil M'], [1e6, ' M'], [1e3, ' K']];
  A.fmt = function (n) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '-' + A.fmt(-n);
    if (n >= 1e18) return n.toExponential(2).replace('.', ',');
    for (var i = 0; i < SUFFIX.length; i++) {
      if (n >= SUFFIX[i][0] * 0.9995) {
        var v = Math.max(1, n / SUFFIX[i][0]);
        var t = v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0);
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
  var fmt = A.fmt, fmtRate = A.fmtRate;
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; }
  function zc(z) { return C.zones[z]; }

  // ---------- Inicio ----------
  UI.init = function (game) {
    G = game;
    UI.structKey = {};
    document.querySelectorAll('.tab').forEach(function (t) { t.addEventListener('click', function () { UI.showPanel(t.dataset.panel); }); });
    document.querySelectorAll('.amt').forEach(function (b) { b.addEventListener('click', function () { G.setAmount(b.dataset.amt); }); });
    $('btn-room').addEventListener('click', function () { G.openRoom(); });
    ZONES.forEach(function (z) { $('bal-' + z).addEventListener('click', function () { G.openZone(z); }); });
    $('cast').addEventListener('click', function () { G.cast(); });
    $('btn-save').addEventListener('click', function () { G.saveNow(true); });
    $('btn-export').addEventListener('click', UI.exportFile);
    $('btn-copy').addEventListener('click', UI.copyExport);
    $('btn-import').addEventListener('click', function () { UI.importText($('import-text').value); });
    $('btn-backup').addEventListener('click', UI.exportBackup);
    $('import-file').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { $('import-text').value = r.result; UI.importText(r.result); }; r.readAsText(f);
    });
    $('opt-reduced').addEventListener('change', function (e) { G.setReduced(e.target.checked); });
    $('btn-wipe').addEventListener('click', UI.confirmWipe);
    $('anomaly-btn').addEventListener('click', function () { G.dispelAnomaly(); });
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
    $('panel-order').addEventListener('click', function (e) { var b = e.target.closest('button[data-order]'); if (b) G.buyOrder(b.dataset.order); });
    $('panel-prestige').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-talent]'); if (b) G.buyTalent(b.dataset.talent);
      if (e.target.closest('#btn-prestige')) UI.confirmPrestige();
    });
    $('portals').addEventListener('click', function (e) { var b = e.target.closest('[data-portal]'); if (b) G.openZone(b.dataset.portal); });
  };
  UI.freeze = { pointer: false, focus: false };
  UI.openDetails = {};

  UI.showPanel = function (p) {
    G.panel = p;
    document.querySelectorAll('.tab').forEach(function (t) { t.setAttribute('aria-selected', t.dataset.panel === p ? 'true' : 'false'); });
    ['items', 'order', 'prestige', 'game'].forEach(function (id) { $('panel-' + id).hidden = id !== p; });
    UI.structKey = {};
    UI.update(true);
  };

  // ---------- Vista: Sala o detalle ----------
  UI.applyView = function () {
    var room = G.view === 'room';
    $('room').hidden = !room; $('detail').hidden = room;
    $('btn-room').setAttribute('aria-pressed', room);
    document.body.dataset.zone = room ? 'room' : G.zone;
    if (room) UI.buildRoom(true);
  };
  UI.buildRoom = function (force) {
    var st = G.state, box = $('portals');
    var open = ZONES.filter(function (z) { return S.isOpen(st, z); });
    var key = open.join(',');
    if (!force && UI.structKey.room === key) return;
    UI.structKey.room = key;
    A.Scene.detachPortals();
    box.innerHTML = '';
    box.dataset.count = open.length;
    open.forEach(function (z) {
      var cell = el('div', 'portal portal-' + z);
      cell.innerHTML = '<button type="button" class="portal-btn" data-portal="' + z + '" aria-label="Entrar en ' + zc(z).name + '"><canvas class="portal-cv"></canvas></button>' +
        '<div class="portal-info"><h3>' + zc(z).name + '</h3><p class="p-mana"></p><p class="p-rate"></p><p class="p-hint"></p></div>';
      box.appendChild(cell);
      A.Scene.attachPortal(z, cell.querySelector('canvas'));
    });
    var locked = ZONES.filter(function (z) { return !S.isOpen(st, z); });
    if (locked.length) box.appendChild(el('div', 'portal portal-locked', '<div class="portal-sealed">' + locked.map(function (z) { return '<p><b>Portal sellado</b> · ' + unlockText(st, z) + '</p>'; }).join('') + '</div>'));
    UI.fitPortals();
  };
  function unlockText(st, z) {
    return 'se abrirá cuando el bosque produzca ' + fmt(S.unlockRule(z)) + '/s (ahora ' + fmt(S.zoneOwnProd(st, 'forest')) + '/s)';
  }
  UI.fitPortals = function () {
    document.querySelectorAll('.portal-cv').forEach(function (cv) {
      var w = cv.parentNode.parentNode.clientWidth - 4, s = Math.floor(w / cv.width);
      if (s >= 1 && w > 0) { cv.style.width = (cv.width * s) + 'px'; cv.style.height = (cv.height * s) + 'px'; }
      else { cv.style.width = '100%'; cv.style.height = 'auto'; }
    });
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
    document.body.classList.toggle('zone-crypt', G.view !== 'room' && z === 'crypt');
    document.body.classList.toggle('zone-jungle', G.view !== 'room' && z === 'jungle');
    ZONES.forEach(function (zid) {
      var open = S.isOpen(st, zid), b = $('bal-' + zid);
      b.classList.toggle('locked', !open);
      b.classList.toggle('active', G.view !== 'room' && zid === z);
      b.setAttribute('aria-pressed', G.view !== 'room' && zid === z);
      $('mana-' + zid).textContent = open ? fmt(st.zones[zid].mana) : 'Sellada';
      var focus = { forest: 'staff', jungle: 'grimoire', crypt: 'staff' }[zid];
      $('rate-' + zid).textContent = !open ? Math.floor(Math.min(100, S.zoneOwnProd(st, 'forest') / S.unlockRule(zid) * 100)) + ' %'
        : (st.zones[zid].items[focus] > 0 || zid === 'forest' ? fmtRate(S.zoneProd(st, zid)) : 'sin ' + zc(zid).focusLabel);
    });
    var showE = st.prestige.echoes > 0 || st.prestige.resets > 0 || S.canPrestige(st);
    $('bal-echoes').hidden = !showE; $('echoes').textContent = fmt(st.prestige.echoes);
    if (G.view === 'room') { updateRoom(st); return; }

    $('zone-name').textContent = zc(z).name;
    var goals = UI.goals(st, z);
    $('goal').textContent = goals[0]; $('goal-sub').textContent = goals[1] || '';
    $('cast-label').textContent = zc(z).manualName;
    $('cast-gain').textContent = '+' + fmt(S.manualValue(st, z));
    $('zone-stats').innerHTML = UI.zoneStats(st, z);
    setDot(document.querySelector('.tab[data-panel="order"]'), C.orderOrder.some(function (id) { return S.orderAvailable(st, id) && st.order[id] === 0 && S.orderUseful(st, id) && st.zones[C.order[id].pays].mana >= S.orderCost(id, 0); }));
    setDot(document.querySelector('.tab[data-panel="prestige"]'), S.canPrestige(st) || st.prestige.echoes >= minTalentCost(st));
    document.querySelectorAll('.amt').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.amt === st.settings.buyAmount ? 'true' : 'false'); });
    if (G.panel === 'items') UI.updateItems(st, z, force);
    else if (G.panel === 'order') UI.updateOrder(st, force);
    else if (G.panel === 'prestige') UI.updatePrestige(st, force);
    else UI.updateGame(st);
  };
  function setDot(tab, on) { var d = tab.querySelector('.dot'); if (on && !d) tab.appendChild(el('span', 'dot')); if (!on && d) d.remove(); }
  function minTalentCost(st) { var m = Infinity; C.talentOrder.forEach(function (id) { if (st.prestige.talents[id] < C.talents[id].maxLevel) m = Math.min(m, S.talentCost(id, st.prestige.talents[id])); }); return m; }

  UI.zoneStats = function (st, z) {
    var m = S.model(st, z), p = m.parts, avg = S.zoneProd(st, z), s;
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
      s = 'Poda: <b>' + fmt(p.prune) + '</b> cada <b>' + A.fmtSec(p.interval) + '</b> (mín. ' + A.fmtSec(C.zones.jungle.prune.minInterval) + ')';
      s += '<br>Floración: <b>' + fmt(b.reward) + '</b>' + (b.cross ? ' = ' + fmt(b.base) + ' + ' + fmt(b.cross) + ' Polen Astral' : '') + ' · secuencia <b>' + idx + '/' + b.every + '</b>';
      s += '<br>Media: <b>' + fmtRate(avg) + '</b>' + (p.robe ? ' · túnica ' + fmtRate(p.robe) : '');
      return s;
    }
    var c = st.zones.crypt;
    if (c.items.staff <= 0) return 'La maga traza sellos a mano. Con su báculo, los pulsos serán automáticos.';
    var charge = Math.min(1, (c.cyc.pulse || 0) / p.interval);
    s = 'Pulso: <b>' + fmt(p.base + p.confluence) + '</b>' + (p.confluence > 0 ? ' = ' + fmt(p.base) + ' base + ' + fmt(p.confluence) + ' Confluencia' : '');
    s += '<br>Intervalo: <b>' + A.fmtSec(p.interval) + '</b> (mín. ' + A.fmtSec(C.zones.crypt.pulse.minInterval) + ') · Media: <b>' + fmtRate(avg) + '</b>';
    s += '<br>Carga: <b>' + Math.floor(charge * 100) + ' %</b> · Pulsos: ' + fmt(c.cnt.pulse || 0) + (c.items.litany ? ' · Letanía ' + (c.seq.litany || 0) + '/' + C.zones.crypt.litany.every : '');
    return s;
  };

  // ---------- Metas ----------
  UI.goals = function (st, z) {
    var f = st.zones.forest, j = st.zones.jungle, c = st.zones.crypt, main, fp = S.zoneOwnProd(st, 'forest');
    if (f.items.staff < 1) {
      var n = Math.ceil((S.costFor(S.itemDef('forest', 'staff'), 0, 1) - f.mana) / S.manualValue(st, 'forest'));
      main = n > 0 ? n + (n === 1 ? ' lanzamiento' : ' lanzamientos') + ' para comprar el Báculo de Rama' : '¡Compra el Báculo de Rama! (tecla 1): lanzará Chispas solo';
    } else if (f.items.staff < 10) main = 'Báculo de Rama ' + f.items.staff + '/10 · al evolucionar duplicará su producción';
    else if (!j.unlocked) main = 'Algo crece al sur: producción automática del bosque ' + fmt(fp) + ' / ' + fmt(S.unlockRule('jungle')) + ' por segundo';
    else if (!j.introSeen) main = 'La Jungla de las Mil Bocas está abierta: entra desde la Sala o con la tecla Z';
    else if (j.items.grimoire < 1 && z === 'jungle') {
      var k = Math.ceil((S.costFor(S.itemDef('jungle', 'grimoire'), 0, 1) - j.mana) / S.manualValue(st, 'jungle'));
      main = k > 0 ? k + ' marcas para el Grimorio de Poda de la herborista' : '¡Compra el Grimorio de Poda!';
    } else if (!c.unlocked) main = 'Cripta de las Campanas: producción automática del bosque ' + fmt(fp) + ' / ' + fmt(S.unlockRule('crypt')) + ' por segundo';
    else if (!c.introSeen) main = 'Bajo el bosque suena una campana: entra en la Cripta';
    else if (c.items.staff < 1) {
      var q = Math.ceil((S.costFor(S.itemDef('crypt', 'staff'), 0, 1) - c.mana) / S.manualValue(st, 'crypt'));
      main = q > 0 ? q + ' sellos para el Báculo de Latón de la maga' : '¡Compra el Báculo de Latón de la maga!';
    } else if (st.order.confluence < 1) {
      var miss = S.orderCost('confluence', 0) - f.mana, fpr = S.forestProd(st);
      main = miss > 0 ? 'Confluencia: faltan ' + fmt(miss) + ' de maná del bosque' + (fpr > 0 ? ' (~' + A.fmtTime(miss / fpr) + ')' : '') : '¡Confluencia disponible en la pestaña Orden!';
    } else if (!S.canPrestige(st)) {
      var tot = S.runTotal(st);
      main = 'Refundar la orden: ' + fmt(tot) + ' / ' + fmt(C.prestige.goalTotal) + ' de maná generado (' + Math.floor(tot / C.prestige.goalTotal * 100) + ' %)';
    } else {
      var e = S.echoesFor(S.runTotal(st));
      main = 'Puedes refundar la orden por ' + e + ' Ecos · siguiente Eco a los ' + fmt(S.totalForEchoes(e + 1)) + ' generados';
    }
    return [main, UI.zoneHint(st, z)];
  };
  // Próximo hito relevante de una zona (también se muestra junto a su portal)
  UI.zoneHint = function (st, z) {
    if (!S.isOpen(st, z)) return '';
    var zz = st.zones[z];
    var focus = { forest: 'staff', jungle: 'grimoire', crypt: 'staff' }[z];
    if (zz.items[focus] < 1) return 'Sin automatizar: compra ' + S.itemDef(z, focus).names[0];
    var best = null;
    zc(z).itemOrder.forEach(function (id) {
      var lvl = zz.items[id]; if (lvl < 1) return;
      var nv = S.nextVisual(z, id, lvl); if (!nv) return;
      var left = nv.level - lvl;
      if (!best || left < best.left) best = { id: id, lvl: lvl, nv: nv, left: left };
    });
    var hid = nextReveal(st, z);
    var parts = [];
    if (z === 'jungle') { var b = S.model(st, 'jungle').parts.bloom; parts.push('Floración ' + (zz.seq.bloom || 0) + '/' + b.every + ' raíces'); }
    if (best) parts.push(S.itemName(z, best.id, best.lvl) + ' ' + best.lvl + '/' + best.nv.level + ' → ' + S.itemDef(z, best.id).names[Math.min(6, S.visualTier(z, best.id, best.nv.level))]);
    if (hid) parts.push('Por descubrir: ' + hid);
    return parts.slice(0, 2).join(' · ');
  };
  function nextReveal(st, z) {
    var ids = zc(z).itemOrder.filter(function (id) { return !S.isRevealed(st, z, id); });
    if (!ids.length) return '';
    return '??? (' + S.revealText(z, ids[0]) + ')';
  }

  // ---------- Tienda: filas compactas ordenadas por coste ----------
  UI.updateItems = function (st, z, force) {
    var box = $('items');
    if (!S.isOpen(st, z)) { box.innerHTML = '<p class="muted">Zona sellada: ' + unlockText(st, z) + '.</p>'; UI.structKey.items = ''; return; }
    var revealed = zc(z).itemOrder.filter(function (id) { return S.isRevealed(st, z, id); });
    var key = z + ':' + revealed.join(',');
    if (UI.structKey.items !== key) {
      // Solo se reconstruye si cambia el conjunto de entradas; con el cursor o el foco dentro se conserva el orden visible.
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
          '<button type="button" class="more" aria-expanded="false" aria-label="Detalle de evolución">▸</button>' +
          '<div class="detail" hidden></div>';
        row._tier = -1;
        box.appendChild(row);
        if (UI.openDetails[id]) { row.querySelector('.detail').hidden = false; row.querySelector('.more').textContent = '▾'; row.querySelector('.more').setAttribute('aria-expanded', 'true'); }
      });
      var hidden = zc(z).itemOrder.filter(function (id) { return !S.isRevealed(st, z, id); });
      if (hidden.length) box.appendChild(el('p', 'discover', 'Por descubrir (' + hidden.length + '): ??? — se revela con <b>' + S.revealText(z, hidden[0]) + '</b>'));
      UI.freeze.order = null;
    }
    var rows = Array.prototype.slice.call(box.querySelectorAll('.irow'));
    rows.forEach(function (row) { updateRow(st, z, row); });
    // Ordena por coste; los completados al final. No reordena bajo el cursor ni con el foco dentro.
    if (!UI.freeze.pointer && !UI.freeze.focus) {
      var amt = st.settings.buyAmount;
      var sorted = rows.slice().sort(function (a, b) { return sortKey(st, z, a.dataset.id, amt) - sortKey(st, z, b.dataset.id, amt) || zc(z).itemOrder.indexOf(a.dataset.id) - zc(z).itemOrder.indexOf(b.dataset.id); });
      var changed = sorted.some(function (r, i) { return r !== rows[i]; });
      if (changed) { var disc = box.querySelector('.discover'); sorted.forEach(function (r) { box.insertBefore(r, disc); }); }
    }
    UI.lastOrder = { zone: z, ids: UI.sortedIds() };
  };
  function sortKey(st, z, id, amt) {
    var p = S.plan(st, z, id, amt === 'max' ? '1' : amt);
    if (p.capped) return Infinity;
    return p.cost;
  }
  UI.sortedIds = function () { return Array.prototype.map.call(document.querySelectorAll('#items .irow'), function (r) { return r.dataset.id; }); };

  function itemEffect(st, z, id) {
    var m = S.model(st, z), p = m.parts, it = st.zones[z].items;
    var cyc = function (cid) { return m.cycles.filter(function (c) { return c.id === cid; })[0]; };
    if (z === 'forest') {
      if (id === 'staff') return fmtRate(p.staff);
      if (id === 'ring') return 'báculo ' + A.fmtMult(p.ringMult);
      if (id === 'robe') return fmtRate(p.robe);
      if (id === 'hood') return 'lluvia ' + A.fmtMult(p.hoodMult);
      if (id === 'spell') return fmtRate(p.spell);
      if (id === 'prism') return fmtRate(p.prism) + ' (' + A.fmt(p.casts) + ' chispas/s)';
      if (id === 'orbit') { var o = cyc('orbit'); return o ? fmt(o.reward) + ' / ' + A.fmtSec(o.interval) : '—'; }
      if (id === 'constellation') { var k = cyc('constellation'); return k ? fmt(k.reward) + ' / ' + A.fmtSec(k.interval) : '—'; }
    } else if (z === 'jungle') {
      if (id === 'grimoire') return fmt(p.prune) + ' por poda';
      if (id === 'robe') return fmtRate(p.robe);
      if (id === 'hat') return 'poda cada ' + A.fmtSec(p.interval);
      if (id === 'collar') return 'poda ' + A.fmtMult(p.collarMult);
      if (id === 'sickle') return '+' + fmt(it.sickle * S.itemDef('jungle', 'sickle').perLevel * S.milestoneMult(it.sickle) * p.collarMult) + ' por poda';
      if (id === 'pollen') return 'floración ' + A.fmtMult(p.pollenMult);
      if (id === 'graft') { var gr = cyc('graft'); return gr ? fmt(gr.reward) + ' / ' + A.fmtSec(gr.interval) : '—'; }
      if (id === 'maw') return '+' + fmt(it.maw * S.itemDef('jungle', 'maw').perLevel * S.milestoneMult(it.maw)) + ' por floración';
    } else {
      if (id === 'staff') return 'pulso base ' + fmt(p.base);
      if (id === 'vest') return fmtRate(p.vest);
      if (id === 'mitre') return 'Confluencia ' + A.fmtMult(p.mitreMult);
      if (id === 'medallion') return 'pulso ' + A.fmtMult(p.medalMult);
      if (id === 'bell') return 'pulso ' + A.fmtMult(p.bellMult);
      if (id === 'chalk') return 'cada ' + A.fmtSec(p.interval);
      if (id === 'incense') return fmtRate(p.incense);
      if (id === 'litany') { var pl = cyc('pulse'); return pl && pl.seq ? fmt(pl.seq.reward) + ' cada ' + pl.seq.every + ' pulsos' : '—'; }
    }
    return '';
  }

  // Texto de beneficio de la siguiente compra (incluye el valor indirecto en otras zonas)
  UI.gainText = function (st, z, id, n, full) {
    var pv = S.preview(st, z, id, n), b = pv.before, a = pv.after, parts = [];
    var d = a.prod[z] - b.prod[z];
    if (d > 1e-9) parts.push('+' + fmtRate(d));
    var labels = { 'crypt.pulse': ['pulso', 'cripta'], 'jungle.bloom': ['floración', 'jungla'], 'forest.orbit': ['órbita', 'bosque'] };
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
      if (z !== 'forest' && st.zones[z].items[{ jungle: 'grimoire', crypt: 'staff' }[z]] < 1) return 'sin ' + zc(z).focusLabel + ' aún';
      return '+0/s';
    }
    return parts.join(' · ');
  };

  function updateRow(st, z, row) {
    var id = row.dataset.id, lvl = st.zones[z].items[id], def = S.itemDef(z, id);
    var tier = S.visualTier(z, id, lvl);
    if (row._tier !== tier) { row._tier = tier; A.Scene.drawIcon(row.querySelector('.icon'), z, id, tier); }
    row.querySelector('.name').textContent = S.itemName(z, id, lvl);
    row.querySelector('.lvl').textContent = 'Nv ' + lvl;
    row.querySelector('.eff').textContent = lvl > 0 ? itemEffect(st, z, id) : def.desc;
    var btn = row.querySelector('.buy'), amt = st.settings.buyAmount;
    var p = S.plan(st, z, id, amt);
    row.classList.toggle('done', p.capped);
    if (p.capped) {
      btn.disabled = true; btn.classList.remove('ok');
      row.querySelector('.cost').textContent = 'Completado'; row.querySelector('.gain').textContent = 'forma final';
    } else {
      var crossing = S.nextMilestone(lvl) <= lvl + p.n, vis = S.nextVisual(z, id, lvl), visCross = vis && vis.level <= lvl + p.n;
      btn.disabled = !p.affordable; btn.classList.toggle('ok', p.affordable);
      row.querySelector('.cost').innerHTML = '×' + p.n + ' · <b>' + fmt(p.cost) + '</b>';
      var g = UI.gainText(st, z, id, p.n, false);
      row.querySelector('.gain').textContent = (visCross ? '¡evoluciona! ' : crossing ? '¡salto! ' : '') + g;
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
    else {
      var hint = def.hints[Math.min(def.hints.length - 1, vis.index)];
      h += '<p class="next">Próxima forma en Nv ' + vis.level + ': <b>' + S.itemName(z, id, vis.level) + '</b> — ' + hint + '.</p>';
    }
    var cap = S.itemCap(z, id);
    if (isFinite(cap)) h += '<p class="muted">Tope mecánico: Nv ' + cap + ' (intervalo mínimo). Hitos visuales: ' + ms.join(' y ') + '.</p>';
    else h += '<p class="muted">Salto económico próximo: Nv ' + S.nextMilestone(lvl) + ' (×' + S.milestoneJump(S.nextMilestone(lvl)) + '). Hitos visuales: 10, 50, 100, 150, 200, 250.</p>';
    if (!p.capped) h += '<p>Con esta compra: ' + UI.gainText(st, z, id, p.n, true) + '</p>';
    return h;
  }

  // ---------- Mejoras de la orden ----------
  UI.updateOrder = function (st, force) {
    var box = $('panel-order');
    var key = 'o:' + ZONES.map(function (z) { return S.isOpen(st, z); }).join(',');
    if (force || UI.structKey.order !== key) {
      UI.structKey.order = key;
      box.innerHTML = '<p class="muted">Mejoras de la orden: duran esta partida y conectan a dos magos. Cada aporte va en una sola dirección y usa la producción propia de la zona de origen, sin retroalimentarse.</p>';
      C.orderOrder.forEach(function (id) {
        var d = C.order[id], card = el('div', 'card'); card.dataset.id = id;
        card.innerHTML = '<h4><span>' + d.name + '</span><span class="lvl"></span></h4><p class="eff">' + d.desc + '</p>' +
          '<div class="explain"></div>' +
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
    var ex = card.querySelector('.explain'), html = '', cost = S.orderCost(id, lvl), z = st.zones[d.pays];
    var src = S.crossSources(st);
    if (!open) html = 'Se desbloquea al abrir ' + d.needs.map(function (n) { return zc(n).name; }).join(' y ') + '.';
    else if (id === 'confluence' || id === 'pollen' || id === 'rootstar') {
      var srcVal = id === 'pollen' ? src.forestSpell : id === 'rootstar' ? src.jungle : src.forest;
      var srcName = id === 'pollen' ? 'la Lluvia de Chispas produce' : id === 'rootstar' ? 'la jungla produce (propio)' : 'el bosque produce (propio)';
      var ev = id === 'confluence' ? 'crypt.pulse' : id === 'pollen' ? 'jungle.bloom' : 'forest.orbit';
      var evName = id === 'confluence' ? 'pulso de la cripta' : id === 'pollen' ? 'floración' : 'descarga de la Órbita';
      var lp = st.last[ev];
      html = 'Ahora ' + srcName + ' <b>' + fmtRate(srcVal) + '</b>.';
      if (lvl > 0) html += '<br><b>Nv ' + lvl + ':</b> cada ' + evName + ' suma ' + d.seconds[lvl] + ' s × ' + fmtRate(srcVal) + (id === 'confluence' && st.zones.crypt.items.mitre ? ' × Mitra' : '') + '.' + (lp ? ' Último: ' + fmt(lp.base) + ' + ' + fmt(lp.cross) + ' = <b>' + fmt(lp.reward) + '</b>.' : '');
      if (!max) {
        st.order[id]++; var after = S.preview(st, d.from, Object.keys(st.zones[d.from].items)[0], 0).after; st.order[id]--;
        var before = S.preview(st, d.from, Object.keys(st.zones[d.from].items)[0], 0).before;
        html += '<br><b>Con Nv ' + (lvl + 1) + ':</b> ' + d.seconds[lvl + 1] + ' s × ' + fmtRate(srcVal) + ' por ' + evName + ' · ' + evName + ' ' + fmt(before.events[ev] || 0) + ' → <b>' + fmt(after.events[ev] || 0) + '</b> · media de ' + zc(d.to).short + ' ' + fmtRate(before.prod[d.to]) + ' → <b>' + fmtRate(after.prod[d.to]) + '</b>';
        if (!S.orderUseful(st, id)) html += '<br><i>Aún sin efecto: necesitas ' + S.itemDef(d.needsItem[0], d.needsItem[1]).names[0] + '.</i>';
        if (id === 'confluence' && !st.zones.crypt.items.staff) html += '<br><i>La maga aún no tiene báculo: el bono llegará con su primer pulso.</i>';
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

  // ---------- Refundación y talentos ----------
  UI.updatePrestige = function (st, force) {
    var box = $('panel-prestige');
    var key = 'p:' + S.canPrestige(st) + ':' + st.prestige.resets;
    if (force || UI.structKey.prestige !== key) {
      UI.structKey.prestige = key;
      box.innerHTML = '<h3>Refundar la orden</h3><div id="pr-status"></div><button type="button" class="primary" id="btn-prestige">Refundar la orden…</button>' +
        '<h3>Talentos permanentes · <span id="pr-echoes"></span> Ecos</h3><div id="talents"></div>';
      var tb = box.querySelector('#talents');
      C.talentOrder.forEach(function (id) {
        var d = C.talents[id], card = el('div', 'card'); card.dataset.id = id;
        card.innerHTML = '<h4><span>' + d.name + '</span><span class="lvl"></span></h4><p class="eff">' + d.desc + '</p><p class="next">En la próxima partida: ' + d.nextRun + '</p>' +
          '<button type="button" class="buy wide" data-talent="' + id + '"><span class="cost"></span><span class="gain"></span></button>';
        tb.appendChild(card);
      });
    }
    var c = S.runContrib(st), goal = C.prestige.goalTotal, e = S.echoesFor(c.total), w = C.prestige.weights;
    var s = '<ul class="list"><li>' + (st.zones.crypt.unlocked ? '✓' : '✗') + ' Explorar la Cripta de las Campanas</li>' +
      '<li>' + (c.total >= goal ? '✓' : '✗') + ' Generar ' + fmt(goal) + ' de maná en esta partida: <b>' + fmt(c.total) + '</b></li></ul>' +
      '<div class="bar"><i style="width:' + Math.min(100, c.total / goal * 100) + '%"></i></div>' +
      '<p class="muted">Aporte por zona: ' + ZONES.map(function (z) { return zc(z).short + ' <b>' + fmt(c[z]) + '</b>' + (w[z] !== 1 ? ' (cuenta ×' + String(w[z]).replace('.', ',') + ')' : ''); }).join(' · ') + '. Se cuenta el maná <b>generado</b>, no el saldo: comprar nunca reduce la recompensa.</p>' +
      '<p>Ecos al refundar ahora: <span class="big-num">' + e + '</span>' + (e > 0 ? ' · siguiente Eco con ' + fmt(S.totalForEchoes(e + 1)) : '') + '</p>';
    $('pr-status').innerHTML = s;
    $('btn-prestige').disabled = !S.canPrestige(st);
    $('pr-echoes').textContent = fmt(st.prestige.echoes);
    Array.prototype.forEach.call(box.querySelectorAll('#talents .card'), function (card) {
      var id = card.dataset.id, d = C.talents[id], lvl = st.prestige.talents[id], max = lvl >= d.maxLevel, cost = S.talentCost(id, lvl), btn = card.querySelector('.buy');
      card.querySelector('.lvl').textContent = 'Nv ' + lvl + (d.maxLevel > 1 ? '/' + d.maxLevel : '');
      btn.disabled = max || st.prestige.echoes < cost; btn.classList.toggle('ok', !btn.disabled);
      btn.querySelector('.cost').textContent = max ? 'Aprendido' : cost + ' Ecos';
      btn.querySelector('.gain').textContent = lvl ? 'activo' : '';
    });
  };

  UI.updateGame = function (st) {
    $('opt-reduced').checked = G.reduced;
    var ok = A.Save.storageOk;
    $('save-status').textContent = G.noOverwrite ? 'Guardado automático en pausa para no sobrescribir tu partida original (ver aviso). Exporta antes de continuar.'
      : ok === false ? 'El navegador no permite guardar en este modo (archivo local o modo privado). La sesión sigue jugable: usa «Exportar JSON» para conservar la partida.'
        : 'La partida se guarda sola cada ' + C.autosaveSeconds + ' s y al cerrar. Último guardado: ' + (G.lastSaved ? new Date(G.lastSaved).toLocaleTimeString('es') : '—') + '.';
    var bk = A.Save.readBackup(1);
    $('backup-row').hidden = !bk;
  };

  // ---------- Diálogos ----------
  UI.modal = function (html, buttons) {
    var d = $('modal');
    $('modal-body').innerHTML = html;
    var act = $('modal-actions'); act.innerHTML = '';
    buttons.forEach(function (b) {
      var btn = el('button', b.cls || '', b.label); btn.type = 'button';
      if (b.id) btn.id = b.id;
      btn.addEventListener('click', function () { if (b.keep && b.fn) { b.fn(btn); return; } d.close(); if (b.fn) b.fn(); });
      act.appendChild(btn);
    });
    if (d.open) d.close();
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    var first = act.querySelector('button:last-child'); if (first) first.focus();
  };
  UI.confirm = function (html, okLabel, fn, danger) { UI.modal(html, [{ label: 'Cancelar' }, { label: okLabel, cls: danger ? 'danger' : 'primary', fn: fn }]); };
  UI.modalOpen = function () { return $('modal').open; };

  UI.confirmPrestige = function () {
    var st = G.state; if (!S.canPrestige(st)) return;
    var e = S.echoesFor(S.runTotal(st));
    UI.confirm('<h2>Refundar la orden</h2><p>Ganarás <span class="big-num">' + e + ' Ecos</span> (tendrás ' + (st.prestige.echoes + e) + ').</p>' +
      '<p><b>Se reinicia:</b></p><ul class="list"><li>El maná y todas las entradas de los tres magos.</li><li>Las mejoras de la orden.</li><li>La jungla y la cripta vuelven a sellarse (reabren a ' + fmt(S.unlockRule('jungle')) + '/s y ' + fmt(S.unlockRule('crypt')) + '/s en el bosque).</li></ul>' +
      '<p><b>Conservas:</b></p><ul class="list"><li>Ecos y talentos permanentes.</li><li>La maestría de Chispa del aprendiz (cosmética).</li><li>Ajustes y número de refundaciones.</li></ul>', 'Refundar ahora', function () { G.prestige(); });
  };

  // Empezar desde cero: distinto de refundar. Exige confirmación explícita.
  UI.confirmWipe = function () {
    var st = G.state;
    UI.modal('<h2>Empezar desde cero</h2><p>Esto <b>no es refundar</b>: borra la partida completa, incluidos <b>' + fmt(st.prestige.echoes) + ' Ecos</b>, los talentos aprendidos (' + C.talentOrder.filter(function (id) { return st.prestige.talents[id] > 0; }).map(function (id) { return C.talents[id].name; }).join(', ') + ') y la maestría.</p>' +
      '<p>Te recomendamos exportar antes.</p><label class="check"><input type="checkbox" id="wipe-ok"> Entiendo que pierdo Ecos y talentos</label><p class="muted" id="wipe-msg"></p>',
      [{ label: 'Exportar antes', keep: true, fn: function () { UI.exportFile(); $('wipe-msg').textContent = 'Exportado. Ahora puedes confirmar.'; } },
       { label: 'Cancelar' },
       { label: 'Empezar desde cero', cls: 'danger', id: 'wipe-confirm', keep: true, fn: function () { if (!$('wipe-ok').checked) { $('wipe-msg').textContent = 'Marca la casilla para confirmar.'; return; } $('modal').close(); G.wipe(); } }]);
  };

  UI.offlineReport = function (rep) {
    var st = G.state, names = { forest: 'El aprendiz', jungle: 'La herborista', crypt: 'La maga' }, cnt = rep.counts || {};
    var html = '<h2>Mientras no estabas</h2><p>Pasaron ' + A.fmtTime(rep.rawSeconds) + (rep.capped ? ' (se acreditan como máximo 8 h)' : '') + '.</p><ul class="list">';
    ZONES.forEach(function (z) {
      if (!S.isOpen(st, z)) return;
      var c = cnt[z] || {}, extra = [];
      if (c.pulse) extra.push(fmt(c.pulse) + ' pulsos'); if (c.litany) extra.push(fmt(c.litany) + ' letanías');
      if (c.prune) extra.push(fmt(c.prune) + ' podas'); if (c.bloom) extra.push(fmt(c.bloom) + ' floraciones'); if (c.graft) extra.push(fmt(c.graft) + ' injertos');
      if (c.orbit) extra.push(fmt(c.orbit) + ' órbitas'); if (c.constellation) extra.push(fmt(c.constellation) + ' constelaciones');
      var cr = (rep.crossTotals || {});
      var crossTxt = z === 'crypt' && cr['crypt.pulse'] ? ' (incluye ' + fmt(cr['crypt.pulse']) + ' de Confluencia)' : z === 'jungle' && cr['jungle.bloom'] ? ' (incluye ' + fmt(cr['jungle.bloom']) + ' de Polen Astral)' : z === 'forest' && cr['forest.orbit'] ? ' (incluye ' + fmt(cr['forest.orbit']) + ' de Raíz Estelar)' : '';
      html += '<li><b>' + names[z] + '</b> generó <b class="pay-' + z + '">' + fmt(rep.zones[z] || 0) + '</b> de ' + zc(z).currency + (extra.length ? ': ' + extra.join(', ') : '') + crossTxt + '.</li>';
    });
    html += '</ul>';
    if (rep.legacy) html += '<p class="muted">Tu partida viene de la v0.1: el tiempo anterior a la actualización solo acredita lo que ya existía (sin floraciones ni maestrías retroactivas).</p>';
    if (rep.unlocked && rep.unlocked.length) html += '<p><b>Se abrió: ' + rep.unlocked.map(function (z) { return zc(z).name; }).join(', ') + '.</b></p>';
    UI.modal(html, [{ label: 'Continuar', cls: 'primary' }]);
  };

  // ---------- Exportar / importar ----------
  function download(text, name) {
    try {
      var blob = new Blob([text], { type: 'application/json' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      return true;
    } catch (e) { $('import-text').value = text; return false; }
  }
  UI.exportFile = function () {
    G.saveNow();
    var ok = download(A.Save.exportText(G.state), 'orden-del-umbral-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json');
    UI.log(ok ? 'Partida exportada como archivo JSON.' : 'No se pudo descargar: el JSON está en el cuadro de texto.');
  };
  UI.exportBackup = function () {
    var raw = A.Save.readBackup(1);
    if (!raw) return;
    download(raw, 'orden-del-umbral-respaldo-v0.1.json');
    UI.log('Copia del guardado v0.1 exportada tal cual.');
  };
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
      '<li>Ecos: ' + fmt(s.prestige.echoes) + ' · refundaciones: ' + s.prestige.resets + '</li></ul><p>¿Reemplazar la partida actual? (No se acredita tiempo offline al importar.)</p>', 'Reemplazar', function () {
      G.replaceState(s); msg.textContent = 'Partida importada correctamente.';
    });
  };

  // ---------- Registro y anuncios ----------
  UI.log = function (html) { var box = $('log'), p = el('p', '', html); box.insertBefore(p, box.firstChild); while (box.childNodes.length > 8) box.removeChild(box.lastChild); };
  var bannerTimer = null, bannerQueue = [];
  UI.banner = function (html, ms) {
    var b = $('banner');
    if (!b.hidden && bannerTimer) { if (bannerQueue.length < 4) bannerQueue.push([html, ms]); return; }
    b.innerHTML = html; b.hidden = false;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { b.hidden = true; bannerTimer = null; var n = bannerQueue.shift(); if (n) UI.banner(n[0], n[1]); }, ms || 3500);
  };
  UI.clearBanners = function () { bannerQueue = []; clearTimeout(bannerTimer); bannerTimer = null; $('banner').hidden = true; };
  UI.notice = function (html) { var n = $('notice'); if (!html) { n.hidden = true; return; } n.innerHTML = html; n.hidden = false; };
})(typeof window !== 'undefined' ? window : globalThis);
