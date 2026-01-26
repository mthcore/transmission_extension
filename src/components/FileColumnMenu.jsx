import React from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {observer} from "mobx-react";
import RootStoreCtx from "../tools/RootStoreCtx";

const FileColumnContextMenu = observer(({children}) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <FileColumnMenuContent />
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
});

const FileColumnMenuContent = observer(() => {
  const rootStore = React.useContext(RootStoreCtx);

  const handleToggleColumn = (column) => {
    column.toggleDisplay();
    rootStore.config.saveFilesColumns();
  };

  return (
    <ContextMenu.Content className="context-menu">
      {rootStore.config.filesColumns.map((column) => (
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
