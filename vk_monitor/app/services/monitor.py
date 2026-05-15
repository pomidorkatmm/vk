from __future__ import annotations

from app.services.diff import compute_changes


class MonitorService:
    def __init__(self, db, vk_client):
        self.db = db
        self.vk = vk_client

    def initial_snapshot(self, community_id: int):
        snap = self.vk.get_snapshot(community_id)
        self.db.save_snapshot(community_id, snap)
        return snap

    def check(self, community_id: int):
        old = self.db.get_latest_snapshot(community_id)
        new = self.vk.get_snapshot(community_id)
        if old is None:
            self.db.save_snapshot(community_id, new)
            return []
        changes = compute_changes(community_id, old, new)
        if changes:
            self.db.save_changes(changes)
        self.db.save_snapshot(community_id, new)
        return changes
