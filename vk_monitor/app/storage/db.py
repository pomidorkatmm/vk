from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any, Iterable

from .models import ChangeRecord


class Database:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self):
        self.conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS communities (
              id INTEGER PRIMARY KEY,
              screen_name TEXT,
              title TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS snapshots (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              community_id INTEGER NOT NULL,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              payload TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS changes (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              community_id INTEGER NOT NULL,
              section TEXT NOT NULL,
              change_type TEXT NOT NULL,
              title TEXT,
              description TEXT,
              url TEXT,
              detected_at TEXT NOT NULL,
              raw_json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS config (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            """
        )
        self.conn.commit()

    def set_config(self, key: str, value: str):
        self.conn.execute("INSERT INTO config(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, value))
        self.conn.commit()

    def get_config(self, key: str, default: str = "") -> str:
        row = self.conn.execute("SELECT value FROM config WHERE key=?", (key,)).fetchone()
        return row[0] if row else default

    def upsert_community(self, community_id: int, screen_name: str, title: str):
        self.conn.execute(
            "INSERT INTO communities(id,screen_name,title) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET screen_name=excluded.screen_name,title=excluded.title",
            (community_id, screen_name, title),
        )
        self.conn.commit()

    def save_snapshot(self, community_id: int, snapshot: dict[str, Any]):
        self.conn.execute("INSERT INTO snapshots(community_id,payload) VALUES(?,?)", (community_id, json.dumps(snapshot, ensure_ascii=False)))
        self.conn.commit()

    def get_latest_snapshot(self, community_id: int) -> dict[str, Any] | None:
        row = self.conn.execute("SELECT payload FROM snapshots WHERE community_id=? ORDER BY id DESC LIMIT 1", (community_id,)).fetchone()
        if not row:
            return None
        return json.loads(row[0])

    def save_changes(self, items: Iterable[ChangeRecord]):
        self.conn.executemany(
            "INSERT INTO changes(community_id,section,change_type,title,description,url,detected_at,raw_json) VALUES(?,?,?,?,?,?,?,?)",
            [(c.community_id, c.section, c.change_type, c.title, c.description, c.url, c.detected_at, c.raw_json) for c in items],
        )
        self.conn.commit()

    def list_changes(self, community_id: int | None = None, section: str | None = None):
        q = "SELECT * FROM changes WHERE 1=1"
        params = []
        if community_id:
            q += " AND community_id=?"
            params.append(community_id)
        if section and section != "all":
            q += " AND section=?"
            params.append(section)
        q += " ORDER BY id DESC LIMIT 500"
        return self.conn.execute(q, params).fetchall()
