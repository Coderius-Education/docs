import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import type { Gebeurtenis } from '../Tekening/tekening';
import { draaiTurtle } from './draai';
import { TURTLE_PY } from './module';

// De turtle van de speeltuin is gewone Python, dus draaien we hem hier tegen
// de python3 van de machine. Twee soorten tests: dat hij dezelfde posities en
// richtingen uitrekent als de echte turtle van CPython, en dat de tekening
// (de lijst gebeurtenissen) klopt.

const draai = draaiTurtle;

function soorten(gebeurtenissen: Gebeurtenis[], soort: Gebeurtenis['t']): Gebeurtenis[] {
  return gebeurtenissen.filter((g) => g.t === soort);
}

// De echte turtle importeert tkinter bij het laden. Die is er in CI niet, en
// voor TNavigator (de rekenkunde, zonder venster) is hij ook niet nodig: een
// nep-tkinter die voor elke naam een lege klasse geeft, is genoeg.
const ECHTE_TURTLE = `
import sys, types
class _Leeg:
    def __init__(self, *a, **k):
        pass
_tk = types.ModuleType('tkinter')
_tk.__getattr__ = lambda naam: _Leeg
_tk.TclError = Exception
_sd = types.ModuleType('tkinter.simpledialog')
_sd.__getattr__ = lambda naam: _Leeg
_tk.simpledialog = _sd
sys.modules['tkinter'] = _tk
sys.modules['tkinter.simpledialog'] = _sd
import turtle as _echt
`;

// Elke regel is één aanroep; na elke aanroep leggen we positie en richting
// van onze schildpad naast die van TNavigator uit CPython.
const ROUTES: Record<string, string[]> = {
  'vooruit, achteruit en draaien': [
    'forward(100)',
    'left(90)',
    'forward(50.5)',
    'right(135)',
    'back(30)',
    'left(-45)',
  ],
  'cirkels en bogen': [
    'circle(50)',
    'circle(80, 90)',
    'circle(-40)',
    'circle(30, 180, 5)',
    'circle(60, steps=6)',
    'circle(-25, -120)',
  ],
  'goto, setx, sety, setheading en home': [
    'goto(30, -40)',
    'goto((-10, 5))',
    'setx(77)',
    'sety(-3)',
    'setheading(271)',
    'setheading(-45)',
    'forward(10)',
    'home()',
  ],
};

function vergelijk(route: string[]): { ons: number[][]; echt: number[][] } {
  const script = `
import json, types
${ECHTE_TURTLE}
_m = types.ModuleType('turtle_ons')
exec(compile(${JSON.stringify(TURTLE_PY)}, '<turtle>', 'exec'), _m.__dict__)
ons = _m.Turtle()
echt = _echt.TNavigator()
uit = {'ons': [], 'echt': []}
for regel in ${JSON.stringify(route)}:
    for naam, t in (('ons', ons), ('echt', echt)):
        eval('t.' + regel)
        uit[naam].append([round(t.xcor(), 6), round(t.ycor(), 6), round(t.heading(), 6)])
print(json.dumps(uit))
`;
  return JSON.parse(execFileSync('python3', ['-c', script], { encoding: 'utf8' }));
}

describe('de turtle rekent als de echte turtle van CPython', () => {
  for (const [naam, route] of Object.entries(ROUTES)) {
    it(naam, () => {
      const { ons, echt } = vergelijk(route);
      expect(ons).toEqual(echt);
    });
  }

  it('pos(), distance() en towards() geven hetzelfde als CPython', () => {
    const script = `
${ECHTE_TURTLE}
import types
_m = types.ModuleType('turtle_ons')
exec(compile(${JSON.stringify(TURTLE_PY)}, '<turtle>', 'exec'), _m.__dict__)
for t in (_m.Turtle(), _echt.TNavigator()):
    t.forward(30); t.left(60); t.forward(12.345)
    print(repr(t.pos()), t.distance(100, 100), t.towards(0, 0), t.towards((5, -5)))
`;
    const [ons, echt] = execFileSync('python3', ['-c', script], { encoding: 'utf8' })
      .trim()
      .split('\n');
    expect(ons).toBe(echt);
  });
});

