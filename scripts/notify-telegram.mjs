import path from 'node:path';
import { fileURLToPath } from 'node:url';

const headings = {
  app: { success: '✅ Сайт опубликован: приложение', failure: '❌ Ошибка публикации приложения' },
  content: { success: '✅ Контент сайта опубликован', failure: '❌ Ошибка публикации контента' },
  routing: { success: '✅ Перенаправления сайта обновлены', failure: '❌ Ошибка обновления перенаправлений' },
};

export function buildDeploymentMessage(scope, status, env = process.env) {
  if (!Object.hasOwn(headings, scope) || !Object.hasOwn(headings[scope], status)) {
    throw Error('Notification requires scope app, content or routing and status success or failure');
  }
  const field = name => String(env[name] || 'не указан').replace(/[\r\n\t]/g, ' ').slice(0, 200);
  const repository = field('GITHUB_REPOSITORY');
  const runId = field('GITHUB_RUN_ID');
  const run = /^[\w.-]+\/[\w.-]+$/.test(repository) && /^\d+$/.test(runId)
    ? `https://github.com/${repository}/actions/runs/${runId}`
    : 'не указан';
  return [
    headings[scope][status],
    `Репозиторий: ${repository}`,
    `Ветка: ${field('GITHUB_REF_NAME')}`,
    `Коммит: ${field('GITHUB_SHA')}`,
    `Автор: ${field('GITHUB_ACTOR')}`,
    `Сборка: ${run}`,
  ].join('\n');
}

/** Sends one request; ambiguous network failures are not retried to avoid duplicate notifications. */
export async function sendDeploymentNotification(scope, status, options = {}) {
  const env = options.env ?? process.env;
  const text = buildDeploymentMessage(scope, status, env);
  const token = String(env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const chat = String(env.TELEGRAM_CHAT_ID ?? '').trim();
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token) || !/^(?:-?\d+|@[A-Za-z0-9_]+)$/.test(chat)) {
    throw Error('Telegram notification credentials are missing or invalid');
  }
  let response;
  try {
    response = await (options.fetch ?? globalThis.fetch)(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ chat_id: chat, text }),
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw Error('Telegram notification request failed or timed out; delivery was not confirmed');
  }
  if (!response.ok) throw Error(`Telegram notification was rejected (HTTP ${response.status}); delivery was not confirmed`);
  let data;
  try { data = await response.json(); }
  catch { throw Error('Telegram notification returned invalid JSON; delivery was not confirmed'); }
  const messageId = data?.result?.message_id;
  if (data?.ok !== true || !Number.isSafeInteger(messageId) || messageId <= 0) {
    throw Error('Telegram API did not confirm an accepted message; delivery was not confirmed');
  }
  return { scope, status, messageId };
}

const normalizeEntrypoint = filename => process.platform === 'win32' ? path.resolve(filename).toLowerCase() : path.resolve(filename);
if (process.argv[1] && normalizeEntrypoint(process.argv[1]) === normalizeEntrypoint(fileURLToPath(import.meta.url))) {
  try {
    const result = await sendDeploymentNotification(process.argv[2], process.argv[3]);
    console.log(`[telegram] accepted scope=${result.scope} status=${result.status} message_id=${result.messageId}`);
  } catch (error) {
    // All exported errors are controlled messages; neither the request URL nor server response is printed.
    console.error(`[telegram] ${error instanceof Error ? error.message : 'Notification failed; delivery was not confirmed'}`);
    process.exitCode = 1;
  }
}
