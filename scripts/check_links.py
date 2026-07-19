#!/usr/bin/env python3
"""CI-Gate: prüft, dass alle internen Links/Assets in den HTML-Dateien existieren.

Externe Links (http/https/mailto/tel/data), reine Anker (#...) werden übersprungen.
Bricht mit Exit-Code 1 ab, wenn eine referenzierte lokale Datei fehlt.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REF_RE = re.compile(r'(?:href|src)\s*=\s*"([^"]+)"', re.IGNORECASE)
SKIP = ("http://", "https://", "mailto:", "tel:", "data:", "#", "//")

missing: list[str] = []
checked = 0

for html in ROOT.glob("*.html"):
    text = html.read_text(encoding="utf-8")
    for ref in REF_RE.findall(text):
        if ref.startswith(SKIP):
            continue
        target = ref.split("#", 1)[0].split("?", 1)[0]
        if not target:
            continue
        checked += 1
        path = (html.parent / target).resolve()
        if not path.exists():
            missing.append(f"{html.name}: fehlende Referenz -> {ref}")

if missing:
    print("FEHLER: interne Links/Assets fehlen:")
    for m in missing:
        print("  -", m)
    sys.exit(1)

print(f"OK: {checked} interne Referenzen geprüft, alle vorhanden.")
