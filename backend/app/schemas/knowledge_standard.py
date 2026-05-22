from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class KnowledgeStandardCreate(BaseModel):
    standard_name: str
    standard_type: str
    company_name: Optional[str] = None
    status: str = "生效中"
    rule_content: str
    positive_example: Optional[str] = None
    negative_example: Optional[str] = None
    note: Optional[str] = None
    project_ids: list[str] = []


class KnowledgeStandardUpdate(BaseModel):
    standard_name: str
    standard_type: str
    company_name: Optional[str] = None
    status: str = "生效中"
    rule_content: str
    positive_example: Optional[str] = None
    negative_example: Optional[str] = None
    note: Optional[str] = None
    project_ids: list[str] = []


class KnowledgeStandardRead(BaseModel):
    id: int
    standard_name: str
    standard_type: str
    company_name: Optional[str] = None
    status: str
    rule_content: str
    positive_example: Optional[str] = None
    negative_example: Optional[str] = None
    note: Optional[str] = None
    project_ids: list[str]
    project_names: list[str]
    created_at: datetime
    updated_at: datetime
