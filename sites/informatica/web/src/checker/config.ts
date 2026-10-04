import type { CheckerConfig, Concept } from '@coderius/checker/types';
import { SITES_BY_ID } from '@coderius/shared/sites';
import { CSS_TECHNIQUES, HTML_ELEMENTS, JS_TECHNIQUES } from './curriculum';

// Web-configuratie voor de gedeelde nakijker. De conceptdata komt 1-op-1 uit
// curriculum.ts (afgeleid van de cheatsheet); hier wordt die omgezet naar het
// generieke Concept-formaat. HTML-elementen worden per tag met een regex
// gedetecteerd; CSS/JS hergebruiken hun bestaande patronen.

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp']);

function classify(path: string): string {
  const dot = path.lastIndexOf('.');
  const ext = dot === -1 ? '' : path.slice(dot).toLowerCase();
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.css') return 'css';
  if (ext === '.js' || ext === '.mjs') return 'js';
  if (IMAGE_EXT.has(ext)) return 'image';
  return 'other';
}

function todayStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const htmlConcepts: Concept[] = HTML_ELEMENTS.map((e) => ({
  id: `html-${e.tags.join('-')}`,
  subject: 'html',
  group: e.group,
  label: e.label,
  level: e.level,
  detect: {
    type: 'regex',
    pattern: new RegExp(`<(${e.tags.join('|')})\\b`, 'gi'),
    in: ['html'],
  },
}));

const cssConcepts: Concept[] = CSS_TECHNIQUES.map((t) => ({
  id: t.id,
  subject: 'css',
  group: t.group,
  label: t.label,
  level: t.level,
  detect: { type: 'regex', pattern: t.pattern, in: ['css'] },
}));

// De onclick-techniek wordt in de HTML gemeten (attribuut), niet in JS-broncode.
const jsConcepts: Concept[] = JS_TECHNIQUES.map((t) =>
  t.id === 'js-onclick-attribute'
    ? {
        id: t.id,
        subject: 'js',
        group: t.group,
        label: t.label,
        level: t.level,
        detect: { type: 'regex', pattern: /onclick\s*=/gi, in: ['html'] } as const,
      }
    : {
        id: t.id,
        subject: 'js',
        group: t.group,
        label: t.label,
        level: t.level,
        detect: { type: 'regex', pattern: t.pattern, in: ['js'] } as const,
      },
);

export const webConfig: CheckerConfig = {
  subjects: [
    { id: 'html', label: 'HTML-elementen' },
    { id: 'css', label: 'CSS-technieken' },
    { id: 'js', label: 'JavaScript-technieken' },
  ],

  fileKinds: [
    { id: 'html', label: 'HTML' },
    { id: 'css', label: 'CSS' },
    { id: 'js', label: 'JavaScript' },
    { id: 'image', label: 'Afbeeldingen' },
    { id: 'other', label: 'Overig' },
  ],

  classify,
  textKinds: ['html', 'css', 'js'],
  imageKinds: ['image'],
  accept: '.zip,.html,.htm,.css,.js,.png,.jpg,.jpeg,.gif,.svg,.webp,.ico',

  ide: { url: SITES_BY_ID.ide.url },
  teacher: { password: 'coderius-docent', storageKey: 'webChecker.docentUnlocked' },
  pdfFilename: (d) => `Beoordeling Web Project - ${todayStamp(d)}.pdf`,
  privacyNote:
    'Let op: je bestanden gaan nooit naar een server. Alles gebeurt in je eigen browser.',

  concepts: [...htmlConcepts, ...cssConcepts, ...jsConcepts],
};
