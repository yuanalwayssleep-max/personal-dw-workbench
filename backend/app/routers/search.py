from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import ok
from app.schemas.incident import IncidentRead
from app.schemas.knowledge import KnowledgeNoteRead
from app.schemas.sql_asset import SqlAssetRead
from app.services.search_service import SearchService

router = APIRouter(tags=["search"])
service = SearchService()


@router.get("/search")
def global_search(keyword: Optional[str] = Query(default=None), db: Session = Depends(get_db)):
    result = service.global_search(db, keyword)
    return ok(
        {
            "sql_assets": [SqlAssetRead.model_validate(item).model_dump() for item in result["sql_assets"]],
            "incidents": [IncidentRead.model_validate(item).model_dump() for item in result["incidents"]],
            "knowledge_notes": [KnowledgeNoteRead.model_validate(item).model_dump() for item in result["knowledge_notes"]],
        }
    )
