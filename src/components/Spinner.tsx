import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Spinner = ({ size = 'small', className = '' }: SpinnerProps) => {
  const sizeClass = `spinner--${size}`;
  return (
    <span
      className={`spinner ${sizeClass} ${className}`.trim()}
      aria-label="Loading"
      role="status"
    />
  );
};

export default Spinner;
