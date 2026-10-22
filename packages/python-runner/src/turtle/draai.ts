import { execFileSync } from 'node:child_process';
import type { Tekening } from '../Tekening/tekening';
import { TURTLE_PY } from './module';

// Alleen voor tests (node): draait code met de turtle van de speeltuin in de
// python3 van de machine, en geeft de uitvoer en de tekening terug. De code
// gaat via stdin naar binnen, dus er valt niets te escapen.
//
// Met `zaad` staat random vast, met `invoer` krijgt input() die antwoorden, en
// het antwoord komt achter de vraag in de uitvoer, zoals in de speeltuin. Dat
// gebeurt hier en niet als regels vóór de code: dan blijven de regelnummers
// van een fout kloppen, en valt een vergeten `import random` gewoon om.
export function draaiTurtle(
  code: string,
  opties: { zaad?: number; invoer?: string[] } = {},
): { uitvoer: string; tekening: Tekening; stappen: number } {
  const script = `
import sys, types, io, builtins, random
_m = types.ModuleType('turtle')
exec(compile(${JSON.stringify(TURTLE_PY)}, '<turtle>', 'exec'), _m.__dict__)
sys.modules['turtle'] = _m
_zaad = ${opties.zaad === undefined ? 'None' : Number(opties.zaad)}
if _zaad is not None:
    random.seed(_zaad)
_antwoorden = iter(${JSON.stringify(opties.invoer ?? [])})
def _invoer(vraag=''):
    antwoord = next(_antwoorden)
    print(str(vraag) + antwoord)
    return antwoord
builtins.input = _invoer
_uit = io.StringIO()
_echt = sys.stdout
sys.stdout = _uit
# Tel de stappen zoals de opname van Stap voor stap (trace/recorder.ts):
# elke line en return in de code van de leerling.
_stappen = 0
def _tel(frame, gebeurtenis, arg):
    global _stappen
    if frame.f_code.co_filename != '<leerling>':
        return None
    if gebeurtenis in ('line', 'return'):
        _stappen += 1
    return _tel
_code = compile(sys.stdin.read(), '<leerling>', 'exec')
sys.settrace(_tel)
try:
    exec(_code, {'__name__': '__main__'})
finally:
    sys.settrace(None)
sys.stdout = _echt
print(_uit.getvalue(), end='')
print('\\n@@TEKENING@@')
print(_m._coderius_tekening())
print('@@STAPPEN@@')
print(_stappen)
`;
  const uit = execFileSync('python3', ['-c', script], {
    input: code,
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 256 * 1024 * 1024,
  });
  const [uitvoer, rest] = uit.split('\n@@TEKENING@@\n');
  const [tekening, stappen] = rest.split('\n@@STAPPEN@@\n');
  return { uitvoer, tekening: JSON.parse(tekening), stappen: Number(stappen) };
}
