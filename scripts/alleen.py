"""`--alleen changed.json` voor de codeblok-runners: welke blokken raakt een wijziging?

De plan-job van CI (scripts/wijzigingen.mjs) schrijft changed.json met per
bestand de gewijzigde regels. Een runner die `--alleen changed.json` krijgt, doet
alleen de blokken waarvan een regel gewijzigd is, plus de blokken die daarop
doorbouwen. Dat laatste weet alleen de runner zelf (de draaien-met-keten van
draai-python-blokken.py), dus die geeft per blok de lijst bereiken mee waar het
van afhangt: zijn eigen regels, zijn uitvoerblok, de blokken die ervoor geplakt
worden en de bestanden die het meelaadt.

Volledig (nightly, handmatig, een globaal bestand) of een wijziging aan de
runner zelf (`runners.<naam>.alles`, dat beslist de planner): dan alles.

Dezelfde overlap-regel als packages/shared/wijzigingen.js; getest in
scripts/test_alleen.py.
"""

import json
from pathlib import Path

# Een bereik dat elk regelnummer van een bestand dekt, voor een afhankelijkheid
# van een heel bestand (de verborgen code van een PyRunner).
HEEL = (1, 1_000_000_000)


class Selectie:
    """Wat er gewijzigd is, zoals een runner het nodig heeft."""

    def __init__(self, gewijzigd: dict | None, runner: str):
        self.gewijzigd = gewijzigd
        self.alles = gewijzigd is None or bool(
            gewijzigd.get("volledig")
            or gewijzigd.get("runners", {}).get(runner, {}).get("alles")
        )
        self.bestanden = {} if gewijzigd is None else gewijzigd.get("bestanden", {})

    def raakt(self, pad, start: int, eind: int | None = None) -> bool:
        """Overlapt [start, eind] van dit bestand een gewijzigde regel?"""
        if self.alles:
            return True
        eind = start if eind is None else eind
        sleutel = pad.as_posix() if isinstance(pad, Path) else str(pad)
        return any(s <= eind and start <= e for s, e in self.bestanden.get(sleutel, ()))

    def raakt_een(self, afhankelijkheden) -> bool:
        """Raakt de wijziging een van deze (pad, start, eind)?"""
        return self.alles or any(self.raakt(p, s, e) for p, s, e in afhankelijkheden)


def lees(argv: list[str], runner: str) -> tuple[Selectie, list[str]]:
    """Haalt `--alleen <pad>` uit argv; zonder die vlag is alles geselecteerd."""
    if "--alleen" not in argv:
        return Selectie(None, runner), argv
    i = argv.index("--alleen")
    if i + 1 >= len(argv):
        raise SystemExit("--alleen verwacht het pad van changed.json")
    gewijzigd = json.loads(Path(argv[i + 1]).read_text())
    return Selectie(gewijzigd, runner), argv[:i] + argv[i + 2 :]


def regel_van(tekst: str, index: int) -> int:
    """1-gebaseerd regelnummer van een positie in de tekst."""
    return tekst.count("\n", 0, index) + 1


def regels_van(tekst: str, start: int, einde: int) -> tuple[int, int]:
    """De regels die tekst[start:einde] beslaat; een afsluitende newline telt niet."""
    laatste = einde - 1 if einde > start and tekst[einde - 1] == "\n" else einde
    return regel_van(tekst, start), regel_van(tekst, max(start, laatste))
