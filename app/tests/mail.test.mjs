import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const mailPhp = new URL('../public/includes/mail.php', import.meta.url).pathname;

/** Run a PHP snippet that requires mail.php with controlled env vars (sync). */
function runMail(env, phpCode) {
  const mergedEnv = { ...process.env, ...env };
  for (const k of Object.keys(mergedEnv)) {
    if (mergedEnv[k] === undefined) delete mergedEnv[k];
  }
  return execFileSync('php', ['-r', `require '${mailPhp}'; ${phpCode}`], {
    encoding: 'utf8',
    stdio: 'pipe',
    env: mergedEnv,
  });
}

/** Run a PHP snippet async (does not block the Node event loop). */
function runMailAsync(env, phpCode) {
  const mergedEnv = { ...process.env, ...env };
  for (const k of Object.keys(mergedEnv)) {
    if (mergedEnv[k] === undefined) delete mergedEnv[k];
  }
  return execFileAsync('php', ['-r', `require '${mailPhp}'; ${phpCode}`], {
    encoding: 'utf8',
    env: mergedEnv,
    timeout: 15000,
  });
}

// ---------- outbox transport ----------

test('outbox: writes JSONL record with correct fields', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kvazi-mail-'));
  const outbox = join(dir, 'outbox.jsonl');
  try {
    runMail({
      MAIL_TRANSPORT: 'outbox',
      MAIL_FROM_ADDRESS: 'noreply@kvazi.cz',
      MAIL_FROM_NAME: 'Kvazi',
      MAIL_OUTBOX_PATH: outbox,
      APP_ENV: 'development',
    }, `kvazi_mail_send('user@example.com', 'Test subject', 'Hello body');`);

    const lines = readFileSync(outbox, 'utf8').trim().split('\n');
    assert.equal(lines.length, 1);
    const record = JSON.parse(lines[0]);
    assert.equal(record.to, 'user@example.com');
    assert.equal(record.subject, 'Test subject');
    assert.equal(record.body, 'Hello body');
    assert.match(record.from, /Kvazi/);
    assert.match(record.from, /noreply@kvazi\.cz/);
    assert.ok(record.timestamp);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('outbox: appends multiple records', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kvazi-mail-'));
  const outbox = join(dir, 'outbox.jsonl');
  try {
    const env = {
      MAIL_TRANSPORT: 'outbox',
      MAIL_FROM_ADDRESS: 'noreply@kvazi.cz',
      MAIL_FROM_NAME: '',
      MAIL_OUTBOX_PATH: outbox,
      APP_ENV: 'development',
    };
    runMail(env, `kvazi_mail_send('a@b.cz', 'First', 'Body 1');`);
    runMail(env, `kvazi_mail_send('c@d.cz', 'Second', 'Body 2');`);

    const lines = readFileSync(outbox, 'utf8').trim().split('\n');
    assert.equal(lines.length, 2);
    assert.equal(JSON.parse(lines[0]).subject, 'First');
    assert.equal(JSON.parse(lines[1]).subject, 'Second');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('outbox: from without name uses bare address', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kvazi-mail-'));
  const outbox = join(dir, 'outbox.jsonl');
  try {
    runMail({
      MAIL_TRANSPORT: 'outbox',
      MAIL_FROM_ADDRESS: 'noreply@kvazi.cz',
      MAIL_FROM_NAME: '',
      MAIL_OUTBOX_PATH: outbox,
      APP_ENV: 'development',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`);

    const record = JSON.parse(readFileSync(outbox, 'utf8').trim());
    assert.equal(record.from, 'noreply@kvazi.cz');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------- header injection ----------

test('header injection: rejects CR in recipient', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'outbox',
      MAIL_FROM_ADDRESS: 'a@b.cz',
      MAIL_OUTBOX_PATH: '/dev/null',
      APP_ENV: 'development',
    }, `kvazi_mail_send("evil\\r@x.cz", 'S', 'B');`),
    err => /Header injection rejected in recipient/.test(err.stderr)
  );
});

test('header injection: rejects LF in subject', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'outbox',
      MAIL_FROM_ADDRESS: 'a@b.cz',
      MAIL_OUTBOX_PATH: '/dev/null',
      APP_ENV: 'development',
    }, `kvazi_mail_send('u@x.cz', "Sub\\nBcc: hack@x.cz", 'B');`),
    err => /Header injection rejected in subject/.test(err.stderr)
  );
});

test('header injection: rejects CRLF in from address', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'outbox',
      MAIL_FROM_ADDRESS: "bad\r\n@x.cz",
      MAIL_OUTBOX_PATH: '/dev/null',
      APP_ENV: 'development',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
    err => /Header injection rejected in from address/.test(err.stderr)
  );
});

// ---------- missing config ----------

test('missing MAIL_TRANSPORT throws', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: '',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
    err => /MAIL_TRANSPORT is not configured/.test(err.stderr)
  );
});

test('unknown MAIL_TRANSPORT throws', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'pigeon',
      MAIL_FROM_ADDRESS: 'a@b.cz',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
    err => /Unknown MAIL_TRANSPORT/.test(err.stderr)
  );
});

test('missing MAIL_FROM_ADDRESS throws', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'outbox',
      MAIL_FROM_ADDRESS: '',
      MAIL_OUTBOX_PATH: '/dev/null',
      APP_ENV: 'development',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
    err => /MAIL_FROM_ADDRESS is not configured/.test(err.stderr)
  );
});

test('missing MAIL_OUTBOX_PATH throws', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'outbox',
      MAIL_FROM_ADDRESS: 'a@b.cz',
      MAIL_OUTBOX_PATH: '',
      APP_ENV: 'development',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
    err => /MAIL_OUTBOX_PATH is not configured/.test(err.stderr)
  );
});

// ---------- production safety ----------

test('outbox transport forbidden in production', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'outbox',
      MAIL_FROM_ADDRESS: 'a@b.cz',
      MAIL_OUTBOX_PATH: '/tmp/test.jsonl',
      APP_ENV: 'production',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
    err => /Outbox transport is forbidden in production/.test(err.stderr)
  );
});

test('plaintext SMTP forbidden in production', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'smtp',
      MAIL_FROM_ADDRESS: 'a@b.cz',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: '25',
      SMTP_TLS_MODE: 'none',
      SMTP_USERNAME: 'user',
      SMTP_PASSWORD: 'pass',
      APP_ENV: 'production',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
    err => /Plaintext SMTP is forbidden in production/.test(err.stderr)
  );
});

// ---------- SMTP missing config ----------

test('SMTP missing host/port throws', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'smtp',
      MAIL_FROM_ADDRESS: 'a@b.cz',
      SMTP_HOST: '',
      SMTP_PORT: '',
      SMTP_USERNAME: 'user',
      SMTP_PASSWORD: 'pass',
      APP_ENV: 'development',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
    err => /SMTP_HOST and SMTP_PORT must be configured/.test(err.stderr)
  );
});

test('SMTP missing credentials throws', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'smtp',
      MAIL_FROM_ADDRESS: 'a@b.cz',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: '587',
      SMTP_USERNAME: '',
      SMTP_PASSWORD: '',
      APP_ENV: 'development',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
    err => /SMTP_USERNAME and SMTP_PASSWORD must be configured/.test(err.stderr)
  );
});

// ---------- fake SMTP dialogue ----------

test('SMTP: successful dialogue with fake server (TLS_MODE=none)', async () => {
  const dialogue = [];
  const server = createServer(socket => {
    socket.write('220 fake.local SMTP\r\n');
    let buffer = '';
    let inData = false;
    socket.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split('\r\n');
      buffer = lines.pop(); // keep incomplete
      for (const line of lines) {
        dialogue.push(line);
        if (inData) {
          if (line === '.') {
            inData = false;
            socket.write('250 OK message queued\r\n');
          }
          continue;
        }
        if (line.startsWith('EHLO')) {
          socket.write('250-fake.local\r\n250 AUTH LOGIN\r\n');
        } else if (line === 'AUTH LOGIN') {
          socket.write('334 VXNlcm5hbWU6\r\n');
        } else if (line === Buffer.from('testuser').toString('base64')) {
          socket.write('334 UGFzc3dvcmQ6\r\n');
        } else if (line === Buffer.from('testpass').toString('base64')) {
          socket.write('235 Authentication successful\r\n');
        } else if (line.startsWith('MAIL FROM:')) {
          socket.write('250 OK\r\n');
        } else if (line.startsWith('RCPT TO:')) {
          socket.write('250 OK\r\n');
        } else if (line === 'DATA') {
          inData = true;
          socket.write('354 Start mail input\r\n');
        } else if (line === 'QUIT') {
          socket.write('221 Bye\r\n');
          socket.end();
        }
      }
    });
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;

  try {
    await runMailAsync({
      MAIL_TRANSPORT: 'smtp',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(port),
      SMTP_TLS_MODE: 'none',
      SMTP_USERNAME: 'testuser',
      SMTP_PASSWORD: 'testpass',
      MAIL_FROM_ADDRESS: 'noreply@kvazi.cz',
      MAIL_FROM_NAME: 'Kvazi Soutěž',
      APP_ENV: 'development',
    }, `kvazi_mail_send('recipient@example.com', 'Test Email', 'Hello from kvazi!');`);

    // Verify the dialogue had essential SMTP commands
    assert.ok(dialogue.some(l => l.startsWith('EHLO')), 'EHLO sent');
    assert.ok(dialogue.some(l => l === 'AUTH LOGIN'), 'AUTH LOGIN sent');
    assert.ok(dialogue.some(l => l.startsWith('MAIL FROM:<noreply@kvazi.cz>')), 'MAIL FROM sent');
    assert.ok(dialogue.some(l => l.startsWith('RCPT TO:<recipient@example.com>')), 'RCPT TO sent');
    assert.ok(dialogue.some(l => l === 'DATA'), 'DATA sent');
    assert.ok(dialogue.some(l => l === 'QUIT'), 'QUIT sent');
    // Verify headers were in data stream
    assert.ok(dialogue.some(l => /^From:.*Kvazi/.test(l)), 'From header present');
    assert.ok(dialogue.some(l => /^Subject: Test Email/.test(l)), 'Subject header present');
    assert.ok(dialogue.some(l => l === 'Hello from kvazi!'), 'Body present');
  } finally {
    server.close();
  }
});

test('SMTP: connection refused propagates as RuntimeException', () => {
  assert.throws(
    () => runMail({
      MAIL_TRANSPORT: 'smtp',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: '1', // almost certainly refused
      SMTP_TLS_MODE: 'none',
      SMTP_USERNAME: 'user',
      SMTP_PASSWORD: 'pass',
      MAIL_FROM_ADDRESS: 'a@b.cz',
      APP_ENV: 'development',
    }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
    err => /SMTP connect failed/.test(err.stderr)
  );
});

test('SMTP: server rejection propagates as RuntimeException', async () => {
  // Server that accepts connection then rejects AUTH
  const server = createServer(socket => {
    socket.write('220 fake SMTP\r\n');
    socket.on('data', chunk => {
      const line = chunk.toString().trim();
      if (line.startsWith('EHLO')) {
        socket.write('250 OK\r\n');
      } else if (line === 'AUTH LOGIN') {
        socket.write('535 Authentication failed\r\n');
        socket.end();
      }
    });
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;

  try {
    await assert.rejects(
      () => runMailAsync({
        MAIL_TRANSPORT: 'smtp',
        SMTP_HOST: '127.0.0.1',
        SMTP_PORT: String(port),
        SMTP_TLS_MODE: 'none',
        SMTP_USERNAME: 'user',
        SMTP_PASSWORD: 'pass',
        MAIL_FROM_ADDRESS: 'a@b.cz',
        APP_ENV: 'development',
      }, `kvazi_mail_send('u@x.cz', 'S', 'B');`),
      err => /SMTP expected 334, got 535/.test(err.stderr)
    );
  } finally {
    server.close();
  }
});

test('SMTP: dot-stuffing in body', async () => {
  const dialogue = [];
  const server = createServer(socket => {
    socket.write('220 fake SMTP\r\n');
    let buffer = '';
    let inData = false;
    socket.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split('\r\n');
      buffer = lines.pop();
      for (const line of lines) {
        dialogue.push(line);
        if (inData) {
          if (line === '.') { inData = false; socket.write('250 OK\r\n'); }
          continue;
        }
        if (line.startsWith('EHLO')) socket.write('250 OK\r\n');
        else if (line === 'AUTH LOGIN') socket.write('334 VXNlcm5hbWU6\r\n');
        else if (line === Buffer.from('u').toString('base64')) socket.write('334 UGFzc3dvcmQ6\r\n');
        else if (line === Buffer.from('p').toString('base64')) socket.write('235 OK\r\n');
        else if (line.startsWith('MAIL FROM:')) socket.write('250 OK\r\n');
        else if (line.startsWith('RCPT TO:')) socket.write('250 OK\r\n');
        else if (line === 'DATA') { inData = true; socket.write('354 Go\r\n'); }
        else if (line === 'QUIT') { socket.write('221 Bye\r\n'); socket.end(); }
      }
    });
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;

  try {
    // Body with a line starting with a dot
    await runMailAsync({
      MAIL_TRANSPORT: 'smtp',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(port),
      SMTP_TLS_MODE: 'none',
      SMTP_USERNAME: 'u',
      SMTP_PASSWORD: 'p',
      MAIL_FROM_ADDRESS: 'a@b.cz',
      MAIL_FROM_NAME: '',
      APP_ENV: 'development',
    }, `kvazi_mail_send('r@x.cz', 'Dots', ".leading dot\\n..double dot\\nnormal");`);

    // After dot-stuffing, lines starting with "." get an extra dot
    assert.ok(dialogue.some(l => l === '..leading dot'), 'single dot stuffed');
    assert.ok(dialogue.some(l => l === '...double dot'), 'double dot stuffed');
    assert.ok(dialogue.some(l => l === 'normal'), 'normal line unchanged');
  } finally {
    server.close();
  }
});
