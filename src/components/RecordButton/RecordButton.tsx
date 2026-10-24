import React, { useRef, useState } from 'react';
import RecordModal from '@/components/RecordModal';
import type { AppointmentType } from '@/data/contactRequests';

type Props = {
  children?: React.ReactNode; // текст на кнопке
  ariaLabel?: string;
  variant?: 'outline' | 'primary';
  className?: string;
  size?: string;
  onBeforeOpen?: () => void; // например, закрыть бургер-меню
  appointmentType?: AppointmentType;
};

const RecordButton: React.FC<Props> = ({
  children = 'Записаться',
  ariaLabel,
  className,
  onBeforeOpen,
  size = '16px',
  variant = 'outline',
  appointmentType = 'appointment',
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    onBeforeOpen?.();
    setOpen(true);
  };

  const classes = `btn btn--${variant}${className ? ` ${className}` : ''}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={classes}
        style={{ fontSize: `${size}` }}
        onClick={handleClick}
        aria-label={
          ariaLabel || (typeof children === 'string' ? children : 'Записаться')
        }
      >
        {children}
      </button>

      {open && <RecordModal isOpen={open} onClose={() => {
        setOpen(false);
        triggerRef.current?.focus();
      }} appointmentType={appointmentType} />}
    </>
  );
};

export default RecordButton;
