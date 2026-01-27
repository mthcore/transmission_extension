import { flow, types, Instance, cast } from "mobx-state-tree";
import ConfigStore, { configKeys, defaultFileListColumnList, defaultTorrentListColumnList } from "./ConfigStore";
import getLogger from "../tools/getLogger";
import loadConfig from "../tools/loadConfig";
import ClientStore from "./ClientStore";
import mergeColumns from "../tools/mergeColumns";
import type { ColumnConfig } from "../types";

const logger = getLogger('BgStore');

const BgStore = types.model('BgStore', {
  config: types.maybe(ConfigStore),
  client: types.optional(ClientStore, {}),
}).actions((self) => {
  return {
    fetchConfig: flow(function* () {
      try {
        const config: Record<string, unknown> = yield loadConfig(configKeys);

        const columnMergeConfigs: [string, ColumnConfig[]][] = [
          ['filesColumns', defaultFileListColumnList as ColumnConfig[]],
          ['torrentColumns', defaultTorrentListColumnList as ColumnConfig[]]
        ];

        columnMergeConfigs.forEach(([key, defColumns]) => {
          if (config[key]) {
            try {
              mergeColumns(config[key] as ColumnConfig[], defColumns);
            } catch (err) {
              logger.error(`mergeColumns ${key} error, use default`, err);
            }
          }
        });

        self.config = cast({});
        Object.entries(config).forEach(([key, value]) => {
          try {
            (self.config as unknown as Record<string, unknown>)[key] = value;
          } catch (err) {
            logger.error(`fetchConfig key (${key}) error, use default value`, err);
          }
        });
      } catch (err) {
        logger.error('fetchConfig error, use default config', err);
      }
    }),
    flushClient() {
      self.client = cast({});
    }
  };
});

export type IBgStore = Instance<typeof BgStore>;
export default BgStore;
