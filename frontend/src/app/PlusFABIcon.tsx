import React from "react";

const PlusFABIcon: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="none" />
    <rect x="14" y="7" width="4" height="18" rx="2" fill={color} />
    <rect x="7" y="14" width="18" height="4" rx="2" fill={color} />
  </svg>
);

export default PlusFABIcon; 