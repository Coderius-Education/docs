// Waar een stuk code staat en waar het draait. In de fullstack-cursus staan
// Python, HTML, CSS, JavaScript en Jinja vaak op één pagina, en een beginner
// ziet niet aan een codeblok of het in main.py hoort of in templates/, en of
// de browser het ooit te zien krijgt. <Bestand pad="…" /> boven het blok zegt
// het, en de plek volgt uit het pad: zo heet het overal hetzelfde.

export type Plek = 'server' | 'server-browser' | 'browser' | 'antwoord';

export interface BestandInfo {
  plek: Plek;
  /** De taal van het bestand, voor de kleur van het label. */
  taal: 'python' | 'html' | 'jinja' | 'css' | 'js' | 'anders';
  /** Wat er na het pad staat. */
  uitleg: string;
}

export const UITLEG: Record<Plek, string> = {
  server: 'draait op de server',
  'server-browser': 'de server vult hem in, de browser toont hem',
  browser: 'gaat zoals hij is naar de browser',
  antwoord: 'dit krijgt de browser van de server',
};

/** De plek en taal bij een pad uit het project, of bij een antwoord. */
export function bestandInfo(pad: string | undefined): BestandInfo {
  if (pad === undefined) return { plek: 'antwoord', taal: 'html', uitleg: UITLEG.antwoord };
  const p = pad.replace(/\\/g, '/');
  if (p.endsWith('.py')) return { plek: 'server', taal: 'python', uitleg: UITLEG.server };
  if (p.startsWith('templates/'))
    return { plek: 'server-browser', taal: 'jinja', uitleg: UITLEG['server-browser'] };
  const taal = p.endsWith('.css')
    ? 'css'
    : p.endsWith('.js')
      ? 'js'
      : p.endsWith('.html')
        ? 'html'
        : 'anders';
  if (p.startsWith('static/')) return { plek: 'browser', taal, uitleg: UITLEG.browser };
  throw new Error(`Bestand "${pad}": een pad begint met static/ of templates/, of eindigt op .py`);
}
