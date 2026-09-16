import test from 'node:test';
import assert from 'node:assert/strict';
import {deployProduction, HEALTHCHECK_COMMAND} from '../tools/deploy-production.mjs';

const sha = 'a'.repeat(40);
const appUuid = 'app_uuid_12345678';
const deploymentUuid = 'deploy_uuid_12345678';
const token = 'test-only-secret';
const readToken = 'test-only-read-secret';
const application = {
  id: 17, uuid: appUuid, git_repository: 'https://github.com/bukovskyjosef/kvazi',
  git_branch: 'main', git_commit_sha: sha, build_pack: 'dockerfile', base_directory: '/',
  dockerfile_location: '/docker/php/Dockerfile', ports_exposes: '80', ports_mappings: null,
  settings: {is_auto_deploy_enabled: false}, health_check_enabled: true,
  health_check_type: 'cmd', health_check_command: HEALTHCHECK_COMMAND, status: 'running:healthy',
};
const deployment = {deployment_uuid: deploymentUuid, application_id: '17', pull_request_id: 0, commit: sha, status: 'finished'};
function response(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {status, headers: {'content-type': 'application/json', ...headers}});
}
function fixture({app = application, triggered = {deployments: [{resource_uuid: appUuid, deployment_uuid: deploymentUuid}]},
  states = [deployment], override, afterApp = app} = {}) {
  const requests = [], logs = [];
  let appReads = 0, stateReads = 0, clock = 0;
  const options = {
    coolifyUrl: 'https://coolify.example.test', token, readToken, appUuid, expectedSha: sha,
    now: () => clock, sleep: async ms => { clock += ms; }, timeoutMs: 100, pollMs: 25,
    log: message => logs.push(message),
    fetchImpl: async (url, init) => {
      url = new URL(url);
      requests.push({url, init});
      const result = await override?.(url, init);
      if (result) return result;
      if (url.origin === 'https://coolify.example.test') {
        assert.equal(init.headers.Authorization, `Bearer ${url.pathname === '/api/v1/deploy' ? token : readToken}`);
        if (url.pathname === `/api/v1/applications/${appUuid}`) return response(appReads++ ? afterApp : app);
        if (url.pathname === '/api/v1/deploy') return response(triggered);
        if (url.pathname === `/api/v1/deployments/${deploymentUuid}`) return response(states[Math.min(stateReads++, states.length - 1)]);
      } else {
        assert.equal(url.origin, 'https://kvazi.cz');
        assert.equal(init.headers, undefined, 'No credentials sent to public endpoints');
        assert.equal(init.method, undefined, 'Production smoke is GET only');
        if (url.pathname === '/healthz') return response({status: 'ok'});
        if (url.pathname === '/api/normative.php') return response({version: 'public-1.3'}, 200, {'x-rules-version': 'public-1.3'});
        if (['/', '/vety.php'].includes(url.pathname)) return new Response('<html><body>OK</body></html>', {headers: {'content-type': 'text/html'}});
      }
      assert.fail(`Unexpected request ${url.pathname}`);
    },
  };
  return {options, requests, logs};
}

test('Exact deployment UUID is polled to finished, healthy and read-only production endpoints', async () => {
  const f = fixture({states: [{...deployment, status: 'queued'}, {...deployment, status: 'in_progress'}, deployment]});
  assert.deepEqual(await deployProduction(f.options), {deploymentUuid, commit: sha});
  const trigger = f.requests.find(r => r.url.pathname === '/api/v1/deploy');
  assert.equal(trigger.init.method, 'POST');
  assert.deepEqual(JSON.parse(trigger.init.body), {uuid: appUuid, force: false});
  assert.equal(f.requests.filter(r => r.url.pathname === `/api/v1/deployments/${deploymentUuid}`).length, 3);
  assert.deepEqual(f.requests.filter(r => r.url.host === 'kvazi.cz').map(r => r.url.pathname), ['/healthz', '/', '/vety.php', '/api/normative.php']);
  assert.ok(f.requests.every(r => r.init.redirect === 'error' && r.init.signal instanceof AbortSignal));
  assert.ok(f.logs.some(line => line.includes('Production release PASS')));
  assert.ok(f.logs.every(line => !line.includes(token) && !line.includes(readToken)));
});

for (const [name, changes] of Object.entries({
  'unpinned HEAD': {git_commit_sha: 'HEAD'}, 'another SHA': {git_commit_sha: 'b'.repeat(40)},
  'another source': {git_repository: 'https://github.com/other/repo'}, 'another branch': {git_branch: 'develop'},
  'native Auto Deploy': {settings: {is_auto_deploy_enabled: true}}, 'missing Auto Deploy setting': {settings: {}},
  'wrong build context': {base_directory: '/app'}, 'wrong Dockerfile': {dockerfile_location: '/Dockerfile'},
  'public direct port': {ports_mappings: '8080:80'}, 'disabled healthcheck': {health_check_enabled: false},
  'no-op readiness': {health_check_command: 'true'}, 'deployment migration hook': {pre_deployment_command: 'psql init.sql'},
})) {
  test(`Reject ${name} before any deploy request`, async () => {
    const f = fixture({app: {...application, ...changes}});
    await assert.rejects(deployProduction(f.options));
    assert.equal(f.requests.length, 1);
    assert.equal(f.logs.length, 0);
  });
}

