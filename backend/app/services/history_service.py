from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.history import EntityChangeLog
from app.schemas.history import EntityHistoryRead


class HistoryService:
    def log(self, db: Session, *, entity_type: str, entity_key: str, action: str, title: str, description: str) -> None:
        db.add(
            EntityChangeLog(
                entity_type=entity_type,
                entity_key=str(entity_key),
                action=action,
                title=title,
                description=description,
            )
        )

    def list(self, db: Session, *, entity_type: str, entity_key: str) -> list[EntityHistoryRead]:
        items = (
            db.query(EntityChangeLog)
            .filter(
                EntityChangeLog.entity_type == entity_type,
                EntityChangeLog.entity_key == str(entity_key),
            )
            .order_by(EntityChangeLog.created_at.desc(), EntityChangeLog.id.desc())
            .all()
        )
        return [
            EntityHistoryRead(
                id=item.id,
                entity_type=item.entity_type,
                entity_key=item.entity_key,
                action=item.action,
                title=item.title,
                description=item.description,
                created_at=item.created_at,
            )
            for item in items
        ]


def format_history_description(*, action_label: str, entity_label: str, summary: str | None = None, when: datetime | None = None) -> str:
    timestamp = (when or datetime.utcnow()).strftime("%Y-%m-%d %H:%M")
    if summary:
        return f"{timestamp} {action_label}{entity_label}：{summary}"
    return f"{timestamp} {action_label}{entity_label}"
