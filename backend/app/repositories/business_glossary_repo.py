from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.knowledge import BusinessGlossary, GlossaryProjectLink


class BusinessGlossaryRepository:
    def list(self, db: Session) -> list[BusinessGlossary]:
        stmt = (
            select(BusinessGlossary)
            .options(selectinload(BusinessGlossary.project_links))
            .order_by(BusinessGlossary.updated_at.desc())
        )
        return list(db.scalars(stmt).all())

    def get(self, db: Session, glossary_id: int) -> Optional[BusinessGlossary]:
        stmt = (
            select(BusinessGlossary)
            .where(BusinessGlossary.id == glossary_id)
            .options(selectinload(BusinessGlossary.project_links))
        )
        return db.scalar(stmt)

    def create(self, db: Session, glossary: BusinessGlossary) -> BusinessGlossary:
        db.add(glossary)
        db.commit()
        db.refresh(glossary)
        return glossary

    def update(self, db: Session, glossary: BusinessGlossary) -> BusinessGlossary:
        db.add(glossary)
        db.commit()
        db.refresh(glossary)
        return glossary

    def sync_project_links(self, db: Session, glossary_id: int, project_ids: list[str]) -> None:
        db.query(GlossaryProjectLink).filter(GlossaryProjectLink.glossary_id == glossary_id).delete()
        if project_ids:
            db.add_all(
                [GlossaryProjectLink(glossary_id=glossary_id, project_id=project_id) for project_id in sorted(set(project_ids))]
            )
        db.commit()
