from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class WorkspaceProject(Base):
    __tablename__ = "workspace_project"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    project_name: Mapped[str] = mapped_column(String(128), nullable=False)
    company_name: Mapped[str] = mapped_column(ForeignKey("company.company_name"), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    environment_links: Mapped[list["ProjectEnvironmentLink"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )


class ProjectEnvironmentLink(Base):
    __tablename__ = "project_environment_link"

    project_id: Mapped[str] = mapped_column(ForeignKey("workspace_project.id"), primary_key=True)
    environment_id: Mapped[int] = mapped_column(ForeignKey("workspace_environment.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    project: Mapped[WorkspaceProject] = relationship(back_populates="environment_links")
