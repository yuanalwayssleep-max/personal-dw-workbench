from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class EntityHistoryRead(BaseModel):
    id: int
    entity_type: str
    entity_key: str
    action: str
    title: str
    description: str
    created_at: datetime
