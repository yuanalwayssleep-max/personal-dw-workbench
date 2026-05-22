from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import ok
from app.schemas.sql_asset import (
    CreateIncidentFromSql,
    FavoriteUpdate,
    QueryRunCreate,
    QueryRunRead,
    SqlAssetCreate,
    SqlAssetRead,
    SqlAssetUpdate,
    SqlSnapshotCreate,
    SqlSnapshotRead,
)
from app.services.sql_workspace_service import SqlWorkspaceService

router = APIRouter(tags=["sql-workspace"])
service = SqlWorkspaceService()


@router.get("/sql-assets")
def list_sql_assets(db: Session = Depends(get_db)):
    items = [SqlAssetRead.model_validate(item).model_dump() for item in service.list_sql_assets(db)]
    return ok({"items": items})


@router.get("/sql-assets/{sql_asset_id}")
def get_sql_asset(sql_asset_id: int, db: Session = Depends(get_db)):
    item = service.get_sql_asset(db, sql_asset_id)
    return ok(SqlAssetRead.model_validate(item).model_dump())


@router.post("/sql-assets")
def create_sql_asset(payload: SqlAssetCreate, db: Session = Depends(get_db)):
    item = service.create_sql_asset(db, payload)
    return ok(SqlAssetRead.model_validate(item).model_dump())


@router.put("/sql-assets/{sql_asset_id}")
def update_sql_asset(sql_asset_id: int, payload: SqlAssetUpdate, db: Session = Depends(get_db)):
    item = service.update_sql_asset(db, sql_asset_id, payload)
    return ok(SqlAssetRead.model_validate(item).model_dump())


@router.post("/sql-assets/{sql_asset_id}/favorite")
def update_favorite(sql_asset_id: int, payload: FavoriteUpdate, db: Session = Depends(get_db)):
    item = service.update_favorite(db, sql_asset_id, payload.is_favorite)
    return ok(SqlAssetRead.model_validate(item).model_dump())


@router.post("/sql-assets/{sql_asset_id}/snapshots")
def create_snapshot(sql_asset_id: int, payload: SqlSnapshotCreate, db: Session = Depends(get_db)):
    item = service.create_snapshot(db, sql_asset_id, payload.change_note)
    return ok(SqlSnapshotRead.model_validate(item).model_dump())


@router.get("/sql-assets/{sql_asset_id}/snapshots")
def list_snapshots(sql_asset_id: int, db: Session = Depends(get_db)):
    items = [SqlSnapshotRead.model_validate(item).model_dump() for item in service.list_snapshots(db, sql_asset_id)]
    return ok({"items": items})


@router.post("/query-runs")
def create_query_run(payload: QueryRunCreate, db: Session = Depends(get_db)):
    item = service.create_query_run(db, payload)
    return ok(QueryRunRead.model_validate(item).model_dump())


@router.get("/sql-assets/{sql_asset_id}/query-runs")
def list_query_runs(sql_asset_id: int, db: Session = Depends(get_db)):
    items = [QueryRunRead.model_validate(item).model_dump() for item in service.list_query_runs(db, sql_asset_id)]
    return ok({"items": items})


@router.post("/sql-assets/{sql_asset_id}/create-incident")
def create_incident_from_sql(sql_asset_id: int, payload: CreateIncidentFromSql, db: Session = Depends(get_db)):
    item = service.create_incident_from_sql(db, sql_asset_id, payload)
    return ok({"id": item.id, "title": item.title, "status": item.status})
