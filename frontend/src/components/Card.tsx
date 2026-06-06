'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-6 border border-slate-100 ${className}`}>
      {children}
    </div>
  );
}
