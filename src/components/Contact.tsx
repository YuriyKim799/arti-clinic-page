import React, { useState, useRef } from 'react';
import styles from './Contact.module.scss';
import { useInView } from '../useInView';
import IconPhone from '@/icons/IconPhone';
import IconStatPhone from '@/icons/IconStatPhone';
import ContactForm from './ContactForm';

const PHONE_PREFIX = '+7'; // фиксированный префикс
const LOCAL_MAX = 10; // количество локальных цифр (без кода страны)

export const Contact: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', agree: false });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !/^\+?[0-9\s()-]{7,}$/.test(form.phone)) {
      setError('Проверьте корректность имени и телефона.');
      return;
    }
    if (!form.agree) {
      setError('Необходимо согласие на обработку персональных данных.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
    } catch {
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
          {/* ЛЕВАЯ КАРТОЧКА: Контакты */}
          <div className={styles.card}>
            <h2 className="section-title">Контакты</h2>
            <p className="muted">
              Адрес: г.Москва, ул.1812 года, д.3 (вход со двора)
            </p>
            <p className="muted">Пн–Сб 09:00–20:00 · Вс 10:00–18:00</p>

            <div className={styles.mapWrap} aria-label="Карта проезда">
              {isIntersecting ? (
                <iframe
                  src="https://yandex.ru/map-widget/v1/?um=constructor%3A36a05065fdb74d8fc24a80537025028adf2c62fa1de162cfbfa0a0c7bb518f1b&source=constructor&scroll=true&lang=ru_RU"
                  title="Карта Arti Clinic"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className={styles.mapIframe}
                />
              ) : (
                <div className={styles.mapSkeleton} />
              )}
            </div>

            {/* НОВЫЙ симметричный блок телефонов */}
            <div className={styles.contactsPanel}>
              <a href="tel:+74991481724" className={styles.contactCard}>
                <span className={styles.icon}>
                  <IconStatPhone width={22} height={22} aria-hidden />
                </span>
                <span className={styles.contactText}>
                  <span className={styles.contactNumber}>
                    8 (499) 148-17-24
                  </span>
                </span>
              </a>

              <a href="tel:+79998310636" className={styles.contactCard}>
                <span className={styles.icon}>
                  <IconPhone width={22} height={22} aria-hidden />
                </span>
                <span className={styles.contactText}>
                  <span className={styles.contactNumber}>
                    8 (999) 831-06-36
                  </span>
                </span>
              </a>
            </div>

            {/* Мессенджеры – в две колонки, симметрично */}
            <div className={styles.messengersRow}>
              <a
                href="https://wa.me/79998310636"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.messengerBtn}
              >
                WhatsApp
              </a>
              <a
                href="https://t.me/your_clinic"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.messengerBtn}
              >
                Telegram
              </a>
            </div>
          </div>

          {/* ПРАВАЯ КАРТОЧКА: Форма */}
          <div className={styles.card}>
            <h2 className="section-title">Онлайн-запись</h2>
            {!sent ? (
              <ContactForm />
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
