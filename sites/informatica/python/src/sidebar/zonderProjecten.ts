// De map docs/projecten hoort bij de sidebar "projectenSidebar" en de
// navbar-link Projecten, niet bij de Tutorial. De Tutorial-sidebar wordt uit
// de hele docs-map gegenereerd; deze filter haalt de projecten eruit, zodat
// een nieuwe les in docs/ vanzelf in de Tutorial verschijnt zonder dat
// iemand de sidebar met de hand hoeft bij te houden.

type Item = { type: string; id?: string; items?: Item[]; link?: { type: string; id?: string } };

const PROJECTEN = 'projecten/';

function hoortBijProjecten(item: Item): boolean {
  if (item.type === 'doc') return item.id?.startsWith(PROJECTEN) ?? false;
  if (item.type === 'category') {
    if (item.link?.id?.startsWith(PROJECTEN)) return true;
    return (item.items ?? []).some(hoortBijProjecten);
  }
  return false;
}

export function zonderProjecten<T extends Item>(items: T[]): T[] {
  return items.filter((i) => !hoortBijProjecten(i));
}
