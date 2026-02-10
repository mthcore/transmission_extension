import React from 'react';
import { PROGRESS_LIGHT_DENOMINATOR } from '../constants';

interface ProgressBarProps {
  progressStr: string;
  progressClass: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progressStr, progressClass }) => {
  const progressNum = parseFloat(progressStr) || 0;
  const lightWidth = progressNum > 0 ? `${PROGRESS_LIGHT_DENOMINATOR / progressNum}%` : '100%';

  return (
    <div
      className="progress_b"
      role="progressbar"
      aria-valuenow={progressNum}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="val">{progressStr}</div>
      <div className={`progress_b_i ${progressClass}`} style={{ width: progressStr }}>
        <div className="val-light" style={{ width: lightWidth }}>
          {progressStr}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProgressBar);
