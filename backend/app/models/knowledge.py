from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class KnowledgeNote(Base):
    __tablename__ = "knowledge_note"

    id: Mapped[int] = mapped_column(primary_key=True)
    environment_id: Mapped[Optional[int]] = mapped_column(ForeignKey("workspace_environment.id"))
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    note_type: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text(), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text())
    source_type: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class KnowledgeStandard(Base):
    __tablename__ = "knowledge_standard"

    id: Mapped[int] = mapped_column(primary_key=True)
    standard_name: Mapped[str] = mapped_column(String(128), nullable=False)
    standard_type: Mapped[str] = mapped_column(String(64), nullable=False)
    company_name: Mapped[Optional[str]] = mapped_column(ForeignKey("company.company_name"))
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="生效中")
    rule_content: Mapped[str] = mapped_column(Text(), nullable=False)
    positive_example: Mapped[Optional[str]] = mapped_column(Text())
    negative_example: Mapped[Optional[str]] = mapped_column(Text())
    note: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    project_links: Mapped[list["StandardProjectLink"]] = relationship(
        back_populates="standard",
        cascade="all, delete-orphan",
    )


class StandardProjectLink(Base):
    __tablename__ = "standard_project_link"

    standard_id: Mapped[int] = mapped_column(ForeignKey("knowledge_standard.id"), primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("workspace_project.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    standard: Mapped[KnowledgeStandard] = relationship(back_populates="project_links")


class BusinessGlossary(Base):
    __tablename__ = "business_glossary"

    id: Mapped[int] = mapped_column(primary_key=True)
    glossary_name: Mapped[str] = mapped_column(String(128), nullable=False)
    business_domain: Mapped[str] = mapped_column(String(64), nullable=False)
    company_name: Mapped[Optional[str]] = mapped_column(ForeignKey("company.company_name"))
    definition: Mapped[str] = mapped_column(Text(), nullable=False)
    statistical_scope: Mapped[Optional[str]] = mapped_column(Text())
    data_source: Mapped[Optional[str]] = mapped_column(Text())
    note: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    project_links: Mapped[list["GlossaryProjectLink"]] = relationship(
        back_populates="glossary",
        cascade="all, delete-orphan",
    )


class GlossaryProjectLink(Base):
    __tablename__ = "glossary_project_link"

    glossary_id: Mapped[int] = mapped_column(ForeignKey("business_glossary.id"), primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("workspace_project.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    glossary: Mapped[BusinessGlossary] = relationship(back_populates="project_links")


class MetricDefinition(Base):
    __tablename__ = "metric_definition"

    id: Mapped[int] = mapped_column(primary_key=True)
    metric_name: Mapped[str] = mapped_column(String(128), nullable=False)
    metric_code: Mapped[str] = mapped_column(String(64), nullable=False)
    field_type: Mapped[str] = mapped_column(String(32), nullable=False, default="string")
    business_domain: Mapped[str] = mapped_column(String(64), nullable=False)
    metric_category: Mapped[str] = mapped_column(String(64), nullable=False)
    company_name: Mapped[Optional[str]] = mapped_column(ForeignKey("company.company_name"))
    definition: Mapped[str] = mapped_column(Text(), nullable=False)
    calculation_rule: Mapped[str] = mapped_column(Text(), nullable=False)
    time_granularity: Mapped[str] = mapped_column(String(32), nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(String(32))
    note: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    project_links: Mapped[list["MetricProjectLink"]] = relationship(
        back_populates="metric",
        cascade="all, delete-orphan",
    )


class MetricProjectLink(Base):
    __tablename__ = "metric_project_link"

    metric_id: Mapped[int] = mapped_column(ForeignKey("metric_definition.id"), primary_key=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("workspace_project.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    metric: Mapped[MetricDefinition] = relationship(back_populates="project_links")
