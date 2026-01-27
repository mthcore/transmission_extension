import React, { useState, useCallback } from "react";
import { observer } from "mobx-react";
import { SketchPicker, ColorResult } from "react-color";
import { Popover } from "react-tiny-popover";
import { useOptionsPage } from "../../hooks/useOptionsPage";

interface ConfigStore {
  showDownloadCompleteNotifications: boolean;
  showActiveCountBadge: boolean;
  badgeColor: string;
  backgroundUpdateInterval: number;
  setOptions: (options: Record<string, unknown>) => void;
}

const NotifyOptions: React.FC = observer(() => {
  const { configStore, handleChange, handleSetInt } = useOptionsPage();
  const typedConfigStore = configStore as unknown as ConfigStore;
  const [colorPickerOpened, setColorPickerOpened] = useState(false);

  const handleToggleColorPicker = useCallback(() => {
    setColorPickerOpened(prev => !prev);
  }, []);

  const handleChangeColor = useCallback((color: ColorResult) => {
    const rgba = [color.rgb.r, color.rgb.g, color.rgb.b, color.rgb.a].join(',');
    typedConfigStore.setOptions({
      badgeColor: rgba
    });
  }, [typedConfigStore]);

  const [r, g, b, a] = typedConfigStore.badgeColor.split(',');
  const sketchPickerColor = {
    r: parseInt(r, 10),
    g: parseInt(g, 10),
    b: parseInt(b, 10),
    a: parseFloat(a),
  };

  return (
    <div className="page notify">
      <h2>{chrome.i18n.getMessage('optNotify')}</h2>
      <label>
        <span>{chrome.i18n.getMessage('showNotificationOnDownloadComplete')}</span>
        <span className="toggle-switch">
          <input defaultChecked={typedConfigStore.showDownloadCompleteNotifications} onChange={handleChange} type="checkbox" name="showDownloadCompleteNotifications" />
          <span className="toggle-slider"></span>
        </span>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('displayActiveTorrentCountIcon')}</span>
        <span className="toggle-switch">
          <input defaultChecked={typedConfigStore.showActiveCountBadge} onChange={handleChange} type="checkbox" name="showActiveCountBadge" />
          <span className="toggle-slider"></span>
        </span>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('badgeColor')}</span>
        <Popover
          isOpen={colorPickerOpened}
          onClickOutside={handleToggleColorPicker}
          positions={['bottom']}
          content={(
            <SketchPicker color={sketchPickerColor} onChangeComplete={handleChangeColor} />
          )}
        >
          <span onClick={handleToggleColorPicker} className="selectColor" style={{ backgroundColor: `rgba(${typedConfigStore.badgeColor})` }} />
        </Popover>
      </label>
      <label>
        <span>{chrome.i18n.getMessage('backgroundUpdateInterval')}</span>
        <input defaultValue={typedConfigStore.backgroundUpdateInterval} onChange={handleSetInt} type="number" name="backgroundUpdateInterval" min="1000" />
        {' '}
        <span>{chrome.i18n.getMessage('ms')}</span>
      </label>
    </div>
  );
});

export default NotifyOptions;
