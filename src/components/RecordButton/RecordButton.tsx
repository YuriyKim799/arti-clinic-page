import React, { useState } from 'react';
import RecordModal from '@/components/RecordModal';

type Props = {
  children?: React.ReactNode; // текст на кнопке
  ariaLabel?: string;
  variant?: 'outline' | 'primary';
  className?: string;
  size?: string;
  onBeforeOpen?: () => void; // например, закрыть бургер-меню
};

const RecordButton: React.FC<Props> = ({
  children = 'Записаться',
  ariaLabel,
  className,
  onBeforeOpen,
  size = '16px',
  variant = 'outline',
}) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    onBeforeOpen?.();
    setOpen(true);
  };

  const classes = `btn btn--${variant}${className ? ` ${className}` : ''}`;

  return (
    <>
      <button
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

      {open && <RecordModal isOpen={open} onClose={() => setOpen(false)} />}
    </>
  );
};

export default RecordButton;
