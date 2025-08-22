import React, { ReactNode } from 'react';
import TelegramIcon from './TelegramIcon';

type Props = {
  /**
   * Куда вести:
   * - 'your_clinic' или '@your_clinic' → станет https://t.me/your_clinic
   * - Полный URL (https://t.me/your_clinic) можно передать как есть
   */
  to: string;
  /** Для телеграм-ботов: добавит ?start=payload */
  start?: string;
  /** Вариант оформления: использует твои глобальные классы .btn--* */
  variant?: 'outline' | 'primary';
  /** Доп. классы (отступы и т.п.) */
  className?: string;
  /** Текст кнопки. По умолчанию "Telegram" */
  children?: ReactNode;
  /** Размер иконки */
  iconSize?: number | string;
  /** a11y-лейбл */
  ariaLabel?: string;
};

function toTelegramLink(to: string, start?: string) {
  const trimmed = (to || '').trim();
  const isFull = /^https?:\/\//i.test(trimmed);
  const user = isFull ? trimmed : `https://t.me/${trimmed.replace(/^@/, '')}`;
  if (!start) return user;
  const joiner = user.includes('?') ? '&' : '?';
  return `${user}${joiner}start=${encodeURIComponent(start)}`;
}

export default function TelegramButton({
  to,
  start,
  variant = 'outline',
  className,
  children = 'Telegram',
  iconSize = 18,
  ariaLabel = 'Написать в Telegram',
}: Props) {
  const href = toTelegramLink(to, start);
  const classes = `btn btn--${variant}${className ? ` ${className}` : ''}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      aria-label={ariaLabel}
    >
      <TelegramIcon size={iconSize} /> {children}
    </a>
  );
}
