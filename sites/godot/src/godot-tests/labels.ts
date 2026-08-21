// Haalt de Godot-UI-labels uit de lespagina's, zodat CI kan controleren of ze
// nog bestaan in de versie waar de cursus voor geschreven is.
//
// Waarom: een menu-item dat Godot hernoemt, verandert niets aan de code en
// niets aan de build. Het valt pas op als een leerling naar een knop zoekt die
// er niet meer is — zoals "Create & Edit", dat sinds Godot 4 gewoon "Create"
// heet en tot vandaag in les 1.2 stond.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Vetgedrukte tekst die géén Godot-label is, met de reden erbij. De extractie
 * filtert het meeste er al uit (Nederlands, leestekens, lange zinnen); wat
 * overblijft en toch geen knop is, hoort hier.
 */
export const GEEN_UI_LABEL: Record<string, string> = {
  Beeld: 'Nederlands woord in een tabel',
  Jij: 'Nederlands woord',
  Met: 'Nederlands woord',
  'De rest': 'verwijst naar de rest van een foutmelding',
  Hier: 'Nederlands, tegenover "Bij GDQuest"',
  'Bij GDQuest': 'naam van het oefenspoor, geen knop',
  'Er gaat iets mis': 'kop van een lesblok',
  'Dubbel springen': 'Nederlandse opdrachtnaam',
  'Losse PNG-frames': 'Nederlands',
  'Invoeren in Godot': 'Nederlands',
  'Of in code': 'Nederlands',
  'Alles uitpakken': 'knop in Windows Verkenner, niet in Godot',
  'Openen in Bestandsbeheer': 'knop in het besturingssysteem',
  'Rechthoekige selectie': 'gereedschap in een tekenprogramma',
  'Magic Wand': 'gereedschap in GIMP of Photopea',
  'Paint-tool': 'extern tekenprogramma',
  'Download Now': 'knop op godotengine.org',
  'Download frames as ZIP': 'knop op een externe assets-site',
  'More info': 'melding van Windows SmartScreen',
  'Run anyway': 'melding van Windows SmartScreen',
  'Split to frames': 'knop in een externe sprite-sheet-splitter',
  'Add 6 Frame(s)': 'Godot vult het aantal zelf in (Add %d Frame(s))',
  'Physics Layer 0': 'Godot nummert de laag zelf',
  'Global variable': 'begrip uit de les, geen knop',
  'Node Name': 'veldnaam die Godot uit de node samenstelt',
  'New SpriteFrames': 'Inspector zet "New " voor het resourcetype',
  'New Script': 'Inspector zet "New " voor het scripttype',
  'Create & Edit': 'heette zo in Godot 3; in 4.x is het Create',
  'Inzoomen / uitzoomen': 'Nederlands',
  Sprinten: 'Nederlands',
  'Start spel': 'Nederlands',
  'Toch uitvoeren': 'melding van Windows Defender',
  'Transparante achtergrond': 'Nederlands',
  'Verborgen items': 'optie in Windows Verkenner',
  Uitpakken: 'knop in Windows Verkenner',
  'Verschuiven (pannen)': 'Nederlands',
  'Welk bestand': 'Nederlands',
  Zonder: 'Nederlands',
  'TileSet-editor': 'Nederlandse naam voor het paneel',
  'Font Color': 'Inspector maakt dit van de theme-eigenschap font_color',
  'Limit Left/Right/Top/Bottom': 'verkorte schrijfwijze voor vier losse velden',
};

/** Woorden die verraden dat het om Nederlandse lestekst gaat, niet om een label. */
const NL =
  /\b(je|jouw|dit|dat|deze|het|de|een|en|of|niet|met|voor|naar|van|is|zijn|wordt|hoe|wat|waar|meer|minder|zelf)\b/i;

export function uiLabelsUit(inhoud: string): string[] {
  const gevonden = new Set<string>();
  for (const m of inhoud.matchAll(/\*\*([^*\n]{2,40})\*\*/g)) {
    const label = m[1].trim();
    // Een UI-label is Engels, begint met een hoofdletter, is kort, en bevat
    // geen zinsleestekens of opmaak.
    if (!/^[A-Z][A-Za-z0-9 &()%'/.+-]*$/.test(label)) continue;
    if (label.split(/\s+/).length > 5) continue;
    if (/[.,:;!?]$/.test(label)) continue;
    if (NL.test(label)) continue;
    if (/^Godot \d/.test(label)) continue;
    if (label in GEEN_UI_LABEL) continue;
    gevonden.add(label);
  }
  return [...gevonden];
}

function alleLesbestanden(map: string): string[] {
  const paden: string[] = [];
  for (const entry of readdirSync(map, { withFileTypes: true })) {
    const volledig = join(map, entry.name);
    if (entry.isDirectory()) paden.push(...alleLesbestanden(volledig));
    else if (/\.mdx?$/.test(entry.name)) paden.push(volledig);
  }
  return paden;
}

export function verzamelLabels(wortels: string[]): string[] {
  const alles = new Set<string>();
  for (const wortel of wortels) {
    for (const pad of alleLesbestanden(wortel)) {
      for (const l of uiLabelsUit(readFileSync(pad, 'utf8'))) alles.add(l);
    }
  }
  return [...alles].sort();
}
