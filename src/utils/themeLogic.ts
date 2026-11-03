export type AppTheme = 'soothing-sage' | 'evening-stone' | 'matcha-oat';

export const VALID_THEMES: readonly AppTheme[] = ['soothing-sage', 'evening-stone', 'matcha-oat'] as const;

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  subtitle: string;
  bgHex: string;
  accentHex: string;
  borderHex: string;
  mode: 'light' | 'dark' | 'warm';
}

export const THEME_CONFIGS: Record<AppTheme, ThemeConfig> = {
  'soothing-sage': {
    id: 'soothing-sage',
    name: 'Soothing Sage',
    subtitle: 'Calm organic sage (Light)',
    bgHex: '#F7FAF7',
    accentHex: '#0F766E',
    borderHex: '#DEE5DE',
    mode: 'light',
  },
  'evening-stone': {
    id: 'evening-stone',
    name: 'Evening Stone',
    subtitle: 'Deep dark & emerald (Dark)',
    bgHex: '#131615',
    accentHex: '#10B981',
    borderHex: '#2C3530',
    mode: 'dark',
  },
  'matcha-oat': {
    id: 'matcha-oat',
    name: 'Matcha Oat',
    subtitle: 'Warm oat & matcha (Warm Light)',
    bgHex: '#F5F3EC',
    accentHex: '#3F6212',
    borderHex: '#DCD5C4',
    mode: 'warm',
  },
};

export function isValidTheme(theme: unknown): theme is AppTheme {
  return typeof theme === 'string' && VALID_THEMES.includes(theme as AppTheme);
}

export function getInitialTheme(defaultFallback: AppTheme = 'soothing-sage'): AppTheme {
  if (typeof document !== 'undefined' && document.body) {
    const fromBody = document.body.getAttribute('data-theme');
    if (isValidTheme(fromBody)) return fromBody;
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const saved = localStorage.getItem('pact_theme');
      if (isValidTheme(saved)) return saved;
    } catch {
      // storage unavailable
    }
  }
  return defaultFallback;
}

export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document !== 'undefined') {
    if (document.body && document.body.getAttribute('data-theme') !== theme) {
      document.body.setAttribute('data-theme', theme);
    }
    if (document.documentElement && document.documentElement.getAttribute('data-theme') !== theme) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('pact_theme', theme);
    } catch {
      // storage unavailable
    }
  }
}
