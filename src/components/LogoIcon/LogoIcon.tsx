import React from 'react';
import styles from './LogoIcon.module.scss';
import logoUrl from '@/assets/imagename.svg';

type Props = {
  /** размер иконки. Число = px. Можно строку типа '2.5rem' */
  size?: number | string;
  /** доп. классы, если нужно переопределить стили снаружи */
  className?: string;
  /** alt-текст. Если оставить пустым — иконка считается декоративной */
  alt?: string;
};

export default function LogoIcon({ size = 80, className, alt = '' }: Props) {
  const wh = typeof size === 'number' ? `${size}px` : size;

  return (
    <img
      src={logoUrl}
      alt={alt}
      aria-hidden={alt === '' ? true : undefined}
      className={`${styles.logoIcon}${className ? ' ' + className : ''}`}
      style={{ width: wh, height: wh }}
    />
  );
}
