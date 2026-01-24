import React from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import {observer} from "mobx-react";
import speedToStr from "../tools/speedToStr";
import RootStoreCtx from "../tools/RootStoreCtx";

const SpeedContextMenu = observer(({children, type}) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <SpeedMenuContent type={type} />
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
});

const SpeedMenuContent = observer(({type}) => {
  const rootStore = React.useContext(RootStoreCtx);
  const settings = rootStore.client.settings;

  const isAltSpeed = settings?.altSpeedEnabled;

  const getSpeedLimit = () => {
    if (type === 'download') {
      if (isAltSpeed) {
        return settings.altDownloadSpeedLimit;
      } else {
        return settings.downloadSpeedLimit;
      }
    } else if (type === 'upload') {
      if (isAltSpeed) {
        return settings.altUploadSpeedLimit;
      } else {
        return settings.uploadSpeedLimit;
      }
    }
    return 0;
  };

  const getSpeedLimitEnabled = () => {
    if (isAltSpeed) {
      return true;
    }
    if (type === 'download') {
      return settings?.downloadSpeedLimitEnabled;
    } else if (type === 'upload') {
      return settings?.uploadSpeedLimitEnabled;
    }
    return false;
  };

  const handleUnlimited = () => {
    if (type === 'download') {
      if (isAltSpeed) {
        rootStore.client.setAltSpeedEnabled(false);
      } else {
        rootStore.client.setDownloadSpeedLimitEnabled(false);
      }
    } else if (type === 'upload') {
      if (isAltSpeed) {
        rootStore.client.setAltSpeedEnabled(false);
      } else {
        rootStore.client.setUploadSpeedLimitEnabled(false);
      }
    }
  };

  const handleSetSpeedLimit = (speed) => {
    if (type === 'download') {
      if (isAltSpeed) {
        rootStore.client.setAltDownloadSpeedLimit(speed);
      } else {
        rootStore.client.setDownloadSpeedLimit(speed);
      }
    } else if (type === 'upload') {
      if (isAltSpeed) {
        rootStore.client.setAltUploadSpeedLimit(speed);
      } else {
        rootStore.client.setUploadSpeedLimit(speed);
      }
    }
  };

  const speedLimit = getSpeedLimit();
  const speedLimitEnabled = getSpeedLimitEnabled();

  return (
    <ContextMenu.Content className="context-menu">
      <ContextMenu.Item className="context-menu-item" onSelect={handleUnlimited}>
        {settings && !speedLimitEnabled && <span className="context-menu-check">●</span>}
        {chrome.i18n.getMessage('MENU_UNLIMITED')}
      </ContextMenu.Item>

      {settings && (
        <>
          <ContextMenu.Separator className="context-menu-separator" />
          {getSpeedArray(speedLimit, 10, true).map((speed) => {
            const selected = speedLimitEnabled && speed === speedLimit;
            const isDefault = speed === speedLimit;
            return (
              <ContextMenu.Item
                key={`speed-${speed}`}
                className="context-menu-item"
                onSelect={() => handleSetSpeedLimit(speed)}
              >
                {selected && <span className="context-menu-check">●</span>}
                {isDefault ? <b>{speedToStr(speed * 1024)}</b> : speedToStr(speed * 1024)}
              </ContextMenu.Item>
            );
          })}
        </>
      )}
    </ContextMenu.Content>
  );
});

function getSpeedArray(currentLimit, count, maybeZero) {
  if (!maybeZero && !currentLimit) {
    currentLimit = 512;
  }
  const middle = Math.round(count / 2);
  let middleSpeed = currentLimit;
  if (middleSpeed < middle) {
    middleSpeed = middle;
  }
  const arr = new Array(count);
  for (let i = 0; i < count; i++) {
    arr[i] = Math.round((i + 1) / middle * middleSpeed);
  }
  if (currentLimit === 0) {
    arr.pop();
    arr.unshift(currentLimit);
  }
  return arr;
}

export default SpeedContextMenu;
