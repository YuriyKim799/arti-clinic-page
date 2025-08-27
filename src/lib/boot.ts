// Простой загрузочный модуль с реальным прогрессом и подпиской

type Listener = (percent: number) => void;

let started = false;
let done = false;
let progress = 0;
const listeners = new Set<Listener>();
let bootPromise: Promise<void> | null = null;

export function getBootProgress(): number {
  return progress;
}
export function isBootDone(): boolean {
  return done;
}
export function onBootProgress(cb: Listener): () => void {
  listeners.add(cb);
  cb(progress);
  // cleanup: строго () => void (не boolean)
  return () => {
    listeners.delete(cb);
  };
}

function setProgress(p: number) {
  const v = Math.max(0, Math.min(100, Math.round(p)));
  if (v !== progress) {
    progress = v;
    listeners.forEach((l) => l(v));
  }
}
function setDone() {
  done = true;
  setProgress(100);
}

// маленький helper
function preloadImage(url: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
    // ts-expect-error decode может отсутствовать
    if (img.decode)
      img
        .decode()
        .then(() => resolve())
        .catch(() => resolve());
  });
}

export function startBoot(): Promise<void> {
  if (started && bootPromise) return bootPromise;
  started = true;

  // 1) критические изображения героя (avif/webp, все ширины)
  const heroAvif = import.meta.glob('/src/assets/hero-doctor-*.avif', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>;
  const heroWebp = import.meta.glob('/src/assets/hero-doctor-*.webp', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>;
  const images = [...Object.values(heroAvif), ...Object.values(heroWebp)];

  // 2) шрифты
  const fontsReady =
    typeof document !== 'undefined' && (document as any).fonts?.ready
      ? (document as any).fonts.ready.then(() => {})
      : Promise.resolve();

  // 3) данные (если нет — не мешаем)
  const postsReady = fetch('/posts.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then(() => {})
    .catch(() => {});

  // простое «взвешивание» прогресса
  const W_IMG = 50;
  const W_FONT = 10;
  const W_POST = 40;
  const TOTAL = W_IMG + W_FONT + W_POST;
  let acc = 0;
  const inc = (d: number) => {
    acc += d;
    setProgress((acc / TOTAL) * 100);
  };

  const imagesTask = (async () => {
    if (!images.length) {
      inc(W_IMG);
      return;
    }
    const step = W_IMG / images.length;
    await Promise.all(images.map((u) => preloadImage(u).then(() => inc(step))));
  })();

  const fontsTask = fontsReady.then(() => inc(W_FONT));
  const postsTask = postsReady.then(() => inc(W_POST));

  bootPromise = Promise.all([imagesTask, fontsTask, postsTask])
    .then(() => setDone())
    .catch(() => setDone());

  return bootPromise;
}
