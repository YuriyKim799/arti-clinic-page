
import React from 'react'
import styles from './Footer.module.scss'

export const Footer: React.FC = () => {
  const year = new Date().getFullYear()
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.row}>
          <div className={styles.brand}>
            <strong>Arti Clinic</strong>
            <span className="muted">Центр лечения межпозвоночной грыжи и иглотерапии</span>
          </div>
          <nav className={styles.nav}>
            <a href="#">Политика конфиденциальности</a>
            <a href="#">Пользовательское соглашение</a>
          </nav>
        </div>
        <div className={styles.copy}>© {year} Arti Clinic</div>
      </div>
    </footer>
  )
}
