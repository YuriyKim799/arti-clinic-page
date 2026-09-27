import { useEffect, useId, useRef, useState } from 'react';
import styles from './SpecialistsIntro.module.scss';

export default function SpecialistsIntro({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const previousOverflow = document.documentElement.style.overflow;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';

    return () => {
      dialog.close();
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <h2 className={styles.heading}>
        <button
          type="button"
          className={styles.trigger}
          aria-haspopup="dialog"
          aria-controls={dialogId}
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span className={styles.triggerText}>
            <span className={styles.label}>{title}</span>
            <span className={styles.hint}>О подходе наших врачей · Подробнее</span>
          </span>
          <span className={styles.arrow} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </h2>

      <dialog
        ref={dialogRef}
        id={dialogId}
        className={styles.dialog}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (event.clientX < rect.left || event.clientX > rect.right ||
              event.clientY < rect.top || event.clientY > rect.bottom) {
            event.currentTarget.close();
          }
        }}
      >
        <button
          type="button"
          className={styles.close}
          aria-label="Закрыть информацию о специалистах"
          onClick={() => dialogRef.current?.close()}
          autoFocus
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <p className={styles.eyebrow}>Подход Арти Клиник</p>
        <h3 id={titleId} className={styles.dialogTitle}>{title}</h3>
        <div className={styles.copy}>
          <p>
            Врачи клиники — уникальные специалисты: каждый владеет сразу тремя
            направлениями — неврологией, рефлексотерапией и мануальной терапией.
            Это позволяет точнее разобраться в проблеме и сделать лечение
            максимально эффективным. Не нужно бегать от одного врача к другому
            и собирать противоречивые рекомендации — всё сосредоточено в одних
            руках. Такой подход позволяет снизить общую стоимость лечения:
            не придётся оплачивать множество разрозненных приёмов у разных
            специалистов.
          </p>
          <p>
            В «Арти Клиник» делают ставку на безопасные и доказательные методы
            нелекарственной терапии, а при необходимости грамотно сочетают их
            с медикаментозным лечением — всё под контролем опытных врачей.
          </p>
          <p>
            Главная цель «Арти Клиник» — не просто убрать боль, а помочь организму
            восстановиться и дальше справляться с нагрузками без срывов.
            Результат — не временное облегчение, а стабильное улучшение
            самочувствия и возвращение к привычной жизни.
          </p>
        </div>
      </dialog>
    </>
  );
}
