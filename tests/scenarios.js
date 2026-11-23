/* Escenarios para revisar el arte en un navegador real (usa la clave de guardado de prueba).
 *   index.html#escena=<nombre>   estado concreto (bosque50, jungla10, cripta100, sala50, evo-forest-staff-10…)
 *   index.html#tira=<zona>-<id>  hoja de contacto: filas = estados visuales 0,10,50,100,150,200,250 (o 10 y tope),
 *                                columnas = cuadros sucesivos de la animación de esa entrada.
 * Los cuadros se dibujan con el renderizador real del juego en un canvas; es una prueba de render, no de fluidez.
 */
(function () {
  'use strict';
  var A = window.Arcane, G = A.Game, S = A.Sim, C = A.CONFIG, Sc = A.Scene;
  var hash = location.hash;
  function base(levels) {
    var st = S.newState(null, Date.now());
    C.zoneOrder.forEach(function (z) {
      if (levels[z] === undefined) return;
      if (z !== 'forest') { st.zones[z].unlocked = true; st.zones[z].introSeen = true; }
      C.zones[z].itemOrder.forEach(function (id) { st.zones[z].items[id] = Math.min(levels[z], S.itemCap(z, id)); });
    });
    C.zoneOrder.forEach(function (z) { st.zones[z].mana = 1e12; });
    return st;
  }
  var md = document.getElementById('modal'); if (md && md.open) md.close(); // cerrar el informe offline del arranque
  var m = hash.match(/escena=([\w-]+)/), t = hash.match(/tira=(\w+)-(\w+)/);
  if (m) {
    var name = m[1], mm = name.match(/^(bosque|jungla|cripta|castillo|cavernas|sala|mesa|refundacion|confirmar)(\d+)$/), evo = name.match(/^evo-(\w+)-(\w+)-(\d+)$/), st;
    if (mm) {
      var lv = +mm[2], lev = { forest: lv }, order = ['bosque', 'jungla', 'cripta', 'castillo', 'cavernas'], k = order.indexOf(mm[1]);
      var zs = ['forest', 'jungle', 'crypt', 'castle', 'caverns'];
      zs.forEach(function (z, i) { if (k < 0 || i <= k) lev[z] = lv; });
      st = base(lev);
      st.order.confluence = lv >= 10 ? 1 : 0; st.order.pollen = lv >= 10 ? 1 : 0; st.order.rootstar = lv >= 10 ? 1 : 0;
      st.zones.crypt.cyc.pulse = S.cryptInterval(st) * 0.66;
      st.zones.jungle.seq.bloom = 3; st.zones.crypt.seq.litany = 4; st.zones.castle.seq.thaw = 3;
      st.zones.caverns.cyc.eye = 27; st.prestige.resets = 1; st.prestige.echoes = 4;
      st.zones.forest.generated = 2e9; st.records.spellMax = lv;
      G.replaceState(st);
      if (mm[1] === 'sala') G.openRoom('portals');
      else if (mm[1] === 'mesa') G.openRoom('table');
      else if (mm[1] === 'refundacion') { G.prestige(); }
      else if (mm[1] === 'confirmar') { G.openTable('mesa-refundar'); A.UI.confirmPrestige(); }
      else G.openZone(zs[k]);
    } else if (evo) {
      var z = evo[1], lev2 = { forest: 1 }; if (z !== 'forest') lev2[z] = 1;
      st = base(lev2); st.zones[z].items[evo[2]] = +evo[3] - 1;
      G.replaceState(st); G.openZone(z); G.state.settings.buyAmount = '1'; G.buy(z, evo[2]);
    }
    var t0 = Date.now(), frames = evo ? 40 : 95;
    var metrics = function () { var pc = document.querySelector('.portal-cv'), grid = document.getElementById('portals'); return ' vw=' + innerWidth + 'x' + innerHeight + ' scrollW=' + document.documentElement.scrollWidth + ' portal=' + (pc ? pc.getBoundingClientRect().width.toFixed(0) + 'px/x' + A.UI.portalScale : '-') + ' cols=' + (grid ? grid.style.gridTemplateColumns : '-') + ' escena=' + document.getElementById('scene').getBoundingClientRect().width.toFixed(0) + 'px'; };
    setTimeout(function () { document.title = 'ESCENA ' + name + metrics(); }, 300);
    if (mm && (mm[1] === 'refundacion' || mm[1] === 'confirmar')) return;
    if (G.view === 'room' && G.roomTab === 'table') Sc.drawTable(document.getElementById('table-cv'), G.state, t0);
    else if (G.view === 'room') for (var f = 1; f <= frames; f++) Sc.renderPortals(G.state, t0 + f * 16);
    else for (var f2 = 1; f2 <= frames; f2++) Sc.render(G.state, t0 + f2 * 16);
    var hit = /impacto/.test(location.hash);
    if (hit && G.view !== 'room') { var v = Sc.view(G.zone); v.extra.deerHit = v.extra.queenHit = v.extra.regentHit = (t0 + frames * 16) / 1000; v.flash = (t0 + frames * 16) / 1000 - 0.05; v.extra.antler = v.flash; Sc.render(G.state, t0 + frames * 16 + 30); }
    document.title = 'ESCENA ' + name + ' ancho=' + innerWidth + ' scroll=' + document.documentElement.scrollWidth;
    return;
  }
  if (/jefes/.test(hash)) { bossSheet(); return; }
  if (/insignias/.test(hash)) { insigniaSheet(); return; }
  if (!t) return;


  // ---------- Hojas de contacto ----------
  var zid = t[1], id = t[2];
  var ms = [0].concat(S.visualMilestones(zid, id));
  // Recorte de interés y guion de cada entrada: phases = [inicio, fin] (fracción del intervalo), ev = evento económico
  var crop = { forest: [100, 20, 156, 110], jungle: [20, 70, 220, 74], crypt: [40, 10, 200, 128] }[zid];
  var cols = 6, dt = 0.12;
  var script = {
    'forest.staff': { k: 'spark', crop: [30, 60, 180, 70] }, 'forest.spell': { k: 'fall', dt: 0.2, cols: 8 }, 'forest.orbit': { cyc: 'orbit', ev: 'orbit' },
    'forest.prism': { k: 'spark', prism: true, crop: [140, 30, 116, 90], dt: 0.1, start: 0.4 }, 'forest.constellation': { cyc: 'constellation', ev: 'constellation', dt: 0.3 },
    'forest.robe': { manual: true, crop: [20, 60, 120, 70] }, 'forest.hood': { manual: true, crop: [20, 60, 120, 70] }, 'forest.ring': { manual: true, crop: [20, 60, 120, 70] },
    'jungle.grimoire': { ev: 'prune', dt: 0.1 }, 'jungle.sickle': { ev: 'prune', dt: 0.1 }, 'jungle.pollen': { ev: 'bloom', dt: 0.3 }, 'jungle.graft': { cyc: 'graft', ev: 'graft' },
    'jungle.maw': { ev: 'bloom', dt: 0.3, crop: [120, 20, 136, 116] }, 'jungle.robe': { manual: true, crop: [10, 70, 120, 70] }, 'jungle.hat': { manual: true, crop: [10, 70, 120, 70] }, 'jungle.collar': { ev: 'prune', crop: [10, 70, 120, 70] },
    'crypt.staff': { cyc: 'pulse', ev: 'pulse' }, 'crypt.bell': { cyc: 'pulse', ev: 'pulse', dt: 0.15 }, 'crypt.chalk': { cyc: 'pulse', ev: 'pulse' },
    'crypt.incense': { cyc: 'pulse', dt: 0.4 },
    'castle.lance': { cyc: 'crack', ev: 'crack', dt: 0.1, crop: [20, 30, 230, 104] }, 'castle.hammer': { cyc: 'crack', ev: 'crack', dt: 0.1 }, 'castle.guide': { cyc: 'crack', dt: 0.3 }, 'castle.phoenix': { ev: 'thaw', dt: 0.3, cols: 7 }, 'castle.embers': { dt: 0.25 },
    'castle.robe': { manual: true, crop: [10, 60, 120, 70] }, 'castle.helm': { manual: true, crop: [10, 60, 120, 70] }, 'castle.bracer': { manual: true, crop: [10, 60, 120, 70] },
    'caverns.mirror': { dt: 0.2, crop: [10, 20, 236, 110] }, 'caverns.shards': { dt: 0.3, crop: [10, 10, 236, 110] }, 'caverns.lens': { dt: 0.2, crop: [10, 10, 236, 110] }, 'caverns.gaze': { cyc: 'eye', dt: 0.3 }, 'caverns.zenith': { cyc: 'eye', ev: 'eye', dt: 0.3 },
    'caverns.robe': { manual: true, crop: [0, 60, 120, 70] }, 'caverns.diadem': { manual: true, crop: [0, 60, 120, 70] }, 'caverns.pendant': { manual: true, crop: [0, 60, 120, 70] }, 'crypt.litany': { ev: 'litany', dt: 0.25 }, 'crypt.vest': { cyc: 'pulse', ev: 'pulse', crop: [30, 60, 120, 70] }, 'crypt.mitre': { cyc: 'pulse', ev: 'pulse', crop: [30, 60, 120, 70] }, 'crypt.medallion': { cyc: 'pulse', ev: 'pulse', crop: [30, 60, 120, 70] }
  }[zid + '.' + id] || {};
  crop = script.crop || crop; dt = script.dt || dt; cols = script.cols || cols;
  var scale = 2, cw = crop[2] * scale, ch = crop[3] * scale, gap = 6, labelW = 150;
  var sheet = document.createElement('canvas');
  sheet.width = labelW + cols * (cw + gap); sheet.height = ms.length * (ch + gap);
  var sg = sheet.getContext('2d'); sg.imageSmoothingEnabled = false; sg.fillStyle = '#111'; sg.fillRect(0, 0, sheet.width, sheet.height);
  var buf = document.createElement('canvas'); buf.width = 256; buf.height = 144; var bg = buf.getContext('2d'); bg.imageSmoothingEnabled = false;
  ms.forEach(function (lvl, row) {
    var lev = { forest: 1 }; if (zid !== 'forest') lev[zid] = 1;
    var st = base(lev);
    C.zones[zid].itemOrder.forEach(function (k) { st.zones[zid].items[k] = k === { forest: 'staff', jungle: 'grimoire', crypt: 'staff' }[zid] ? Math.max(1, st.zones[zid].items[k]) : 0; });
    if (zid === 'forest') { st.zones.forest.items.staff = 20; }
    st.zones[zid].items[id] = Math.max(lvl, id === 'robe' || id === 'hood' || id === 'ring' || id === 'vest' || id === 'mitre' || id === 'medallion' || id === 'collar' || id === 'hat' ? lvl : Math.max(1, lvl));
    if (lvl === 0 && ['robe', 'hood', 'ring', 'vest', 'mitre', 'medallion', 'collar', 'hat'].indexOf(id) >= 0) st.zones[zid].items[id] = 1;
    if (zid === 'crypt' && id === 'litany') st.zones.crypt.seq.litany = 5;
    if (zid === 'jungle') st.zones.jungle.seq.bloom = id === 'pollen' || id === 'maw' ? 4 : 2;
    G.state = st; Sc.test.reset(); Sc.setReduced(false);
    var vt = S.visualTier(zid, id, st.zones[zid].items[id]);
    var T0 = Date.now() / 1000 + row * 100, tstart = T0 + (script.start || 0);
    var model = S.model(st, zid), cyc = script.cyc ? model.cycles.filter(function (c) { return c.id === script.cyc; })[0] : null;
    if (script.k === 'spark') Sc.test.add(zid, { k: 'spark', t0: T0, x0: 54, y0: 91, x1: 192, y1: 95, dur: 0.5, arc: 18, tier: vt, mastery: 0, prism: script.prism ? vt : -1 });
    if (script.k === 'fall') Sc.test.add(zid, { k: 'fall', t0: T0, x0: 220, dur: 0.9, tier: vt });
    if (script.manual) Sc.test.add(zid, { k: 'part', t0: T0, x: 0, y: 0, vx: 0, vy: 0, dur: 0.01, c: '#000' });
    for (var c = 0; c < cols; c++) {
      var time = tstart + c * dt;
      if (cyc) st.zones[zid].cyc[script.cyc] = cyc.interval * Math.min(0.999, 0.55 + c * 0.1);
      if (script.ev && c === (cyc ? 4 : 0)) {
        var ev = { zone: zid, type: script.ev, count: 1, reward: 100, base: 100, cross: zid === 'crypt' ? 10 : 0 };
        Sc.view(zid).extra.lastSeq = 2;
        var realNow = Date.now; Date.now = function () { return time * 1000; }; Sc.event(ev); Date.now = realNow;
        if (zid === 'jungle' && script.ev === 'prune') Sc.view(zid).fire = time;
      }
      if (script.manual && c === 0) { var rn = Date.now; Date.now = function () { return time * 1000; }; Sc.manual(zid, { gain: 1, seqBefore: 2 }); Sc.view(zid).fire = time; Date.now = rn; }
      Sc.view(zid).lastT = time - 0.016;
      Sc.drawZone(bg, zid, st, time, false);
      sg.drawImage(buf, crop[0], crop[1], crop[2], crop[3], labelW + c * (cw + gap), row * (ch + gap), cw, ch);
    }
    sg.fillStyle = '#ddd'; sg.font = '14px monospace';
    sg.fillText(S.itemName(zid, id, st.zones[zid].items[id]), 6, row * (ch + gap) + 20);
    sg.fillText('Nv ' + st.zones[zid].items[id] + ' · estado ' + vt, 6, row * (ch + gap) + 40);
  });
  var holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;inset:0;background:#111;z-index:100;overflow:auto';
  sheet.style.imageRendering = 'pixelated';
  holder.appendChild(sheet); document.body.appendChild(holder);
  document.title = 'TIRA ' + zid + '-' + id + ' ' + sheet.width + 'x' + sheet.height;

  // Hoja de jefes: filas = zonas; columnas = reposo, impacto, insignia (a mitad), derrota 50 %, derrota 100 %, recorte de portal
  function bossSheet() {
    var zs = C.zoneOrder, cols = ['reposo', 'impacto', 'insignia', 'derrota 50 %', 'derrota 100 %', 'portal'];
    var scale = 2, cw = 128 * scale, ch = 120 * scale, gap = 6, labelW = 120;
    var sheet = document.createElement('canvas'); sheet.width = labelW + cols.length * (cw + gap); sheet.height = 24 + zs.length * (ch + gap);
    var sg = sheet.getContext('2d'); sg.imageSmoothingEnabled = false; sg.fillStyle = '#111'; sg.fillRect(0, 0, sheet.width, sheet.height);
    sg.fillStyle = '#ddd'; sg.font = '14px monospace';
    cols.forEach(function (c, i) { sg.fillText(c, labelW + i * (cw + gap) + 4, 16); });
    var buf = document.createElement('canvas'); buf.width = 256; buf.height = 144; var bg = buf.getContext('2d'); bg.imageSmoothingEnabled = false;
    var lev = {}; zs.forEach(function (z) { lev[z] = 10; });
    var st = base(lev); st.zones.castle.seq.thaw = 3; st.zones.jungle.seq.bloom = 2; st.zones.crypt.cyc.pulse = S.cryptInterval(st) * 0.5; st.zones.caverns.cyc.eye = 10;
    G.state = st;
    var crop = { forest: 120, jungle: 128, crypt: 96, castle: 128, caverns: 128 };
    zs.forEach(function (z, row) {
      var T0 = Date.now() / 1000 + row * 50;
      cols.forEach(function (c, col) {
        Sc.test.reset();
        var v = Sc.view(z), time = T0 + 5, opts = {};
        if (c === 'impacto') { v.extra.deerHit = v.extra.queenHit = v.extra.regentHit = time - 0.05; v.flash = time - 0.1; v.extra.antler = time - 0.1; v.deer = 1; }
        if (c === 'insignia') { var rn = Date.now; Date.now = function () { return (time - 0.9) * 1000; }; Sc.culminate(z, st); Date.now = rn; }
        if (c === 'derrota 50 %') opts.defeat = 0.5;
        if (c === 'derrota 100 %') opts.defeat = 1;
        if (c === 'insignia') { for (var f = 0; f < 50; f++) Sc.drawZone(bg, z, st, time - 0.9 + f * 0.018, false); }
        v.lastT = time - 0.016;
        Sc.drawZone(bg, z, st, time, c === 'portal', opts);
        var x0 = c === 'portal' ? Sc.portalCrop[z].x : crop[z], y0 = c === 'portal' ? Sc.portalCrop[z].y : 12;
        var w = c === 'portal' ? Sc.portalCrop[z].w : 128, h = c === 'portal' ? Sc.portalCrop[z].h : 120;
        sg.drawImage(buf, x0, y0, w, h, labelW + col * (cw + gap), 24 + row * (ch + gap), c === 'portal' ? w : cw, c === 'portal' ? h : ch);
      });
      sg.fillStyle = '#ddd'; sg.fillText(C.zones[z].short, 6, 24 + row * (ch + gap) + 20);
    });
    var holder = document.createElement('div'); holder.style.cssText = 'position:fixed;inset:0;background:#111;z-index:100;overflow:auto';
    sheet.style.imageRendering = 'pixelated'; holder.appendChild(sheet); document.body.appendChild(holder);
    document.title = 'JEFES ' + sheet.width + 'x' + sheet.height;
  }

  // Hoja de hechizos insignia: filas = zonas; columnas = fases (preparación, trayectoria, impacto, reacción)
  function insigniaSheet() {
    var zs = C.zoneOrder, times = [0.15, 0.4, 0.6, 0.8, 1.0, 1.3], scale = 1, cw = 256 * scale, ch = 144 * scale, gap = 6, labelW = 90;
    var sheet = document.createElement('canvas'); sheet.width = labelW + times.length * (cw + gap); sheet.height = 24 + zs.length * (ch + gap);
    var sg = sheet.getContext('2d'); sg.imageSmoothingEnabled = false; sg.fillStyle = '#111'; sg.fillRect(0, 0, sheet.width, sheet.height);
    sg.fillStyle = '#ddd'; sg.font = '14px monospace';
    times.forEach(function (t, i) { sg.fillText('t = ' + t + ' s', labelW + i * (cw + gap) + 4, 16); });
    var buf = document.createElement('canvas'); buf.width = 256; buf.height = 144; var bg = buf.getContext('2d'); bg.imageSmoothingEnabled = false;
    var lev = {}; zs.forEach(function (z) { lev[z] = 10; });
    var st = base(lev); st.zones.castle.seq.thaw = 5; G.state = st;
    zs.forEach(function (z, row) {
      Sc.test.reset(); Sc.setReduced(false);
      var T0 = Date.now() / 1000 + row * 50, rn = Date.now;
      Date.now = function () { return T0 * 1000; }; Sc.culminate(z, st); Date.now = rn;
      var last = T0, k = 0;
      times.forEach(function (t, col) {
        for (var f = last; f < T0 + t; f += 0.02) Sc.drawZone(bg, z, st, f, false);
        last = T0 + t; Sc.drawZone(bg, z, st, T0 + t, false);
        sg.drawImage(buf, 0, 0, 256, 144, labelW + col * (cw + gap), 24 + row * (ch + gap), cw, ch);
      });
      sg.fillStyle = '#ddd'; sg.fillText(C.zones[z].short, 6, 24 + row * (ch + gap) + 20);
    });
    var holder = document.createElement('div'); holder.style.cssText = 'position:fixed;inset:0;background:#111;z-index:100;overflow:auto';
    sheet.style.imageRendering = 'pixelated'; holder.appendChild(sheet); document.body.appendChild(holder);
    document.title = 'INSIGNIAS ' + sheet.width + 'x' + sheet.height;
  }
})();
