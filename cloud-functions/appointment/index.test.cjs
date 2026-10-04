const { test } = require('node:test');
const assert = require('node:assert/strict');
process.env.SMTP_USER = 'sender@example.org';
process.env.SMTP_PASSWORD = 'fake-app-password';
process.env.MAIL_TO = 'recipient@example.org';
process.env.ALLOWED_ORIGINS = 'https://articlinic.ru,http://127.0.0.1:5173,http://localhost:5173';
const mailer = require('./send-mail');
const { handler } = require('./index');
function event(data = {}) {
  return { httpMethod: 'POST', headers: { Origin: 'https://articlinic.ru' },
    body: JSON.stringify({ name: 'Тест <имя>', phone: '+7 (000) 000-00-00',
      page: 'https://articlinic.ru/#contact', website: '', t0: Date.now() - 5000, ...data }) };
}
function setup(t, impl = async () => { throw Error('Unexpected send'); }) {
  const logs = [];
  t.mock.method(console, 'info', value => logs.push(value));
  t.mock.method(console, 'error', value => logs.push(value));
  t.mock.method(globalThis, 'fetch', () => { throw Error('Unexpected HTTP request'); });
  return { send: t.mock.method(mailer, 'sendMail', impl), logs };
}
const accepted = async () => ({ accepted: ['recipient@example.org'] });
test('sends escaped HTML and plain text only to configured recipient', async t => {
  const { send, logs } = setup(t, async (auth, message) => {
    assert.equal(auth.user, 'sender@example.org');
    assert.equal(auth.password, 'fake-app-password');
    assert.equal(message.from.address, auth.user);
    assert.equal(message.to.address, 'recipient@example.org');
    assert.match(message.html, /Тест &lt;имя&gt;/);
    assert.match(message.text, /Тест <имя>/);
    assert.match(message.text, /000/);
    assert.match(message.text, /https:\/\/articlinic.ru/);
    return accepted();
  });
  const result = await handler(event({ to: 'attacker@example.org' }));
  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body), { ok: true });
  assert.equal(send.mock.callCount(), 1);
  assert.ok(logs.some(log => log.includes('mail_send_completed')));
  assert.doesNotMatch(logs.join(''), /fake-app-password|Тест <имя>/);
});
test('rejected recipient is not reported as success', async t => {
  setup(t, async () => ({ accepted: [], rejected: ['recipient@example.org'] }));
  assert.equal((await handler(event())).statusCode, 502);
});
for (const [code, status] of [['ETIMEDOUT', 504], ['EAUTH', 502], ['ESOCKET', 502]]) {
  test(`${code}: controlled error, no secrets or automatic retry`, async t => {
    const { send, logs } = setup(t, async () => { throw Object.assign(Error('fake-app-password patient'), { code }); });
    const result = await handler(event());
    assert.equal(result.statusCode, status);
    assert.equal(JSON.parse(result.body).ok, false);
    assert.equal(result.headers['Access-Control-Allow-Origin'], 'https://articlinic.ru');
    assert.equal(send.mock.callCount(), 1);
    assert.doesNotMatch(logs.join(''), /fake-app-password|patient/);
    assert.ok(logs.some(log => log.includes(code)));
  });
}
test('invalid data, honeypot and fast submission do not send', async t => {
  const { send } = setup(t);
  for (const body of ['{', 'null', '[]']) assert.equal((await handler({ ...event(), body })).statusCode, 400);
  assert.equal((await handler(event({ name: '' }))).statusCode, 400);
  assert.equal((await handler(event({ name: 'я'.repeat(5000) }))).statusCode, 413);
  assert.equal((await handler(event({ t0: Date.now() }))).statusCode, 429);
  assert.equal((await handler(event({ website: 'spam' }))).statusCode, 204);
  assert.equal(send.mock.callCount(), 0);
});
test('preflight supports production and local origins', async t => {
  const { send } = setup(t);
  for (const origin of ['https://articlinic.ru', 'http://127.0.0.1:5173', 'http://localhost:5173']) {
    const result = await handler({ httpMethod: 'OPTIONS', headers: { origin } });
    assert.equal(result.statusCode, 204);
    assert.equal(result.headers['Access-Control-Allow-Origin'], origin);
  }
  assert.equal((await handler({ ...event(), httpMethod: 'GET' })).statusCode, 405);
  assert.equal((await handler({ ...event(), headers: { origin: 'https://other.example' } })).statusCode, 403);
  assert.equal(send.mock.callCount(), 0);
});
test('missing password and invalid recipient do not send', async t => {
  const { send } = setup(t);
  const password = process.env.SMTP_PASSWORD, recipient = process.env.MAIL_TO;
  try {
    delete process.env.SMTP_PASSWORD;
    assert.equal((await handler(event())).statusCode, 500);
    process.env.SMTP_PASSWORD = password;
    process.env.MAIL_TO = 'a@example.org,b@example.org';
    assert.equal((await handler(event())).statusCode, 500);
  } finally {
    process.env.SMTP_PASSWORD = password;
    process.env.MAIL_TO = recipient;
  }
  assert.equal(send.mock.callCount(), 0);
});
test('base64 JSON and malformed URL are handled', async t => {
  setup(t, accepted);
  const request = event({ page: '%invalid-uri' });
  request.body = Buffer.from(request.body).toString('base64');
  request.isBase64Encoded = true;
  assert.equal((await handler(request)).statusCode, 200);
});
