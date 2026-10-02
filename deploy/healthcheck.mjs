// Read-only readiness: no sign-in, provider inference, wallet or chain actions.
const mode = process.argv[2];
if (mode !== 'api' && mode !== 'web') process.exit(1);
const base = mode === 'api' ? 'http://127.0.0.1:8789' : 'http://127.0.0.1:3000';
try {
  const response = await fetch(base + (mode === 'api' ? '/ready' : '/api/ready'), {
    signal: AbortSignal.timeout(3000), redirect: 'error',
  });
  if (!response.ok) throw new Error('unready');
  const result = await response.json();
  if (result.ok !== true || result.service !== '@signalpass/api' || result.checks?.database !== 'ok') throw new Error('unready');
  if (mode === 'web') {
    const page = await fetch(base + '/assistant?demo=0', { signal: AbortSignal.timeout(3000), redirect: 'error' });
    if (!page.ok || !(await page.text()).includes('id="agent-goal"')) throw new Error('unready');
  }
} catch {
  // Provider content, environment values and private data never enter health logs.
  process.exitCode = 1;
}
