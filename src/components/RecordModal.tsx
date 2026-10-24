import { useId, useRef, type KeyboardEvent } from 'react';
import ContactForm from './ContactForm';
import { contactRequests, type AppointmentType } from '@/data/contactRequests';
import Modal from './Modal';
import styles from './RecordModal.module.scss';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentType?: AppointmentType;
}

export default function RecordModal({ isOpen, onClose, appointmentType = 'appointment' }: RecordModalProps) {
  const request = appointmentType === 'appointment' ? null : contactRequests[appointmentType];
  const titleId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const keepFocusInDialog = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;
    const controls = wrapperRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]):not([tabindex="-1"])'
    );
    if (!controls?.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div ref={wrapperRef} className={styles.wrapper} role="dialog" aria-modal="true" aria-labelledby={request ? titleId : undefined} aria-label={request ? undefined : 'Запись на приём'} onKeyDown={keepFocusInDialog}>
        <button
          type="button"
          className={styles.close}
          aria-label="Закрыть"
          onClick={onClose}
        >
          ×
        </button>
        {request && (
          <header className={styles.intro}>
            <p className={styles.eyebrow}>Ким Алина Александровна</p>
            <h2 id={titleId}>{request.title}</h2>
            <p>{request.description}</p>
          </header>
        )}
        <ContactForm appointmentType={appointmentType} />
      </div>
    </Modal>
  );
}
