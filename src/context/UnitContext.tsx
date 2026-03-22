
import React, { createContext, useContext, useState, useCallback } from 'react';

export type DepthUnit = 'METERS' | 'FEET';

interface UnitContextType {
  unit: DepthUnit;
  setUnit: (unit: DepthUnit) => void;
  toggleUnit: () => void;
  convertToDisplay: (meters: number) => number;
  convertFromDisplay: (displayVal: number) => number;
  unitLabel: string;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export const UnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unit, setUnitState] = useState<DepthUnit>(() => {
    const saved = localStorage.getItem('WELLTEGRA_UNIT_PREFERENCE');
    return (saved === 'METERS' || saved === 'FEET') ? saved : 'METERS';
  });

  const setUnit = useCallback((newUnit: DepthUnit) => {
    setUnitState(newUnit);
    localStorage.setItem('WELLTEGRA_UNIT_PREFERENCE', newUnit);
  }, []);

  const toggleUnit = useCallback(() => {
    setUnitState(prev => {
      const next = prev === 'METERS' ? 'FEET' : 'METERS';
      localStorage.setItem('WELLTEGRA_UNIT_PREFERENCE', next);
      return next;
    });
  }, []);

  const convertToDisplay = useCallback((meters: number) => {
    if (unit === 'FEET') {
      return meters * 3.28084;
    }
    return meters;
  }, [unit]);

  const convertFromDisplay = useCallback((displayVal: number) => {
    if (unit === 'FEET') {
      return displayVal / 3.28084;
    }
    return displayVal;
  }, [unit]);

  const unitLabel = unit === 'METERS' ? 'm' : 'ft';

  return (
    <UnitContext.Provider value={{ unit, setUnit, toggleUnit, convertToDisplay, convertFromDisplay, unitLabel }}>
      {children}
    </UnitContext.Provider>
  );
};

export const useUnit = () => {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
};
