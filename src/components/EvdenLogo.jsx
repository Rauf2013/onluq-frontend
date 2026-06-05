import React from 'react';

// EVDƏN house+person logo — fill icin currentColor istifade edir.
// Sari rəng üçün: <EvdenLogo style={{ color: '#FFED00' }} />
// Navy rəng üçün: <EvdenLogo style={{ color: '#14224F' }} />
export default function EvdenLogo({ size = 96, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...rest}
    >
      {/* Çatı — qalın chevron, dəyirmi uclar */}
      <path
        d="M18 66 L60 24 L102 66"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Baş */}
      <circle cx="60" cy="68" r="13" fill="currentColor" />
      {/* Bədən / çiyinlər */}
      <path
        d="M34 102 Q60 74 86 102 Z"
        fill="currentColor"
      />
    </svg>
  );
}
