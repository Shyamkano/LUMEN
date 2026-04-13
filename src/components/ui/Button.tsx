import { cn } from '@/lib/utils';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'icon' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-95',
          // Variants
          variant === 'default' && 'bg-foreground text-background hover:opacity-90 shadow-sm',
          variant === 'ghost' && 'hover:bg-muted/10 text-foreground',
          variant === 'outline' && 'border border-border bg-transparent hover:bg-muted/5 text-foreground',
          variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
          variant === 'link' && 'bg-transparent text-foreground hover:underline p-0 h-auto',
          // Sizes
          size === 'default' && 'h-10 px-5 py-2 text-sm',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'icon' && 'h-9 w-9',
          size === 'lg' && 'h-12 px-8 text-base',
          className
        )}
        ref={ref}
        {...props}
      />
    );

  }
);
Button.displayName = 'Button';

export { Button };
