// Production verification: wait for the exact deployment, then read-only smoke.
// Phase 1: poll /api/version.php until the expected SHA is live (prevents stale-healthy PASS).
// Phase 2: verify /healthz readiness.
// Phase 3: read-only smoke (homepage, normative API).
// No API tokens, no deployment trigger, no deployment controller.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export async function productionSmoke({
  productionUrl = 'https://kvazi.cz',
  expectedSha,
  expectedRulesVersion,
  maxWaitMs = 10 * 60_000,
  pollMs = 15_000,
  requestTimeoutMs = 15_000,
  fetchImpl = fetch,
  log = console.log,
  now = Date.now,
  sleep = ms => new Promise(r => setTimeout(r, ms)),
} = {}) {
  const deadline = now() + maxWaitMs;
  function remaining() { return Math.max(0, deadline - now()); }
  function requireTime() { if (remaining() <= 0) throw new Error('Production verification timed out'); }

  // Phase 1: wait for the exact deployment SHA
  if (expectedSha) {
    log(`Waiting for deployment ${expectedSha.slice(0, 12)}...`);
    let matched = false;
    while (remaining() > 0) {
      try {
        const r = await fetchImpl(`${productionUrl}/api/version.php`, {
          signal: AbortSignal.timeout(Math.min(requestTimeoutMs, remaining())),
          redirect: 'error',
        });
        if (r.status === 200) {
          const body = await r.json();
          if (body?.sha === expectedSha) { matched = true; break; }
          log(`Current: ${String(body?.sha ?? 'unknown').slice(0, 12)} — waiting...`);
        }
      } catch {}
      if (remaining() <= pollMs) break;
      await sleep(Math.min(pollMs, remaining()));
    }
    if (!matched) throw new Error(`Deployment timeout: expected ${expectedSha.slice(0, 12)} not live`);
    log(`Deployment confirmed: ${expectedSha.slice(0, 12)}`);
  }

  // Phase 2: verify readiness
  requireTime();
  let healthy = false;
  while (remaining() > 0) {
    try {
      const r = await fetchImpl(`${productionUrl}/healthz`, {
        signal: AbortSignal.timeout(Math.min(requestTimeoutMs, remaining())),
        redirect: 'error',
      });
      if (r.status === 200) {
        const body = await r.json();
        if (body?.status === 'ok' && Object.keys(body).length === 1) { healthy = true; break; }
      }
    } catch {}
    if (remaining() <= pollMs) break;
    await sleep(Math.min(pollMs, remaining()));
  }
  if (!healthy) throw new Error('Readiness timeout: /healthz not OK');
  log('Healthz: OK');

  // Phase 3: read-only smoke
  const home = await fetchImpl(`${productionUrl}/`, {
    signal: AbortSignal.timeout(requestTimeoutMs), redirect: 'manual',
  });
  if (home.status !== 200) throw new Error(`Homepage: HTTP ${home.status}`);
  if (!(home.headers.get('content-type') || '').includes('text/html')) throw new Error('Homepage: expected text/html');
  const html = await home.text();
  if (!/<html[\s>]/i.test(html)) throw new Error('Homepage: invalid HTML');
  log('Homepage: OK');

  const normative = await fetchImpl(`${productionUrl}/api/normative.php`, {
    signal: AbortSignal.timeout(requestTimeoutMs), redirect: 'error',
  });
  if (normative.status !== 200) throw new Error(`Normative API: HTTP ${normative.status}`);
  const nd = await normative.json();
  if (typeof nd?.version !== 'string') throw new Error('Normative API: missing version');
  if (expectedRulesVersion && nd.version !== expectedRulesVersion) {
    throw new Error(`Normative API: version ${nd.version}, expected ${expectedRulesVersion}`);
  }
  log(`Normative API: OK (${nd.version})`);

  log('Production smoke PASS');
  return {sha: expectedSha, version: nd.version};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    let expectedVersion = process.env.EXPECTED_RULES_VERSION;
    if (!expectedVersion) {
      try {
        expectedVersion = JSON.parse(readFileSync('app/data/active-release.json', 'utf8')).version;
      } catch {}
    }
    await productionSmoke({
      productionUrl: process.env.PRODUCTION_URL || 'https://kvazi.cz',
      expectedSha: process.env.EXPECTED_SHA,
      expectedRulesVersion: expectedVersion,
    });
  } catch (error) {
    console.error(`Production smoke FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
