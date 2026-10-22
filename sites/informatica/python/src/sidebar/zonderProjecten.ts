// De map docs/projecten hoort bij de sidebar "projectenSidebar" en de
// navbar-link Projecten, niet bij de Tutorial. De Tutorial-sidebar wordt uit
// de hele docs-map gegenereerd; deze filter haalt de projecten eruit, zodat
// een nieuwe les in docs/ vanzelf in de Tutorial verschijnt zonder dat
// iemand de sidebar met de hand hoeft bij te houden.
//
// Zo heeft ook docs/projecten/unplugged een eigen sidebar en navbar-link:
// een docent zoekt de hand-outs los, om te printen. Stonden ze ook in de
// projecten-sidebar, dan lichtten Projecten en Unplugged allebei op.

type Item = { type: string; id?: string; items?: Item[]; link?: { type: string; id?: string } };

function hoortBij(item: Item, map: string): boolean {
  if (item.type === 'doc') return item.id?.startsWith(map) ?? false;
  if (item.type === 'category') {
    if (item.link?.id?.startsWith(map)) return true;
    return (item.items ?? []).some((i) => hoortBij(i, map));
  }
  return false;
}

/** De items zonder alles uit de map `map` (een doc-id-voorvoegsel, met slash). */
export function zonderMap<T extends Item>(items: T[], map: string): T[] {
  return items.filter((i) => !hoortBij(i, map));
}

export function zonderProjecten<T extends Item>(items: T[]): T[] {
  return zonderMap(items, 'projecten/');
}

export function zonderUnplugged<T extends Item>(items: T[]): T[] {
  return zonderMap(items, 'projecten/unplugged/');
}
