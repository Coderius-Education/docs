// Leest meetwaarden uit REPL-regels voor de live plotter. Een regel als
// "Links: 800 | Rechts: 5000" of een kale "12345" wordt één sample met één
// tot vier reeksen; tekstregels zonder getallen tellen niet mee.

/** Losstaande getallen; het cijfer in een pinnaam als A0 telt niet. */
const GETAL_RE = /(?<![\w.])-?\d+(?:\.\d+)?(?![\w.])/g;

export const MAX_REEKSEN = 4;
export const MAX_SAMPLES = 300;

/**
 * Regels die geen metingen zijn: editor-statusmeldingen ("[verbonden]"),
 * prompt/echo-regels van de REPL (">>> sleep(2)") en traceback-regels — de
 * kop, de ingesprongen frames ('  File "main.py", line 7') en de foutregel
 * zelf ('OSError: [Errno 5] EIO'). Zonder deze filters zou een crash de
 * autoschaal van de kalibratiegrafiek verpesten met regelnummers en errno's.
 */
const GEEN_MEETREGEL = [
  /^\[/,
  />>>/,
  /^Traceback/,
  /^\s/,
  /^[A-Za-z_][A-Za-z0-9_.]*(Error|Exception|Interrupt)\b/,
];

export function parseGetallen(regel: string): number[] {
  const kaal = regel.replace(/\r$/, '');
  if (GEEN_MEETREGEL.some((re) => re.test(kaal))) return [];
  return [...kaal.matchAll(GETAL_RE)].map((m) => Number(m[0])).slice(0, MAX_REEKSEN);
}

/**
 * Voegt de meetwaarden van één regel toe aan de samplebuffer (in place,
 * begrensd op MAX_SAMPLES). Geeft terug of er iets is toegevoegd.
 */
export function voegSample(samples: number[][], regel: string): boolean {
  const getallen = parseGetallen(regel);
  if (getallen.length === 0) return false;
  samples.push(getallen);
  if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES);
  return true;
}
