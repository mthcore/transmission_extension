import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'small', className = '' }) => {
  const sizeClass = `spinner--${size}`;
  return (
    <span className={`spinner ${sizeClass} ${className}`.trim()} aria-label="Loading" role="status" />
  );
};

export default Spinner;
