from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SqlAsset(Base):
    __tablename__ = "sql_asset"

    id: Mapped[int] = mapped_column(primary_key=True)
    environment_id: Mapped[int] = mapped_column(ForeignKey("workspace_environment.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    sql_type: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text(), nullable=False)
    dialect: Mapped[str] = mapped_column(String(32), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text())
    tags: Mapped[Optional[dict]] = mapped_column(JSON)
    is_favorite: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    source_type: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class SqlSnapshot(Base):
    __tablename__ = "sql_snapshot"

    id: Mapped[int] = mapped_column(primary_key=True)
    sql_asset_id: Mapped[int] = mapped_column(ForeignKey("sql_asset.id"), nullable=False)
    version_no: Mapped[int] = mapped_column(nullable=False)
    content: Mapped[str] = mapped_column(Text(), nullable=False)
    change_note: Mapped[Optional[str]] = mapped_column(String(512))
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class QueryRunRecord(Base):
    __tablename__ = "query_run_record"

    id: Mapped[int] = mapped_column(primary_key=True)
    environment_id: Mapped[int] = mapped_column(ForeignKey("workspace_environment.id"), nullable=False)
    sql_asset_id: Mapped[Optional[int]] = mapped_column(ForeignKey("sql_asset.id"))
    run_mode: Mapped[str] = mapped_column(String(32), nullable=False)
    run_status: Mapped[str] = mapped_column(String(32), nullable=False)
    result_type: Mapped[Optional[str]] = mapped_column(String(32))
    result_ref: Mapped[Optional[str]] = mapped_column(Text())
    result_summary: Mapped[Optional[str]] = mapped_column(Text())
    row_count: Mapped[Optional[int]]
    error_message: Mapped[Optional[str]] = mapped_column(Text())
    executed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
