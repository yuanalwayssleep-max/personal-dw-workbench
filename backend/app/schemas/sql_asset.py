from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class SqlAssetCreate(BaseModel):
    environment_id: int
    title: str
    sql_type: str
    content: str
    dialect: str
    summary: Optional[str] = None
    tags: Optional[dict] = None


class SqlAssetUpdate(BaseModel):
    title: str
    sql_type: str
    content: str
    dialect: str
    summary: Optional[str] = None
    tags: Optional[dict] = None
    is_favorite: bool = False
    status: str = "draft"


class SqlAssetRead(ORMModel):
    id: int
    environment_id: int
    title: str
    sql_type: str
    content: str
    dialect: str
    summary: Optional[str] = None
    tags: Optional[dict] = None
    is_favorite: bool
    status: str
    source_type: str
    created_at: datetime
    updated_at: datetime


class SqlSnapshotCreate(BaseModel):
    change_note: Optional[str] = None


class SqlSnapshotRead(ORMModel):
    id: int
    sql_asset_id: int
    version_no: int
    content: str
    change_note: Optional[str] = None
    created_at: datetime


class QueryRunCreate(BaseModel):
    environment_id: int
    sql_asset_id: Optional[int] = None
    run_mode: str
    run_status: str
    result_type: Optional[str] = None
    result_ref: Optional[str] = None
    result_summary: Optional[str] = None
    row_count: Optional[int] = None
    error_message: Optional[str] = None


class QueryRunRead(ORMModel):
    id: int
    environment_id: int
    sql_asset_id: Optional[int] = None
    run_mode: str
    run_status: str
    result_type: Optional[str] = None
    result_ref: Optional[str] = None
    result_summary: Optional[str] = None
    row_count: Optional[int] = None
    error_message: Optional[str] = None
    executed_at: datetime


class FavoriteUpdate(BaseModel):
    is_favorite: bool


class CreateIncidentFromSql(BaseModel):
    title: str
    incident_type: str
    severity: str = "medium"
    symptom_desc: Optional[str] = None
    result_summary: Optional[str] = None
