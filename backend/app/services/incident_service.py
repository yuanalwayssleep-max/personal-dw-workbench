from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.incident import IncidentCard, IncidentLink, TraceStep
from app.repositories.incident_repo import IncidentRepository
from app.schemas.incident import IncidentCreate, IncidentLinkCreate, IncidentUpdate, TraceStepCreate, TraceStepUpdate


class IncidentService:
    def __init__(self) -> None:
        self.repo = IncidentRepository()

    def list_incidents(self, db: Session):
        return self.repo.list(db)

    def get_incident(self, db: Session, incident_id: int):
        incident = self.repo.get(db, incident_id)
        if incident is None:
            raise HTTPException(status_code=404, detail="Incident not found")
        return incident

    def create_incident(self, db: Session, payload: IncidentCreate):
        incident = IncidentCard(**payload.model_dump())
        return self.repo.create(db, incident)

    def update_incident(self, db: Session, incident_id: int, payload: IncidentUpdate):
        incident = self.get_incident(db, incident_id)
        for key, value in payload.model_dump().items():
            setattr(incident, key, value)
        incident.updated_at = datetime.utcnow()
        return self.repo.update(db, incident)

    def update_status(self, db: Session, incident_id: int, status: str):
        incident = self.get_incident(db, incident_id)
        incident.status = status
        if status in {"resolved", "closed"}:
            incident.resolved_at = datetime.utcnow()
        incident.updated_at = datetime.utcnow()
        return self.repo.update(db, incident)

    def list_trace_steps(self, db: Session, incident_id: int):
        self.get_incident(db, incident_id)
        return self.repo.list_trace_steps(db, incident_id)

    def create_trace_step(self, db: Session, incident_id: int, payload: TraceStepCreate):
        self.get_incident(db, incident_id)
        step = TraceStep(
            incident_id=incident_id,
            step_no=self.repo.next_step_no(db, incident_id),
            **payload.model_dump(),
        )
        return self.repo.create_trace_step(db, step)

    def update_trace_step(self, db: Session, incident_id: int, step_id: int, payload: TraceStepUpdate):
        steps = self.repo.list_trace_steps(db, incident_id)
        step = next((item for item in steps if item.id == step_id), None)
        if step is None:
            raise HTTPException(status_code=404, detail="Trace step not found")
        for key, value in payload.model_dump().items():
            setattr(step, key, value)
        db.add(step)
        db.commit()
        db.refresh(step)
        return step

    def create_link(self, db: Session, incident_id: int, payload: IncidentLinkCreate):
        self.get_incident(db, incident_id)
        link = IncidentLink(incident_id=incident_id, **payload.model_dump())
        return self.repo.create_link(db, link)

    def list_links(self, db: Session, incident_id: int):
        self.get_incident(db, incident_id)
        return self.repo.list_links(db, incident_id)
