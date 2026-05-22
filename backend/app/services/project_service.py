from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.environment import WorkspaceEnvironment
from app.models.knowledge import StandardProjectLink
from app.models.project import ProjectEnvironmentLink, WorkspaceProject
from app.models.warehouse_model import WarehouseModelProjectLink
from app.repositories.company_repo import CompanyRepository
from app.repositories.project_repo import ProjectRepository
from app.services.history_service import HistoryService, format_history_description
from app.schemas.project import WorkspaceProjectCreate, WorkspaceProjectRead, WorkspaceProjectUpdate


class ProjectService:
    def __init__(self) -> None:
        self.repo = ProjectRepository()
        self.company_repo = CompanyRepository()
        self.history_service = HistoryService()

    def list_projects(self, db: Session) -> list[WorkspaceProjectRead]:
        return [self._to_read(item) for item in self.repo.list(db)]

    def create_project(self, db: Session, payload: WorkspaceProjectCreate) -> WorkspaceProjectRead:
        if self.repo.get(db, payload.id) is not None:
            raise HTTPException(status_code=400, detail="项目标识已存在")
        if self.company_repo.get_by_name(db, payload.companyName) is None:
            raise HTTPException(status_code=400, detail="所属公司不存在")
        self._validate_project_name(db, payload.companyName, payload.name)
        self._validate_environments(db, payload.companyName, payload.environmentIds)

        project = WorkspaceProject(
            id=payload.id,
            project_name=payload.name.strip(),
            company_name=payload.companyName,
            description=(payload.description or "").strip() or None,
        )
        self.repo.create(db, project)
        self.repo.sync_project_links(db, project.id, payload.environmentIds)
        self.history_service.log(
            db,
            entity_type="project",
            entity_key=project.id,
            action="create",
            title=project.project_name,
            description=format_history_description(action_label="创建", entity_label="项目", summary=f"所属公司：{project.company_name}"),
        )
        db.commit()
        project = self.repo.get(db, project.id)
        if project is None:
            raise HTTPException(status_code=500, detail="项目创建失败")
        return self._to_read(project)

    def update_project(self, db: Session, project_id: str, payload: WorkspaceProjectUpdate) -> WorkspaceProjectRead:
        project = self.repo.get(db, project_id)
        if project is None:
            raise HTTPException(status_code=404, detail="项目不存在")
        if self.company_repo.get_by_name(db, payload.companyName) is None:
            raise HTTPException(status_code=400, detail="所属公司不存在")
        self._validate_project_name(db, payload.companyName, payload.name, exclude_id=project_id)
        self._validate_environments(db, payload.companyName, payload.environmentIds)

        project.project_name = payload.name.strip()
        project.company_name = payload.companyName
        project.description = (payload.description or "").strip() or None
        project.updated_at = datetime.utcnow()
        self.repo.update(db, project)
        self.repo.sync_project_links(db, project_id, payload.environmentIds)
        self.history_service.log(
            db,
            entity_type="project",
            entity_key=project_id,
            action="update",
            title=project.project_name,
            description=format_history_description(action_label="更新", entity_label="项目", summary=f"所属公司：{project.company_name}，关联环境数：{len(payload.environmentIds)}"),
        )
        db.commit()
        project = self.repo.get(db, project_id)
        if project is None:
            raise HTTPException(status_code=500, detail="项目更新失败")
        return self._to_read(project)

    def delete_project(self, db: Session, project_id: str) -> None:
        project = self.repo.get(db, project_id)
        if project is None:
            raise HTTPException(status_code=404, detail="项目不存在")
        standard_count = db.query(StandardProjectLink).filter(StandardProjectLink.project_id == project_id).count()
        model_count = db.query(WarehouseModelProjectLink).filter(WarehouseModelProjectLink.project_id == project_id).count()
        if standard_count or model_count:
            raise HTTPException(status_code=400, detail="项目已被规范标准或模型引用，不能删除")
        self.history_service.log(
            db,
            entity_type="project",
            entity_key=project_id,
            action="delete",
            title=project.project_name,
            description=format_history_description(action_label="删除", entity_label="项目", summary=f"所属公司：{project.company_name}"),
        )
        db.query(ProjectEnvironmentLink).filter(ProjectEnvironmentLink.project_id == project_id).delete()
        db.delete(project)
        db.commit()

    def _validate_project_name(
        self,
        db: Session,
        company_name: str,
        project_name: str,
        exclude_id: str | None = None,
    ) -> None:
        normalized = project_name.strip()
        if not normalized:
            raise HTTPException(status_code=400, detail="项目名称不能为空")
        for item in self.repo.list(db):
            if exclude_id is not None and item.id == exclude_id:
                continue
            if item.company_name == company_name and item.project_name == normalized:
                raise HTTPException(status_code=400, detail="同公司下项目名称已存在")

    def _validate_environments(self, db: Session, company_name: str, environment_ids: list[int]) -> None:
        if not environment_ids:
            return

        environments = list(
            db.query(WorkspaceEnvironment).filter(WorkspaceEnvironment.id.in_(environment_ids)).all()
        )
        if len(environments) != len(set(environment_ids)):
            raise HTTPException(status_code=400, detail="关联环境不存在")
        if any(environment.company_name != company_name for environment in environments):
            raise HTTPException(status_code=400, detail="关联环境与所属公司不一致")

    def _to_read(self, project: WorkspaceProject) -> WorkspaceProjectRead:
        return WorkspaceProjectRead(
            id=project.id,
            name=project.project_name,
            companyName=project.company_name,
            description=project.description or "",
            environmentIds=[link.environment_id for link in project.environment_links],
            updatedAt=project.updated_at,
        )

    def list_history(self, db: Session, project_id: str):
        return self.history_service.list(db, entity_type="project", entity_key=project_id)
