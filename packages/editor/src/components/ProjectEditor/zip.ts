import { type Zippable, zipSync } from 'fflate';
import { inhoudNaarBytes } from '../../vfs/bestanden';
import type { Project } from '../../vfs/types';
import { isValidPath } from './paths';

// Een project staat alleen in de IndexedDB van deze browser. De zip is de weg
// naar buiten: een reservekopie, inleveren bij de docent, of verder werken in
// een echte editor. Hij is plat (geen hoofdmap eromheen), zodat hij ook
// meteen past in de website-checker, die een zip op dezelfde manier leest.
export function projectNaarZip(project: Pick<Project, 'files' | 'folders'>): Uint8Array {
  const invoer: Zippable = {};
  // Een lege map bestaat in een zip alleen als entry `map/` zonder inhoud.
  // Mappen met bestanden erin ontstaan vanzelf uit de paden.
  for (const map of project.folders) {
    if (isValidPath(map)) invoer[`${map}/`] = new Uint8Array(0);
  }
  // Een project dat via /import binnenkwam kan paden hebben die de editor zelf
  // nooit zou maken; `../` in een zip schrijft bij uitpakken buiten de map.
  for (const [pad, inhoud] of Object.entries(project.files)) {
    // Een geüploade afbeelding staat als data:-URL in het project; in de zip
    // hoort het echte bestand.
    if (isValidPath(pad)) invoer[pad] = inhoudNaarBytes(inhoud);
  }
  return zipSync(invoer);
}

// De projectnaam is vrije tekst ("Mijn site: v2?"), een bestandsnaam niet:
// Windows weigert onder meer : ? en ", en een naam van alleen punten.
export function zipBestandsnaam(naam: string): string {
  const schoon = naam
    .normalize('NFC')
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stuurtekens horen niet in een bestandsnaam.
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 80);
  return `${schoon || 'project'}.zip`;
}
