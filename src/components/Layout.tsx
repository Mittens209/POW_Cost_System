import React from 'react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {children}
    </div>
  );
};

export const Header: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <header className="bg-card shadow-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </header>
  );
};

export const Main: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  return (
    <main className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", className)}>
      {children}
    </main>
  );
};