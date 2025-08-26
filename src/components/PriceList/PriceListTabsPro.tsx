// src/components/PriceList/PriceListTabsPro.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './PriceListTabsPro.module.scss';
import { PRICE_CATEGORIES, PriceItem, slugify } from '../../data/priceList';

type Props = {
  hideInternalToc?: boolean;
  className?: string;
  scrollOffset?: number; // px
  onActiveChange?: (index: number) => void;
};

const LS_KEY = 'arti-price-tab-index';

export default function PriceListTabsPro({
  hideInternalToc = false,
  className,
  scrollOffset = 90,
  onActiveChange,
}: Props) {
  const [active, setActive] = useState(0);
  const [q, setQ] = useState('');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Поиск
  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (qq.length < 2) return [] as { cat: string; item: PriceItem }[];
    const out: { cat: string; item: PriceItem }[] = [];
    for (const c of PRICE_CATEGORIES) {
      for (const it of c.items) {
        if (it.title.toLowerCase().includes(qq))
          out.push({ cat: c.title, item: it });
      }
    }
    return out;
  }, [q]);

  // Скролл к панели
  const scrollToPanel = (id: string) => {
    const el = sectionRefs.current[`panel-${id}`];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const y = rect.top + window.scrollY - scrollOffset;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  };

  const setActiveAndSync = (i: number, doScroll = true) => {
    setActive(i);
    const id = slugify(PRICE_CATEGORIES[i].title);
    history.replaceState(null, '', `#${id}`);
    try {
      localStorage.setItem(LS_KEY, String(i));
    } catch {}
    if (onActiveChange) onActiveChange(i);
    if (doScroll) scrollToPanel(id);
  };

  // Инициализация: hash → localStorage → 0
  useEffect(() => {
    const h = decodeURIComponent(window.location.hash || '').replace(/^#/, '');
    const byHash = PRICE_CATEGORIES.findIndex((c) => slugify(c.title) === h);
    if (byHash >= 0) {
      setActive(byHash);
      return;
    }
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setActive(Number(saved));
    } catch {}
  }, []);

  // Реакция на внешнее изменение hash
  useEffect(() => {
    const onHash = () => {
      const h = decodeURIComponent(window.location.hash || '').replace(
        /^#/,
        ''
      );
      const idx = PRICE_CATEGORIES.findIndex((c) => slugify(c.title) === h);
      if (idx >= 0) setActiveAndSync(idx, true);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return (
    <section className={`${styles.wrap} ${className ?? ''}`}>
      <header className={styles.header}>
        <h2 className={styles.title}>Стоимость услуг</h2>
      </header>

      {!hideInternalToc && (
        <nav className={styles.toc} aria-label="Оглавление">
          <ul className={styles.tocList}>
            {PRICE_CATEGORIES.map((c) => (
              <li key={c.title}>
                <a href={`#${slugify(c.title)}`}>{c.title}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className={styles.controls}>
        <input
          id="price-tabs-search"
          name="price-tabs-search"
          type="search"
          placeholder="Поиск услуги..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={styles.search}
          aria-label="Поиск по услугам"
          autoComplete="off"
        />

        <div
          className={styles.tablist}
          role="tablist"
          aria-label="Разделы прайса"
        >
          {PRICE_CATEGORIES.map((c, i) => (
            <button
              key={c.title}
              role="tab"
              aria-selected={i === active}
              aria-controls={`panel-${slugify(c.title)}`}
              id={`tab-${slugify(c.title)}`}
              className={
                i === active ? `${styles.tab} ${styles.active}` : styles.tab
              }
              onClick={() => setActiveAndSync(i, true)}
              type="button"
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {q.trim().length >= 2 && (
        <section id="results" className={styles.results}>
          <h3>Результаты поиска: {results.length}</h3>
          {results.length === 0 ? (
            <p className={styles.muted}>
              Ничего не найдено. Попробуйте изменить запрос.
            </p>
          ) : (
            <ul className={styles.items}>
              {results.map((r, idx) => (
                <li key={idx} className={styles.item}>
                  <span className={styles.itemTitle}>{r.item.title}</span>
                  <span className={styles.price}>{r.item.price}</span>
                  <span className={styles.catBadge}>{r.cat}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div className={styles.panels}>
        {PRICE_CATEGORIES.map((c, i) => {
          const id = slugify(c.title);
          const show = i === active && q.trim().length < 2;
          return (
            <section
              key={c.title}
              role="tabpanel"
              id={`panel-${id}`}
              aria-labelledby={`tab-${id}`}
              className={show ? `${styles.panel} ${styles.show}` : styles.panel}
              ref={(el) => {
                sectionRefs.current[`panel-${id}`] = el;
              }}
            >
              <a id={id} className={styles.anchor} aria-hidden />
              <h3 className={styles.panelTitle}>{c.title}</h3>
              <ul className={styles.items}>
                {c.items.map((it) => (
                  <li key={`${c.title}-${it.title}`} className={styles.item}>
                    <span className={styles.itemTitle}>{it.title}</span>
                    <span className={styles.price}>{it.price}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
