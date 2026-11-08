const mailer = require('./send-mail');
const { ALLOWED_ORIGINS } = process.env;

const ORIGINS = (ALLOWED_ORIGINS || 'https://articlinic.ru')
  .split(',').map(s => s.trim()).filter(Boolean);
const MAX_BODY_BYTES = 4 * 1024;
const MIN_FILL_MS = 900;
const ONLINE_DOCTOR_ID = 'kim-alina';
const ONLINE_DOCTOR_NAME = 'Ким Алина Александровна';

function hostname(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return '';
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

const ALLOWED_HOSTS = new Set(ORIGINS.map(hostname).filter(Boolean));

function isPatientPhone(phone) {
  if (typeof phone !== 'string' || phone.length > 50 || !/^[+0-9 ()-]+$/.test(phone)) return false;
  return /^(?:\+7|7|8)?\d{10}$/.test(phone.replace(/[ ()-]/g, ''));
}

function isPatientEmail(value) {
  if (typeof value !== 'string' || /[\r\n]/.test(value)) return false;
  const address = value.trim();
  if (address.length > 254) return false;
  const parts = address.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return Boolean(local) && local.length <= 64 &&
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) &&
    !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') &&
    typeof domain === 'string' && domain.includes('.') &&
    domain.split('.').every(label => /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label));
}

const escapeHtml = (s = '') => s.replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[ch]));

function humanizePage(page, pageText) {
  if (!page) return '';
  try {
    const u = new URL(page);
    if (!ALLOWED_HOSTS.has(hostname(page))) return escapeHtml(pageText || page);
    const hash = u.hash ? decodeURIComponent(u.hash.slice(1)) : '';
    const section = hash.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    const base = `${u.origin}${u.pathname}`;
    const text = pageText || (section ? `${base} — ${section}` : base);
    return `<a href="${escapeHtml(page)}">${escapeHtml(text)}</a>`;
  } catch {
    return escapeHtml(pageText || page);
  }
}

