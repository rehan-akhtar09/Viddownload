import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={`flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all duration-200 focus:border-red-500 focus:bg-white/10 focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/5 dark:bg-black/20 dark:focus:bg-black/30 ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
