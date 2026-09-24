import { RUNNER_META } from '../../runners/registry';
import type { ProjectSummary } from '../../vfs/types';

// De projectenlijst per taal, voor de <optgroup>s van de projectkiezer. De
// groepen staan in de volgorde waarin hun eerste project voorkomt; de lijst
// komt nieuwste-eerst binnen, dus de taal waar je het laatst in werkte staat
// bovenaan.
export function projectenPerTaal(
  projecten: ProjectSummary[],
): [taal: string, projecten: ProjectSummary[]][] {
  const groepen = new Map<string, ProjectSummary[]>();
  for (const p of projecten) {
    const taal = RUNNER_META[p.runnerId]?.label ?? p.runnerId;
    const groep = groepen.get(taal);
    if (groep) groep.push(p);
    else groepen.set(taal, [p]);
  }
  // Array.from, geen [...groepen]: met spread gingen de tests in node groen,
  // maar crashte de editor in de browser (de code zoals Docusaurus hem
  // bouwt kreeg geen paren terug, "Cannot read properties of undefined").
  return Array.from(groepen);
}
