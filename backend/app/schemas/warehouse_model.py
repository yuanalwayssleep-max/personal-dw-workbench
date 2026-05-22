from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class WarehouseModelCreate(BaseModel):
    id: int
    company_name: str
    project_ids: list[str] = []
    model_code: str
    model_name: str
    model_database_name: str
    model_table_name: str
    model_business_domain: str
    model_data_domain: str
    model_layer: str
    layer: str
    subject_domain: str
    model_type: str
    storage_type: str
    table_name: str
    table_description: str
    partition_field: Optional[str] = None
    owner: str
    status: str
    tags: list[str] = []
    schedule_cycle: str
    refresh_mode: str
    core_metric: Optional[str] = None
    remark: Optional[str] = None


class WarehouseModelUpdate(BaseModel):
    company_name: str
    project_ids: list[str] = []
    model_code: str
    model_name: str
    model_database_name: str
    model_table_name: str
    model_business_domain: str
    model_data_domain: str
    model_layer: str
    layer: str
    subject_domain: str
    model_type: str
    storage_type: str
    table_name: str
    table_description: str
    partition_field: Optional[str] = None
    owner: str
    status: str
    tags: list[str] = []
    schedule_cycle: str
    refresh_mode: str
    core_metric: Optional[str] = None
    remark: Optional[str] = None


class WarehouseModelRead(BaseModel):
    id: int
    company_name: str
    project_ids: list[str]
    project_names: list[str]
    model_code: str
    model_name: str
    model_database_name: str
    model_table_name: str
    model_business_domain: str
    model_data_domain: str
    model_layer: str
    layer: str
    subject_domain: str
    model_type: str
    storage_type: str
    table_name: str
    table_description: str
    partition_field: Optional[str] = None
    owner: str
    status: str
    tags: list[str]
    schedule_cycle: str
    refresh_mode: str
    core_metric: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