describe('de tekening', () => {
  it('een vierkant is vier lijnen die weer op het begin uitkomen', () => {
    const { tekening } = draai(
      'import turtle\nfor _ in range(4):\n    turtle.forward(100)\n    turtle.left(90)\n',
    );
    const lijnen = soorten(tekening.gebeurtenissen, 'ga');
    expect(lijnen.map((g) => g.t === 'ga' && [g.x, g.y, g.pen])).toEqual([
      [100, 0, true],
      [100, 100, true],
      [0, 100, true],
      [0, 0, true],
    ]);
    expect(tekening.direct).toBe(false);
  });

  it('met de pen omhoog beweegt de schildpad zonder lijn', () => {
    const { tekening } = draai(
      'import turtle\nturtle.penup()\nturtle.goto(50, 50)\nturtle.pendown()\nturtle.forward(10)\n',
    );
    const lijnen = soorten(tekening.gebeurtenissen, 'ga');
    expect(lijnen.map((g) => g.t === 'ga' && g.pen)).toEqual([false, true]);
  });

  it('kleuren: namen, hex en rgb-tuples in beide kleurmodi', () => {
    const { tekening } = draai(
      [
        'import turtle',
        'turtle.color("red")',
        'turtle.forward(1)',
        'turtle.pencolor(0, 0.5, 1)',
        'turtle.forward(1)',
        'turtle.colormode(255)',
        'turtle.pencolor((255, 128, 0))',
        'turtle.forward(1)',
        'turtle.pencolor("#00ff00")',
        'turtle.forward(1)',
      ].join('\n'),
    );
    const kleuren = soorten(tekening.gebeurtenissen, 'ga').map((g) => g.t === 'ga' && g.kleur);
    expect(kleuren).toEqual(['red', '#0080ff', '#ff8000', '#00ff00']);
  });

  it('een vulling staat op de plek van begin_fill en krijgt bij end_fill haar kleur', () => {
    const { tekening } = draai(
      [
        'import turtle',
        'turtle.color("black", "yellow")',
        'turtle.begin_fill()',
        'for _ in range(3):',
        '    turtle.forward(60)',
        '    turtle.left(120)',
        'turtle.end_fill()',
      ].join('\n'),
    );
    const plek = tekening.gebeurtenissen.findIndex((g) => g.t === 'vul');
    const vul = tekening.gebeurtenissen[plek];
    expect(plek).toBe(1); // meteen na 'nieuw', dus vóór de lijnen
    expect(vul).toMatchObject({ kleur: 'yellow', zichtbaarVanaf: tekening.gebeurtenissen.length });
    expect(vul.t === 'vul' && vul.punten).toEqual([
      [0, 0],
      [60, 0],
      [30, 51.96],
      [0, 0],
    ]);
  });

  it('meerdere schildpadden houden elk hun eigen id', () => {
    const { tekening } = draai(
      'import turtle\na = turtle.Turtle()\nb = turtle.Turtle()\na.forward(10)\nb.forward(20)\n',
    );
    const nieuw = soorten(tekening.gebeurtenissen, 'nieuw').map((g) => ('id' in g ? g.id : -1));
    const ga = soorten(tekening.gebeurtenissen, 'ga').map((g) => ('id' in g ? g.id : -1));
    expect(nieuw).toEqual([0, 1]);
    expect(ga).toEqual([0, 1]);
  });

  it('dot, write en bgcolor komen in de tekening', () => {
    const { tekening } = draai(
      'import turtle\nturtle.bgcolor("lightblue")\nturtle.dot(20, "red")\nturtle.write("Hoi", align="center", font=("Arial", 16, "bold"))\n',
    );
    expect(soorten(tekening.gebeurtenissen, 'achtergrond')).toEqual([
      { t: 'achtergrond', kleur: 'lightblue' },
    ]);
    expect(soorten(tekening.gebeurtenissen, 'stip')).toMatchObject([{ grootte: 20, kleur: 'red' }]);
    expect(soorten(tekening.gebeurtenissen, 'tekst')).toMatchObject([
      { tekst: 'Hoi', uitlijning: 'center', grootte: 16 },
    ]);
  });

  it('speed(0) en tracer(0) betekenen: meteen het eindbeeld', () => {
    expect(draai('import turtle\nturtle.speed(0)\nturtle.forward(5)\n').tekening.direct).toBe(true);
    expect(draai('import turtle\nturtle.tracer(0)\nturtle.forward(5)\n').tekening.direct).toBe(
      true,
    );
    expect(draai('import turtle\nturtle.speed(10)\nturtle.forward(5)\n').tekening.direct).toBe(
      false,
    );
  });

  it('vensterfuncties als done(), Screen().setup() en exitonclick() doen niets en falen niet', () => {
    const { uitvoer } = draai(
      [
        'import turtle',
        'scherm = turtle.Screen()',
        'scherm.setup(600, 400)',
        'scherm.title("Mijn tekening")',
        'scherm.bgcolor("white")',
        'turtle.forward(10)',
        'print(turtle.pos())',
        'turtle.exitonclick()',
        'turtle.done()',
        'turtle.mainloop()',
      ].join('\n'),
    );
    expect(uitvoer).toBe('(10.00,0.00)\n');
  });

  it('from turtle import * werkt, met de gebruikelijke namen', () => {
    const { uitvoer } = draai(
      'from turtle import *\nforward(10)\nleft(90)\nprint(heading())\nt = Turtle()\n',
    );
    expect(uitvoer).toBe('90.0\n');
  });

  it('kleurnamen mogen spaties en hoofdletters hebben, net als in Tk', () => {
    const { tekening } = draai('import turtle\nturtle.pencolor("Light Blue")\nturtle.forward(1)\n');
    expect(soorten(tekening.gebeurtenissen, 'ga')).toMatchObject([{ kleur: 'lightblue' }]);
  });

  it('green, gray, maroon en purple krijgen de kleur van Tk, niet die van de browser', () => {
    const { tekening } = draai('import turtle\nturtle.pencolor("green")\nturtle.forward(1)\n');
    expect(soorten(tekening.gebeurtenissen, 'ga')).toMatchObject([{ kleur: '#00ff00' }]);
  });

  it('een onbekende kleurnaam geeft dezelfde melding als de echte turtle', () => {
    expect(() => draai('import turtle\nturtle.fillcolor("lichtblauw")\n')).toThrow(
      /TurtleGraphicsError: bad color string: lichtblauw/,
    );
    expect(() => draai('import turtle\nturtle.pencolor("#12345")\n')).toThrow(/bad color string/);
  });

  it('een onbekende kleurvorm geeft een TurtleGraphicsError, net als de echte turtle', () => {
    expect(() => draai('import turtle\nturtle.color((1, 2))\n')).toThrow(/TurtleGraphicsError/);
  });
});
