from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.knowledge import KnowledgeStandard, StandardProjectLink


class KnowledgeStandardRepository:
    def list(self, db: Session) -> list[KnowledgeStandard]:
        stmt = (
            select(KnowledgeStandard)
            .options(selectinload(KnowledgeStandard.project_links))
            .order_by(KnowledgeStandard.updated_at.desc())
        )
        return list(db.scalars(stmt).all())

    def get(self, db: Session, standard_id: int) -> Optional[KnowledgeStandard]:
        stmt = (
            select(KnowledgeStandard)
            .where(KnowledgeStandard.id == standard_id)
            .options(selectinload(KnowledgeStandard.project_links))
        )
        return db.scalar(stmt)

    def create(self, db: Session, standard: KnowledgeStandard) -> KnowledgeStandard:
        db.add(standard)
        db.commit()
        db.refresh(standard)
        return standard

    def update(self, db: Session, standard: KnowledgeStandard) -> KnowledgeStandard:
        db.add(standard)
        db.commit()
        db.refresh(standard)
        return standard

    def sync_project_links(self, db: Session, standard_id: int, project_ids: list[str]) -> None:
        db.query(StandardProjectLink).filter(StandardProjectLink.standard_id == standard_id).delete()
        if project_ids:
            db.add_all(
                [StandardProjectLink(standard_id=standard_id, project_id=project_id) for project_id in sorted(set(project_ids))]
            )
        db.commit()
