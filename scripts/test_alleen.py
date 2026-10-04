"""Tests voor `--alleen changed.json` in de codeblok-runners.

Een runner die te weinig kiest, is stil groen: het blok dat stukging draaide
gewoon niet. Daarom staat hier vast welke blokken een wijziging raakt, ook via
de draaien-met-keten en het uitvoerblok.

    python3 -m unittest discover -s scripts -p 'test_*.py'
"""

import importlib.util
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))

from alleen import HEEL, Selectie, lees, regels_van  # noqa: E402


def laad(naam: str, bestand: str):
    spec = importlib.util.spec_from_file_location(naam, HIER / bestand)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def gewijzigd(bestanden: dict, **extra) -> dict:
    return {"volledig": False, "bestanden": bestanden, "runners": {}, **extra}


def regel_met(tekst: str, stuk: str, na: int = 0) -> int:
    """Regelnummer (1-gebaseerd) van de eerste regel ná `na` die `stuk` bevat."""
    for i, regel in enumerate(tekst.split("\n"), start=1):
        if i > na and stuk in regel:
            return i
    raise AssertionError(f"{stuk!r} niet gevonden")


class TestSelectie(unittest.TestCase):
    def test_overlap_over_meerdere_regels(self):
        s = Selectie(gewijzigd({"a.md": [[10, 12]]}), "python")
        self.assertFalse(s.raakt("a.md", 5, 9))
        self.assertTrue(s.raakt("a.md", 5, 10))
        self.assertTrue(s.raakt("a.md", 12, 40))
        self.assertTrue(s.raakt("a.md", 11))
        self.assertFalse(s.raakt("a.md", 13))
        self.assertFalse(s.raakt("b.md", 11))
        self.assertTrue(s.raakt(Path("a.md"), 11))

    def test_heel_bestand(self):
        s = Selectie(gewijzigd({"v.ts": [[3, 3]]}), "algorithms")
        self.assertTrue(s.raakt_een([("les.md", 1, 2), ("v.ts", *HEEL)]))
        self.assertFalse(s.raakt_een([("les.md", 1, 2)]))

    def test_volledig_en_eigen_runner(self):
        self.assertTrue(Selectie(None, "python").alles)
        self.assertTrue(Selectie({"volledig": True, "bestanden": {}}, "python").alles)
        runners = {"python": {"draaien": True, "alles": True}}
        self.assertTrue(Selectie(gewijzigd({}, runners=runners), "python").alles)
        self.assertFalse(Selectie(gewijzigd({}, runners=runners), "play").alles)
        self.assertTrue(Selectie(None, "play").raakt("x", 1))

    def test_lees_haalt_de_vlag_eruit(self):
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            f.write('{"volledig": false, "bestanden": {"a.md": [[1, 1]]}}')
        s, rest = lees(["algorithms", "--alleen", f.name, "--pins"], "algorithms")
        self.assertEqual(rest, ["algorithms", "--pins"])
        self.assertFalse(s.alles)
        s, rest = lees(["algorithms"], "algorithms")
        self.assertTrue(s.alles)
        self.assertEqual(rest, ["algorithms"])
        Path(f.name).unlink()

    def test_regels_van(self):
        tekst = "a\nbb\n```python\nx\n```\nna"
        begin = tekst.index("```python")
        einde = tekst.index("```\nna") + 3
        self.assertEqual(regels_van(tekst, begin, einde), (3, 5))
        self.assertEqual(regels_van(tekst, 0, 2), (1, 1))


LES_PYTHON = textwrap.dedent(
    """\
    # Les

    Eerst een getal.

    ```python
    x = 1
    print(x)
    ```

    Uitvoer:

    ```
    1
    ```

    Dan rekenen met dat getal, verderop in de les.

    {/* draaien-met: blok-erboven */}

    ```python
    print(x + 1)   # 2
    ```

    En nog een stap, op de stap hiervoor.

    {/* draaien-met: blok-erboven */}

    ```python
    print(x + 2)   # 3
    ```

    Iets heel anders.

    ```python
    y = 5
    print(y)   # 5
    ```
    """
)


