// Pruebas de lógica (Node, sin dependencias): node tests/logic.test.js
'use strict';
const fs = require('fs');
const path = require('path');
const A = require('../tools/load')();
const S = A.Sim, C = A.CONFIG, Save = A.Save;
const ZONES = C.zoneOrder;
let pass = 0, fail = 0;
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
}
const near = (a, b, eps) => Math.abs(a - b) <= (eps || 1e-6) * Math.max(1, Math.abs(a), Math.abs(b));
const section = t => console.log('\n' + t);
const clone = o => JSON.parse(JSON.stringify(o));
const fixture = n => fs.readFileSync(path.join(__dirname, 'fixtures', n), 'utf8');
function open(st, z) { st.zones[z].unlocked = true; st.zones[z].introSeen = true; }

section('Catálogo: 8 entradas por mago con ID único');
ZONES.forEach(z => {
  const ids = C.zones[z].itemOrder;
  ok(ids.length === 8 && new Set(ids).size === 8 && ids.every(id => C.zones[z].items[id]), z + ': 8 entradas únicas definidas', ids);
  const slots = ids.map(id => C.zones[z].items[id].slot);
  ok(slots.filter(s => s === 'focus').length === 1 && slots.filter(s => s === 'robe').length === 1 && slots.filter(s => s === 'hat').length === 1 && slots.filter(s => s === 'accessory').length === 1 && slots.filter(s => s === 'spell').length === 4, z + ': 1 foco, 1 túnica, 1 tocado, 1 accesorio y 4 hechizos', slots);
  ids.forEach(id => ok(C.zones[z].items[id].names.length === 7, z + '.' + id + ': 7 nombres de estado visual'));
});
ok(Object.keys(C.zones).length === 3 && C.zoneOrder.join() === 'forest,jungle,crypt', 'orden de presentación bosque → jungla → cripta (ids estables)');

section('Partida nueva y primer báculo');
let st = S.newState(null, 0);
for (let i = 0; i < 9; i++) S.manual(st, 'forest');
ok(S.buy(st, 'forest', 'staff', '1') === null, 'con 9 de maná no alcanza el Báculo de Rama (10)');
S.manual(st, 'forest');
ok(S.buy(st, 'forest', 'staff', '1') && st.zones.forest.items.staff === 1, 'el 10.º lanzamiento compra el báculo');
ok(!S.isRevealed(st, 'forest', 'constellation') && S.isRevealed(st, 'forest', 'robe'), 'las entradas se descubren gradualmente');
ok(S.buy(st, 'forest', 'constellation', '1') === null, 'no se puede comprar una entrada sin descubrir');
S.advance(st, 10);
ok(near(st.zones.forest.mana, S.forestProd(st) * 10), 'la producción depende del tiempo transcurrido');

section('Compras múltiples, hitos económicos y topes');
st = S.newState(null, 0);
st.zones.forest.items.staff = 5;
const def = C.zones.forest.items.staff;
let exp = 0; for (let l = 5; l < 15; l++) exp += def.baseCost * Math.pow(def.growth, l);
st.zones.forest.mana = exp + 0.5;
const r10 = S.buy(st, 'forest', 'staff', '10');
ok(r10 && r10.n === 10 && near(r10.cost, exp) && near(st.zones.forest.mana, 0.5), '×10 cobra el coste acumulado exacto');
ok(r10.crossed.join() === '10' && r10.visualCrossed.join() === '10', 'registra el hito económico y el visual del Nv 10');
st.zones.forest.items.staff = 8; st.zones.forest.mana = S.costFor(def, 8, 45) + 1;
const rmax = S.buy(st, 'forest', 'staff', 'max');
ok(rmax.lvlAfter === 53 && rmax.crossed.join() === '10,50' && S.milestoneMult(53) === 6, 'Máx atraviesa 10 y 50 (×6)');
const capC = S.itemCap('crypt', 'chalk'), capH = S.itemCap('jungle', 'hat');
ok(capC === 24, 'el Círculo de Tiza llega al intervalo mínimo en el Nv 24', capC);
ok(isFinite(capH) && capH > 10, 'el Tocado de Espinas tiene tope real (Nv ' + capH + ')');
st = S.newState(null, 0); open(st, 'crypt'); st.zones.crypt.items.chalk = 20; st.zones.crypt.mana = 1e30;
const p10 = S.plan(st, 'crypt', 'chalk', '10');
ok(p10.n === 4 && near(p10.cost, S.costFor(C.zones.crypt.items.chalk, 20, 4)), '×10 cerca del tope ofrece y cobra solo los niveles posibles (4)');
S.buy(st, 'crypt', 'chalk', '10');
ok(st.zones.crypt.items.chalk === 24 && S.plan(st, 'crypt', 'chalk', '1').capped && S.buy(st, 'crypt', 'chalk', '1') === null, 'al llegar al tope ya no cobra más');
ok(near(S.cryptInterval(st), C.zones.crypt.pulse.minInterval), 'intervalo mínimo alcanzado');

