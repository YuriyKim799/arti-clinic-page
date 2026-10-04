import assert from 'node:assert/strict';
import test from 'node:test';
import { excerptFrom } from './content-excerpt';

test('ignores Dzen interface, the article title, images and the repeated preview', () => {
  const source = `С подпиской Дзен Про она исчезнет из статей, видео и новостей

Отключить рекламу

[Арти Клиник](/articlinic)

245 подписчиков

Подписаться

# Почему болит спина

Боль может возникать по разным причинам...Читать далее

![Обложка и её описание](/blog/example/cover.jpg)

Боль может возникать по разным причинам. **На приёме** врач уточняет симптомы.

План обследования зависит от результатов осмотра.`;

  assert.equal(
    excerptFrom(source),
    'Боль может возникать по разным причинам. На приёме врач уточняет симптомы. План обследования зависит от результатов осмотра.'
  );
});

test('keeps useful text without an H1 and removes raw URLs rather than link labels', () => {
  assert.equal(
    excerptFrom(`Подробнее о [неврологическом осмотре](/services/examination).

Контакты: https://example.com/record

Следующий шаг обсуждается с врачом.`),
    'Подробнее о неврологическом осмотре. Контакты: Следующий шаг обсуждается с врачом.'
  );
});

test('joins Cyrillic paragraphs and Markdown lists and truncates at a complete word', () => {
  const intro = 'Перед приёмом подготовьте документы и запишите вопросы врачу.';
  const source = `# Подготовка к приёму

${intro}

## Что взять с собой

- **Результаты** предыдущих обследований.
- Перечень принимаемых препаратов.
- Список симптомов и время их появления.
- Описание нагрузок и привычного режима дня.`;
  const fullText = `${intro} Результаты предыдущих обследований. Перечень принимаемых препаратов. Список симптомов и время их появления. Описание нагрузок и привычного режима дня.`;
  const excerpt = excerptFrom(source);

  assert.ok(excerpt.startsWith(intro));
  assert.ok(excerpt.includes('Результаты предыдущих обследований.'));
  assert.ok(excerpt.endsWith('…'));
  assert.ok(excerpt.length <= 160);
  const retained = excerpt.slice(0, -1);
  assert.ok(fullText.startsWith(retained));
  assert.equal(fullText[retained.length], ' ');
  assert.doesNotMatch(excerpt, /Подготовка к приёму|Что взять с собой|[*#]/);
});
