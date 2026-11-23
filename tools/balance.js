// Simulación de balance (5 zonas): ciclo único, varios ciclos con refundación, perfiles de 48 h de calendario
// y análisis de tramos donde comprar ×10 barato apenas aporta.
// Uso: node tools/balance.js [--perfiles] [--tramos] [--log]
'use strict';
const A = require('./load')();
const S = A.Sim, C = A.CONFIG;
const ZONES = C.zoneOrder;

const STRATEGY = {
  dt: 0.25, clicksPerSecond: 1, readingDelay: 2, checkEvery: 20,
  description: '1 clic/s solo hasta el primer foco de cada zona; cada 20 s compra, en cada zona, la entrada o mejora de la orden con mejor relación coste / (aumento en la zona que paga + ½ del aumento en las demás); si no le alcanza, ahorra para ella.'
};
const FOCUS = { forest: 'staff', jungle: 'grimoire', crypt: 'staff', castle: 'lance', caverns: 'mirror' };
// Orden de preferencia de talentos de los perfiles simulados
const TALENT_PLAN = ['heirloom', 'sky', 'seed', 'comet', 'forge', 'pact', 'bells', 'relics', 'veil'];

function value(st, zid) { let v = 0; for (const z of ZONES) v += S.zoneProd(st, z) * (z === zid ? 1 : 0.5); return v; }
function bestCandidate(st, zid) {
  const base = value(st, zid); let best = null;
  for (const id of C.zones[zid].itemOrder) {
    if (!S.isRevealed(st, zid, id)) continue;
    const p = S.plan(st, zid, id, '1'); if (p.capped) continue;
    st.zones[zid].items[id]++; const gain = value(st, zid) - base; st.zones[zid].items[id]--;
    if (gain <= 0) continue;
    const score = p.cost / gain;
    if (!best || score < best.score) best = { kind: 'item', id, cost: p.cost, score, gain };
  }
  for (const id of C.orderOrder) {
    const d = C.order[id];
    if (d.pays !== zid || !S.orderAvailable(st, id) || st.order[id] >= d.maxLevel) continue;
    const cost = S.orderCost(id, st.order[id]);
    st.order[id]++; const gain = value(st, zid) - base; st.order[id]--;
    if (gain <= 0) continue;
    const score = cost / gain;
    if (!best || score < best.score) best = { kind: 'order', id, cost, score, gain };
  }
  return best;
}
function shop(st, ctx, t) {
  for (const zid of ZONES) {
    if (!S.isOpen(st, zid)) continue;
    for (let guard = 0; guard < 600; guard++) {
      const b = bestCandidate(st, zid); if (!b) break;
      ctx.waiting[zid] = b;
      if (st.zones[zid].mana < b.cost) break;
      if (b.kind === 'item') {
        const r = S.buy(st, zid, b.id, '1'); if (!r) break;
        ctx.buys.push({ t, zone: zid, id: b.id, lvl: r.lvlAfter, cost: r.cost });
        if (r.visualCrossed.length) ctx.visual.push({ t, zone: zid, what: S.itemName(zid, b.id, r.lvlAfter) + ' (Nv ' + r.lvlAfter + ')' });
      } else { S.buyOrder(st, b.id); ctx.buys.push({ t, zone: zid, id: 'orden.' + b.id, lvl: st.order[b.id], cost: b.cost }); }
    }
  }
}
// Un tramo de juego activo: clics hasta automatizar, compras cada 20 s, avance de tiempo.
function activeSpan(st, ctx, seconds, onTick) {
  let clickAcc = 0, nextCheck = ctx.t;
  const end = ctx.t + seconds;
  for (; ctx.t < end; ctx.t += STRATEGY.dt) {
    if (ctx.t - ctx.cycleStart >= STRATEGY.readingDelay || ctx.cycleStart < 0) clickAcc += STRATEGY.clicksPerSecond * STRATEGY.dt;
    while (clickAcc >= 1) { clickAcc -= 1; const need = ZONES.find(z => S.isOpen(st, z) && st.zones[z].items[FOCUS[z]] < 1); if (need) S.manual(st, need); }
    for (const z of ZONES) if (S.isOpen(st, z) && st.zones[z].items[FOCUS[z]] < 1 && S.buy(st, z, FOCUS[z], '1')) ctx.buys.push({ t: ctx.t, zone: z, id: FOCUS[z], lvl: 1 });
    if (ctx.t >= nextCheck) { shop(st, ctx, ctx.t); nextCheck += STRATEGY.checkEvery; }
    S.advance(st, STRATEGY.dt);
    if (onTick && onTick(st, ctx) === 'stop') return 'stop';
  }
}
function newCtx() { return { t: 0, cycleStart: 0, buys: [], visual: [], waiting: {} }; }

