from __future__ import annotations

import re
from urllib.parse import urlparse


def normalize_vk_ref(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Пустая ссылка")
    if value.startswith(("club", "public")):
        return value
    if value.startswith("-") and value[1:].isdigit():
        return f"club{value[1:]}"
    if re.fullmatch(r"[a-zA-Z0-9_.]+", value):
        return value
    parsed = urlparse(value)
    if "vk.com" not in parsed.netloc.lower():
        raise ValueError("Ссылка не похожа на VK")
    slug = parsed.path.strip("/").split("/")[0]
    if not slug:
        raise ValueError("Не удалось определить сообщество")
    return slug
