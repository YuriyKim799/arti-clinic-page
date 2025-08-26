// process-images.js  (Node >= 18, "type" не указан или "commonjs")
import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, 'src/assets');
const WIDTHS = [320, 768, 1024, 1920];
const FORMATS = [
  { ext: 'webp', apply: (img) => img.webp({ quality: 75 }) },
  { ext: 'avif', apply: (img) => img.avif({ quality: 50, effort: 4 }) },
];
const CONCURRENCY = Math.max(2, Math.min(8, os.cpus().length));

const isRaster = (name) => /\.(png|jpe?g)$/i.test(name);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (isRaster(entry.name)) yield full;
  }
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function processFile(filePath) {
  const meta = await sharp(filePath).metadata();
  const inW = meta.width || 0;

  const base = filePath.replace(/\.[^.]+$/, '');
  const name = path.basename(base);
  const dir = path.dirname(filePath);

  // выбираем только нужные ширины и не увеличиваем
  const targetWidths = WIDTHS.filter((w) => !inW || w <= inW);
  if (targetWidths.length === 0)
    targetWidths.push(Math.min(inW || WIDTHS[0], WIDTHS[0]));

  const jobs = [];
  for (const w of targetWidths) {
    // одно декодирование -> разветвляем пайплайн
    const resized = sharp(filePath)
      .rotate() // учесть EXIF
      .resize({ width: w, fit: 'inside', withoutEnlargement: true });

    for (const { ext, apply } of FORMATS) {
      const out = path.join(dir, `${name}-${w}.${ext}`);
      if (fs.existsSync(out)) continue; // уже есть — пропускаем
      jobs.push(apply(resized.clone()).toFile(out));
    }
  }

  await Promise.all(jobs);
}

(async () => {
  if (!fs.existsSync(SRC_DIR)) {
    console.error('Папка не найдена:', SRC_DIR);
    process.exit(1);
  }

  const files = Array.from(walk(SRC_DIR));
  if (files.length === 0) {
    console.log('PNG/JPG не найдены в', SRC_DIR);
    return;
  }

  console.log(
    `Найдено файлов: ${files.length}. Конкурентность: ${CONCURRENCY}`
  );
  for (const batch of chunk(files, CONCURRENCY)) {
    await Promise.all(
      batch.map((f) =>
        processFile(f).catch((e) => {
          console.error('Ошибка для', f, '-', e.message);
        })
      )
    );
  }
  console.log('Готово ✅');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
