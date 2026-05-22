from __future__ import annotations

from typing import Optional

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models.warehouse_model import WarehouseModel, WarehouseModelProjectLink


class WarehouseModelRepository:
    def list(self, db: Session) -> list[WarehouseModel]:
        stmt = (
            select(WarehouseModel)
            .options(selectinload(WarehouseModel.project_links))
            .order_by(WarehouseModel.updated_at.desc(), WarehouseModel.id.desc())
        )
        return list(db.scalars(stmt).all())

    def get(self, db: Session, model_id: int) -> Optional[WarehouseModel]:
        stmt = (
            select(WarehouseModel)
            .where(WarehouseModel.id == model_id)
            .options(selectinload(WarehouseModel.project_links))
        )
        return db.scalar(stmt)

    def get_by_code(self, db: Session, model_code: str) -> Optional[WarehouseModel]:
        stmt = select(WarehouseModel).where(WarehouseModel.model_code == model_code)
        return db.scalar(stmt)

    def create(self, db: Session, model: WarehouseModel) -> WarehouseModel:
        db.add(model)
        db.commit()
        db.refresh(model)
        return model

    def update(self, db: Session, model: WarehouseModel) -> WarehouseModel:
        db.add(model)
        db.commit()
        db.refresh(model)
        return model

    def sync_project_links(self, db: Session, model_id: int, project_ids: list[str]) -> None:
        db.execute(delete(WarehouseModelProjectLink).where(WarehouseModelProjectLink.model_id == model_id))
        for project_id in sorted(set(project_ids)):
            db.add(WarehouseModelProjectLink(model_id=model_id, project_id=project_id))
        db.commit()
