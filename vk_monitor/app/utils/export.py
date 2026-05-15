from __future__ import annotations

import csv
import json
from pathlib import Path


def export_json(rows, path: Path):
    data = [dict(r) for r in rows]
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def export_csv(rows, path: Path):
    data = [dict(r) for r in rows]
    if not data:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(data[0].keys()))
        w.writeheader()
        w.writerows(data)