section('Hitos visuales separados de los económicos');
const vt = (z, id, l) => S.visualTier(z, id, l);
ok([0, 9, 10, 11, 49, 50, 99, 100, 149, 150, 199, 200, 249, 250, 251, 400].map(l => vt('forest', 'spell', l)).join() === '0,0,1,1,1,2,2,3,3,4,4,5,5,6,6,6', 'límites 9/10/11 … 249/250/251 (forma final desde 250)');
ok(vt('crypt', 'chalk', 9) === 0 && vt('crypt', 'chalk', 10) === 1 && vt('crypt', 'chalk', 23) === 1 && vt('crypt', 'chalk', 24) === 6, 'el círculo evoluciona en 10 y culmina en su tope (24)');
ok(S.visualMilestones('crypt', 'chalk').join() === '10,24' && S.nextVisual('crypt', 'chalk', 24) === null, 'la tienda solo anuncia hitos alcanzables del círculo (10 y 24)');
ok(S.nextVisual('forest', 'staff', 250) === null && S.nextVisual('forest', 'staff', 249).level === 250, 'tope artístico 250: luego «forma final»');
ok(S.milestoneMult(300) === 6 * 2 * Math.pow(2, 4) && vt('forest', 'staff', 300) === 6, 'la economía sigue saltando tras el 250 aunque la forma ya no cambie');
ok(S.itemName('forest', 'staff', 70) === 'Báculo del Velo', 'un báculo Nv 70 muestra su forma del Nv 50 (nombre evolucionado)');

section('Jungla: podas, secuencia y floración (activo = offline)');
st = S.newState(null, 0); open(st, 'jungle');
for (let i = 0; i < 4; i++) S.manual(st, 'jungle');
ok(st.zones.jungle.seq.bloom === 4 && (st.zones.jungle.cnt.bloom || 0) === 0, 'cuatro marcas a mano avanzan la secuencia');
const mb = S.manual(st, 'jungle');
ok(mb.bloom > 0 && st.zones.jungle.seq.bloom === 0 && st.zones.jungle.cnt.bloom === 1, 'la quinta marca provoca una floración');
Object.assign(st.zones.jungle.items, { grimoire: 12, robe: 3, hat: 6, collar: 2, sickle: 4, pollen: 2, graft: 2, maw: 1 });
const m = S.model(st, 'jungle'), pr = m.cycles.find(c => c.id === 'prune');
ok(pr && pr.seq && pr.seq.every === 5 && pr.seq.reward > pr.reward, 'la floración vale más que una poda');
const a = clone(st), b = clone(st);
for (let i = 0; i < 2000; i++) S.advance(a, 0.0371);
S.advance(b, 74.2);
ok(a.zones.jungle.cnt.prune === b.zones.jungle.cnt.prune && a.zones.jungle.cnt.bloom === b.zones.jungle.cnt.bloom && near(a.zones.jungle.mana, b.zones.jungle.mana, 1e-6), 'jugar activo (2000 pasos) = offline de golpe (74,2 s)', [a.zones.jungle.cnt, b.zones.jungle.cnt]);
const nP = Math.floor(74.2 / pr.interval + 1e-9);
ok(b.zones.jungle.cnt.prune === nP && b.zones.jungle.cnt.bloom === 1 + Math.floor(nP / 5), 'podas = ⌊t/intervalo⌋ y floraciones = ⌊podas/5⌋ (+1 manual previa)');
const sav = Save.parse(JSON.stringify(Object.assign(clone(st), { lastTick: 1000 })));
const cont = clone(sav.state); S.advance(cont, 7.7);
Save.applyOffline(sav.state, 1000 + 7700);
ok(sav.state.zones.jungle.seq.bloom === cont.zones.jungle.seq.bloom && near(sav.state.zones.jungle.cyc.prune, cont.zones.jungle.cyc.prune) && near(sav.state.zones.jungle.mana, cont.zones.jungle.mana), 'recarga a mitad de ciclo: fase y secuencia continúan');

