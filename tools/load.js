// Carga config.js y sim.js del juego en Node (mismo código que usa el navegador).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

module.exports = function load(extraFiles) {
  const ctx = { console, Math, JSON, Date, Object, Array, Number, isFinite, parseInt, parseFloat };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  const files = ['js/config.js', 'js/sim.js', 'js/save.js'].concat(extraFiles || []);
  for (const f of files) {
    const p = path.join(process.env.ARCANE_ROOT || path.join(__dirname, '..'), f); // ARCANE_ROOT: medir otra versión (p. ej. la v0.2)
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f });
  }
  return ctx.Arcane;
};
