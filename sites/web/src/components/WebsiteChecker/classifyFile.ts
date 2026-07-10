import type { FileKind } from './types';

const HTML_EXT = new Set(['.html', '.htm']);
const CSS_EXT = new Set(['.css']);
const JS_EXT = new Set(['.js', '.mjs']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp']);

function extname(path: string): string {
  const slash = path.lastIndexOf('/');
  const name = slash === -1 ? path : path.slice(slash + 1);
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

export function classifyFile(path: string): FileKind {
  const ext = extname(path);
  if (HTML_EXT.has(ext)) return 'html';
  if (CSS_EXT.has(ext)) return 'css';
  if (JS_EXT.has(ext)) return 'js';
  if (IMAGE_EXT.has(ext)) return 'image';
  return 'other';
}

/** Bestanden/mappen die we altijd negeren, ook als ze in een upload zitten. */
const IGNORED_SEGMENTS = new Set(['node_modules', '.git', '.DS_Store', '__MACOSX']);

export function isIgnoredPath(path: string): boolean {
  return path.split('/').some((segment) => IGNORED_SEGMENTS.has(segment));
}
