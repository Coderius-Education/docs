#!/usr/bin/env python3
"""Build a coderius-play wheel from static/play-bundle.json.

Reads the play library source files from the bundle JSON,
excludes pymunk and screeninfo stubs (those come from Pyodide),
and packages everything into a proper .whl file.

Usage:
    python scripts/build-play-wheel.py
"""

import hashlib
import io
import json
import os
import base64
import zipfile

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUNDLE_PATH = os.path.join(PROJECT_ROOT, "static", "play-bundle.json")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "static", "whl")

PACKAGE_NAME = "coderius_play"
VERSION = "3.3.3"
WHEEL_FILENAME = f"{PACKAGE_NAME}-{VERSION}-py3-none-any.whl"

# Stubs to exclude — these are provided by Pyodide packages
EXCLUDE_PREFIXES = ("pymunk/", "screeninfo/")

METADATA = f"""\
Metadata-Version: 2.1
Name: {PACKAGE_NAME}
Version: {VERSION}
Summary: Coderius Play - educational game library built on pygame-ce and pymunk
Requires-Python: >=3.10
"""

WHEEL_INFO = """\
Wheel-Version: 1.0
Generator: build-play-wheel.py
Root-Is-Purelib: true
Tag: py3-none-any
"""


def sha256_digest(data: bytes) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(data).digest()).rstrip(b"=").decode()


def build_wheel():
    with open(BUNDLE_PATH, "r", encoding="utf-8") as f:
        bundle = json.load(f)

    buf = io.BytesIO()
    record_lines = []
    dist_info = f"{PACKAGE_NAME}-{VERSION}.dist-info"

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for filepath, content in sorted(bundle.items()):
            if any(filepath.startswith(prefix) for prefix in EXCLUDE_PREFIXES):
                continue

            data = content.encode("utf-8")
            zf.writestr(filepath, data)
            record_lines.append(f"{filepath},sha256={sha256_digest(data)},{len(data)}")

        # Write METADATA
        metadata_bytes = METADATA.encode("utf-8")
        meta_path = f"{dist_info}/METADATA"
        zf.writestr(meta_path, metadata_bytes)
        record_lines.append(f"{meta_path},sha256={sha256_digest(metadata_bytes)},{len(metadata_bytes)}")

        # Write WHEEL
        wheel_bytes = WHEEL_INFO.encode("utf-8")
        wheel_path = f"{dist_info}/WHEEL"
        zf.writestr(wheel_path, wheel_bytes)
        record_lines.append(f"{wheel_path},sha256={sha256_digest(wheel_bytes)},{len(wheel_bytes)}")

        # Write top_level.txt
        top_level = b"play\n"
        top_path = f"{dist_info}/top_level.txt"
        zf.writestr(top_path, top_level)
        record_lines.append(f"{top_path},sha256={sha256_digest(top_level)},{len(top_level)}")

        # Write RECORD (no hash for itself)
        record_path = f"{dist_info}/RECORD"
        record_lines.append(f"{record_path},,")
        zf.writestr(record_path, "\n".join(record_lines) + "\n")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, WHEEL_FILENAME)
    with open(output_path, "wb") as f:
        f.write(buf.getvalue())

    file_count = len([k for k in bundle if not any(k.startswith(p) for p in EXCLUDE_PREFIXES)])
    print(f"Built {WHEEL_FILENAME} ({file_count} files, {len(buf.getvalue())} bytes)")
    print(f"  -> {output_path}")


if __name__ == "__main__":
    build_wheel()
