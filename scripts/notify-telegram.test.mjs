import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDeploymentMessage, sendDeploymentNotification } from './notify-telegram.mjs';

const env = {
  TELEGRAM_BOT_TOKEN: '123456:test_token', TELEGRAM_CHAT_ID: '-123456789',
  GITHUB_REPOSITORY: 'YuriyKim799/arti-clinic-page', GITHUB_REF_NAME: 'main',
  GITHUB_SHA: 'a'.repeat(40), GITHUB_ACTOR: 'YuriyKim799', GITHUB_RUN_ID: '42485847410',
};

test('builds messages for each scope with actual newlines and a run link', () => {
  for (const scope of ['app', 'content', 'routing']) {
    for (const status of ['success', 'failure']) {
      const text = buildDeploymentMessage(scope, status, env);
      assert.equal(text.split('\n').length, 6);
      assert.ok(!text.includes('%0A'));
      assert.ok(text.includes('https://github.com/YuriyKim799/arti-clinic-page/actions/runs/42485847410'));
      assert.ok(text.startsWith(status === 'success' ? '✅' : '❌'));
      assert.ok(!text.includes(env.TELEGRAM_BOT_TOKEN));
      assert.ok(!text.includes(env.TELEGRAM_CHAT_ID));
    }
  }
  assert.throws(() => buildDeploymentMessage('other', 'success', env), /requires scope/);
  assert.throws(() => buildDeploymentMessage('app', 'unknown', env), /requires scope/);
});

test('accepts only confirmed API success and posts form data to the fixed Telegram host once', async () => {
  let calls = 0;
  const result = await sendDeploymentNotification('app', 'success', { env, fetch: async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.telegram.org/bot123456:test_token/sendMessage');
    assert.equal(init.method, 'POST');
    assert.equal(init.redirect, 'error');
    assert.ok(init.signal instanceof AbortSignal);
    assert.equal(init.body.get('chat_id'), env.TELEGRAM_CHAT_ID);
    assert.equal(init.body.get('text'), buildDeploymentMessage('app', 'success', env));
    return Response.json({ ok: true, result: { message_id: 321, chat: { id: env.TELEGRAM_CHAT_ID } } });
  } });
  assert.equal(calls, 1);
  assert.deepEqual(result, { scope: 'app', status: 'success', messageId: 321 });
});

test('rejects HTTP 400 even if its body claims API success without exposing response details', async () => {
  await assert.rejects(sendDeploymentNotification('routing', 'failure', {
    env, fetch: async () => Response.json({ ok: true, description: env.TELEGRAM_BOT_TOKEN, result: { message_id: 1 } }, { status: 400 }),
  }), error => {
    assert.match(error.message, /HTTP 400/);
    assert.ok(!error.message.includes(env.TELEGRAM_BOT_TOKEN));
    return true;
  });
});

test('rejects HTTP 200 when API ok is false or message_id is missing or invalid', async () => {
  for (const data of [{ ok: false, description: 'DO-NOT-LOG' }, { ok: true }, { ok: true, result: { message_id: '321' } }, { ok: true, result: { message_id: 0 } }]) {
    await assert.rejects(sendDeploymentNotification('content', 'success', { env, fetch: async () => Response.json(data) }), /API did not confirm/);
  }
});

test('rejects invalid JSON and network errors with controlled errors and no retry', async () => {
  await assert.rejects(sendDeploymentNotification('app', 'success', { env, fetch: async () => new Response('DO-NOT-LOG') }), /invalid JSON/);
  let calls = 0;
  await assert.rejects(sendDeploymentNotification('app', 'success', { env, fetch: async () => {
    calls++;
    throw Error(`sensitive URL https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`);
  } }), error => {
    assert.match(error.message, /request failed or timed out/);
    assert.ok(!error.message.includes(env.TELEGRAM_BOT_TOKEN));
    return true;
  });
  assert.equal(calls, 1);
});

test('missing or malformed credentials fail before any request without disclosing values', async () => {
  for (const overrides of [{ TELEGRAM_BOT_TOKEN: '' }, { TELEGRAM_CHAT_ID: '' }, { TELEGRAM_BOT_TOKEN: 'evil/path?secret' }, { TELEGRAM_CHAT_ID: 'bad chat' }]) {
    let called = false;
    await assert.rejects(sendDeploymentNotification('app', 'success', { env: { ...env, ...overrides }, fetch: async () => {
      called = true;
      throw Error('Must not be called');
    } }), /credentials are missing or invalid/);
    assert.equal(called, false);
  }
});
