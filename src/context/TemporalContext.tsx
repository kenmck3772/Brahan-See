
import React, { createContext, useContext, useState, useCallback } from 'react';

interface TemporalContextType {
  year: number;
  setYear: (year: number) => void;
  quarter: number;
  setQuarter: (q: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

const TemporalContext = createContext<TemporalContextType | undefined>(undefined);

export const TemporalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [year, setYear] = useState(2024);
  const [quarter, setQuarter] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <TemporalContext.Provider value={{ year, setYear, quarter, setQuarter, isPlaying, setIsPlaying }}>
      {children}
    </TemporalContext.Provider>
  );
};

export const useTemporal = () => {
  const context = useContext(TemporalContext);
  if (context === undefined) {
    throw new Error('useTemporal must be used within a TemporalProvider');
  }
  return context;
};
