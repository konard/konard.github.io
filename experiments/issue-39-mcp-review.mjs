// Inspect the real settings page through the Playwright MCP stdio protocol.
// Set PLAYWRIGHT_MCP_CLI to an installed @playwright/mcp/cli.js (tested: 0.0.83).
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

if (!process.env.PLAYWRIGHT_MCP_CLI) throw new Error('Set PLAYWRIGHT_MCP_CLI to the installed MCP cli.js');
const directory = resolve(process.env.CAPTURE_DIR || 'browser-results/mcp-review');
await mkdir(directory, { recursive: true });
const server = await createServer({ server: { port: 4196, strictPort: true } });
await server.listen();
const child = spawn(
  process.execPath,
  [
    process.env.PLAYWRIGHT_MCP_CLI,
    '--isolated',
    '--headless',
    '--no-sandbox',
    '--executable-path',
    chromium.executablePath(),
    '--viewport-size',
    '1440,1050',
    '--output-dir',
    directory,
  ],
  { stdio: ['pipe', 'pipe', 'inherit'] },
);
const pending = new Map();
const evidence = [];
let nextId = 0;
createInterface({ input: child.stdout }).on('line', (line) => {
  const response = JSON.parse(line);
  if (!pending.has(response.id)) return;
  const { resolve, reject } = pending.get(response.id);
  pending.delete(response.id);
  if (response.error) reject(new Error(JSON.stringify(response.error)));
  else resolve(response.result);
});
child.on('exit', (code) => {
  for (const { reject } of pending.values()) reject(new Error(`MCP exited: ${code}`));
  pending.clear();
});
const request = (method, params) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
const call = async (name, args) => {
  const result = await request('tools/call', { name, arguments: args });
  evidence.push({ name, result });
  if (result.isError) throw new Error(JSON.stringify(result));
  return result;
};
try {
  await request('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'issue39-review', version: '1' },
  });
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  await call('browser_navigate', { url: 'http://localhost:4196/settings/?lang=en#interface' });
  await call('browser_evaluate', {
    function: `async () => {
    (await import('/src/settings/store.js')).setSettings({'skin.name':'futuristic','motion.mode':'off','sound.on':false});
    (await import('/src/i18n/prefs.js')).setTheme('dark');
    document.querySelector('#interface').scrollIntoView({block:'start'});
    await new Promise(requestAnimationFrame);
    const style=getComputedStyle(document.querySelector('.ui-preview__panel'));
    if(!style.backgroundPosition.startsWith('16px 0px') || style.backgroundOrigin.includes('padding-box')) throw new Error('Frame alignment regressed');
    return {positions:style.backgroundPosition, sizes:style.backgroundSize, origin:style.backgroundOrigin};
  }`,
  });
  await call('browser_take_screenshot', { type: 'png', filename: resolve(directory, 'mcp-default-frame.png') });
} finally {
  if (child.exitCode === null) await call('browser_close', {});
  await writeFile(resolve(directory, 'mcp-results.json'), JSON.stringify(evidence, null, 2) + '\n');
  child.stdin.end();
  await new Promise((resolve) => {
    if (child.exitCode !== null) resolve();
    else child.once('exit', resolve);
  });
  await server.close();
}
console.log('Playwright MCP: default frame inspected, screenshot saved, browser closed.');
