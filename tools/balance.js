// Simulación de balance: estrategia de compra sencilla y reproducible (3 zonas).
// Uso: node tools/balance.js [--log] [--talento heirloom|sky|seed|bells] [--min 90]
'use strict';
const A = require('./load')();
const S = A.Sim, C = A.CONFIG;
const ZONES = C.zoneOrder;

const STRATEGY = {
  dt: 0.25,                 // paso de simulación (s)
  clicksPerSecond: 1,       // solo antes del foco (primera automatización) de cada zona
  readingDelay: 2,          // segundos que tarda en empezar (lee la pantalla)
  checkEvery: 20,           // revisa la tienda cada 20 s
  description: '1 clic/s solo hasta el primer foco de cada zona (báculo, grimorio, báculo de latón); cada 20 s compra, en cada zona, la entrada o mejora de la orden con mejor relación coste / (aumento en la zona que paga + ½ del aumento en las demás); si no le alcanza, ahorra para ella.'
};
const FOCUS = { forest: 'staff', jungle: 'grimoire', crypt: 'staff' };

function totalProd(st) { return S.totalProd(st); }

// Valor de una compra: aumento en la zona que paga + la mitad del aumento en las demás.
function value(st, zid) {
  let v = 0;
  for (const z of ZONES) v += S.zoneProd(st, z) * (z === zid ? 1 : 0.5);
  return v;
}
function bestCandidate(st, zid) {
  const totalProd = () => value(st, zid);
  const base = totalProd();
  let best = null;
  for (const id of C.zones[zid].itemOrder) {
    if (!S.isRevealed(st, zid, id)) continue;
    const p = S.plan(st, zid, id, '1');
    if (p.capped) continue;
    st.zones[zid].items[id]++; const gain = totalProd() - base; st.zones[zid].items[id]--;
    if (gain <= 0) continue;
    const score = p.cost / gain;
    if (!best || score < best.score) best = { kind: 'item', id, cost: p.cost, score };
  }
  for (const id of C.orderOrder) {
    const d = C.order[id];
    if (d.pays !== zid || !S.orderAvailable(st, id) || st.order[id] >= d.maxLevel) continue;
    const cost = S.orderCost(id, st.order[id]);
    st.order[id]++; const gain = totalProd() - base; st.order[id]--;
    if (gain <= 0) continue;
    const score = cost / gain;
    if (!best || score < best.score) best = { kind: 'order', id, cost, score };
  }
  return best;
}

function shop(st, ctx, t) {
  for (const zid of ZONES) {
    if (!S.isOpen(st, zid)) continue;
    for (let guard = 0; guard < 400; guard++) {
      const b = bestCandidate(st, zid);
      if (!b) break;
      ctx.waiting[zid] = b;
      if (st.zones[zid].mana < b.cost) break;
      if (b.kind === 'item') {
        const r = S.buy(st, zid, b.id, '1');
        if (!r) break;
        ctx.buys.push({ t, zone: zid, id: b.id, lvl: r.lvlAfter, cost: r.cost });
        if (r.visualCrossed.length) ctx.visual.push({ t, zone: zid, what: S.itemName(zid, b.id, r.lvlAfter) + ' (Nv ' + r.lvlAfter + ')' });
      } else {
        S.buyOrder(st, b.id);
        ctx.buys.push({ t, zone: zid, id: 'orden.' + b.id, lvl: st.order[b.id], cost: b.cost });
      }
    }
  }
}

function run(opts) {
  opts = opts || {};
  const st = S.newState(null, 0);
  if (opts.talents) { for (const k in opts.talents) st.prestige.talents[k] = opts.talents[k]; S.applyStartTalents(st); }
  const marks = {}, ctx = { buys: [], visual: [], waiting: {} };
  const mark = (k, t) => { if (marks[k] === undefined) marks[k] = t; };
  const maxT = (opts.minutes || 120) * 60;
  let nextCheck = 0, clickAcc = 0, mastery = 0;
  for (let t = 0; t <= maxT; t += STRATEGY.dt) {
    if (t >= STRATEGY.readingDelay) clickAcc += STRATEGY.clicksPerSecond * STRATEGY.dt;
    while (clickAcc >= 1) {
      clickAcc -= 1;
      const need = ZONES.find(z => S.isOpen(st, z) && st.zones[z].items[FOCUS[z]] < 1);
      if (need) S.manual(st, need);
    }
    for (const z of ZONES) {
      if (S.isOpen(st, z) && st.zones[z].items[FOCUS[z]] < 1 && S.buy(st, z, FOCUS[z], '1')) ctx.buys.push({ t: t + STRATEGY.dt, zone: z, id: FOCUS[z], lvl: 1 });
    }
    if (st.zones.forest.items.staff >= 1) mark('primer báculo', t + STRATEGY.dt);
    if (t >= nextCheck) { shop(st, ctx, t); nextCheck += STRATEGY.checkEvery; }
    const rep = S.advance(st, STRATEGY.dt);
    const T2 = t + STRATEGY.dt;
    if (ZONES.some(z => Object.values(st.zones[z].items).some(l => l >= 10))) mark('primera evolución (Nv 10)', T2);
    if (st.zones.jungle.unlocked) mark('jungla descubierta', T2);
    if (st.zones.jungle.items.grimoire >= 1) mark('grimorio (podas automáticas)', T2);
    if ((st.zones.jungle.cnt.bloom || 0) >= 1) mark('primera floración', T2);
    if (st.zones.crypt.unlocked) mark('cripta abierta', T2);
    if (st.zones.crypt.items.staff >= 1) mark('báculo de la maga', T2);
    if (st.order.confluence >= 1) mark('Confluencia', T2);
    if (st.order.pollen >= 1) mark('Polen Astral', T2);
    if (st.order.rootstar >= 1) mark('Raíz Estelar', T2);
    const ml = S.masteryLevel(st);
    if (ml > mastery) { mastery = ml; mark('maestría de Chispa ' + ml, T2); }
    if (S.canPrestige(st)) mark('refundar disponible', T2);
    if (S.echoesFor(S.runTotal(st)) >= 4) mark('4 Ecos', T2);
    if (marks['4 Ecos'] !== undefined && !opts.full) break;
  }
  return { marks, st, ctx };
}