// ---------- Ciclo único (como v0.1/v0.2) ----------
function run(opts) {
  opts = opts || {};
  const st = S.newState(null, 0);
  if (opts.talents) { for (const k in opts.talents) st.prestige.talents[k] = opts.talents[k]; S.applyStartTalents(st); }
  if (opts.resets) st.prestige.resets = opts.resets;
  const ctx = newCtx(), marks = {}; let mastery = 0;
  const mark = (k, t) => { if (marks[k] === undefined) marks[k] = t; };
  activeSpan(st, ctx, (opts.minutes || 120) * 60, (s, c) => {
    const T2 = c.t + STRATEGY.dt;
    if (s.zones.forest.items.staff >= 1) mark('primer báculo', T2);
    if (ZONES.some(z => Object.values(s.zones[z].items).some(l => l >= 10))) mark('primera evolución (Nv 10)', T2);
    if (s.zones.jungle.unlocked) mark('jungla descubierta', T2);
    if ((s.zones.jungle.cnt.bloom || 0) >= 1) mark('primera floración', T2);
    if (s.zones.crypt.unlocked) mark('cripta abierta', T2);
    if (s.order.confluence >= 1) mark('Confluencia', T2);
    if (s.zones.castle) {
      if (s.zones.castle.unlocked) mark('castillo abierto', T2);
      if (s.zones.castle.items.lance >= 1) mark('lanza (grietas automáticas)', T2);
      if ((s.zones.castle.cnt.thaw || 0) >= 1) mark('primer deshielo', T2);
      if ((s.zones.castle.cnt.thaw || 0) >= 10) mark('10 deshielos', T2);
      if (s.zones.caverns.unlocked) mark('cavernas abiertas', T2);
      if ((s.zones.caverns.cnt.eye || 0) >= 30) mark('30 miradas del ojo', T2);
    }
    const ml = S.masteryLevel(s); if (ml > mastery) { mastery = ml; mark('maestría de Chispa ' + ml, T2); }
    if (S.canPrestige(s)) mark('refundar disponible', T2);
    if ((S.echoInfo ? S.echoInfo(s).gain : S.echoesFor(S.runTotal(s))) >= 4) mark('4 Ecos al refundar', T2);
    if (marks[opts.stopAt || '4 Ecos al refundar'] !== undefined && !opts.full) return 'stop';
  });
  return { marks, st, ctx };
}

