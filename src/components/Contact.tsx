import React, { useState } from 'react';
import styles from './Contact.module.scss';
import { useInView } from '../useInView';

export const Contact: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', service: '' });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !/^\+?[0-9\s()-]{7,}$/.test(form.phone)) {
      setError('Проверьте корректность имени и телефона.');
      return;
    }

    setLoading(true);
    try {
      // Заглушка отправки формы.
      // Замените на ваш бэкенд / Telegram Bot / почту.
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
    } catch (e) {
      setError('Не удалось отправить. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className={`section ${styles.section}`}>
      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2 className="section-title">Контакты</h2>
            <p className="muted">
              Адрес: укажите адрес клиники и график работы
            </p>
            <div className={styles.mapWrap} aria-label="Карта проезда">
              <iframe
                src="https://yandex.com/map-widget/v1/?um=constructor%3A&source=constructor"
                title="Карта Arti Clinic"
                loading="lazy"
                allowFullScreen
              ></iframe>
            </div>
            <div className={styles.contacts}>
              <a href="tel:+70000000000">+7 (000) 000-00-00</a>
              <a href="mailto:info@arti.clinic">info@arti.clinic</a>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className="section-title">Онлайн-запись</h2>
            {!sent ? (
              <form id="record" onSubmit={handleSubmit} className={styles.form}>
                <label>
                  Имя*
                  <input
                    type="text"
                    name="name"
                    placeholder="Ваше имя"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Телефон*
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+7 (___) ___-__-__"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label>
                  Услуга
                  <select
                    name="service"
                    value={form.service}
                    onChange={handleChange}
                  >
                    <option value="">Выберите услугу</option>
                    <option value="hernia">Лечение межпозвоночной грыжи</option>
                    <option value="acupuncture">Иглоукалывание</option>
                    <option value="rehab">Реабилитация / ЛФК</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading}
                >
                  {loading ? 'Отправка…' : 'Записаться'}
                </button>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.messengers}>
                  <a
                    href="https://wa.me/70000000000"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--outline"
                  >
                    Написать в WhatsApp
                  </a>
                  <a
                    href="https://t.me/your_clinic"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--outline"
                  >
                    Написать в Telegram
                  </a>
                </div>
              </form>
            ) : (
              <div className={styles.thanks}>
                <h3>Спасибо! Заявка отправлена.</h3>
                <p className="muted">Мы свяжемся с вами в ближайшее время.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
