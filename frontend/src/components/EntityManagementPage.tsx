import type { ReactNode } from "react";

import { EntityFormActions } from "./EntityFormActions";
import { SectionCard } from "./SectionCard";

export type ManagementMode = "list" | "create" | "detail" | "edit" | "history";

type Column<Row> = {
  header: string;
  render: (row: Row) => ReactNode;
};

interface EntityManagementPageProps<Row> {
  mode: ManagementMode;
  keyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onResetSearch?: () => void;
  searchPlaceholder: string;
  renderSearchFields?: () => ReactNode;
  renderListSummary?: () => ReactNode;
  listTitle: string;
  rows: Row[];
  columns: Array<Column<Row>>;
  emptyText: string;
  onCreate: () => void;
  renderListActions?: () => ReactNode;
  onDetail: (row: Row) => void;
  onEdit: (row: Row) => void;
  onHistory: (row: Row) => void;
  onOpenHistory?: () => void;
  detailMeta?: ReactNode;
  onDelete?: (row: Row) => void;
  getDeleteDisabled?: (row: Row) => boolean;
  getDeleteDisabledReason?: (row: Row) => string;
  rowKey: (row: Row) => string | number;
  detailTitle: string;
  historyTitle?: string;
  onBack: () => void;
  renderDetail: () => ReactNode;
  renderForm: () => ReactNode;
  renderHistory: () => ReactNode;
  onSubmit: () => Promise<void> | void;
  submitDisabled: boolean;
  formError?: string | null;
  submitting?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

export function EntityManagementPage<Row>(props: EntityManagementPageProps<Row>) {
  const {
    mode,
    keyword,
    onKeywordChange,
    onSearch,
    onResetSearch,
    searchPlaceholder,
    renderSearchFields,
    renderListSummary,
    listTitle,
    rows,
    columns,
    emptyText,
    onCreate,
    renderListActions,
    onDetail,
    onEdit,
    onHistory,
    onOpenHistory,
    detailMeta,
    onDelete,
    getDeleteDisabled,
    getDeleteDisabledReason,
    rowKey,
    detailTitle,
    historyTitle = "更新记录",
    onBack,
    renderDetail,
    renderForm,
    renderHistory,
    onSubmit,
    submitDisabled,
    formError,
    submitting = false,
    pagination,
  } = props;
  const tableGridStyle = {
    gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr)) minmax(132px, 156px)`,
  };

  function renderPagination() {
    if (!pagination || pagination.totalPages <= 1) {
      return null;
    }

    const { currentPage, totalPages, totalItems, pageSize, onPageChange } = pagination;
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    const normalizedStart = Math.max(1, endPage - 4);
    for (let page = normalizedStart; page <= endPage; page += 1) {
      pages.push(page);
    }

    return (
      <div className="table-pagination">
        <div className="table-pagination-meta">
          共 {totalItems} 条，每页 {pageSize} 条
        </div>
        <div className="table-pagination-actions">
          <button
            className="secondary-button pagination-button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            type="button"
          >
            上一页
          </button>
          {pages.map((page) => (
            <button
              className={`secondary-button pagination-button ${page === currentPage ? "active" : ""}`}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          ))}
          <button
            className="secondary-button pagination-button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            type="button"
          >
            下一页
          </button>
          <span className="pagination-jump-label">跳转</span>
          <input
            className="pagination-jump-input"
            defaultValue={currentPage}
            max={totalPages}
            min={1}
            onKeyDown={(event) => {
              if (event.key !== "Enter") {
                return;
              }
              const input = event.currentTarget;
              const page = Number(input.value);
              if (Number.isNaN(page)) {
                input.value = String(currentPage);
                return;
              }
              const normalizedPage = Math.min(totalPages, Math.max(1, page));
              input.value = String(normalizedPage);
              onPageChange(normalizedPage);
            }}
            type="number"
          />
        </div>
      </div>
    );
  }

  if (mode === "list") {
    return (
      <div className="content-grid">
        <section className="card col-12">
          <div className="company-search-toolbar">
            <div className="company-search-fields">
              {renderSearchFields ? (
                renderSearchFields()
              ) : (
                <input
                  className="company-search-input"
                  onChange={(event) => onKeywordChange(event.target.value)}
                  placeholder={searchPlaceholder}
                  value={keyword}
                />
              )}
            </div>
            <button className="primary-button" onClick={onSearch} type="button">
              查询
            </button>
            {onResetSearch ? (
              <button className="secondary-button" onClick={onResetSearch} type="button">
                重置
              </button>
            ) : null}
          </div>
        </section>

        {renderListSummary ? renderListSummary() : null}

        <SectionCard className="col-12" title={listTitle}>
          <div className="section-inline-actions">
            {renderListActions ? renderListActions() : null}
            <button className="primary-button" onClick={onCreate} type="button">
              新建
            </button>
          </div>

          <div className="company-table">
            <div className="company-table-head" style={tableGridStyle}>
              {columns.map((column) => (
                <span key={column.header}>{column.header}</span>
              ))}
              <span>操作</span>
            </div>

            {rows.map((row) => {
              const deleteDisabled = getDeleteDisabled?.(row) ?? false;
              const deleteTitle = deleteDisabled ? (getDeleteDisabledReason?.(row) ?? "当前不可删除") : "删除";

              return (
                <div className="company-table-row" key={rowKey(row)} style={tableGridStyle}>
                  {columns.map((column) => (
                    <div key={column.header}>{column.render(row)}</div>
                  ))}
                  <div className="company-table-actions">
                    <button className="text-action-button" onClick={() => onDetail(row)} type="button">
                      详情
                    </button>
                    <button className="text-action-button" onClick={() => onEdit(row)} type="button">
                      编辑
                    </button>
                    {onDelete ? (
                      <button
                        className={`text-action-button danger ${deleteDisabled ? "disabled" : ""}`}
                        disabled={deleteDisabled}
                        onClick={() => onDelete(row)}
                        title={deleteTitle}
                        type="button"
                      >
                        删除
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {!rows.length ? <div className="empty-box">{emptyText}</div> : null}
          </div>
          {renderPagination()}
        </SectionCard>
      </div>
    );
  }

  if (mode === "history") {
    return (
      <div className="content-grid">
        <SectionCard className="col-12" title={historyTitle}>
          <div className="section-inline-actions section-inline-actions-start">
            <button className="secondary-button" onClick={onBack} type="button">
              返回列表
            </button>
          </div>
          {renderHistory()}
        </SectionCard>
      </div>
    );
  }

  const isDetail = mode === "detail";
  const isCreate = mode === "create";

  return (
    <div className="content-grid">
      <SectionCard className="col-12" title={detailTitle}>
        <div className="detail-toolbar">
          <div className="section-inline-actions section-inline-actions-start">
            <button className="secondary-button" onClick={onBack} type="button">
              返回列表
            </button>
          </div>
          {isDetail ? (
            <div className="detail-toolbar-side">
              {detailMeta ? <div className="detail-meta-text">{detailMeta}</div> : null}
              {onOpenHistory ? (
                <button className="secondary-button accent" onClick={onOpenHistory} type="button">
                  查看更新记录
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {isDetail ? (
          renderDetail()
        ) : (
          <>
            {formError ? <div className="form-error-banner">{formError}</div> : null}
            {renderForm()}
            <EntityFormActions
              disabled={submitDisabled}
              loading={submitting}
              loadingText={isCreate ? "提交中..." : "保存中..."}
              onSubmit={onSubmit}
              submitText={isCreate ? "提交" : "保存"}
            />
          </>
        )}
      </SectionCard>
    </div>
  );
}
