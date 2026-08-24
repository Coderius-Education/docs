export type Fragment = {
  /** bestandsnaam zonder .py, uniek binnen de bundel */
  naam: string;
  /** docs-pad van de bron, voor de foutmelding */
  bron: string;
  /** 1-gebaseerd regelnummer waar het codeblok begint */
  regel: number;
  /** de dichtstbijzijnde kop erboven, voor context in rapportage */
  kop: string;
  /** de Python-broncode, gededent en klaar om te compileren */
  code: string;
};

export type Overgeslagen = {
  bron: string;
  regel: number;
  reden: string;
};

export declare const BLOK: RegExp;
export declare const NIET_COMPILEREN: string;
export declare function dedent(code: string): string;
export declare function fragmentenUit(
  bron: string,
  inhoud: string,
): { fragmenten: Fragment[]; overgeslagen: Overgeslagen[] };
export declare function verzamel(wortels: string[]): {
  fragmenten: Fragment[];
  overgeslagen: Overgeslagen[];
};
export declare function alleLesbestanden(map: string): string[];
