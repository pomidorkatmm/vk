from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ChangeRecord:
    community_id: int
    section: str
    change_type: str
    title: str
    description: str
    url: str
    detected_at: str
    raw_json: str
