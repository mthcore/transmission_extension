import React from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {observer} from "mobx-react";
import RootStoreCtx from "../tools/RootStoreCtx";

const TorrentColumnContextMenu = observer(({children}) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <TorrentColumnMenuContent />
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
});

const TorrentColumnMenuContent = observer(() => {
  const rootStore = React.useContext(RootStoreCtx);

  const handleToggleColumn = (column) => {
    column.toggleDisplay();
    rootStore.config.saveTorrentsColumns();
  };

  return (
    <ContextMenu.Content className="context-menu">
      {rootStore.config.torrentColumns.map((column) => (
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

export default TorrentColumnContextMenu;
