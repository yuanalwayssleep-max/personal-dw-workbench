from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.repositories.incident_repo import IncidentRepository
from app.repositories.knowledge_repo import KnowledgeRepository
from app.repositories.sql_asset_repo import SqlAssetRepository


class SearchService:
    def __init__(self) -> None:
        self.sql_repo = SqlAssetRepository()
        self.incident_repo = IncidentRepository()
        self.knowledge_repo = KnowledgeRepository()

    def global_search(self, db: Session, keyword: Optional[str]):
        sql_assets = self.sql_repo.list(db)
        incidents = self.incident_repo.list(db)
        notes = self.knowledge_repo.list(db)

        if not keyword:
            return {
                "sql_assets": sql_assets[:5],
                "incidents": incidents[:5],
                "knowledge_notes": notes[:5],
            }

        key = keyword.lower()
        return {
            "sql_assets": [item for item in sql_assets if key in item.title.lower()][:10],
            "incidents": [item for item in incidents if key in item.title.lower()][:10],
            "knowledge_notes": [item for item in notes if key in item.title.lower()][:10],
        }
