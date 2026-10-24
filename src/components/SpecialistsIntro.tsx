import { Link } from 'react-router-dom';
import { updateWaveOrigin } from '@/utils/updateWaveOrigin';
import styles from './SpecialistsIntro.module.scss';
import waveStyles from './Services.module.scss';

export default function SpecialistsIntro({ title }: { title: string }) {
  return (
    <h2 className={styles.heading}>
      <Link to="/doctors" className={`${styles.trigger} ${waveStyles.clickHintCard}`}
        onPointerEnter={updateWaveOrigin} onPointerMove={updateWaveOrigin}>
        <span className={styles.triggerText}>
          <span className={styles.label}>{title}</span>
          <span className={styles.hint}>Врачи, квалификация и документы</span>
        </span>
        <span className={styles.arrow} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </h2>
  );
}
