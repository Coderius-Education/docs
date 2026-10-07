// Vertaalt de technische foutmeldingen uit serial.ts/leaphyInstaller.ts naar
// leerling-vriendelijke tekst met een concrete vervolgstap. De rauwe melding
// blijft altijd zichtbaar tussen haakjes — zo gaat er nooit debug-informatie
// verloren, ook niet voor een docent die meekijkt.

interface ErrorMapping {
  test: RegExp;
  friendly: string;
}

const MAPPINGS: ErrorMapping[] = [
  {
    test: /read timeout \(wanted \d+ bytes\)|read timeout \(pattern not seen\)/,
    friendly:
      'Het board reageerde niet op tijd. Controleer de kabel en of er MicroPython op het board staat, en probeer opnieuw te verbinden.',
  },
  {
    test: /raw-paste niet ondersteund door dit board/,
    friendly:
      'Dit board ondersteunt de manier waarop wij code versturen niet. Staat er een recente MicroPython-versie op?',
  },
  {
    test: /raw-paste handshake mislukt/,
    friendly:
      'De verbinding liep vast tijdens het versturen van code. Verbreek en verbind opnieuw.',
  },
  {
    test: /board afgebroken tijdens raw-paste/,
    friendly: 'Het board onderbrak de verbinding tijdens het versturen. Controleer de kabel.',
  },
  {
    test: /einde-input niet bevestigd/,
    friendly: 'Het board reageerde niet zoals verwacht. Probeer het opnieuw.',
  },
  {
    test: /^not connected$/,
    friendly: "Er is geen board verbonden. Klik eerst op 'Verbind met board'.",
  },
  {
    test: /Serieel apparaat heeft geen readable\/writable stream/,
    friendly:
      'Kon niet goed communiceren met het board. Koppel de kabel los en opnieuw aan, en probeer opnieuw te verbinden.',
  },
  {
    test: /Kon library-lijst niet ophalen|Kon .+ niet ophalen \(HTTP/,
    friendly:
      'Kon de Leaphy-library niet ophalen van GitHub. Controleer je internetverbinding en probeer het opnieuw.',
  },
];

export function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const match = MAPPINGS.find((m) => m.test.test(raw));
  const friendly = match?.friendly ?? 'Er ging iets onverwachts mis.';
  return `${friendly} (technische info: ${raw})`;
}
