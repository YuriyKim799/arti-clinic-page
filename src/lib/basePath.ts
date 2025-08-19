const base = (import.meta as any).env?.BASE_URL || '/';

export function joinPublicPath(p: string) {
  const b = base.endsWith('/') ? base : base + '/';
  const rel = p.replace(/^\/+/, '');
  return b + rel;
}
