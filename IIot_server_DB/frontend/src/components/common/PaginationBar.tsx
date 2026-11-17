import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="table-pagination-row">
      <div className="text-xs text-muted">
        แสดง {start}–{end} จาก {totalItems} รายการ (หน้า {currentPage} / {totalPages})
      </div>
      <div className="pagination-btn-group">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft size={15} />
          <span>ก่อนหน้า</span>
        </button>
        <span className="page-indicator-pill">{currentPage}</span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <span>ถัดไป</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};
