// Lightweight read-only production smoke. No API tokens, no deployment trigger.
// Polls /healthz for readiness, then verifies public endpoints.
// Used by production-smoke.yml after Coolify Auto Deploy and for manual verification.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export async function productionSmoke({
  productionUrl = 'https://kvazi.cz',
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

  log('Waiting for production readiness...');
  let healthy = false;
  while (remaining() > 0) {
    try {
      const r = await fetchImpl(`${productionUrl}/healthz`, {
        signal: AbortSignal.timeout(Math.min(requestTimeoutMs, remaining())),
        redirect: 'error',
      });
      if (r.status === 200) {
        const body = await r.json();
        if (body?.status === 'ok' && Object.keys(body).length === 1) {
          healthy = true;
          break;
        }
      }
    } catch {}
    if (remaining() <= pollMs) break;
    await sleep(Math.min(pollMs, remaining()));
  }
  if (!healthy) throw new Error('Production readiness timeout: /healthz not OK');
  log('Healthz: OK');

  // Homepage
  const home = await fetchImpl(`${productionUrl}/`, {
    signal: AbortSignal.timeout(requestTimeoutMs), redirect: 'manual',
  });
  if (home.status !== 200) throw new Error(`Homepage: HTTP ${home.status}`);
  const ct = home.headers.get('content-type') || '';
  if (!ct.includes('text/html')) throw new Error(`Homepage: expected text/html, got ${ct}`);
  const html = await home.text();
  if (!/<html[\s>]/i.test(html)) throw new Error('Homepage: invalid HTML');
  log('Homepage: OK');

  // Normative API
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
  return {version: nd.version};
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
      expectedRulesVersion: expectedVersion,
    });
  } catch (error) {
    console.error(`Production smoke FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
