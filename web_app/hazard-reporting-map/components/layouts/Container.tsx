import { cn } from '@/lib/utils';
import React from 'react';

type TProps = {
  children: React.ReactNode;
  className?: string;
};
export default function Container({ children, className }: TProps) {
  return (
    <div className={cn('max-w-[1460px] mx-auto px-6', className)}>
      {children}
    </div>
  );
}
