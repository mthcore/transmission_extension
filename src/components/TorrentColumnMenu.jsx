import React, {useContext, useCallback} from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {observer} from "mobx-react";
import PropTypes from "prop-types";
import RootStoreCtx from "../tools/RootStoreCtx";
import {useColumnToggle} from "../hooks/useColumnToggle";

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
  const rootStore = useContext(RootStoreCtx);
  const saveColumns = useCallback(() => rootStore.config.saveTorrentsColumns(), [rootStore]);
  const handleToggleColumn = useColumnToggle(saveColumns);

  return (
    <ContextMenu.Content className="context-menu">
      {rootStore.config.activeTorrentColumns.map((column) => (
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

TorrentColumnContextMenu.propTypes = {
  children: PropTypes.node.isRequired,
};

export default TorrentColumnContextMenu;