exports.handler = async (event) => {
  const method = event?.httpMethod || 'GET';
  const origin = Object.entries(event?.headers || {})
    .find(([key]) => key.toLowerCase() === 'origin')?.[1];
  const originAllowed = ORIGINS.includes('*') || ORIGINS.includes(origin);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
  };
  if (originAllowed) headers['Access-Control-Allow-Origin'] = ORIGINS.includes('*') ? '*' : origin;
  const reply = (statusCode, data) => ({
    statusCode, headers, body: data === undefined ? '' : JSON.stringify(data),
  });

  if (origin && !originAllowed) return reply(403, { ok: false, error: 'Недопустимый источник запроса.' });
  if (method === 'OPTIONS') return reply(204);
  if (method !== 'POST') return reply(405, { ok: false });
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPassword = process.env.SMTP_PASSWORD;
  const configuredRecipients = (process.env.MAIL_TO || 'kimskiy@mail.ru,yurakakim777@gmail.com')
    .split(/[;,]/).map(address => address.trim()).filter(Boolean);
  const mailTo = [...new Map(configuredRecipients.map(address => [address.toLowerCase(), address])).values()];
  const isMailbox = value => /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value);
  if (!isMailbox(smtpUser) || !smtpPassword ||
    mailTo.length === 0 || mailTo.some(address => !isMailbox(address))) {
    console.error(JSON.stringify({ event: 'appointment_config_missing' }));
    return reply(500, { ok: false, error: 'Сервис записи временно недоступен.' });
  }

  let raw = event.body || '';
  if (typeof raw !== 'string') return reply(400, { ok: false, error: 'Некорректный запрос.' });
  if (event.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return reply(413, { ok: false });

  let data;
  try { data = JSON.parse(raw); } catch { return reply(400, { ok: false, error: 'Некорректный JSON.' }); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400, { ok: false });

  if (data.website !== undefined && typeof data.website !== 'string') {
    return reply(400, { ok: false, error: 'Некорректный запрос.' });
  }
  if (data.website?.trim()) return reply(204);
  const t0 = data.t0;
  if (!Number.isFinite(t0) || t0 <= 0) {
    return reply(400, { ok: false, error: 'Обновите страницу и отправьте форму ещё раз.' });
  }
  if (Date.now() - t0 < MIN_FILL_MS) {
    return reply(429, { ok: false, error: 'Подождите несколько секунд и отправьте форму ещё раз.' });
  }

  if (typeof data.name !== 'string' || !data.name.trim() || data.name.trim().length > 100 ||
    /[\u0000-\u001f\u007f]/.test(data.name) || !isPatientPhone(data.phone)) {
    return reply(400, { ok: false, error: 'Проверьте корректность имени и телефона.' });
  }
  const name = data.name.trim();
  const phone = data.phone.trim();
  const page = typeof data.page === 'string' ? data.page.trim().slice(0, 300) : '';
  const pageText = typeof data.page_text === 'string' ? data.page_text.trim().slice(0, 300) : '';

  const appointmentType = data.appointment_type === undefined ? 'appointment' : data.appointment_type;
  if (!['appointment', 'online-consultation', 'exercise-collection'].includes(appointmentType)) {
    return reply(400, { ok: false, error: 'Некорректный тип заявки.' });
  }
  const isOnline = appointmentType === 'online-consultation';
  const isExerciseCollection = appointmentType === 'exercise-collection';
  const requiresEmail = isOnline || isExerciseCollection;
  if (requiresEmail && data.doctor !== ONLINE_DOCTOR_ID) {
    return reply(400, { ok: false, error: isExerciseCollection
      ? 'Сборник упражнений выбранного врача недоступен.'
      : 'Онлайн-консультация у выбранного врача недоступна.' });
  }
  if (requiresEmail && !isPatientEmail(data.email)) {
    return reply(400, { ok: false, error: 'Укажите корректный email.' });
  }

  const email = requiresEmail ? data.email.trim() : '';
  const nameLabel = requiresEmail ? 'ФИО' : 'Имя';
  const requestType = isExerciseCollection ? 'Покупка сборника упражнений' : 'Онлайн-консультация';

  const lines = [
    '📬 <b>Новая заявка</b>',
    ...(requiresEmail ? [
      `<b>Тип заявки:</b> ${requestType}`,
      `<b>Врач:</b> ${ONLINE_DOCTOR_NAME}`,
    ] : []),
    `<b>${nameLabel}:</b> ${escapeHtml(name)}`,
    ...(requiresEmail ? [`<b>Email:</b> ${escapeHtml(email)}`] : []),
    `<b>Телефон:</b> ${escapeHtml(phone)}`,
  ];
  const pageLine = humanizePage(page, pageText);
  if (pageLine) lines.push(`<b>Страница:</b> ${pageLine}`);

  const startedAt = Date.now();
  // Never log credentials, email content, or patient details.
  console.info(JSON.stringify({ event: 'mail_send_started' }));
  try {
    const result = await mailer.sendMail({
      user: smtpUser, password: smtpPassword,
    }, {
      from: { name: 'Арти Клиник — запись с сайта', address: smtpUser },
      to: mailTo.map(address => ({ address })),
      subject: isExerciseCollection ? 'Заявка на сборник упражнений — Арти Клиник'
        : isOnline ? `Онлайн-консультация — ${ONLINE_DOCTOR_NAME} — Арти Клиник` : 'Новая заявка на запись — Арти Клиник',
      text: ['Новая заявка',
        ...(requiresEmail ? [`Тип заявки: ${requestType}`, `Врач: ${ONLINE_DOCTOR_NAME}`] : []),
        `${nameLabel}: ${name}`, ...(requiresEmail ? [`Email: ${email}`] : []), `Телефон: ${phone}`,
        ...(page ? [`Страница: ${page}`, ...(pageText ? [pageText] : [])] : [])].join('\n'),
      html: lines.map(line => `<p>${line}</p>`).join('\n'),
    });
    const acceptedAddresses = new Set((Array.isArray(result?.accepted) ? result.accepted : [])
      .filter(address => typeof address === 'string').map(address => address.toLowerCase()));
    const acceptedCount = mailTo.filter(address => acceptedAddresses.has(address.toLowerCase())).length;
    if (acceptedCount === 0) {
      console.error(JSON.stringify({ event: 'mail_rejected' }));
      return reply(502, { ok: false, error: 'Не удалось подтвердить отправку. Позвоните в клинику: +7 (499) 148-17-24.' });
    }
    if (acceptedCount < mailTo.length) {
      console.error(JSON.stringify({ event: 'mail_partial_delivery', acceptedCount, recipientCount: mailTo.length }));
    }
    console.info(JSON.stringify({ event: 'mail_send_completed', acceptedCount,
      recipientCount: mailTo.length, elapsedMs: Date.now() - startedAt }));
    return reply(200, { ok: true });
  } catch (error) {
    const timedOut = error?.code === 'ETIMEDOUT';
    const safeCode = ['ETIMEDOUT', 'EAUTH', 'ECONNECTION', 'ESOCKET', 'EDNS', 'EENVELOPE', 'EMESSAGE'].includes(error?.code)
      ? error.code : 'UNKNOWN';
    console.error(JSON.stringify({
      event: timedOut ? 'mail_timeout' : 'mail_send_failed',
      code: safeCode,
      elapsedMs: Date.now() - startedAt,
    }));
    // Do not retry automatically: Mail.ru might have accepted the message
    // even when its response was lost.
    return reply(timedOut ? 504 : 502, {
      ok: false,
      error: 'Не удалось подтвердить отправку. Позвоните в клинику: +7 (499) 148-17-24.',
    });
  }
};
