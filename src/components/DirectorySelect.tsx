import React, { ChangeEvent } from 'react';
import { CUSTOM_PATH_INDEX, DEFAULT_PATH_INDEX } from '../constants';
import type { Folder } from '../types/bg';

interface DirectorySelectProps {
  folders: Folder[];
  name?: string;
  defaultValue?: number;
  showCustomOption?: boolean;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
}

const DirectorySelect = ({
  folders,
  name = 'directory',
  defaultValue = DEFAULT_PATH_INDEX,
  showCustomOption = false,
  onChange,
  label,
}: DirectorySelectProps) => {
  if (!folders.length) {
    return null;
  }

  return (
    <div className="nf-subItem">
      <label>{label || chrome.i18n.getMessage('path')}</label>
      <select name={name} defaultValue={defaultValue} onChange={onChange}>
        {showCustomOption && <option value={CUSTOM_PATH_INDEX} />}
        <option value={DEFAULT_PATH_INDEX}>{chrome.i18n.getMessage('defaultPath')}</option>
        {folders.map((folder, index) => (
          <option key={`option-${index}`} value={index}>
            {folder.name || folder.path}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DirectorySelect;
