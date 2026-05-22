from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.common import ORMModel


class ExternalAssetCreate(BaseModel):
    environment_id: int
    asset_type: str
    asset_name: str
    asset_key: Optional[str] = None
    asset_url: str
    remark: Optional[str] = None


class ExternalAssetRead(ORMModel):
    id: int
    environment_id: int
    asset_type: str
    asset_name: str
    asset_key: Optional[str] = None
    asset_url: str
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