class TestPythonRunner(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mod = laad("draai_python_blokken", "draai-python-blokken.py")
        cls.tmp = tempfile.TemporaryDirectory()
        root = Path(cls.tmp.name)
        (root / "docs").mkdir()
        (root / "docs" / "les.md").write_text(LES_PYTHON)
        cls.mod.ROOT = root
        cls.mod.DOCS = root / "docs"
        cls.blokken, cls.claims, _ = cls.mod.verzamel()

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def kies(self, *regels):
        s = Selectie(gewijzigd({"docs/les.md": [[r, r] for r in regels]}), "python")
        return [b[1] for b in self.blokken if s.raakt_een(b[7])]

    def test_vier_blokken(self):
        self.assertEqual(len(self.blokken), 4)

    def test_een_blok_neemt_de_keten_mee(self):
        a, b, c, d = (b[1] for b in self.blokken)
        self.assertEqual(self.kies(regel_met(LES_PYTHON, "x = 1")), [a, b, c])

    def test_midden_in_de_keten(self):
        _, b, c, _ = (b[1] for b in self.blokken)
        self.assertEqual(self.kies(regel_met(LES_PYTHON, "print(x + 1)")), [b, c])

    def test_uitvoerblok_hoort_bij_zijn_eigen_blok(self):
        # Het uitvoerblok van A is een belofte over A; B plakt A's code voor
        # zich, niet A's uitvoer.
        a = self.blokken[0][1]
        uitvoer = regel_met(LES_PYTHON, "1", na=regel_met(LES_PYTHON, "Uitvoer:"))
        self.assertEqual(self.kies(uitvoer), [a])

    def test_marker_hoort_bij_zijn_blok(self):
        b = self.blokken[1][1]
        marker = regel_met(LES_PYTHON, "draaien-met")
        self.assertEqual(self.kies(marker), [b, self.blokken[2][1]])

    def test_los_blok(self):
        d = self.blokken[3][1]
        self.assertEqual(self.kies(regel_met(LES_PYTHON, "y = 5")), [d])
        self.assertEqual(self.kies(1), [])

    def test_volledig_kiest_alles(self):
        s = Selectie({"volledig": True}, "python")
        self.assertTrue(all(s.raakt_een(b[7]) for b in self.blokken))


LES_PLAY = textwrap.dedent(
    """\
    # Play

    <PygbagRunner code={`import play
    cirkel = play.new_circle()
    `} />

    Tekst.

    {/* niet-draaien: bewust kapot */}

    <PygbagRunner code={`import play
    play.bestaat_niet()
    `} />

    ```python
    print("kaal")
    ```
    """
)


class TestPlayRunner(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mod = laad("draai_play_blokken", "draai-play-blokken.py")
        cls.tmp = tempfile.TemporaryDirectory()
        root = Path(cls.tmp.name)
        (root / "docs").mkdir()
        (root / "docs" / "les.mdx").write_text(LES_PLAY)
        cls.mod.ROOT = root
        cls.mod.DOCS = root / "docs"

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def kies(self, *regels):
        s = Selectie(gewijzigd({"docs/les.mdx": [[r, r] for r in regels]}), "play")
        return [(b[1], b[3]) for b in self.mod.verzamel(s)]

    def test_zonder_selectie_alles(self):
        self.assertEqual(len(self.mod.verzamel()), 3)

    def test_alleen_het_geraakte_blok(self):
        self.assertEqual(self.kies(regel_met(LES_PLAY, "new_circle")), [(3, "draai")])
        kaal = regel_met(LES_PLAY, "```python")
        self.assertEqual(self.kies(kaal + 1), [(kaal, "compileer")])

    def test_marker_telt_mee(self):
        tweede = regel_met(LES_PLAY, "<PygbagRunner", na=4)
        self.assertEqual(self.kies(regel_met(LES_PLAY, "niet-draaien")), [(tweede, "compileer")])


class TestCompileerRunner(unittest.TestCase):
    def test_gekozen(self):
        mod = laad("compileer_blokken", "compileer-blokken.py")
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            mod.ROOT = root
            site = root / "sites" / "informatica" / "robotica"
            index = [
                {"naam": "a", "bron": "docs/les.md", "regel": 10, "begin": 8, "eind": 14},
                {"naam": "b", "bron": "docs/les.md", "regel": 30, "begin": 28, "eind": 33},
                # Een editor-template: geen eind, dus het hele bestand.
                {"naam": "t", "bron": "src/components/WebMicroEditor/templates.ts", "regel": 0},
            ]
            les = "sites/informatica/robotica/docs/les.md"
            tpl = "sites/informatica/robotica/src/components/WebMicroEditor/templates.ts"

            def kies(bestanden):
                return [i["naam"] for i in mod.gekozen(index, site, Selectie(gewijzigd(bestanden), "robotica"))]

            self.assertEqual(kies({les: [[9, 9]]}), ["a"])
            self.assertEqual(kies({les: [[14, 28]]}), ["a", "b"])
            self.assertEqual(kies({les: [[20, 20]]}), [])
            self.assertEqual(kies({tpl: [[400, 400]]}), ["t"])
            alles = Selectie(gewijzigd({}, runners={"robotica": {"alles": True}}), "robotica")
            self.assertEqual(len(mod.gekozen(index, site, alles)), 3)


if __name__ == "__main__":
    unittest.main()