const fmtT = s => s === undefined ? '—' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const fmtN = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toFixed(1);

// Huecos entre compras del bosque y qué ocurre mientras se ahorra.
function forestGaps(r, upTo) {
  const fb = r.ctx.buys.filter(b => b.zone === 'forest' && b.t <= upTo).sort((a, b) => a.t - b.t);
  const gaps = [];
  for (let i = 1; i < fb.length; i++) gaps.push({ from: fb[i - 1].t, to: fb[i].t, gap: fb[i].t - fb[i - 1].t, next: fb[i].id + ' ' + (fb[i].lvl || '') });
  gaps.sort((a, b) => b.gap - a.gap);
  return { count: fb.length, gaps };
}
function windowReport(r, a, b) {
  const fb = r.ctx.buys.filter(x => x.zone === 'forest' && x.t >= a && x.t < b);
  const kinds = {};
  fb.forEach(x => { kinds[x.id] = (kinds[x.id] || 0) + 1; });
  const vis = r.ctx.visual.filter(v => v.zone === 'forest' && v.t >= a && v.t < b).map(v => v.what);
  return { count: fb.length, kinds, visual: vis };
}

function report(title, r) {
  console.log(`\n== ${title} ==`);
  for (const k in r.marks) console.log(`  ${k.padEnd(30)} ${fmtT(r.marks[k])}`);
  const st = r.st, c = S.runContrib(st);
  for (const z of ZONES) console.log(`  ${z.padEnd(7)} ${JSON.stringify(st.zones[z].items)} prod ${fmtN(S.zoneProd(st, z))}/s`);
  console.log(`  orden ${JSON.stringify(st.order)} | total ${fmtN(c.total)} (bosque ${fmtN(c.forest)}, jungla ${fmtN(c.jungle)}, cripta ${fmtN(c.crypt)})`);
}

function firstBuys(r) {
  const o = {};
  r.ctx.buys.forEach(b => { const k = b.zone + '.' + b.id; if (o[k] === undefined) o[k] = b.t; });
  return o;
}

module.exports = { run, STRATEGY, A, report, forestGaps, windowReport, firstBuys, fmtT };

if (require.main === module) {
  const args = process.argv.slice(2);
  const r0 = run({ full: args.includes('--full'), minutes: 70 });
  report('Partida 1 (sin talentos)', r0);
  const pre = r0.marks['refundar disponible'] || 3600;
  const g = forestGaps(r0, pre);
  console.log(`\n  Bosque hasta el prestigio: ${g.count} compras. Huecos más largos:`);
  g.gaps.slice(0, 5).forEach(x => console.log(`    ${fmtT(x.from)} → ${fmtT(x.to)}  espera ${Math.round(x.gap)} s (siguiente: ${x.next})`));
  for (const [a, b] of [[13 * 60 + 40, 16 * 60 + 20], [19 * 60, 22 * 60 + 20], [29 * 60, 33 * 60]]) {
    const w = windowReport(r0, a, b);
    console.log(`  Tramo ${fmtT(a)}–${fmtT(b)}: ${w.count} compras ${JSON.stringify(w.kinds)} · cambios visuales: ${w.visual.join(', ') || '—'}`);
  }
  const fbuys = firstBuys(r0);
  const missing = [];
  for (const z of ZONES) for (const id of C.zones[z].itemOrder) if (fbuys[z + '.' + id] === undefined) missing.push(z + '.' + id);
  console.log('  Primera compra de cada entrada:', Object.entries(fbuys).filter(([k]) => !k.includes('orden')).map(([k, t]) => k + '@' + fmtT(t)).join(' '));
  console.log('  Entradas nunca compradas en 70 min:', missing.join(', ') || 'ninguna');
  if (args.includes('--log')) r0.ctx.buys.forEach(b => console.log('   ', fmtT(b.t), b.zone, b.id, b.lvl));
  report('Partida 2 con Báculos heredados', run({ talents: { heirloom: 1 } }));
  report('Partida 2 con Cielo Recordado', run({ talents: { sky: 1 } }));
  report('Partida 2 con Semilla de la Fundadora', run({ talents: { seed: 1 } }));
  report('Partida 2 con Campanas eternas', run({ talents: { bells: 1 } }));
}
