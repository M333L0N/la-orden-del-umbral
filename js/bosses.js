/* La Orden del Umbral — jefes y magos de la v0.3 (pixel art procedural a píxel entero).
 * Cada jefe se dibuja con: reposo legible, reacción breve al impacto (hit 0..1) y derrota
 * (defeat 0..1, reservada a la secuencia de refundación). No tienen vida: siempre siguen en pie.
 */
(function (root) {
  'use strict';
  var A = root.Arcane = root.Arcane || {};
  var Art = A.Art, P = Art.P;
  var B = A.Bosses = {};
  var px = Art.px, rect = Art.rect, line = Art.line, ell = Art.ellipse, dia = Art.diamond;

  function fillEllipse(g, cx, cy, rx, ry, c) {
    for (var y = -ry; y <= ry; y++) { var w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); rect(g, cx - w, cy + y, w * 2 + 1, 1, c); }
  }
  function thick(g, x0, y0, x1, y1, c, w) { for (var i = 0; i < (w || 2); i++) line(g, x0 + i, y0, x1 + i, y1, c); }

  // =====================================================================
  // CIERVO HUECO (bosque): cuerpo completo mirando a la izquierda, pecho hueco luminoso, astas.
  // Ancla: pecho en (cx, cy). o = { hit, glow (pecho 0..1), antler (luz en astas 0..1), defeat, time }
  // =====================================================================
  B.deerAnchor = function (x, y) {
    return { chest: { x: x, y: y }, head: { x: x - 22, y: y - 30 }, antlerTips: B.deerAntlerTips(x, y) };
  };
  B.deerAntlerTips = function (x, y) {
    var hx = x - 22, hy = y - 34;
    return [[hx - 18, hy - 24], [hx - 10, hy - 32], [hx - 2, hy - 30], [hx + 10, hy - 34], [hx + 18, hy - 26], [hx + 24, hy - 16], [hx - 24, hy - 12]];
  };
  B.deer = function (g, x, y, o) {
    o = o || {};
    var d = o.defeat || 0, sh = o.hit > 0 ? Math.round(Math.sin(o.time * 60) * 2 * o.hit) : 0;
    var fall = Math.round(d * 18), tilt = d;
    x += sh; y += fall;
    var fur = '#1c3440', furL = '#2c5260', furD = '#0d1c24', bone = '#c8d8d0', boneD = '#7f9890';
    g.globalAlpha = 1 - d * 0.6;
    // patas (traseras más oscuras)
    [[x + 22, furD], [x + 30, furD], [x - 6, fur], [x + 2, fur]].forEach(function (l, i) {
      var lx = l[0], top = y + 8, bot = y + 34 - fall;
      if (d > 0.3) bot = y + 14;
      rect(g, lx, top, 3, bot - top, l[1]); rect(g, lx - 1, bot, 4, 2, '#0a1014');
    });
    // torso
    fillEllipse(g, x + 12, y + 4, 26, 13, fur);
    fillEllipse(g, x + 12, y + 1, 24, 9, furL);
    rect(g, x - 12, y + 12, 50, 1, furD);
    // pecho hueco: costillas con luz turquesa
    var gl = Math.max(0, Math.min(1, o.glow || 0));
    fillEllipse(g, x, y, 9, 8, '#06141a');
    if (gl > 0.05) { g.globalAlpha = (1 - d * 0.6) * (0.35 + gl * 0.65); fillEllipse(g, x, y, 7, 6, P.tealM); fillEllipse(g, x, y, 3, 3, P.tealW); g.globalAlpha = 1 - d * 0.6; }
    for (var r = -6; r <= 6; r += 3) { line(g, x - 8, y + r, x - 2, y + r + 1, bone); line(g, x + 8, y + r, x + 2, y + r + 1, bone); }
    rect(g, x - 1, y - 8, 2, 16, boneD);
    // cuello y cabeza (cráneo alargado hacia la izquierda)
    var hx = x - 22 - Math.round(tilt * 10), hy = y - 30 + Math.round(tilt * 22);
    thick(g, x - 6, y - 6, hx + 4, hy + 6, fur, 5);
    fillEllipse(g, hx, hy, 8, 6, bone);
    rect(g, hx - 13, hy + 1, 10, 4, bone); rect(g, hx - 14, hy + 3, 2, 2, boneD);
    rect(g, hx - 4, hy - 1, 3, 3, '#000'); px(g, hx - 3, hy, o.hit > 0 ? '#ffffff' : P.teal);
    rect(g, hx + 2, hy - 7, 3, 3, bone);
    // astas ramificadas (se encienden con antler 0..1)
    var al = Math.max(0, Math.min(1, o.antler || 0)), ac = al > 0.5 ? P.tealW : al > 0.1 ? P.teal : '#8fa7a0';
    var ax = hx, ay = hy - 6;
    if (d < 0.6) {
      [[-1, 1], [1, 1]].forEach(function (sg) {
        var s = sg[0];
        thick(g, ax + s * 2, ay, ax + s * 10, ay - 14, ac, 2);
        line(g, ax + s * 10, ay - 14, ax + s * 20, ay - 22, ac);
        line(g, ax + s * 10, ay - 14, ax + s * 8, ay - 26, ac);
        line(g, ax + s * 6, ay - 7, ax + s * 16, ay - 6, ac);
        line(g, ax + s * 15, ay - 19, ax + s * 24, ay - 14, ac);
        line(g, ax + s * 9, ay - 22, ax + s * 2, ay - 28, ac);
      });
      if (al > 0.1) { g.globalAlpha = al * 0.5; B.deerAntlerTips(x, y).forEach(function (t) { dia(g, t[0] - (x - 22 - hx), t[1] - (y - 34 - (hy - 4)), 2, P.tealW); }); g.globalAlpha = 1; }
    } else for (var k = 0; k < 10; k++) px(g, ax - 10 + k * 3, ay - 6 - (1 - d) * 20 + k % 3, P.tealW); // las astas se deshacen en estrellas
    g.globalAlpha = 1;
  };

  // =====================================================================
  // REINA INJERTO (jungla): flor carnívora enorme con mandíbula, corona de pétalos y raíces.
  // Ancla: base del tallo (bx, by). o = { open 0..1, hit, defeat, mawTier, time }
  // =====================================================================
  B.queenHead = function (bx, by) { return { x: bx - 4, y: by - 62 }; };
  B.queen = function (g, bx, by, o) {
    o = o || {};
    var d = o.defeat || 0, t = o.time || 0, open = Math.max(0, Math.min(1, o.open || 0));
    var sh = o.hit > 0 ? Math.round(Math.sin(t * 50) * 2 * o.hit) : 0;
    var droop = d * 30;
    // raíces gruesas desde la base hacia la izquierda (las que poda la herborista)
    for (var rx = bx - 118; rx < bx + 10; rx++) { var ry = by + 6 + Math.round(Math.sin(rx / 9) * 1.5); rect(g, rx, ry, 1, 3, '#3a1430'); px(g, rx, ry - 1, '#6a2050'); }
    for (var k = 0; k < 4; k++) line(g, bx - 4 + k * 3, by + 6, bx - 12 + k * 6, by - 4, '#3a1430');
    // tallo grueso y curvo
    var hx = bx - 4 + sh + Math.round(droop * 0.8), hy = by - 62 + Math.round(droop);
    for (var i = 0; i <= 60; i++) {
      var q = i / 60, sx = bx + Math.round(Math.sin(q * 3 + t * 0.8) * 3 * (1 - q)) + Math.round((hx - bx) * q), sy = by - i + Math.round(droop * q);
      rect(g, sx - 3, sy, 7, 1, i % 6 ? '#2e1a2e' : '#4a2040'); px(g, sx - 3, sy, '#120810');
      if (i % 14 === 7) { rect(g, sx + 3, sy, 6, 2, '#3f6a22'); px(g, sx + 8, sy - 1, P.acid); }
    }
    g.globalAlpha = 1 - d * 0.5;
    // corona de pétalos enfermos detrás de la cabeza
    for (var p = 0; p < 8; p++) {
      var a = Math.PI * 0.55 + p / 7 * Math.PI * 0.9, len = 22 + (p % 2) * 4 + open * 4;
      var tx = hx + 6 + Math.cos(a) * len, ty = hy + Math.sin(a) * len * 0.9 - 4;
      for (var w = 0; w < 4; w++) line(g, hx + 6, hy - 2 + w - 2, tx, ty + w - 2, w === 0 ? P.sickL : P.sick);
      dia(g, tx, ty, 2, P.sickD); px(g, tx, ty, '#f0a0d0');
    }
    // mandíbulas (abiertas = open): superior e inferior con dientes
    var gap = 2 + Math.round(open * 14);
    for (var j = 0; j < 2; j++) {
      var sgn = j === 0 ? -1 : 1, ybase = hy + sgn * gap / 2;
      for (var r = 0; r < 12; r++) {
        var wdt = Math.round(24 - r * 1.5);
        rect(g, hx - wdt + 6, ybase + sgn * r, wdt + 8, 1, r < 2 ? '#8a2a6a' : '#5a1848');
      }
      for (var tth = 0; tth < 6; tth++) { var tx2 = hx - 14 + tth * 4; rect(g, tx2, ybase - (sgn > 0 ? 0 : 1) + sgn * 0, 1, 3 * -sgn * -1 > 0 ? 3 : 3, '#f0e6d8'); px(g, tx2, ybase + sgn * -2, '#f0e6d8'); }
      for (var sp = 0; sp < 4; sp++) px(g, hx - 6 + sp * 5, ybase + sgn * (5 + sp % 2), P.sickL);
    }
    rect(g, hx - 16, hy - gap / 2 + 1, 22, Math.max(0, gap - 2), '#180610');
    if (open > 0.4) { px(g, hx - 6, hy, P.acid); px(g, hx - 2, hy + 1, P.acid); }
    // bocas secundarias (Flor de las Mil Bocas)
    var mouths = o.mawTier >= 6 ? 6 : o.mawTier >= 2 ? 3 : o.mawTier >= 0 ? 1 : 0;
    for (var m = 0; m < mouths; m++) {
      var my = hy + 18 + m * 7 + Math.round(droop * 0.5), mx = hx + 2 + Math.round(Math.sin(m) * 3);
      var mo = Math.round(open * 2 + (Math.sin(t * 5 + m) > 0.6 ? 1 : 0));
      rect(g, mx - 2, my - mo, 5, mo * 2 + 1, '#140410'); if (mo) { px(g, mx - 1, my - mo, '#f0e0d0'); px(g, mx + 1, my + mo, '#f0e0d0'); }
    }
    g.globalAlpha = 1;
    if (d > 0.5) for (var f = 0; f < 6; f++) dia(g, hx - 20 + f * 8, hy + (d - 0.5) * 80 + f * 3, 1, P.sick); // pétalos que caen
  };

  // =====================================================================
  // REY SIN RÉQUIEM (cripta): monarca corpóreo con corona, manto y armadura funeraria.
  // Ancla: pies en (cx, fy). o = { shake 0..1, seals, defeat, crownParts, crownTotal, crownTier, time }
  // =====================================================================
  B.king = function (g, cx, fy, o) {
    o = o || {};
    var d = o.defeat || 0, t = o.time || 0;
    var sh = o.shake > 0 ? Math.round(Math.sin(t * 70) * 2 * o.shake) : 0;
    var kneel = Math.round(d * 10);
    var x = cx + sh, top = fy - 46 + kneel;
    var mantle = '#3a1e3e', mantleL = '#5a2e5a', armor = '#7a7488', armorL = '#b8b0c8', armorD = '#3a3646', bone = '#d8cfbf';
    g.globalAlpha = 1 - d * 0.7;
    // manto ancho (silueta en campana)
    for (var r = 0; r < 34; r++) { var w = Math.round(6 + r * 0.45); rect(g, x - w, top + 12 + r, w * 2 + 1, 1, r % 5 ? mantle : mantleL); px(g, x - w, top + 12 + r, '#140a16'); px(g, x + w, top + 12 + r, '#140a16'); }
    // grebas
    rect(g, x - 6, fy - 4, 4, 4, armorD); rect(g, x + 3, fy - 4, 4, 4, armorD);
    // coraza funeraria con placas
    rect(g, x - 7, top + 13, 15, 16, armor); rect(g, x - 7, top + 13, 15, 2, armorL);
    for (var pl = 0; pl < 3; pl++) rect(g, x - 6, top + 17 + pl * 4, 13, 1, armorD);
    Art.rune(g, x - 1, top + 18, 5, '#5a4a20');
    // hombreras
    fillEllipse(g, x - 9, top + 14, 4, 3, armorL); fillEllipse(g, x + 10, top + 14, 4, 3, armorL);
    // brazos y cetro roto
    rect(g, x - 13, top + 16, 3, 12, armor); rect(g, x + 11, top + 16, 3, 12, armor);
    line(g, x + 13, top + 28, x + 18, top + 8, P.brass); px(g, x + 18, top + 7, P.amberL); px(g, x + 19, top + 9, P.brassD);
    // cabeza: calavera con yelmo y ojos ámbar
    fillEllipse(g, x, top + 7, 5, 6, bone); rect(g, x - 5, top + 3, 11, 3, armorL);
    rect(g, x - 3, top + 6, 2, 2, '#000'); rect(g, x + 2, top + 6, 2, 2, '#000');
    var eye = o.seals > 0.6 ? '#ffffff' : P.amber; px(g, x - 2, top + 7, eye); px(g, x + 2, top + 7, eye);
    rect(g, x - 2, top + 10, 5, 1, '#000');
    // corona de hierro (siempre) y corona de la letanía (por partes)
    var cy = top + 1 - (d > 0.4 ? Math.round((d - 0.4) * 40) : 0), cxx = x + (d > 0.4 ? Math.round((d - 0.4) * 20) : 0);
    rect(g, cxx - 5, cy, 11, 2, '#6a5a3a'); [-4, -1, 2, 5].forEach(function (k) { px(g, cxx + k, cy - 1, '#8a7a4a'); px(g, cxx + k, cy - 2, '#8a7a4a'); });
    var parts = o.crownParts || 0, total = o.crownTotal || 0;
    for (var c = 0; c < parts; c++) { var pxx = cxx - 6 + Math.round(c * 12 / Math.max(1, total - 1)); rect(g, pxx, cy - 4, 2, 1, P.amberL); px(g, pxx, cy - 5 - (c % 2), P.amberL); if (o.crownTier >= 1) px(g, pxx, cy - 3, c % 2 ? '#ff6a6a' : '#6ab0ff'); }
    g.globalAlpha = 1;
    if (d > 0.6) for (var m = 0; m < 12; m++) px(g, x - 12 + (m * 7) % 24, top + 40 - (d - 0.6) * 60 - (m % 4) * 3, '#c8c0d8'); // se deshace en motas
  };

  // =====================================================================
  // REGENTE DE ESCARCHA (castillo): sentada en un trono que forma parte de su armadura.
  // Seis piezas de coraza donde el calor abre grietas. o = { cracks 0..6, target, thaw 0..1, hit, defeat, time }
  // =====================================================================
  B.regentParts = function (x, fy) {
    var top = fy - 74;
    return [
      { name: 'yelmo', x: x, y: top + 12 }, { name: 'hombrera izquierda', x: x - 14, y: top + 30 }, { name: 'hombrera derecha', x: x + 14, y: top + 30 },
      { name: 'peto', x: x, y: top + 40 }, { name: 'guantelete', x: x - 18, y: top + 52 }, { name: 'grebas', x: x + 2, y: top + 64 }
    ];
  };
  B.regent = function (g, x, fy, o) {
    o = o || {};
    var t = o.time || 0, d = o.defeat || 0, thaw = Math.max(0, Math.min(1, o.thaw || 0));
    var sh = o.hit > 0 ? Math.round(Math.sin(t * 60) * 2 * o.hit) : 0;
    var ice = '#bfe6ff', iceM = '#7fb8e0', iceD = '#2f5878', iceDD = '#16304a';
    var top = fy - 74;
    // trono que nace de la armadura: respaldo de carámbanos
    for (var s = 0; s < 9; s++) { var sx = x - 24 + s * 6, h = 40 + (s % 2) * 12 + (s === 4 ? 14 : 0); for (var k = 0; k < h; k++) { var w = Math.max(0, Math.round((h - k) / h * 3)); rect(g, sx - w, top + 46 - k + 10, w * 2 + 1, 1, k % 7 ? iceD : iceM); } }
    rect(g, x - 28, fy - 26, 56, 26, iceDD); rect(g, x - 28, fy - 26, 56, 2, iceM); // asiento
    rect(g, x - 32, fy - 36, 8, 36, iceD); rect(g, x + 24, fy - 36, 8, 36, iceD);   // brazos del trono
    x += sh;
    g.globalAlpha = 1 - d * 0.5;
    // cuerpo sentado (falda de placas, peto, hombreras, yelmo con corona de hielo)
    for (var r = 0; r < 18; r++) rect(g, x - 12 - Math.round(r * 0.4), fy - 30 + r, 24 + Math.round(r * 0.8), 1, r % 4 ? iceM : ice);
    rect(g, x - 10, top + 30, 21, 18, iceM); rect(g, x - 10, top + 30, 21, 2, ice); rect(g, x - 1, top + 32, 2, 14, iceD);
    fillEllipse(g, x - 14, top + 30, 6, 4, ice); fillEllipse(g, x + 14, top + 30, 6, 4, ice);
    rect(g, x - 20, top + 34, 5, 18, iceM); rect(g, x + 16, top + 34, 5, 18, iceM); // brazos
    fillEllipse(g, x - 18, top + 52, 4, 3, ice); fillEllipse(g, x + 18, top + 52, 4, 3, ice); // guanteletes sobre el trono
    fillEllipse(g, x, top + 16, 7, 8, ice); rect(g, x - 5, top + 15, 11, 3, '#0a1a2a'); px(g, x - 3, top + 16, '#9ff0ff'); px(g, x + 3, top + 16, '#9ff0ff');
    for (var c = -3; c <= 3; c++) { var ch = 5 + (c === 0 ? 5 : (Math.abs(c) % 2 ? 2 : 4)); rect(g, x + c * 2, top + 7 - ch, 1, ch, c === 0 ? '#ffffff' : ice); } // corona de carámbanos
    // grietas incandescentes en las piezas (fase económica: cracks), objetivo actual marcado
    var parts = B.regentParts(x, fy), n = o.cracks || 0;
    parts.forEach(function (pt, i) {
      if (i < n || thaw > 0) {
        var glow = thaw > 0 ? '#ffffff' : '#ff6a2a';
        line(g, pt.x - 3, pt.y - 3, pt.x, pt.y, glow); line(g, pt.x, pt.y, pt.x + 3, pt.y - 1, glow); line(g, pt.x, pt.y, pt.x - 1, pt.y + 3, '#ffb347');
      } else if (i === o.target && Math.sin(t * 6) > 0) ell(g, pt.x, pt.y, 4, 3, '#ffb347', 2);
    });
    if (thaw > 0) { g.globalAlpha = thaw * 0.6; for (var v = 0; v < 8; v++) rect(g, x - 20 + v * 5, top + 10 - thaw * 20 - (v % 3) * 4, 2, 6, '#e8f4ff'); g.globalAlpha = 1 - d * 0.5; } // vapor del deshielo
    g.globalAlpha = 1;
    if (d > 0.3) for (var f = 0; f < 14; f++) dia(g, x - 20 + (f * 9) % 40, top + 20 + (d - 0.3) * 80 + (f % 5) * 6, f % 3 ? 1 : 2, ice); // la coraza se rompe
  };

  // =====================================================================
  // CORAZÓN DE LA CALDERA (cavernas): coloso de lava; dominan su ojo y su enorme mano.
  // o = { eye 0..1 (apertura), flinch, hand 0..1 (alzada), defeat, time }
  // =====================================================================
  B.colossusEye = function (x, y) { return { x: x, y: y }; };
  B.colossus = function (g, ex, ey, o) {
    o = o || {};
    var t = o.time || 0, d = o.defeat || 0, open = Math.max(0.05, Math.min(1, o.eye || 0)) * (1 - d);
    var rock = '#2a1410', rockL = '#4a2418', lava = '#ff6a1a', lavaL = '#ffb347', lavaW = '#fff0c0';
    var cool = d; // al ser derrotado la lava se enfría
    var lc = cool > 0.5 ? '#5a3a30' : lava, llc = cool > 0.5 ? '#7a5a48' : lavaL;
    // masa del cuerpo (ocupa la parte derecha)
    for (var r = -40; r <= 70; r++) { var w = Math.round(46 - Math.abs(r - 10) * 0.25); rect(g, ex - w + 8, ey + r, w * 2, 1, r % 9 ? rock : rockL); }
    // grietas de lava que laten
    var pul = 0.6 + Math.sin(t * 2) * 0.4;
    for (var k = 0; k < 7; k++) { var sx = ex - 30 + k * 11, sy = ey + 10 + (k % 3) * 14; line(g, sx, sy, sx + 6, sy + 9, lc); line(g, sx + 6, sy + 9, sx + 2, sy + 18, pul > 0.7 ? llc : lc); }
    // ojo enorme: párpados de roca; pupila en rendija
    var eh = Math.round(2 + open * 11), fl = o.flinch > 0 ? Math.round(o.flinch * 3) : 0;
    fillEllipse(g, ex, ey, 20, 14, rockL);
    fillEllipse(g, ex, ey, 17, Math.max(1, eh), cool > 0.5 ? '#3a2a24' : lavaL);
    if (eh > 2) { fillEllipse(g, ex, ey, 12, Math.max(1, eh - 3), cool > 0.5 ? '#2a1a14' : lavaW); rect(g, ex - 1 + fl, ey - eh + 2, 3, Math.max(1, eh * 2 - 3), '#1a0604'); }
    rect(g, ex - 20, ey - eh - 2, 40, 2, rock); rect(g, ex - 20, ey + eh, 40, 2, rock);
    // mano enorme (abajo a la izquierda del ojo), dedos que se alzan
    var hand = Math.max(0, Math.min(1, o.hand || 0)) * (1 - d), hy = ey + 70 - Math.round(hand * 16) + Math.round(d * 20);
    fillEllipse(g, ex - 20, hy, 26, 12, rockL);
    for (var f = 0; f < 4; f++) { var fx = ex - 42 + f * 10, flen = 16 + (f === 1 || f === 2 ? 6 : 0) + Math.round(hand * 6); rect(g, fx, hy - flen, 7, flen, rock); rect(g, fx + 2, hy - flen + 2, 2, flen - 4, lc); rect(g, fx, hy - flen, 7, 2, rockL); }
    rect(g, ex - 50, hy - 6, 8, 14, rock); // pulgar
    if (d > 0.4) for (var s2 = 0; s2 < 10; s2++) px(g, ex - 30 + s2 * 6, ey - 20 - (d - 0.4) * 50 - (s2 % 3) * 4, '#8a7a70'); // ceniza
  };

  // =====================================================================
  // MAGOS NUEVOS (16x24): lancero de brasas y maga glaciar. Mano del foco (14,10); mano libre (3,12).
  // =====================================================================
  var LANCER = [
    '......kkkk......', '.....krrrrk.....', '....krrrrrrk....', '....krrssssk....', '....krssssesk...', '....krssssssk...',
    '.....kSsssssk...', '...kkkkSSkkkkk..', '..kcccmmmmmmcck.', '.kccmmmtmmmmmsk.', '.kccmmmtmmmmkk..', '..kcmmmtmmmk....',
    '..kcmbbbbbbmk...', '..kcmmmtmmmmk...', '..kcmmmtmmmmk...', '..kccmmtmmmmk...', '..kccmmtmmmmmk..', '.kcccmmtmmmmmk..',
    '.kcccmmtmmmmmk..', '.kcccmmtmmmmmk..', '.kttttttttttttk.', '....kBBk.kBBk...', '....kBBk.kBBk...', '....kkkk.kkkk...'
  ];
  Art.lancerPalettes = [
    { m: '#5a3a2a', t: '#8a5a3a', c: '#7a1a12', b: '#3a2416', B: '#1a1008' },
    { m: '#6a3a24', t: '#ff8a3a', c: '#9a2014', b: '#c9a66b', B: '#1a1008' },
    { m: '#7a4a2a', t: '#ffb347', c: '#b02a14', b: '#ffb347', B: '#100804' },
    { m: '#8a3a1a', t: '#ffd98a', c: '#c03010', b: '#ffd98a', B: '#100804' },
    { m: '#9a3010', t: '#fff0c0', c: '#e04010', b: '#fff0c0', B: '#080402' },
    { m: '#b04010', t: '#ffffff', c: '#ff6a1a', b: '#ffffff', B: '#080402' },
    { m: '#d05010', t: '#ffffff', c: '#ffb347', b: '#ffffff', B: '#000000' }
  ];
  Art.lancer = function (robeTier, glow) {
    var t = Math.max(0, Math.min(6, robeTier)), key = 'lancer' + t + (glow && t >= 3 ? 'g' : '');
    var pal = Object.assign({ k: P.outline, r: '#8a2a14', s: P.skin, S: P.skinS, e: P.eye }, Art.lancerPalettes[t]);
    if (glow && t >= 3) pal.t = '#ffffff';
    return Art.bake(LANCER, pal, key);
  };
  // Lanza (foco): desde la mano (hx,hy) hacia la derecha y arriba. Devuelve la punta.
  Art.lance = function (g, hx, hy, tier, time, charge) {
    var t = Math.max(0, Math.min(6, tier)), len = 22 + Math.min(6, t), tx = hx + len, ty = hy - Math.round(len * 0.35);
    line(g, hx - 8, hy + 3, tx, ty, '#5a3a20'); line(g, hx - 8, hy + 4, tx, ty + 1, '#3a2410');
    var tip = t >= 3 ? '#ffd98a' : '#c0c0c8';
    dia(g, tx + 1, ty, 2, tip); px(g, tx + 3, ty - 1, '#ffffff');
    var fl = 0.5 + Math.sin(time * 14) * 0.5;
    if (t >= 1) { px(g, tx + 2, ty - 3 - Math.round(fl * 2), '#ff8a3a'); px(g, tx, ty - 2, '#ffb347'); }
    if (t >= 2) { var op = Math.round(charge * 3); line(g, tx - 3, ty - 2 - op, tx - 6, ty - 5 - op, '#ffb347'); line(g, tx - 3, ty + 2 + op, tx - 6, ty + 5 + op, '#ffb347'); }
    if (t >= 3) for (var k = 0; k < 3; k++) px(g, tx - 8 + k * 3, ty + 3 + ((time * 10 + k) % 4), '#ff6a1a');
    if (t >= 4) for (var s = 0; s < 4; s++) { var a = time * 5 + s * 1.6; px(g, tx - 6 + Math.cos(a) * 6, ty + Math.sin(a) * 3, '#ffd98a'); }
    if (t >= 6) { g.globalAlpha = 0.6; dia(g, tx + 2, ty, 4, '#fff0c0'); g.globalAlpha = 1; }
    return { x: tx + 2, y: ty };
  };
  Art.forgeHelm = function (g, x, y, tier, cast) {
    var t = Math.max(0, Math.min(6, tier)), c = t >= 4 ? '#ffb347' : '#5a5a62';
    rect(g, x + 4, y, 8, 3, '#3a3a42'); rect(g, x + 4, y + 3, 8, 1, c); px(g, x + 9, y + 4, '#000');
    if (t >= 1) rect(g, x + 5, y + 1, 6, 1, '#7a7a82');
    if (t >= 2) for (var i = 0; i < 4; i++) px(g, x + 6 + i, y - 1 - (i % 2), cast ? '#ffffff' : '#ff8a3a');
    if (t >= 3) { line(g, x + 4, y, x + 1, y - 4, '#8a2a14'); line(g, x + 11, y, x + 14, y - 4, '#8a2a14'); }
    if (t >= 5) for (var j = 0; j < 5; j++) px(g, x + 5 + j * 1.5, y - 4 - (j % 2) * 2, '#ffd98a');
  };

  var GLACIAL = [
    '......kkkk......', '.....kwwwwk.....', '....kwwwwwwk....', '....kwwssssk....', '...kwwsssesk....', '...kwwsssssk....',
    '...kwwkSsssk....', '...kwk.kSSkk....', '..kwk.kccccck...', '..kwk.kcctcccsk.', '..kk.kccctccckk.', '....kcccctcck...',
    '...skccccctcck..', '....kccbbbbcck..', '....kcccctccck..', '...kccccctcccck.', '...kccccctcccck.', '..kcccccctccccck',
    '..kcccccctccccck', '..kcccccctccccck', '..kttttttttttttk', '.....kBBkkBBk...', '.....kBBkkBBk...', '.....kkkkkkkk...'
  ];
  Art.glacialPalettes = [
    { c: '#3a5a7a', t: '#9fd8ff', b: '#2a4058', B: '#1a2a38' },
    { c: '#4a6a8a', t: '#bfe6ff', b: '#9fd8ff', B: '#1a2a38' },
    { c: '#5a7a9a', t: '#e8f8ff', b: '#e8f8ff', B: '#101a24' },
    { c: '#3a4a8a', t: '#a0ffd8', b: '#a0ffd8', B: '#0a1020' },
    { c: '#2a3a6a', t: '#ffffff', b: '#bfe6ff', B: '#05080f' },
    { c: '#1a2a5a', t: '#e6f0ff', b: '#ffffff', B: '#05080f' },
    { c: '#0a1430', t: '#9fd8ff', b: '#ffffff', B: '#000000' }
  ];
  Art.glacial = function (robeTier, glow) {
    var t = Math.max(0, Math.min(6, robeTier)), key = 'glacial' + t + (glow && t >= 3 ? 'g' : '');
    var pal = Object.assign({ k: P.outline, w: '#e8f0f8', s: '#d8c8c0', S: '#a89890', e: P.eye }, Art.glacialPalettes[t]);
    if (glow && t >= 3) pal.t = '#ffffff';
    return Art.bake(GLACIAL, pal, key);
  };
  // Espejo de obsidiana (foco) flotando junto a la mano
  Art.obsidianMirror = function (g, x, y, tier, time, charge) {
    var t = Math.max(0, Math.min(6, tier));
    fillEllipse(g, x, y, 4, 6, t >= 1 ? '#bfe6ff' : '#5a5a6a');
    fillEllipse(g, x, y, 3, 5, '#0a0814'); px(g, x - 1, y - 2, '#7a5aa0'); px(g, x, y - 3, '#b8a0ff');
    if (t >= 2) { px(g, x + 3, y - 5, '#ffffff'); px(g, x - 3, y + 5, '#ffffff'); }
    if (t >= 3) { fillEllipse(g, x + 6, y + 1, 2, 4, '#0a0814'); ell(g, x + 6, y + 1, 2, 4, '#bfe6ff'); }
    if (t >= 4) { g.globalAlpha = 0.5; for (var k = 0; k < 5; k++) px(g, x - 4 + k * 2, y - 8 - (k % 2), '#a0ffd8'); g.globalAlpha = 1; }
    if (t >= 6) { g.globalAlpha = 0.4 + charge * 0.6; dia(g, x, y, 2, '#ffffff'); g.globalAlpha = 1; }
  };
  Art.glacialDiadem = function (g, x, y, tier, cast) {
    var t = Math.max(0, Math.min(6, tier)), c = cast ? '#ffffff' : '#bfe6ff';
    rect(g, x + 5, y + 1, 7, 1, '#7fb8e0');
    for (var i = 0; i < 3 + Math.min(2, t); i++) { var h = 2 + (i % 2) + (t >= 3 ? 1 : 0); rect(g, x + 5 + i * 2 - (t >= 3 ? 1 : 0), y + 1 - h, 1, h, c); }
    if (t >= 2) px(g, x + 8, y, '#a0ffd8');
    if (t >= 4) { g.globalAlpha = 0.6; Art.ellipse(g, x + 8, y - 4, 6, 2, '#a0ffd8', 2); g.globalAlpha = 1; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
