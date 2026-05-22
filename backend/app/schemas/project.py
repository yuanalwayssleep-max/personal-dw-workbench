from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class WorkspaceProjectCreate(BaseModel):
    id: str
    name: str
    companyName: str
    description: Optional[str] = ""
    environmentIds: list[int] = []


class WorkspaceProjectUpdate(BaseModel):
    name: str
    companyName: str
    description: Optional[str] = ""
    environmentIds: list[int] = []


class WorkspaceProjectRead(BaseModel):
    id: str
    name: str
    companyName: str
    description: str
    environmentIds: list[int]
    updatedAt: datetime
