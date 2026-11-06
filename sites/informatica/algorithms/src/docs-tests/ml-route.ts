import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ML_MAPPEN } from '../lib/mlSidebar';

// De route machine learning, zoals de tests hem lezen: fases (ML_MAPPEN, op
// volgorde), daarin projecten, en per project zijn stappen. Een project is
// een map `NN-naam/` met bouwstap-pagina's `NN-….mdx` en een
// `_category_.json`. Een losse pagina `NN-naam.mdx` in een fase telt als
// project met één stap, zodat een fase die nog niet in stappen staat ook
// gelezen wordt.

export const DOCS = fileURLToPath(new URL('../../docs/', import.meta.url));

export type Project = {
  /** De fase-map, zoals `ml-regels`. */
  fase: string;
  /** Het pad van het project vanaf docs/, zoals `ml-regels/01-chatbot`. */
  id: string;
  /** De doc-id's van de stappen, op volgorde. */
  stappen: string[];
};

const genummerd = (naam: string) => /^\d\d-/.test(naam);

function bestand(id: string): string {
  for (const ext of ['.mdx', '.md']) {
    const pad = join(DOCS, `${id}${ext}`);
    if (existsSync(pad)) return pad;
  }
  throw new Error(`geen pagina ${id}`);
}

export function projecten(): Project[] {
  return ML_MAPPEN.flatMap((fase) =>
    readdirSync(join(DOCS, fase))
      .filter(genummerd)
      .sort()
      .map((naam): Project => {
        const pad = join(DOCS, fase, naam);
        if (statSync(pad).isDirectory()) {
          const stappen = readdirSync(pad)
            .filter((f) => genummerd(f) && /\.mdx?$/.test(f))
            .sort()
            .map((f) => `${fase}/${naam}/${f.replace(/\.mdx?$/, '')}`);
          return { fase, id: `${fase}/${naam}`, stappen };
        }
        const id = `${fase}/${naam.replace(/\.mdx?$/, '')}`;
        return { fase, id, stappen: [id] };
      }),
  );
}

/** Elke pagina van de route, op volgorde: fase, project, stap. */
export function routePaginas(): string[] {
  return projecten().flatMap((p) => p.stappen);
}

/** Het bestand van een doc-id van de route. */
export function routeBestand(id: string): string {
  return bestand(id);
}

export function lees(id: string): string {
  return readFileSync(bestand(id), 'utf8');
}
