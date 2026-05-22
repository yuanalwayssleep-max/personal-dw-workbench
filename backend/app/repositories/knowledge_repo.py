from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.knowledge import KnowledgeNote


class KnowledgeRepository:
    def list(self, db: Session) -> list[KnowledgeNote]:
        stmt = select(KnowledgeNote).order_by(KnowledgeNote.updated_at.desc())
        return list(db.scalars(stmt).all())

    def create(self, db: Session, note: KnowledgeNote) -> KnowledgeNote:
        db.add(note)
        db.commit()
        db.refresh(note)
        return note
