import React, {useState, useRef, useCallback, useContext} from "react";
import {observer} from "mobx-react";
import RootStoreCtx from "../tools/RootStoreCtx";

const SearchBox = observer(() => {
  const rootStore = useContext(RootStoreCtx);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);

  const handleToggle = useCallback((e) => {
    e.preventDefault();
    setExpanded(prev => {
      if (!prev) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return !prev;
    });
  }, []);

  const handleChange = useCallback((e) => {
    rootStore.config.setSearchQuery(e.target.value);
  }, [rootStore]);

  const handleClear = useCallback((e) => {
    e.preventDefault();
    rootStore.config.setSearchQuery('');
    inputRef.current?.focus();
  }, [rootStore]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      rootStore.config.setSearchQuery('');
      setExpanded(false);
    }
  }, [rootStore]);

  const query = rootStore.config.searchQuery;

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
      <a onClick={handleToggle} title={chrome.i18n.getMessage('search')} aria-label={chrome.i18n.getMessage('search')} className="btn search-icon" href="#search"/>
      {expanded && query && (
        <a onClick={handleClear} className="btn clear-icon" aria-label={chrome.i18n.getMessage('clearSearch')} href="#clear"/>
      )}
    </li>
  );
});

export default SearchBox;
