from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.environment import CapabilityProfile, EnvironmentEntrypoint, WorkspaceEnvironment
from app.models.incident import IncidentCard
from app.models.knowledge import KnowledgeNote
from app.models.project import ProjectEnvironmentLink, WorkspaceProject
from app.models.sql_asset import QueryRunRecord, SqlAsset
from app.repositories.company_repo import CompanyRepository
from app.repositories.environment_repo import EnvironmentRepository
from app.repositories.project_repo import ProjectRepository
from app.services.history_service import HistoryService, format_history_description
from app.schemas.environment import EnvironmentCreate, EnvironmentUpdate


class EnvironmentService:
    def __init__(self) -> None:
        self.repo = EnvironmentRepository()
        self.company_repo = CompanyRepository()
        self.history_service = HistoryService()
        self.project_repo = ProjectRepository()

    def list_environments(self, db: Session):
        return self.repo.list(db)

    def get_environment(self, db: Session, environment_id: int):
        return self.repo.get(db, environment_id)

    def create_environment(self, db: Session, payload: EnvironmentCreate):
        if self.company_repo.get_by_name(db, payload.company_name) is None:
            raise HTTPException(status_code=400, detail="所属公司不存在")
        self._validate_name_and_code(db, payload.company_name, payload.environment_name, payload.environment_code)
        self._validate_projects(db, payload.company_name, payload.project_ids)

        environment = WorkspaceEnvironment(
            environment_code=payload.environment_code.strip(),
            company_name=payload.company_name,
            environment_name=payload.environment_name.strip(),
            environment_type=payload.environment_type.strip(),
            account_name=(payload.account_name or "").strip() or None,
            account_password=(payload.account_password or "").strip() or None,
            network_mode=payload.network_mode,
            dialect=payload.dialect,
            timezone=payload.timezone.strip(),
            description=(payload.description or "").strip() or None,
            is_active=payload.is_active,
        )
        environment = self.repo.create(db, environment)
        self._sync_query_portal(db, environment.id, payload.query_portal_url)
        self.project_repo.sync_environment_links(db, environment.id, payload.project_ids)
        self.history_service.log(
            db,
            entity_type="environment",
            entity_key=environment.id,
            action="create",
            title=environment.environment_name,
            description=format_history_description(action_label="创建", entity_label="环境", summary=f"所属公司：{environment.company_name}，数据库：{environment.dialect}"),
        )
        db.commit()
        return self.repo.get(db, environment.id)

    def update_environment(self, db: Session, environment_id: int, payload: EnvironmentUpdate):
        environment = self.get_environment(db, environment_id)
        if environment is None:
            raise HTTPException(status_code=404, detail="环境不存在")
        if self.company_repo.get_by_name(db, payload.company_name) is None:
            raise HTTPException(status_code=400, detail="所属公司不存在")
        self._validate_name_and_code(
            db,
            payload.company_name,
            payload.environment_name,
            environment.environment_code,
            exclude_id=environment_id,
        )
        self._validate_projects(db, payload.company_name, payload.project_ids)

        environment.company_name = payload.company_name
        environment.environment_name = payload.environment_name.strip()
        environment.environment_type = payload.environment_type.strip()
        environment.account_name = (payload.account_name or "").strip() or None
        environment.account_password = (payload.account_password or "").strip() or None
        environment.network_mode = payload.network_mode
        environment.dialect = payload.dialect
        environment.timezone = payload.timezone.strip()
        environment.description = (payload.description or "").strip() or None
        environment.is_active = payload.is_active
        environment.updated_at = datetime.utcnow()
        environment = self.repo.update(db, environment)
        self._sync_query_portal(db, environment.id, payload.query_portal_url)
        self.project_repo.sync_environment_links(db, environment.id, payload.project_ids)
        self.history_service.log(
            db,
            entity_type="environment",
            entity_key=environment.id,
            action="create",
            title=environment.environment_name,
            description=format_history_description(action_label="创建", entity_label="环境", summary=f"所属公司：{environment.company_name}，数据库：{environment.dialect}"),
        )
        db.commit()
        return self.repo.get(db, environment.id)

    def delete_environment(self, db: Session, environment_id: int) -> None:
        environment = self.get_environment(db, environment_id)
        if environment is None:
            raise HTTPException(status_code=404, detail="环境不存在")

        if db.query(SqlAsset).filter(SqlAsset.environment_id == environment_id).count():
            raise HTTPException(status_code=400, detail="环境下仍有 SQL 资产，不能删除")
        if db.query(QueryRunRecord).filter(QueryRunRecord.environment_id == environment_id).count():
            raise HTTPException(status_code=400, detail="环境下仍有运行记录，不能删除")
        if db.query(IncidentCard).filter(IncidentCard.environment_id == environment_id).count():
            raise HTTPException(status_code=400, detail="环境下仍有问题单，不能删除")
        if db.query(KnowledgeNote).filter(KnowledgeNote.environment_id == environment_id).count():
            raise HTTPException(status_code=400, detail="环境下仍有知识记录，不能删除")

        self.history_service.log(
            db,
            entity_type="environment",
            entity_key=environment_id,
            action="delete",
            title=environment.environment_name,
            description=format_history_description(action_label="删除", entity_label="环境", summary=f"所属公司：{environment.company_name}"),
        )
        db.query(ProjectEnvironmentLink).filter(ProjectEnvironmentLink.environment_id == environment_id).delete()
        db.query(EnvironmentEntrypoint).filter(EnvironmentEntrypoint.environment_id == environment_id).delete()
        db.query(CapabilityProfile).filter(CapabilityProfile.environment_id == environment_id).delete()
        db.delete(environment)
        db.commit()

    def _validate_projects(self, db: Session, company_name: str, project_ids: list[str]) -> None:
        if not project_ids:
            return

        projects = [self.project_repo.get(db, project_id) for project_id in sorted(set(project_ids))]
        if any(project is None for project in projects):
            raise HTTPException(status_code=400, detail="关联项目不存在")
        if any(project.company_name != company_name for project in projects if project is not None):
            raise HTTPException(status_code=400, detail="关联项目与所属公司不一致")

    def _validate_name_and_code(
        self,
        db: Session,
        company_name: str,
        environment_name: str,
        environment_code: str,
        exclude_id: int | None = None,
    ) -> None:
        normalized_name = environment_name.strip()
        normalized_code = environment_code.strip()
        if not normalized_name:
            raise HTTPException(status_code=400, detail="环境名称不能为空")
        if not normalized_code:
            raise HTTPException(status_code=400, detail="环境编码不能为空")
        for item in self.repo.list(db):
            if exclude_id is not None and item.id == exclude_id:
                continue
            if item.environment_code == normalized_code:
                raise HTTPException(status_code=400, detail="环境编码已存在")
            if item.company_name == company_name and item.environment_name == normalized_name:
                raise HTTPException(status_code=400, detail="同公司下环境名称已存在")

    def _sync_query_portal(self, db: Session, environment_id: int, query_portal_url: str | None) -> None:
        normalized_url = (query_portal_url or "").strip()
        existing = (
            db.query(EnvironmentEntrypoint)
            .filter(
                EnvironmentEntrypoint.environment_id == environment_id,
                EnvironmentEntrypoint.entry_type == "query_portal",
            )
            .first()
        )

        if not normalized_url:
            if existing is not None:
                db.delete(existing)
                db.commit()
            return

        if existing is None:
            db.add(
                EnvironmentEntrypoint(
                    environment_id=environment_id,
                    entry_type="query_portal",
                    entry_name="查询页面",
                    entry_url=normalized_url,
                    description="环境查询入口",
                    display_order=1,
                )
            )
        else:
            existing.entry_name = "查询页面"
            existing.entry_url = normalized_url
            existing.description = "环境查询入口"
            existing.display_order = 1
            existing.updated_at = datetime.utcnow()
            db.add(existing)
        db.commit()

    def list_history(self, db: Session, environment_id: int):
        return self.history_service.list(db, entity_type="environment", entity_key=str(environment_id))
