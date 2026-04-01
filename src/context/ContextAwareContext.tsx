
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type WorkflowType = 'IDLE' | 'FORENSIC_AUDIT' | 'DATA_INGESTION' | 'SYSTEM_MAINTENANCE' | 'THREAT_HUNTING';

export interface Suggestion {
  id: string;
  label: string;
  action: () => void;
  description: string;
  icon?: string;
}

interface ContextAwareState {
  lastCommand: string | null;
  activeModules: string[];
  lastFileOperation: { type: string; path: string } | null;
  workflow: WorkflowType;
  suggestions: Suggestion[];
  logCommand: (cmd: string) => void;
  logFileOperation: (type: string, path: string) => void;
  setActiveModules: (modules: string[]) => void;
}

const ContextAwareContext = createContext<ContextAwareState | undefined>(undefined);

export const ContextAwareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [activeModules, setActiveModulesState] = useState<string[]>([]);
  const [lastFileOperation, setLastFileOperation] = useState<{ type: string; path: string } | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowType>('IDLE');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const logCommand = useCallback((cmd: string) => {
    setLastCommand(cmd);
  }, []);

  const logFileOperation = useCallback((type: string, path: string) => {
    setLastFileOperation({ type, path });
  }, []);

  const setActiveModules = useCallback((modules: string[]) => {
    setActiveModulesState(modules);
  }, []);

  // Inference logic
  useEffect(() => {
    let newWorkflow: WorkflowType = 'IDLE';

    if (activeModules.includes('forensicDeltaMap') || activeModules.includes('weteForensicScanner')) {
      newWorkflow = 'FORENSIC_AUDIT';
    } else if (activeModules.includes('ghostSync') || activeModules.includes('ndrModernization')) {
      newWorkflow = 'DATA_INGESTION';
    } else if (activeModules.includes('cerberusSimulator') || activeModules.includes('vault')) {
      newWorkflow = 'SYSTEM_MAINTENANCE';
    } else if (activeModules.includes('missionControl') || activeModules.includes('pulseAnalyzer')) {
      newWorkflow = 'THREAT_HUNTING';
    }

    setWorkflow(newWorkflow);
  }, [activeModules]);

  // Suggestion generation
  useEffect(() => {
    const newSuggestions: Suggestion[] = [];

    if (workflow === 'FORENSIC_AUDIT') {
      newSuggestions.push({
        id: 'open-scanner',
        label: 'Open WETE Scanner',
        description: 'Analyze fact science reconciliation for the current asset.',
        action: () => window.dispatchEvent(new CustomEvent('OPEN_MODULE', { detail: 'weteForensicScanner' }))
      });
      newSuggestions.push({
        id: 'view-delta',
        label: 'View Production Delta',
        description: 'Compare reported vs audited production data.',
        action: () => window.dispatchEvent(new CustomEvent('OPEN_MODULE', { detail: 'forensicDeltaSummary' }))
      });
    } else if (workflow === 'DATA_INGESTION') {
      newSuggestions.push({
        id: 'sync-ghosts',
        label: 'Sync Ghost Data',
        description: 'Correlate legacy data ghosts with modern records.',
        action: () => window.dispatchEvent(new CustomEvent('OPEN_MODULE', { detail: 'ghostSync' }))
      });
    } else if (workflow === 'THREAT_HUNTING') {
      newSuggestions.push({
        id: 'analyze-pulse',
        label: 'Analyze Pressure Pulse',
        description: 'Scan for sawtooth pressure anomalies.',
        action: () => window.dispatchEvent(new CustomEvent('OPEN_MODULE', { detail: 'pulseAnalyzer' }))
      });
    }

    if (lastCommand?.startsWith('ls')) {
      newSuggestions.push({
        id: 'cat-readme',
        label: 'Read README.md',
        description: 'Quickly view the documentation in the current directory.',
        action: () => window.dispatchEvent(new CustomEvent('TERMINAL_COMMAND', { detail: 'cat README.md' }))
      });
    }

    setSuggestions(newSuggestions);
  }, [workflow, lastCommand]);

  return (
    <ContextAwareContext.Provider value={{
      lastCommand,
      activeModules,
      lastFileOperation,
      workflow,
      suggestions,
      logCommand,
      logFileOperation,
      setActiveModules
    }}>
      {children}
    </ContextAwareContext.Provider>
  );
};

export const useContextAware = () => {
  const context = useContext(ContextAwareContext);
  if (context === undefined) {
    throw new Error('useContextAware must be used within a ContextAwareProvider');
  }
  return context;
};
