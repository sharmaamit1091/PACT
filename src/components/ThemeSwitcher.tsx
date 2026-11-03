import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check, ChevronDown, Sparkles, Moon, Leaf } from 'lucide-react';
import {
  AppTheme,
  VALID_THEMES,
  THEME_CONFIGS,
  getInitialTheme,
  applyThemeToDocument,
} from '../utils/themeLogic';

interface ThemeSwitcherProps {
  currentTheme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentTheme: controlledTheme,
  onThemeChange,
  className = '',
}) => {
  const [activeTheme, setActiveTheme] = useState<AppTheme>(() => {
    return controlledTheme || getInitialTheme('soothing-sage');
  });
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with controlled prop if passed
  useEffect(() => {
    if (controlledTheme && controlledTheme !== activeTheme) {
      setActiveTheme(controlledTheme);
    }
  }, [controlledTheme]);

  // Initial application of theme to document.body on mount
  useEffect(() => {
    const initial = controlledTheme || getInitialTheme('soothing-sage');
    applyThemeToDocument(initial);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Use click and pointerdown to safely capture events
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (theme: AppTheme) => {
    setActiveTheme(theme);
    applyThemeToDocument(theme);
    onThemeChange?.(theme);
    setIsOpen(false);
  };

  const currentConfig = THEME_CONFIGS[activeTheme] || THEME_CONFIGS['soothing-sage'];

  const getThemeIcon = (theme: AppTheme) => {
    switch (theme) {
      case 'evening-stone':
        return <Moon className="w-3.5 h-3.5 text-emerald-400" />;
      case 'matcha-oat':
        return <Sparkles className="w-3.5 h-3.5 text-lime-600 dark:text-lime-400" />;
      case 'soothing-sage':
      default:
        return <Leaf className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />;
    }
  };

  return (
    <div className={`relative inline-block text-left select-none ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-medium theme-bg-card hover:theme-bg-card-subtle theme-text-main border theme-border shadow-sm transition-all active:scale-95 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="Switch UI Theme ('soothing-sage', 'evening-stone', 'matcha-oat')"
      >
        {/* Split swatch bubble */}
        <div className="relative w-4 h-4 rounded-full overflow-hidden border theme-border shrink-0 shadow-inner flex items-center justify-center">
          <span
            className="absolute inset-0"
            style={{ backgroundColor: currentConfig.bgHex }}
          />
          <span
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentConfig.accentHex }}
          />
        </div>

        <span className="hidden sm:inline font-medium theme-text-main">
          {currentConfig.name}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 theme-text-muted transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-64 rounded-2xl theme-bg-card backdrop-blur-md border theme-border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-2 border-b theme-border mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold theme-text-main">
              <Palette className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Theme Appearance</span>
            </div>
            <span className="text-[10px] font-mono theme-text-muted uppercase tracking-wider">
              3 Themes
            </span>
          </div>

          <div className="space-y-1">
            {VALID_THEMES.map((themeId) => {
              const cfg = THEME_CONFIGS[themeId];
              const isSelected = activeTheme === themeId;

              return (
                <button
                  key={themeId}
                  role="menuitem"
                  type="button"
                  data-theme-option={themeId}
                  onClick={() => handleSelect(themeId)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group ${
                    isSelected
                      ? 'theme-bg-card-subtle theme-text-main font-semibold border theme-border shadow-sm'
                      : 'theme-text-secondary hover:theme-text-main hover:theme-bg-card-subtle border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Visual Color Swatch */}
                    <div
                      className="relative w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border shadow-sm"
                      style={{
                        backgroundColor: cfg.bgHex,
                        borderColor: cfg.borderHex,
                      }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: cfg.accentHex }}
                      />
                    </div>

                    <div>
                      <div className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                        <span className="theme-text-main">{cfg.name}</span>
                        {isSelected && (
                          <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] theme-text-muted mt-0.5 leading-snug">
                        {cfg.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t theme-border px-2.5 py-1 text-[10px] theme-text-muted flex items-center justify-between">
            <span>Updates document.body[data-theme]</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Instant</span>
          </div>
        </div>
      )}
    </div>
  );
};
