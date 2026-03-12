import React, { useState, useCallback, useRef } from 'react';
import { observer } from 'mobx-react';
import { RgbColorPicker, RgbColor } from 'react-colorful';
import { Popover } from 'react-tiny-popover';
import { useOptionsPage } from '../../hooks/useOptionsPage';

interface ConfigStore {
  showDownloadCompleteNotifications: boolean;
  showActiveCountBadge: boolean;
  badgeColor: string;
  backgroundUpdateInterval: number;
  setOptions: (options: Record<string, unknown>) => void;
}

function parseBadgeColor(badgeColor: string): RgbColor {
  const [r, g, b] = badgeColor.split(',');
  return {
    r: parseInt(r, 10) || 0,
    g: parseInt(g, 10) || 0,
    b: parseInt(b, 10) || 0,
  };
}

function rgbToStorageString(color: RgbColor): string {
  return [color.r, color.g, color.b, 1].join(',');
}

const NotifyOptions = observer(() => {
  const { configStore, handleChange, handleSetInt } = useOptionsPage<ConfigStore>();
  const [colorPickerOpened, setColorPickerOpened] = useState(false);
  const [pickerColor, setPickerColor] = useState<RgbColor>(() =>
    parseBadgeColor(configStore.badgeColor)
  );
  const pickerColorRef = useRef(pickerColor);

  const handleColorChange = useCallback((color: RgbColor) => {
    pickerColorRef.current = color;
    setPickerColor(color);
  }, []);

  const handleOpenColorPicker = useCallback(() => {
    const color = parseBadgeColor(configStore.badgeColor);
    pickerColorRef.current = color;
    setPickerColor(color);
    setColorPickerOpened(true);
  }, [configStore]);

  const handleCloseColorPicker = useCallback(() => {
    setColorPickerOpened(false);
    configStore.setOptions({ badgeColor: rgbToStorageString(pickerColorRef.current) });
  }, [configStore]);

  return (
    <div className="page notify">
      <h2>{chrome.i18n.getMessage('optNotify')}</h2>
      <label>
        <span>{chrome.i18n.getMessage('showNotificationOnDownloadComplete')}</span>
        <span className="toggle-switch">
          <input
            defaultChecked={configStore.showDownloadCompleteNotifications}
            onChange={handleChange}
            type="checkbox"
            name="showDownloadCompleteNotifications"
          />
          <span className="toggle-slider"></span>
        </span>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('displayActiveTorrentCountIcon')}</span>
        <span className="toggle-switch">
          <input
            defaultChecked={configStore.showActiveCountBadge}
            onChange={handleChange}
            type="checkbox"
            name="showActiveCountBadge"
          />
          <span className="toggle-slider"></span>
        </span>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('badgeColor')}</span>
        <Popover
          isOpen={colorPickerOpened}
          onClickOutside={handleCloseColorPicker}
          positions={['bottom']}
          content={<RgbColorPicker color={pickerColor} onChange={handleColorChange} />}
        >
          <span
            onClick={colorPickerOpened ? handleCloseColorPicker : handleOpenColorPicker}
            className="selectColor"
            style={{ backgroundColor: `rgb(${pickerColor.r},${pickerColor.g},${pickerColor.b})` }}
          />
        </Popover>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('backgroundUpdateInterval')}</span>
        <input
          defaultValue={configStore.backgroundUpdateInterval}
          onChange={handleSetInt}
          type="number"
          name="backgroundUpdateInterval"
          min="1000"
        />{' '}
        <span>{chrome.i18n.getMessage('ms')}</span>
      </label>
    </div>
  );
});

export default NotifyOptions;
