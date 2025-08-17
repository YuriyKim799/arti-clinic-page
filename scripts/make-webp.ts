// scripts/make-webp.ts
import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import sharp from 'sharp';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'public', 'blog');

// Какие ширины рендерим (можешь сократить для скорости)
const WIDTHS = [480, 768, 1024, 1440, 1920] as const;

// ---- простейший разбор аргументов CLI ----
// флаги: --force, --slug=xxx, --dir=public/blog/xxx, --concurrency=4, --webp-only, --jpg-only, --dry-run
type Argv = Record<string, string | boolean>;
const argv: Argv = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) {
    const [k, v] = a.slice(2).split('=');
    argv[k] = v ?? true;
  }
}
const FORCE = argv.force === true || argv.force === '1';
const ONLY_WEBP = argv['webp-only'] === true;
const ONLY_JPG = argv['jpg-only'] === true;
const DRY_RUN = argv['dry-run'] === true;
const CONCURRENCY = Math.max(1, Math.min(16, Number(argv.concurrency ?? 4)));

// Паттерны, по которым считаем файл НЕоригиналом (уже какой-то ресайз/вариант)
const NON_ORIGINAL_SUFFIXES = [
  /-\d+(?=\.(?:jpg|jpeg|png)$)/i, // -1200.jpg
  /-\d+x\d+(?=\.(?:jpg|jpeg|png)$)/i, // -1200x800.jpg
  /@(?:2x|3x)(?=\.(?:jpg|jpeg|png)$)/i, // @2x/@3x
  /-(?:small|thumb|mini|medium|large)(?=\.(?:jpg|jpeg|png)$)/i, // -thumb.jpg и т.п.
];

// Наши собственные выходные суффиксы (чтобы случайно не принять их за оригиналы)
const OUR_SIZE_SUFFIX_RE = new RegExp(
  `-(?:${WIDTHS.join('|')})\\.(?:jpg|jpeg|png)$`,
  'i'
);

function looksLikeNonOriginal(filePath: string): boolean {
  const base = path.basename(filePath);
  return (
    NON_ORIGINAL_SUFFIXES.some((re) => re.test(base)) ||
    OUR_SIZE_SUFFIX_RE.test(base)
  );
}

function isOriginalCandidate(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return false;
  // Оригинал — если НЕ попадает под никакой неоригинальный паттерн
  return !looksLikeNonOriginal(filePath);
}

function isFresh(src: string, dst: string): boolean {
  if (!fs.existsSync(dst)) return false;
  const srcM = fs.statSync(src).mtimeMs;
  const dstM = fs.statSync(dst).mtimeMs;
  return dstM >= srcM;
}

// простой mapLimit без внешних зависимостей
async function mapLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T, idx: number) => Promise<void>
) {
  let i = 0,
    inFlight = 0,
    err: any = null;
  return new Promise<void>((resolve, reject) => {
    const next = () => {
      if (err) return;
      if (i >= items.length && inFlight === 0) return resolve();
      while (inFlight < limit && i < items.length) {
        const idx = i++;
        inFlight++;
        fn(items[idx], idx)
          .catch((e) => (err = e))
          .finally(() => {
            inFlight--;
            err ? reject(err) : next();
          });
      }
    };
    next();
  });
}

async function processOriginal(absPath: string) {
  const ext = path.extname(absPath);
  const dir = path.dirname(absPath);
  const base = path.basename(absPath, ext);

  // не апскейлим — рендерим только размеры <= исходного
  const meta = await sharp(absPath).metadata();
  const maxWidth = meta.width ?? Math.max(...WIDTHS);
  const effWidths = WIDTHS.filter((w) => w <= maxWidth);

  for (const w of effWidths) {
    const outJpg = path.join(dir, `${base}-${w}.jpg`);
    const outWebp = path.join(dir, `${base}-${w}.webp`);

    if (!ONLY_WEBP) {
      if (FORCE || !isFresh(absPath, outJpg)) {
        if (DRY_RUN) {
          console.log('[dry-run] jpg ', path.relative(ROOT, outJpg));
        } else {
          await sharp(absPath)
            .resize({ width: w, withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(outJpg);
        }
      }
    }

    if (!ONLY_JPG) {
      if (FORCE || !isFresh(absPath, outWebp)) {
        if (DRY_RUN) {
          console.log('[dry-run] webp', path.relative(ROOT, outWebp));
        } else {
          await sharp(absPath)
            .resize({ width: w, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(outWebp);
        }
      }
    }
  }
}

async function main() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.log('[webp] нет каталога', BLOG_DIR);
    return;
  }

  // Ограничение области: --slug=xxx или --dir=...
  let searchCwd = BLOG_DIR;
  if (typeof argv.dir === 'string') {
    searchCwd = path.isAbsolute(argv.dir)
      ? argv.dir
      : path.join(ROOT, argv.dir);
  } else if (typeof argv.slug === 'string') {
    searchCwd = path.join(BLOG_DIR, argv.slug);
  }

  // Ищем только jpg/png (webp пропускаем), а отбор оригиналов сделаем кодом
  const candidates = await fg(['**/*.{jpg,jpeg,png}'], {
    cwd: searchCwd,
    absolute: true,
  });

  const originals = candidates.filter(isOriginalCandidate);
  if (!originals.length) {
    console.log(
      '[webp] оригиналов не найдено в',
      path.relative(ROOT, searchCwd) || '.'
    );
    return;
  }

  console.log(
    `[webp] originals: ${originals.length} | dir=${
      path.relative(ROOT, searchCwd) || '.'
    } | conc=${CONCURRENCY} | force=${FORCE ? 'yes' : 'no'} | dry=${
      DRY_RUN ? 'yes' : 'no'
    }`
  );

  let done = 0;
  const t0 = Date.now();

  await mapLimit(originals, CONCURRENCY, async (img) => {
    await processOriginal(img);
    done++;
    if (done % 20 === 0 || done === originals.length) {
      const dt = (Date.now() - t0) / 1000;
      const rate = (done / dt).toFixed(2);
      console.log(`[webp] ${done}/${originals.length} (${rate} img/s)`);
    }
  });

  console.log('[webp] done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
