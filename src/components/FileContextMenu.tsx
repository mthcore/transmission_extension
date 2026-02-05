import React, { useContext, ReactNode } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { observer } from 'mobx-react';
import RootStoreCtx from '../tools/rootStoreCtx';
import { useContextMenuSelection } from '../hooks/useContextMenuSelection';

interface FileContextMenuProps {
  children: ReactNode;
  fileId: string;
}

interface File {
  name: string;
  priority: number;
}

interface FileListStore {
  selectedIds: (string | number)[];
  resetSelectedIds: () => void;
  addSelectedId: (id: string | number) => void;
  getFileById: (id: string) => File | undefined;
  id: number;
  selectedIndexes: number[];
}

const FileContextMenu: React.FC<FileContextMenuProps> = observer(({ children, fileId }) => {
  const rootStore = useContext(RootStoreCtx);
  const fileListStore = rootStore?.fileList as FileListStore | undefined;
  const handleOpenChange = useContextMenuSelection(
    fileListStore as {
      selectedIds: (string | number)[];
      resetSelectedIds: () => void;
      addSelectedId: (id: string | number) => void;
    },
    fileId
  );

  return (
    <ContextMenu.Root onOpenChange={handleOpenChange}>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <FileMenuContent />
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
});

const FileMenuContent: React.FC = observer(() => {
  const rootStore = React.useContext(RootStoreCtx);
  const fileListStore = rootStore?.fileList as FileListStore | undefined;
  const client = rootStore?.client;
  const selectedIds = (fileListStore?.selectedIds as string[]) || [];

  if (!selectedIds.length || !rootStore || !fileListStore || !client) return null;

  // Determine current priority
  let currentPriority: number | null = null;
  let lastPriority: number | null = null;
  const isEvery = selectedIds.every((id) => {
    const file = fileListStore.getFileById(id);
    if (file) {
      if (lastPriority === null) {
        lastPriority = file.priority;
      }
      return lastPriority === file.priority;
    }
    return false;
  });
  if (isEvery) {
    currentPriority = lastPriority;
  }

  const firstFile = selectedIds.length > 0 ? fileListStore.getFileById(selectedIds[0]) : null;

  const handleSetPriority = (priority: number): void => {
    const id = fileListStore.id;
    const selectedIndexes = fileListStore.selectedIndexes;
    client.filesSetPriority(id, selectedIndexes, priority);
  };

  const handleRename = (): void => {
    const id = fileListStore.id;
    if (!firstFile) return;

    rootStore.createDialog({
      type: 'rename',
      path: firstFile.name,
      torrentIds: [id],
    });
  };

  return (
    <ContextMenu.Content className="context-menu">
      <PriorityItem
        level={3}
        selected={currentPriority === 3}
        onSelect={() => handleSetPriority(3)}
      />
      <PriorityItem
        level={2}
        selected={currentPriority === 2}
        onSelect={() => handleSetPriority(2)}
      />
      <PriorityItem
        level={1}
        selected={currentPriority === 1}
        onSelect={() => handleSetPriority(1)}
      />

      <ContextMenu.Separator className="context-menu-separator" />

      <PriorityItem
        level={0}
        selected={currentPriority === 0}
        onSelect={() => handleSetPriority(0)}
      />

      <ContextMenu.Item className="context-menu-item" onSelect={handleRename}>
        {chrome.i18n.getMessage('rename')}
      </ContextMenu.Item>
    </ContextMenu.Content>
  );
});

interface PriorityItemProps {
  level: number;
  selected: boolean;
  onSelect: () => void;
}

const PriorityItem: React.FC<PriorityItemProps> = ({ level, selected, onSelect }) => {
  let name: string;
  switch (level) {
    case 3:
      name = chrome.i18n.getMessage('MF_HIGH');
      break;
    case 2:
      name = chrome.i18n.getMessage('MF_NORMAL');
      break;
    case 1:
      name = chrome.i18n.getMessage('MF_LOW');
      break;
    case 0:
      name = chrome.i18n.getMessage('MF_DONT');
      break;
    default:
      name = '';
  }

  return (
    <ContextMenu.Item className="context-menu-item" onSelect={onSelect}>
      {selected && <span className="context-menu-check">●</span>}
      {name}
    </ContextMenu.Item>
  );
};

export default FileContextMenu;
