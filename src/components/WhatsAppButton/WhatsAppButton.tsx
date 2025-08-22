import React, { ReactNode } from 'react';
import WhatsAppIcon from './WhatsAppIcon';

type Props = {
  /** Номер телефона в любом формате — '+7 (000) 000-00-00' или '70000000000' */
  phone: string;
  /** Предзаполненное сообщение в чат */
  message?: string;
  /** Вариант оформления (использует твои глобальные классы .btn--*) */
  variant?: 'outline' | 'primary';
  /** Доп. классы (например, для отступов) */
  className?: string;
  /** Текст внутри кнопки. По умолчанию "WhatsApp" */
  children?: ReactNode;
  /** Размер иконки, по умолчанию 18 */
  iconSize?: number | string;
  /** a11y-лейбл */
  ariaLabel?: string;
};

function toWaLink(phone: string, message?: string) {
  const digits = (phone || '').replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export default function WhatsAppButton({
  phone,
  message,
  variant = 'outline',
  className,
  children = 'WhatsApp',
  iconSize = 18,
  ariaLabel = 'Написать в WhatsApp',
}: Props) {
  const href = toWaLink(phone, message);
  const classes = `btn btn--${variant}${className ? ` ${className}` : ''}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      aria-label={ariaLabel}
    >
      <WhatsAppIcon size={iconSize} /> {children}
    </a>
  );
}
