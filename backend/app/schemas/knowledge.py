from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class KnowledgeNoteCreate(BaseModel):
    environment_id: Optional[int] = None
    title: str
    note_type: str
    content: str
    summary: Optional[str] = None
    source_type: str = "manual"


class KnowledgeNoteUpdate(BaseModel):
    title: str
    note_type: str
    content: str
    summary: Optional[str] = None


class KnowledgeNoteRead(ORMModel):
    id: int
    environment_id: Optional[int] = None
    title: str
    note_type: str
    content: str
    summary: Optional[str] = None
    source_type: str
    created_at: datetime
    updated_at: datetime
