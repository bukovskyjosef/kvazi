import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

// A CMD readiness probe uses PHP already present in the M4.5 image.
export const HEALTHCHECK_COMMAND = 'php /usr/local/bin/kvazi-healthcheck.php';

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}
function validId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(value);
}

export async function deployProduction({coolifyUrl, token, readToken, appUuid, expectedSha,
  fetchImpl = fetch, sleep = delay, now = Date.now, timeoutMs = 30 * 60_000,
  pollMs = 10_000, log = console.log}) {
  requireValue(typeof token === 'string' && token.trim() !== '' && !/[\r\n]/.test(token), 'Missing or invalid COOLIFY_TOKEN');
  requireValue(typeof readToken === 'string' && readToken.trim() !== '' && !/[\r\n]/.test(readToken), 'Missing or invalid COOLIFY_READ_TOKEN');
  requireValue(validId(appUuid), 'Missing or invalid COOLIFY_APP_UUID');
  requireValue(typeof expectedSha === 'string' && /^[a-f0-9]{40}$/.test(expectedSha), 'Invalid expected Git SHA');
  let origin;
  try { origin = new URL(coolifyUrl); } catch { throw new Error('Invalid COOLIFY_URL'); }
  requireValue(origin.protocol === 'https:' && !origin.username && !origin.password &&
    origin.pathname === '/' && !origin.search && !origin.hash, 'COOLIFY_URL must be a trusted HTTPS origin');
  const deadline = now() + timeoutMs;
  function remaining() {
    const time = deadline - now();
    requireValue(time > 0, 'Production release timed out');
    return time;
  }
  async function request(url, options = {}) {
    try {
      return await fetchImpl(url, {...options, redirect: 'error', signal: AbortSignal.timeout(Math.min(15_000, remaining()))});
    } catch {
      throw new Error('Production release HTTP request failed (details redacted)');
    }
  }
  async function json(response, context) {
    requireValue(response.status === 200, `${context}: HTTP ${response.status}`);
    requireValue(response.headers.get('content-type')?.includes('application/json'), `${context}: expected JSON`);
    try { return await response.json(); } catch { throw new Error(`${context}: invalid JSON`); }
  }
  async function api(path, body) {
    const response = await request(new URL(`/api/v1${path}`, origin), {
      method: body ? 'POST' : 'GET',
      headers: {Authorization: `Bearer ${body ? token : readToken}`, Accept: 'application/json', ...(body ? {'Content-Type': 'application/json'} : {})},
      ...(body ? {body: JSON.stringify(body)} : {}),
    });
    return json(response, 'Coolify API');
  }
  function checkApplication(app) {
    requireValue(app?.uuid === appUuid && app.id !== undefined, 'Coolify returned another application');
    requireValue(['https://github.com/bukovskyjosef/kvazi', 'https://github.com/bukovskyjosef/kvazi.git',
      'git@github.com:bukovskyjosef/kvazi.git', 'bukovskyjosef/kvazi'].includes(app.git_repository) &&
      app.git_branch === 'main', 'Coolify Git source must be bukovskyjosef/kvazi main');
    requireValue(app.git_commit_sha === expectedSha,
      'BLOCKER: Coolify source must pin the exact expected SHA; deploy API cannot pin it with read/deploy permissions');
    requireValue(app.build_pack === 'dockerfile' && app.base_directory === '/' &&
      ['docker/php/Dockerfile', '/docker/php/Dockerfile'].includes(app.dockerfile_location) &&
      String(app.ports_exposes) === '80' && !app.ports_mappings, 'Coolify application packaging contract mismatch');
    requireValue(app.settings?.is_auto_deploy_enabled === false, 'Coolify native Auto Deploy must be OFF');
    requireValue(app.health_check_enabled === true && app.health_check_type === 'cmd' &&
      app.health_check_command === HEALTHCHECK_COMMAND, 'Coolify must use the verified PHP /healthz CMD readiness probe');
    requireValue(!app.pre_deployment_command && !app.post_deployment_command,
      'Unexpected Coolify deployment command; bootstrap and upgrades must be explicit');
  }
  const app = await api(`/applications/${appUuid}`);
  checkApplication(app);
  const trigger = await api('/deploy', {uuid: appUuid, force: false});
  requireValue(Array.isArray(trigger?.deployments) && trigger.deployments.length === 1 &&
    trigger.deployments[0]?.resource_uuid === appUuid && validId(trigger.deployments[0].deployment_uuid),
    'Coolify did not return exactly one matching deployment UUID');
  const deploymentUuid = trigger.deployments[0].deployment_uuid;
  log(`Deployment UUID: ${deploymentUuid}`);
  for (;;) {
    remaining();
    const deployment = await api(`/deployments/${deploymentUuid}`);
    requireValue(deployment?.deployment_uuid === deploymentUuid && String(deployment.application_id) === String(app.id) &&
      deployment.pull_request_id === 0, 'Coolify deployment identity mismatch');
    requireValue(deployment.commit === expectedSha, 'Coolify deployment Git SHA mismatch');
    if (deployment.status === 'finished') break;
    requireValue(['queued', 'in_progress'].includes(deployment.status), 'Coolify deployment failed, cancelled or has an unsupported status');
    await sleep(Math.min(pollMs, remaining()));
  }
  const finishedApp = await api(`/applications/${appUuid}`);
  checkApplication(finishedApp);
  requireValue(finishedApp.status === 'running:healthy', 'Coolify application is not running:healthy');
  await verifyProduction({request, json});
  log(`Production release PASS: ${expectedSha} (${deploymentUuid})`);
  return {deploymentUuid, commit: expectedSha};
}

async function verifyProduction({request, json}) {
  const health = await json(await request('https://kvazi.cz/healthz'), 'Production healthz');
  requireValue(health?.status === 'ok' && Object.keys(health).length === 1, 'Production readiness failed');
  for (const path of ['/', '/vety.php']) {
    const response = await request(`https://kvazi.cz${path}`);
    requireValue(response.status === 200 && response.headers.get('content-type')?.includes('text/html'), `Production ${path}: expected HTML/200`);
    let body;
    try { body = await response.text(); } catch { throw new Error(`Production ${path}: unreadable response`); }
    requireValue(/<html[\s>]/i.test(body), `Production ${path}: invalid HTML`);
  }
  const response = await request('https://kvazi.cz/api/normative.php');
  const normative = await json(response, 'Production normative');
  requireValue(normative?.version === 'public-1.3' && response.headers.get('x-rules-version') === 'public-1.3',
    'Production active rules release mismatch');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await deployProduction({coolifyUrl: process.env.COOLIFY_URL, token: process.env.COOLIFY_TOKEN, readToken: process.env.COOLIFY_READ_TOKEN,
      appUuid: process.env.COOLIFY_APP_UUID, expectedSha: process.env.EXPECTED_SHA});
  } catch (error) {
    console.error(`Production release FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
