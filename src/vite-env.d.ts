/// <reference types="vite/client" />

// (необязательно, но полезно — объяви свои переменные)
interface ImportMetaEnv {
  readonly VITE_SITE_URL: string;
  // добавляй другие VITE_* при необходимости
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
