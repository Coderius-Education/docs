import type { Vakpagina } from './types';

const LETTERS = {
  literata: 'var(--font-serif)',
  atkinson: 'var(--font-sans)',
  mono: 'var(--font-mono)',
} as const;

/**
 * CSS voor de thema's van alle vakpagina's, op `html[data-vak="<vak>"]`. De
 * layout zet data-vak vóór de eerste render uit de hostnaam, zodat de kleuren
 * niet flitsen. Kleuren zijn al gevalideerd (hex), dus veilig in een <style>.
 */
export function themaCss(paginas: Record<string, Vakpagina>): string {
  const regels: string[] = [];
  for (const [vak, doc] of Object.entries(paginas)) {
    if (!/^[a-z0-9-]+$/.test(vak)) continue;
    const sel = `html[data-vak="${vak}"]`;
    const { licht, donker, kopletter } = doc.thema ?? {};
    const vars = (k?: { primary?: string; primaryForeground?: string }) =>
      [
        k?.primary && `--primary:${k.primary};--ring:${k.primary};`,
        k?.primaryForeground && `--primary-foreground:${k.primaryForeground};`,
      ]
        .filter(Boolean)
        .join('');
    if (vars(licht)) regels.push(`${sel}{${vars(licht)}}`);
    if (vars(donker)) regels.push(`${sel}.dark{${vars(donker)}}`);
    const logo = doc.thema?.logo;
    if (logo?.licht) {
      // Header: het eigen logo in plaats van het Coderius-woordmerk.
      regels.push(`${sel} .coderius-woordmerk{display:none!important}`);
      regels.push(`${sel} .vak-logo-${vak}-licht{display:block}`);
      if (logo.donker) {
        regels.push(`${sel}.dark .vak-logo-${vak}-licht{display:none}`);
        regels.push(`${sel}.dark .vak-logo-${vak}-donker{display:block}`);
      }
    }
    if (kopletter && LETTERS[kopletter])
      regels.push(`${sel} :is(h1,h2,h3){font-family:${LETTERS[kopletter]}}`);
  }
  return regels.join('\n');
}
