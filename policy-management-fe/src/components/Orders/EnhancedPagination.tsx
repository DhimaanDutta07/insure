import React from "react";
import { Button } from "../ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationChangeParams {
  currentPage: number;
  pageSize: number;
}

interface EnhancedPaginationProps {
  totalItems: number;
  initialPageSize?: number;
  currentPage?: number;
  onPageChange: (params: PaginationChangeParams) => void;
}

const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  totalItems,
  initialPageSize = 10,
  currentPage = 1,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / initialPageSize));

  const handlePageChange = (newPage: number): void => {
    if (newPage < 1 || newPage > totalPages) return;
    onPageChange({
      currentPage: newPage,
      pageSize: initialPageSize,
    });
  };

  const handlePageSizeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const newPageSize = parseInt(e.target.value);
    const newTotalPages = Math.max(1, Math.ceil(totalItems / newPageSize));
    const adjustedCurrentPage = Math.min(currentPage, newTotalPages);

    onPageChange({
      currentPage: adjustedCurrentPage,
      pageSize: newPageSize,
    });
  };

  return (
    <div className="flex justify-between items-center mt-4">
      <div className="flex items-center space-x-2">
        <span>Rows per page</span>
        <select
          value={initialPageSize}
          onChange={handlePageSizeChange}
          className="border border-gray-300 rounded p-1"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <div className="text-sm">
        Page {currentPage} of {totalPages}
      </div>

      <div className="flex space-x-1">
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(1)}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default EnhancedPagination;
