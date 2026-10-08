// Een klein, veilig stukje Markdown voor de tekst in vakpagina-blokken:
// alinea's, lijstjes, **vet**, *schuin*, `code` en [links](https://…). Alles
// wordt eerst ge-escapet; er komt nooit ruwe HTML uit het document op de
// pagina. docs-management heeft een kopie (frontend/src/lib/authoring/
// vakMarkdown.ts) voor het voorbeeld; dezelfde tests bewaken beide.

function escapeHtml(tekst: string): string {
  return tekst
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Alleen https-, mailto- en eigen paden; de rest wordt gewone tekst. */
export function veiligeHref(href: string): string | null {
  const schoon = href.trim();
  if (/[\s\\]/.test(schoon)) return null;
  if (/^https:\/\/[^/]/.test(schoon) || /^mailto:[^\s@]+@[^\s@]+$/.test(schoon)) return schoon;
  if (/^\/(?!\/)/.test(schoon) || schoon.startsWith('#')) return schoon;
  return null;
}

function inline(tekst: string): string {
  // Eerst escapen, dan opmaak: de patronen zien alleen ge-escapete tekst.
  return escapeHtml(tekst)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (heel, label: string, href: string) => {
      // href is al ge-escapet; terugzetten voor de controle, weer escapen erna.
      const echt = href.replace(/&amp;/g, '&');
      const veilig = veiligeHref(echt);
      if (!veilig) return label;
      const extern = veilig.startsWith('https://');
      return `<a href="${escapeHtml(veilig)}"${extern ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

export function markdownNaarHtml(bron: string): string {
  const blokken = bron
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n{2,}/);
  return blokken
    .filter((blok) => blok.trim())
    .map((blok) => {
      const regels = blok.split('\n');
      if (regels.every((regel) => /^\s*[-*]\s+/.test(regel))) {
        const items = regels.map((regel) => `<li>${inline(regel.replace(/^\s*[-*]\s+/, ''))}</li>`);
        return `<ul>${items.join('')}</ul>`;
      }
      return `<p>${regels.map(inline).join('<br>')}</p>`;
    })
    .join('');
}