section('Mejoras cruzadas: una dirección, sin duplicar');
st = S.newState(null, 0); open(st, 'jungle'); open(st, 'crypt');
Object.assign(st.zones.forest.items, { staff: 30, robe: 20, spell: 10, orbit: 5 });
Object.assign(st.zones.jungle.items, { grimoire: 20, robe: 10 });
st.zones.crypt.items.staff = 10;
const own = S.crossSources(st);
st.order.confluence = 2; st.order.pollen = 2; st.order.rootstar = 3;
const own2 = S.crossSources(st);
ok(near(own.forest, own2.forest) && near(own.jungle, own2.jungle), 'las fuentes cruzadas (producción propia) no cambian al activar bonos: sin retroalimentación');
const cm = S.model(st, 'crypt').cycles[0];
ok(near(cm.cross, C.order.confluence.seconds[2] * own2.forest), 'Confluencia = segundos × producción propia del bosque');
const jb = S.model(st, 'jungle').cycles[0].seq;
ok(near(jb.cross, C.order.pollen.seconds[2] * own2.forestSpell), 'Polen Astral = segundos × Lluvia del bosque por floración');
const fo = S.model(st, 'forest').cycles.find(c => c.id === 'orbit');
ok(near(fo.cross, C.order.rootstar.seconds[3] * own2.jungle), 'Raíz Estelar = segundos × producción propia de la jungla por órbita');
const before = { f: st.zones.forest.mana, j: st.zones.jungle.mana, c: st.zones.crypt.mana };
const rep = S.advance(st, 30);
const sumGen = ZONES.reduce((s, z) => s + rep.zones[z], 0);
const evSum = rep.events.reduce((s, e) => s + e.reward * e.count, 0);
const passive = ZONES.reduce((s, z) => s + S.model(st, z).passive * 30, 0);
ok(near(sumGen, evSum + passive, 1e-6), 'lo acreditado = pasivo + recompensa de cada evento (sin dobles cobros)', { sumGen, evSum, passive });
ok(st.zones.forest.mana - before.f > 0 && near(st.zones.forest.mana - before.f, rep.zones.forest), 'el bosque conserva su maná al alimentar a otros');
st.zones.jungle.mana = 1e12; st.zones.forest.mana = 1e12;
const fakeLoop = S.zoneProd(st, 'forest'), fakeLoop2 = S.zoneProd(st, 'forest');
ok(near(fakeLoop, fakeLoop2), 'calcular la producción dos veces da lo mismo (estable)');

section('Vista previa de compras con valor indirecto');
const pv = S.preview(st, 'forest', 'robe', 1);
ok(pv.after.prod.forest > pv.before.prod.forest && pv.after.events['crypt.pulse'] > pv.before.events['crypt.pulse'], 'mejorar el bosque con Confluencia: más maná/s en el bosque y más por pulso en la cripta');
const pv2 = S.preview(st, 'forest', 'spell', 1);
ok(pv2.after.events['jungle.bloom'] > pv2.before.events['jungle.bloom'], 'la Lluvia con Polen Astral sube cada floración');

