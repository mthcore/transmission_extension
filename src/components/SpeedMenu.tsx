import React, { ReactNode } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { observer } from 'mobx-react';
import speedToStr from '../tools/speedToStr';
import RootStoreCtx from '../tools/rootStoreCtx';
import { SPEED_ARRAY_COUNT, DEFAULT_SPEED_LIMIT } from '../constants';

type SpeedType = 'download' | 'upload';

interface SpeedContextMenuProps {
  children: ReactNode;
  type: SpeedType;
}

const SpeedContextMenu: React.FC<SpeedContextMenuProps> = observer(({ children, type }) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <SpeedMenuContent type={type} />
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
});

interface SpeedMenuContentProps {
  type: SpeedType;
}

const SpeedMenuContent: React.FC<SpeedMenuContentProps> = observer(({ type }) => {
  const rootStore = React.useContext(RootStoreCtx);
  const client = rootStore?.client;
  const settings = client?.settings;

  const isAltSpeed = settings?.altSpeedEnabled;

  const getSpeedLimit = (): number => {
    if (type === 'download') {
      if (isAltSpeed) {
        return settings?.altDownloadSpeedLimit || 0;
      } else {
        return settings?.downloadSpeedLimit || 0;
      }
    } else if (type === 'upload') {
      if (isAltSpeed) {
        return settings?.altUploadSpeedLimit || 0;
      } else {
        return settings?.uploadSpeedLimit || 0;
      }
    }
    return 0;
  };

  const getSpeedLimitEnabled = (): boolean => {
    if (isAltSpeed) {
      return true;
    }
    if (type === 'download') {
      return settings?.downloadSpeedLimitEnabled || false;
    } else if (type === 'upload') {
      return settings?.uploadSpeedLimitEnabled || false;
    }
    return false;
  };

  const handleUnlimited = (): void => {
    if (type === 'download') {
      if (isAltSpeed) {
        client?.setAltSpeedEnabled(false);
      } else {
        client?.setDownloadSpeedLimitEnabled(false);
      }
    } else if (type === 'upload') {
      if (isAltSpeed) {
        client?.setAltSpeedEnabled(false);
      } else {
        client?.setUploadSpeedLimitEnabled(false);
      }
    }
  };

  const handleSetSpeedLimit = (speed: number): void => {
    if (type === 'download') {
      if (isAltSpeed) {
        client?.setAltDownloadSpeedLimit(speed);
      } else {
        client?.setDownloadSpeedLimit(speed);
      }
    } else if (type === 'upload') {
      if (isAltSpeed) {
        client?.setAltUploadSpeedLimit(speed);
      } else {
        client?.setUploadSpeedLimit(speed);
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
          {getSpeedArray(speedLimit, SPEED_ARRAY_COUNT, true).map((speed) => {
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

function getSpeedArray(currentLimit: number, count: number, maybeZero: boolean): number[] {
  let limit = currentLimit;
  if (!maybeZero && !limit) {
    limit = DEFAULT_SPEED_LIMIT;
  }
  const middle = Math.round(count / 2);
  let middleSpeed = limit;
  if (middleSpeed < middle) {
    middleSpeed = middle;
  }
  const arr: number[] = new Array(count);
  for (let i = 0; i < count; i++) {
    arr[i] = Math.round(((i + 1) / middle) * middleSpeed);
  }
  if (limit === 0) {
    arr.pop();
    arr.unshift(limit);
  }
  return arr;
}

export default SpeedContextMenu;
