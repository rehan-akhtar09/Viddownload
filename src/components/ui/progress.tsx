import * as React from 'react';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = '', value = 0, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-white/10 dark:bg-white/5 ${className}`}
        {...props}
      >
        <div
          className="h-full w-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300 ease-out"
          style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';
