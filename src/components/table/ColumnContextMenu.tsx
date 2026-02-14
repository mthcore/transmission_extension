import React, { ReactNode } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { observer } from 'mobx-react';
import { useColumnToggle } from '../../hooks/useColumnToggle';
import type { Column } from './TableHeadColumn';

interface ColumnContextMenuProps {
  children: ReactNode;
  columns: Column[];
  onSave: () => void;
}

const ColumnContextMenu = observer(({ children, columns, onSave }: ColumnContextMenuProps) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ColumnContextMenuContent columns={columns} onSave={onSave} />
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
});

interface ColumnContextMenuContentProps {
  columns: Column[];
  onSave: () => void;
}

const ColumnContextMenuContent = observer(({ columns, onSave }: ColumnContextMenuContentProps) => {
  const handleToggleColumn = useColumnToggle(onSave);

  return (
    <ContextMenu.Content className="context-menu">
      {columns.map((column) => (
        <ContextMenu.Item
          key={column.column}
          className="context-menu-item"
          onSelect={() => handleToggleColumn(column)}
        >
          {column.display ? <span className="context-menu-check">●</span> : null}
          {chrome.i18n.getMessage(column.lang)}
        </ContextMenu.Item>
      ))}
    </ContextMenu.Content>
  );
});

export default ColumnContextMenu;
