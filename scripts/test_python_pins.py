"""Tests voor de pins en de Python-versie van `draai-python-blokken.py`.

De Pyodide-runtime staat niet meer in git (createConfig zet hem uit
node_modules klaar), dus ook zijn pyodide-lock.json niet. De job `blokken`
installeert voor algorithms alleen geen node, en moest toch weten welke numpy
en matplotlib de browser laadt en op welke Python. Dat komt nu uit de wheels in
static/pyodide/ van de site, die pyodide-kopie.test.ts tegen de lock legt.

    python3 -m unittest discover -s scripts -p 'test_*.py'
"""

import importlib.util
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER))


def laad():
    spec = importlib.util.spec_from_file_location("blokken", HIER / "draai-python-blokken.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class TestPins(unittest.TestCase):
    def setUp(self):
        self.mod = laad()
        self.mod.kies_site("algorithms")

    def site_met(self, wheels: list[str]) -> Path:
        """Een nagemaakte site met alleen wheels, zonder node_modules."""
        map_ = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, map_, True)
        (map_ / "docs").mkdir()
        (map_ / "static" / "pyodide").mkdir(parents=True)
        for naam in wheels:
            (map_ / "static" / "pyodide" / naam).write_bytes(b"")
        self.mod.DOCS = map_ / "docs"
        return map_

    def test_algorithms_pint_wat_de_lock_van_de_runtime_zegt(self):
        lock = self.mod.pyodide_lock()
        if lock is None:
            self.skipTest("geen node_modules; draai pnpm install")
        self.assertEqual(
            self.mod.pins(),
            {n: lock["packages"][n]["version"] for n in ("numpy", "matplotlib")},
        )
        groot, klein = lock["info"]["python"].split(".")[:2]
        self.assertEqual(self.mod.python_van_de_lock(), (int(groot), int(klein)))

    def test_zonder_node_modules_uit_de_wheels(self):
        self.site_met([
            "numpy-2.2.5-cp313-cp313-pyemscripten_2025_0_wasm32.whl",
            "matplotlib-3.8.4-cp313-cp313-pyemscripten_2025_0_wasm32.whl",
            "python_dateutil-2.9.0.post0-py2.py3-none-any.whl",
        ])
        self.assertIsNone(self.mod.pyodide_lock())
        self.assertEqual(self.mod.pins(), {"numpy": "2.2.5", "matplotlib": "3.8.4"})
        self.assertEqual(self.mod.python_van_de_lock(), (3, 13))

    def test_lock_gaat_voor_de_wheels(self):
        map_ = self.site_met(["numpy-2.2.5-cp312-cp312-pyodide_2024_0_wasm32.whl"])
        lock = map_ / "node_modules" / "pyodide"
        lock.mkdir(parents=True)
        (lock / "pyodide-lock.json").write_text(json.dumps({"info": {"python": "3.13.2"}}))
        self.assertEqual(self.mod.python_van_de_lock(), (3, 13))

    def test_een_ontbrekende_wheel_stopt_met_uitleg(self):
        self.site_met(["numpy-2.2.5-cp313-cp313-pyemscripten_2025_0_wasm32.whl"])
        with self.assertRaises(SystemExit) as fout:
            self.mod.pins()
        self.assertIn("matplotlib", str(fout.exception))
        self.assertIn("haal:wheels", str(fout.exception))


if __name__ == "__main__":
    unittest.main()
