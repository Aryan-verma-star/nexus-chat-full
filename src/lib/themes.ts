// src/lib/themes.ts
// Minimal theme utility — CSS does the heavy lifting

export const themeNames = ['cyber', 'midnight', 'phantom'] as const;
export type ThemeName = typeof themeNames[number];

export interface ThemeMeta {
  name: ThemeName;
  label: string;
  previewAccent: string;
  previewBg: string;
}

export const themeMeta: Record<ThemeName, ThemeMeta> = {
  cyber: {
    name: 'cyber',
    label: 'Cyber',
    previewAccent: '#00ff88',
    previewBg: '#0a0a0f',
  },
  midnight: {
    name: 'midnight',
    label: 'Midnight',
    previewAccent: '#58a6ff',
    previewBg: '#0d1117',
  },
  phantom: {
    name: 'phantom',
    label: 'Phantom',
    previewAccent: '#a78bfa',
    previewBg: '#13111c',
  },
};

/**
 * Apply theme — just sets a data attribute on <html>
 * CSS in index.css handles the actual variable overrides
 */
export function applyTheme(name: ThemeName): void {
  console.log('[NEXUS THEME] Applying theme:', name);

  document.documentElement.setAttribute('data-theme', name);

  document.documentElement.style.removeProperty('background-color');
  document.documentElement.style.removeProperty('color');
  document.body.style.removeProperty('background-color');
  document.body.style.removeProperty('color');
  document.body.style.removeProperty('background');

  const oldStyle = document.getElementById('nexus-theme-override') ||
                   document.getElementById('nexus-theme-vars');
  if (oldStyle) oldStyle.remove();

  console.log('[NEXUS THEME] data-theme is now:', document.documentElement.getAttribute('data-theme'));
  console.log('[NEXUS THEME] Computed --background:', getComputedStyle(document.documentElement).getPropertyValue('--background'));
}

export function getSavedTheme(): ThemeName {
  try {
    const stored = localStorage.getItem('nexus_theme');
    if (stored && themeNames.includes(stored as ThemeName)) {
      return stored as ThemeName;
    }
    const oldStored = localStorage.getItem('nexus_appearance_prefs');
    if (oldStored) {
      const parsed = JSON.parse(oldStored);
      if (parsed.theme && themeNames.includes(parsed.theme as ThemeName)) {
        return parsed.theme as ThemeName;
      }
    }
  } catch {}
  return 'cyber';
}

export function saveTheme(name: ThemeName): void {
  try {
    localStorage.setItem('nexus_theme', name);
    console.log('[NEXUS THEME] Saved to localStorage:', name);
  } catch {}
}

/**
 * Hex colors for inline styles in SettingsTab
 */
export function getThemeHex(name: ThemeName) {
  const colors: Record<ThemeName, { bg: string; fg: string; accent: string; muted: string; card: string; danger: string }> = {
    cyber:    { bg: '#0a0a0f', fg: '#e0e0e0', accent: '#00ff88', muted: '#888899', card: '#12121a', danger: '#ff3366' },
    midnight: { bg: '#0d1117', fg: '#c9d1d9', accent: '#58a6ff', muted: '#8b949e', card: '#161b22', danger: '#f85149' },
    phantom:  { bg: '#13111c', fg: '#e2e0ea', accent: '#a78bfa', muted: '#9390a3', card: '#1a1730', danger: '#fb7185' },
  };
  return colors[name];
}
