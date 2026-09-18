import test from 'node:test';
import assert from 'node:assert/strict';
import {productionSmoke} from '../tools/production-smoke.mjs';

const sha = 'a'.repeat(40);
const oldSha = 'b'.repeat(40);

function response(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status, headers: {'content-type': 'application/json', ...headers},
  });
}

function fixture({versionResponses, healthOk = true, homeOk = true, normativeVersion = 'public-1.3', overrides = {}} = {}) {
  let versionIndex = 0, logs = [], clock = 0;
  const options = {
    productionUrl: 'https://test.example',
    expectedSha: sha,
    expectedRulesVersion: 'public-1.3',
    maxWaitMs: 200, pollMs: 25, requestTimeoutMs: 5000,
    now: () => clock,
    sleep: async ms => { clock += ms; },
    log: msg => logs.push(msg),
    fetchImpl: async (url) => {
      url = new URL(url);
      if (url.pathname === '/api/version.php') {
        const responses = versionResponses || [{sha}];
        return response(responses[Math.min(versionIndex++, responses.length - 1)]);
      }
      if (url.pathname === '/healthz') {
        return response({status: healthOk ? 'ok' : 'unavailable'}, healthOk ? 200 : 503);
      }
      if (url.pathname === '/') {
        if (!homeOk) return new Response('down', {status: 503});
        return new Response('<html><body>OK</body></html>', {headers: {'content-type': 'text/html'}});
      }
      if (url.pathname === '/api/normative.php') {
        return response({version: normativeVersion});
      }
      assert.fail(`Unexpected: ${url.pathname}`);
    },
    ...overrides,
  };
  return {options, logs};
}

test('Success: expected SHA immediately live, full smoke passes', async () => {
  const f = fixture();
  const result = await productionSmoke(f.options);
  assert.equal(result.sha, sha);
  assert.equal(result.version, 'public-1.3');
  assert.ok(f.logs.some(l => l.includes('PASS')));
  assert.ok(f.logs.some(l => l.includes('Deployment confirmed')));
});

test('SHA transition: old SHA served first, then new SHA appears', async () => {
  const f = fixture({versionResponses: [{sha: oldSha}, {sha: oldSha}, {sha}]});
  const result = await productionSmoke(f.options);
  assert.equal(result.sha, sha);
  assert.ok(f.logs.some(l => l.includes('PASS')));
  assert.ok(f.logs.some(l => l.includes('waiting')));
});

test('Stale-healthy: old SHA never replaced — FAIL, not false PASS', async () => {
  const f = fixture({versionResponses: [{sha: oldSha}]});
  await assert.rejects(productionSmoke(f.options), /timeout.*not live/i);
  assert.ok(!f.logs.some(l => l.includes('PASS')));
});

test('Deployment confirmed but healthz fails — FAIL', async () => {
  const f = fixture({healthOk: false});
  await assert.rejects(productionSmoke(f.options), /healthz/i);
  assert.ok(!f.logs.some(l => l.includes('PASS')));
});

test('Deployment confirmed but homepage fails — FAIL', async () => {
  const f = fixture({homeOk: false});
  await assert.rejects(productionSmoke(f.options), /Homepage/);
  assert.ok(!f.logs.some(l => l.includes('PASS')));
});

test('Deployment confirmed but wrong rules version — FAIL', async () => {
  const f = fixture({normativeVersion: 'public-1.2'});
  await assert.rejects(productionSmoke(f.options), /version.*public-1\.2/);
  assert.ok(!f.logs.some(l => l.includes('PASS')));
});

test('Version endpoint network error during polling does not crash', async () => {
  let calls = 0;
  const f = fixture({
    overrides: {
      fetchImpl: async (url) => {
        url = new URL(url);
        if (url.pathname === '/api/version.php') {
          calls++;
          if (calls <= 2) throw new Error('network');
          return response({sha});
        }
        if (url.pathname === '/healthz') return response({status: 'ok'});
        if (url.pathname === '/') return new Response('<html>OK</html>', {headers: {'content-type': 'text/html'}});
        if (url.pathname === '/api/normative.php') return response({version: 'public-1.3'});
      },
    },
  });
  const result = await productionSmoke(f.options);
  assert.ok(f.logs.some(l => l.includes('PASS')));
  assert.ok(calls >= 3, 'retried after network errors');
});

test('Without expectedSha, smoke skips SHA polling and verifies directly', async () => {
  const f = fixture();
  f.options.expectedSha = undefined;
  const result = await productionSmoke(f.options);
  assert.equal(result.sha, undefined);
  assert.equal(result.version, 'public-1.3');
  assert.ok(f.logs.some(l => l.includes('PASS')));
  assert.ok(!f.logs.some(l => l.includes('Deployment confirmed')));
});

test('Timeout with no version response at all — FAIL', async () => {
  const f = fixture({
    overrides: {
      fetchImpl: async (url) => {
        url = new URL(url);
        if (url.pathname === '/api/version.php') throw new Error('network');
        assert.fail('Should not reach smoke endpoints');
      },
    },
  });
  await assert.rejects(productionSmoke(f.options), /timeout/i);
  assert.ok(!f.logs.some(l => l.includes('PASS')));
});
