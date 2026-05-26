import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import path from 'node:path';

const clientRoot = process.cwd();
const serverRoot = path.resolve(clientRoot, '..', 'server');

const processes = [];

function startProcess(command, cwd, label) {
  const child = spawn(command, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (code === 0 || signal) return;
    console.error(`${label} exited with code ${code}`);
    shutdown(1);
  });

  processes.push(child);
  return child;
}

async function waitForHealth(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Keep polling until the backend is ready.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function shutdown(exitCode = 0) {
  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const backendHealthUrl = 'http://127.0.0.1:3001/api/health';

let backendStartedByWrapper = false;
try {
  await waitForHealth(backendHealthUrl, 1000);
} catch {
  backendStartedByWrapper = true;
  startProcess('npm run dev', serverRoot, 'server');
  await waitForHealth(backendHealthUrl);
}

startProcess('npm run dev -- --host 127.0.0.1 --port 5173', clientRoot, 'client');

process.stdin.resume();

if (!backendStartedByWrapper) {
  // Keep the wrapper alive while Playwright is using the already-running backend.
}