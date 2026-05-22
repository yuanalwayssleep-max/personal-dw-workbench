from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CompanyUpsert(BaseModel):
    companyName: str
    networkModes: list[str]
    note: Optional[str] = None


class CompanyRowRead(BaseModel):
    companyName: str
    projectCount: int
    environmentCount: int
    networkModes: list[str]
    projectNames: list[str]
    note: Optional[str] = None
    updatedAt: datetime
