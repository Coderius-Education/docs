// De route machine learning (niveau 1) heeft een eigen sidebar en een eigen
// plek in de navbar. De sidebar "Algoritmes" is autogegenereerd uit heel
// docs/, en Docusaurus kan daar geen mappen uit weglaten; daarom haalt de
// sidebarItemsGenerator van docusaurus.config.ts de route er na het genereren
// uit. Een nieuwe fase is een map ml-… en komt hier in ML_MAPPEN.

export const ML_ROUTE = 'machine-learning';
export const ML_MAPPEN = [
  'ml-regels',
  'ml-afstand',
  'ml-kans',
  'ml-spellen',
  'ml-zoeken',
  'ml-neuronen',
];

type Item = { type: string; id?: string; items?: Item[] };

/** Hoort dit item van de gegenereerde sidebar bij de route? */
function vanDeRoute(item: Item): boolean {
  if (item.type === 'doc') return item.id === ML_ROUTE;
  if (item.type === 'category') {
    const ids = (item.items ?? []).flatMap((kind) => (kind.id ? [kind.id] : []));
    return ids.length > 0 && ids.every((id) => ML_MAPPEN.some((map) => id.startsWith(`${map}/`)));
  }
  return false;
}

/** De gegenereerde sidebar van heel docs/, zonder de route machine learning. */
export function zonderMl<T extends Item>(items: T[]): T[] {
  return items.filter((item) => !vanDeRoute(item));
}

type GeneratorArgs<A> = A & {
  item: { dirName: string };
  defaultSidebarItemsGenerator: (args: A & { item: { dirName: string } }) => Promise<Item[]>;
};

/**
 * De sidebarItemsGenerator van de docs: genereert zoals Docusaurus, en haalt
 * uit de sidebar van heel docs/ (dirName '.') de route weg. Eén functie, zodat
 * ml-sidebar.test.ts kan nagaan dat de config precies deze gebruikt.
 */
export async function sidebarZonderMl<A>({
  defaultSidebarItemsGenerator,
  ...args
}: GeneratorArgs<A>): Promise<Item[]> {
  const rest = args as A & { item: { dirName: string } };
  const items = await defaultSidebarItemsGenerator(rest);
  return rest.item.dirName === '.' ? zonderMl(items) : items;
}
