export type VoorkennisItem = {
  site: string;
  to: string;
  label: string;
};

export declare const ITEM_RE: RegExp;
export declare function parseItems(inhoud: string): VoorkennisItem[];
export declare function alleLesbestanden(map: string): string[];
/** `root` is de repo-root; de map van de site komt uit de registry. */
export declare function lesBestaat(root: string, site: string, to: string): boolean;
export declare function docsPrefix(root: string, site: string): string;
export declare function routeBasePathUit(configTekst: string): string;
export declare function segmentenNaPrefix(root: string, site: string, to: string): string[] | null;
export declare function mapVanSite(root: string, site: string): string;
export declare function siteMappenOpSchijf(root: string): { id: string; map: string }[];
