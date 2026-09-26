import { execFileSync } from 'node:child_process';
import type { Tekening } from '../Tekening/tekening';
import { TURTLE_PY } from './module';

// Alleen voor tests (node): draait code met de turtle van de speeltuin in de
// python3 van de machine, en geeft de uitvoer en de tekening terug. De code
// gaat via stdin naar binnen, dus er valt niets te escapen.
export function draaiTurtle(code: string): { uitvoer: string; tekening: Tekening } {
  const script = `
import sys, types, io
_m = types.ModuleType('turtle')
exec(compile(${JSON.stringify(TURTLE_PY)}, '<turtle>', 'exec'), _m.__dict__)
sys.modules['turtle'] = _m
_uit = io.StringIO()
_echt = sys.stdout
sys.stdout = _uit
exec(compile(sys.stdin.read(), '<leerling>', 'exec'), {'__name__': '__main__'})
sys.stdout = _echt
print(_uit.getvalue(), end='')
print('\\n@@TEKENING@@')
print(_m._coderius_tekening())
`;
  const uit = execFileSync('python3', ['-c', script], {
    input: code,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  const [uitvoer, tekening] = uit.split('\n@@TEKENING@@\n');
  return { uitvoer, tekening: JSON.parse(tekening) };
}