for (const triggered of [ {}, {deployments: []}, {deployments: [{resource_uuid: 'other_app_12345678', deployment_uuid: deploymentUuid}]},
  {deployments: [{resource_uuid: appUuid}]}, {deployments: [{resource_uuid: appUuid, deployment_uuid: '../bad'}]},
  {deployments: [{resource_uuid: appUuid, deployment_uuid: deploymentUuid}, {resource_uuid: appUuid, deployment_uuid: deploymentUuid}]} ]) {
  test(`Accepted trigger is not success: ${JSON.stringify(triggered)}`, async () => {
    const f = fixture({triggered});
    await assert.rejects(deployProduction(f.options), /deployment UUID/);
    assert.equal(f.requests.length, 2);
    assert.equal(f.logs.length, 0);
  });
}

for (const [name, change] of Object.entries({
  'build failure': {status: 'failed'}, 'cancelled': {status: 'cancelled-by-user'}, 'unknown status': {status: 'success'},
  'wrong commit': {commit: 'b'.repeat(40)}, 'missing commit': {commit: undefined},
  'wrong UUID': {deployment_uuid: 'another_deploy_12345678'}, 'wrong application': {application_id: '18'}, 'preview': {pull_request_id: 1},
})) {
  test(`Deployment ${name} fails without production smoke`, async () => {
    const f = fixture({states: [{...deployment, ...change}]});
    await assert.rejects(deployProduction(f.options));
    assert.equal(f.requests.filter(r => r.url.host === 'kvazi.cz').length, 0);
    assert.ok(!f.logs.some(line => line.includes('PASS')));
  });
}

test('Queued deployment reaches deadline and fails', async () => {
  const f = fixture({states: [{...deployment, status: 'queued'}]});
  await assert.rejects(deployProduction(f.options), /timed out/);
  assert.ok(!f.logs.some(line => line.includes('PASS')));
});

for (const [name, afterApp] of Object.entries({unhealthy: {...application, status: 'running:unhealthy'}, drift: {...application, git_commit_sha: 'b'.repeat(40)}})) {
  test(`Finished deployment with ${name} fails`, async () => {
    const f = fixture({afterApp});
    await assert.rejects(deployProduction(f.options));
    assert.equal(f.requests.filter(r => r.url.host === 'kvazi.cz').length, 0);
  });
}

for (const [name, path, result] of [
  ['unhealthy DB', '/healthz', () => response({status: 'unavailable'}, 503)],
  ['wrong health JSON', '/healthz', () => response({status: 'unavailable'})],
  ['health extra data', '/healthz', () => response({status: 'ok', internal: 'bad'})],
  ['failed homepage', '/', () => new Response('unavailable', {status: 503})],
  ['login redirect', '/vety.php', () => new Response('', {status: 302, headers: {location: '/login.php'}})],
  ['invalid HTML', '/vety.php', () => new Response('oops', {headers: {'content-type': 'text/html'}})],
  ['old rules', '/api/normative.php', () => response({version: 'public-1.2'}, 200, {'x-rules-version': 'public-1.2'})],
  ['missing rules header', '/api/normative.php', () => response({version: 'public-1.3'})],
  ['malformed JSON', '/api/normative.php', () => new Response('{', {headers: {'content-type': 'application/json'}})],
]) {
  test(`Production smoke ${name} fails the release`, async () => {
    const f = fixture({override: url => url.host === 'kvazi.cz' && url.pathname === path ? result() : undefined});
    await assert.rejects(deployProduction(f.options));
    assert.ok(!f.logs.some(line => line.includes('PASS')));
  });
}

test('API errors and network exceptions never expose token or raw response/logs', async () => {
  for (const override of [() => response({logs: token, password: readToken}, 401), () => { throw new Error(token + readToken); }]) {
    const f = fixture({override});
    await assert.rejects(deployProduction(f.options), error => !error.message.includes(token) && !error.message.includes(readToken));
    assert.equal(f.requests.length, 1);
  }
});

test('Unsafe credential destinations and malformed configuration make no HTTP request', async () => {
  for (const changes of [{coolifyUrl: 'http://coolify.example.test'}, {coolifyUrl: 'https://user:pass@coolify.example.test'},
    {coolifyUrl: 'https://coolify.example.test/api/v1'}, {coolifyUrl: 'https://coolify.example.test/?token=bad'},
    {token: ''}, {token: 'bad\nheader'}, {readToken: ''}, {readToken: 'bad\nheader'}, {expectedSha: 'HEAD'}, {appUuid: '../another'}]) {
    const f = fixture();
    await assert.rejects(deployProduction({...f.options, ...changes}));
    assert.equal(f.requests.length, 0);
  }
});
