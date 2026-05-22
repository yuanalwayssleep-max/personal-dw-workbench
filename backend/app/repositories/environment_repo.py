from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.environment import WorkspaceEnvironment


class EnvironmentRepository:
    def list(self, db: Session) -> list[WorkspaceEnvironment]:
        stmt = (
            select(WorkspaceEnvironment)
            .options(
                selectinload(WorkspaceEnvironment.entrypoints),
                selectinload(WorkspaceEnvironment.capabilities),
            )
            .order_by(WorkspaceEnvironment.id.asc())
        )
        return list(db.scalars(stmt).all())

    def get(self, db: Session, environment_id: int) -> Optional[WorkspaceEnvironment]:
        stmt = (
            select(WorkspaceEnvironment)
            .where(WorkspaceEnvironment.id == environment_id)
            .options(
                selectinload(WorkspaceEnvironment.entrypoints),
                selectinload(WorkspaceEnvironment.capabilities),
            )
        )
        return db.scalar(stmt)


    def create(self, db: Session, environment: WorkspaceEnvironment) -> WorkspaceEnvironment:
        db.add(environment)
        db.commit()
        db.refresh(environment)
        return environment

    def update(self, db: Session, environment: WorkspaceEnvironment) -> WorkspaceEnvironment:
        db.add(environment)
        db.commit()
        db.refresh(environment)
        return environment
