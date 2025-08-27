import React, { useRef, useState } from 'react';
import styles from './ContactForm.module.scss';
import { Link } from 'react-router-dom';

const PHONE_PREFIX = '+7';
const LOCAL_MAX = 10; // 10 локальных цифр
const SEPARATORS = new Set([' ', '(', ')', '-']);
const MIN_POS = PHONE_PREFIX.length; // нельзя удалять "+7"

const extractLocalDigits = (value: string) => {
  let d = value.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (d.startsWith('7')) d = d.slice(1);
  return d.slice(0, LOCAL_MAX);
};

function prettyPage(href: string) {
  try {
    const u = new URL(href);
    const decodedHash = u.hash ? decodeURIComponent(u.hash.slice(1)) : '';
    const section = decodedHash
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (c) => c.toLocaleUpperCase('ru-RU'));

    const base = `${u.origin}${u.pathname}`;
    return {
      raw: href, // сырой URL (как сейчас)
      text: section ? `${base} — ${section}` : base, // читаемо для сообщения
      section, // опционально: чистое название секции
    };
  } catch {
    // на всякий
    return { raw: href, text: decodeURI(href), section: '' };
  }
}

const formatPhone = (local: string) => {
  const p1 = local.slice(0, 3);
  const p2 = local.slice(3, 6);
  const p3 = local.slice(6, 8);
  const p4 = local.slice(8, 10);
  let res = PHONE_PREFIX;
  if (local.length > 0) res += ` (${p1}`;
  if (local.length >= 3) res += `)`;
  if (local.length > 3) res += ` ${p2}`;
  if (local.length > 6) res += `-${p3}`;
  if (local.length > 8) res += `-${p4}`;
  return res;
};

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', phone: '', agree: false });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const hpRef = useRef<HTMLInputElement>(null);
  const t0Ref = useRef<number>(Date.now());

  const handlePhoneFocus: React.FocusEventHandler<HTMLInputElement> = () => {
    setForm((prev) =>
      prev.phone.startsWith(PHONE_PREFIX)
        ? prev
        : { ...prev, phone: PHONE_PREFIX + ' ' }
    );
    requestAnimationFrame(() => {
      const el = phoneRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const handlePhoneKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (
    e
  ) => {
    const el = e.currentTarget;
    const selStart = el.selectionStart ?? 0;
    const selEnd = el.selectionEnd ?? selStart;

    // Разрешаем удалять, если есть выделение (React сам отдаст onChange, мы отформатируем)
    if (selStart !== selEnd) return;

    // Блокируем удаление самого префикса
    if (
      (e.key === 'Backspace' && selStart <= MIN_POS) ||
      (e.key === 'Delete' && selStart < MIN_POS)
    ) {
      e.preventDefault();
      el.setSelectionRange(MIN_POS, MIN_POS);
      return;
    }

    // Умный backspace: если слева разделитель — перепрыгнем за него к цифре
    if (e.key === 'Backspace' && selStart > MIN_POS) {
      const leftChar = el.value[selStart - 1];
      if (SEPARATORS.has(leftChar)) {
        e.preventDefault();
        const newPos = selStart - 1;
        el.setSelectionRange(newPos, newPos);
      }
    }

    // Умный delete: если справа разделитель — перепрыгнем его
    if (e.key === 'Delete') {
      const rightChar = el.value[selStart];
      if (SEPARATORS.has(rightChar)) {
        e.preventDefault();
        const newPos = selStart + 1;
        el.setSelectionRange(newPos, newPos);
      }
    }
  };

  const handlePhonePaste: React.ClipboardEventHandler<HTMLInputElement> = (
    e
  ) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const local = extractLocalDigits(text);
    const formatted = formatPhone(local);
    setForm((prev) => ({
      ...prev,
      phone: local ? formatted : PHONE_PREFIX + ' ',
    }));
    requestAnimationFrame(() => {
      const el = phoneRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const handlePhoneChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const local = extractLocalDigits(e.target.value);
    const formatted = formatPhone(local);
    setForm((prev) => ({
      ...prev,
      phone: local ? formatted : PHONE_PREFIX + ' ',
    }));
    requestAnimationFrame(() => {
      const el = phoneRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const t = e.target as HTMLInputElement;
    const { name, value, type, checked } = t;
    if (name === 'phone') return;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const localDigits = extractLocalDigits(form.phone);
    if (!form.name.trim() || localDigits.length < LOCAL_MAX) {
      setError('Проверьте корректность имени и телефона.');
      return;
    }
    if (!form.agree) {
      setError('Необходимо согласие на обработку персональных данных.');
      return;
    }

    const href = typeof window !== 'undefined' ? window.location.href : '';
    const pagePretty = prettyPage(href);

    setLoading(true);
    try {
      // отправляем на наш бэкенд, который уже стучится в Telegram Bot API
      const res = await fetch(
        'https://functions.yandexcloud.net/d4ehvps5uj8pkr10vkjs',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone,
            page_text: pagePretty.text, // НОВОЕ: "https://.../price-list — Рефлексотерапевтические массажи"
            page_section: pagePretty.section, // НОВОЕ: "Рефлексотерапевтические массажи" (если нужно)
            page: typeof window !== 'undefined' ? window.location.href : '',
            website: hpRef.current?.value || '',
            t0: t0Ref.current,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Ошибка отправки');
      }

      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Не удалось отправить. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={styles.thanks}>
        <h3>Спасибо! Заявка отправлена.</h3>
        <p className="muted">Мы свяжемся с вами в ближайшее время.</p>
      </div>
    );
  }

  return (
    <form id="record" onSubmit={handleSubmit} className={styles.form}>
      <label>
        Имя*
        <input
          type="text"
          name="name"
          placeholder="Ваше имя"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        Телефон*
        <input
          ref={phoneRef}
          type="tel"
          name="phone"
          placeholder="+7 (___) ___-__-__"
          inputMode="tel"
          autoComplete="tel"
          value={form.phone}
          onFocus={handlePhoneFocus}
          onKeyDown={handlePhoneKeyDown}
          onPaste={handlePhonePaste}
          onChange={handlePhoneChange}
          required
        />
      </label>

      <div className={styles.agreement}>
        <div className={styles.agreementCheckbox}>
          <input
            type="checkbox"
            id="agreement_main"
            name="agree"
            required
            checked={form.agree}
            onChange={handleChange}
          />
          <label htmlFor="agreement_main">
            <span>
              Я даю{' '}
              <Link to="/agreement">
                Согласие на обработку персональных данных
              </Link>{' '}
              на условиях{' '}
              <Link to="/politic">
                Политики в отношении обработки персональных данных
              </Link>
            </span>
          </label>
        </div>
      </div>

      <div className={styles.hp} aria-hidden>
        <label>
          Ваш сайт
          <input
            ref={hpRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <button type="submit" className="btn btn--primary" disabled={loading}>
        {loading ? 'Отправка…' : 'Записаться'}
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
