#!/usr/bin/env python3
"""Fasst knowledge/pure/ zu einer Datei zusammen: knowledge/pure/ALL.md.

Für Agenten, die nur eine einzige URL lesen können (z. B. ChatGPT ohne
GitHub-Verbindung). Nach jeder Änderung in knowledge/pure/ ausführen:

    python3 scripts/build_knowledge_bundle.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "knowledge" / "pure"
OUT = ROOT / "ALL.md"

ORDER = [
    "README.md",
    "00-system/marke.md",
    "00-system/sprache-und-stil.md",
    "00-system/status.md",
    "01-trust.md",
    "02-giebel.md",
    "03-physis",
    "04-understanding",
    "05-responsibility",
    "06-ego",
    "07-buecher",
    "08-produkte",
    "09-quellen.md",
]

EGO_ORDER = [
    "README.md", "e-module.md", "the-1-percent.md", "four-arenas.md",
    "rock-bottom.md", "you-cannot-force-it.md", "the-gate.md",
    "feel-mortal.md", "good-man.md",
]


def files_in(folder: Path) -> list[Path]:
    if folder.name == "06-ego":
        names = EGO_ORDER + sorted(p.name for p in folder.glob("*.md") if p.name not in EGO_ORDER)
        return [folder / n for n in names if (folder / n).exists()]
    readme = folder / "README.md"
    rest = sorted(p for p in folder.glob("*.md") if p.name != "README.md")
    return ([readme] if readme.exists() else []) + rest


def main() -> None:
    paths: list[Path] = []
    for item in ORDER:
        p = ROOT / item
        paths.extend(files_in(p) if p.is_dir() else [p])

    seen = {p.resolve() for p in paths}
    leftovers = sorted(p for p in ROOT.rglob("*.md") if p.resolve() not in seen and p != OUT)
    paths.extend(leftovers)

    parts = [
        "# PURE · Gesamtes Wissen in einer Datei\n\n"
        "> Automatisch erzeugt aus knowledge/pure/ mit scripts/build_knowledge_bundle.py. "
        "Nicht von Hand bearbeiten: Änderungen in den Einzeldateien machen und neu erzeugen.\n"
    ]
    for p in paths:
        rel = p.relative_to(ROOT).as_posix()
        parts.append(f"\n\n---\n\n<!-- Datei: knowledge/pure/{rel} -->\n\n")
        parts.append(p.read_text(encoding="utf-8").strip() + "\n")

    OUT.write_text("".join(parts), encoding="utf-8")
    print(f"wrote {OUT} from {len(paths)} files, {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
