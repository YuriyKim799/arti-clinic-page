const { test } = require('node:test');
const assert = require('node:assert/strict');
const SMTPConnection = require('nodemailer/lib/smtp-connection');
const { sendMail } = require('./send-mail');
const auth = { user: 'sender@example.org', password: 'fake-password' };
const message = { from: { address: auth.user }, to: { address: 'recipient@example.org' },
  subject: 'Запись', text: 'Тест', html: '<b>Тест</b>' };
test('Mail.ru TLS, valid MIME email and connection cleanup', async t => {
  t.mock.method(SMTPConnection.prototype, 'connect', function (cb) {
    assert.equal(this.options.host, 'smtp.mail.ru');
    assert.equal(this.options.port, 465);
    assert.equal(this.options.secure, true);
    cb();
  });
  t.mock.method(SMTPConnection.prototype, 'login', (credentials, cb) => {
    assert.deepEqual(credentials, { user: auth.user, pass: auth.password }); cb();
  });
  t.mock.method(SMTPConnection.prototype, 'send', (envelope, buffer, cb) => {
    assert.deepEqual(envelope.to, ['recipient@example.org']);
    assert.equal(envelope.from, auth.user);
    const raw = buffer.toString();
    assert.match(raw, /multipart\/alternative/);
    assert.match(raw, /text\/plain/);
    assert.match(raw, /text\/html/);
    assert.doesNotMatch(raw, /fake-password/);
    cb(null, { accepted: envelope.to });
  });
  const close = t.mock.method(SMTPConnection.prototype, 'close', () => {});
  assert.deepEqual(await sendMail(auth, message), { accepted: ['recipient@example.org'] });
  assert.equal(close.mock.callCount(), 1);
});
for (const stage of ['connect', 'login', 'send']) {
  test(`20-second deadline closes stalled ${stage} without retry`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let reached;
    const started = new Promise(resolve => { reached = resolve; });
    const connect = t.mock.method(SMTPConnection.prototype, 'connect', cb => {
      if (stage === 'connect') reached(); else cb();
    });
    t.mock.method(SMTPConnection.prototype, 'login', (_auth, cb) => {
      if (stage === 'login') reached(); else cb();
    });
    t.mock.method(SMTPConnection.prototype, 'send', () => reached());
    const close = t.mock.method(SMTPConnection.prototype, 'close', () => {});
    const pending = sendMail(auth, message);
    const rejection = assert.rejects(pending, { code: 'ETIMEDOUT' });
    await started;
    t.mock.timers.tick(20000);
    await rejection;
    assert.equal(close.mock.callCount(), 1);
    assert.equal(connect.mock.callCount(), 1);
  });
}
test('authentication error closes connection without sending', async t => {
  t.mock.method(SMTPConnection.prototype, 'connect', cb => cb());
  t.mock.method(SMTPConnection.prototype, 'login', (_auth, cb) => cb(Object.assign(Error('Denied'), { code: 'EAUTH' })));
  const send = t.mock.method(SMTPConnection.prototype, 'send', () => { throw Error('Must not send'); });
  const close = t.mock.method(SMTPConnection.prototype, 'close', () => {});
  await assert.rejects(sendMail(auth, message), { code: 'EAUTH' });
  assert.equal(send.mock.callCount(), 0);
  assert.equal(close.mock.callCount(), 1);
});
