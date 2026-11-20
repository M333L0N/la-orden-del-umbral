/* La Orden del Umbral — pixel art propio (matrices de píxeles + primitivas a píxel entero).
 * Personajes en capas: cuerpo/túnica, cabeza, tocado, foco y gesto de la mano libre.
 * Estados visuales 0..6 (forma inicial, Nv 10, 50, 100, 150, 200, 250).
 */
(function (root) {
  'use strict';
  var A = root.Arcane = root.Arcane || {};
  var Art = A.Art = {};

  var P = Art.P = {
    outline: '#07090c',
    skin: '#d9a982', skinS: '#a5715a', skinJ: '#b98258', eye: '#0b0f14',
    hairA: '#3a2a22', hairM: '#cfc6e0', hairJ: '#3d5a1e',
    teal: '#5ff0e0', tealM: '#1fb5a8', tealD: '#0d6b66', tealW: '#d8fffa',
    amber: '#f0a63a', amberL: '#ffd98a', amberD: '#9a5a16',
    brass: '#b08a3e', brassL: '#e0c070', brassD: '#5e4520',
    wood: '#6b4a2f', woodD: '#3f2a1a', leaf: '#3f7a4a',
    chalk: '#ddd6c8', chalkD: '#8f887c',
    acid: '#b6f03a', acidD: '#5f8f1a', moss: '#2f4a1c', bark: '#5a3d24', barkD: '#36230f',
    sick: '#8a2a6a', sickL: '#d06ab0', sickD: '#4a1238', violet: '#b57bff', violetL: '#e6b8ff'
  };

  // ---------- Utilidades ----------
  var cache = {};
  function bake(rows, pal, key) {
    if (cache[key]) return cache[key];
    var h = rows.length, w = 0;
    rows.forEach(function (r) { w = Math.max(w, r.length); });
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d');
    for (var y = 0; y < h; y++) for (var x = 0; x < rows[y].length; x++) {
      var ch = rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      var col = pal[ch] || (ch === 'k' ? P.outline : null);
      if (!col) continue;
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
    cache[key] = c;
    return c;
  }
  Art.bake = bake;
  Art.silhouette = function (src, key, color) {
    key = 'sil:' + key + ':' + (color || '#fff');
    if (cache[key]) return cache[key];
    var c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    var g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color || '#fff'; g.fillRect(0, 0, c.width, c.height);
    cache[key] = c;
    return c;
  };
  Art.px = function (g, x, y, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); };
  Art.rect = function (g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  Art.ellipse = function (g, cx, cy, rx, ry, c, step, a0, a1) {
    g.fillStyle = c;
    var n = Math.max(24, Math.round((rx + ry) * 3)), seen = {};
    a0 = a0 || 0; a1 = a1 === undefined ? Math.PI * 2 : a1;
    for (var i = 0; i < n; i++) {
      var a = a0 + i / n * (a1 - a0);
      var x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry);
      var k = x + ',' + y;
      if (seen[k]) continue; seen[k] = 1;
      if (step && (i % step)) continue;
      g.fillRect(x, y, 1, 1);
    }
  };
  Art.diamond = function (g, cx, cy, r, c) {
    g.fillStyle = c;
    for (var dy = -r; dy <= r; dy++) { var w = r - Math.abs(dy); g.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1); }
  };
  Art.line = function (g, x0, y0, x1, y1, c, step) {
    var dx = x1 - x0, dy = y1 - y0, n = Math.max(1, Math.round(Math.max(Math.abs(dx), Math.abs(dy))));
    g.fillStyle = c;
    for (var i = 0; i <= n; i++) { if (step && i % step) continue; g.fillRect(Math.round(x0 + dx * i / n), Math.round(y0 + dy * i / n), 1, 1); }
  };
  var RUNES = [['x.x', '.x.', 'x.x'], ['xxx', 'x..', 'xxx'], ['.x.', 'xxx', '.x.'], ['x..', 'xxx', '..x'], ['xx.', '.x.', '.xx'], ['x.x', 'xxx', 'x.x']];
  Art.rune = function (g, x, y, i, c) {
    var r = RUNES[((i % RUNES.length) + RUNES.length) % RUNES.length]; g.fillStyle = c;
    for (var yy = 0; yy < 3; yy++) for (var xx = 0; xx < 3; xx++) if (r[yy][xx] === 'x') g.fillRect(Math.round(x) + xx, Math.round(y) + yy, 1, 1);
  };
  Art.star = function (g, x, y, c, big) { Art.px(g, x, y, c); if (big) { Art.px(g, x - 1, y, c); Art.px(g, x + 1, y, c); Art.px(g, x, y - 1, c); Art.px(g, x, y + 1, c); } };
  Art.rng = function (seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  function cap6(t) { return Math.max(0, Math.min(6, t)); }

  // =====================================================================
  // APRENDIZ (bosque) 16x24, mira a la derecha. Mano del báculo (14,10); mano libre (3,12).
  // =====================================================================
  var APP_HEAD = ['......kkkkk.....', '.....khhhhhk....', '....khhhhhhhk...', '....khhhssssk...', '....khhsssesk...', '....khhsssssk...', '.....khSssssk...', '......kkSSkk....'];
  var APP_HOOD = ['.....kkkkkk.....', '....krrrrrrk....', '...krrrrrrrrk...', '...krRRssssk....', '...krRRsssesk...', '...krRRsssssk...', '...krRRSssssk...', '....kRRkkSSk....'];
  var APP_BODY = ['.....krrrrrrk...', '....krrrtrrrrk..', '...krRrrtrrrrsk.', '...krRrrtrrrrkk.', '...krRrrtrrrk...', '...kRrbbbbbrk...', '...kRrrrtrrrk...', '...kRrprtrrrk...', '..kRRrrrtrrrrk..', '..kRRrrrtrprrk..', '..kRRrrrtrrrrk..', '.kRRRrrrtrrrrrk.', '.kRRRrrrtrrrrrk.', '.kttttttttttttk.', '....kBBk.kBBk...', '....kkkk.kkkk...'];
  Art.robePalettes = [
    { r: '#5a4a3c', R: '#3b3029', t: '#6d5c4b', p: '#857257', b: '#2c231c', B: '#2a1f18' },
    { r: '#1f5b66', R: '#123a43', t: '#7fe3d6', p: '#1f5b66', b: '#c9a66b', B: '#1c1a18' },
    { r: '#1d2b4d', R: '#0f1832', t: '#5ff0e0', p: '#1d2b4d', b: '#5ff0e0', B: '#0c0f18' },
    { r: '#2b1f56', R: '#160f34', t: '#c8fff8', p: '#2b1f56', b: '#c8fff8', B: '#0b0818' },
    { r: '#3a1f5c', R: '#1f0f38', t: '#e6b8ff', p: '#3a1f5c', b: '#e6b8ff', B: '#0e0618' },
    { r: '#10204a', R: '#08102a', t: '#fff6c8', p: '#10204a', b: '#fff6c8', B: '#05081a' },
    { r: '#070a16', R: '#020308', t: '#5ff0e0', p: '#070a16', b: '#d8fffa', B: '#000000' }
  ];
  var HOOD_PAL = { r: '#1a2350', R: '#0c112a', s: P.skin, S: P.skinS, e: P.eye };

  // robeTier 0..6, hatTier -1 (sin tocado) o 0..6, glow: el bordado se ilumina (lanzamiento)
  Art.apprentice = function (robeTier, hatTier, glow) {
    var t = cap6(robeTier), pal = Art.robePalettes[t];
    var useHood = hatTier >= 0 ? 'hat' : (t >= 2 ? 'robe' : 'hair');
    var key = 'app' + t + ':' + useHood + ':' + (glow && t >= 3 ? 1 : 0);
    if (cache[key]) return cache[key];
    var head = useHood === 'hair' ? APP_HEAD : APP_HOOD;
    var rows = head.concat(APP_BODY).slice();
    if (t >= 1) rows[8] = '.....ktrrrrtk...';
    if (t >= 3) rows[19] = '.kRRRrtrtrtrrrk.';
    if (t >= 5) { rows[16] = '..kRRrtrtrprrk..'.slice(0, 16); }
    if (t >= 6) { rows[12] = '...kRrrtrrtrrk..'.slice(0, 16); }
    var full = Object.assign({ k: P.outline, h: P.hairA, s: P.skin, S: P.skinS, e: P.eye }, pal);
    if (glow && t >= 3) full.t = '#ffffff';
    if (useHood === 'hat') { var hp = Object.assign({}, full, HOOD_PAL); rows = rows.slice(); var c = bake(rows, full, key + 'b'); return compose(c, head, hp, key); }
    return bake(rows, full, key);
  };
  function compose(bodyCanvas, headRows, pal, key) {
    var c = document.createElement('canvas'); c.width = bodyCanvas.width; c.height = bodyCanvas.height;
    var g = c.getContext('2d'); g.drawImage(bodyCanvas, 0, 0);
    g.clearRect(0, 0, c.width, headRows.length);
    g.drawImage(bake(headRows, pal, key + 'h'), 0, 0);
    cache[key] = c; return c;
  }

  // Capucha de Astrónomo (tocado del bosque) dibujada sobre la cabeza (x,y = esquina del sprite)
  Art.astroHood = function (g, x, y, tier, time, cast) {
    var t = cap6(tier), brass = '#c9a66b';
    if (t >= 3) { Art.rect(g, x + 6, y - 3, 3, 3, '#1a2350'); Art.px(g, x + 7, y - 4, '#1a2350'); Art.px(g, x + 7, y - 5, P.amberL); Art.px(g, x + 6, y - 3, P.outline); Art.px(g, x + 8, y - 3, P.outline); }
    Art.px(g, x + 6, y + 1, t >= 1 ? P.amberL : brass);
    if (t >= 1) { Art.px(g, x + 5, y + 1, brass); Art.px(g, x + 7, y + 1, brass); Art.px(g, x + 6, y, brass); }
    if (t >= 2) { Art.px(g, x + 10, y + 4, '#9ff0ff'); Art.px(g, x + 11, y + 3, brass); Art.px(g, x + 11, y + 5, brass); }
    if (t >= 4) { var a = time * 2.2; Art.px(g, x + 7 + Math.cos(a) * 7, y + 2 + Math.sin(a) * 2, '#e8f0ff'); }
    if (t >= 5) Art.ellipse(g, x + 7, y - 2, 6, 1, cast ? P.amberL : brass, 2);
    if (t >= 6) for (var i = 0; i < 5; i++) Art.star(g, x + 3 + i * 2, y - 5 - (i % 2), cast ? '#ffffff' : P.teal);
  };

  // =====================================================================
  // HERBORISTA (jungla) 16x24: trenza colgante, falda ancha de hojas. Grimorio sobre la mano (14,10).
  // Mano libre (3,12).
  // =====================================================================
  var HERB = [
    '......kkkk......', '.....kyyyyk.....', '....kyyyyyyk....', '....kyyyssssk...', '...kyyysssesk...', '...kyyysssssk...',
    '...kyykSssssk...', '...kyk.kSSkk....', '..kyk.krrrrk....', '..kyk.krrtrrk...', '..kk.krRrtrrrsk.', '....krRrrtrrrkk.',
    '...skRrrrtrrk...', '....kRrbbbbrk...', '....kRrrrtrrk...', '...kRRrrrtrrrk..', '..kRRrrrrtrrrrk.', '..kRlRrrrtrrlrk.',
    '.kRRRrrrrtrrrrrk', '.kRlRRrrrtrrlrrk', 'kRRRRrrrrtrrrrrk', 'klllllllllllllk.', '.....kBBkkBBk...', '.....kkkkkkkk...'
  ];
  Art.herbPalettes = [
    { r: '#5a3d24', R: '#36230f', t: '#7a5a34', l: '#3f6a22', b: '#2a1a0c', B: '#1a1008' },
    { r: '#4a3a22', R: '#2a1f10', t: '#6a8a2a', l: '#4f8a2a', b: '#3a2a14', B: '#1a1008' },
    { r: '#3e4a22', R: '#232a10', t: '#8fc03a', l: '#5fa02a', b: '#8fc03a', B: '#141a08' },
    { r: '#2f4a2a', R: '#182a14', t: '#b6f03a', l: '#7fd03a', b: '#b6f03a', B: '#0c1408' },
    { r: '#24442a', R: '#122414', t: '#c8ff6a', l: '#3fae5a', b: '#c8ff6a', B: '#081008' },
    { r: '#2a3a2a', R: '#141e14', t: '#ffd0f0', l: '#ff9ad6', b: '#ffd0f0', B: '#081008' },
    { r: '#1a2a12', R: '#0a1408', t: '#b6f03a', l: '#e8ff9a', b: '#ffffff', B: '#000000' }
  ];
  Art.herbalist = function (robeTier, glow) {
    var t = cap6(robeTier), key = 'herb' + t + (glow && t >= 3 ? 'g' : '');
    var pal = Object.assign({ k: P.outline, y: P.hairJ, s: P.skinJ, S: '#8a5a38', e: P.eye }, Art.herbPalettes[t]);
    if (glow && t >= 3) pal.l = '#ffffff';
    return bake(HERB, pal, key);
  };
  // Tocado de Espinas: tier 0, 1 (Nv 10) o 6 (forma final en su tope)
  Art.thornCrown = function (g, x, y, tier, cast) {
    var t = cap6(tier), thorn = t >= 6 ? P.acid : '#6a4a2a';
    for (var i = 0; i < (t >= 6 ? 5 : 3); i++) {
      var tx = x + 5 + i * 2 - (t >= 6 ? 1 : 0);
      Art.px(g, tx, y, thorn); Art.px(g, tx, y - 1, thorn); if (t >= 6 || i === 1) Art.px(g, tx, y - 2, thorn);
    }
    Art.rect(g, x + 4, y + 1, 8, 1, '#4a2a14');
    if (t >= 1) { Art.px(g, x + 4, y, P.acid); Art.px(g, x + 11, y, P.acid); }
    if (t >= 6) { Art.px(g, x + 6, y - 3, P.sickL); Art.px(g, x + 10, y - 3, P.sickL); Art.px(g, x + 8, y - 4, cast ? '#ffffff' : '#ffe0f4'); }
  };
  // Grimorio flotante: tier 0..6, flip 0..1 (página que pasa), open: brillo al podar
  Art.grimoire = function (g, x, y, tier, flip, time, cast) {
    var t = cap6(tier);
    var cover = ['#5a3d24', '#3f5a24', '#3f5a24', '#2f4a2a', '#2f4a2a', '#24442a', '#1a2a12'][t];
    var page = t >= 3 ? '#f4f0c8' : '#d8d0a8';
    var openW = t >= 3 ? 10 : 8;
    Art.rect(g, x, y + 1, openW, 5, cover);
    Art.rect(g, x + 1, y, openW / 2 - 1, 5, page); Art.rect(g, x + openW / 2, y, openW / 2 - 1, 5, page);
    Art.px(g, x + openW / 2 - 1, y + 2, '#2a1a0c');
    if (t >= 1) { Art.px(g, x, y + 5, P.acidD); Art.px(g, x + openW - 1, y + 5, P.acidD); Art.px(g, x + 2, y + 6, P.moss); }
    // páginas que pasan (2 desde Nv 50)
    var pages = t >= 2 ? 2 : 1;
    for (var p = 0; p < pages; p++) {
      var f = Math.max(0, Math.min(1, flip * 1.4 - p * 0.3));
      if (f <= 0 || f >= 1) continue;
      var h = Math.round(Math.sin(f * Math.PI) * 4);
      var px0 = x + openW / 2 + Math.round((1 - f * 2) * (openW / 2 - 1));
      Art.rect(g, Math.min(px0, x + openW / 2), y - h, Math.abs(px0 - (x + openW / 2)) + 1, 1, '#ffffff');
    }
    if (t >= 3 && cast) { g.globalAlpha = 0.5; Art.diamond(g, x + openW / 2, y + 2, 5, P.acid); g.globalAlpha = 1; }
    if (t >= 4) for (var s = 0; s < 3; s++) Art.px(g, x + 2 + s * 3, y - 2 - ((time * 6 + s * 3) % 4), P.acid);
    if (t >= 5) for (var q = 0; q < 4; q++) { var a = time * 1.5 + q * Math.PI / 2; Art.rect(g, x + openW / 2 + Math.cos(a) * 9, y + 2 + Math.sin(a) * 4, 2, 3, page); }
  };

  // =====================================================================
  // MAGA (cripta) 16x24: sombrero de ala ancha (sin mitra) o mitra; mano libre (3,15).
  // =====================================================================
  var MAGE_HAT = ['.........kk.....', '........kHk.....', '.......kHHk.....', '......kHHHk.....', '.....kHHHHHk....', '.....kaaaaak....', '..kkkHHHHHHHkkk.', '...kkkkkkkkkkk..'];
  var MAGE_BARE = ['................', '................', '................', '................', '................', '......kkkkk.....', '.....kyyyyyk....', '.....kyyyyyk....'];
  var MAGE_BODY = ['.....kyssssk....', '.....kyssesk....', '....kyysssk.....', '....kyvvvvvk....', '...kyvvavvvvsk..', '...kyvvavvvvkk..', '...kyVvavvvk....', '...kVVvavvvk....', '...kVVaaaaak....', '..kVVvvavvvvk...', '..kVVvvavvvvk...', '.kVVVvvavvvvvk..', '.kVVVvvavvvvvk..', '.kaaaaaaaaaaak..', '....kBBk.kBBk...', '....kkkk.kkkk...'];
  Art.vestPalettes = [
    { v: '#5a3473', V: '#36204a', a: P.amber },
    { v: '#5a3473', V: '#36204a', a: P.amberL },
    { v: '#4a2a63', V: '#2a163a', a: '#ffe0a0' },
    { v: '#4a2a63', V: '#2a163a', a: '#ffffff' },
    { v: '#2a1a30', V: '#140a1a', a: P.amber },
    { v: '#3a1a4a', V: '#1a0a24', a: '#ffd98a' },
    { v: '#140a1a', V: '#06030a', a: '#ffffff' }
  ];
  Art.mage = function (vestTier, mitred, glow) {
    var t = cap6(vestTier || 0), key = 'mage' + t + (mitred ? 'm' : '') + (glow && t >= 4 ? 'g' : '');
    var rows = (mitred ? MAGE_BARE : MAGE_HAT).concat(MAGE_BODY).slice();
    if (t >= 3) rows[19] = '.kVVVvwavvwvvk..';
    if (t >= 5) rows[12] = '...kyvaavvaask..';
    var pal = Object.assign({ k: P.outline, H: '#3b2350', y: P.hairM, s: P.skin, e: P.eye, B: '#1a1020', w: '#fff6e0' }, Art.vestPalettes[t]);
    if (glow && t >= 4) pal.a = '#ffffff';
    return bake(rows, pal, key);
  };
  // Mitra del Último Eco
  Art.mitre = function (g, x, y, tier, time, cast) {
    var t = cap6(tier), h = 5 + Math.min(4, t);
    var white = '#e8e0d0', band = t >= 1 ? P.amber : '#b0a890';
    for (var r = 0; r < h; r++) {
      var w = Math.max(1, Math.round(3 - (h - r) * 0.35 + r * 0.1));
      Art.rect(g, x + 8 - w, y + 7 - h + r, w * 2, 1, white);
      Art.px(g, x + 8 - w - 1, y + 7 - h + r, P.outline); Art.px(g, x + 8 + w, y + 7 - h + r, P.outline);
    }
    Art.rect(g, x + 5, y + 6, 6, 1, band);
    if (t >= 2) Art.rune(g, x + 7, y + 7 - h + 2, 2, P.amberD);
    if (t >= 3) { Art.px(g, x + 11, y + 6, P.brass); Art.px(g, x + 11, y + 7, P.brassL); }
    if (t >= 4) Art.ellipse(g, x + 8, y + 4, 7, 4, cast ? P.amberL : P.amberD, 2, Math.PI, Math.PI * 2);
    if (t >= 5) { Art.px(g, x + 6, y + 7 - h - 1, white); Art.px(g, x + 10, y + 7 - h - 1, white); }
    if (t >= 6) { var b = Math.round(Math.sin(time * 2)); for (var i = 0; i < 5; i++) Art.px(g, x + 5 + i * 1.5, y - h + b - (i % 2), cast ? '#ffffff' : P.amberL); }
  };

  // =====================================================================
  // FOCOS: báculos 7x32 (empuñadura fila 18, eje col 3).
  // =====================================================================
  var STAFF_F = [
    ['.......', '.......', '.......', '.......', '..l....', '.lWl.l.', '..wWl..', '..wW...', '...wW..', '...wW..', '..wW...', '..wW...', '...wW..', '...wW..', '...wW..', '..wW...', '..wW...', '..wW...', '...wW..', '...wW..', '...wW..', '...wW..', '..wW...', '..wW...', '..wW...', '...wW..', '...wW..', '...wW..', '...wW..', '...WW..', '.......', '.......'],
    ['.......', '...c...', '..cCc..', '..cCc..', '.cCCCc.', '..cCc..', '..cCc..', '...c...', '..bwb..', '..bwb..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...wW..', '...WW..', '.......', '.......'],
    ['...c...', '..cCc..', 'd.cCc.d', 'd.cCc.d', 'dcCCCcd', 'd.cCc.d', '.d.c.d.', '.ddddd.', '..dDd..', '...dD..', '...tD..', '...dD..', '...dD..', '...tD..', '...dD..', '...dD..', '...dD..', '...dD..', '...dD..', '...dD..', '...dD..', '...tD..', '...dD..', '...dD..', '...dD..', '...dD..', '...dD..', '...dD..', '...dD..', '...DD..', '.......', '.......']
  ];
  STAFF_F[3] = STAFF_F[2].slice(); STAFF_F[3][1] = '..cWc..'; STAFF_F[3][2] = 'd.cWc.d'; STAFF_F[3][3] = 'dcWWWcd'; STAFF_F[3][4] = 'dcCWCcd';
  var STAFF_F_PAL = [
    { w: P.wood, W: P.woodD, l: P.leaf },
    { w: '#7a5634', W: '#463020', c: P.tealM, C: P.teal, b: '#c9a66b' },
    { d: '#2e3446', D: '#161a25', c: P.tealM, C: P.teal, t: P.teal },
    { d: '#2a2350', D: '#140f2c', c: P.teal, C: P.tealW, W: '#ffffff', t: P.tealW },
    { d: '#2a2350', D: '#140f2c', c: P.teal, C: P.tealW, W: '#ffffff', t: P.tealW },
    { d: '#1c1640', D: '#0a0820', c: '#9ff0ff', C: '#ffffff', W: '#ffffff', t: '#ffffff' },
    { d: '#120c24', D: '#05030c', c: '#1a1030', C: '#000000', W: '#2a1a4a', t: P.teal }
  ];
  Art.forestStaff = function (tier) { var t = cap6(tier), m = STAFF_F[Math.min(3, t)]; return bake(m, STAFF_F_PAL[t], 'sf' + t); };
  // Detalles animados del báculo según estado (sobre la punta). charge 0..1, fire: instante de disparo
  Art.forestStaffFx = function (g, tipX, tipY, tier, time, charge, fire) {
    var t = cap6(tier);
    if (t >= 2 && t < 3) for (var s = 0; s < 2; s++) { var a = time * 2 + s * Math.PI; Art.px(g, tipX + Math.cos(a) * 5, tipY - 1 + Math.sin(a) * 3, P.teal); }
    if (t >= 3) { // fragmentos que se separan al cargar y se cierran al disparar
      var open = fire ? 0 : 1 + charge * 4;
      [[-1, -1], [1, -1], [0, -2]].forEach(function (d, i) { Art.diamond(g, tipX + d[0] * (2 + open), tipY - 1 + d[1] * (1 + open * 0.6), 0, i === 2 ? P.tealW : P.teal); });
    }
    if (t >= 4) Art.ellipse(g, tipX, tipY - 1, 7, 3, charge > 0.5 || fire ? P.tealW : P.tealD, 2, time * 2, time * 2 + Math.PI * 1.4);
    if (t >= 6) { g.globalAlpha = 0.8; Art.ellipse(g, tipX, tipY - 2, 3, 3, '#ffffff'); g.globalAlpha = 1; }
  };

  var STAFF_C = [
    ['.......', '.......', '.......', '...o...', '..oOo..', '..oOo..', '...o...', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...BB..', '.......', '.......'],
    ['.......', '.......', '.b...b.', '.b.a.b.', '.baAab.', '.baAab.', '..bab..', '...bB..', '...bB..', '..bbBB.', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...BB..', '.......', '.......'],
    ['..bb...', '.b..a..', 'b..aAa.', 'b..aAa.', 'b...a..', '.b.....', '..bbb..', '...bB..', '...bB..', '..aBB..', '...bB..', '...bB..', '...bB..', '..aBB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...bB..', '...BB..', '.......', '.......']
  ];
  STAFF_C[3] = STAFF_C[2].slice(); STAFF_C[3][2] = 'b..aWa.'; STAFF_C[3][3] = 'b.aAWAa';
  var STAFF_C_PAL = [
    { o: P.brassL, O: P.brass, b: P.brass, B: P.brassD },
    { a: P.amber, A: P.amberL, b: P.brass, B: P.brassD },
    { a: P.amber, A: P.amberL, b: P.brassL, B: P.brass },
    { a: P.amberL, A: '#fff2c4', W: '#ffffff', b: '#f2d58a', B: P.brassL },
    { a: P.amberL, A: '#fff2c4', W: '#ffffff', b: '#f2d58a', B: P.brassL },
    { a: '#ffe8b0', A: '#ffffff', W: '#ffffff', b: '#ffe0a0', B: '#d8b866' },
    { a: '#ffffff', A: '#ffffff', W: '#ffffff', b: '#fff0c0', B: '#e0c070' }
  ];
  Art.cryptStaff = function (tier) { var t = cap6(tier); return bake(STAFF_C[Math.min(3, t)], STAFF_C_PAL[t], 'sc' + t); };
  Art.cryptStaffFx = function (g, tipX, tipY, tier, time, charge) {
    var t = cap6(tier);
    if (t >= 3) { var o = Math.round(charge * 3); Art.px(g, tipX - 3 - o, tipY - 1, P.brassL); Art.px(g, tipX + 3 + o, tipY - 1, P.brassL); }
    if (t >= 4) { Art.px(g, tipX - 2, tipY + 4, P.brass); Art.px(g, tipX - 2, tipY + 5, P.amberL); Art.px(g, tipX + 3, tipY + 4, P.brass); Art.px(g, tipX + 3, tipY + 5, P.amberL); }
    if (t >= 5) for (var i = 0; i < 3; i++) { var a = time * 2 + i * 2.1; Art.diamond(g, tipX + Math.cos(a) * (4 + charge * 2), tipY - 2 + Math.sin(a) * 2, 0, P.amberL); }
    if (t >= 6) { g.globalAlpha = 0.5 + charge * 0.5; Art.bell(g, tipX, tipY - 7, 3, 0, 0.35); g.globalAlpha = 1; }
  };

  // =====================================================================
  // Objetos del escenario
  // =====================================================================
  // Campana (estado 0..6). scale<1 dibuja una campanita.
  Art.bell = function (g, cx, top, tier, swing, scale) {
    var t = cap6(tier), sc = scale || 1;
    var h = Math.round([18, 19, 21, 22, 22, 23, 24][t] * sc), maxW = Math.round([8, 9, 10, 11, 11, 11, 12][t] * sc);
    var body = ['#7a5a2a', '#9a7432', '#b08a3e', '#d8b866', '#d8b866', '#f0d890', '#2a1a30'][t];
    var dark = ['#4a3418', '#5e4520', '#6b5222', '#8a6a30', '#8a6a30', '#b09050', '#120a18'][t];
    var lite = ['#a07a3a', '#c9a050', '#e0c070', '#fff0b0', '#fff0b0', '#ffffff', '#ffd98a'][t];
    var off = Math.round(swing || 0);
    for (var r = 0; r < h; r++) {
      var k = r / Math.max(1, h - 1);
      var w = Math.round(1.5 + Math.pow(k, 1.7) * (maxW - 1.5));
      if (r === h - 1) w = maxW + 1;
      var sx = cx - w + Math.round(off * k);
      Art.rect(g, sx, top + r, w * 2 + 1, 1, body);
      Art.px(g, sx, top + r, P.outline); Art.px(g, sx + w * 2, top + r, P.outline);
      Art.px(g, sx + 1, top + r, dark);
      if (r > 1 && r < h - 2) Art.px(g, sx + Math.max(2, Math.round(w * 0.6)), top + r, lite);
    }
    if (sc < 1) return;
    Art.rect(g, cx - 1, top - 2, 3, 2, dark);
    Art.rect(g, cx + Math.round(off * 1.3), top + h, 2, 2, dark);
    if (t === 0) [[1, 3], [2, 4], [2, 5], [3, 6], [2, 7], [3, 8], [4, 9], [4, 10], [5, 11], [4, 12], [5, 13], [6, 14]].forEach(function (p) { Art.px(g, cx + p[0] + Math.round(off * p[1] / h), top + p[1], '#1a1208'); });
    if (t >= 1) Art.rect(g, cx - maxW + 2 + off, top + h - 4, maxW * 2 - 3, 1, t >= 6 ? '#ffffff' : P.amber);
    if (t === 1) { Art.px(g, cx + 2 + off, top + 6, '#2a1a08'); Art.px(g, cx + 3 + off, top + 7, P.amber); }
    if (t >= 2) for (var i = 0; i < 3; i++) Art.rune(g, cx - 6 + i * 5 + off, top + h - 10, i + 2, t >= 3 ? '#fff2c4' : P.amberL);
  };

  // Cristal del bosque
  var CRYSTAL = ['....c....', '...cCc...', '...cCc...', '..cCWCc..', '..cCWCc..', '.ccCWCcc.', '.cCCWCCc.', '.cCCWCCc.', 'ccCCWCCcc', 'cCCCWCCCc', 'cCCCWCCCc', 'cCCWCCCCc', 'cCCWCCCCc', '.cCWCCCc.', '.cCCCCCc.', '..cCCCc..', '..cCCCc..', '...cCc...', '...ccc...'];
  Art.crystal = function (g, x, y, glow, dark) {
    var b = Math.max(0, Math.min(1, glow));
    var pal = dark ? { c: '#1a1030', C: '#05030c', W: '#ffffff' } : { c: P.tealD, C: b > 0.6 ? P.teal : P.tealM, W: b > 0.3 ? P.tealW : P.teal };
    var key = 'cr' + (dark ? 'd' : (b > 0.6 ? 2 : b > 0.3 ? 1 : 0));
    g.drawImage(bake(CRYSTAL, pal, key), Math.round(x), Math.round(y));
  };

  // Anillo / Collar / Medallón (accesorios) — glifos pequeños
  Art.ringColors = [
    { band: '#b87333', gem: '#d99a5b' }, { band: '#cfd8dc', gem: P.teal }, { band: '#f2c14e', gem: '#fff3b0' }, { band: '#8a7cff', gem: '#ffffff' },
    { band: '#4fc0d0', gem: '#d8fffa' }, { band: '#e6b8ff', gem: '#5ff0e0' }, { band: '#ffffff', gem: P.teal }
  ];
  Art.ring = function (g, x, y, tier, time) {
    var t = cap6(tier), c = Art.ringColors[t];
    x = Math.round(x); y = Math.round(y);
    Art.rect(g, x + 1, y, 2, 1, c.band); Art.rect(g, x, y + 1, 1, 2, c.band); Art.rect(g, x + 3, y + 1, 1, 2, c.band); Art.rect(g, x + 1, y + 3, 2, 1, c.band);
    Art.px(g, x + 1, y - 1, c.gem); Art.px(g, x + 2, y - 1, c.gem);
    if (t >= 1) Art.px(g, x + 1, y - 2, c.gem);
    if (t >= 4) { var a = (time || 0) * 3; Art.px(g, x + 1.5 + Math.cos(a) * 3, y + 1.5 + Math.sin(a) * 3, c.gem); Art.px(g, x + 1.5 - Math.cos(a) * 3, y + 1.5 - Math.sin(a) * 3, c.gem); }
    if (t >= 5) Art.ellipse(g, x + 1.5, y + 1.5, 4, 4, c.band, 3);
  };
  Art.collar = function (g, x, y, tier) {
    var t = cap6(tier), cols = ['#8a6a3a', '#7aa03a', P.acid, '#c8a060', P.acid, P.sickL, '#ffffff'];
    for (var i = 0; i < 4; i++) Art.px(g, x + i * 2, y + (i === 1 || i === 2 ? 1 : 0), cols[t]);
  };
  Art.medallion = function (g, x, y, tier) {
    var t = cap6(tier), c = ['#8a7a5a', P.amber, P.amberL, P.amberL, '#fff6e0', '#ffffff', '#ffffff'][t];
    Art.diamond(g, x, y, 1, c); if (t >= 2) Art.px(g, x, y, P.amberD);
  };

  // =====================================================================
  // AMENAZAS (solo visuales)
  // =====================================================================
  // Ciervo Hueco: cráneo con astas, detrás del cristal. a = revelado 0..1
  Art.deer = function (g, cx, cy, a, col, scale) {
    var s = scale || 1, c = col || '#0f2a30';
    if (a <= 0.01) return;
    g.globalAlpha = Math.min(1, a);
    // cráneo
    for (var r = 0; r < 12 * s; r++) { var w = Math.round((6 - r / (2 * s)) * s); Art.rect(g, cx - w, cy + r, w * 2 + 1, 1, c); }
    Art.px(g, cx - 3 * s, cy + 4 * s, '#000'); Art.px(g, cx + 3 * s, cy + 4 * s, '#000');
    // astas
    [[-1, 1]].forEach(function () {});
    for (var side = -1; side <= 1; side += 2) {
      Art.line(g, cx + side * 4 * s, cy, cx + side * 14 * s, cy - 14 * s, c);
      Art.line(g, cx + side * 8 * s, cy - 5 * s, cx + side * 6 * s, cy - 15 * s, c);
      Art.line(g, cx + side * 11 * s, cy - 10 * s, cx + side * 18 * s, cy - 12 * s, c);
      Art.line(g, cx + side * 14 * s, cy - 14 * s, cx + side * 13 * s, cy - 22 * s, c);
    }
    g.globalAlpha = 1;
  };
  Art.deerStars = function (cx, cy) { // puntos de la constelación entre las astas
    return [[cx - 13, cy - 13], [cx - 7, cy - 14], [cx - 13, cy - 21], [cx, cy - 18], [cx + 13, cy - 21], [cx + 7, cy - 14], [cx + 13, cy - 13]];
  };

  // Reina Injerto: flor parasitaria. open 0..1 (bocas), tier de la Flor de las Mil Bocas
  Art.queen = function (g, x, y, open, tier, time) {
    var t = cap6(tier || 0), lift = t >= 5 ? Math.round(open * 6) : 0;
    // tallo
    for (var i = 0; i < 40; i++) Art.rect(g, x + Math.round(Math.sin(i / 8) * 2), y + 30 + i - lift, 4, 1, i % 5 ? '#2a1a2a' : '#3a1a3a');
    var hy = y + 10 - lift;
    // pétalos enfermos (se abren con "open")
    var po = Math.round(open * (t >= 3 ? 8 : 5));
    for (var p = 0; p < 6; p++) {
      var a = p / 6 * Math.PI * 2 + 0.3, rx = 10 + po, ry = 9 + po * 0.7;
      var px0 = x + 2 + Math.cos(a) * rx, py0 = hy + 10 + Math.sin(a) * ry;
      Art.diamond(g, px0, py0, 4, P.sickD); Art.diamond(g, px0, py0, 2, P.sick);
      Art.px(g, px0 + 1, py0 - 1, P.sickL);
    }
    // bulbo
    for (var r = -9; r <= 9; r++) { var w = Math.round(Math.sqrt(81 - r * r)); Art.rect(g, x + 2 - w, hy + 10 + r, w * 2 + 1, 1, r < -4 ? '#6a2050' : '#501840'); }
    // bocas: 1 (base), 3 desde Nv 50, anillo desde el tope
    var mouths = t >= 6 ? 7 : t >= 2 ? 3 : 1;
    for (var m = 0; m < mouths; m++) {
      var ma = mouths === 1 ? 0 : (m / mouths) * Math.PI * 2;
      var mx = x + 2 + (mouths === 1 ? 0 : Math.cos(ma) * 5), my = hy + 10 + (mouths === 1 ? 0 : Math.sin(ma) * 5);
      var mo = Math.round(open * 3 * (t >= 2 ? (0.5 + 0.5 * Math.sin(time * 6 + m)) : 1));
      Art.rect(g, mx - 2, my - mo, 5, mo * 2 + 1, '#140410');
      if (t >= 1 && mo > 0) { Art.px(g, mx - 1, my - mo, '#f0e0d0'); Art.px(g, mx + 1, my - mo, '#f0e0d0'); Art.px(g, mx, my + mo, '#f0e0d0'); }
    }
  };

  // Rey sin Réquiem: figura espectral con corona. a = materialización 0..1, crown: 0..1 (letanía)
  Art.king = function (g, cx, footY, a, crownParts, crownTotal, tierCrown) {
    if (a > 0.02) {
      g.globalAlpha = Math.min(0.85, a);
      for (var r = 0; r < 24; r++) { var w = r < 6 ? 3 : Math.round(3 + (r - 6) * 0.35); Art.rect(g, cx - w, footY - 24 + r, w * 2 + 1, 1, r < 6 ? '#8a8098' : '#4a4058'); }
      Art.px(g, cx - 1, footY - 21, '#ffd98a'); Art.px(g, cx + 1, footY - 21, '#ffd98a');
      g.globalAlpha = 1;
    }
    if (crownTotal > 0 && crownParts > 0) { // corona de la letanía
      var cy = footY - 27 - (tierCrown >= 5 ? -2 : 0);
      for (var i = 0; i < crownParts; i++) {
        var px = cx - 5 + Math.round(i * 10 / Math.max(1, crownTotal - 1));
        Art.rect(g, px, cy, 2, 1, P.amberL); Art.px(g, px, cy - 1 - (i % 2), P.amberL);
        if (tierCrown >= 1) Art.px(g, px, cy + 1, i % 2 ? '#ff6a6a' : '#6ab0ff');
      }
    }
  };

  // Icono de anomalía y utilidades varias se dibujan en scene.js
})(typeof window !== 'undefined' ? window : globalThis);
