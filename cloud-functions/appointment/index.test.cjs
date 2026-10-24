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
  t.mock.method(console, 'warn', value => logs.push(value));
  t.mock.method(globalThis, 'fetch', () => { throw Error('Unexpected HTTP request'); });
  return { send: t.mock.method(mailer, 'sendMail', impl), logs };
}
const accepted = async () => ({ accepted: ['recipient@example.org'] });
test('sends escaped HTML and plain text only to configured recipient', async t => {
  const { send, logs } = setup(t, async (auth, message) => {
    assert.equal(auth.user, 'sender@example.org');
    assert.equal(auth.password, 'fake-app-password');
    assert.equal(message.from.address, auth.user);
    assert.deepEqual(message.to, [{ address: 'recipient@example.org' }]);
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

test('sends one message to all configured recipients, trimming and deduplicating the list', async t => {
  const previous = process.env.MAIL_TO;
  process.env.MAIL_TO = ' recipient@example.org ; copy@example.org, RECIPIENT@example.org ; COPY@example.org ';
  const { send, logs } = setup(t, async (auth, message) => {
    assert.equal(auth.user, 'sender@example.org');
    assert.deepEqual(message.to.map(({ address }) => address.toLowerCase()), [
      'recipient@example.org', 'copy@example.org',
    ]);
    return { accepted: ['RECIPIENT@EXAMPLE.ORG', 'COPY@EXAMPLE.ORG'] };
  });
  try {
    const result = await handler(event({ to: 'attacker@example.org', cc: 'attacker@example.org' }));
    assert.equal(result.statusCode, 200);
    assert.deepEqual(JSON.parse(result.body), { ok: true });
    assert.equal(send.mock.callCount(), 1);
    assert.ok(logs.some(log => log.includes('mail_send_completed')));
    assert.ok(!logs.some(log => log.includes('mail_partial_delivery')));
    assert.doesNotMatch(logs.join(''), /recipient@example\.org|copy@example\.org|attacker@example\.org|fake-app-password|Тест <имя>/);
  } finally {
    process.env.MAIL_TO = previous;
  }
});

for (const acceptedRecipient of ['recipient@example.org', 'copy@example.org']) {
  test(`partial delivery to ${acceptedRecipient} succeeds without retrying or leaking patient data`, async t => {
    const previous = process.env.MAIL_TO;
    process.env.MAIL_TO = 'recipient@example.org,copy@example.org';
    const rejectedRecipient = acceptedRecipient === 'recipient@example.org' ? 'copy@example.org' : 'recipient@example.org';
    const { send, logs } = setup(t, async () => ({ accepted: [acceptedRecipient], rejected: [rejectedRecipient] }));
    try {
      const result = await handler(event());
      assert.equal(result.statusCode, 200);
      assert.deepEqual(JSON.parse(result.body), { ok: true });
      assert.equal(send.mock.callCount(), 1);
      const partial = logs.map(log => JSON.parse(log)).find(log => log.event === 'mail_partial_delivery');
      assert.ok(partial);
      assert.equal(partial.acceptedCount, 1);
      assert.equal(partial.recipientCount, 2);
      assert.ok(logs.some(log => log.includes('mail_send_completed')));
      assert.doesNotMatch(logs.join(''), /recipient@example\.org|copy@example\.org|fake-app-password|Тест <имя>|000-00-00/);
    } finally {
      process.env.MAIL_TO = previous;
    }
  });
}

for (const result of [
  { accepted: [], rejected: ['recipient@example.org', 'copy@example.org'] },
  { accepted: ['unconfigured@example.org'] },
  undefined,
]) {
  test(`no configured recipient accepted: ${JSON.stringify(result)}`, async t => {
    const previous = process.env.MAIL_TO;
    process.env.MAIL_TO = 'recipient@example.org,copy@example.org';
    const { send, logs } = setup(t, async () => result);
    try {
      const response = await handler(event());
      assert.equal(response.statusCode, 502);
      assert.equal(JSON.parse(response.body).ok, false);
      assert.equal(send.mock.callCount(), 1);
      assert.ok(logs.some(log => log.includes('mail_rejected')));
      assert.ok(!logs.some(log => log.includes('mail_send_completed')));
    } finally {
      process.env.MAIL_TO = previous;
    }
  });
}
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
    for (const invalid of ['a@example.org,not-an-email', ' ', ' , ; ', 'a@example.org\r\nBcc:attacker@example.org']) {
      process.env.MAIL_TO = invalid;
      assert.equal((await handler(event())).statusCode, 500);
    }
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

const onlineRequest = (data = {}) => event({
  appointment_type: 'online-consultation', doctor: 'kim-alina',
  name: 'Иванов Иван <Иванович>', phone: '+7 (000) 000-00-00',
  email: 'patient@example.org', page: 'https://articlinic.ru/doctors/kim-alina',
  ...data,
});

test('online consultation sends the full request to both clinic recipients in one message', async t => {
  const recipient = process.env.MAIL_TO;
  process.env.MAIL_TO = 'kimskiy@mail.ru,yurakakim777@gmail.com';
  const patientEmail = "patient+online&o'hara@example.org";
  const { send, logs } = setup(t, async (auth, message) => {
    assert.deepEqual(message.to, [
      { address: 'kimskiy@mail.ru' }, { address: 'yurakakim777@gmail.com' },
    ]);
    assert.equal(message.from.address, 'sender@example.org');
    assert.equal(message.replyTo, undefined);
    assert.equal(message.cc, undefined);
    assert.equal(message.bcc, undefined);
    assert.equal(message.subject, 'Онлайн-консультация — Ким Алина Александровна — Арти Клиник');
    assert.match(message.html, /<b>Тип заявки:<\/b> Онлайн-консультация/);
    assert.match(message.html, /<b>Врач:<\/b> Ким Алина Александровна/);
    assert.match(message.html, /<b>ФИО:<\/b> Иванов Иван &lt;Иванович&gt;/);
    assert.match(message.html, /<b>Email:<\/b> patient\+online&amp;o&#039;hara@example\.org/);
    assert.match(message.text, /Тип заявки: Онлайн-консультация\nВрач: Ким Алина Александровна/);
    assert.match(message.text, /ФИО: Иванов Иван <Иванович>/);
    assert.ok(message.text.includes(`Email: ${patientEmail}`));
    assert.match(message.text, /Телефон: \+7 \(000\) 000-00-00/);
    assert.match(message.text, /https:\/\/articlinic.ru\/doctors\/kim-alina/);
    assert.doesNotMatch(message.text, /Подменённый врач|attacker@example\.org/);
    return { accepted: ['kimskiy@mail.ru', 'yurakakim777@gmail.com'] };
  });
  try {
    const response = await handler(onlineRequest({
      email: ` ${patientEmail} `, doctor_name: 'Подменённый врач',
      to: 'attacker@example.org', cc: 'attacker@example.org', from: 'attacker@example.org',
    }));
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), { ok: true });
    assert.equal(send.mock.callCount(), 1);
    assert.doesNotMatch(logs.join(''), /Иванов|patient|000-00-00|fake-app-password/);
  } finally {
    process.env.MAIL_TO = recipient;
  }
});

test('online consultation requires a valid email before attempting SMTP', async t => {
  const { send } = setup(t);
  for (const email of [
    undefined, null, 123, [], {}, '', ' ', 'not-an-email', 'person@localhost',
    'person@example.org@', '@example.org', 'a@@example.org',
    'person..name@example.org', '.person@example.org', 'person.@example.org',
    'person@-example.org', 'person@example-.org', 'person@example..org',
    'Person <person@example.org>', 'person@example.org,another@example.org',
    'person@example.org\r\nBcc:attacker@example.org', '\r\nperson@example.org',
    `${'a'.repeat(65)}@example.org`,
    `${'a'.repeat(64)}@${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(62)}`,
  ]) {
    const response = await handler(onlineRequest({ email }));
    assert.equal(response.statusCode, 400, `Unexpected result for email ${JSON.stringify(email)}`);
    assert.equal(JSON.parse(response.body).ok, false);
  }
  assert.equal(send.mock.callCount(), 0);
});

test('online consultation accepts a 254-character email without truncation', async t => {
  const email = `${'a'.repeat(64)}@${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(61)}`;
  assert.equal(email.length, 254);
  const { send } = setup(t, async (auth, message) => {
    assert.ok(message.text.includes(`Email: ${email}`));
    return accepted();
  });
  assert.equal((await handler(onlineRequest({ email }))).statusCode, 200);
  assert.equal(send.mock.callCount(), 1);
});

test('online consultation only supports the configured doctor and string contact fields', async t => {
  const { send } = setup(t);
  for (const doctor of [undefined, null, 'tyan-viktoria', 'Подменённый врач', {}]) {
    assert.equal((await handler(onlineRequest({ doctor }))).statusCode, 400);
  }
  for (const fields of [{ name: {} }, { phone: [] }, { name: '' }, { phone: '' }]) {
    assert.equal((await handler(onlineRequest(fields))).statusCode, 400);
  }
  assert.equal(send.mock.callCount(), 0);
});

test('ordinary appointments retain the original subject and body without requiring an email', async t => {
  const { send } = setup(t, async (auth, message) => {
    assert.equal(message.subject, 'Новая заявка на запись — Арти Клиник');
    assert.match(message.text, /Имя: Тест <имя>/);
    assert.match(message.html, /<b>Имя:<\/b>/);
    assert.doesNotMatch(message.text, /Онлайн-консультация|Email:|Врач:|ФИО:/);
    assert.doesNotMatch(message.html, /Онлайн-консультация|Email:|Врач:|ФИО:/);
    return accepted();
  });
  assert.equal((await handler(event())).statusCode, 200);
  assert.equal((await handler(event({ email: 'not-used-as-a-recipient', doctor: 'kim-alina' }))).statusCode, 200);
  assert.equal(send.mock.callCount(), 2);
});

test('online consultation keeps anti-spam checks before email delivery', async t => {
  const { send } = setup(t);
  assert.equal((await handler(onlineRequest({ website: 'spam', email: undefined }))).statusCode, 204);
  assert.equal((await handler(onlineRequest({ t0: Date.now() }))).statusCode, 429);
  assert.equal(send.mock.callCount(), 0);
});

const exerciseRequest = (data = {}) => onlineRequest({ appointment_type: 'exercise-collection', ...data });

test('exercise collection request sends distinct escaped details to both clinic recipients', async t => {
  const recipient = process.env.MAIL_TO;
  process.env.MAIL_TO = 'kimskiy@mail.ru,yurakakim777@gmail.com';
  const email = "buyer+exercise&o'hara@example.org";
  const { send, logs } = setup(t, async (auth, message) => {
    assert.deepEqual(message.to, [
      { address: 'kimskiy@mail.ru' }, { address: 'yurakakim777@gmail.com' },
    ]);
    assert.equal(message.from.address, 'sender@example.org');
    assert.equal(message.replyTo, undefined);
    assert.equal(message.cc, undefined);
    assert.equal(message.bcc, undefined);
    assert.equal(message.subject, 'Заявка на сборник упражнений — Арти Клиник');
    assert.match(message.html, /<b>Тип заявки:<\/b> Покупка сборника упражнений/);
    assert.match(message.html, /<b>Врач:<\/b> Ким Алина Александровна/);
    assert.match(message.html, /<b>ФИО:<\/b> Иванов Иван &lt;Иванович&gt;/);
    assert.match(message.html, /<b>Email:<\/b> buyer\+exercise&amp;o&#039;hara@example\.org/);
    assert.match(message.text, /Тип заявки: Покупка сборника упражнений\nВрач: Ким Алина Александровна/);
    assert.match(message.text, /ФИО: Иванов Иван <Иванович>/);
    assert.ok(message.text.includes(`Email: ${email}`));
    assert.match(message.text, /Телефон: \+7 \(000\) 000-00-00/);
    assert.doesNotMatch(`${message.subject}\n${message.text}\n${message.html}`, /Онлайн-консультация|Покупка подтверждена|Оплачено|Сумма:|attacker@example\.org|Подменённый врач/);
    return { accepted: ['kimskiy@mail.ru', 'yurakakim777@gmail.com'] };
  });
  try {
    const response = await handler(exerciseRequest({
      email: ` ${email} `, doctor_name: 'Подменённый врач',
      to: 'attacker@example.org', cc: 'attacker@example.org', from: 'attacker@example.org',
      price: 'Оплачено 10000', collection_title: 'Покупка подтверждена',
    }));
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), { ok: true });
    assert.equal(send.mock.callCount(), 1);
    assert.doesNotMatch(logs.join(''), /Иванов|buyer|000-00-00|fake-app-password/);
  } finally {
    process.env.MAIL_TO = recipient;
  }
});

test('exercise collection requires valid email, string contact fields and the configured doctor', async t => {
  const { send } = setup(t);
  for (const fields of [
    { email: undefined }, { email: null }, { email: {} }, { email: '' },
    { email: 'invalid' }, { email: 'buyer@example.org\r\nBcc:attacker@example.org' },
    { email: `${'a'.repeat(65)}@example.org` },
    { email: `${'a'.repeat(64)}@${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(62)}` },
    { name: '' }, { name: ' ' }, { name: {} },
    { phone: '' }, { phone: ' ' }, { phone: [] },
    { doctor: undefined }, { doctor: 'tyan-viktoria' }, { doctor: {} },
  ]) {
    const response = await handler(exerciseRequest(fields));
    assert.equal(response.statusCode, 400, `Unexpected result for ${JSON.stringify(fields)}`);
    assert.equal(JSON.parse(response.body).ok, false);
  }
  assert.equal(send.mock.callCount(), 0);
});

test('exercise collection SMTP failure returns an error without retrying or leaking contact data', async t => {
  const { send, logs } = setup(t, async () => {
    throw Object.assign(Error('fake-app-password buyer@example.org Иванов'), { code: 'ETIMEDOUT' });
  });
  const response = await handler(exerciseRequest({ email: 'buyer@example.org' }));
  assert.equal(response.statusCode, 504);
  assert.equal(JSON.parse(response.body).ok, false);
  assert.equal(send.mock.callCount(), 1);
  assert.ok(logs.some(log => log.includes('mail_timeout')));
  assert.doesNotMatch(logs.join(''), /buyer@example\.org|Иванов|fake-app-password/);
});

test('exercise collection keeps rejection and partial acceptance handling without duplicate sends', async t => {
  const recipient = process.env.MAIL_TO;
  process.env.MAIL_TO = 'recipient@example.org,copy@example.org';
  let acceptedAddresses = [];
  const { send, logs } = setup(t, async () => ({ accepted: acceptedAddresses }));
  try {
    const rejectedResponse = await handler(exerciseRequest());
    assert.equal(rejectedResponse.statusCode, 502);
    assert.equal(JSON.parse(rejectedResponse.body).ok, false);
    acceptedAddresses = ['recipient@example.org'];
    const partialResponse = await handler(exerciseRequest());
    assert.equal(partialResponse.statusCode, 200);
    assert.deepEqual(JSON.parse(partialResponse.body), { ok: true });
    assert.equal(send.mock.callCount(), 2);
    assert.ok(logs.some(log => log.includes('mail_partial_delivery')));
    assert.doesNotMatch(logs.join(''), /patient@example\.org|Иванов|fake-app-password/);
  } finally {
    process.env.MAIL_TO = recipient;
  }
});

test('exercise collection keeps honeypot and time-trap checks without sending mail', async t => {
  const { send } = setup(t);
  assert.equal((await handler(exerciseRequest({ website: 'spam', email: undefined }))).statusCode, 204);
  assert.equal((await handler(exerciseRequest({ t0: Date.now() }))).statusCode, 429);
  assert.equal(send.mock.callCount(), 0);
});
