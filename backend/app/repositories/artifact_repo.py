from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.artifact import ExternalAssetRef


class ArtifactRepository:
    def get_external_asset(self, db: Session, external_asset_id: int) -> Optional[ExternalAssetRef]:
        stmt = select(ExternalAssetRef).where(ExternalAssetRef.id == external_asset_id)
        return db.scalar(stmt)

    def create_external_asset(self, db: Session, asset: ExternalAssetRef) -> ExternalAssetRef:
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset
