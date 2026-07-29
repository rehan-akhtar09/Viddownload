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
        variantClasses = 'bg-red-600 text-white shadow-lg shadow-red-600/10 hover:bg-red-500 hover:shadow-red-500/20 active:scale-[0.98]';
        break;
      case 'premium':
        variantClasses = 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg shadow-red-500/15 hover:opacity-90 active:scale-[0.98]';
        break;
      case 'destructive':
        variantClasses = 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30';
        break;
      case 'outline':
        variantClasses = 'border border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10 hover:text-white active:scale-[0.98]';
        break;
      case 'secondary':
        variantClasses = 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white';
        break;
      case 'ghost':
        variantClasses = 'text-neutral-300 hover:bg-white/5 hover:text-white';
        break;
      case 'link':
        variantClasses = 'text-red-500 underline-offset-4 hover:underline bg-transparent p-0 h-auto';
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
        className={`inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-40 ${variantClasses} ${sizeClasses} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
