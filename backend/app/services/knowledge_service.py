from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.knowledge import KnowledgeNote
from app.repositories.incident_repo import IncidentRepository
from app.repositories.knowledge_repo import KnowledgeRepository
from app.schemas.knowledge import KnowledgeNoteCreate, KnowledgeNoteUpdate


class KnowledgeService:
    def __init__(self) -> None:
        self.repo = KnowledgeRepository()
        self.incident_repo = IncidentRepository()

    def list_notes(self, db: Session):
        return self.repo.list(db)

    def create_note(self, db: Session, payload: KnowledgeNoteCreate):
        note = KnowledgeNote(**payload.model_dump())
        return self.repo.create(db, note)

    def generate_from_incident(self, db: Session, incident_id: int):
        incident = self.incident_repo.get(db, incident_id)
        if incident is None:
            raise HTTPException(status_code=404, detail="Incident not found")
        content = (
            f"## Symptom\n{incident.symptom_desc or ''}\n\n"
            f"## Root Cause\n{incident.root_cause or ''}\n\n"
            f"## Fix Action\n{incident.fix_action or ''}\n\n"
            f"## Review\n{incident.review_note or ''}\n"
        )
        note = KnowledgeNote(
            environment_id=incident.environment_id,
            title=f"[Incident Review] {incident.title}",
            note_type="review",
            content=content,
            summary=incident.impact_scope,
            source_type="incident_generated",
        )
        return self.repo.create(db, note)
