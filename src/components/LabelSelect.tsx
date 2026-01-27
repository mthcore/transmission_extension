import React, { useCallback, useContext } from "react";
import { observer } from "mobx-react";
import Select, { Option } from "rc-select";
import RootStoreCtx from "../tools/rootStoreCtx";

const LabelSelect: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const config = rootStore?.config;

  const handleChange = useCallback((value: string) => {
    const selectedLabel = JSON.parse(value) as { label: string; custom: boolean };
    config?.setSelectedLabel(selectedLabel.label, selectedLabel.custom);
  }, [config]);

  if (!rootStore || !config) return null;

  const selectedLabel = config.selectedLabel;

  let defaultValue: string | null = null;
  const options = rootStore.torrentList.filters.map(({ label, custom: isCustom }) => {
    const id = JSON.stringify({ label, custom: isCustom });

    let text: string | null = null;
    if (isCustom) {
      if (label === 'SEEDING') {
        text = chrome.i18n.getMessage('OV_FL_' + label);
      } else {
        text = chrome.i18n.getMessage('OV_CAT_' + label);
      }
    } else {
      text = label;
    }

    let dataImage: string | null = null;
    let image: React.ReactNode = null;
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
        <span title={text || undefined}>{text}</span>
      </Option>
    );
  });

  return (
    <li className="select">
      <Select defaultValue={defaultValue || undefined} onChange={handleChange}
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