// ---------- Varios ciclos en 48 h de calendario con sesiones ----------
// profile: { name, sessions: [[hora, minutos], ...] por día, refund(st, ctx) → bool }
function buyTalents(st) {
  const bought = [];
  for (let guard = 0; guard < 20; guard++) {
    const id = TALENT_PLAN.find(k => st.prestige.talents[k] < C.talents[k].maxLevel && S.talentReqMet(st, k) && st.prestige.echoes >= S.talentCost(k, st.prestige.talents[k]));
    if (!id) break; S.buyTalent(st, id); bought.push(id);
  }
  return bought;
}
function campaign(profile) {
  let st = S.newState(null, 0);
  const ctx = newCtx(), log = [];
  let active = 0, lastEnd = 0, refunds = 0, echoesTotal = 0;
  const days = 2;
  for (let d = 0; d < days; d++) for (const [h, mins] of profile.sessions) {
    const start = (d * 24 + h) * 3600;
    const gap = start - lastEnd;
    if (gap > 0) { S.advance(st, Math.min(gap, C.offlineCapSeconds)); ctx.t = start; } // offline (máx. 8 h)
    const sessionEnd = start + mins * 60;
    while (ctx.t < sessionEnd) {
      const r = activeSpan(st, ctx, Math.min(60, sessionEnd - ctx.t));
      if (S.canPrestige(st) && profile.refund(st, ctx)) {
        const info = S.echoInfo(st), opened = ZONES.filter(z => S.isOpen(st, z));
        const res = S.prestige(st, 0); st = res.state; refunds++; echoesTotal += res.gained;
        const bought = buyTalents(st);
        log.push(`  día ${d + 1} ${String(h).padStart(2, '0')}:00+${Math.round((ctx.t - start) / 60)}min · refunda (ciclo ${fmtT(ctx.t - ctx.cycleStart)} activo+offline): +${res.gained} Ecos (${info.base}+${info.feats} hazañas) · zonas ${opened.length}` + (bought.length ? ' · compra ' + bought.join(', ') : ''));
        ctx.cycleStart = ctx.t;
      }
    }
    active += mins * 60; lastEnd = sessionEnd;
  }
  const talents = Object.entries(st.prestige.talents).filter(([, v]) => v > 0).map(([k, v]) => k + (v > 1 ? '×' + v : ''));
  const pending = C.talentOrder.filter(k => st.prestige.talents[k] < C.talents[k].maxLevel).map(k => k + (S.talentReqMet(st, k) ? '' : ' (dominio pendiente: ' + C.talents[k].req.text + ')'));
  return { profile: profile.name, active, refunds, echoesTotal, echoesLeft: st.prestige.echoes, talents, pending, log, st };
}
const PROFILES = [
  { name: 'Breve (4 sesiones/día de 12 min, recoge offline)', sessions: [[8, 12], [13, 12], [18, 12], [22, 12]],
    refund: (st, ctx) => S.echoInfo(st).gain >= 3 && (ctx.t - ctx.cycleStart > 20 * 3600 || !S.isOpen(st, 'castle') || (st.zones.castle.cnt.thaw || 0) >= 10 && (st.prestige.resets < 1 || S.isOpen(st, 'caverns') && (st.zones.caverns.cnt.eye || 0) >= 30)) },
  { name: 'Activo (2×60 min + 2×25 min al día, refunda a menudo)', sessions: [[9, 60], [14, 25], [19, 60], [23, 25]],
    refund: (st, ctx) => { const g = S.echoInfo(st).gain; const costs = TALENT_PLAN.filter(k => st.prestige.talents[k] < C.talents[k].maxLevel && S.talentReqMet(st, k)).map(k => S.talentCost(k, st.prestige.talents[k])); const cheapest = costs.length ? Math.min.apply(null, costs) : Infinity; return g >= 3 && (st.prestige.echoes + g >= cheapest || ctx.t - ctx.cycleStart > 3 * 3600); } }
];

// ---------- Ecos por hora: ciclos cortos frente a un ciclo profundo ----------
function echoRate(talents) {
  const short = run({ talents, resets: 1, stopAt: 'refundar disponible' });
  const deep = run({ talents, resets: 1, stopAt: '30 miradas del ojo', minutes: 300 });
  const sh = short.marks['refundar disponible'], dp = deep.marks['30 miradas del ojo'];
  return {
    short: { t: sh, echoes: S.echoInfo(short.st).gain, perHour: S.echoInfo(short.st).gain / (sh / 3600) },
    deep: { t: dp, echoes: dp ? S.echoInfo(deep.st).gain : 0, perHour: dp ? S.echoInfo(deep.st).gain / (dp / 3600) : 0 }
  };
}

// ---------- Tramos donde ×10 barato apenas aporta ----------
function deadSpans(r) {
  // Recorre de nuevo la partida y en cada revisión mide: aumento % de comprar ×10 del objeto más barato
  // y tiempo hasta poder pagar la mejor compra (por payback).
  const st = S.newState(null, 0), ctx = newCtx(), out = [];
  activeSpan(st, ctx, Math.min(r.marks['refundar disponible'] || 3600, 3600), (s, c) => {
    if (Math.abs(c.t % 60) > 0.01 || c.t < 120) return;
    for (const z of ['forest', 'jungle', 'crypt', 'castle']) {
      if (!s.zones[z] || !S.isOpen(s, z) || s.zones[z].items[FOCUS[z]] < 1) continue;
      const prod = S.zoneProd(s, z); if (prod <= 0) continue;
      const cheap = C.zones[z].itemOrder.filter(id => S.isRevealed(s, z, id) && !S.plan(s, z, id, '1').capped).sort((a, b) => S.plan(s, z, a, '1').cost - S.plan(s, z, b, '1').cost)[0];
      if (!cheap) continue;
      const p10 = S.plan(s, z, cheap, '10'), g10 = S.prodWith(s, z, cheap, p10.n) - prod;
      const best = bestCandidate(s, z);
      const wait = best ? Math.max(0, (best.cost - s.zones[z].mana) / prod) : 0;
      if (g10 / prod < 0.02 && wait > 120) out.push({ t: c.t, z, cheap, pct: g10 / prod, cost10: p10.cost, next: best && best.id, wait });
    }
  });
  return out;
}

