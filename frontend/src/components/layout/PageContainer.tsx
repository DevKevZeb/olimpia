import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
  className?: string;
  noPadding?: boolean;
  variant?: 'default' | 'wide' | 'fullscreen';
}

export default function PageContainer({ 
  children, 
  maxWidth = 'xl',
  className = '',
  noPadding = false,
  variant = 'default'
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-7xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full'
  };

  const variantClasses = {
    default: 'bg-white rounded-lg shadow-lg p-8',
    wide: 'bg-white rounded-lg shadow-lg p-6 lg:p-8',
    fullscreen: 'bg-white min-h-screen p-4 lg:p-6'
  };

  const containerPadding = noPadding ? '' : 'px-4 sm:px-6 lg:px-8 py-12';

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto ${containerPadding} ${className}`}>
      <div className={variantClasses[variant]}>
        {children}
      </div>
    </div>
  );
}
