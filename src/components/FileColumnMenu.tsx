import React, { useContext, useCallback, ReactNode } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { observer } from 'mobx-react';
import RootStoreCtx from '../tools/rootStoreCtx';
import { useColumnToggle } from '../hooks/useColumnToggle';

interface Column {
  column: string;
  lang: string;
  display: boolean;
  toggleDisplay: () => void;
}

interface FileColumnContextMenuProps {
  children: ReactNode;
}

const FileColumnContextMenu: React.FC<FileColumnContextMenuProps> = observer(({ children }) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <FileColumnMenuContent />
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
});

const FileColumnMenuContent: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const config = rootStore?.config;
  const saveColumns = useCallback(() => config?.saveFilesColumns(), [config]);
  const handleToggleColumn = useColumnToggle(saveColumns);

  if (!rootStore || !config) return null;

  return (
    <ContextMenu.Content className="context-menu">
      {(config.filesColumns as unknown as Column[]).map((column) => (
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

export default FileColumnContextMenu;
