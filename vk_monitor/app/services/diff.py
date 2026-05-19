from __future__ import annotations

import json
from datetime import datetime, timezone

from app.storage.models import ChangeRecord


SECTION_ID_KEYS = {
    "wall_posts": "id",
    "wall_pinned": "id",
    "photos": "id",
    "photo_albums": "id",
    "videos": "id",
    "video_albums": "id",
    "clips": "id",
    "market": "id",
    "discussions": "id",
    "links": "id",
}


def compute_changes(community_id: int, old: dict, new: dict):
    changes: list[ChangeRecord] = []
    now = datetime.now(timezone.utc).isoformat()
    old_sections = old.get("sections", {}) if old else {}
    new_sections = new.get("sections", {})

    for section, id_key in SECTION_ID_KEYS.items():
        prev = {str(i.get(id_key)): i for i in old_sections.get(section, []) if isinstance(i, dict)}
        curr = {str(i.get(id_key)): i for i in new_sections.get(section, []) if isinstance(i, dict)}
        for item_id, item in curr.items():
            if item_id not in prev:
                title = str(item.get("title") or item.get("text") or f"{section}:{item_id}")[:200]
                changes.append(
                    ChangeRecord(
                        community_id=community_id,
                        section=section,
                        change_type="new",
                        title=title,
                        description=str(item)[:400],
                        url="",
                        detected_at=now,
                        raw_json=json.dumps(item, ensure_ascii=False),
                    )
                )

    old_group = old_sections.get("group", {}) if old else {}
    new_group = new_sections.get("group", {})
    for field in ["description", "status", "photo_200"]:
        if old_group.get(field) != new_group.get(field):
            changes.append(ChangeRecord(community_id, "settings", f"changed_{field}", field, "Изменение настроек сообщества", "", now, json.dumps({"old": old_group.get(field), "new": new_group.get(field)}, ensure_ascii=False)))

    if old_group.get("contacts") != new_group.get("contacts"):
        changes.append(ChangeRecord(community_id, "settings", "changed_contacts", "contacts", "Изменены контакты", "", now, json.dumps({"old": old_group.get("contacts"), "new": new_group.get("contacts")}, ensure_ascii=False)))

    return changes
