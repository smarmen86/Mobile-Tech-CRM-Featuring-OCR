import React from 'react';

export const DocumentScanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
    <polyline points="19 2 19 8 13 8" />
    <path d="M2 12h3" />
    <path d="M2 7h1" />
    <path d="M2 17h2" />
    <path d="M21 12h-2" />
    <path d="M21 7h-1" />
    <path d="M21 17h-3" />
  </svg>
);
