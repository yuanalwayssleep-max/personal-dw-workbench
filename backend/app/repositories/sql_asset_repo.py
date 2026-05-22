from __future__ import annotations

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.sql_asset import QueryRunRecord, SqlAsset, SqlSnapshot


class SqlAssetRepository:
    def list(self, db: Session) -> list[SqlAsset]:
        stmt = select(SqlAsset).order_by(SqlAsset.updated_at.desc())
        return list(db.scalars(stmt).all())

    def get(self, db: Session, sql_asset_id: int) -> Optional[SqlAsset]:
        stmt = select(SqlAsset).where(SqlAsset.id == sql_asset_id)
        return db.scalar(stmt)

    def create(self, db: Session, sql_asset: SqlAsset) -> SqlAsset:
        db.add(sql_asset)
        db.commit()
        db.refresh(sql_asset)
        return sql_asset

    def update(self, db: Session, sql_asset: SqlAsset) -> SqlAsset:
        db.add(sql_asset)
        db.commit()
        db.refresh(sql_asset)
        return sql_asset

    def create_snapshot(self, db: Session, snapshot: SqlSnapshot) -> SqlSnapshot:
        db.add(snapshot)
        db.commit()
        db.refresh(snapshot)
        return snapshot

    def next_snapshot_version(self, db: Session, sql_asset_id: int) -> int:
        stmt = select(func.max(SqlSnapshot.version_no)).where(SqlSnapshot.sql_asset_id == sql_asset_id)
        current = db.scalar(stmt)
        return 1 if current is None else current + 1

    def list_snapshots(self, db: Session, sql_asset_id: int) -> list[SqlSnapshot]:
        stmt = (
            select(SqlSnapshot)
            .where(SqlSnapshot.sql_asset_id == sql_asset_id)
            .order_by(SqlSnapshot.version_no.desc())
        )
        return list(db.scalars(stmt).all())

    def create_run(self, db: Session, run: QueryRunRecord) -> QueryRunRecord:
        db.add(run)
        db.commit()
        db.refresh(run)
        return run

    def list_runs(self, db: Session, sql_asset_id: int) -> list[QueryRunRecord]:
        stmt = (
            select(QueryRunRecord)
            .where(QueryRunRecord.sql_asset_id == sql_asset_id)
            .order_by(QueryRunRecord.executed_at.desc())
        )
        return list(db.scalars(stmt).all())
