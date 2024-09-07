import * as React from 'react';

import { cn } from '@/libs/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, type, ...props }, ref) => {
    return (
      <div className="w-full inline-block relative">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        ) : null}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-slate-200 bg-primary-background px-3 py-2 text-sm shadow-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300',
            {
              'pl-9': icon,
            },
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
