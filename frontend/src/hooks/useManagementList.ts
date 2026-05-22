import { useEffect, useMemo, useState } from "react";

type PaginationConfig = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

interface UseManagementListOptions<Row, Filters> {
  rows: Row[];
  initialFilters: Filters;
  filterRows: (rows: Row[], filters: Filters) => Row[];
  pageSize?: number;
}

export function useManagementList<Row, Filters>(options: UseManagementListOptions<Row, Filters>) {
  const { rows, initialFilters, filterRows, pageSize = 10 } = options;
  const [searchFilters, setSearchFilters] = useState<Filters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => filterRows(rows, searchFilters), [filterRows, rows, searchFilters]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredRows, pageSize],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function applySearch() {
    setSearchFilters(draftFilters);
    setCurrentPage(1);
  }

  function resetSearch() {
    setDraftFilters(initialFilters);
    setSearchFilters(initialFilters);
    setCurrentPage(1);
  }

  const pagination: PaginationConfig = {
    currentPage,
    totalPages,
    totalItems: filteredRows.length,
    pageSize,
    onPageChange: setCurrentPage,
  };

  return {
    currentPage,
    draftFilters,
    filteredRows,
    pagedRows,
    pagination,
    searchFilters,
    setCurrentPage,
    setDraftFilters,
    setSearchFilters,
    applySearch,
    resetSearch,
  };
}
