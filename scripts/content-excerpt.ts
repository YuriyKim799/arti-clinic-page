import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({ html: true, linkify: true });
const MAX_LENGTH = 160;
const importedInterface =
  /Читать далее|Рекламу можно отключить|С подпиской Дзен Про|Отключить рекламу|^\d+\s+подписчик(?:а|ов)?$|^Подписаться$|^\/articlinic\b/i;

type InlineToken = {
  type: string;
  content: string;
  children?: InlineToken[] | null;
};

function inlineText(tokens: InlineToken[] | null | undefined): string {
  return (tokens ?? [])
    .map((token) => {
      if (token.type === 'image' || token.type === 'html_inline') return '';
      if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
      if (token.children) return inlineText(token.children);
      return token.type === 'text' || token.type === 'code_inline'
        ? token.content
        : '';
    })
    .join('');
}

function cleanText(text: string): string {
  return text
    .replace(/(?:https?:\/\/|www\.)\S+/gi, '')
    .replace(/(?:^|\s)\/(?:blog|articlinic)(?:\/[^\s]*)?(?=\s|$)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Summarize visible article paragraphs, excluding imported previews and UI. */
export function excerptFrom(source: string): string {
  const tokens = markdown.parse(source, {});
  const firstH1 = tokens.findIndex(
    (token) => token.type === 'heading_open' && token.tag === 'h1'
  );
  const paragraphs: string[] = [];
  let inHeading = false;

  for (let i = Math.max(0, firstH1); i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'heading_open') {
      inHeading = true;
      continue;
    }
    if (token.type === 'heading_close') {
      inHeading = false;
      continue;
    }
    if (token.type !== 'inline' || inHeading) continue;

    const visible = inlineText(token.children);
    if (importedInterface.test(visible)) continue;
    const text = cleanText(visible);
    if (!text || text === 'Арти Клиник') continue;
    paragraphs.push(text);
    if (paragraphs.join(' ').length >= MAX_LENGTH) break;
  }

  const text = paragraphs.join(' ');
  if (text.length <= MAX_LENGTH) return text;

  const shortened = text.slice(0, MAX_LENGTH - 1);
  const lastSpace = shortened.lastIndexOf(' ');
  const completeWords = lastSpace > 0 ? shortened.slice(0, lastSpace) : shortened;
  return completeWords.replace(/[\s,;:—-]+$/, '') + '…';
}
