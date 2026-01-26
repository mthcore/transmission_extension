import React, {useState, useRef, useCallback, useEffect} from "react";
import PropTypes from "prop-types";

// Global style cache for TorrentName animations
const styleCache = new Map();

function getOrCreateStyle(moveName, width, elWidth) {
  if (styleCache.has(moveName)) {
    const cached = styleCache.get(moveName);
    cached.useCount++;
    return moveName;
  }

  const timeCalc = Math.round(elWidth / width * 3.5);
  const style = document.createElement('style');
  style.classList.add(moveName);
  style.textContent = `@keyframes a_${moveName}{0%{margin-left:2px;}50%{margin-left:-${elWidth - width}px;}90%{margin-left:6px;}100%{margin-left:2px;}}div.${moveName}:hover>span{overflow:visible;animation:a_${moveName} ${timeCalc}s;}`;
  document.body.appendChild(style);

  styleCache.set(moveName, { style, useCount: 1 });
  return moveName;
}

function releaseStyle(moveName) {
  if (!moveName || !styleCache.has(moveName)) return;

  const cached = styleCache.get(moveName);
  cached.useCount--;

  if (cached.useCount <= 0) {
    cached.style.remove();
    styleCache.delete(moveName);
  }
}

const TorrentName = React.memo(({name, width}) => {
  const [movebleClassName, setMovebleClassName] = useState(null);
  const [shouldUpdateCalc, setShouldUpdateCalc] = useState(true);
  const refSpan = useRef(null);
  const prevNameRef = useRef(name);
  const prevWidthRef = useRef(width);

  // Reset calculation flag when name or width changes
  useEffect(() => {
    if (prevNameRef.current !== name || prevWidthRef.current !== width) {
      setShouldUpdateCalc(true);
      prevNameRef.current = name;
      prevWidthRef.current = width;
    }
  }, [name, width]);

  // Cleanup on unmount
  useEffect(() => {
    return () => releaseStyle(movebleClassName);
  }, [movebleClassName]);

  const handleMouseEnter = useCallback(() => {
    setShouldUpdateCalc(false);
    releaseStyle(movebleClassName);

    const spanWidth = refSpan.current?.offsetWidth || 0;
    if (spanWidth < width) {
      setMovebleClassName(null);
      return;
    }

    // Round elWidth to reduce unique style combinations
    let elWidth = Math.ceil(spanWidth / 50) * 50;
    if (elWidth < 100) elWidth = 100;

    const moveName = `mv_${width}_${elWidth}`;
    getOrCreateStyle(moveName, width, elWidth);
    setMovebleClassName(moveName);
  }, [width, movebleClassName]);

  const classList = ['title'];
  if (!shouldUpdateCalc && movebleClassName) {
    classList.push(movebleClassName);
  }

  return (
    <div className={classList.join(' ')}>
      <span
        ref={refSpan}
        onMouseEnter={shouldUpdateCalc ? handleMouseEnter : undefined}
        title={name}
      >
        {name}
      </span>
    </div>
  );
});

TorrentName.propTypes = {
  name: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
};

export default TorrentName;
