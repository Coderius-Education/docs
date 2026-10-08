import { SUBJECTS } from '@coderius/shared/sites';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';

// Een server-load, geen universele: de delivery serveert deze pagina op /, en
// bij het hydrateren zou een universele load opnieuw draaien met de params van
// die URL (geen vak). De data van een server-load zit al in de HTML.
//
// Elke vakpagina vooraf gebouwd als /vak/<vak>.html. De delivery serveert die
// op de root van de vak-host (informatica.coderius.nl/), zodat de pagina meteen
// met het juiste ontwerp, de juiste titel en de juiste meta-tags laadt.
export const prerender = true;

export const entries: EntryGenerator = () => SUBJECTS.map((v) => ({ vak: v.id }));

export const load: PageServerLoad = ({ params }) => {
  if (!SUBJECTS.some((v) => v.id === params.vak)) error(404, 'Onbekend vak');
  return { vak: params.vak };
};
