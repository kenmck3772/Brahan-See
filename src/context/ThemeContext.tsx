
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'FORENSIC' | 'CLEAN' | 'HIGH_CONTRAST' | 'TECHNICAL';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('brahan_theme');
    return (saved as ThemeType) || 'FORENSIC';
  });

  useEffect(() => {
    localStorage.setItem('brahan_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // Toggle CRT overlay visibility based on theme
    const crtOverlay = document.getElementById('crt-overlay');
    if (crtOverlay) {
      if (theme === 'FORENSIC' || theme === 'TECHNICAL') {
        crtOverlay.style.display = 'block';
      } else {
        crtOverlay.style.display = 'none';
      }
    }

    // Update body background and color
    if (theme === 'CLEAN') {
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#1e293b';
    } else if (theme === 'HIGH_CONTRAST') {
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#ffffff';
    } else if (theme === 'TECHNICAL') {
      document.body.style.backgroundColor = '#18181b';
      document.body.style.color = '#d4d4d8';
    } else {
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#94a3b8';
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
