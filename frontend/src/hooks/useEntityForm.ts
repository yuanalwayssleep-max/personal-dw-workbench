import { useMemo, useState } from "react";

import type { ManagementMode } from "../components/EntityManagementPage";

interface UseEntityFormOptions<Row, FormValues, RowId> {
  rows: Row[];
  initialValues: FormValues;
  getRowId: (row: Row) => RowId;
  mapRowToForm: (row: Row) => FormValues;
}

export function useEntityForm<Row, FormValues, RowId>(options: UseEntityFormOptions<Row, FormValues, RowId>) {
  const { rows, initialValues, getRowId, mapRowToForm } = options;
  const [mode, setMode] = useState<ManagementMode>("list");
  const [selectedRowId, setSelectedRowId] = useState<RowId | null>(null);
  const [formValues, setFormValues] = useState<FormValues>(initialValues);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedRow = useMemo(
    () => rows.find((row) => selectedRowId !== null && getRowId(row) === selectedRowId) ?? null,
    [getRowId, rows, selectedRowId],
  );

  function openCreateMode(nextValues?: FormValues) {
    setSelectedRowId(null);
    setFormError(null);
    setFormValues(nextValues ?? initialValues);
    setMode("create");
  }

  function openRow(row: Row, nextMode: Exclude<ManagementMode, "list" | "create">) {
    setSelectedRowId(getRowId(row));
    setFormError(null);
    setFormValues(mapRowToForm(row));
    setMode(nextMode);
  }

  function resetForm(nextValues?: FormValues) {
    setFormError(null);
    setFormValues(nextValues ?? initialValues);
  }

  function resetToList(nextValues?: FormValues) {
    resetForm(nextValues ?? initialValues);
    setSelectedRowId(null);
    setMode("list");
  }

  return {
    formError,
    formValues,
    mode,
    selectedRow,
    selectedRowId,
    openCreateMode,
    openRow,
    resetForm,
    resetToList,
    setFormError,
    setFormValues,
    setMode,
    setSelectedRowId,
  };
}
