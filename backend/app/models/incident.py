from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class IncidentCard(Base):
    __tablename__ = "incident_card"

    id: Mapped[int] = mapped_column(primary_key=True)
    environment_id: Mapped[int] = mapped_column(ForeignKey("workspace_environment.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(256), nullable=False)
    incident_type: Mapped[str] = mapped_column(String(32), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False, default="medium")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    symptom_desc: Mapped[Optional[str]] = mapped_column(Text())
    impact_scope: Mapped[Optional[str]] = mapped_column(Text())
    root_cause: Mapped[Optional[str]] = mapped_column(Text())
    fix_action: Mapped[Optional[str]] = mapped_column(Text())
    review_note: Mapped[Optional[str]] = mapped_column(Text())
    discovered_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class TraceStep(Base):
    __tablename__ = "trace_step"

    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incident_card.id"), nullable=False)
    step_no: Mapped[int] = mapped_column(nullable=False)
    action_type: Mapped[str] = mapped_column(String(32), nullable=False)
    action_desc: Mapped[str] = mapped_column(Text(), nullable=False)
    evidence_ref: Mapped[Optional[str]] = mapped_column(Text())
    intermediate_conclusion: Mapped[Optional[str]] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class IncidentLink(Base):
    __tablename__ = "incident_link"

    id: Mapped[int] = mapped_column(primary_key=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incident_card.id"), nullable=False)
    target_type: Mapped[str] = mapped_column(String(32), nullable=False)
    target_id: Mapped[Optional[int]]
    target_ref: Mapped[Optional[str]] = mapped_column(Text())
    link_role: Mapped[Optional[str]] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
