import ContactForm from './ContactForm';
import Modal from './Modal';
import styles from './RecordModal.module.scss';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RecordModal({ isOpen, onClose }: RecordModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className={styles.wrapper}>
        <button
          type="button"
          className={styles.close}
          aria-label="Закрыть"
          onClick={onClose}
        >
          ×
        </button>
        <ContactForm />
      </div>
    </Modal>
  );
}
