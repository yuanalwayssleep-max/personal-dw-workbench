from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.knowledge import KnowledgeStandard
from app.models.project import WorkspaceProject
from app.repositories.company_repo import CompanyRepository
from app.repositories.knowledge_standard_repo import KnowledgeStandardRepository
from app.repositories.project_repo import ProjectRepository
from app.services.history_service import HistoryService, format_history_description
from app.schemas.knowledge_standard import (
    KnowledgeStandardCreate,
    KnowledgeStandardRead,
    KnowledgeStandardUpdate,
)


class KnowledgeStandardService:
    def __init__(self) -> None:
        self.repo = KnowledgeStandardRepository()
        self.company_repo = CompanyRepository()
        self.history_service = HistoryService()
        self.project_repo = ProjectRepository()

    def list_standards(self, db: Session) -> list[KnowledgeStandardRead]:
        return [self._to_read(item, db) for item in self.repo.list(db)]

    def get_standard(self, db: Session, standard_id: int) -> KnowledgeStandardRead:
        standard = self.repo.get(db, standard_id)
        if standard is None:
            raise HTTPException(status_code=404, detail="规范标准不存在")
        return self._to_read(standard, db)

    def create_standard(self, db: Session, payload: KnowledgeStandardCreate) -> KnowledgeStandardRead:
        company_name = self._normalize_company_name(payload.company_name)
        self._validate_company_and_projects(db, company_name, payload.project_ids)
        self._validate_duplicate(db, payload.standard_name, payload.standard_type, company_name)

        standard = KnowledgeStandard(
            standard_name=payload.standard_name.strip(),
            standard_type=payload.standard_type.strip(),
            company_name=company_name,
            status=payload.status.strip(),
            rule_content=payload.rule_content.strip(),
            positive_example=(payload.positive_example or "").strip() or None,
            negative_example=(payload.negative_example or "").strip() or None,
            note=(payload.note or "").strip() or None,
        )
        standard = self.repo.create(db, standard)
        self.repo.sync_project_links(db, standard.id, payload.project_ids)
        self.history_service.log(
            db,
            entity_type="knowledge_standard",
            entity_key=standard.id,
            action="create",
            title=standard.standard_name,
            description=format_history_description(action_label="创建", entity_label="规范标准", summary=f"规范类型：{standard.standard_type}"),
        )
        db.commit()
        standard = self.repo.get(db, standard.id)
        if standard is None:
            raise HTTPException(status_code=500, detail="规范标准创建失败")
        return self._to_read(standard, db)

    def update_standard(self, db: Session, standard_id: int, payload: KnowledgeStandardUpdate) -> KnowledgeStandardRead:
        standard = self.repo.get(db, standard_id)
        if standard is None:
            raise HTTPException(status_code=404, detail="规范标准不存在")

        company_name = self._normalize_company_name(payload.company_name)
        self._validate_company_and_projects(db, company_name, payload.project_ids)
        self._validate_duplicate(db, payload.standard_name, payload.standard_type, company_name, exclude_id=standard_id)

        standard.standard_name = payload.standard_name.strip()
        standard.standard_type = payload.standard_type.strip()
        standard.company_name = company_name
        standard.status = payload.status.strip()
        standard.rule_content = payload.rule_content.strip()
        standard.positive_example = (payload.positive_example or "").strip() or None
        standard.negative_example = (payload.negative_example or "").strip() or None
        standard.note = (payload.note or "").strip() or None
        standard.updated_at = datetime.utcnow()
        self.repo.update(db, standard)
        self.repo.sync_project_links(db, standard_id, payload.project_ids)
        self.history_service.log(
            db,
            entity_type="knowledge_standard",
            entity_key=standard_id,
            action="update",
            title=standard.standard_name,
            description=format_history_description(action_label="更新", entity_label="规范标准", summary=f"规范类型：{standard.standard_type}，状态：{standard.status}"),
        )
        db.commit()
        standard = self.repo.get(db, standard_id)
        if standard is None:
            raise HTTPException(status_code=500, detail="规范标准更新失败")
        return self._to_read(standard, db)

    def delete_standard(self, db: Session, standard_id: int) -> None:
        standard = self.repo.get(db, standard_id)
        if standard is None:
            raise HTTPException(status_code=404, detail="规范标准不存在")
        self.history_service.log(
            db,
            entity_type="knowledge_standard",
            entity_key=standard_id,
            action="delete",
            title=standard.standard_name,
            description=format_history_description(action_label="删除", entity_label="规范标准", summary=f"规范类型：{standard.standard_type}"),
        )
        db.delete(standard)
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

    def _validate_duplicate(
        self,
        db: Session,
        standard_name: str,
        standard_type: str,
        company_name: str | None,
        exclude_id: int | None = None,
    ) -> None:
        normalized_name = standard_name.strip()
        normalized_type = standard_type.strip()
        if not normalized_name:
            raise HTTPException(status_code=400, detail="标准名称不能为空")
        if not normalized_type:
            raise HTTPException(status_code=400, detail="规范类型不能为空")
        for item in self.repo.list(db):
            if exclude_id is not None and item.id == exclude_id:
                continue
            if (
                item.standard_name == normalized_name
                and item.standard_type == normalized_type
                and item.company_name == company_name
            ):
                raise HTTPException(status_code=400, detail="同范围下标准名称和规范类型已存在")

    def _to_read(self, standard: KnowledgeStandard, db: Session) -> KnowledgeStandardRead:
        project_ids = [link.project_id for link in standard.project_links]
        project_names = []
        for project_id in project_ids:
            project = self.project_repo.get(db, project_id)
            if project is not None:
                project_names.append(project.project_name)
        return KnowledgeStandardRead(
            id=standard.id,
            standard_name=standard.standard_name,
            standard_type=standard.standard_type,
            company_name=standard.company_name,
            status=standard.status,
            rule_content=standard.rule_content,
            positive_example=standard.positive_example,
            negative_example=standard.negative_example,
            note=standard.note,
            project_ids=project_ids,
            project_names=project_names,
            created_at=standard.created_at,
            updated_at=standard.updated_at,
        )

    def list_history(self, db: Session, standard_id: int):
        return self.history_service.list(db, entity_type="knowledge_standard", entity_key=str(standard_id))
