import React from 'react';
import styles from './Blog.module.scss';
import { useInView } from '../useInView';

const posts = [
  {
    title: 'Что такое межпозвоночная грыжа и как её лечат',
    img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1480&auto=format&fit=crop',
    excerpt:
      'Разбираем причины, симптомы и современные подходы к терапии. Когда нужна операция, а когда — консервативное лечение.',
    link: '#',
  },
  {
    title: 'Иглоукалывание: польза и показания',
    img: 'https://images.unsplash.com/photo-1629276301680-3d3acda6afa3?q=80&w=1480&auto=format&fit=crop',
    excerpt:
      'Как работает акупунктура, что чувствует пациент и сколько сеансов требуется для заметного эффекта.',
    link: '#',
  },
  {
    title: '5 привычек для здоровой спины',
    img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=1480&auto=format&fit=crop',
    excerpt:
      'Простые ежедневные действия, которые помогают поддерживать позвоночник и предотвращать боль.',
    link: '#',
  },
];

export const Blog: React.FC = () => {
  const { ref, isIntersecting } = useInView<HTMLDivElement>();

  return (
    <section id="blog" className={`section ${styles.section}`}>
      <div
        ref={ref}
        className={`container reveal ${isIntersecting ? 'is-visible' : ''}`}
      >
        <h2 className="section-title">Блог</h2>
        <div className={styles.grid}>
          {posts.map((p, i) => (
            <article key={i} className={styles.card}>
              <a
                href={p.link}
                className={styles.imageLink}
                aria-label={p.title}
              >
                <img src={p.img} alt="" loading="lazy" />
              </a>
              <div className={styles.body}>
                <h3 className={styles.title}>{p.title}</h3>
                <p className={styles.excerpt}>{p.excerpt}</p>
                <a href={p.link} className={styles.more}>
                  Читать статью →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
