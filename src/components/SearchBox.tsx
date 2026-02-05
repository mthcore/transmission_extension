import React, {
  useState,
  useRef,
  useCallback,
  useContext,
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
} from 'react';
import { observer } from 'mobx-react';
import RootStoreCtx from '../tools/rootStoreCtx';

const SearchBox: React.FC = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const config = rootStore?.config;
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setExpanded((prev) => {
      if (!prev) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return !prev;
    });
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      config?.setSearchQuery(e.target.value);
    },
    [config]
  );

  const handleClear = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      config?.setSearchQuery('');
      inputRef.current?.focus();
    },
    [config]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        config?.setSearchQuery('');
        setExpanded(false);
      }
    },
    [config]
  );

  const query = config?.searchQuery || '';

  return (
    <li className={`search ${expanded ? 'expanded' : ''}`}>
      {expanded && (
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={chrome.i18n.getMessage('search')}
          aria-label={chrome.i18n.getMessage('search')}
        />
      )}
      <a
        onClick={handleToggle}
        title={chrome.i18n.getMessage('search')}
        aria-label={chrome.i18n.getMessage('search')}
        className="btn search-icon"
        href="#search"
      />
      {expanded && query && (
        <a
          onClick={handleClear}
          className="btn clear-icon"
          aria-label={chrome.i18n.getMessage('clearSearch')}
          href="#clear"
        />
      )}
    </li>
  );
});

export default SearchBox;
