// Bestandsextensie -> Monaco language id. Statisch beschikbaar zodat de
// editor de juiste highlighting toont voordat de (lazy geladen) runner er is.
const EXT_TO_LANGUAGE: Record<string, string> = {
  py: 'python',
  html: 'html',
  htm: 'html',
  css: 'css',
  js: 'javascript',
  mjs: 'javascript',
  ts: 'typescript',
  json: 'json',
  md: 'markdown',
  svg: 'xml',
  xml: 'xml',
  txt: 'plaintext',
  csv: 'plaintext',
};

export function languageForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_LANGUAGE[ext] ?? 'plaintext';
}
