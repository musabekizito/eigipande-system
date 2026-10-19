import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PAGE_SIZE = 10;

export const usePagination = (items) => {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [currentPage, page]);

  return { pageItems, page: currentPage, pageCount, setPage };
};

const Pagination = ({ page, pageCount, total, onPageChange }) => {
  const firstItem = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-gray-500">
        Showing {firstItem}–{lastItem} of {total}
      </span>
      <div className="flex items-center gap-2">
        <span className="mr-1 text-sm text-gray-500">Page {page} of {pageCount}</span>
        <button
          type="button"
          onClick={() => onPageChange((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange((current) => Math.min(pageCount, current + 1))}
          disabled={page >= pageCount}
          className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
