from __future__ import annotations

from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models.project import ProjectEnvironmentLink, WorkspaceProject


class ProjectRepository:
    def list(self, db: Session) -> list[WorkspaceProject]:
        stmt = (
            select(WorkspaceProject)
            .options(selectinload(WorkspaceProject.environment_links))
            .order_by(WorkspaceProject.project_name.asc())
        )
        return list(db.scalars(stmt).all())

    def get(self, db: Session, project_id: str) -> Optional[WorkspaceProject]:
        stmt = (
            select(WorkspaceProject)
            .where(WorkspaceProject.id == project_id)
            .options(selectinload(WorkspaceProject.environment_links))
        )
        return db.scalar(stmt)

    def create(self, db: Session, project: WorkspaceProject) -> WorkspaceProject:
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    def update(self, db: Session, project: WorkspaceProject) -> WorkspaceProject:
        db.add(project)
        db.commit()
        db.refresh(project)
        return project

    def sync_project_links(self, db: Session, project_id: str, environment_ids: list[int]) -> None:
        db.execute(delete(ProjectEnvironmentLink).where(ProjectEnvironmentLink.project_id == project_id))
        for environment_id in sorted(set(environment_ids)):
            db.add(ProjectEnvironmentLink(project_id=project_id, environment_id=environment_id))
        db.commit()

    def sync_environment_links(self, db: Session, environment_id: int, project_ids: list[str]) -> None:
        db.execute(
            delete(ProjectEnvironmentLink).where(ProjectEnvironmentLink.environment_id == environment_id)
        )
        for project_id in sorted(set(project_ids)):
            db.add(ProjectEnvironmentLink(project_id=project_id, environment_id=environment_id))
        db.commit()
