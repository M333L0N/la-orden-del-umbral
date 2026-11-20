/* La Orden del Umbral — escenas en Canvas 2D a baja resolución (256×144) y portales de la Sala.
 * Solo dibuja: nunca modifica la economía. Los indicadores que dependen del tiempo económico
 * (carga del pulso, secuencia de raíces, estrellas, alineación de la órbita) se leen de las fases
 * de la simulación, así el portal y la vista detallada muestran lo mismo.
 * Los efectos guardan su instante de inicio (tiempo absoluto) y se dibujan de forma analítica.
 */
(function (root) {
  'use strict';
  var A = root.Arcane = root.Arcane || {};
  var Art = A.Art, S = A.Sim, P = Art.P, C = A.CONFIG;
  var Scene = A.Scene = {};
  var W = Scene.W = 256, H = Scene.H = 144;

  var mainCv, mainG, overlay, mainZone = 'forest', reduced = false, mainVisible = true;
  var bgs = {}, views = {}, portals = {};
  var anomaly = null;
  Scene.spawned = 0;

  Scene.layout = {
    forest: { mage: { x: 40, y: 96 }, hand: { x: 54, y: 106 }, free: { x: 43, y: 108 }, tip: { x: 54, y: 91 }, crystal: { x: 188, y: 86 }, target: { x: 192, y: 95 }, deer: { x: 192, y: 62 } },
    jungle: { mage: { x: 34, y: 96 }, hand: { x: 48, y: 106 }, free: { x: 37, y: 108 }, book: { x: 46, y: 93 }, nodes: [92, 112, 132, 152, 172], nodeY: 125, graft: { x: 122, y: 122 }, queen: { x: 196, y: 40 } },
    crypt: { mage: { x: 52, y: 95 }, hand: { x: 65, y: 107 }, free: { x: 55, y: 110 }, tip: { x: 65, y: 90 }, circle: { x: 160, y: 124, rx: 38, ry: 8 }, bell: { x: 160, y: 22 } }
  };
  var L = Scene.layout;
  // Recorte de cada escena que se ve dentro de su portal
  Scene.portalCrop = { forest: { x: 24, y: 24, w: 192, h: 112 }, jungle: { x: 22, y: 26, w: 192, h: 112 }, crypt: { x: 40, y: 18, w: 192, h: 112 } };

  function newView(zid) {
    return { zid: zid, fx: [], acc: { cast: 0, robe: 0, spell: 0, agg: 0 }, agg: 0, lastT: 0, evo: null, gesture: -9, fire: -9, glow: 0, deer: 0, flash: -9, extra: {} };
  }
  // Reloj de la escena: durante el dibujo es el instante del cuadro; fuera, el reloj real.
  var clock = null;
  function now() { return clock !== null ? clock : Date.now() / 1000; }

  Scene.init = function (canvas, ov) {
    mainCv = canvas; overlay = ov;
    mainCv.width = W; mainCv.height = H;
    mainG = mainCv.getContext('2d'); mainG.imageSmoothingEnabled = false;
    bgs.forest = forestBg(); bgs.jungle = jungleBg(); bgs.crypt = cryptBg();
    C.zoneOrder.forEach(function (z) { views[z] = newView(z); });
  };
  Scene.setZone = function (z) {
    if (z === mainZone) return;
    mainZone = z;
    if (overlay) Array.prototype.slice.call(overlay.querySelectorAll('.floater')).forEach(function (n) { n.remove(); });
  };
  Scene.setMainVisible = function (v) { mainVisible = v; };
  Scene.setReduced = function (r) { reduced = !!r; };
  Scene.zone = function () { return mainZone; };
  Scene.view = function (z) { return views[z]; };
  // Solo para pruebas visuales (tests/scenarios.js): inyecta un efecto con instante explícito.
  Scene.test = { add: function (zid, e) { return add(views[zid], e); }, reset: function () { C.zoneOrder.forEach(function (z) { views[z] = newView(z); }); } };
  Scene.stats = function () { var o = {}; C.zoneOrder.forEach(function (z) { o[z] = views[z].fx.length; }); o.spawned = Scene.spawned; return o; };

  // ---------- Efectos con instante absoluto ----------
  function add(v, e) {
    e.t0 = e.t0 || now();
    v.fx.push(e);
    var max = reduced ? C.fx.reducedParticles : C.fx.detailParticles;
    if (v.fx.length > max) v.fx.splice(0, v.fx.length - max);
    return e;
  }
  // Recorre los efectos; los que nacen durante el recorrido (impactos, figuras) se conservan.
  function sweep(v, fn) { var cur = v.fx; v.fx = []; var kept = cur.filter(fn); v.fx = kept.concat(v.fx); }
  function burst(v, x, y, col, n, spread) {
    if (reduced) n = Math.min(n, 3);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = (spread || 1) * (15 + Math.random() * 40);
      add(v, { k: 'part', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, dur: 0.35 + Math.random() * 0.4, c: col });
    }
  }
  function floater(zid, text, x, y, cls) {
    if (!overlay || zid !== mainZone || !mainVisible) return;
    var n = document.createElement('span');
    n.className = 'floater ' + (cls || '');
    n.textContent = text;
    n.style.left = (x / W * 100) + '%';
    n.style.top = (y / H * 100) + '%';
    overlay.appendChild(n);
    setTimeout(function () { n.remove(); }, reduced ? 1100 : 1400);
    var all = overlay.querySelectorAll('.floater');
    if (all.length > 14) all[0].remove();
  }
  Scene.floater = floater;

  // ---------- Fondos ----------
  function offscreen() { var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
  var BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function dither(x, y, cols, t) { var i = Math.floor(t), f = t - i; if (i >= cols.length - 1) return cols[cols.length - 1]; return (f * 16 > BAYER[y & 3][x & 3]) ? cols[i + 1] : cols[i]; }
  function gradient(x, cols, top, bottom) {
    for (var y = 0; y < H; y++) for (var xx = 0; xx < W; xx++) { x.fillStyle = dither(xx, y, cols, Math.min(cols.length - 1, Math.max(0, (y - top) / (bottom - top) * (cols.length - 1)))); x.fillRect(xx, y, 1, 1); }
  }
  function forestBg() {
    var o = offscreen(), c = o[0], x = o[1], R = Art.rng(7);
    gradient(x, ['#030c10', '#05141a', '#082029', '#0b2a34', '#0e3440'], 0, 120);
    for (var i = 0; i < 40; i++) Art.px(x, R() * W, R() * 60, R() > 0.8 ? '#bfeee8' : '#4f8f8a');
    for (var dy = -7; dy <= 7; dy++) for (var dx = -7; dx <= 7; dx++) if (dx * dx + dy * dy <= 49 && (dx + 3) * (dx + 3) + (dy - 1) * (dy - 1) > 36) Art.px(x, 222 + dx, 22 + dy, dx > 4 ? '#9fd8cf' : '#d5f5ee');
    function ridge(base, amp, col, pine, seed) {
      var r = Art.rng(seed);
      for (var xx = 0; xx < W; xx++) { var h = base - Math.round(Math.sin(xx / 23 + seed) * amp + Math.sin(xx / 9 + seed * 2) * amp * 0.4); Art.rect(x, xx, h, 1, H - h, col); }
      for (var p = 0; p < pine; p++) { var px = Math.floor(r() * W), ph = 12 + Math.floor(r() * 18), py = base - 4 - Math.floor(r() * 6); for (var k = 0; k < ph; k++) { var w = Math.floor(k / 2.6); Art.rect(x, px - w, py - ph + k, w * 2 + 1, 1, col); } Art.rect(x, px, py, 1, 6, col); }
    }
    ridge(92, 6, '#0b2731', 26, 3); ridge(106, 4, '#071b22', 18, 11);
    var ruin = '#090d11', ruinL = '#16262c', moss = '#123a36';
    Art.rect(x, 164, 62, 9, 58, ruin); Art.rect(x, 213, 66, 9, 54, ruin);
    for (var a = 0; a <= 32; a++) { var ang = Math.PI * a / 32; Art.rect(x, 192 - Math.cos(ang) * 24 - 4, 66 - Math.sin(ang) * 18 - 3, 8, 6, ruin); }
    Art.rect(x, 205, 40, 10, 8, '#030c10');
    Art.rect(x, 164, 62, 1, 58, ruinL); Art.rect(x, 213, 66, 1, 54, ruinL);
    for (i = 0; i < 18; i++) Art.px(x, 164 + R() * 58, 60 + R() * 50, moss);
    Art.rect(x, 6, 78, 12, 42, ruin); Art.rect(x, 4, 76, 16, 3, ruin); Art.rect(x, 6, 78, 1, 42, ruinL); Art.rect(x, 18, 74, 3, 4, ruin);
    Art.rect(x, 180, 105, 25, 15, '#10181d'); Art.rect(x, 178, 104, 29, 3, '#1a2a30'); Art.rect(x, 180, 107, 25, 1, '#070b0e');
    Art.rune(x, 185, 111, 0, '#0f4a46'); Art.rune(x, 191, 111, 2, '#0f4a46'); Art.rune(x, 197, 111, 4, '#0f4a46');
    Art.rect(x, 0, 120, W, H - 120, '#051216'); Art.rect(x, 0, 120, W, 1, '#0c2a2e');
    for (i = 0; i < 70; i++) Art.px(x, R() * W, 121 + R() * 22, R() > 0.5 ? '#0b2628' : '#0a1d20');
    for (i = 0; i < 30; i++) { var tx = Math.floor(R() * W); Art.px(x, tx, 119, '#123a36'); Art.px(x, tx + 1, 118, '#123a36'); }
    return c;
  }
  function jungleBg() {
    var o = offscreen(), c = o[0], x = o[1], R = Art.rng(23);
    gradient(x, ['#020805', '#04110a', '#071a0e', '#0a2412', '#0c2a14'], 0, 120);
    // troncos y follaje lejano
    for (var t = 0; t < 7; t++) { var tx = 10 + t * 38 + Math.floor(R() * 10), tw = 6 + Math.floor(R() * 6); Art.rect(x, tx, 0, tw, 120, t % 2 ? '#06150a' : '#081b0c'); Art.rect(x, tx, 0, 1, 120, '#0f2a14'); }
    for (var i = 0; i < 26; i++) { var lx = R() * W, ly = R() * 60, lr = 6 + R() * 10; for (var k = 0; k < lr; k++) Art.rect(x, lx - (lr - k), ly + k * 0.6, (lr - k) * 2, 1, i % 3 ? '#0b2a12' : '#103a16'); }
    // lianas colgantes
    for (i = 0; i < 12; i++) { var vx = R() * W, vl = 20 + R() * 50; for (var v = 0; v < vl; v++) Art.px(x, vx + Math.sin(v / 6) * 2, v, '#1a3a12'); Art.px(x, vx, vl, '#3f6a22'); }
    // hojas grandes verde ácido en primer plano (siluetas)
    [[6, 110, 1], [70, 116, -1], [238, 112, -1], [120, 118, 1]].forEach(function (l) {
      for (var k = 0; k < 16; k++) { var w = Math.round(Math.sin(k / 16 * Math.PI) * 5); Art.rect(x, l[0] + k * l[2] - (l[2] < 0 ? 0 : 0), l[1] - k * 0.5 - w, 1, w * 2 + 1, '#2f5a14'); }
      for (var k2 = 0; k2 < 16; k2++) Art.px(x, l[0] + k2 * l[2], l[1] - k2 * 0.5, P.acidD);
    });
    // suelo húmedo
    Art.rect(x, 0, 120, W, H - 120, '#07140a'); Art.rect(x, 0, 120, W, 1, '#1a3a12');
    for (i = 0; i < 80; i++) Art.px(x, R() * W, 121 + R() * 22, R() > 0.5 ? '#0c2010' : '#122a10');
    // flores enfermas
    for (i = 0; i < 9; i++) { var fx = 20 + R() * 220, fy = 118 + R() * 4; Art.px(x, fx, fy, P.sick); Art.px(x, fx + 1, fy, P.sickL); Art.px(x, fx, fy + 1, P.sickD); Art.px(x, fx, fy + 2, '#1a3a12'); }
    // raíz principal de la Reina hacia la secuencia
    for (var rx = 86; rx < 204; rx++) { var ry = 126 + Math.round(Math.sin(rx / 9) * 1.5); Art.rect(x, rx, ry, 1, 2, '#3a1430'); Art.px(x, rx, ry - 1, '#5a1e48'); }
    return c;
  }
  function cryptBg() {
    var o = offscreen(), c = o[0], x = o[1], R = Art.rng(19);
    Art.rect(x, 0, 0, W, H, '#150e1e');
    var bricks = ['#2b1d3d', '#2f2042', '#26193a', '#2a1b3b'];
    for (var row = 0; row * 5 < 118; row++) { var off = (row % 2) * 5; for (var bx = -off; bx < W; bx += 10) { Art.rect(x, bx + 1, row * 5 + 1, 9, 4, bricks[Math.floor(R() * 4)]); Art.rect(x, bx + 1, row * 5 + 1, 9, 1, '#3a2850'); if (R() > 0.85) Art.px(x, bx + 3 + R() * 5, row * 5 + 3, '#1b1226'); } }
    for (var y = 0; y < 30; y++) for (var xx = 0; xx < W; xx++) if (BAYER[y & 3][xx & 3] > y / 2) Art.px(x, xx, y, '#0d0814');
    [[14, 52], [214, 52]].forEach(function (p) {
      Art.rect(x, p[0], p[1], 28, 40, '#0c0812');
      for (var a = 0; a <= 14; a++) { var ang = Math.PI * a / 14; Art.rect(x, p[0] + 14 - Math.cos(ang) * 14 - 1, p[1] - Math.sin(ang) * 10, 3, 2, '#0c0812'); }
      Art.rect(x, p[0], p[1] + 40, 28, 2, '#3a2850'); Art.rect(x, p[0] + 6, p[1] + 32, 3, 8, '#d8cbb0'); Art.rect(x, p[0] + 18, p[1] + 30, 3, 10, '#d8cbb0');
    });
    [92, 228].forEach(function (cx) { Art.rect(x, cx, 0, 10, 118, '#1f1530'); Art.rect(x, cx, 0, 2, 118, '#3a2850'); Art.rect(x, cx + 8, 0, 2, 118, '#140d1f'); Art.rect(x, cx - 2, 112, 14, 6, '#241935'); });
    Art.rect(x, 120, 2, 80, 4, P.brassD); Art.rect(x, 120, 2, 80, 1, P.brass);
    for (var ch = 6; ch < 20; ch += 3) { Art.rect(x, 159, ch, 3, 2, P.brassD); Art.px(x, 160, ch + 2, P.brass); }
    Art.rect(x, 4, 98, 34, 20, '#2a1f38'); Art.rect(x, 2, 95, 38, 4, '#3a2b4a'); Art.rect(x, 2, 95, 38, 1, '#4a3a5c');
    Art.rune(x, 10, 104, 1, '#5a3a20'); Art.rune(x, 18, 104, 3, '#5a3a20'); Art.rune(x, 26, 104, 5, '#5a3a20');
    Art.rect(x, 0, 118, W, H - 118, '#1b1327'); Art.rect(x, 0, 118, W, 1, '#3a2850');
    for (var fy = 118; fy < H; fy += 7) { Art.rect(x, 0, fy, W, 1, '#120c1a'); for (var fx2 = (fy % 14 ? 0 : 12); fx2 < W; fx2 += 24) Art.rect(x, fx2, fy, 1, 7, '#120c1a'); }
    return c;
  }

  // ---------- Eventos de la economía y del jugador ----------
  // ev: { zone, type, count, reward, base, cross }
  Scene.event = function (ev) {
    var v = views[ev.zone]; if (!v) return;
    var t = now(), Z = L[ev.zone];
    if (ev.zone === 'crypt' && ev.type === 'pulse') {
      v.flash = t; v.extra.bellVel = (v.extra.bellVel || 0) + (reduced ? 0 : 9);
      add(v, { k: 'pulse', dur: 1.2, conf: ev.cross > 0 });
      var txt = '+' + A.fmt(ev.reward * ev.count) + (ev.count > 1 ? ' (×' + ev.count + ')' : '');
      floater('crypt', txt, Z.bell.x, Z.bell.y - 4, 'amber big');
      if (ev.cross > 0) floater('crypt', 'Confluencia +' + A.fmt(ev.cross * ev.count), Z.bell.x + 40, Z.bell.y + 14, 'teal');
      burst(v, Z.circle.x, Z.circle.y, P.amberL, 10);
    } else if (ev.zone === 'crypt' && ev.type === 'litany') {
      add(v, { k: 'litany', dur: 1.6 }); floater('crypt', 'Letanía +' + A.fmt(ev.reward * ev.count), Z.circle.x, 60, 'amber big');
    } else if (ev.zone === 'jungle' && ev.type === 'prune') {
      add(v, { k: 'prune', dur: 0.6, node: v.extra.lastSeq || 0 }); v.fire = t;
    } else if (ev.zone === 'jungle' && ev.type === 'bloom') {
      add(v, { k: 'bloom', dur: 1.8 }); v.flash = t;
      floater('jungle', 'Floración +' + A.fmt(ev.reward * ev.count), 140, 98, 'acid big');
      if (ev.cross > 0) floater('jungle', 'Polen Astral +' + A.fmt(ev.cross * ev.count), 150, 84, 'teal');
    } else if (ev.zone === 'jungle' && ev.type === 'graft') {
      add(v, { k: 'graftcut', dur: 0.8 }); floater('jungle', '+' + A.fmt(ev.reward * ev.count), Z.graft.x, Z.graft.y - 22, 'acid');
    } else if (ev.zone === 'forest' && ev.type === 'orbit') {
      add(v, { k: 'orbit', dur: 0.8, cross: ev.cross > 0 }); floater('forest', 'Órbita +' + A.fmt(ev.reward * ev.count), L.forest.target.x - 24, L.forest.crystal.y - 18, 'teal');
    } else if (ev.zone === 'forest' && ev.type === 'constellation') {
      add(v, { k: 'figure', dur: 2.0 }); v.deer = 1; floater('forest', 'Constelación +' + A.fmt(ev.reward * ev.count), L.forest.deer.x, 28, 'teal big');
    }
  };

  // Lanzamiento manual: nace de la mano libre (gesto) y termina en el escenario.
  Scene.manual = function (zid, info) {
    var v = views[zid], Z = L[zid], t = now();
    v.gesture = t;
    if (zid === 'forest') {
      Scene.spawned++;
      add(v, { k: 'manual', x0: Z.free.x - 2, y0: Z.free.y - 12, x1: Z.target.x, y1: Z.target.y, dur: 0.45, amount: info.gain });
    } else if (zid === 'jungle') {
      var idx = info.seqBefore || 0, nx = Z.nodes[Math.min(4, idx)];
      add(v, { k: 'mark', x0: Z.free.x - 2, y0: Z.free.y - 12, x1: nx, y1: Z.nodeY - 3, dur: 0.4 });
      floater('jungle', '+' + A.fmt(info.gain), nx, Z.nodeY - 18, 'acid');
      if (info.bloom > 0) Scene.event({ zone: 'jungle', type: 'bloom', count: 1, reward: info.bloom, cross: 0 });
    } else {
      var Cc = Z.circle, i = (v.extra.seals = (v.extra.seals || 0) + 1) % 6, a = i / 6 * Math.PI * 2;
      add(v, { k: 'seal', x0: Z.free.x - 2, y0: Z.free.y - 10, x1: Cc.x + Math.cos(a) * Cc.rx * 0.6, y1: Cc.y + Math.sin(a) * Cc.ry * 0.6, dur: 1.4, rune: i });
      floater('crypt', '+' + A.fmt(info.gain), Cc.x, Cc.y - 12, 'amber');
    }
  };

  Scene.evolve = function (zid, id, from, to) { views[zid].evo = { id: id, from: from, to: to, t0: now(), dur: reduced ? 1.2 : 2.0 }; };
  Scene.evolving = function (zid) { var e = views[zid || mainZone].evo; return !!(e && now() - e.t0 < e.dur); };
  Scene.awaken = function (zid) { views[zid].extra.awaken = now(); };

  Scene.setAnomaly = function (a) { anomaly = a; };
  Scene.anomalyHit = function (sx, sy) { if (!anomaly) return false; var dx = sx - anomaly.x, dy = sy - anomaly.y; return dx * dx + dy * dy <= 14 * 14; };
  Scene.anomalyBurst = function (x, y, amount) { var v = views[mainZone]; burst(v, x, y, P.violetL, 18); floater(mainZone, '+' + A.fmt(amount), x, y - 8, 'violet big'); };

  // ---------- Bucle de dibujo ----------
  Scene.render = function (st, tMs) {
    if (!mainG) return;
    if (mainVisible) {
      drawZone(mainG, mainZone, st, tMs / 1000, false);
      if (anomaly && anomaly.zone === mainZone) drawAnomaly(mainG, tMs / 1000);
    }
  };
  // Dibuja una zona completa en un contexto 256×144. simple = versión de portal (menos partículas)
  function drawZone(g, zid, st, time, simple) {
    var v = views[zid];
    var dt = v.lastT ? Math.max(0, Math.min(0.1, time - v.lastT)) : 0;
    v.lastT = time;
    clock = time;
    g.drawImage(bgs[zid], 0, 0);
    if (zid === 'forest') drawForest(g, v, st, dt, time, simple);
    else if (zid === 'jungle') drawJungle(g, v, st, dt, time, simple);
    else drawCrypt(g, v, st, dt, time, simple);
    drawParts(g, v, time, simple);
    clock = null;
  }
  Scene.drawZone = drawZone;

  // ---------- Portales de la Sala de la Orden ----------
  Scene.attachPortal = function (zid, canvas) {
    canvas.width = Scene.portalCrop[zid].w + 8; canvas.height = Scene.portalCrop[zid].h + 12;
    var off = offscreen();
    portals[zid] = { cv: canvas, g: canvas.getContext('2d'), buf: off[0], bg: off[1] };
    portals[zid].g.imageSmoothingEnabled = false;
  };
  Scene.detachPortals = function () { portals = {}; };
  Scene.renderPortals = function (st, tMs) {
    var time = tMs / 1000;
    Object.keys(portals).forEach(function (zid) {
      var p = portals[zid], cr = Scene.portalCrop[zid];
      if (!S.isOpen(st, zid)) return;
      drawZone(p.bg, zid, st, time, true);
      var g = p.g, cw = p.cv.width, ch = p.cv.height;
      g.fillStyle = '#0a080e'; g.fillRect(0, 0, cw, ch);
      g.drawImage(p.buf, cr.x, cr.y, cr.w, cr.h, 4, 8, cr.w, cr.h);
      portalFrame(g, cw, ch, zid, time);
    });
  };
  function portalFrame(g, cw, ch, zid, time) {
    var col = { forest: P.teal, jungle: P.acid, crypt: P.amber }[zid], stone = '#2a2430', stoneL = '#3a3244', stoneD = '#14101a';
    Art.rect(g, 0, 0, cw, 8, stone); Art.rect(g, 0, ch - 4, cw, 4, stone); Art.rect(g, 0, 0, 4, ch, stone); Art.rect(g, cw - 4, 0, 4, ch, stone);
    // arco: esquinas superiores redondeadas
    for (var i = 0; i < 14; i++) { var w = Math.round(14 - Math.sqrt(Math.max(0, 196 - (14 - i) * (14 - i)))); Art.rect(g, 4, 8 + i, w, 1, stone); Art.rect(g, cw - 4 - w, 8 + i, w, 1, stone); }
    for (var b = 0; b < cw; b += 12) Art.rect(g, b, 3, 1, 4, stoneD);
    Art.rect(g, 0, 0, cw, 1, stoneL);
    // borde vivo que late con la magia de la zona
    var pulse = reduced ? 0.5 : 0.5 + Math.sin(time * 2) * 0.3;
    g.globalAlpha = pulse;
    for (var x = 18; x < cw - 18; x += 2) Art.px(g, x, 8, col);
    for (var y = 22; y < ch - 4; y += 2) { Art.px(g, 4, y, col); Art.px(g, cw - 5, y, col); }
    g.globalAlpha = 1;
    Art.diamond(g, cw / 2, 3, 2, col);
  }

  // ---------- Utilidades de evolución ----------
  function vt(zid, id, lvl) { return S.visualTier(zid, id, lvl); }
  function evoTier(v, id, current, time) {
    var e = v.evo;
    if (!e || e.id !== id || time - e.t0 > e.dur) return { tier: current, white: false, e: null };
    var p = (time - e.t0) / e.dur;
    if (reduced) return { tier: p < 0.5 ? e.from : e.to, white: false, e: e };
    if (p > 0.82) return { tier: e.to, white: p < 0.9, e: e };
    var freq = 3 + p * p * 30, el = time - e.t0;
    return { tier: Math.floor(el * freq) % 2 ? e.to : e.from, white: p > 0.6 && Math.floor(el * freq) % 3 === 0, e: e };
  }
  function evoPillar(g, x, y, h, et, col, time) {
    if (!et || !et.e) return;
    var p = (time - et.e.t0) / et.e.dur, a = Math.sin(Math.min(1, p) * Math.PI);
    g.globalAlpha = reduced ? a * 0.3 : a * 0.55; Art.rect(g, x - 6, 0, 12, y + h, col);
    g.globalAlpha = reduced ? a * 0.45 : a * 0.85; Art.rect(g, x - 2, 0, 4, y + h, '#ffffff');
    g.globalAlpha = 1;
  }
  function gestureArm(g, v, x, y, col, time, skin) {
    // brazo libre alzado durante 0.3 s tras un lanzamiento manual
    var a = time - v.gesture;
    if (a < 0 || a > 0.35) return false;
    var lift = Math.round(Math.sin(Math.min(1, a / 0.35) * Math.PI) * 6);
    Art.rect(g, x, y - lift, 2, lift + 2, col); Art.px(g, x, y - lift - 1, skin); Art.px(g, x + 1, y - lift - 1, skin);
    g.globalAlpha = 0.8; Art.diamond(g, x + 1, y - lift - 3, 1, '#ffffff'); g.globalAlpha = 1;
    return true;
  }
  function trail(g, pts, cols) { for (var i = 0; i < pts.length; i++) Art.px(g, pts[i][0], pts[i][1], cols[Math.min(cols.length - 1, i)]); }
  function bez(x0, y0, cx, cy, x1, y1, p) { var q = 1 - p; return [q * q * x0 + 2 * q * p * cx + p * p * x1, q * q * y0 + 2 * q * p * cy + p * p * y1]; }

  // =====================================================================
  // BOSQUE
  // =====================================================================
  function drawForest(g, v, st, dt, time, simple) {
    var F = L.forest, z = st.zones.forest, it = z.items, ex = v.extra;
    // niebla y luciérnagas
    if (!simple) {
      g.globalAlpha = 0.05;
      for (var i = 0; i < 3; i++) { var fx1 = ((time * (6 + i * 3)) % (W + 140)) - 140, fy1 = 100 + i * 7; Art.rect(g, fx1 + 10, fy1, 100, 1, P.teal); Art.rect(g, fx1, fy1 + 1, 120, 1, P.teal); Art.rect(g, fx1 + 20, fy1 + 2, 80, 1, P.teal); }
      g.globalAlpha = 1;
      for (i = 0; i < (reduced ? 4 : 9); i++) Art.px(g, (i * 53 + Math.sin(time * 0.4 + i) * 20 + (reduced ? 0 : time * 3)) % W, 60 + i * 6 % 50 + Math.sin(time * 0.9 + i * 2) * 6, Math.sin(time * 3 + i) > 0.2 ? P.teal : P.tealD);
    }
    // Ciervo Hueco tras el cristal: se revela al recibir magia
    v.deer = Math.max(0, v.deer - dt * 1.2);
    v.glow = Math.max(0.15, v.glow - dt * 1.5);
    Art.deer(g, F.deer.x, F.deer.y, 0.35, '#0c1e24');
    if (v.deer > 0.02) Art.deer(g, F.deer.x, F.deer.y, v.deer * 0.8, P.tealM);

    var spellT = vt('forest', 'spell', it.spell), orbitT = vt('forest', 'orbit', it.orbit), prismT = vt('forest', 'prism', it.prism), constT = vt('forest', 'constellation', it.constellation);
    // Constelación: estrellas encendidas según la fase económica de la figura
    if (it.constellation > 0 && it.staff > 0) {
      var cm = S.model(st, 'forest').cycles.filter(function (c) { return c.id === 'constellation'; })[0];
      var stars = Art.deerStars(F.deer.x, F.deer.y), lit = cm ? Math.floor((z.cyc.constellation || 0) / cm.interval * stars.length) : 0;
      stars.forEach(function (s, k) {
        var on = k < lit;
        Art.star(g, s[0], s[1], on ? P.tealW : '#1d4a50', on && constT >= 1 && Math.sin(time * 6 + k) > 0);
        if (on && k > 0 && constT >= 2) Art.line(g, stars[k - 1][0], stars[k - 1][1], s[0], s[1], '#2f7f80', 2);
      });
    }
    // cristal (eclipse durante la Lluvia en su forma final)
    var eclipse = ex.eclipse && time - ex.eclipse < 0.6;
    g.globalAlpha = 0.15 + v.glow * 0.25 + Math.sin(time * 2) * 0.05; Art.diamond(g, F.target.x, F.target.y, 16, eclipse ? '#ffffff' : P.tealM); g.globalAlpha = 1;
    Art.crystal(g, F.crystal.x, F.crystal.y, v.glow, eclipse);
    if (eclipse) { Art.ellipse(g, F.target.x, F.target.y, 7, 11, '#ffffff'); v.deer = 1; }

    // Órbita Gemela: posición de los fragmentos ligada a la fase económica de la alineación
    if (it.orbit > 0) drawOrbit(g, v, st, time, orbitT);

    // lanzamientos automáticos (visuales) desde la punta del báculo
    var casts = S.castRate(it.staff);
    var staffT = vt('forest', 'staff', it.staff);
    v.acc.cast += dt * casts * (simple ? 0.5 : 1);
    var charge = Math.min(1, v.acc.cast);
    while (v.acc.cast >= 1) {
      v.acc.cast -= 1; v.fire = time; Scene.spawned++;
      add(v, { k: 'spark', x0: F.tip.x, y0: F.tip.y, x1: F.target.x + (Math.random() * 6 - 3), y1: F.target.y + (Math.random() * 10 - 5), dur: 0.5, arc: 10 + Math.random() * 14, tier: staffT, mastery: S.masteryLevel(st), prism: it.prism > 0 ? prismT : -1 });
    }
    var robeRate = it.robe > 0 && !simple ? Math.min(4, 0.4 + it.robe * 0.06) : 0;
    v.acc.robe += dt * robeRate;
    while (v.acc.robe >= 1) { v.acc.robe -= 1; add(v, { k: 'mote', x0: F.mage.x + 4 + Math.random() * 9, y0: F.mage.y + 18, dur: 1.8 + Math.random() }); }
    var spellRate = it.spell > 0 ? (spellT >= 4 ? 0.5 : Math.min(3, 0.4 + it.spell * 0.05)) * (simple ? 0.6 : 1) : 0;
    v.acc.spell += dt * spellRate;
    while (v.acc.spell >= 1) { v.acc.spell -= 1; add(v, { k: 'fall', x0: 150 + Math.random() * 90, dur: 0.8 + Math.random() * 0.2, tier: spellT }); }
    // número agregado de la producción continua
    if (!simple) {
      v.agg += S.forestProd(st) * dt; v.acc.agg += dt;
      if (v.acc.agg >= 1.2) { if (v.agg > 0) floater('forest', '+' + A.fmt(v.agg), F.target.x + 12, F.crystal.y - 6, 'teal'); v.agg = 0; v.acc.agg = 0; }
    }

    // aprendiz con capas: túnica, tocado, báculo, anillo y gesto de la mano libre
    var rT = evoTier(v, 'robe', vt('forest', 'robe', it.robe), time);
    var hT = evoTier(v, 'hood', it.hood > 0 ? vt('forest', 'hood', it.hood) : -1, time);
    var sT = evoTier(v, 'staff', staffT, time);
    var bob = reduced ? 0 : Math.round(Math.sin(time * 2) * 0.6);
    var mx = F.mage.x, my = F.mage.y + bob, casting = time - v.fire < 0.15;
    if (Math.max(sT.tier, rT.tier) >= 3) aura(g, mx + 8, my + 14, Math.max(sT.tier, rT.tier), time, P.teal);
    evoPillar(g, mx + 8, my - 6, 30, rT, P.teal, time); evoPillar(g, F.tip.x, F.tip.y - 8, 30, sT, P.tealW, time); evoPillar(g, mx + 8, my - 8, 12, hT, '#c9a66b', time);
    if (it.staff > 0 || sT.e) {
      var sImg = Art.forestStaff(sT.tier);
      g.drawImage(sT.white ? Art.silhouette(sImg, 'sf' + sT.tier) : sImg, F.hand.x - 3 + (casting && !reduced ? 1 : 0), F.hand.y - 18 + bob);
    }
    var body = Art.apprentice(rT.tier, hT.tier, casting || time - v.gesture < 0.3);
    g.drawImage(rT.white ? Art.silhouette(body, 'app' + rT.tier + hT.tier) : body, mx, my);
    if (rT.tier >= 4 && (casting || time - v.gesture < 0.3)) Art.rect(g, mx + 2, my + 22, 12, 1, Art.robePalettes[Math.min(6, rT.tier)].t); // el borde se levanta
    if (hT.tier >= 0) Art.astroHood(g, mx, my, hT.tier, time, casting);
    if (it.staff > 0) {
      Art.forestStaffFx(g, F.tip.x, F.tip.y + bob, sT.tier, time, charge, casting);
      if (casting) { g.globalAlpha = 0.7; Art.diamond(g, F.tip.x, F.tip.y + bob, 2, P.tealW); g.globalAlpha = 1; }
    }
    if (it.ring > 0) { var rgT = evoTier(v, 'ring', vt('forest', 'ring', it.ring), time); Art.ring(g, F.hand.x - 10, F.hand.y - 3 + bob + (reduced ? 0 : Math.round(Math.sin(time * 3))), rgT.tier, time); if (casting && rgT.tier >= 1) Art.px(g, F.hand.x - 9, F.hand.y - 6 + bob, '#ffffff'); }
    gestureArm(g, v, F.free.x, F.free.y - 6 + bob, Art.robePalettes[Math.min(6, rT.tier)].r, time, P.skin);
    var spEvo = evoTier(v, 'spell', spellT, time); evoPillar(g, F.target.x, 0, F.target.y, spEvo, P.teal, time);

    drawForestFx(g, v, st, time, prismT, constT, orbitT);
  }

  function drawOrbit(g, v, st, time, t) {
    var F = L.forest, iv = C.zones.forest.orbit.interval, p = Math.min(1, (st.zones.forest.cyc.orbit || 0) / iv);
    var cx = F.target.x, cy = F.target.y, a = p * Math.PI * 6, b = a + Math.PI * (1 - p);
    function pos(ang, k) {
      if (t >= 5) { var s = Math.sin(ang); return [cx + Math.sin(ang) * 18, cy + s * Math.cos(ang) * 8]; } // órbita en ocho
      var rx = 16, ry = t >= 3 ? 9 : 5, tilt = t >= 3 ? 0.35 : 0;
      var x = Math.cos(ang) * rx, y = Math.sin(ang) * ry;
      return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)];
    }
    var pa = pos(a), pb = pos(b);
    if (t >= 1 && !reduced) for (var k = 1; k <= 4; k++) { var ta = pos(a - k * 0.15), tb = pos(b - k * 0.15); Art.px(g, ta[0], ta[1], P.tealD); Art.px(g, tb[0], tb[1], P.tealD); }
    if (p > 0.82) { g.globalAlpha = (p - 0.82) * 5; Art.line(g, pa[0], pa[1], pb[0], pb[1], P.teal, 2); g.globalAlpha = 1; } // la alineación anticipa la descarga
    if (t >= 3) for (var m = 0; m < 2; m++) { var mp = pos(a * 1.7 + m * Math.PI); Art.px(g, mp[0], mp[1] - 2, '#9fd8cf'); }
    if (t >= 6 && p > 0.92) { Art.diamond(g, (pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, 2 + Math.round((p - 0.92) * 30), '#fff6c8'); }
    else { Art.diamond(g, pa[0], pa[1], 1, P.tealW); Art.diamond(g, pb[0], pb[1], 1, P.teal); }
  }

  function drawForestFx(g, v, st, time, prismT, constT, orbitT) {
    var F = L.forest;
    sweep(v, function (e) {
      var a = time - e.t0; if (a < 0) return true;
      // Si el cuadro llega tarde, el efecto se dibuja en su último instante para no perder su impacto.
      var over = a > e.dur; if (over && (e.k === 'part' || e.done)) return false;
      var p = Math.min(1, a / e.dur);
      if (over) e.done = true;
      if (e.k === 'spark') {
        var x = e.x0 + (e.x1 - e.x0) * p, y = e.y0 + (e.y1 - e.y0) * p - Math.sin(p * Math.PI) * e.arc;
        if (p > 0.96 && !e.hit) { e.hit = 1; v.glow = 1; v.deer = Math.max(v.deer, 0.5); if (e.prism >= 0) add(v, { k: 'prism', dur: 0.45, tier: e.prism, x: e.x1, y: e.y1 }); burst(v, e.x1, e.y1, P.teal, 3); }
        var tl = e.tier >= 2 ? 5 : e.tier >= 1 ? 3 : 2;
        for (var k = tl; k > 0; k--) {
          var q = Math.max(0, p - k * 0.03), tx = e.x0 + (e.x1 - e.x0) * q, ty = e.y0 + (e.y1 - e.y0) * q - Math.sin(q * Math.PI) * e.arc;
          Art.px(g, tx, ty, k > tl / 2 ? P.tealD : P.tealM);
          if (e.mastery >= 1 && k === tl) { Art.px(g, tx, ty - 2, P.tealD); Art.px(g, tx, ty + 2, P.tealD); } // estela bifurcada (maestría I)
          if (e.mastery >= 2) Art.px(g, tx, ty + Math.sin(q * 40) * 2, P.teal);         // estela trenzada (maestría II)
        }
        if (e.tier >= 5) { var sp = Math.sin(p * 18) * 3; Art.diamond(g, x, y + sp, 0, P.teal); Art.diamond(g, x, y - sp, 0, P.tealW); } // chispas gemelas en espiral
        else if (e.tier >= 6) { Art.diamond(g, x, y, 1, '#ffffff'); Art.px(g, x, y, '#000'); }
        else { Art.diamond(g, x, y, e.tier >= 2 ? 1 : 0, P.teal); Art.px(g, x, y, P.tealW); }
        if (e.tier >= 6) { Art.diamond(g, x, y, 1, '#ffffff'); Art.px(g, x, y, '#05030c'); }
        if (e.mastery >= 3) for (var s2 = 0; s2 < 3; s2++) Art.px(g, x + Math.cos(time * 8 + s2 * 2) * 3, y + Math.sin(time * 8 + s2 * 2) * 3, '#fff6c8'); // halo de estrellas (maestría III)
      } else if (e.k === 'manual') {
        // Chispa de la mano libre: estrella blanca recta y rápida, distinta de la del báculo
        var mx = e.x0 + (e.x1 - e.x0) * p, my = e.y0 + (e.y1 - e.y0) * p;
        Art.line(g, e.x0 + (e.x1 - e.x0) * Math.max(0, p - 0.12), e.y0 + (e.y1 - e.y0) * Math.max(0, p - 0.12), mx, my, P.tealW, 2);
        Art.star(g, mx, my, '#ffffff', true);
        if (p > 0.95 && !e.hit) { e.hit = 1; v.glow = 1; v.deer = 1; burst(v, e.x1, e.y1, P.tealW, 9); floater('forest', '+' + A.fmt(e.amount), e.x1 - 6, e.y1 - 14, 'teal big'); }
      } else if (e.k === 'mote') {
        var mx2 = e.x0 + (F.target.x - e.x0) * p * p, my2 = e.y0 - Math.sin(p * Math.PI) * 30 + (F.target.y - e.y0) * p;
        Art.px(g, mx2, my2, '#9fc9b8');
      } else if (e.k === 'fall') drawFall(g, v, e, p, a, time);
      else if (e.k === 'prism') drawPrism(g, v, e, p);
      else if (e.k === 'orbit') {
        // Descarga de la alineación: destello (0–1), rayo vertical (2–3), anillo (4–5), estallido solar (6)
        v.glow = 1; g.globalAlpha = 1 - p;
        if (orbitT <= 1) Art.line(g, F.target.x - 16, F.target.y, F.target.x + 16, F.target.y, P.tealW);
        else if (orbitT <= 3) { Art.rect(g, F.target.x - 1, F.target.y - 34 + p * 10, 3, 50, P.tealW); }
        else if (orbitT <= 5) { var r = 6 + p * 30; Art.ellipse(g, F.target.x, F.target.y, r, r * 0.6, P.tealW); Art.ellipse(g, F.target.x, F.target.y, r * 0.6, r * 0.36, P.teal, 2); }
        else for (var ry = 0; ry < 12; ry++) { var an = ry / 12 * Math.PI * 2; Art.line(g, F.target.x, F.target.y, F.target.x + Math.cos(an) * (8 + p * 26), F.target.y + Math.sin(an) * (6 + p * 18), '#fff6c8', 2); }
        if (e.cross) Art.ellipse(g, F.target.x, F.target.y, 10 + p * 20, 6 + p * 12, P.acid, 2);
        g.globalAlpha = 1;
      } else if (e.k === 'figure') drawFigure(g, v, e, p, constT, time);
      return !over;
    });
  }

  // Lluvia de Chispas: 7 lecturas distintas (trayectoria, forma e impacto)
  function drawFall(g, v, e, p, a, time) {
    var F = L.forest, tx = F.target.x, ty = F.target.y, t = e.tier;
    function impact(x, y, n) { if (!e['h' + n]) { e['h' + n] = 1; v.glow = 1; burst(v, x, y, t >= 2 ? P.tealW : P.teal, reduced ? 2 : 5); } }
    if (t <= 1) {
      var cxp = t === 1 ? e.x0 - 30 : (e.x0 + tx) / 2, q = bez(e.x0, -6, cxp, 30, tx, ty, p);
      var n = t === 1 ? 7 : 3;
      for (var k = n; k >= 1; k--) { var b = bez(e.x0, -6, cxp, 30, tx, ty, Math.max(0, p - k * 0.025)); Art.px(g, b[0], b[1], k < n / 2 ? P.teal : P.tealD); }
      if (t === 1) Art.diamond(g, q[0], q[1], 1, P.tealW); else Art.px(g, q[0], q[1], P.tealW);
      if (p > 0.97) impact(tx, ty, 0);
    } else if (t === 2) { // se abre en dos fragmentos antes del impacto
      if (p < 0.7) { var q2 = bez(e.x0, -6, e.x0 - 30, 30, tx, ty - 20, p / 0.7); Art.diamond(g, q2[0], q2[1], 1, P.tealW); for (var k2 = 1; k2 < 6; k2++) { var b2 = bez(e.x0, -6, e.x0 - 30, 30, tx, ty - 20, Math.max(0, p / 0.7 - k2 * 0.04)); Art.px(g, b2[0], b2[1], P.tealD); } }
      else { var s = (p - 0.7) / 0.3; Art.diamond(g, tx - 8 * s, ty - 20 + 20 * s, 1, P.tealW); Art.diamond(g, tx + 8 * s, ty - 20 + 20 * s, 1, P.teal); Art.line(g, tx, ty - 20, tx - 8 * s, ty - 20 + 20 * s, P.tealD, 2); Art.line(g, tx, ty - 20, tx + 8 * s, ty - 20 + 20 * s, P.tealD, 2); if (s > 0.95) { impact(tx - 6, ty, 1); impact(tx + 6, ty, 2); } }
    } else { // 3+: los fragmentos rodean el cristal desde lados opuestos y convergen
      var r = 30 * (1 - p), ang = p * Math.PI * 1.5;
      var l = [tx - Math.cos(ang) * r, ty - Math.sin(ang) * r * 0.6], rr = [tx + Math.cos(ang) * r, ty + Math.sin(ang) * r * 0.6];
      Art.diamond(g, l[0], l[1], 1, P.tealW); Art.diamond(g, rr[0], rr[1], 1, P.teal);
      if (!reduced) for (var k3 = 1; k3 < 4; k3++) { var a2 = (p - k3 * 0.03) * Math.PI * 1.5, r2 = 30 * (1 - p + k3 * 0.03); Art.px(g, tx - Math.cos(a2) * r2, ty - Math.sin(a2) * r2 * 0.6, P.tealD); Art.px(g, tx + Math.cos(a2) * r2, ty + Math.sin(a2) * r2 * 0.6, P.tealD); }
      if (p > 0.97 && !e.h0) {
        impact(tx, ty, 0);
        if (t >= 4) add(v, { k: 'figure', dur: 1.0, mini: true, wave: t >= 5 });
        if (t >= 6) v.extra.eclipse = time;
      }
    }
  }
  // Prisma del Velo: 7 refracciones distintas
  function drawPrism(g, v, e, p) {
    var F = L.forest, x = F.target.x, y = F.target.y - 2, t = e.tier, len = Math.round(6 + p * 14), A2 = 1 - p;
    g.globalAlpha = A2;
    if (t === 0) Art.line(g, x, y, x + len * 0.4, y - len, P.tealW);
    else if (t === 1) { Art.line(g, x, y, x + len * 0.6, y - len, P.tealW); Art.line(g, x, y, x - len * 0.6, y - len, P.teal); }
    else if (t === 2) ['#d8fffa', '#5ff0e0', '#1fb5a8'].forEach(function (c, i) { Art.line(g, x, y, x + (i - 1) * len * 0.7, y - len, c); });
    else if (t === 3) { Art.line(g, x, y, 178, 48, P.tealW, 2); if (p > 0.4) Art.line(g, 178, 48, 206, 48, P.teal, 2); if (p > 0.7) Art.line(g, 206, 48, x, y, P.tealW, 2); }
    else if (t === 4) { var tri = [[x, y - 6], [x - 4, y + 4], [x + 4, y + 4]]; for (var i = 0; i < 3; i++) Art.line(g, tri[i][0], tri[i][1], tri[(i + 1) % 3][0], tri[(i + 1) % 3][1], '#ffffff'); tri.forEach(function (q) { Art.line(g, q[0], q[1], q[0] + (q[0] - x) * 3, q[1] + (q[1] - y) * 3, P.teal, 2); }); }
    else if (t === 5) for (var s = 0; s < 14; s++) { var a = s * 0.5 + p * 4, r = s * 1.6 * (0.4 + p); Art.px(g, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7, s % 2 ? P.teal : P.tealW); }
    else { Art.line(g, x, y, F.deer.x - 13, F.deer.y - 13, P.tealW, 2); Art.line(g, x, y, F.deer.x + 13, F.deer.y - 13, P.tealW, 2); v.deer = Math.max(v.deer, 0.8); }
    g.globalAlpha = 1;
  }
  // Constelación del Ciervo completada: 7 lecturas
  function drawFigure(g, v, e, p, t, time) {
    var F = L.forest, stars = Art.deerStars(F.deer.x, F.deer.y), al = Math.sin(p * Math.PI);
    if (e.mini) { // constelación breve de la Lluvia (Nv 150) y segunda oleada (Nv 200)
      g.globalAlpha = al; for (var i = 1; i < stars.length; i++) Art.line(g, stars[i - 1][0], stars[i - 1][1], stars[i][0], stars[i][1], P.tealW, 2); g.globalAlpha = 1;
      if (e.wave && p > 0.4) for (var w = 0; w < 3; w++) { var q = (p - 0.4) / 0.6; Art.diamond(g, stars[w * 3][0] + (F.target.x - stars[w * 3][0]) * q, stars[w * 3][1] + (F.target.y - stars[w * 3][1]) * q, 0, P.tealW); }
      return;
    }
    g.globalAlpha = al;
    for (var k = 1; k < stars.length; k++) Art.line(g, stars[k - 1][0], stars[k - 1][1], stars[k][0], stars[k][1], P.tealW, t >= 1 ? 1 : 2);
    stars.forEach(function (s) { Art.star(g, s[0], s[1], '#ffffff', t >= 1); });
    if (t >= 2) Art.deer(g, F.deer.x + (t >= 4 && p > 0.5 ? 2 : 0), F.deer.y, t >= 3 ? 0.9 : 0.6, t >= 3 ? P.tealM : P.tealD);
    g.globalAlpha = 1;
    if (t >= 5 && p > 0.3 && p < 0.8) { var q2 = (p - 0.3) / 0.5; Art.diamond(g, F.deer.x + (F.target.x - F.deer.x) * q2, F.deer.y - 18 + (F.target.y - F.deer.y + 18) * q2, 2, '#ffffff'); }
    if (t >= 6) { g.globalAlpha = al * 0.7; Art.deer(g, F.target.x, F.target.y - 30, 1, P.tealW, 1.5); g.globalAlpha = 1; }
  }

  // =====================================================================
  // JUNGLA
  // =====================================================================
  function drawJungle(g, v, st, dt, time, simple) {
    var J = L.jungle, z = st.zones.jungle, it = z.items, ex = v.extra;
    var m = S.model(st, 'jungle'), seqLen = C.zones.jungle.prune.seqLength, idx = z.seq.bloom || 0;
    ex.lastSeq = idx;
    var sickT = it.sickle > 0 ? vt('jungle', 'sickle', it.sickle) : -1, polT = vt('jungle', 'pollen', it.pollen), grT = vt('jungle', 'graft', it.graft), mawT = vt('jungle', 'maw', it.maw);
    // niebla húmeda
    if (!simple) { g.globalAlpha = 0.06; for (var i = 0; i < 2; i++) Art.rect(g, ((time * (4 + i * 2)) % (W + 140)) - 140, 104 + i * 8, 140, 2, '#9fd08a'); g.globalAlpha = 1; }
    // Reina Injerto (las bocas se abren al florecer)
    var bloomAge = time - v.flash, open = bloomAge >= 0 && bloomAge < 1.8 ? Math.sin(Math.min(1, bloomAge / 1.8) * Math.PI) : 0.08 + Math.sin(time * 1.3) * 0.05;
    var mEvo = evoTier(v, 'maw', mawT, time);
    Art.queen(g, J.queen.x, J.queen.y, open, it.maw > 0 ? mEvo.tier : -1, time);
    evoPillar(g, J.queen.x + 2, J.queen.y, 40, mEvo, P.sickL, time);
    if (it.maw > 0 && mEvo.tier >= 4 && open > 0.5) for (var sp = 0; sp < 3; sp++) Art.px(g, J.queen.x + 2 - (bloomAge * 40 + sp * 6), J.queen.y + 20 + sp * 3, P.acid);
    // nodos de la secuencia (raíces corrompidas → cortadas), leídos de la fase económica
    J.nodes.forEach(function (nx, k) {
      var cut = k < idx, target = k === idx;
      if (cut) { Art.rect(g, nx - 1, J.nodeY - 2, 3, 2, '#5f8f1a'); Art.px(g, nx, J.nodeY - 3, P.acid); }
      else { Art.rect(g, nx - 2, J.nodeY - 4, 5, 4, '#6a2050'); Art.rect(g, nx - 1, J.nodeY - 5, 3, 1, '#8a2a6a'); Art.px(g, nx, J.nodeY - 3, P.sickL); }
      if (target && it.grimoire > 0 && Math.sin(time * 6) > 0) Art.ellipse(g, nx, J.nodeY - 3, 4, 3, P.acid, 2);
    });
    // contador legible de la secuencia
    for (var s = 0; s < seqLen; s++) Art.rect(g, J.nodes[0] - 4 + s * 4, 136, 3, 2, s < idx ? P.acid : '#2a3a20');
    // Polen Errante: nube que sigue la secuencia
    if (it.pollen > 0) drawPollen(g, v, time, idx, polT, simple);
    // Injerto de Luna: brote lateral que madura con su ciclo económico
    if (it.graft > 0 && it.grimoire > 0) {
      var gp = Math.min(1, (z.cyc.graft || 0) / C.zones.jungle.graft.interval), gx = J.graft.x, gy = J.graft.y, hgt = 6 + Math.round(gp * (grT >= 4 ? 18 : 10));
      Art.line(g, gx, gy, gx - 2, gy - hgt, '#3f6a22');
      var buds = grT >= 3 ? 2 : 1;
      for (var b = 0; b < buds; b++) {
        var bx = gx - 2 + b * 5, by = gy - hgt + b * 4, rad = Math.round(1 + gp * 2);
        if (grT >= 1) { g.globalAlpha = 0.3 * gp; Art.diamond(g, bx, by, rad + 3, '#e8f0ff'); g.globalAlpha = 1; }
        if (grT >= 2) { Art.ellipse(g, bx, by, rad + 1, rad + 1, '#e8f0ff', 0, -Math.PI / 2, Math.PI / 2); }
        Art.diamond(g, bx, by, rad, grT >= 5 && gp > 0.8 ? '#ffffff' : '#c8d0ff');
      }
    }
    // herborista: capas de túnica, tocado, collar, grimorio y gesto
    var rT = evoTier(v, 'robe', vt('jungle', 'robe', it.robe), time), hT = evoTier(v, 'hat', it.hat > 0 ? vt('jungle', 'hat', it.hat) : -1, time), gT = evoTier(v, 'grimoire', vt('jungle', 'grimoire', it.grimoire), time);
    var bob = reduced ? 0 : Math.round(Math.sin(time * 1.6) * 0.6), mx = J.mage.x, my = J.mage.y + bob;
    var firing = time - v.fire < 0.3;
    if (Math.max(rT.tier, gT.tier) >= 3) aura(g, mx + 8, my + 14, Math.max(rT.tier, gT.tier), time, P.acid);
    evoPillar(g, mx + 8, my - 6, 30, rT, P.acid, time); evoPillar(g, J.book.x + 4, J.book.y - 6, 20, gT, '#e8ff9a', time); evoPillar(g, mx + 8, my - 8, 12, hT, P.acid, time);
    var body = Art.herbalist(rT.tier, firing || time - v.gesture < 0.3);
    g.drawImage(rT.white ? Art.silhouette(body, 'herb' + rT.tier) : body, mx, my);
    if (hT.tier >= 0) Art.thornCrown(g, mx, my, hT.tier, firing);
    if (it.collar > 0) { Art.collar(g, mx + 6, my + 8, vt('jungle', 'collar', it.collar)); if (firing && it.collar >= 10) Art.px(g, mx + 9, my + 7, P.acid); }
    if (it.grimoire > 0 || gT.e) {
      var flip = firing ? (time - v.fire) / 0.3 : 0;
      Art.grimoire(g, J.book.x, J.book.y + bob + (reduced ? 0 : Math.round(Math.sin(time * 2.4))), gT.tier, flip, time, firing);
      if (gT.white) { g.globalAlpha = 0.8; Art.rect(g, J.book.x, J.book.y + bob, 10, 6, '#ffffff'); g.globalAlpha = 1; }
    }
    gestureArm(g, v, J.free.x, J.free.y - 6 + bob, Art.herbPalettes[Math.min(6, rT.tier)].r, time, P.skinJ);
    var skEvo = evoTier(v, 'sickle', sickT, time); evoPillar(g, J.nodes[2], J.nodeY - 30, 30, skEvo, P.acid, time);
    var plEvo = evoTier(v, 'pollen', polT, time); evoPillar(g, J.nodes[idx % 5], J.nodeY - 40, 30, plEvo, '#ffe08a', time);
    var gfEvo = evoTier(v, 'graft', grT, time); evoPillar(g, J.graft.x, J.graft.y - 30, 30, gfEvo, '#e8f0ff', time);
    if (!simple && it.robe > 0) { v.agg += m.passive * dt; v.acc.agg += dt; if (v.acc.agg >= 1.5) { if (v.agg > 0) floater('jungle', '+' + A.fmt(v.agg), mx + 8, my - 10, 'acid'); v.agg = 0; v.acc.agg = 0; } }

    drawJungleFx(g, v, st, time, sickT, polT, grT, it.grimoire);
  }

  function drawPollen(g, v, time, idx, t, simple) {
    var J = L.jungle, nx = J.nodes[Math.min(4, idx)], ny = J.nodeY - 14, n = simple ? 4 : 7;
    if (t >= 4) { g.globalAlpha = 0.4; for (var k = 0; k <= idx && k < 5; k++) Art.rect(g, J.nodes[k] - 2, J.nodeY - 1, 5, 1, '#ffe08a'); g.globalAlpha = 1; }
    if (t >= 2) for (var k2 = 0; k2 < idx && k2 < 5; k2++) for (var d = 0; d < 2; d++) Art.px(g, J.nodes[k2] + Math.sin(time * 3 + d + k2) * 3, J.nodeY - 9 + d, '#d8c060');
    for (var i = 0; i < n; i++) {
      var a = time * (t >= 3 ? 3 : 1.4) + i * 0.9, r = t >= 3 ? 2 + (i % 3) * 2 : 4;
      var px = nx + Math.cos(a) * r * (t >= 3 ? 1 : 1.4), py = ny + Math.sin(a * (t >= 3 ? 1 : 1.3)) * (t >= 3 ? r : 2);
      Art.px(g, px, py, i % 2 ? '#ffe08a' : '#d8c060');
      if (t >= 1 && !reduced && i % 3 === 0) Art.px(g, px - 2, py + 3 + (time * 4 % 3), '#a89040');
      if (t >= 5 && i % 3 === 1) { Art.px(g, px + 1, py, '#ffd0f0'); Art.px(g, px - 1, py, '#ffd0f0'); }
    }
  }

  function drawJungleFx(g, v, st, time, sickT, polT, grT, grimLvl) {
    var J = L.jungle;
    var gT = vt('jungle', 'grimoire', grimLvl);
    sweep(v, function (e) {
      var a = time - e.t0; if (a < 0) return true;
      var over = a > e.dur; if (over && (e.k === 'part' || e.done)) return false;
      var p = Math.min(1, a / e.dur);
      if (over) e.done = true;
      if (e.k === 'prune') {
        // la hoja sale del grimorio (varias páginas la lanzan juntas en su forma final) y corta la raíz marcada
        var node = Math.min(4, e.node), nx = J.nodes[node], ny = J.nodeY - 3, sx = J.book.x + 4, sy = J.book.y;
        var blades = sickT >= 5 ? 3 : 1, launchers = gT >= 6 ? 3 : 1;
        for (var bl = 0; bl < blades * launchers; bl++) {
          var off = (bl - (blades * launchers - 1) / 2) * 8, q = Math.min(1, p / 0.6);
          var cx = (sx + nx) / 2 + off, cy = sickT >= 1 ? sy - 24 : (sy + ny) / 2;
          var pt = sickT >= 3 && p > 0.6 ? bez(nx, ny, cx, cy, sx, sy, (p - 0.6) / 0.4) : bez(sx, sy, cx, cy, nx, ny, q); // bumerán vuelve
          drawBlade(g, pt[0], pt[1], sickT, time);
        }
        if (p > 0.55 && !e.hit) {
          e.hit = 1; burst(v, nx, ny, P.acid, 5);
          if (sickT >= 2) add(v, { k: 'slash', dur: 0.4, x: nx + 6, y: ny });
          if (sickT >= 4) add(v, { k: 'trail', dur: 0.6, x: nx });
          if (sickT >= 6) add(v, { k: 'scythe', dur: 0.7 });
        }
      } else if (e.k === 'slash') { g.globalAlpha = 1 - p; Art.line(g, e.x - 3, e.y - 3, e.x + 3, e.y + 3, P.acid); Art.line(g, e.x - 3, e.y + 3, e.x + 3, e.y - 3, P.acid); g.globalAlpha = 1; }
      else if (e.k === 'trail') { g.globalAlpha = 1 - p; Art.rect(g, J.nodes[0] - 4, J.nodeY + 1, (e.x - J.nodes[0] + 6) * Math.min(1, p * 2), 1, P.acid); g.globalAlpha = 1; }
      else if (e.k === 'scythe') { Art.ellipse(g, (J.nodes[0] + J.nodes[4]) / 2, J.nodeY - 4, 46, 12, '#e8f0ff', 2, Math.PI * (1 + p * 0.9), Math.PI * (1.1 + p * 0.9)); }
      else if (e.k === 'mark') { // marca manual: un sello verde viaja desde la mano libre
        var mx = e.x0 + (e.x1 - e.x0) * p, my = e.y0 + (e.y1 - e.y0) * p - Math.sin(p * Math.PI) * 10;
        Art.rune(g, mx - 1, my - 1, 2, P.acid);
        if (p > 0.9) { g.globalAlpha = 1 - (p - 0.9) * 10; Art.ellipse(g, e.x1, e.y1, 4, 3, '#ffffff'); g.globalAlpha = 1; }
      } else if (e.k === 'bloom') {
        // flores sanas recorren las raíces cortadas; el polen se dispersa
        var reach = Math.min(5, Math.floor(p * 7));
        for (var k = 0; k < reach; k++) { var fx = J.nodes[k], fy = J.nodeY - 6 - Math.round(Math.sin(Math.min(1, p * 2) * Math.PI / 2) * 3); Art.px(g, fx, fy, '#ffd0f0'); Art.px(g, fx - 1, fy + 1, '#ff9ad6'); Art.px(g, fx + 1, fy + 1, '#ff9ad6'); Art.px(g, fx, fy + 1, '#ffe08a'); }
        if (polT >= 6) for (var s = 0; s < 12; s++) Art.px(g, J.nodes[0] + (s * 37 + p * 60) % 100, J.nodeY - 30 + Math.sin(s + p * 8) * 12, '#ffe08a');
      } else if (e.k === 'graftcut') {
        g.globalAlpha = 1 - p; Art.line(g, J.graft.x - 6, J.graft.y - 14, J.graft.x + 6, J.graft.y - 4, '#ffffff');
        if (grT >= 6) Art.ellipse(g, J.graft.x, J.graft.y - 14, 8 + p * 8, 8 + p * 8, '#e8f0ff', 2);
        g.globalAlpha = 1;
      }
      return !over;
    });
  }
  function drawBlade(g, x, y, t, time) {
    if (t < 0) { Art.px(g, x, y, P.acid); Art.px(g, x + 1, y, P.acidD); return; } // hoja simple sin Hoja de Siega
    if (t === 0) { Art.px(g, x, y, P.acid); Art.px(g, x + 1, y - 1, P.acid); Art.px(g, x - 1, y + 1, P.acidD); return; }
    var a = time * 14;
    for (var i = -2; i <= 2; i++) Art.px(g, x + Math.cos(a + i * 0.4) * 3, y + Math.sin(a + i * 0.4) * 3, t >= 6 ? '#e8f0ff' : P.acid);
  }

  // =====================================================================
  // CRIPTA
  // =====================================================================
  function drawCrypt(g, v, st, dt, time, simple) {
    var Cz = L.crypt, z = st.zones.crypt, it = z.items, ex = v.extra, Cc = Cz.circle, B = Cz.bell;
    var bellT = vt('crypt', 'bell', it.bell), chalkT = vt('crypt', 'chalk', it.chalk), incT = vt('crypt', 'incense', it.incense), litT = vt('crypt', 'litany', it.litany);
    [[21, 81], [33, 79], [221, 81], [233, 79]].forEach(function (p, i) {
      var fl = reduced ? 0 : Math.round(Math.sin(time * 9 + i * 3) * 0.7);
      g.globalAlpha = 0.2; Art.diamond(g, p[0], p[1] - 2, 5, P.amber); g.globalAlpha = 1;
      Art.px(g, p[0], p[1] - 3 + fl, P.amberL); Art.px(g, p[0], p[1] - 2, P.amber); Art.px(g, p[0], p[1] - 1, P.amberD);
    });
    var interval = S.cryptInterval(st), charge = it.staff > 0 ? Math.min(1, (z.cyc.pulse || 0) / interval) : 0;
    var sinceFlash = time - v.flash, flash = sinceFlash >= 0 && sinceFlash < 0.5 ? 1 - sinceFlash / 0.5 : 0;
    // purificación de la Letanía en su forma final: los muros brillan
    var litAge = time - (ex.litany || -9);
    if (litT >= 6 && litAge < 1.2) { g.globalAlpha = 0.25 * (1 - litAge / 1.2); Art.rect(g, 0, 0, W, 118, P.amberL); g.globalAlpha = 1; }

    // círculo de tiza (forma final en su tope real)
    var chEvo = evoTier(v, 'chalk', chalkT, time); evoPillar(g, Cc.x, Cc.y - 30, 30, chEvo, P.chalk, time);
    var ringCol = flash > 0.3 ? P.amberL : (chEvo.white ? '#ffffff' : P.chalk);
    Art.ellipse(g, Cc.x, Cc.y, Cc.rx, Cc.ry, ringCol);
    if (chEvo.tier >= 1) Art.ellipse(g, Cc.x, Cc.y, Cc.rx - 5, Cc.ry - 2, chEvo.tier >= 6 ? P.amberL : P.chalkD);
    if (chEvo.tier >= 6) { Art.ellipse(g, Cc.x, Cc.y, Cc.rx + 4, Cc.ry + 2, P.chalkD, 2); for (var r = 0; r < 4; r++) Art.rune(g, Cc.x - 16 + r * 9, Cc.y - 1, r + 1, P.amber); }
    // sellos: se encienden con la carga; desde Nv 10 giran
    var lit = Math.floor(charge * 6 + 1e-9), rot = chEvo.tier >= 1 && !reduced ? time * 0.4 : 0;
    for (var i = 0; i < 6; i++) {
      var a = -Math.PI / 2 + i / 6 * Math.PI * 2 + rot;
      var sx = Cc.x + Math.cos(a) * (Cc.rx + 1) - 1, sy = Cc.y + Math.sin(a) * (Cc.ry + 1) - 1, on = i < lit || flash > 0.5;
      if (on) { g.globalAlpha = 0.35; Art.diamond(g, sx + 1, sy + 1, 3, P.amber); g.globalAlpha = 1; }
      Art.rune(g, sx, sy, i, on ? P.amberL : '#6b4a2a');
    }
    // cilindro de runas del círculo perfecto al pulsar
    if (chEvo.tier >= 6 && flash > 0) { g.globalAlpha = flash * 0.6; for (var c2 = 0; c2 < 5; c2++) Art.rune(g, Cc.x - 20 + c2 * 9, Cc.y - 12 - flash * 30, c2, P.amberL); g.globalAlpha = 1; }

    // Rey sin Réquiem: se materializa con la carga, se disipa con la campanada
    var kingA = it.staff > 0 ? charge * 0.8 * (1 - flash) : 0.15;
    var crownParts = it.litany > 0 ? (z.seq.litany || 0) : 0;
    Art.king(g, Cc.x, Cc.y - 2, kingA, crownParts, C.zones.crypt.litany.every, litT);
    if (bellT >= 6 && flash > 0.2) for (var mo = 0; mo < 10; mo++) Art.px(g, Cc.x + Math.cos(mo) * (1 - flash) * 20, Cc.y - 14 - (1 - flash) * 20 + Math.sin(mo * 2) * 6, '#c8c0d8');
    // Incienso de Vigilia: el hilo de humo recorre el círculo entre campanadas
    if (it.incense > 0) drawIncense(g, Cc, charge, incT, time, kingA);

    // campana
    var bEvo = evoTier(v, 'bell', bellT, time); evoPillar(g, B.x, B.y, 20, bEvo, P.amber, time);
    ex.bellVel = (ex.bellVel || 0) + (-(ex.bellSwing || 0) * 40 - (ex.bellVel || 0) * 3) * dt;
    ex.bellSwing = (ex.bellSwing || 0) + ex.bellVel * dt;
    if (reduced) { ex.bellSwing = 0; ex.bellVel = 0; }
    if (bEvo.tier >= 3) { g.globalAlpha = 0.25; Art.diamond(g, B.x, B.y + 11, 16, P.amber); g.globalAlpha = 1; }
    Art.bell(g, B.x, B.y, bEvo.tier, ex.bellSwing);
    if (bEvo.white) { g.globalAlpha = 0.7; Art.diamond(g, B.x, B.y + 10, 11, '#ffffff'); g.globalAlpha = 1; }
    if (it.staff > 0) { var bx = B.x - 20, by = B.y + 28; Art.rect(g, bx - 1, by - 1, 42, 4, '#0c0812'); Art.rect(g, bx, by, Math.round(40 * charge), 2, charge > 0.85 ? P.amberL : P.amber); }

    drawCryptFx(g, v, st, time, bellT, litT);

    // maga: túnica, mitra, medallón, báculo y gesto
    var M = Cz.mage, vT = evoTier(v, 'vest', vt('crypt', 'vest', it.vest), time), mT = evoTier(v, 'mitre', it.mitre > 0 ? vt('crypt', 'mitre', it.mitre) : -1, time), sT = evoTier(v, 'staff', vt('crypt', 'staff', it.staff), time);
    var bob = reduced ? 0 : Math.round(Math.sin(time * 1.7) * 0.6), aw = 1;
    if (ex.awaken) {
      var aa = time - ex.awaken; aw = Math.min(1, aa / 1.6);
      if (aa > 2.2) ex.awaken = 0;
      g.globalAlpha = Math.sin(aw * Math.PI) * 0.8; Art.rect(g, M.x - 4, 0, 24, M.y + 24, P.amber); g.globalAlpha = 1;
    }
    if (T(st, 'bells') > 0 || sT.tier >= 3) aura(g, M.x + 8, M.y + 14, 3 + T(st, 'bells'), time, P.amber);
    evoPillar(g, Cz.tip.x, Cz.tip.y - 6, 30, sT, P.amber, time); evoPillar(g, M.x + 8, M.y - 6, 30, vT, P.amberL, time); evoPillar(g, M.x + 8, M.y - 8, 12, mT, '#e8e0d0', time);
    if (it.staff > 0 || sT.e) { var sImg = Art.cryptStaff(sT.tier); g.drawImage(sT.white ? Art.silhouette(sImg, 'sc' + sT.tier) : sImg, Cz.hand.x - 3, Cz.hand.y - 18 + bob); }
    g.globalAlpha = aw;
    var glowNow = flash > 0.3;
    var mImg = Art.mage(vT.tier, mT.tier >= 0, glowNow);
    g.drawImage(vT.white ? Art.silhouette(mImg, 'mage' + vT.tier) : mImg, M.x, M.y + bob + Math.round((1 - aw) * 6));
    g.globalAlpha = 1;
    if (mT.tier >= 0) Art.mitre(g, M.x, M.y + bob - 2, mT.tier, time, glowNow);
    if (it.medallion > 0) { Art.medallion(g, M.x + 8, M.y + 13 + bob, vt('crypt', 'medallion', it.medallion)); if (glowNow) { g.globalAlpha = 0.6; Art.diamond(g, M.x + 8, M.y + 13 + bob, 3, P.amberL); g.globalAlpha = 1; } }
    if (it.staff > 0) {
      Art.cryptStaffFx(g, Cz.tip.x, Cz.tip.y + bob, sT.tier, time, charge);
      if (charge > 0.05) { // haz de carga del báculo al círculo
        g.globalAlpha = 0.25 + charge * 0.6;
        for (var k = 0; k < 24; k++) { if (!reduced && (k + Math.floor(time * 20)) % 3 === 0) continue; var q = k / 24; Art.px(g, Cz.tip.x + (Cc.x - Cz.tip.x) * q, Cz.tip.y + bob + (Cc.y - Cz.tip.y) * q - Math.sin(q * Math.PI) * 10, P.amber); }
        Art.diamond(g, Cz.tip.x, Cz.tip.y + bob, 1 + Math.round(charge * 2), P.amberL); g.globalAlpha = 1;
      }
    }
    gestureArm(g, v, Cz.free.x, Cz.free.y - 8 + bob, Art.vestPalettes[Math.min(6, vT.tier)].v, time, P.skin);
    var iEvo = evoTier(v, 'incense', incT, time); evoPillar(g, Cc.x - 30, Cc.y - 30, 30, iEvo, '#c8c0d8', time);
    var lEvo = evoTier(v, 'litany', litT, time); evoPillar(g, Cc.x, Cc.y - 50, 20, lEvo, P.amberL, time);
  }
  function T(st, id) { return st.prestige.talents[id] || 0; }

  function drawIncense(g, Cc, charge, t, time, kingA) {
    var threads = t >= 2 ? 2 : 1, n = reduced ? 8 : 16;
    for (var th = 0; th < threads; th++) {
      var head = charge * Math.PI * 2 + th * Math.PI;
      for (var i = 0; i < n; i++) {
        var a = head - i * 0.12, rise = t >= 1 ? i * 0.5 : 0;
        var x = Cc.x + Math.cos(a) * (Cc.rx - 2), y = Cc.y + Math.sin(a) * (Cc.ry - 1) - rise - 2;
        g.globalAlpha = (1 - i / n) * 0.8; Art.px(g, x, y, i === 0 ? '#ffffff' : '#c8c0d8'); g.globalAlpha = 1;
      }
    }
    if (t >= 3) { g.globalAlpha = 0.5; Art.rune(g, Cc.x - 24 + (time * 6 % 48), Cc.y - 10, Math.floor(time) % 6, '#c8c0d8'); g.globalAlpha = 1; }
    if (t >= 4) { g.globalAlpha = 0.35; for (var f = 0; f < 2; f++) { var fx = Cc.x - 30 + f * 60, fy = Cc.y - 18 - Math.sin(time + f) * 2; Art.rect(g, fx - 2, fy - 2, 5, 5, '#c8c0d8'); Art.px(g, fx - 1, fy - 1, '#1b1327'); Art.px(g, fx + 1, fy - 1, '#1b1327'); Art.px(g, fx, fy + 1, '#1b1327'); } g.globalAlpha = 1; }
    if (t >= 5 && !reduced) for (var r = 0; r < 2; r++) { var ry = (time * 10 + r * 20) % 40; g.globalAlpha = 0.5 * (1 - ry / 40); Art.ellipse(g, Cc.x, Cc.y - 10 - ry, 6 + ry * 0.2, 2, '#c8c0d8'); g.globalAlpha = 1; }
    if (t >= 6 && kingA > 0.2) { g.globalAlpha = kingA; Art.ellipse(g, Cc.x, Cc.y - 30, 6, 2, '#ffffff', 0, Math.PI, Math.PI * 2); g.globalAlpha = 1; }
  }

  // Pulso y letanía: 7 lecturas de la campanada
  function drawCryptFx(g, v, st, time, bellT, litT) {
    var Cz = L.crypt, Cc = Cz.circle, B = Cz.bell;
    sweep(v, function (e) {
      var a = time - e.t0; if (a < 0) return true; if (a > e.dur) return false;
      var p = a / e.dur;
      if (e.k === 'pulse') {
        if (a < 0.5) { // haz del círculo a la campana
          var al = 1 - a / 0.5; g.globalAlpha = al;
          Art.rect(g, Cc.x - 2, B.y + 32, 4, Cc.y - B.y - 32, P.amber); Art.rect(g, Cc.x - 1, B.y + 32, 2, Cc.y - B.y - 32, P.amberL);
          if (e.conf) for (var k = 0; k < 40; k++) { var q = k / 40; Art.px(g, q * Cc.x, 70 + Math.sin(q * 6 + time * 8) * 4 + (Cc.y - 70) * q * q, k % 2 ? P.teal : P.tealW); }
          g.globalAlpha = 1;
        }
        if (reduced) return true;
        var w = Math.min(1, a / 0.8);
        if (bellT <= 0 || bellT === 1 || bellT === 2) { // ondas simples / dobles / con runas
          var waves = bellT >= 1 ? 2 : 1;
          for (var wv = 0; wv < waves; wv++) { var ww = Math.max(0, w - wv * 0.25); if (ww <= 0) continue; g.globalAlpha = 1 - ww; Art.ellipse(g, B.x, B.y + 11, 12 + ww * 50, 7 + ww * 25, P.amberL, 2); if (bellT === 2) Art.rune(g, B.x + (12 + ww * 50) - 2, B.y + 10, wv + 1, P.amberL); g.globalAlpha = 1; }
        } else if (bellT === 3) { // tañe dos veces: eco
          [0, 0.4].forEach(function (d) { var ww = Math.max(0, Math.min(1, (a - d) / 0.7)); if (ww <= 0 || ww >= 1) return; g.globalAlpha = 1 - ww; Art.ellipse(g, B.x, B.y + 11, 12 + ww * 55, 7 + ww * 28, d ? P.amber : P.amberL, 2); g.globalAlpha = 1; });
        } else if (bellT >= 4) { // anillo de runas que se expande hasta los muros
          var rr = 10 + w * 120; g.globalAlpha = 1 - w;
          for (var ru = 0; ru < 12; ru++) { var an = ru / 12 * Math.PI * 2; Art.rune(g, B.x + Math.cos(an) * rr, B.y + 11 + Math.sin(an) * rr * 0.5, ru, P.amberL); }
          g.globalAlpha = 1;
          if (bellT >= 5 && a < 0.6) { g.globalAlpha = 1 - a / 0.6; Art.rect(g, B.x - 3, 0, 6, B.y, '#fff6e0'); g.globalAlpha = 1; }
        }
      } else if (e.k === 'litany') {
        v.extra.litany = e.t0;
        g.globalAlpha = 1 - p;
        var rings = litT >= 4 ? 3 : 1;
        for (var r = 0; r < rings; r++) Art.ellipse(g, Cc.x, Cc.y, 20 + (p + r * 0.15) * 110, 6 + (p + r * 0.15) * 20, P.amberL, 2);
        if (litT >= 2) for (var n = 0; n < 4; n++) Art.px(g, Cc.x - 20 + n * 12, Cc.y - 40 - p * 20 - (n % 2) * 3, '#ffffff');
        if (litT >= 3) Art.ellipse(g, Cc.x, Cc.y - 30, 8, 3, P.amberL, 0, p * 6, p * 6 + 4);
        g.globalAlpha = 1;
      } else if (e.k === 'seal') { // sello manual: nace de los dedos y cae en el círculo
        var q2 = Math.min(1, p / 0.3);
        if (p < 0.3) { Art.line(g, e.x0, e.y0, e.x0 + (e.x1 - e.x0) * q2, e.y0 + (e.y1 - e.y0) * q2, P.amber, 2); }
        else { g.globalAlpha = 1 - (p - 0.3) / 0.7; Art.rune(g, e.x1 - 1, e.y1 - 1, e.rune, P.amberL); g.globalAlpha = 1; }
      }
      return true;
    });
  }

  // ---------- Comunes ----------
  function aura(g, cx, cy, tier, time, col) {
    var n = Math.min(4, Math.max(1, tier - 2));
    g.globalAlpha = 0.3; Art.ellipse(g, cx, cy, 14 + n * 2, 18 + n * 2, col); g.globalAlpha = 0.6;
    for (var i = 0; i < 6 + n * 2; i++) { var a = time * (reduced ? 0 : 0.8) + i / (6 + n * 2) * Math.PI * 2; Art.px(g, cx + Math.cos(a) * (15 + n * 2), cy + Math.sin(a) * (19 + n * 2), '#ffffff'); }
    g.globalAlpha = 1;
  }
  function drawParts(g, v, time, simple) {
    var lim = simple ? C.fx.portalParticles : 1e9, drawn = 0;
    for (var i = v.fx.length - 1; i >= 0; i--) {
      var e = v.fx[i]; if (e.k !== 'part') continue;
      var a = time - e.t0; if (a < 0 || a > e.dur) continue;
      if (++drawn > lim) break;
      g.globalAlpha = 1 - a / e.dur; Art.px(g, e.x + e.vx * a, e.y + e.vy * a + 20 * a * a, e.c); g.globalAlpha = 1;
    }
  }
  function drawAnomaly(g, time) {
    var a = anomaly, r = 6 + Math.sin(time * 4) * (reduced ? 0 : 1.5);
    g.globalAlpha = 0.3; Art.diamond(g, a.x, a.y, 10, P.violet); g.globalAlpha = 1;
    Art.ellipse(g, a.x, a.y, r, r, P.violetL); Art.ellipse(g, a.x, a.y, r - 3, r - 3, '#7a3fd0', 2);
    for (var i = 0; i < 4; i++) { var an = time * (reduced ? 0.5 : 3) + i * Math.PI / 2; Art.px(g, a.x + Math.cos(an) * (r + 3), a.y + Math.sin(an) * (r + 3), '#ffffff'); }
    Art.px(g, a.x, a.y, '#ffffff');
  }

  Scene.toScene = function (clientX, clientY) { var r = mainCv.getBoundingClientRect(); return { x: (clientX - r.left) / r.width * W, y: (clientY - r.top) / r.height * H }; };

  // ---------- Iconos de la tienda (24×28) ----------
  Scene.drawIcon = function (canvas, zid, id, tier) {
    var x = canvas.getContext('2d'); x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, canvas.width, canvas.height);
    x.fillStyle = { forest: '#08202a', jungle: '#0a1a0c', crypt: '#1d1429' }[zid]; x.fillRect(0, 0, canvas.width, canvas.height);
    var t = tier, tm = 1.3;
    if (zid === 'forest') {
      if (id === 'staff') x.drawImage(Art.forestStaff(t), 0, 0, 7, 28, 9, 0, 7, 28);
      if (id === 'robe') x.drawImage(Art.apprentice(t, -1), 0, 6, 16, 18, 4, 5, 16, 18);
      if (id === 'hood') { x.drawImage(Art.apprentice(0, t), 0, 0, 16, 12, 4, 10, 16, 12); Art.astroHood(x, 4, 10, t, tm, false); }
      if (id === 'ring') { Art.ring(x, 10, 12, t, tm); }
      if (id === 'spell') { for (var k = 0; k < [3, 7, 7, 8, 9, 10, 11][t]; k++) Art.px(x, 18 - k, 4 + k, k ? P.teal : P.tealW); if (t >= 2) { Art.px(x, 9, 15, P.tealW); Art.px(x, 13, 15, P.tealW); } if (t >= 6) Art.ellipse(x, 12, 21, 4, 4, '#ffffff'); else Art.crystal(x, 8, 16, 1); }
      if (id === 'orbit') { Art.crystal(x, 8, 7, 1); Art.ellipse(x, 12, 15, 10, t >= 3 ? 6 : 3, P.tealD); Art.diamond(x, 3, 15, 1, P.tealW); Art.diamond(x, 21, 15, 1, P.teal); if (t >= 6) Art.diamond(x, 12, 4, 2, '#fff6c8'); }
      if (id === 'prism') { Art.crystal(x, 8, 7, 2); for (var r = 0; r < Math.min(3, t + 1); r++) Art.line(x, 12, 12, 4 + r * 8, 2, [P.tealW, P.teal, P.tealM][r]); }
      if (id === 'constellation') { var st = [[3, 20], [7, 12], [4, 5], [12, 9], [20, 5], [17, 12], [21, 20]]; st.forEach(function (s, i) { Art.star(x, s[0], s[1], '#ffffff', t >= 1); if (i && t >= 2) Art.line(x, st[i - 1][0], st[i - 1][1], s[0], s[1], P.tealM, 2); }); }
    } else if (zid === 'jungle') {
      if (id === 'grimoire') Art.grimoire(x, 7, 11, t, 0.5, tm, false);
      if (id === 'robe') x.drawImage(Art.herbalist(t), 0, 8, 16, 16, 4, 8, 16, 16);
      if (id === 'hat') { x.drawImage(Art.herbalist(0), 0, 0, 16, 10, 4, 14, 16, 10); Art.thornCrown(x, 4, 14, t, false); }
      if (id === 'collar') { Art.collar(x, 8, 13, t); if (t >= 2) Art.px(x, 11, 11, P.acid); if (t >= 4) Art.px(x, 14, 10, P.sickL); }
      if (id === 'sickle') { if (t >= 0) Art.ellipse(x, 12, 14, 7, 7, t >= 6 ? '#e8f0ff' : P.acid, 0, Math.PI * 1.1, Math.PI * 1.9); if (t >= 2) Art.ellipse(x, 14, 18, 5, 5, P.acidD, 0, Math.PI * 1.1, Math.PI * 1.9); }
      if (id === 'pollen') for (var i = 0; i < 6 + t; i++) Art.px(x, 6 + (i * 7) % 13, 8 + (i * 5) % 12, i % 2 ? '#ffe08a' : '#d8c060');
      if (id === 'graft') { Art.line(x, 12, 26, 10, 10, '#3f6a22'); Art.diamond(x, 10, 9, 2 + Math.min(2, t), '#c8d0ff'); if (t >= 2) Art.ellipse(x, 10, 9, 5, 5, '#e8f0ff', 0, -1.5, 1.5); }
      if (id === 'maw') { Art.diamond(x, 12, 14, 9, P.sickD); Art.rect(x, 9, 12, 7, 4, '#140410'); if (t >= 1) { Art.px(x, 10, 12, '#f0e0d0'); Art.px(x, 14, 12, '#f0e0d0'); } }
    } else {
      if (id === 'staff') x.drawImage(Art.cryptStaff(t), 0, 0, 7, 28, 9, 0, 7, 28);
      if (id === 'vest') x.drawImage(Art.mage(t, false), 0, 10, 16, 14, 4, 10, 16, 14);
      if (id === 'mitre') { x.drawImage(Art.mage(0, true), 0, 4, 16, 10, 4, 14, 16, 10); Art.mitre(x, 4, 12, t, tm, false); }
      if (id === 'medallion') { Art.medallion(x, 12, 14, t); Art.line(x, 8, 6, 12, 12, P.brassD); Art.line(x, 16, 6, 12, 12, P.brassD); }
      if (id === 'bell') Art.bell(x, 12, 3, t, 0);
      if (id === 'chalk') { Art.ellipse(x, 12, 14, 10, 5, P.chalk); if (t >= 1) Art.ellipse(x, 12, 14, 6, 3, P.chalkD); if (t >= 6) Art.rune(x, 11, 13, 2, P.amber); for (var s = 0; s < 3; s++) Art.rune(x, 3 + s * 8, 3, s, P.amber); }
      if (id === 'incense') { for (var k2 = 0; k2 < 12; k2++) Art.px(x, 12 + Math.sin(k2 / 2 + t) * 3, 24 - k2 * 1.6, '#c8c0d8'); Art.rect(x, 9, 24, 6, 3, P.brass); }
      if (id === 'litany') { for (var c = 0; c < 5; c++) { Art.rect(x, 4 + c * 4, 12, 2, 1, P.amberL); Art.px(x, 4 + c * 4, 11 - (c % 2), P.amberL); if (t >= 1) Art.px(x, 4 + c * 4, 13, c % 2 ? '#ff6a6a' : '#6ab0ff'); } }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
