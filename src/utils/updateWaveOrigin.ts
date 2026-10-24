import type { PointerEventHandler } from 'react';

export const updateWaveOrigin: PointerEventHandler<HTMLAnchorElement> = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--wave-x', `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty('--wave-y', `${event.clientY - rect.top}px`);
};
