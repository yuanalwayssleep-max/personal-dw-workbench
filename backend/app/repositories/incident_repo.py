from __future__ import annotations

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.incident import IncidentCard, IncidentLink, TraceStep


class IncidentRepository:
    def list(self, db: Session) -> list[IncidentCard]:
        stmt = select(IncidentCard).order_by(IncidentCard.updated_at.desc())
        return list(db.scalars(stmt).all())

    def get(self, db: Session, incident_id: int) -> Optional[IncidentCard]:
        stmt = select(IncidentCard).where(IncidentCard.id == incident_id)
        return db.scalar(stmt)

    def create(self, db: Session, incident: IncidentCard) -> IncidentCard:
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident

    def update(self, db: Session, incident: IncidentCard) -> IncidentCard:
        db.add(incident)
        db.commit()
        db.refresh(incident)
        return incident

    def next_step_no(self, db: Session, incident_id: int) -> int:
        stmt = select(func.max(TraceStep.step_no)).where(TraceStep.incident_id == incident_id)
        current = db.scalar(stmt)
        return 1 if current is None else current + 1

    def create_trace_step(self, db: Session, step: TraceStep) -> TraceStep:
        db.add(step)
        db.commit()
        db.refresh(step)
        return step

    def list_trace_steps(self, db: Session, incident_id: int) -> list[TraceStep]:
        stmt = select(TraceStep).where(TraceStep.incident_id == incident_id).order_by(TraceStep.step_no.asc())
        return list(db.scalars(stmt).all())

    def create_link(self, db: Session, link: IncidentLink) -> IncidentLink:
        db.add(link)
        db.commit()
        db.refresh(link)
        return link

    def list_links(self, db: Session, incident_id: int) -> list[IncidentLink]:
        stmt = select(IncidentLink).where(IncidentLink.incident_id == incident_id).order_by(IncidentLink.id.asc())
        return list(db.scalars(stmt).all())
