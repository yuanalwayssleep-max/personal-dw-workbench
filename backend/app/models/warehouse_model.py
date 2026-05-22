from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class WarehouseModel(Base):
    __tablename__ = "warehouse_model"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_name: Mapped[str] = mapped_column(ForeignKey("company.company_name"), nullable=False)
    model_code: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    model_name: Mapped[str] = mapped_column(String(128), nullable=False)
    model_database_name: Mapped[Optional[str]] = mapped_column(String(128))
    model_table_name: Mapped[Optional[str]] = mapped_column(String(128))
    model_business_domain: Mapped[Optional[str]] = mapped_column(String(64))
    model_data_domain: Mapped[Optional[str]] = mapped_column(String(64))
    model_layer: Mapped[Optional[str]] = mapped_column(String(64))
    layer: Mapped[str] = mapped_column(String(32), nullable=False)
    subject_domain: Mapped[str] = mapped_column(String(64), nullable=False)
    model_type: Mapped[str] = mapped_column(String(32), nullable=False)
    storage_type: Mapped[str] = mapped_column(String(32), nullable=False)
    table_name: Mapped[str] = mapped_column(String(128), nullable=False)
    table_description: Mapped[str] = mapped_column(Text(), nullable=False)
    partition_field: Mapped[Optional[str]] = mapped_column(String(64))
    owner: Mapped[str] = mapped_column(String(64), nullable=False, default="当前用户")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="草稿")
    tags_text: Mapped[Optional[str]] = mapped_column(Text())
    schedule_cycle: Mapped[str] = mapped_column(String(32), nullable=False, default="天")
    refresh_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="增量")
    core_metric: Mapped[Optional[str]] = mapped_column(Text())
    remark: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    project_links: Mapped[list["WarehouseModelProjectLink"]] = relationship(
        back_populates="model",
        cascade="all, delete-orphan",
    )


class WarehouseModelProjectLink(Base):
    __tablename__ = "warehouse_model_project_link"

    model_id: Mapped[int] = mapped_column(ForeignKey("warehouse_model.id"), primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("workspace_project.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    model: Mapped[WarehouseModel] = relationship(back_populates="project_links")
