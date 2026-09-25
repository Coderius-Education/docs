// Een project bewaart elk bestand als tekst (Project.files). Afbeeldingen en
// andere binaire bestanden staan daarin als data:-URL, dezelfde vorm waarin
// de website-checker ze al aanlevert en die het webvoorbeeld (buildDoc)
// herkent. Deze helpers maken daar weer bytes van, voor de zip, Pyodide en
// het board, en beslissen bij een upload of een bestand tekst is.

// Grens per geüpload bestand. Een data:-URL is een derde groter dan het
// bestand, en elk bestand gaat bij elke run mee naar het voorbeeld of de
// runner; een foto rechtstreeks van een telefoon (8 MB) maakt de editor
// traag zonder dat de leerling weet waarom.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Extensies die als tekst in de editor horen. SVG staat er bewust niet bij:
// als data:-URL werkt `<img src="logo.svg">` in het voorbeeld, als tekst niet.
const TEKST_EXT = new Set([
  'py',
  'html',
  'htm',
  'css',
  'js',
  'mjs',
  'ts',
  'json',
  'md',
  'txt',
  'csv',
  'xml',
  'toml',
  'yaml',
  'yml',
  'ini',
  'cfg',
]);

const AFBEELDING_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif']);

function extensie(pad: string): string {
  const naam = pad.split('/').pop() ?? '';
  return naam.includes('.') ? (naam.split('.').pop()?.toLowerCase() ?? '') : '';
}

export function isTekstbestand(pad: string): boolean {
  return TEKST_EXT.has(extensie(pad));
}

export function isAfbeelding(pad: string): boolean {
  return AFBEELDING_EXT.has(extensie(pad));
}

export function isDataUrl(inhoud: string): boolean {
  return inhoud.startsWith('data:') && inhoud.includes(';base64,');
}

// De bytes van een bestand: een data:-URL gedecodeerd, tekst als UTF-8.
export function inhoudNaarBytes(inhoud: string): Uint8Array {
  if (!isDataUrl(inhoud)) return new TextEncoder().encode(inhoud);
  const base64 = inhoud.slice(inhoud.indexOf(';base64,') + ';base64,'.length);
  const binair = atob(base64);
  const bytes = new Uint8Array(binair.length);
  for (let i = 0; i < binair.length; i++) bytes[i] = binair.charCodeAt(i);
  return bytes;
}

// Hoe groot het bestand echt is (niet de lengte van de data:-URL).
export function bestandsgrootte(inhoud: string): number {
  if (!isDataUrl(inhoud)) return new TextEncoder().encode(inhoud).length;
  const base64 = inhoud.slice(inhoud.indexOf(';base64,') + ';base64,'.length);
  const opvulling = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - opvulling;
}

export function leesbareGrootte(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '').replace('.', ',')} MB`;
}

// Een bestandsnaam van de computer van de leerling, geschikt gemaakt voor het
// project: tekens die isValidPath weigert (\ / : * ? " < > |) worden een
// streepje. Spaties blijven: "mijn foto.png" is een prima naam.
export function veiligeBestandsnaam(naam: string): string {
  const schoon = naam
    .normalize('NFC')
    // biome-ignore lint/suspicious/noControlCharactersInRegex: stuurtekens horen niet in een bestandsnaam.
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .trim()
    .replace(/^\.+/, '');
  return schoon || 'bestand';
}

export function uploadPad(map: string, naam: string): string {
  return map ? `${map}/${naam}` : naam;
}
