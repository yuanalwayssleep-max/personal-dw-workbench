from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FileArtifact(Base):
    __tablename__ = "file_artifact"

    id: Mapped[int] = mapped_column(primary_key=True)
    environment_id: Mapped[Optional[int]] = mapped_column(ForeignKey("workspace_environment.id"))
    file_name: Mapped[str] = mapped_column(String(256), nullable=False)
    file_type: Mapped[str] = mapped_column(String(32), nullable=False)
    storage_path: Mapped[str] = mapped_column(Text(), nullable=False)
    origin_type: Mapped[str] = mapped_column(String(32), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class ExternalAssetRef(Base):
    __tablename__ = "external_asset_ref"

    id: Mapped[int] = mapped_column(primary_key=True)
    environment_id: Mapped[int] = mapped_column(ForeignKey("workspace_environment.id"), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(32), nullable=False)
    asset_name: Mapped[str] = mapped_column(String(256), nullable=False)
    asset_key: Mapped[Optional[str]] = mapped_column(String(128))
    asset_url: Mapped[str] = mapped_column(Text(), nullable=False)
    remark: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
