import React from 'react';

type Props = {
  size?: number | string;
  className?: string;
  title?: string; // для a11y, если нужно
};

export default function TelegramIcon({ size = 18, className, title }: Props) {
  const wh = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg
      width={wh}
      height={wh}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M23.05 2.52c.39-.16.8.2.69.6L19.6 20.88c-.1.44-.6.62-.97.37l-5.38-3.86-2.6 2.52c-.28.27-.73.15-.86-.22L8.3 14.9l-5.64-2.2c-.42-.17-.43-.76-.02-.95L23.05 2.52zM9.27 13.74l1.06 3.14 1.56-1.5 6.58-9.94-9.2 7.43z"
        fill="currentColor"
      />
    </svg>
  );
}
