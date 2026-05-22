from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class WorkspaceEnvironment(Base):
    __tablename__ = "workspace_environment"

    id: Mapped[int] = mapped_column(primary_key=True)
    environment_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    company_name: Mapped[str] = mapped_column(String(128), nullable=False)
    environment_name: Mapped[str] = mapped_column(String(128), nullable=False)
    environment_type: Mapped[str] = mapped_column(String(32), nullable=False, default="系统")
    account_name: Mapped[Optional[str]] = mapped_column(String(128))
    account_password: Mapped[Optional[str]] = mapped_column(String(256))
    network_mode: Mapped[str] = mapped_column(String(32), nullable=False, default="intranet")
    dialect: Mapped[str] = mapped_column(String(32), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Asia/Shanghai")
    description: Mapped[Optional[str]] = mapped_column(Text())
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    entrypoints: Mapped[list["EnvironmentEntrypoint"]] = relationship(back_populates="environment")
    capabilities: Mapped[list["CapabilityProfile"]] = relationship(back_populates="environment")

    @property
    def query_portal_url(self) -> Optional[str]:
        for item in self.entrypoints:
            if item.entry_type == "query_portal":
                return item.entry_url
        return None


class EnvironmentEntrypoint(Base):
    __tablename__ = "environment_entrypoint"

    id: Mapped[int] = mapped_column(primary_key=True)
    environment_id: Mapped[int] = mapped_column(ForeignKey("workspace_environment.id"), nullable=False)
    entry_type: Mapped[str] = mapped_column(String(32), nullable=False)
    entry_name: Mapped[str] = mapped_column(String(128), nullable=False)
    entry_url: Mapped[str] = mapped_column(Text(), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text())
    display_order: Mapped[int] = mapped_column(nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    environment: Mapped[WorkspaceEnvironment] = relationship(back_populates="entrypoints")


class CapabilityProfile(Base):
    __tablename__ = "capability_profile"

    id: Mapped[int] = mapped_column(primary_key=True)
    environment_id: Mapped[int] = mapped_column(ForeignKey("workspace_environment.id"), nullable=False)
    capability_type: Mapped[str] = mapped_column(String(32), nullable=False)
    capability_level: Mapped[str] = mapped_column(String(8), nullable=False)
    source_type: Mapped[str] = mapped_column(String(32), nullable=False)
    adapter_key: Mapped[Optional[str]] = mapped_column(String(64))
    config_json: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    environment: Mapped[WorkspaceEnvironment] = relationship(back_populates="capabilities")
