'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full border border-transparent opacity-0">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="w-10 h-10 rounded-full border border-border hover:bg-foreground hover:text-background transition-all group relative overflow-hidden"
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
    >
      <div className="relative z-10">
        {theme === 'light' ? (
          <Moon className="h-4 w-4 transition-transform group-hover:rotate-12" />
        ) : (
          <Sun className="h-4 w-4 transition-transform group-hover:rotate-90" />
        )}
      </div>
      
      {/* Background Pulse Effect */}
      <div className="absolute inset-0 bg-current opacity-0 group-active:opacity-10 transition-opacity" />
    </Button>
  );
}