const fmtT = s => s === undefined ? '—' : `${Math.floor(s / 3600) ? Math.floor(s / 3600) + 'h' : ''}${Math.floor(s / 60) % 60}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const fmtN = n => n >= 1e9 ? (n / 1e9).toFixed(2) + 'G' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toFixed(1);
function report(title, r) {
  console.log(`\n== ${title} ==`);
  for (const k in r.marks) console.log(`  ${k.padEnd(30)} ${fmtT(r.marks[k])}`);
  const st = r.st, c = S.runContrib(st);
  for (const z of ZONES) if (S.isOpen(st, z)) console.log(`  ${z.padEnd(8)} ${JSON.stringify(st.zones[z].items)} prod ${fmtN(S.zoneProd(st, z))}/s`);
  console.log(`  orden ${JSON.stringify(st.order)} | total ${fmtN(c.total)} (${ZONES.map(z => z + ' ' + fmtN(c[z])).join(', ')}) | Ecos ${S.echoInfo ? JSON.stringify(S.echoInfo(st)) : S.echoesFor(c.total)}`);
}
function firstBuys(r) { const o = {}; r.ctx.buys.forEach(b => { const k = b.zone + '.' + b.id; if (o[k] === undefined) o[k] = b.t; }); return o; }
function forestGaps(r, upTo) {
  const fb = r.ctx.buys.filter(b => b.zone === 'forest' && b.t <= upTo).sort((a, b) => a.t - b.t), gaps = [];
  for (let i = 1; i < fb.length; i++) gaps.push({ from: fb[i - 1].t, to: fb[i].t, gap: fb[i].t - fb[i - 1].t, next: fb[i].id + ' ' + (fb[i].lvl || '') });
  return { count: fb.length, gaps: gaps.sort((a, b) => b.gap - a.gap) };
}

module.exports = { run, campaign, PROFILES, echoRate, deadSpans, STRATEGY, A, report, firstBuys, forestGaps, fmtT };

if (require.main === module) {
  const args = process.argv.slice(2);
  const r0 = run({ minutes: 90 });
  report('Partida 1 (nueva, sin talentos)', r0);
  const fb = firstBuys(r0);
  console.log('  Primera compra:', Object.entries(fb).filter(([k]) => !k.includes('orden')).map(([k, t]) => k + '@' + fmtT(t)).join(' '));
  report('Partida 2 con Báculos heredados (1 refundación previa)', run({ talents: { heirloom: 1 }, resets: 1, minutes: 120 }));
  report('Partida 2 con Cielo Recordado', run({ talents: { sky: 1 }, resets: 1, minutes: 120 }));
  if (args.includes('--tramos')) {
    const d = deadSpans(r0);
    console.log(`\n== Tramos con ×10 barato < 2 % y siguiente compra importante a > 2 min: ${d.length} revisiones ==`);
    d.slice(0, 12).forEach(x => console.log(`  ${fmtT(x.t)} ${x.z}: ×10 ${x.cheap} = +${(x.pct * 100).toFixed(2)} % (${fmtN(x.cost10)}) · espera ${Math.round(x.wait)} s para ${x.next}`));
  }
  if (args.includes('--perfiles')) {
    const er = echoRate({ heirloom: 1 });
    console.log(`\n== Ecos por hora (ciclo 2 con Báculos heredados) ==\n  corto: refundar en ${fmtT(er.short.t)} → ${er.short.echoes} Ecos (${er.short.perHour.toFixed(2)}/h)\n  profundo: hasta 30 miradas del ojo en ${fmtT(er.deep.t)} → ${er.deep.echoes} Ecos (${er.deep.perHour.toFixed(2)}/h)`);
    for (const p of PROFILES) {
      const c = campaign(p);
      console.log(`\n== Perfil: ${c.profile} ==\n  activo ${fmtT(c.active)} · refundaciones ${c.refunds} · Ecos obtenidos ${c.echoesTotal} (sin gastar ${c.echoesLeft})\n  talentos: ${c.talents.join(', ') || '—'}\n  pendientes: ${c.pending.join('; ')}`);
      c.log.forEach(l => console.log(l));
    }
  }
}
