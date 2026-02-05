import { useRef, useCallback, useEffect } from 'react';
import { DragEvent, MouseEvent } from 'react';

interface Column {
  column: string;
  width: number;
  setWidth: (width: number) => void;
}

interface UseTableHeadColumnProps {
  type: string;
  column: Column;
  onMoveColumn: (from: string, to: string) => void;
  onSaveColumns: () => void;
  onSort: (column: string, direction: number) => void;
  isSorted: boolean;
  sortDirection: number;
}

export function useTableHeadColumn({
  type,
  column,
  onMoveColumn,
  onSaveColumns,
  onSort,
  isSorted,
  sortDirection,
}: UseTableHeadColumnProps) {
  const refTh = useRef<HTMLTableCellElement>(null);
  const resizeStartSize = useRef(0);
  const resizeStartClientX = useRef(0);

  // Drag & Drop handlers
  const handleDragStart = useCallback((e: DragEvent<HTMLTableCellElement>): void => {
    e.dataTransfer.setData('name', column.column);
    e.dataTransfer.setData('type', type);
  }, [column.column, type]);

  const handleDragOver = useCallback((e: DragEvent<HTMLTableCellElement>): void => {
    const el = e.target as HTMLElement;
    if (el.tagName !== 'TH' && el.parentNode && (el.parentNode as HTMLElement).tagName !== 'TH') return;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLTableCellElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    let el = e.target as HTMLElement;
    if (el.tagName !== 'TH') {
      el = el.parentNode as HTMLElement;
    }
    if (el.tagName !== 'TH') {
      return;
    }

    if (type !== e.dataTransfer.getData('type')) {
      return;
    }
    const toName = column.column;
    const fromName = e.dataTransfer.getData('name');
    if (toName === fromName) return;

    onMoveColumn(fromName, toName);
  }, [type, column.column, onMoveColumn]);

  // Resize handlers - using refs to avoid recreating functions
  const handleBodyMouseMove = useCallback((e: globalThis.MouseEvent): void => {
    const delta = e.clientX - resizeStartClientX.current;
    let newSize = resizeStartSize.current + delta;
    if (newSize < 16) {
      newSize = 16;
    }
    column.setWidth(newSize);
  }, [column]);

  const handleBodyMouseUp = useCallback((e: globalThis.MouseEvent): void => {
    e.stopPropagation();

    document.body.removeEventListener('mousemove', handleBodyMouseMove);
    document.body.removeEventListener('mouseup', handleBodyMouseUp);

    if (refTh.current) {
      refTh.current.draggable = true;
    }

    onSaveColumns();
  }, [handleBodyMouseMove, onSaveColumns]);

  const handleResizeClick = useCallback((e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  }, []);

  const handleResizeMouseDown = useCallback((e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (e.button !== 0) return;

    if (refTh.current) {
      refTh.current.draggable = false;
    }

    // Use stored column width instead of clientWidth for consistent behavior
    resizeStartSize.current = column.width;
    resizeStartClientX.current = e.clientX;

    document.body.addEventListener('mousemove', handleBodyMouseMove);
    document.body.addEventListener('mouseup', handleBodyMouseUp);
  }, [column.width, handleBodyMouseMove, handleBodyMouseUp]);

  const handleSort = useCallback((e: MouseEvent<HTMLTableCellElement>): void => {
    e.preventDefault();
    let direction = 1;
    if (isSorted) {
      direction = sortDirection === 1 ? 0 : 1;
    }
    onSort(column.column, direction);
  }, [isSorted, sortDirection, onSort, column.column]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.removeEventListener('mousemove', handleBodyMouseMove);
      document.body.removeEventListener('mouseup', handleBodyMouseUp);
    };
  }, [handleBodyMouseMove, handleBodyMouseUp]);

  return {
    refTh,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleResizeClick,
    handleResizeMouseDown,
    handleSort,
  };
}
