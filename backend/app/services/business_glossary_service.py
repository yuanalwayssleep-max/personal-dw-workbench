from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.knowledge import BusinessGlossary
from app.repositories.business_glossary_repo import BusinessGlossaryRepository
from app.repositories.company_repo import CompanyRepository
from app.repositories.project_repo import ProjectRepository
from app.services.history_service import HistoryService, format_history_description
from app.schemas.business_glossary import (
    BusinessGlossaryCreate,
    BusinessGlossaryRead,
    BusinessGlossaryUpdate,
)


class BusinessGlossaryService:
    def __init__(self) -> None:
        self.repo = BusinessGlossaryRepository()
        self.company_repo = CompanyRepository()
        self.history_service = HistoryService()
        self.project_repo = ProjectRepository()

    def list_glossaries(self, db: Session) -> list[BusinessGlossaryRead]:
        return [self._to_read(item, db) for item in self.repo.list(db)]

    def get_glossary(self, db: Session, glossary_id: int) -> BusinessGlossaryRead:
        glossary = self.repo.get(db, glossary_id)
        if glossary is None:
            raise HTTPException(status_code=404, detail="业务口径不存在")
        return self._to_read(glossary, db)

    def create_glossary(self, db: Session, payload: BusinessGlossaryCreate) -> BusinessGlossaryRead:
        company_name = self._normalize_company_name(payload.company_name)
        self._validate_company_and_projects(db, company_name, payload.project_ids)
        self._validate_duplicate(db, payload.glossary_name, company_name)
        glossary = BusinessGlossary(
            glossary_name=payload.glossary_name.strip(),
            business_domain=payload.business_domain.strip(),
            company_name=company_name,
            definition=payload.definition.strip(),
            statistical_scope=(payload.statistical_scope or "").strip() or None,
            data_source=(payload.data_source or "").strip() or None,
            note=(payload.note or "").strip() or None,
        )
        glossary = self.repo.create(db, glossary)
        self.repo.sync_project_links(db, glossary.id, payload.project_ids)
        self.history_service.log(
            db,
            entity_type="business_glossary",
            entity_key=glossary.id,
            action="create",
            title=glossary.glossary_name,
            description=format_history_description(action_label="创建", entity_label="业务口径", summary=f"业务域：{glossary.business_domain}"),
        )
        db.commit()
        glossary = self.repo.get(db, glossary.id)
        if glossary is None:
            raise HTTPException(status_code=500, detail="业务口径创建失败")
        return self._to_read(glossary, db)

    def update_glossary(self, db: Session, glossary_id: int, payload: BusinessGlossaryUpdate) -> BusinessGlossaryRead:
        glossary = self.repo.get(db, glossary_id)
        if glossary is None:
            raise HTTPException(status_code=404, detail="业务口径不存在")
        company_name = self._normalize_company_name(payload.company_name)
        self._validate_company_and_projects(db, company_name, payload.project_ids)
        self._validate_duplicate(db, payload.glossary_name, company_name, exclude_id=glossary_id)
        glossary.glossary_name = payload.glossary_name.strip()
        glossary.business_domain = payload.business_domain.strip()
        glossary.company_name = company_name
        glossary.definition = payload.definition.strip()
        glossary.statistical_scope = (payload.statistical_scope or "").strip() or None
        glossary.data_source = (payload.data_source or "").strip() or None
        glossary.note = (payload.note or "").strip() or None
        glossary.updated_at = datetime.utcnow()
        self.repo.update(db, glossary)
        self.repo.sync_project_links(db, glossary_id, payload.project_ids)
        self.history_service.log(
            db,
            entity_type="business_glossary",
            entity_key=glossary_id,
            action="update",
            title=glossary.glossary_name,
            description=format_history_description(action_label="更新", entity_label="业务口径", summary=f"业务域：{glossary.business_domain}"),
        )
        db.commit()
        glossary = self.repo.get(db, glossary_id)
        if glossary is None:
            raise HTTPException(status_code=500, detail="业务口径更新失败")
        return self._to_read(glossary, db)

    def delete_glossary(self, db: Session, glossary_id: int) -> None:
        glossary = self.repo.get(db, glossary_id)
        if glossary is None:
            raise HTTPException(status_code=404, detail="业务口径不存在")
        self.history_service.log(
            db,
            entity_type="business_glossary",
            entity_key=glossary_id,
            action="delete",
            title=glossary.glossary_name,
            description=format_history_description(action_label="删除", entity_label="业务口径", summary=f"业务域：{glossary.business_domain}"),
        )
        db.delete(glossary)
        db.commit()

    def _normalize_company_name(self, company_name: str | None) -> str | None:
        return (company_name or "").strip() or None

    def _validate_company_and_projects(self, db: Session, company_name: str | None, project_ids: list[str]) -> None:
        if company_name and self.company_repo.get_by_name(db, company_name) is None:
            raise HTTPException(status_code=400, detail="所属公司不存在")
        if not project_ids:
            return
        if not company_name:
            raise HTTPException(status_code=400, detail="选择项目时必须先选择所属公司")
        projects = [self.project_repo.get(db, project_id) for project_id in sorted(set(project_ids))]
        if any(project is None for project in projects):
            raise HTTPException(status_code=400, detail="适用项目不存在")
        if any(project.company_name != company_name for project in projects if project is not None):
            raise HTTPException(status_code=400, detail="适用项目与所属公司不一致")

    def _validate_duplicate(self, db: Session, glossary_name: str, company_name: str | None, exclude_id: int | None = None) -> None:
        normalized_name = glossary_name.strip()
        if not normalized_name:
            raise HTTPException(status_code=400, detail="口径名称不能为空")
        for item in self.repo.list(db):
            if exclude_id is not None and item.id == exclude_id:
                continue
            if item.glossary_name == normalized_name and item.company_name == company_name:
                raise HTTPException(status_code=400, detail="同范围下口径名称已存在")

    def _to_read(self, glossary: BusinessGlossary, db: Session) -> BusinessGlossaryRead:
        project_ids = [link.project_id for link in glossary.project_links]
        project_names = []
        for project_id in project_ids:
            project = self.project_repo.get(db, project_id)
            if project is not None:
                project_names.append(project.project_name)
        return BusinessGlossaryRead(
            id=glossary.id,
            glossary_name=glossary.glossary_name,
            business_domain=glossary.business_domain,
            company_name=glossary.company_name,
            definition=glossary.definition,
            statistical_scope=glossary.statistical_scope,
            data_source=glossary.data_source,
            note=glossary.note,
            project_ids=project_ids,
            project_names=project_names,
            created_at=glossary.created_at,
            updated_at=glossary.updated_at,
        )

    def list_history(self, db: Session, glossary_id: int):
        return self.history_service.list(db, entity_type="business_glossary", entity_key=str(glossary_id))
