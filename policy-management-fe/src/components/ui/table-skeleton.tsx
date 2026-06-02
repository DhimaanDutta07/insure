import { Skeleton } from '../ui/skeleton';
import { TableRow, TableCell } from '../ui/table';

export default function TableSkeleton({
  rowsLength,
  columnLength,
}: {
  rowsLength: number;
  columnLength: number;
}) {
  return (
    <>
      {Array(rowsLength)
        .fill(null)
        .map((_, idx) => (
          <TableRow key={idx}>
            {Array(columnLength)
              .fill(null)
              .map((_, ind) => (
                <TableCell key={ind}>
                  <Skeleton className='h-4 w-full' />
                </TableCell>
              ))}
          </TableRow>
        ))}
    </>
  );
}
