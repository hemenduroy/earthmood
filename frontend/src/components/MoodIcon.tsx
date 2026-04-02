import React from 'react';

interface MoodIconProps {
  emotion: string;
  size?: number;
  className?: string;
}

const MoodIcon: React.FC<MoodIconProps> = ({ emotion, size = 48, className = '' }) => {
  return (
    <img
      src={`/mood-icons/${emotion}.svg`}
      alt={`${emotion} mood icon`}
      width={size}
      height={size}
      className={className}
    />
  );
};

export default MoodIcon; 