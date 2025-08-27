// import React, { useEffect, useMemo, useState } from 'react';
// import styles from './ArtiWordLoader.module.scss';

// type Props = {
//   bg?: string;
//   stepMs?: number;
//   autoHide?: boolean;
//   onDone?: () => void;
//   zIndex?: number;
// };

// const TEXT = 'АРТИ КЛИНИК';

// export default function ArtiWordLoader({
//   bg,
//   stepMs = 140,
//   autoHide = true,
//   onDone,
//   zIndex = 9999,
// }: Props) {
//   const chars = useMemo(() => [...TEXT], []);
//   const [leaving, setLeaving] = useState(false);

//   useEffect(() => {
//     if (!autoHide) return;
//     const total = stepMs * (chars.length - 1) + 700 + 250;
//     const t = window.setTimeout(() => setLeaving(true), total);
//     return () => window.clearTimeout(t);
//   }, [autoHide, chars.length, stepMs]);

//   useEffect(() => {
//     if (!leaving) return;
//     const t = window.setTimeout(() => onDone?.(), 450);
//     return () => window.clearTimeout(t);
//   }, [leaving, onDone]);

//   return (
//     <div
//       className={`${styles.overlay} ${leaving ? styles.leaving : ''}`}
//       style={{
//         background: bg ?? 'var(--bg, #f5f2ed)',
//         zIndex,
//       }}
//       aria-label="Загрузка Arti Clinic"
//       role="status"
//     >
//       <div
//         className={styles.word}
//         style={
//           {
//             ['--step' as any]: `${stepMs}ms`,
//             ['--last' as any]: chars.length - 1,
//           } as React.CSSProperties
//         }
//         aria-hidden="true"
//       >
//         {chars.map((ch, i) =>
//           ch === ' ' ? (
//             <span
//               key={`space-${i}`}
//               className={`${styles.char} ${styles.space}`}
//               style={{ ['--i' as any]: i } as React.CSSProperties}
//             >
//               &nbsp;
//             </span>
//           ) : (
//             <span
//               key={`${ch}-${i}`}
//               className={styles.char}
//               style={{ ['--i' as any]: i } as React.CSSProperties}
//             >
//               {ch}
//             </span>
//           )
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from 'react';
import styles from './ArtiWordLoader.module.scss';
import { onBootProgress, isBootDone } from '@/lib/boot';

type Props = {
  bg?: string;
  stepMs?: number; // только для скорости анимации букв
  autoHide?: boolean; // устарело: скрываемся по boot-событию
  onDone?: () => void;
  zIndex?: number;
};

const TEXT = 'АРТИ КЛИНИК';

export default function ArtiWordLoader({
  bg,
  stepMs = 140,
  autoHide = true, // совместимость со старым API (фактически не влияет)
  onDone,
  zIndex = 9999,
}: Props) {
  const chars = useMemo(() => [...TEXT], []);
  const [leaving, setLeaving] = useState(isBootDone());

  // Скрываемся по реальному событию готовности (boot), без искусственных задержек.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;

    // если уже готово к моменту монтирования — уходим сразу
    if (isBootDone()) {
      setLeaving(true);
      t = setTimeout(() => onDone?.(), 450);
    }

    const off = onBootProgress((p) => {
      if (p >= 100) {
        setLeaving(true);
        if (t) clearTimeout(t);
        t = setTimeout(() => onDone?.(), 450);
      }
    });

    return () => {
      off(); // отписка
      if (t) clearTimeout(t);
    };
  }, [onDone]);

  return (
    <div
      className={`${styles.overlay} ${leaving ? styles.leaving : ''}`}
      style={{
        background: bg ?? 'var(--bg, #f5f2ed)',
        zIndex,
      }}
      aria-label="Загрузка Arti Clinic"
      role="status"
    >
      <div
        className={styles.word}
        style={
          {
            ['--step' as any]: `${stepMs}ms`,
            ['--last' as any]: chars.length - 1,
          } as React.CSSProperties
        }
        aria-hidden="true"
      >
        {chars.map((ch, i) =>
          ch === ' ' ? (
            <span
              key={`space-${i}`}
              className={`${styles.char} ${styles.space}`}
              style={{ ['--i' as any]: i } as React.CSSProperties}
            >
              &nbsp;
            </span>
          ) : (
            <span
              key={`${ch}-${i}`}
              className={styles.char}
              style={{ ['--i' as any]: i } as React.CSSProperties}
            >
              {ch}
            </span>
          )
        )}
      </div>
    </div>
  );
}
