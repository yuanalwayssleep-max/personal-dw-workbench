from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BusinessGlossaryCreate(BaseModel):
    glossary_name: str
    business_domain: str
    company_name: Optional[str] = None
    definition: str
    statistical_scope: Optional[str] = None
    data_source: Optional[str] = None
    note: Optional[str] = None
    project_ids: list[str] = []


class BusinessGlossaryUpdate(BaseModel):
    glossary_name: str
    business_domain: str
    company_name: Optional[str] = None
    definition: str
    statistical_scope: Optional[str] = None
    data_source: Optional[str] = None
    note: Optional[str] = None
    project_ids: list[str] = []


class BusinessGlossaryRead(BaseModel):
    id: int
    glossary_name: str
    business_domain: str
    company_name: Optional[str] = None
    definition: str
    statistical_scope: Optional[str] = None
    data_source: Optional[str] = None
    note: Optional[str] = None
    project_ids: list[str]
    project_names: list[str]
    created_at: datetime
    updated_at: datetime
