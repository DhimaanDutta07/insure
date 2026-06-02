//src/components/ui/data-table.tsx
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"

import { DataTablePagination } from "../../components/ui/data-table-pagination"
import TableSkeleton from "../../components/ui/table-skeleton"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[],
  isLoading: boolean,
  totalItemsCount: number,
  currentPage: number,
  itemsPerPage: number,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
  setItemsPerPage: React.Dispatch<React.SetStateAction<number>>,
  hideColumns?: string[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  totalItemsCount,
  currentPage,
  itemsPerPage,
  setCurrentPage,
  setItemsPerPage,
  hideColumns
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  // console.log("Data Table", data)

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      pagination,
    }, 
    columnResizeMode: "onChange",
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: Math.ceil(totalItemsCount / itemsPerPage),
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
  })

  useEffect(() => {
    if (hideColumns) {
      hideColumns.forEach((columnId) => {
        const column = table.getColumn(columnId)
        if (column) {
          column.toggleVisibility(false)
        }
      })
    }
  }, [table])


  useEffect(() => {
    setCurrentPage(pagination.pageIndex + 1)
    setItemsPerPage(pagination.pageSize)
  }, [pagination])

  return (
    <div className="space-y-4">
      <div className="rounded-md">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}
              className="border-b border-gray-200">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} 
                    className="py-1 text-gray-700 font-medium text-left"  
                    colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? <TableSkeleton columnLength={columns.length} rowsLength={itemsPerPage} />
              : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}
                        // className="py-4"
                         style={{
                          fontSize: "14px",
                          width: `${cell.column.getSize()}px`,
                          maxWidth: `${cell.column.columnDef.maxSize}px`,
                          minWidth: `${cell.column.columnDef.minSize}px`,
                        }}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow >
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )
            }
          </TableBody>
        </Table>
      </div>
      <DataTablePagination 
        table={table} 
        totalItemsCount={totalItemsCount}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage} 
      />
    </div>
  )
}
