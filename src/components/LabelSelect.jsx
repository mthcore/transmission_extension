import React, {useCallback, useContext} from "react";
import {observer} from "mobx-react";
import Select, {Option} from "rc-select";
import RootStoreCtx from "../tools/RootStoreCtx";

const LabelSelect = observer(() => {
  const rootStore = useContext(RootStoreCtx);

  const handleChange = useCallback((value) => {
    const selectedLabel = JSON.parse(value);
    rootStore.config.setSelectedLabel(selectedLabel.label, selectedLabel.custom);
  }, [rootStore]);

  const selectedLabel = rootStore.config.selectedLabel;

  let defaultValue = null;
  const options = rootStore.torrentList.filters.map(({label, custom: isCustom}) => {
    const id = JSON.stringify({label, custom: isCustom});

    let text = null;
    if (isCustom) {
      if (label === 'SEEDING') {
        text = chrome.i18n.getMessage('OV_FL_' + label);
      } else {
        text = chrome.i18n.getMessage('OV_CAT_' + label);
      }
    } else {
      text = label;
    }

    let dataImage = null;
    let image = null;
    if (isCustom) {
      dataImage = label;
      image = (
        <span className="image" data-image={dataImage}/>
      );
    }

    if (selectedLabel.id === id) {
      defaultValue = id;
    }

    return (
      <Option key={id} value={id}>
        {image}
        <span title={text}>{text}</span>
      </Option>
    );
  });

  return (
    <li className="select">
      <Select defaultValue={defaultValue} onChange={handleChange}
              showSearch={false}
              optionLabelProp="children"
              virtual={false}
              listHeight={500}
      >
        {options}
      </Select>
    </li>
  );
});

export default LabelSelect;
