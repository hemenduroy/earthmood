import React from 'react';

interface FaviconIconProps {
  size?: number;
  className?: string;
}

export default function FaviconIcon({ size = 24, className = "" }: FaviconIconProps) {
  return (
    <img
      src="/favicon.png"
      alt="earthmood"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: '50%' }}
    />
  );
}