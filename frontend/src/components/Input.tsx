'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3.5 py-2.5 border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
          error ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
    </div>
  );
}
