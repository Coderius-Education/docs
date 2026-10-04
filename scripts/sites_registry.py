"""De site-registry (packages/shared/sites.js) voor de Python-scripts.

De registry is JavaScript; in plaats van hem na te bouwen vragen we hem op via
`node scripts/sites-json.mjs`. Zo staat de map van een site (sites/<vak>/<id>)
op precies één plek.
"""

import json
import subprocess
from functools import cache
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


@cache
def registry() -> dict:
    uit = subprocess.run(
        ["node", str(ROOT / "scripts" / "sites-json.mjs")],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(uit.stdout)


def site_dir(site_id: str) -> Path:
    """Absolute map van een site, bv. <repo>/sites/informatica/python."""
    if site_id == "home":
        return ROOT / registry()["home"]["dir"]
    for site in registry()["sites"]:
        if site["id"] == site_id:
            return ROOT / site["dir"]
    raise KeyError(f"Onbekende site: {site_id}")
