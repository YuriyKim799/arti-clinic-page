const mailer = require('./send-mail');
const { ALLOWED_ORIGINS } = process.env;

const ORIGINS = (ALLOWED_ORIGINS || 'https://articlinic.ru')
  .split(',').map(s => s.trim()).filter(Boolean);
const MAX_BODY_BYTES = 4 * 1024;
const MIN_FILL_MS = 900;

const escapeHtml = (s = '') => s.replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[ch]));

function humanizePage(page, pageText) {
  if (!page) return '';
  try {
    const u = new URL(page);
    if (!['http:', 'https:'].includes(u.protocol)) return escapeHtml(pageText || page);
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
  const mailTo = (process.env.MAIL_TO || 'kimskiy@mail.ru').trim();
  const isMailbox = value => /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value);
  if (!isMailbox(smtpUser) || !smtpPassword || !isMailbox(mailTo)) {
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

  const website = String(data.website ?? '').trim();
  const t0 = Number(data.t0) || 0;
  if (website) return reply(204);
  if (t0 && Date.now() - t0 < MIN_FILL_MS) {
    return reply(429, { ok: false, error: 'Подождите несколько секунд и отправьте форму ещё раз.' });
  }

  const name = String(data.name || '').trim().slice(0, 100);
  const phone = String(data.phone || '').trim().slice(0, 50);
  const page = String(data.page || '').trim().slice(0, 300);
  const pageText = String(data.page_text || '').trim().slice(0, 300);
  if (!name || !phone) return reply(400, { ok: false, error: 'Укажите имя и телефон.' });

  const lines = [
    '📬 <b>Новая заявка</b>',
    `<b>Имя:</b> ${escapeHtml(name)}`,
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
      to: { address: mailTo },
      subject: 'Новая заявка на запись — Арти Клиник',
      text: ['Новая заявка', `Имя: ${name}`, `Телефон: ${phone}`,
        ...(page ? [`Страница: ${page}`, ...(pageText ? [pageText] : [])] : [])].join('\n'),
      html: lines.map(line => `<p>${line}</p>`).join('\n'),
    });
    if (!result?.accepted?.some(address => address.toLowerCase() === mailTo.toLowerCase())) {
      console.error(JSON.stringify({ event: 'mail_rejected' }));
      return reply(502, { ok: false, error: 'Не удалось подтвердить отправку. Позвоните в клинику: +7 (499) 148-17-24.' });
    }
    console.info(JSON.stringify({ event: 'mail_send_completed', elapsedMs: Date.now() - startedAt }));
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
