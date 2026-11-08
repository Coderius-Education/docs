"""Tests voor het nagebootste bord van draai-leaphy-blokken.py (scripts/leaphy_nep).

Het nagebootste `machine` moet dezelfde pinnen weigeren als MicroPython v1.28.0
op de Arduino Nano RP2040 Connect. Weigert het te weinig, dan keurt de runner
een les goed die op het bord een fout geeft. De runner zelf toetst de echte
bibliotheek met een zelftest; deze tests hebben die bibliotheek niet nodig.

    python3 -m unittest discover -s scripts -p 'test_*.py'
"""

import importlib.util
import os
import sys
import tempfile
import unittest
from pathlib import Path

HIER = Path(__file__).resolve().parent
API = (
    HIER.parent
    / "sites"
    / "informatica"
    / "robotica"
    / "src"
    / "lego-tests"
    / "leaphy-api.json"
)
os.environ.setdefault("LEAPHY_API_JSON", str(API))
sys.path.insert(0, str(HIER / "leaphy_nep"))

import framebuf
import machine


def laad(naam: str, bestand: str):
    spec = importlib.util.spec_from_file_location(naam, HIER / bestand)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Pinnen(unittest.TestCase):
    def test_namen_uit_pins_csv(self):
        self.assertEqual(machine.Pin("D2").gpio, "GPIO25")
        self.assertEqual(machine.Pin("SDA").gpio, "GPIO12")
        self.assertEqual(machine.Pin("LED").gpio, "GPIO6")
        with self.assertRaisesRegex(ValueError, 'unknown named pin "D22"'):
            machine.Pin("D22")

    def test_a4_loopt_via_de_wifi_chip(self):
        self.assertTrue(machine.Pin("A4").ext)
        self.assertFalse(machine.Pin("A0").ext)

    def test_pwm_en_i2c_weigeren_een_pin_van_de_wifi_chip(self):
        with self.assertRaisesRegex(ValueError, "expecting a regular GPIO Pin"):
            machine.PWM(machine.Pin("A6"))
        with self.assertRaisesRegex(ValueError, "expecting a regular GPIO Pin"):
            machine.I2C(0, scl=machine.Pin("A5"), sda=machine.Pin("A4"))

    def test_i2c0_op_sda_en_scl(self):
        machine.I2C(0, scl=machine.Pin("SCL"), sda=machine.Pin("SDA"))
        machine.I2C(0, scl=machine.Pin(13), sda=machine.Pin(12))

    def test_i2c_controleert_eerst_scl_en_dan_sda(self):
        with self.assertRaisesRegex(ValueError, "bad SCL pin"):
            machine.I2C(0, scl=machine.Pin("D8"), sda=machine.Pin("D7"))
        with self.assertRaisesRegex(ValueError, "bad SDA pin"):
            machine.I2C(0, scl=machine.Pin("SCL"), sda=machine.Pin("D7"))

    def test_adc_op_a0_tot_a7(self):
        machine.ADC(machine.Pin("A0"))
        machine.ADC("A6")  # via de wifi-chip, MICROPY_HW_ADC_EXT_COUNT 4
        with self.assertRaisesRegex(ValueError, "Pin doesn't have ADC capabilities"):
            machine.ADC("D5")


class Scherm(unittest.TestCase):
    def test_text_wil_tekst(self):
        fb = framebuf.FrameBuffer(bytearray(16), 16, 8, framebuf.MONO_VLSB)
        fb.text("hoi", 0, 0, 1)
        with self.assertRaisesRegex(TypeError, "can't convert int to str"):
            fb.text(123, 0, 0, 1)


class Marker(unittest.TestCase):
    def test_niet_draaien_geldt_voor_het_volgende_blok(self):
        runner = laad("draai_leaphy", "draai-leaphy-blokken.py")
        les = (
            "```python\nprint(1)\n```\n\n"
            "{/* niet-draaien: bewust fout voorbeeld */}\n\n"
            "```python\nprint(2)\n```\n\n"
            "```python\nprint(3)\n```\n"
        )
        with tempfile.TemporaryDirectory() as tmp:
            (Path(tmp) / "les.md").write_text(les)
            runner.SITE = Path(tmp)
            regels = [i + 1 for i, r in enumerate(les.split("\n")) if r == "```python"]
            uit = [runner.niet_draaien({"bron": "les.md", "regel": r}) for r in regels]
        self.assertEqual(uit, [False, True, False])


if __name__ == "__main__":
    unittest.main()
