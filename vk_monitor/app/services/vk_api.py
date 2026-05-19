from __future__ import annotations

import requests


class VKClient:
    API = "https://api.vk.com/method"

    def __init__(self, token: str, version: str = "5.199"):
        self.token = token
        self.version = version

    def _call(self, method: str, **params):
        p = {**params, "access_token": self.token, "v": self.version}
        r = requests.get(f"{self.API}/{method}", params=p, timeout=20)
        data = r.json()
        if "error" in data:
            raise RuntimeError(data["error"].get("error_msg", "VK API error"))
        return data["response"]

    def resolve_community(self, ref: str):
        info = self._call("utils.resolveScreenName", screen_name=ref)
        if not info or info.get("type") != "group":
            raise ValueError("Это не сообщество VK")
        group_id = info["object_id"]
        grp = self._call("groups.getById", group_id=group_id, fields="description,status,contacts,links,cover,photo_200,screen_name")[0]
        return grp

    def get_snapshot(self, group_id: int) -> dict:
        owner = -abs(group_id)
        out = {"errors": {}, "sections": {}}

        def fetch(name, fn):
            try:
                out["sections"][name] = fn()
            except Exception as e:
                out["sections"][name] = []
                out["errors"][name] = f"Раздел недоступен через API: {e}"

        fetch("group", lambda: self._call("groups.getById", group_id=group_id, fields="description,status,contacts,links,cover,photo_200,screen_name,activity,site")[0])
        fetch("wall_posts", lambda: self._call("wall.get", owner_id=owner, count=20).get("items", []))
        fetch("wall_pinned", lambda: [p for p in self._call("wall.get", owner_id=owner, count=20).get("items", []) if p.get("is_pinned")])
        fetch("photos", lambda: self._call("photos.getAll", owner_id=owner, count=50).get("items", []))
        fetch("photo_albums", lambda: self._call("photos.getAlbums", owner_id=owner).get("items", []))
        fetch("videos", lambda: self._call("video.get", owner_id=owner, count=50).get("items", []))
        fetch("video_albums", lambda: self._call("video.getAlbums", owner_id=owner).get("items", []))
        fetch("clips", lambda: self._call("video.get", owner_id=owner, count=50, filters="shorts").get("items", []))
        fetch("market", lambda: self._call("market.get", owner_id=owner, count=50).get("items", []))
        fetch("discussions", lambda: self._call("board.getTopics", group_id=group_id, count=50).get("items", []))
        fetch("links", lambda: self._call("groups.getById", group_id=group_id, fields="links")[0].get("links", []))
        return out
