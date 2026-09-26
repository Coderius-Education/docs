// Een eigen module turtle voor de speeltuin.
//
// Pyodide levert turtle niet mee: de echte module tekent in een Tk-venster, en
// dat is er in een browsertab niet. Deze module biedt dezelfde functies, maar
// tekent niet zelf: hij houdt elke beweging bij als gebeurtenis, en na afloop
// tekent de component Tekening die lijst als SVG. Zo schrijft een leerling
// gewoon import turtle, en werkt dezelfde code later in Thonny.
//
// De rekenkunde (Vec2D, draaien, circle) volgt TNavigator uit CPython, zodat
// posities en richtingen precies zo uitkomen als bij de echte turtle;
// turtle.test.ts legt dat naast CPython. Wat niet met tekenen te maken heeft
// (vensters, klikken, toetsen) doet hier niets.
//
// scripts/draai-python-blokken.py leest deze module ook, tussen de eerste
// String.raw-backtick en de laatste backtick, en zet hem als turtle.py in de
// werkmap van elk blok. Dus: geen backtick en geen dollar-accolade in de Python.

export const TURTLE_PY = String.raw`
import json as _json
import math as _math

__all__ = []


class Vec2D(tuple):
    def __new__(cls, x, y):
        return tuple.__new__(cls, (x, y))

    def __add__(self, other):
        return Vec2D(self[0] + other[0], self[1] + other[1])

    def __mul__(self, other):
        if isinstance(other, Vec2D):
            return self[0] * other[0] + self[1] * other[1]
        return Vec2D(self[0] * other, self[1] * other)

    def __rmul__(self, other):
        if isinstance(other, (int, float)):
            return Vec2D(self[0] * other, self[1] * other)
        return NotImplemented

    def __sub__(self, other):
        return Vec2D(self[0] - other[0], self[1] - other[1])

    def __neg__(self):
        return Vec2D(-self[0], -self[1])

    def __abs__(self):
        return _math.hypot(*self)

    def rotate(self, angle):
        perp = Vec2D(-self[1], self[0])
        angle = _math.radians(angle)
        c, s = _math.cos(angle), _math.sin(angle)
        return Vec2D(self[0] * c + perp[0] * s, self[1] * c + perp[1] * s)

    def __getnewargs__(self):
        return (self[0], self[1])

    def __repr__(self):
        return "(%.2f,%.2f)" % self


class TurtleGraphicsError(Exception):
    pass


# De kleurnamen die zowel Tk (de echte turtle, Tk 8.6) als de browser kent. Tk kent er
# meer, zoals "red1" en "gray50"; die geven hier een fout, omdat de browser ze
# niet kan tekenen. Een naam met spaties of hoofdletters mag, net als in Tk:
# "Light Blue" is "lightblue".
_KLEURNAMEN = set("""
    aliceblue antiquewhite aqua aquamarine azure beige bisque black
    blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse
    chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan
    darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta
    darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
    darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink
    deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen
    fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey
    honeydew hotpink indianred indigo ivory khaki lavender lavenderblush
    lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow
    lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
    lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime
    limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid
    mediumpurple mediumseagreen mediumslateblue mediumspringgreen
    mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
    navajowhite navy oldlace olive olivedrab orange orangered orchid
    palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff
    peru pink plum powderblue purple red rosybrown royalblue
    saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue
    slateblue slategray slategrey snow springgreen steelblue tan teal thistle
    tomato turquoise violet wheat white whitesmoke yellow yellowgreen
""".split())

# Deze vier heten in de browser hetzelfde, maar zijn in Tk een andere kleur.
# Tk's "green" is fel groen, dat van de browser donkergroen.
_TK_KLEUREN = {
    "green": "#00ff00",
    "gray": "#bebebe",
    "grey": "#bebebe",
    "maroon": "#b03060",
    "purple": "#a020f0",
}


def _getal(waarde):
    # Een rond getal blijft een int in de JSON; dat houdt de tekening klein.
    waarde = round(float(waarde), 2)
    return int(waarde) if waarde == int(waarde) else waarde


class _Scherm:
    def __init__(self):
        self._gebeurtenissen = []
        self._schildpadden = []
        self._kleurmodus = 1.0
        self._direct = False

    def _voeg_toe(self, gebeurtenis):
        self._gebeurtenissen.append(gebeurtenis)
        return len(self._gebeurtenissen) - 1

    def _kleur(self, args):
        if len(args) == 1:
            args = args[0]
        if isinstance(args, str):
            if args.startswith("#"):
                if len(args) in (4, 7) and all(c in "0123456789abcdefABCDEF" for c in args[1:]):
                    return args
                raise TurtleGraphicsError("bad color string: " + args)
            naam = args.replace(" ", "").lower()
            if naam not in _KLEURNAMEN:
                raise TurtleGraphicsError("bad color string: " + args)
            return _TK_KLEUREN.get(naam, naam)
        try:
            r, g, b = args
        except (TypeError, ValueError):
            raise TurtleGraphicsError("bad color arguments: " + str(args)) from None
        if self._kleurmodus == 1.0:
            r, g, b = round(255 * r), round(255 * g), round(255 * b)
        if not (0 <= r <= 255 and 0 <= g <= 255 and 0 <= b <= 255):
            raise TurtleGraphicsError("bad color sequence: " + str(args))
        return "#%02x%02x%02x" % (int(r), int(g), int(b))

    def bgcolor(self, *args):
        if not args:
            return getattr(self, "_achtergrond", "white")
        self._achtergrond = self._kleur(args)
        self._voeg_toe({"t": "achtergrond", "kleur": self._achtergrond})

    def colormode(self, cmode=None):
        if cmode is None:
            return self._kleurmodus
        if cmode == 1.0:
            self._kleurmodus = 1.0
        elif cmode == 255:
            self._kleurmodus = 255

    def tracer(self, n=None, delay=None):
        if n is None:
            return 0 if self._direct else 1
        if not n:
            self._direct = True

    def delay(self, delay=None):
        return 0

    def turtles(self):
        return list(self._schildpadden)

    def clear(self):
        self._voeg_toe({"t": "wis"})

    def clearscreen(self):
        self.clear()

    def resetscreen(self):
        for schildpad in self._schildpadden:
            schildpad.reset()

    def _niets(self, *args, **kwargs):
        return None

    setup = title = update = mainloop = done = exitonclick = bye = _niets
    listen = onkey = onkeypress = onkeyrelease = onclick = onscreenclick = _niets
    ontimer = register_shape = addshape = screensize = _niets

    def window_width(self):
        return 640

    def window_height(self):
        return 480


_scherm = _Scherm()


def Screen():
    return _scherm


class Turtle:
    def __init__(self, shape="classic", undobuffersize=1000, visible=True):
        self._id = len(_scherm._schildpadden)
        _scherm._schildpadden.append(self)
        self._vorm = shape
        self._voeg_toe({"t": "nieuw", "vorm": shape, "zichtbaar": bool(visible)})
        self._zichtbaar = bool(visible)
        self._start()

    def _start(self):
        self._position = Vec2D(0.0, 0.0)
        self._orient = Vec2D(1.0, 0.0)
        self._pen = True
        self._penkleur = "black"
        self._vulkleur = "black"
        self._dikte = 1
        self._vulling = None
        self._snelheid = 3

    def _voeg_toe(self, gebeurtenis):
        gebeurtenis["id"] = self._id
        return _scherm._voeg_toe(gebeurtenis)

    # Bewegen

    def _goto(self, eind):
        begin = self._position
        self._position = Vec2D(float(eind[0]), float(eind[1]))
        self._voeg_toe({
            "t": "ga",
            "x": _getal(self._position[0]),
            "y": _getal(self._position[1]),
            "pen": self._pen,
            "kleur": self._penkleur,
            "dikte": _getal(self._dikte),
        })
        if self._vulling is not None:
            self._vulling["punten"].append([_getal(self._position[0]), _getal(self._position[1])])

    def _go(self, distance):
        self._goto(self._position + self._orient * distance)

    def _rotate(self, angle):
        self._orient = self._orient.rotate(angle)
        self._voeg_toe({"t": "draai", "hoek": _getal(self.heading())})

    def forward(self, distance):
        self._go(distance)

    def back(self, distance):
        self._go(-distance)

    def right(self, angle):
        self._rotate(-angle)

    def left(self, angle):
        self._rotate(angle)

    fd = forward
    bk = backward = back
    rt = right
    lt = left

    def pos(self):
        return self._position

    position = pos

    def xcor(self):
        return self._position[0]

    def ycor(self):
        return self._position[1]

    def goto(self, x, y=None):
        if y is None:
            self._goto(Vec2D(*x))
        else:
            self._goto(Vec2D(x, y))

    setpos = setposition = goto

    def teleport(self, x=None, y=None, *, fill_gap=False):
        pen = self._pen
        self._pen = False
        self._goto(Vec2D(
            x if x is not None else self._position[0],
            y if y is not None else self._position[1],
        ))
        self._pen = pen

    def home(self):
        self.goto(0, 0)
        self.setheading(0)

    def setx(self, x):
        self._goto(Vec2D(x, self._position[1]))

    def sety(self, y):
        self._goto(Vec2D(self._position[0], y))

    def _punt(self, x, y):
        if y is not None:
            return Vec2D(x, y)
        if isinstance(x, Turtle):
            return x._position
        return Vec2D(*x)

    def distance(self, x, y=None):
        return abs(self._punt(x, y) - self._position)

    def towards(self, x, y=None):
        dx, dy = self._punt(x, y) - self._position
        return round(_math.degrees(_math.atan2(dy, dx)), 10) % 360.0

    def heading(self):
        x, y = self._orient
        return round(_math.degrees(_math.atan2(y, x)), 10) % 360.0

    def setheading(self, to_angle):
        angle = to_angle - self.heading()
        angle = (angle + 180.0) % 360.0 - 180.0
        self._rotate(angle)

    seth = setheading

    def circle(self, radius, extent=None, steps=None):
        if extent is None:
            extent = 360.0
        if steps is None:
            frac = abs(extent) / 360.0
            steps = 1 + int(min(11 + abs(radius) / 6.0, 59.0) * frac)
        w = 1.0 * extent / steps
        w2 = 0.5 * w
        l = 2.0 * radius * _math.sin(_math.radians(w2))
        if radius < 0:
            l, w, w2 = -l, -w, -w2
        self._rotate(w2)
        for _ in range(steps):
            self._go(l)
            self._rotate(w)
        self._rotate(-w2)

    def speed(self, speed=None):
        namen = {"fastest": 0, "fast": 10, "normal": 6, "slow": 3, "slowest": 1}
        if speed is None:
            return self._snelheid
        if speed in namen:
            speed = namen[speed]
        elif 0.5 < speed < 10.5:
            speed = int(round(speed))
        else:
            speed = 0
        self._snelheid = speed
        if speed == 0:
            _scherm._direct = True

    # De pen

    def penup(self):
        self._pen = False

    def pendown(self):
        self._pen = True

    pu = up = penup
    pd = down = pendown

    def isdown(self):
        return self._pen

    def pensize(self, width=None):
        if width is None:
            return self._dikte
        self._dikte = width

    width = pensize

    def pencolor(self, *args):
        if not args:
            return self._penkleur
        self._penkleur = _scherm._kleur(args)

    def fillcolor(self, *args):
        if not args:
            return self._vulkleur
        self._vulkleur = _scherm._kleur(args)

    def color(self, *args):
        if not args:
            return self._penkleur, self._vulkleur
        if len(args) == 1:
            self._penkleur = self._vulkleur = _scherm._kleur(args)
        elif len(args) == 2:
            self._penkleur = _scherm._kleur((args[0],))
            self._vulkleur = _scherm._kleur((args[1],))
        else:
            self._penkleur = self._vulkleur = _scherm._kleur(args)

    def begin_fill(self):
        # De vulling komt ónder de lijnen die ná begin_fill getekend worden,
        # net als in Tk; hij verschijnt pas bij end_fill.
        self._vulling = {
            "t": "vul",
            "punten": [[_getal(self._position[0]), _getal(self._position[1])]],
        }
        self._vulling["plek"] = self._voeg_toe(self._vulling)

    def end_fill(self):
        if self._vulling is None:
            return
        self._vulling["kleur"] = self._vulkleur
        self._vulling["zichtbaarVanaf"] = len(_scherm._gebeurtenissen)
        self._vulling = None

    def filling(self):
        return self._vulling is not None

    def dot(self, size=None, *color):
        if size is None:
            size = max(self._dikte + 4, 2 * self._dikte)
        elif not isinstance(size, (int, float)):
            color = (size,) + color
            size = max(self._dikte + 4, 2 * self._dikte)
        kleur = _scherm._kleur(color) if color else self._penkleur
        self._voeg_toe({
            "t": "stip",
            "x": _getal(self._position[0]),
            "y": _getal(self._position[1]),
            "grootte": _getal(size),
            "kleur": kleur,
        })

    def write(self, arg, move=False, align="left", font=("Arial", 8, "normal")):
        self._voeg_toe({
            "t": "tekst",
            "x": _getal(self._position[0]),
            "y": _getal(self._position[1]),
            "tekst": str(arg),
            "uitlijning": align,
            "grootte": _getal(font[1]) if len(font) > 1 else 8,
            "kleur": self._penkleur,
        })

    def clear(self):
        self._voeg_toe({"t": "wis"})

    def reset(self):
        self.clear()
        self._start()
        self._voeg_toe({"t": "ga", "x": 0, "y": 0, "pen": False, "kleur": "black", "dikte": 1})
        self._voeg_toe({"t": "draai", "hoek": 0})

    # De schildpad zelf

    def hideturtle(self):
        self._zichtbaar = False
        self._voeg_toe({"t": "zichtbaar", "aan": False})

    def showturtle(self):
        self._zichtbaar = True
        self._voeg_toe({"t": "zichtbaar", "aan": True})

    ht = hideturtle
    st = showturtle

    def isvisible(self):
        return self._zichtbaar

    def shape(self, name=None):
        if name is None:
            return self._vorm
        self._vorm = name
        self._voeg_toe({"t": "vorm", "vorm": name})

    def getscreen(self):
        return _scherm

    def _niets(self, *args, **kwargs):
        return None

    shapesize = turtlesize = stamp = onclick = onrelease = ondrag = _niets


Pen = RawTurtle = Turtle

_standaard = []


def _schildpad():
    if not _standaard:
        _standaard.append(Turtle())
    return _standaard[0]


def getturtle():
    return _schildpad()


getpen = getturtle


def _maak_functie(naam):
    def functie(*args, **kwargs):
        return getattr(_schildpad(), naam)(*args, **kwargs)
    functie.__name__ = naam
    return functie


for _naam in (
    "forward fd back bk backward right rt left lt pos position xcor ycor goto "
    "setpos setposition teleport home setx sety distance towards heading "
    "setheading seth circle speed penup pu up pendown pd down isdown pensize "
    "width pencolor fillcolor color begin_fill end_fill filling dot write "
    "clear reset hideturtle ht showturtle st isvisible shape shapesize "
    "turtlesize stamp"
).split():
    globals()[_naam] = _maak_functie(_naam)


def _scherm_functie(naam):
    def functie(*args, **kwargs):
        return getattr(_scherm, naam)(*args, **kwargs)
    functie.__name__ = naam
    return functie


for _naam in (
    "bgcolor colormode tracer delay setup title update mainloop done "
    "exitonclick bye listen onkey onkeypress onkeyrelease onscreenclick "
    "ontimer register_shape addshape screensize window_width window_height "
    "clearscreen resetscreen turtles"
).split():
    globals()[_naam] = _scherm_functie(_naam)

__all__ = [n for n in globals() if not n.startswith("_") and n not in ("Vec2D",)]


def _coderius_aantal():
    return len(_scherm._gebeurtenissen)


def _coderius_tekening():
    for g in _scherm._gebeurtenissen:
        g.pop("plek", None)
    return _json.dumps({
        "gebeurtenissen": _scherm._gebeurtenissen,
        "direct": _scherm._direct,
    })
`;
