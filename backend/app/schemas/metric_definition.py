from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MetricDefinitionCreate(BaseModel):
    metric_name: str
    metric_code: str
    field_type: str
    business_domain: str
    metric_category: str
    company_name: Optional[str] = None
    definition: str
    calculation_rule: str
    time_granularity: str
    unit: Optional[str] = None
    note: Optional[str] = None
    project_ids: list[str] = []


class MetricDefinitionUpdate(BaseModel):
    metric_name: str
    metric_code: str
    field_type: str
    business_domain: str
    metric_category: str
    company_name: Optional[str] = None
    definition: str
    calculation_rule: str
    time_granularity: str
    unit: Optional[str] = None
    note: Optional[str] = None
    project_ids: list[str] = []


class MetricDefinitionRead(BaseModel):
    id: int
    metric_name: str
    metric_code: str
    field_type: str
    business_domain: str
    metric_category: str
    company_name: Optional[str] = None
    definition: str
    calculation_rule: str
    time_granularity: str
    unit: Optional[str] = None
    note: Optional[str] = None
    project_ids: list[str]
    project_names: list[str]
    created_at: datetime
    updated_at: datetime
