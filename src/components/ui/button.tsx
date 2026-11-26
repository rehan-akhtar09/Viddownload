import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'premium';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    let variantClasses = '';
    switch (variant) {
      case 'default':
        variantClasses = 'bg-violet-600 text-white shadow-lg shadow-violet-600/15 hover:bg-violet-500 hover:shadow-violet-500/20 active:scale-[0.98]';
        break;
      case 'premium':
        variantClasses = 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-600/20 hover:opacity-95 hover:shadow-violet-500/25 active:scale-[0.98]';
        break;
      case 'destructive':
        variantClasses = 'bg-red-500/10 border border-red-500/25 text-red-600 hover:bg-red-500/15 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/30';
        break;
      case 'outline':
        variantClasses = 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-400 active:scale-[0.98] dark:border-white/10 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white dark:hover:border-white/20';
        break;
      case 'secondary':
        variantClasses = 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white';
        break;
      case 'ghost':
        variantClasses = 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white';
        break;
      case 'link':
        variantClasses = 'text-violet-600 underline-offset-4 hover:underline bg-transparent p-0 h-auto dark:text-violet-400';
        break;
    }

    let sizeClasses = '';
    switch (size) {
      case 'default':
        sizeClasses = 'h-10 px-4 py-2';
        break;
      case 'sm':
        sizeClasses = 'h-8 rounded-lg px-3 text-xs';
        break;
      case 'lg':
        sizeClasses = 'h-12 rounded-2xl px-8 text-base';
        break;
      case 'icon':
        sizeClasses = 'h-10 w-10 p-0';
        break;
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950 disabled:pointer-events-none disabled:opacity-40 ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
