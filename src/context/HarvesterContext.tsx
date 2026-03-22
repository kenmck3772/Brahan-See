
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface HarvesterData {
  uwi: string;
  source: string;
  payload: any;
  timestamp: string;
  forensicNotary: string;
}

interface HarvesterContextType {
  lastIngress: HarvesterData | null;
  ingressHistory: HarvesterData[];
  isConnected: boolean;
  clearHistory: () => void;
}

const HarvesterContext = createContext<HarvesterContextType | undefined>(undefined);

export const HarvesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastIngress, setLastIngress] = useState<HarvesterData | null>(null);
  const [ingressHistory, setIngressHistory] = useState<HarvesterData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to the same host as the dashboard
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[WETE] Harvester Socket Connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[WETE] Harvester Socket Disconnected');
      setIsConnected(false);
    });

    newSocket.on('harvester:data', (data: HarvesterData) => {
      console.log('[WETE] Real-time Ingress Received:', data);
      setLastIngress(data);
      setIngressHistory(prev => [data, ...prev].slice(0, 50));
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const clearHistory = useCallback(() => {
    setIngressHistory([]);
    setLastIngress(null);
  }, []);

  return (
    <HarvesterContext.Provider value={{ lastIngress, ingressHistory, isConnected, clearHistory }}>
      {children}
    </HarvesterContext.Provider>
  );
};

export const useHarvester = () => {
  const context = useContext(HarvesterContext);
  if (context === undefined) {
    throw new Error('useHarvester must be used within a HarvesterProvider');
  }
  return context;
};
