import React from "react";
import PropTypes from "prop-types";

const DirectorySelect = ({
  folders,
  name = "directory",
  defaultValue = -1,
  showCustomOption = false,
  onChange,
  label,
}) => {
  if (!folders.length) {
    return null;
  }

  return (
    <div className="nf-subItem">
      <label>{label || chrome.i18n.getMessage('path')}</label>
      <select name={name} defaultValue={defaultValue} onChange={onChange}>
        {showCustomOption && <option value={-2}/>}
        <option value={-1}>{chrome.i18n.getMessage('defaultPath')}</option>
        {folders.map((folder, index) => (
          <option key={`option-${index}`} value={index}>
            {folder.name || folder.path}
          </option>
        ))}
      </select>
    </div>
  );
};

DirectorySelect.propTypes = {
  folders: PropTypes.array.isRequired,
  name: PropTypes.string,
  defaultValue: PropTypes.number,
  showCustomOption: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.string,
};

export default DirectorySelect;
