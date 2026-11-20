// Prueba en navegador real (Chrome o Edge en modo headless, ya instalados en el equipo).
// Uso: node tools/browser.js [carpeta-capturas] [--solo-test] [--solo-capturas] [--tiras | --solo-tiras] [--tira=zona-id|--tira=zona]
//   1) Abre index.html#autotest por file:// y lee el resultado de tests/autotest.js.
//   2) Guarda capturas de escenarios (index.html#escena=...) en la carpeta indicada.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
];
const browser = candidates.find(p => fs.existsSync(p));
if (!browser) { console.error('No se encontró Chrome ni Edge.'); process.exit(2); }

const root = path.resolve(__dirname, '..');
const url = h => 'file:///' + path.join(root, 'index.html').replace(/\\/g, '/') + h;
const args = process.argv.slice(2);
const outDir = path.resolve(args.find(a => !a.startsWith('--')) || path.join(os.tmpdir(), 'orden-capturas'));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'orden-perfil-'));
const base = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--user-data-dir=' + profile];

let failed = false;
if (!args.includes('--solo-capturas') && !args.includes('--solo-tiras')) {
  const dom = execFileSync(browser, base.concat(['--virtual-time-budget=20000', '--dump-dom', url('#autotest')]), { encoding: 'utf8', maxBuffer: 1 << 26 });
  const m = dom.match(/<pre id="autotest-results">([\s\S]*?)<\/pre>/);
  if (!m) { console.log('No se obtuvo resultado de la prueba en navegador.'); failed = true; }
  else {
    const txt = m[1].replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
    console.log('Prueba en navegador (' + path.basename(browser) + ', file://):\n' + txt);
    const nOk = (txt.match(/^✓/gm) || []).length, nBad = (txt.match(/^✗/gm) || []).length;
    console.log(`\n${nOk} correctas, ${nBad} fallidas`);
    if (nBad || !/TODO OK/.test(txt)) failed = true;
  }
}

const shot = (hash, w, h, out, budget) => {
  execFileSync(browser, base.concat([`--window-size=${w},${h}`, `--virtual-time-budget=${budget || 2500}`, '--screenshot=' + out, url(hash)]), { stdio: 'ignore' });
  console.log('captura: ' + out);
};
if (!args.includes('--solo-test') && !args.includes('--solo-tiras')) {
  fs.mkdirSync(outDir, { recursive: true });
  const scenes = ['bosque1', 'bosque10', 'bosque50', 'bosque150', 'jungla1', 'jungla10', 'jungla100', 'cripta1', 'cripta10', 'cripta100', 'sala1', 'sala50', 'sala250',
    'evo-forest-staff-10', 'evo-jungle-sickle-50', 'evo-crypt-chalk-24'];
  for (const name of scenes) shot('#escena=' + name, 1400, 900, path.join(outDir, name + '.png'), name.startsWith('evo-') ? 900 : 2500);
  // Vista estrecha real: dos marcos de 360 px (la ventana headless no baja de ~500 px)
  const movil = path.join(outDir, 'movil-360.png');
  execFileSync(browser, base.concat(['--window-size=760,900', '--virtual-time-budget=2500', '--screenshot=' + movil,
    'file:///' + path.join(root, 'tests', 'movil.html').split(path.sep).join('/')]), { stdio: 'ignore' });
  console.log('captura: ' + movil);
}
// Hojas de contacto de animación: filas = estados visuales, columnas = cuadros sucesivos
if (args.includes('--tiras') || args.includes('--solo-tiras')) {
  fs.mkdirSync(path.join(outDir, 'tiras'), { recursive: true });
  const only = (args.find(a => a.startsWith('--tira=')) || '').slice(7);
  const A = require('./load')(), C = A.CONFIG;
  for (const z of C.zoneOrder) for (const id of C.zones[z].itemOrder) {
    if (only && only !== z + '-' + id && only !== z) continue;
    shot('#tira=' + z + '-' + id, 2700, 1600, path.join(outDir, 'tiras', z + '-' + id + '.png'), 2000);
  }
}
try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* nada */ }
process.exit(failed ? 1 : 0);
