/**
 * asset() — resolve public/ asset paths against Vite BASE_URL.
 * Vercel deploys at root (base '/') and GitHub Pages at a subpath
 * (base '/world-cup-intelligence/'); absolute '/...' literals break on subpath,
 * so every public asset referenced from code must go through this helper.
 */
export const asset = (p: string): string => {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${cleanBase}${p.startsWith('/') ? p : `/${p}`}`;
};