section('Migración desde v0.1 (fixtures generados con el código v0.1)');
const raw = fixture('v01-refundada.json');
const old = JSON.parse(raw);
const mig = Save.parse(raw);
ok(mig.ok && mig.migratedFrom === 1, 'el guardado v0.1 se migra', mig.errors);
const ms = mig.state;
ok(ms.zones.forest.items.staff === 70 && ms.zones.forest.items.ring === 12 && ms.zones.forest.items.robe === 35 && ms.zones.forest.items.spell === 18, 'conserva niveles del bosque');
ok(ms.zones.crypt.unlocked && ms.zones.crypt.items.staff === 40 && ms.zones.crypt.items.bell === 15 && ms.zones.crypt.items.chalk === 20, 'cripta abierta con Campana y Círculo de Tiza intactos');
ok(ms.prestige.talents.heirloom === 1 && ms.prestige.echoes === 1 && ms.prestige.resets === 1, 'conserva Báculos heredados, Ecos y refundaciones (sin Ecos extra)');
ok(ms.order.confluence === 2 && ms.order.resonance === 3 && ms.order.pollen === 0 && ms.order.rootstar === 0, 'conserva mejoras de la orden e inicializa las nuevas');
ok(near(ms.zones.forest.mana, 123456) && near(ms.zones.crypt.mana, 98765) && near(ms.zones.forest.generated, 2.5e7), 'conserva saldos y maná generado');
ok(near(ms.zones.crypt.cyc.pulse, old.zones.crypt.phase) && ms.zones.crypt.cnt.pulse === 3456, 'conserva la fase y el conteo de pulsos');
ok(ms.zones.jungle.unlocked === true && ms.zones.jungle.items.grimoire === 0 && !ms.zones.jungle.cnt.bloom, 'habilita la jungla (cumple su condición) sin floraciones pasadas');
ok(S.itemName('forest', 'staff', ms.zones.forest.items.staff) === 'Báculo del Velo' && S.visualTier('forest', 'staff', 70) === 2, 'el báculo Nv 70 abre con su forma del Nv 50');
ok(near(S.heirloomMult(ms), 1.5) && S.pulseBreakdown(ms).base > 0, 'el efecto de Báculos heredados sigue aplicándose');
const offTime = 3 * 3600 * 1000;
const offRep = Save.applyOffline(ms, old.lastTick + offTime);
ok(offRep.legacy && ms.mastery.sparks === 0, 'el tiempo offline anterior a la actualización no genera maestría (contenido nuevo)');
ok(!offRep.counts.jungle.bloom && offRep.zones.jungle === 0, 'ni floraciones de la jungla');
ok(offRep.counts.crypt.pulse > 0 && offRep.zones.forest > 0, 'sí acredita lo que ya existía (bosque y pulsos)');
const ms2 = Save.parse(JSON.stringify(ms)).state;
ok(ms2.version === 2 && !Save.parse(JSON.stringify(ms)).migratedFrom, 'el guardado migrado ya es v2: no se vuelve a migrar');
const again = Save.applyOffline(ms2, ms.lastTick);
ok(again.zones.forest === 0 && again.zones.crypt === 0, 'recargar en el mismo instante no vuelve a acreditar');
ok(!ms2.flags.legacyOffline, 'el modo legado se consume una sola vez');
const exp01 = Save.parse(fixture('v01-exportada.json'));
ok(exp01.ok && exp01.state.prestige.talents.heirloom === 1, 'también migra un JSON exportado desde v0.1');
const ini = Save.parse(fixture('v01-inicial.json'));
ok(ini.ok && ini.state.zones.forest.items.staff === 1 && !ini.state.zones.jungle.unlocked, 'partida v0.1 temprana: jungla aún sellada');
const bad = clone(old); bad.zones.crypt.items.bell = -3;
ok(!Save.parse(JSON.stringify(bad)).ok, 'un v0.1 corrupto no se migra (se rechaza)');

section('Exportación, importación y validación');
const expd = Save.exportText(ms);
const imp = Save.parse(expd);
ok(imp.ok && imp.state.zones.crypt.items.staff === 40 && imp.state.zones.jungle.unlocked, 'exportar → importar restaura la partida v2');
ok(!Save.parse('{malo').ok && !Save.parse('[]').ok, 'rechaza JSON inválido y arrays');
const b2 = clone(ms); b2.zones.jungle.items.grimoire = 'x'; ok(!Save.parse(JSON.stringify(b2)).ok, 'rechaza niveles no numéricos');
const b3 = clone(ms); b3.version = 99; ok(!Save.parse(JSON.stringify(b3)).ok, 'rechaza versiones futuras');
const b4 = clone(ms); b4.zones.crypt.items.chalk = 30; ok(!Save.parse(JSON.stringify(b4)).ok, 'rechaza niveles por encima del tope');
const b5 = clone(ms); b5.order.pollen = 9; ok(!Save.parse(JSON.stringify(b5)).ok, 'rechaza mejoras imposibles');
const b6 = clone(ms); delete b6.zones.jungle; ok(!Save.parse(JSON.stringify(b6)).ok, 'un v2 sin jungla se rechaza');
ok(Save.write(ms) === false && Save.storageOk === false, 'sin localStorage, guardar falla sin romper la sesión');

section('Offline y reloj');
const o8 = Save.parse(JSON.stringify(Object.assign(clone(ms2), { lastTick: 5000 }))).state;
const r8 = Save.applyOffline(o8, 5000 + 10 * 3600 * 1000);
ok(r8.capped && near(r8.dt, 8 * 3600), 'offline limitado a 8 h');
const back = Save.parse(JSON.stringify(Object.assign(clone(ms2), { lastTick: 5000 }))).state;
ok(Save.applyOffline(back, 4000).zones.forest === 0, 'un reloj que retrocede no suma');

