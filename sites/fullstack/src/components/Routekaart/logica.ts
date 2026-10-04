// Van de sidebar naar een route: de pure logica achter <Routekaart>, los van
// React zodat vitest hem in node kan draaien.
//
// De kaart leest de sidebar die Docusaurus voor de huidige pagina heeft
// (useDocsSidebar), dus wat sidebars.ts zegt, staat op de kaart. Een les
// verplaatsen of een categorie hernoemen kan de kaart niet laten achterlopen.

/** Het deel van een sidebar-item van Docusaurus dat de kaart gebruikt. */
export type SidebarItem = {
  type: string;
  label?: string;
  href?: string;
  unlisted?: boolean;
  items?: SidebarItem[];
};

export type Les = { label: string; href: string };

export type Etappe = {
  /** De naam zonder het voorvoegsel "Uitbreiding: ". */
  label: string;
  /** De naam zoals hij in de sidebar staat; de sleutel voor de zinnen. */
  sidebarLabel: string;
  href: string;
  uitbreiding: boolean;
  zin?: string;
  mijlpaal?: string;
  lessen: Les[];
};

const UITBREIDING = /^Uitbreiding:\s*/;

/** "1. maxlength is geen controle" → "maxlength is geen controle": de kaart nummert zelf. */
export const zonderNummer = (label: string): string => label.replace(/^\d+\.\s+/, '');

/** "zonder herladen (htmx)" → "Zonder herladen (htmx)": zonder voorvoegsel is het een kop. */
const hoofdletter = (tekst: string): string => tekst.charAt(0).toUpperCase() + tekst.slice(1);

/** Een pad met en zonder slash aan het eind is dezelfde pagina. */
const zelfde = (a: string, b: string): boolean => a.replace(/\/+$/, '') === b.replace(/\/+$/, '');

function lessenIn(items: SidebarItem[]): Les[] {
  return items.flatMap((item) => {
    if (item.unlisted) return [];
    if (item.type === 'link' && item.href && item.label) {
      return [{ label: zonderNummer(item.label), href: item.href }];
    }
    if (item.type === 'category') return lessenIn(item.items ?? []);
    return [];
  });
}

export function etappes(
  items: SidebarItem[],
  {
    huidig,
    zinnen = {},
    mijlpalen = {},
  }: {
    /** Het pad van de startpagina zelf; die komt niet op de kaart. */
    huidig?: string;
    zinnen?: Record<string, string>;
    mijlpalen?: Record<string, string>;
  } = {},
): Etappe[] {
  return items.flatMap((item): Etappe[] => {
    if (item.unlisted || !item.label) return [];
    const extra = { zin: zinnen[item.label], mijlpaal: mijlpalen[item.label] };
    if (item.type === 'link' && item.href) {
      if (huidig && zelfde(item.href, huidig)) return [];
      return [
        {
          label: zonderNummer(item.label),
          sidebarLabel: item.label,
          href: item.href,
          uitbreiding: false,
          lessen: [],
          ...extra,
        },
      ];
    }
    if (item.type === 'category') {
      const lessen = lessenIn(item.items ?? []);
      const href = item.href ?? lessen[0]?.href;
      if (!href) return [];
      return [
        {
          label: hoofdletter(item.label.replace(UITBREIDING, '')),
          sidebarLabel: item.label,
          href,
          uitbreiding: UITBREIDING.test(item.label),
          lessen,
          ...extra,
        },
      ];
    }
    return [];
  });
}
