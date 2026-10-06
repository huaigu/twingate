import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(web, 'package.json'));
const publicDirectory = path.join(web, 'public/v4');
const output = path.join(publicDirectory, 'ui.css');
const mode = process.argv[2] || '--build';
if (!['--build', '--check', '--watch', '--dev'].includes(mode) || process.argv.length > 3) {
  throw new Error('Usage: node scripts/build-ui.mjs [--check|--watch|--dev]');
}

// Keep daisyUI's native layers: order alone cannot replace their priority
// because selected and disabled selectors can have different specificity.
const primitives = ['btn', 'input', 'textarea', 'select', 'checkbox', 'radio', 'tab', 'toggle'];

function validateComponents(css) {
  const root = postcss.parse(css);
  const requiredOrder = ['legacy', 'theme', 'base', 'components', 'utilities'];
  const order = [];
  root.walkAtRules('layer', (layer) => {
    for (let parent = layer.parent; parent; parent = parent.parent) {
      if (parent.type === 'atrule' && parent.name === 'layer') return;
    }
    for (const name of layer.params.split(',').map((name) => name.trim().split('.')[0])) {
      if (requiredOrder.includes(name) && !order.includes(name)) order.push(name);
    }
  });
  // Tailwind may declare its independent `properties` layer before this order.
  if (order.join(',') !== requiredOrder.join(',')) {
    throw new Error('The generated CSS must declare legacy before Tailwind and daisyUI layers.');
  }
  let nativeLayers = 0;
  root.walkAtRules('layer', (layer) => {
    if (layer.params.startsWith('daisyui')) nativeLayers++;
  });
  if (!nativeLayers) throw new Error('No native daisyUI component layers were generated.');
  for (const name of primitives) {
    let present = false;
    const selector = new RegExp(`\\.${name}(?![\\w-])`);
    root.walkRules((rule) => { if (selector.test(rule.selector)) present = true; });
    if (!present) throw new Error(`Missing generated daisyUI primitive: ${name}`);
  }
  let scopedTheme = false;
  root.walkRules((rule) => {
    if (rule.selector === '.outline') throw new Error('Legacy .outline must remain excluded from Tailwind utilities.');
    if (/\[data-theme=["']?signalpass["']?\]/.test(rule.selector)) scopedTheme = true;
  });
  if (!scopedTheme) throw new Error('Missing SignalPass theme selector required by the shadow widget.');
  return '/* Generated from apps/web/ui.css; run pnpm ui:build. Do not edit. */\n' + css.trim() + '\n';
}

let compiler;
let next;
let stopping = false;
const watchers = [];
let timer;

async function cliEntry() {
  const manifestPath = require.resolve('@tailwindcss/cli/package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  return path.resolve(path.dirname(manifestPath), manifest.bin.tailwindcss);
}

async function compile() {
  const temporary = await mkdtemp(path.join(tmpdir(), 'signalpass-ui-'));
  try {
    const intermediate = path.join(temporary, 'tailwind.css');
    const entry = await cliEntry();
    await new Promise((resolve, reject) => {
      compiler = spawn(process.execPath, [entry, '-i', path.join(web, 'ui.css'), '-o', intermediate], {
        cwd: web, stdio: ['ignore', 'inherit', 'inherit'],
      });
      compiler.once('error', reject);
      compiler.once('exit', (code, signal) => {
        compiler = undefined;
        if (code === 0) resolve();
        else reject(new Error(`Tailwind compilation failed (${signal || code}).`));
      });
    });
    const compiled = validateComponents(await readFile(intermediate, 'utf8'));
    if (mode === '--check') {
      let committed;
      try { committed = await readFile(output, 'utf8'); } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (committed !== compiled) throw new Error('public/v4/ui.css is missing or stale. Run pnpm ui:build and include the generated file.');
      console.log('UI CSS is reproducible and current.');
    } else if (!stopping) {
      await mkdir(publicDirectory, { recursive: true });
      // Readers keep the previous complete sheet until this atomic replacement.
      const staged = output + `.${process.pid}.tmp`;
      await writeFile(staged, compiled);
      await rename(staged, output);
      console.log('Built public/v4/ui.css from Tailwind + daisyUI.');
    }
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  clearTimeout(timer);
  for (const watcher of watchers) watcher.close();
  compiler?.kill('SIGTERM');
  next?.kill('SIGTERM');
  const deadline = setTimeout(() => {
    compiler?.kill('SIGKILL');
    next?.kill('SIGKILL');
  }, 5000);
  deadline.unref();
}

async function main() {
  await compile();
  if (stopping || (mode !== '--watch' && mode !== '--dev')) return;
  let requested = false;
  let running = false;
  async function rebuild() {
    requested = true;
    if (running || stopping) return;
    running = true;
    while (requested && !stopping) {
      requested = false;
      try { await compile(); } catch (error) { if (!stopping) console.error(error.message); }
    }
    running = false;
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 120);
  }
  // Watch directories so editors which atomically replace files remain supported.
  watchers.push(watch(web, (_event, name) => { if (name === 'ui.css') schedule(); }));
  watchers.push(watch(publicDirectory, { recursive: true }, (_event, name) => {
    if (typeof name === 'string' && /\.(?:html|js)$/.test(name)) schedule();
  }));
  for (const watcher of watchers) watcher.on('error', (error) => { console.error(error.message); stop(1); });
  if (mode === '--dev') {
    next = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '-p', '3004'], {
      cwd: web, stdio: 'inherit',
    });
    next.once('error', (error) => { console.error(error.message); stop(1); });
    next.once('exit', (code) => { next = undefined; stop(code || 0); });
  }
}

process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
main().catch((error) => { if (!stopping) { console.error(error.message); stop(1); } });