section('Prestigio con tres zonas y talentos');
st = S.newState(null, 0);
st.zones.forest.generated = C.prestige.goalTotal * 2;
ok(!S.canPrestige(st), 'sin explorar la cripta no se puede refundar');
open(st, 'crypt'); open(st, 'jungle');
st.zones.forest.generated = C.prestige.goalTotal * 0.5; st.zones.jungle.generated = C.prestige.goalTotal * 0.6; st.zones.crypt.generated = C.prestige.goalTotal * 0.2;
const cc = S.runContrib(st);
ok(near(cc.jungle, C.prestige.goalTotal * 0.6 * C.prestige.weights.jungle) && near(cc.total, C.prestige.goalTotal * (0.5 + 0.3 + 0.2)), 'la savia cuenta ×' + C.prestige.weights.jungle + ' en el total');
ok(S.canPrestige(st) && S.echoesFor(S.runTotal(st)) === 3, 'meta alcanzada sumando las tres zonas: 3 Ecos');
st.zones.forest.mana = 1e12; st.zones.forest.items.spell = 1;
const eb = S.echoesFor(S.runTotal(st)); S.buy(st, 'forest', 'spell', 'max');
ok(S.echoesFor(S.runTotal(st)) === eb, 'comprar objetos no reduce los Ecos previstos');
st.mastery.sparks = 3000;
const ns = S.prestige(st, 1).state;
ok(ns.prestige.echoes === 3 && !ns.zones.jungle.unlocked && !ns.zones.crypt.unlocked && ns.zones.forest.items.spell === 0 && ns.order.pollen === 0, 'refundar reinicia tres zonas y mejoras');
ok(ns.mastery.sparks === 3000 && ns.settings.view === 'forest', 'la maestría (cosmética) se conserva; la vista vuelve al bosque');
const tSky = clone(ns); ok(S.buyTalent(tSky, 'sky') && S.isRevealed(tSky, 'forest', 'constellation') && S.isRevealed(tSky, 'forest', 'orbit'), 'Cielo Recordado descubre los hechizos del bosque desde el inicio');
const sp0 = S.newState(null, 0); sp0.zones.forest.items.spell = 5; const sp1 = clone(sp0); sp1.prestige.talents.sky = 1;
ok(near(S.forestBreakdown(sp1).spell, S.forestBreakdown(sp0).spell * 1.5), 'Cielo Recordado: hechizos del bosque +50 %');
const tSeed = clone(ns); S.buyTalent(tSeed, 'seed');
tSeed.zones.forest.items.robe = 200; S.advance(tSeed, 0.01);
ok(tSeed.zones.jungle.unlocked && tSeed.zones.jungle.seq.bloom === 4, 'Semilla de la Fundadora: la jungla reabre con una raíz madura');
ok(S.manual(tSeed, 'jungle').bloom > 0, 'la primera marca ya produce una floración');
const tH = clone(ns); S.buyTalent(tH, 'heirloom');
ok(tH.prestige.echoes === 1 && S.buyTalent(tH, 'sky') === null, 'con 3 Ecos se elige un talento de 2 (Báculos heredados compite con Cielo Recordado y Semilla)');

section('Las 24 entradas se descubren y compran en juego normal (simulación)');
const B = require('../tools/balance');
const run = B.run({ minutes: 70, full: true });
const fb = B.firstBuys(run);
const missing = [];
ZONES.forEach(z => C.zones[z].itemOrder.forEach(id => { if (fb[z + '.' + id] === undefined) missing.push(z + '.' + id); }));
ok(missing.length === 0, 'todas las entradas compradas en 70 min de la estrategia simulada', missing);

section('Balance (estrategia simulada de tools/balance.js)');
const mk = run.marks;
ok(mk['primer báculo'] >= 10 && mk['primer báculo'] <= 20, 'primer báculo en 10–20 s', mk['primer báculo']);
ok(mk['primera evolución (Nv 10)'] >= 120 && mk['primera evolución (Nv 10)'] <= 300, 'primera evolución en 2–5 min', mk['primera evolución (Nv 10)']);
ok(mk['jungla descubierta'] > mk['primera evolución (Nv 10)'] && mk['jungla descubierta'] < mk['cripta abierta'], 'la jungla aparece entre la primera evolución y la cripta', [mk['jungla descubierta'], mk['cripta abierta']]);
ok(mk['cripta abierta'] >= 600 && mk['cripta abierta'] <= 1200, 'cripta en 10–20 min', mk['cripta abierta']);
ok(mk['refundar disponible'] >= 2100 && mk['refundar disponible'] <= 3600, 'primer prestigio en 35–60 min', mk['refundar disponible']);

console.log('\n' + pass + ' correctas, ' + fail + ' fallidas');
process.exit(fail ? 1 : 0);
