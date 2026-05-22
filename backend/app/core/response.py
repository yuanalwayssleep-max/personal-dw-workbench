from __future__ import annotations

from typing import Any


def ok(data: Any, message: str = "ok") -> dict[str, Any]:
    return {
        "code": 0,
        "message": message,
        "data": data,
    }


def page(items: list[Any], page: int, page_size: int, total: int) -> dict[str, Any]:
    return ok(
        {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    )
