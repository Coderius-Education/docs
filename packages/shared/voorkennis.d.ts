export type VoorkennisItem = {
  site: string;
  to: string;
  label: string;
};

export declare const ITEM_RE: RegExp;
export declare function parseItems(inhoud: string): VoorkennisItem[];
export declare function alleLesbestanden(map: string): string[];
export declare function lesBestaat(sitesRoot: string, site: string, to: string): boolean;
export declare function docsPrefix(sitesRoot: string, site: string): string;
export declare function routeBasePathUit(configTekst: string): string;
export declare function segmentenNaPrefix(
  sitesRoot: string,
  site: string,
  to: string,
): string[] | null;
