import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}