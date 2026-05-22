from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.knowledge import MetricDefinition, MetricProjectLink


class MetricDefinitionRepository:
    def list(self, db: Session) -> list[MetricDefinition]:
        stmt = (
            select(MetricDefinition)
            .options(selectinload(MetricDefinition.project_links))
            .order_by(MetricDefinition.updated_at.desc())
        )
        return list(db.scalars(stmt).all())

    def get(self, db: Session, metric_id: int) -> Optional[MetricDefinition]:
        stmt = (
            select(MetricDefinition)
            .where(MetricDefinition.id == metric_id)
            .options(selectinload(MetricDefinition.project_links))
        )
        return db.scalar(stmt)

    def create(self, db: Session, metric: MetricDefinition) -> MetricDefinition:
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric

    def update(self, db: Session, metric: MetricDefinition) -> MetricDefinition:
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric

    def sync_project_links(self, db: Session, metric_id: int, project_ids: list[str]) -> None:
        db.query(MetricProjectLink).filter(MetricProjectLink.metric_id == metric_id).delete()
        if project_ids:
            db.add_all([MetricProjectLink(metric_id=metric_id, project_id=project_id) for project_id in sorted(set(project_ids))])
        db.commit()
