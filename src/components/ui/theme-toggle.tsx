import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
      aria-label="Toggle theme"
    >
      <div className="relative w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full transition-colors">
        <div
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-slate-900 rounded-full shadow-md transition-all duration-300 flex items-center justify-center",
            theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
          )}
        >
          {theme === 'light' ? (
            <Sun className="h-3 w-3 text-amber-500" />
          ) : (
            <Moon className="h-3 w-3 text-blue-400" />
          )}
        </div>
      </div>
      <span className="text-[14px] font-bold text-slate-600 dark:text-slate-300">
        {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
      </span>
    </button>
  );
}
