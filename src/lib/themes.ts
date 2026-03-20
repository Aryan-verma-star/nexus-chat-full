export const themes: Record<string, Record<string, string>> = {
  cyber: {
    '--bg-primary': '#0a0a0f',
    '--bg-secondary': '#12121a',
    '--bg-tertiary': '#1a1a2e',
    '--accent-primary': '#00ff88',
    '--accent-secondary': '#0ea5e9',
    '--accent-tertiary': '#8b5cf6',
    '--text-primary': '#e0e0e0',
    '--text-secondary': '#888899',
    '--danger': '#ff3366',
    '--border-glow': 'rgba(0, 255, 136, 0.1)',
  },
  midnight: {
    '--bg-primary': '#0d1117',
    '--bg-secondary': '#161b22',
    '--bg-tertiary': '#21262d',
    '--accent-primary': '#58a6ff',
    '--accent-secondary': '#3fb950',
    '--accent-tertiary': '#bc8cff',
    '--text-primary': '#c9d1d9',
    '--text-secondary': '#8b949e',
    '--danger': '#f85149',
    '--border-glow': 'rgba(88, 166, 255, 0.1)',
  },
  phantom: {
    '--bg-primary': '#13111c',
    '--bg-secondary': '#1a1730',
    '--bg-tertiary': '#241f3d',
    '--accent-primary': '#a78bfa',
    '--accent-secondary': '#f472b6',
    '--accent-tertiary': '#67e8f9',
    '--text-primary': '#e2e0ea',
    '--text-secondary': '#9390a3',
    '--danger': '#fb7185',
    '--border-glow': 'rgba(167, 139, 250, 0.1)',
  },
};

export function applyThemeToDOM(themeName: string) {
  const t = themes[themeName];
  if (!t) return;
  Object.entries(t).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  document.body.style.backgroundColor = t['--bg-primary'];
  document.body.style.color = t['--text-primary'];
}

export function getSavedTheme(): string {
  try {
    const prefs = JSON.parse(localStorage.getItem('nexus_appearance_prefs') || '{}');
    return prefs.theme || 'cyber';
  } catch {
    return 'cyber';
  }
}

export function saveTheme(themeName: string) {
  try {
    const prefs = JSON.parse(localStorage.getItem('nexus_appearance_prefs') || '{}');
    prefs.theme = themeName;
    localStorage.setItem('nexus_appearance_prefs', JSON.stringify(prefs));
  } catch {}
}
