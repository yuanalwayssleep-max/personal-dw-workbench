from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class EnvironmentEntrypointRead(ORMModel):
    id: int
    entry_type: str
    entry_name: str
    entry_url: str
    description: Optional[str] = None
    display_order: int


class CapabilityProfileRead(ORMModel):
    id: int
    capability_type: str
    capability_level: str
    source_type: str
    adapter_key: Optional[str] = None


class EnvironmentRead(ORMModel):
    id: int
    environment_code: str
    company_name: str
    environment_name: str
    environment_type: str
    account_name: Optional[str] = None
    account_password: Optional[str] = None
    query_portal_url: Optional[str] = None
    network_mode: str
    dialect: str
    timezone: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class EnvironmentDetailRead(EnvironmentRead):
    entrypoints: list[EnvironmentEntrypointRead] = []
    capabilities: list[CapabilityProfileRead] = []


class EnvironmentListQuery(BaseModel):
    keyword: Optional[str] = None
    is_active: Optional[bool] = None


class EnvironmentCreate(BaseModel):
    environment_code: str
    company_name: str
    environment_name: str
    environment_type: Literal["系统", "数据库连接"]
    account_name: Optional[str] = None
    account_password: Optional[str] = None
    query_portal_url: Optional[str] = None
    network_mode: str
    dialect: str
    timezone: str
    description: Optional[str] = None
    is_active: bool = True
    project_ids: list[str] = []


class EnvironmentUpdate(BaseModel):
    company_name: str
    environment_name: str
    environment_type: Literal["系统", "数据库连接"]
    account_name: Optional[str] = None
    account_password: Optional[str] = None
    query_portal_url: Optional[str] = None
    network_mode: str
    dialect: str
    timezone: str
    description: Optional[str] = None
    is_active: bool = True
    project_ids: list[str] = []
