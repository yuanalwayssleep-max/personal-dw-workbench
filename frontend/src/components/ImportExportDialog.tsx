import type { ReactNode } from "react";

export type ImportPreviewColumn<TPreviewRow> = {
  key: string;
  header: string;
  render: (row: TPreviewRow) => ReactNode;
};

interface ImportExportDialogProps<TPreviewRow, TIssue> {
  visible: boolean;
  title: string;
  description: string;
  templateHeaders: string[];
  exporting: boolean;
  importing: boolean;
  preparingImport: boolean;
  importError: string | null;
  importResult: string | null;
  importIssues: TIssue[];
  issueKey: (issue: TIssue) => string;
  renderIssue: (issue: TIssue) => ReactNode;
  fileAccept?: string;
  preparedFileName: string | null;
  pendingCount: number;
  createCount: number;
  updateCount: number;
  failCount: number;
  previewRows: TPreviewRow[];
  previewColumns: Array<ImportPreviewColumn<TPreviewRow>>;
  previewRowKey: (row: TPreviewRow) => string;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onSelectFile: (file: File) => void;
  onCancelPrepared: () => void;
  onConfirmImport: () => void;
}

export function ImportExportDialog<TPreviewRow, TIssue>(props: ImportExportDialogProps<TPreviewRow, TIssue>) {
  const {
    visible,
    title,
    description,
    templateHeaders,
    exporting,
    importing,
    preparingImport,
    importError,
    importResult,
    importIssues,
    issueKey,
    renderIssue,
    fileAccept = ".xlsx,.csv",
    preparedFileName,
    pendingCount,
    createCount,
    updateCount,
    failCount,
    previewRows,
    previewColumns,
    previewRowKey,
    onClose,
    onDownloadTemplate,
    onSelectFile,
    onCancelPrepared,
    onConfirmImport,
  } = props;

  if (!visible) {
    return null;
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <button className="text-action-button" onClick={onClose} type="button">
            关闭
          </button>
        </div>

        <div className="modal-body">
          <div className="import-template-box">
            <strong>模板字段</strong>
            <div className="pill-row">
              {templateHeaders.map((header) => (
                <span className="pill" key={header}>
                  {header}
                </span>
              ))}
            </div>
            <button className="secondary-button accent" disabled={exporting} onClick={onDownloadTemplate} type="button">
              {exporting ? "下载中..." : "下载导入模板"}
            </button>
          </div>

          <label className="field">
            <span>选择导入文件</span>
            <input
              accept={fileAccept}
              disabled={importing || preparingImport}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                onSelectFile(file);
                event.target.value = "";
              }}
              type="file"
            />
          </label>

          {preparedFileName ? (
            <div className="import-result-box">
              <strong>导入确认</strong>
              <div className="import-preview-meta">
                <span>文件：{preparedFileName}</span>
                <span>待导入：{pendingCount} 条</span>
                <span>新增：{createCount} 条</span>
                <span>更新：{updateCount} 条</span>
                <span>失败：{failCount} 条</span>
              </div>
              <div className="import-preview-table">
                <div className="import-preview-head">
                  {previewColumns.map((column) => (
                    <span key={column.key}>{column.header}</span>
                  ))}
                </div>
                {previewRows.map((row) => (
                  <div className="import-preview-row" key={previewRowKey(row)}>
                    {previewColumns.map((column) => (
                      <span key={column.key}>{column.render(row)}</span>
                    ))}
                  </div>
                ))}
              </div>
              {pendingCount > previewRows.length ? <div className="muted">仅预览前 6 条，确认后将导入全部数据。</div> : null}
              <div className="section-inline-actions">
                <button className="secondary-button" disabled={importing} onClick={onCancelPrepared} type="button">
                  取消本次解析
                </button>
                <button className="primary-button" disabled={importing || preparingImport || !pendingCount} onClick={onConfirmImport} type="button">
                  {importing ? "导入中..." : "确认导入"}
                </button>
              </div>
            </div>
          ) : null}

          {importError ? <div className="form-error-banner">{importError}</div> : null}
          {importResult ? <div className="form-success-banner">{importResult}</div> : null}
          {importIssues.length ? (
            <div className="import-result-box">
              <strong>导入失败明细</strong>
              <div className="import-result-list">
                {importIssues.map((issue) => (
                  <div className="import-result-item" key={issueKey(issue)}>
                    {renderIssue(issue)}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
