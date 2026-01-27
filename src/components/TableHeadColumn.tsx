import React, { RefObject, DragEvent, MouseEvent } from "react";
import RootStoreCtx from "../tools/rootStoreCtx";

interface Column {
  column: string;
  width: number;
  lang: string;
  order: number;
  display: boolean;
  setWidth: (width: number) => void;
}

interface TableHeadColumnProps {
  column: Column;
  isSorted: boolean;
  sortDirection: number;
  onMoveColumn: (from: string, to: string) => void;
  onSort: (column: string, direction: number) => void;
  onSaveColumns: () => void;
  withStyle?: boolean;
}

interface RootStore {
  torrentList: unknown;
  fileList: unknown;
  config: unknown;
  client: unknown;
}

class TableHeadColumn extends React.Component<TableHeadColumnProps> {
  static contextType = RootStoreCtx;
  context!: RootStore | null;

  get rootStore(): RootStore | null {
    return this.context;
  }

  type: string | null = null;

  handleDragStart = (e: DragEvent<HTMLTableCellElement>): void => {
    const { column } = this.props;

    e.dataTransfer.setData('name', column.column);
    e.dataTransfer.setData('type', this.type || '');
  };

  handleDragOver = (e: DragEvent<HTMLTableCellElement>): void => {
    const el = e.target as HTMLElement;
    if (el.tagName !== 'TH' && el.parentNode && (el.parentNode as HTMLElement).tagName !== 'TH') return;
    e.preventDefault();
    e.stopPropagation();
  };

  handleDrop = (e: DragEvent<HTMLTableCellElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    let el = e.target as HTMLElement;
    if (el.tagName !== 'TH') {
      el = el.parentNode as HTMLElement;
    }
    if (el.tagName !== 'TH') {
      return;
    }

    const { column } = this.props;

    if (this.type !== e.dataTransfer.getData('type')) {
      return;
    }
    const toName = column.column;
    const fromName = e.dataTransfer.getData('name');
    if (toName === fromName) return;

    this.props.onMoveColumn(fromName, toName);
  };

  handleResizeClick = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
  };

  handleBodyMouseMove = (e: globalThis.MouseEvent): void => {
    const delta = e.clientX - this.resizeStartClientX;
    let newSize = this.resizeStartSize + delta;
    if (newSize < 16) {
      newSize = 16;
    }
    this.props.column.setWidth(newSize);
  };

  handleBodyMouseUp = (e: globalThis.MouseEvent): void => {
    e.stopPropagation();

    document.body.removeEventListener('mousemove', this.handleBodyMouseMove);
    document.body.removeEventListener('mouseup', this.handleBodyMouseUp);

    if (this.refTh.current) {
      this.refTh.current.draggable = true;
    }

    this.props.onSaveColumns();
  };

  resizeStartSize: number = 0;
  resizeStartClientX: number = 0;

  handleResizeMouseDown = (e: MouseEvent<HTMLDivElement>): void => {
    e.stopPropagation();
    if (e.button !== 0) return;

    if (this.refTh.current) {
      this.refTh.current.draggable = false;
    }

    // Use stored column width instead of clientWidth for consistent behavior
    this.resizeStartSize = this.props.column.width;
    this.resizeStartClientX = e.clientX;

    document.body.addEventListener('mousemove', this.handleBodyMouseMove);
    document.body.addEventListener('mouseup', this.handleBodyMouseUp);
  };

  refTh: RefObject<HTMLTableCellElement | null> = React.createRef();

  componentWillUnmount(): void {
    document.body.removeEventListener('mousemove', this.handleBodyMouseMove);
    document.body.removeEventListener('mouseup', this.handleBodyMouseUp);
  }

  handleSort = (e: MouseEvent<HTMLTableCellElement>): void => {
    e.preventDefault();
    let direction = 1;
    if (this.props.isSorted) {
      direction = this.props.sortDirection === 1 ? 0 : 1;
    }
    this.props.onSort(this.props.column.column, direction);
  };
}

export default TableHeadColumn;
export type { TableHeadColumnProps, Column };
