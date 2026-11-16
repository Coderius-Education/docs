// Een veld waarin de leerling zelf alles schrijft, begon met één regel
// commentaar: "# Schrijf hier je code", of in een projectstap "# Plak hier je
// programma uit stap 1". Die regel moest hij eerst weghalen (issue 216). Nu
// is zo'n veld leeg, en staat de tekst er als aanwijzing in: grijs, en weg
// zodra er iets getypt of geplakt is.
//
// De les verandert daar niet voor: startcode met alleen commentaar ís een
// leeg veld met die aanwijzing. Staat er ook code in, dan blijft alles staan:
// commentaar tussen code wijst een plek aan.

export interface Startcode {
  /** Waar het veld mee begint, en waar Reset naar teruggaat. */
  start: string;
  /** Wat er in het lege veld staat tot de leerling iets typt. */
  aanwijzing?: string;
}

export function startcode(code: string): Startcode {
  const regels = code.split('\n').map((regel) => regel.trim());
  if (regels.some((regel) => regel && !regel.startsWith('#'))) return { start: code };
  const aanwijzing = regels
    .filter(Boolean)
    .map((regel) => regel.replace(/^#+\s*/, ''))
    .filter(Boolean)
    .join('\n');
  return aanwijzing ? { start: '', aanwijzing } : { start: code };
}
