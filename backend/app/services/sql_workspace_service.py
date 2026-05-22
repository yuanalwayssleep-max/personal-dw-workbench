from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.incident import IncidentCard, IncidentLink
from app.models.sql_asset import QueryRunRecord, SqlAsset, SqlSnapshot
from app.repositories.incident_repo import IncidentRepository
from app.repositories.sql_asset_repo import SqlAssetRepository
from app.schemas.sql_asset import CreateIncidentFromSql, QueryRunCreate, SqlAssetCreate, SqlAssetUpdate


class SqlWorkspaceService:
    def __init__(self) -> None:
        self.repo = SqlAssetRepository()
        self.incident_repo = IncidentRepository()

    def list_sql_assets(self, db: Session):
        return self.repo.list(db)

    def get_sql_asset(self, db: Session, sql_asset_id: int):
        sql_asset = self.repo.get(db, sql_asset_id)
        if sql_asset is None:
            raise HTTPException(status_code=404, detail="SQL asset not found")
        return sql_asset

    def create_sql_asset(self, db: Session, payload: SqlAssetCreate):
        sql_asset = SqlAsset(**payload.model_dump())
        return self.repo.create(db, sql_asset)

    def update_sql_asset(self, db: Session, sql_asset_id: int, payload: SqlAssetUpdate):
        sql_asset = self.get_sql_asset(db, sql_asset_id)
        for key, value in payload.model_dump().items():
            setattr(sql_asset, key, value)
        sql_asset.updated_at = datetime.utcnow()
        return self.repo.update(db, sql_asset)

    def update_favorite(self, db: Session, sql_asset_id: int, is_favorite: bool):
        sql_asset = self.get_sql_asset(db, sql_asset_id)
        sql_asset.is_favorite = is_favorite
        sql_asset.updated_at = datetime.utcnow()
        return self.repo.update(db, sql_asset)

    def create_snapshot(self, db: Session, sql_asset_id: int, change_note: Optional[str]):
        sql_asset = self.get_sql_asset(db, sql_asset_id)
        version_no = self.repo.next_snapshot_version(db, sql_asset_id)
        snapshot = SqlSnapshot(
            sql_asset_id=sql_asset_id,
            version_no=version_no,
            content=sql_asset.content,
            change_note=change_note,
        )
        return self.repo.create_snapshot(db, snapshot)

    def list_snapshots(self, db: Session, sql_asset_id: int):
        self.get_sql_asset(db, sql_asset_id)
        return self.repo.list_snapshots(db, sql_asset_id)

    def create_query_run(self, db: Session, payload: QueryRunCreate):
        run = QueryRunRecord(**payload.model_dump())
        return self.repo.create_run(db, run)

    def list_query_runs(self, db: Session, sql_asset_id: int):
        self.get_sql_asset(db, sql_asset_id)
        return self.repo.list_runs(db, sql_asset_id)

    def create_incident_from_sql(self, db: Session, sql_asset_id: int, payload: CreateIncidentFromSql):
        sql_asset = self.get_sql_asset(db, sql_asset_id)
        incident = IncidentCard(
            environment_id=sql_asset.environment_id,
            title=payload.title,
            incident_type=payload.incident_type,
            severity=payload.severity,
            symptom_desc=payload.symptom_desc or payload.result_summary,
            status="open",
        )
        incident = self.incident_repo.create(db, incident)
        self.incident_repo.create_link(
            db,
            IncidentLink(
                incident_id=incident.id,
                target_type="sql_asset",
                target_id=sql_asset.id,
                link_role="primary",
            ),
        )
        return incident
