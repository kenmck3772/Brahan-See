
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Binary, Ghost, Loader2, Zap, 
  Play, RotateCw, CheckCircle2, 
  AlertTriangle, Activity, ScanLine, Target, 
  Globe2, Send, ShieldAlert, AlertOctagon, Search,
  Eye, Filter, Lock, Unlock, ShieldX, ShieldCheck,
  Link, Info, X, Calendar, SlidersHorizontal,
  Fingerprint, Clock, FileText, Database,
  Download, Trash2, RefreshCw
} from 'lucide-react';
import { MOCK_BASE_LOG, MOCK_GHOST_LOG } from '../constants';
import { TraumaEvent } from '../types';
import SyncMonitorChart from './SyncMonitorChart';
import ProvenanceTooltip from './ProvenanceTooltip';
import { useUnit } from '../src/context/UnitContext';
import { useHarvester } from '../src/context/HarvesterContext';
import { useTheme } from '../src/context/ThemeContext';

export interface SignalMetadata {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface SyncAnomaly {
  id: string;
  startDepth: number;
  endDepth: number;
  avgDiff: number;
  severity: 'CRITICAL' | 'WARNING';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  detectedAt: string;
  description: string;
  truthLevel: 'PUBLIC' | 'FORENSIC' | 'HYBRID';
  provenance: string;
  physicsValidation: string;
}

const OFFSET_SAFE_LIMIT = 10;
const OFFSET_HARD_LIMIT = 20;
const AUTO_SYNC_TARGET = 14.5;
const METERS_TO_FEET = 3.28084;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface CasingIntegrityIssue {
  id: string;
  depth: number;
  type: 'CORROSION' | 'DEFORMATION' | 'ANNULUS_LEAK' | 'THINNING';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  value: number;
  unit: string;
  description: string;
  timestamp: string;
  provenance: string;
}

interface GhostSyncProps {
  wellId?: string | null;
}

const GhostSync: React.FC<GhostSyncProps> = ({ wellId }) => {
  const { unit, setUnit, convertToDisplay, convertFromDisplay, unitLabel } = useUnit();
  const { lastIngress } = useHarvester();
  const { theme } = useTheme();
  const [offset, setOffset] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [viewMode, setViewMode] = useState<'OVERLAY' | 'DIFFERENTIAL'>('OVERLAY');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  
  // Remote Data Fetching State
  const [showFetchInput, setShowFetchInput] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [showConfirmFetch, setShowConfirmFetch] = useState(false);

  // Anomaly Detection State
  const [anomalyThreshold, setAnomalyThreshold] = useState(25);
  const [isScanningAnomalies, setIsScanningAnomalies] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedAnomalies, setDetectedAnomalies] = useState<SyncAnomaly[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<SyncAnomaly | null>(null);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS'>('ALL');
  const [isDetectingShift, setIsDetectingShift] = useState(false);
  const [bestShift, setBestShift] = useState<number | null>(null);
  const [isAnomalyPanelOpen, setIsAnomalyPanelOpen] = useState(true);
  const [casingIssues, setCasingIssues] = useState<CasingIntegrityIssue[]>([]);
  const [isCheckingCasing, setIsCheckingCasing] = useState(false);
  const [casingCheckProgress, setCasingCheckProgress] = useState(0);
  const [selectedCasingIssue, setSelectedCasingIssue] = useState<CasingIntegrityIssue | null>(null);
  const [selectedSourceType, setSelectedSourceType] = useState<'ALL' | 'BASE_LOG' | 'GHOST_LOG' | 'REMOTE_LOGS'>(() => {
    const saved = localStorage.getItem('ghost_sync_source_type');
    return (saved as 'ALL' | 'BASE_LOG' | 'GHOST_LOG' | 'REMOTE_LOGS') || 'ALL';
  });
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<TraumaEvent[]>([]);
  const [logSeverityFilter, setLogSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');
  const [logStartDate, setLogStartDate] = useState<string>('');
  const [logEndDate, setLogEndDate] = useState<string>('');
  const logEndRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSeverity = logSeverityFilter === 'ALL' || log.severity === logSeverityFilter;
      const logDate = new Date(log.timestamp);
      
      // Handle date filtering with UTC alignment
      let matchesStartDate = true;
      if (logStartDate) {
        const start = new Date(logStartDate);
        start.setUTCHours(0, 0, 0, 0);
        matchesStartDate = logDate >= start;
      }
      
      let matchesEndDate = true;
      if (logEndDate) {
        const end = new Date(logEndDate);
        end.setUTCHours(23, 59, 59, 999);
        matchesEndDate = logDate <= end;
      }
      
      return matchesSeverity && matchesStartDate && matchesEndDate;
    });
  }, [logs, logSeverityFilter, logStartDate, logEndDate]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist selectedSourceType to localStorage
  useEffect(() => {
    localStorage.setItem('ghost_sync_source_type', selectedSourceType);
  }, [selectedSourceType]);

  const refreshLogs = useCallback(() => {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('BRAHAN_BLACK_BOX_LOGS') || '[]');
      setLogs(storedLogs);
    } catch (e) {
      console.error('Failed to load logs', e);
    }
  }, []);

  // Real-time log listeners
  useEffect(() => {
    window.addEventListener('BRAHAN_LOGS_UPDATED', refreshLogs);
    window.addEventListener('storage', (e) => {
      if (e.key === 'BRAHAN_BLACK_BOX_LOGS' || !e.key) refreshLogs();
    });
    
    if (showLogs) refreshLogs();
    
    return () => {
      window.removeEventListener('BRAHAN_LOGS_UPDATED', refreshLogs);
      window.removeEventListener('storage', refreshLogs);
    };
  }, [refreshLogs, showLogs]);

  const logToBlackBox = useCallback((description: string, severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO', depth: number = 0, value: number = 0, unit: string = 'N/A') => {
    try {
      const existingLogsStr = localStorage.getItem('BRAHAN_BLACK_BOX_LOGS');
      const existingLogs: TraumaEvent[] = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      
      const newEvent: TraumaEvent = {
        id: `TRX_${Math.random().toString(36).substring(7).toUpperCase()}_GHOST`,
        timestamp: new Date().toISOString(),
        layer: 'GHOST_SYNC',
        depth,
        value,
        unit,
        severity,
        description: `[${wellId || 'UNKNOWN_WELL'}] ${description}`
      };

      const updatedLogs = [newEvent, ...existingLogs].slice(0, 100);
      localStorage.setItem('BRAHAN_BLACK_BOX_LOGS', JSON.stringify(updatedLogs));
      
      // Dispatch events for real-time updates across components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('BRAHAN_LOGS_UPDATED'));
    } catch (e) {
      console.error('Failed to log to black box:', e);
    }
  }, [wellId]);

  const logEvent = useCallback((event: string, severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO', metadata?: any) => {
    // We still keep a local trace for GhostSync specific debugging if needed
    const newLog = {
      id: `LOG-${Math.random().toString(36).substring(7).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      event,
      severity,
      metadata
    };
    
    try {
      const existingLogs = JSON.parse(localStorage.getItem('ghost_sync_logs') || '[]');
      const updatedLogs = [newLog, ...existingLogs].slice(0, 50); // Keep fewer local logs
      localStorage.setItem('ghost_sync_logs', JSON.stringify(updatedLogs));
      
      // Also log to the global Forensic Black Box (System Logs)
      logToBlackBox(`${event}${metadata ? ' ' + JSON.stringify(metadata) : ''}`, severity);
    } catch (e) {
      console.error('Failed to save log to localStorage', e);
    }
  }, [logToBlackBox]);

  // Effect to handle real-time Harvester data
  useEffect(() => {
    if (lastIngress) {
      logEvent('Harvester_Ingress_Received', 'INFO', { uwi: lastIngress.uwi, source: lastIngress.source });
      const newSignalId = `SIG-HARVEST-${lastIngress.uwi}-${Date.now()}`;
      const newSignalName = `HARVESTER_${lastIngress.uwi}`;
      
      // If payload is an array of log entries, use it. Otherwise generate mock.
      const mockData: Record<number, number> = {};
      if (Array.isArray(lastIngress.payload)) {
        lastIngress.payload.forEach((entry: any) => {
          if (entry.depth !== undefined && entry.value !== undefined) {
            mockData[entry.depth] = entry.value;
          }
        });
      } else {
        for (let i = 0; i <= 1000; i += 10) {
          mockData[i] = 50 + Math.random() * 10 + Math.sin(i / 50) * 8;
        }
      }

      setRemoteLogs(prev => ({
        ...prev,
        [newSignalId]: mockData
      }));

      setSignals(prev => [
        ...prev,
        { id: newSignalId, name: newSignalName, color: '#F43F5E', visible: true }
      ]);
    }
  }, [lastIngress]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 1. Validation for supported file formats (.las, .csv, .txt)
    const allowedExtensions = ['.las', '.csv', '.txt'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
      const extension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
      setFileError(`UNSUPPORTED_FILE_TYPE: .${extension}`);
      logEvent('Local_File_Upload_Failed', 'WARNING', { fileName: file.name, error: 'Unsupported file type' });
      setTimeout(() => setFileError(null), 5000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validation for file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`FILE_TOO_LARGE: MAX ${MAX_FILE_SIZE_MB}MB EXCEEDED`);
      logEvent('Local_File_Upload_Failed', 'WARNING', { fileName: file.name, fileSize: file.size, error: 'File size limit exceeded' });
      setTimeout(() => setFileError(null), 5000);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileError(null); // Clear previous errors
    setIsFetching(true);
    
    const reader = new FileReader();

    reader.onerror = () => {
      setFileError('FILE_READ_ERROR: FAILED_TO_ACCESS_BUFFER');
      logEvent('Local_File_Upload_Failed', 'CRITICAL', { fileName: file.name, error: 'FileReader error' });
      setIsFetching(false);
      setTimeout(() => setFileError(null), 5000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onabort = () => {
      setFileError('FILE_READ_ABORTED: OPERATION_CANCELLED');
      logEvent('Local_File_Upload_Failed', 'WARNING', { fileName: file.name, error: 'FileReader aborted' });
      setIsFetching(false);
      setTimeout(() => setFileError(null), 5000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onload = (e) => {
      logEvent('Local_File_Upload_Initiated', 'INFO', { fileName: file.name, fileSize: file.size });
      // In a real app, we would parse the LAS/CSV content here
      // For this forensic terminal, we simulate the 'X-ray' extraction
      setTimeout(() => {
        const newSignalId = `SIG-LOCAL-${Math.random().toString(36).substr(2, 9)}`;
        const newSignalName = file.name.toUpperCase().replace(/\s+/g, '_');
        
        // Generate forensic-anchored mock data from the "X-rayed" file
        const mockData: Record<number, number> = {};
        for (let i = 0; i <= 1000; i += 10) {
          mockData[i] = 45 + Math.random() * 15 + Math.cos(i / 60) * 12;
        }

        setRemoteLogs(prev => ({
          ...prev,
          [newSignalId]: mockData
        }));

        setSignals(prev => [
          ...prev,
          { id: newSignalId, name: newSignalName, color: '#A855F7', visible: true }
        ]);

        setIsFetching(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        logEvent('Local_File_Upload_Completed', 'INFO', { fileName: file.name, signalId: newSignalId });
      }, 1500);
    };

    try {
      reader.readAsText(file);
    } catch (err) {
      setFileError('FILE_READ_EXCEPTION: UNEXPECTED_FAULT');
      logEvent('Local_File_Upload_Failed', 'CRITICAL', { fileName: file.name, error: err instanceof Error ? err.message : 'Unknown exception' });
      setIsFetching(false);
      setTimeout(() => setFileError(null), 5000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [signals, setSignals] = useState<SignalMetadata[]>(() => {
    const saved = localStorage.getItem('ghost_sync_signals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved signals', e);
      }
    }
    return [
      { id: 'SIG-001', name: 'BASE_LOG', color: 'var(--emerald-primary)', visible: true },
      { id: 'SIG-002', name: 'GHOST_LOG', color: '#FF5F1F', visible: true }
    ];
  });

  const [remoteLogs, setRemoteLogs] = useState<Record<string, Record<number, number>>>(() => {
    const saved = localStorage.getItem('ghost_sync_remote_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved remote logs', e);
      }
    }
    return {};
  });

  // Persist signals and remoteLogs to localStorage
  useEffect(() => {
    localStorage.setItem('ghost_sync_signals', JSON.stringify(signals));
  }, [signals]);

  useEffect(() => {
    localStorage.setItem('ghost_sync_remote_logs', JSON.stringify(remoteLogs));
  }, [remoteLogs]);

  const filteredAnomalies = useMemo(() => {
    return detectedAnomalies.filter(a => {
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (dateFilter !== 'ALL') {
        const anomalyDate = new Date(a.detectedAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - anomalyDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        if (dateFilter === 'LAST_7_DAYS' && diffDays > 7) return false;
        if (dateFilter === 'LAST_30_DAYS' && diffDays > 30) return false;
      }
      return true;
    });
  }, [detectedAnomalies, severityFilter, dateFilter]);

  const anomalyTheme = useMemo(() => {
    if (!selectedAnomaly) return null;
    
    const { severity, priority, truthLevel } = selectedAnomaly;

    // Severity defines the "Alert" feel (Border, Glow, Header)
    const severityMap = {
      CRITICAL: {
        border: 'border-red-500/50',
        glow: 'shadow-[0_0_40px_rgba(239,68,68,0.2)]',
        header: 'bg-red-950/40',
        text: 'text-red-400',
        accent: 'bg-red-500',
        shadow: 'shadow-[0_0_8px_rgba(239,68,68,0.5)]',
        icon: <ShieldAlert size={18} className="animate-pulse" />
      },
      WARNING: {
        border: 'border-orange-500/40',
        glow: 'shadow-[0_0_30px_rgba(249,115,22,0.15)]',
        header: 'bg-orange-950/20',
        text: 'text-orange-400',
        accent: 'bg-orange-500',
        shadow: 'shadow-[0_0_8px_rgba(249,115,22,0.5)]',
        icon: <AlertTriangle size={18} />
      }
    };

    // Truth Level defines the "Source" feel (Background Tint)
    const truthMap = {
      FORENSIC: {
        bg: 'bg-emerald-500/5',
        pattern: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
        text: 'text-emerald-400',
        icon: 'text-emerald-400',
        cardHover: 'hover:border-emerald-500/40',
        label: 'FORENSIC_TRUTH'
      },
      PUBLIC: {
        bg: 'bg-cyan-500/5',
        pattern: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.05) 0%, transparent 70%)',
        text: 'text-cyan-400',
        icon: 'text-cyan-400',
        cardHover: 'hover:border-cyan-500/40',
        label: 'PUBLIC_OPERATOR'
      },
      HYBRID: {
        bg: 'bg-indigo-500/5',
        pattern: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
        text: 'text-indigo-400',
        icon: 'text-indigo-400',
        cardHover: 'hover:border-indigo-500/40',
        label: 'HYBRID_CONSENSUS'
      }
    };

    // Priority defines the "Urgency" feel (Icon styling)
    const priorityMap = {
      HIGH: {
        iconBg: 'bg-red-500/20',
        iconText: 'text-red-400',
        shadow: 'shadow-red-500/20',
        badge: 'bg-red-500/20 text-red-400 border-red-500/50'
      },
      MEDIUM: {
        iconBg: 'bg-orange-500/20',
        iconText: 'text-orange-400',
        shadow: 'shadow-orange-500/20',
        badge: 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      },
      LOW: {
        iconBg: 'bg-blue-500/20',
        iconText: 'text-blue-400',
        shadow: 'shadow-blue-500/20',
        badge: 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      }
    };

    const s = severityMap[severity as keyof typeof severityMap] || severityMap.WARNING;
    const t = truthMap[truthLevel as keyof typeof truthMap] || truthMap.HYBRID;
    const p = priorityMap[priority as keyof typeof priorityMap] || priorityMap.LOW;

    return {
      border: s.border,
      bg: t.bg,
      pattern: t.pattern,
      headerBg: s.header,
      glow: s.glow,
      iconBg: p.iconBg,
      iconText: p.iconText,
      shadow: p.shadow,
      priorityBadge: p.badge,
      truthText: t.text,
      truthIcon: t.icon,
      truthLabel: t.label,
      severityText: s.text,
      severityAccent: s.accent,
      severityShadow: s.shadow,
      severityIcon: s.icon,
      cardHover: t.cardHover
    };
  }, [selectedAnomaly]);

  const filteredSignals = useMemo(() => {
    if (selectedSourceType === 'ALL') return signals;
    return signals.filter(sig => {
      if (selectedSourceType === 'BASE_LOG') return sig.id === 'SIG-001';
      if (selectedSourceType === 'GHOST_LOG') return sig.id === 'SIG-002';
      if (selectedSourceType === 'REMOTE_LOGS') return sig.id.startsWith('SIG-REMOTE-');
      return true;
    });
  }, [signals, selectedSourceType]);

  const combinedData = useMemo(() => {
    return MOCK_BASE_LOG.map((base) => {
      const ghost = MOCK_GHOST_LOG.find(g => Math.abs(g.depth - (base.depth + offset)) < 0.1);
      const row: any = {
        depth: base.depth,
        baseGR: base.gr,
        ghostGR: ghost ? ghost.gr : null,
        diff: ghost ? Math.abs(base.gr - ghost.gr) : 0
      };
      // Inject remote logs
      Object.keys(remoteLogs).forEach(sigId => {
        if (remoteLogs[sigId][base.depth] !== undefined) {
          row[sigId] = remoteLogs[sigId][base.depth];
        }
      });
      return row;
    });
  }, [offset, remoteLogs]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleOffsetChange = (val: number) => {
    if (typeof val !== 'number' || isNaN(val)) return;

    let newVal = val;
    let error: string | null = null;

    if (Math.abs(newVal) >= OFFSET_HARD_LIMIT) {
      newVal = Math.sign(newVal) * OFFSET_HARD_LIMIT;
      const limitDisplay = convertToDisplay(OFFSET_HARD_LIMIT).toFixed(1);
      const unitLabel = unit === 'FEET' ? 'FT' : 'M';
      error = `CRITICAL VETO: MAX LIMIT ±${limitDisplay}${unitLabel} REACHED`;
      triggerShake();
    } else if (Math.abs(newVal) > OFFSET_SAFE_LIMIT) {
      error = `WARNING: EXTREME SHIFT ENVELOPE ACTIVATED`;
    }

    setOffset(newVal);
    setValidationError(error);

    if (error) {
      logEvent('Manual_Veto_Active', Math.abs(newVal) >= OFFSET_HARD_LIMIT ? 'CRITICAL' : 'WARNING', { 
        offset: newVal.toFixed(3), 
        error 
      });
    }
  };

  const handleToggleSignal = useCallback((keyOrId: string) => {
    // Map Recharts dataKey back to internal Signal ID
    let targetId = keyOrId;
    if (keyOrId === 'baseGR') targetId = 'SIG-001';
    if (keyOrId === 'ghostGR') targetId = 'SIG-002';

    setSignals(prev => {
      const updated = prev.map(s => s.id === targetId ? { ...s, visible: !s.visible } : s);
      const target = updated.find(s => s.id === targetId);
      if (target) {
        logEvent('Signal_Visibility_Toggled', 'INFO', { signalId: targetId, visible: target.visible });
      }
      return updated;
    });
  }, [logEvent]);

  const animateSync = useCallback(() => {
    if (isSyncing) return;
    logEvent('Auto_Sync_Protocol_Initiated', 'INFO', { startOffset: offset.toFixed(3), target: AUTO_SYNC_TARGET });
    setIsSyncing(true);
    setIsAdjusting(true);
    setValidationError(null);
    const startOffset = offset;
    const startTime = performance.now();
    const duration = 2000;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentOffset = startOffset + (AUTO_SYNC_TARGET - startOffset) * easeProgress;
      setOffset(currentOffset);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setOffset(AUTO_SYNC_TARGET);
        setIsSyncing(false);
        setIsAdjusting(false);
        logEvent('Auto_Sync_Protocol_Completed', 'INFO', { finalOffset: AUTO_SYNC_TARGET });
      }
    };
    requestAnimationFrame(step);
  }, [offset, isSyncing, logEvent]);

  const autoLineup = useCallback(() => {
    setIsSyncing(true);
    setIsAdjusting(true);
    setValidationError(null);
    setTimeout(() => {
      setOffset(AUTO_SYNC_TARGET);
      setIsSyncing(false);
      setIsAdjusting(false);
    }, 1500);
  }, []);

  const runAnomalyScan = useCallback(() => {
    logEvent('Anomaly_Scan_Initiated', 'INFO', { threshold: anomalyThreshold });
    setIsScanningAnomalies(true);
    setDetectedAnomalies([]);
    setSelectedAnomaly(null);
    setScanProgress(0);

    const totalRows = combinedData.length;
    if (totalRows === 0) {
      setIsScanningAnomalies(false);
      return;
    }

    const anomalies: SyncAnomaly[] = [];
    let currentAnomaly: { start: number, sum: number, count: number } | null = null;
    let currentIndex = 0;
    const chunkSize = Math.max(1, Math.floor(totalRows / 50)); // More chunks for smoother progress

    const processChunk = () => {
      const end = Math.min(currentIndex + chunkSize, totalRows);
      
      for (let i = currentIndex; i < end; i++) {
        const row = combinedData[i];
        if (row.ghostGR !== null && row.diff > anomalyThreshold) {
          if (!currentAnomaly) {
            currentAnomaly = { start: row.depth, sum: row.diff, count: 1 };
          } else {
            currentAnomaly.sum += row.diff;
            currentAnomaly.count += 1;
          }
        } else if (currentAnomaly) {
          const avgDiff = currentAnomaly.sum / currentAnomaly.count;
          const severity = avgDiff > anomalyThreshold * 1.5 ? 'CRITICAL' : 'WARNING';
          const randomDaysAgo = Math.floor(Math.random() * 30);
          const date = new Date();
          date.setDate(date.getDate() - randomDaysAgo);
          anomalies.push({
            id: `ANOM-${Math.random().toString(36).substring(7).toUpperCase()}`,
            startDepth: currentAnomaly.start,
            endDepth: combinedData[i - 1].depth,
            avgDiff,
            severity,
            priority: severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
            detectedAt: date.toISOString().split('T')[0],
            description: severity === 'CRITICAL' ? 'Severe deviation detected between base and ghost logs. Possible structural anomaly or data corruption.' : 'Moderate deviation detected. Requires manual review.',
            truthLevel: severity === 'CRITICAL' ? 'FORENSIC' : 'HYBRID',
            provenance: 'WellTegra Forensic Harvester v1.2',
            physicsValidation: 'Mass-Energy Balance Verified'
          });
          currentAnomaly = null;
        }
      }

      currentIndex = end;
      const progress = Math.floor((currentIndex / totalRows) * 100);
      setScanProgress(progress);

      if (currentIndex < totalRows) {
        requestAnimationFrame(processChunk);
      } else {
        // Finalize
        if (currentAnomaly) {
          const avgDiff = currentAnomaly.sum / currentAnomaly.count;
          const severity = avgDiff > anomalyThreshold * 1.5 ? 'CRITICAL' : 'WARNING';
          const randomDaysAgo = Math.floor(Math.random() * 30);
          const date = new Date();
          date.setDate(date.getDate() - randomDaysAgo);
          anomalies.push({
            id: `ANOM-${Math.random().toString(36).substring(7).toUpperCase()}`,
            startDepth: currentAnomaly.start,
            endDepth: combinedData[totalRows - 1].depth,
            avgDiff,
            severity,
            priority: severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
            detectedAt: date.toISOString().split('T')[0],
            description: severity === 'CRITICAL' ? 'Severe deviation detected between base and ghost logs. Possible structural anomaly or data corruption.' : 'Moderate deviation detected. Requires manual review.',
            truthLevel: severity === 'CRITICAL' ? 'FORENSIC' : 'HYBRID',
            provenance: 'WellTegra Forensic Harvester v1.2',
            physicsValidation: 'Mass-Energy Balance Verified'
          });
        }
        
        setDetectedAnomalies(anomalies);
        setIsScanningAnomalies(false);
        setTimeout(() => setScanProgress(0), 500);

        if (anomalies.length > 0) {
          const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
          logEvent('Anomaly_Scan_Completed', criticalCount > 0 ? 'CRITICAL' : 'WARNING', { 
            totalAnomalies: anomalies.length, 
            criticalCount 
          });
        } else {
          logEvent('Anomaly_Scan_Completed', 'INFO', { totalAnomalies: 0 });
        }

        if (anomalies.length > 0) {
          anomalies.forEach(anomaly => {
            const desc = `GhostSync discrepancy detected between ${convertToDisplay(anomaly.startDepth).toFixed(1)}${unitLabel} and ${convertToDisplay(anomaly.endDepth).toFixed(1)}${unitLabel}. Trace ID: ${anomaly.id}`;
            logToBlackBox(desc, anomaly.severity, Math.round((anomaly.startDepth + anomaly.endDepth) / 2), Number(anomaly.avgDiff.toFixed(2)), 'API');

            if (anomaly.severity === 'CRITICAL') {
              const traumaDesc = `Potential casing trauma detected due to severe datum shift anomaly between ${convertToDisplay(anomaly.startDepth).toFixed(1)}${unitLabel} and ${convertToDisplay(anomaly.endDepth).toFixed(1)}${unitLabel}. Delta: ${anomaly.avgDiff.toFixed(2)} API. Trace ID: ${anomaly.id}`;
              logToBlackBox(traumaDesc, 'CRITICAL', Math.round((anomaly.startDepth + anomaly.endDepth) / 2), Number(anomaly.avgDiff.toFixed(2)), 'API');
            }
          });
        }
      }
    };

    requestAnimationFrame(processChunk);
  }, [combinedData, anomalyThreshold]);

  const updateAnomalyPriority = (id: string, priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    setDetectedAnomalies(prev => prev.map(a => a.id === id ? { ...a, priority } : a));
    if (selectedAnomaly?.id === id) {
      setSelectedAnomaly(prev => prev ? { ...prev, priority } : null);
    }
  };

  const runCasingIntegrityCheck = useCallback(() => {
    setIsCheckingCasing(true);
    setCasingCheckProgress(0);
    logEvent('Casing_Integrity_Scan_Initiated', 'INFO');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setCasingCheckProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        const newIssues: CasingIntegrityIssue[] = [
          {
            id: `CAS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            depth: 450.5,
            type: 'CORROSION',
            severity: 'CRITICAL',
            value: 12.4,
            unit: 'mm',
            description: 'Severe localized wall thinning detected in outer casing string. Physics audit suggests potential breakthrough within 6 months.',
            timestamp: new Date().toISOString(),
            provenance: 'WellTegra Physics Engine v1.2'
          },
          {
            id: `CAS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            depth: 820.2,
            type: 'ANNULUS_LEAK',
            severity: 'WARNING',
            value: 45.2,
            unit: 'psi',
            description: 'Slight pressure anomaly detected in Annulus B, suggesting potential seal degradation at the packer interface.',
            timestamp: new Date().toISOString(),
            provenance: 'OPRED Public Records / Forensic Cross-Ref'
          },
          {
            id: `CAS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            depth: 1240.8,
            type: 'DEFORMATION',
            severity: 'INFO',
            value: 2.1,
            unit: '%',
            description: 'Minor ovality detected in production tubing. Within safe operating limits but requires monitoring.',
            timestamp: new Date().toISOString(),
            provenance: 'WellTegra Harvester / Forensic Audit'
          }
        ];
        setCasingIssues(newIssues);
        setIsCheckingCasing(false);
        logEvent('Casing_Integrity_Scan_Completed', 'WARNING', { issuesFound: newIssues.length });

        // Log to global black box
        newIssues.forEach(issue => {
          logToBlackBox(`${issue.type}: ${issue.description}`, issue.severity, issue.depth, issue.value, issue.unit);
        });
      }
    }, 100);
  }, [logEvent]);

  const detectDatumShift = () => {
    setIsDetectingShift(true);
    setTimeout(() => {
      // Simple cross-correlation simulation
      const simulatedBestShift = 14.5; 
      setBestShift(simulatedBestShift);
      setIsDetectingShift(false);
    }, 1500);
  };

  const handleFetchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUrl) return;
    setShowConfirmFetch(true);
  };

  const confirmFetch = () => {
    logEvent('Remote_Fetch_Initiated', 'INFO', { url: remoteUrl });
    setShowConfirmFetch(false);
    setIsFetching(true);
    
    // Simulated fetch and forensic validation logic
    setTimeout(() => {
      const fileName = remoteUrl.split('/').pop() || 'REMOTE_LOG';
      const newSigId = `SIG-REMOTE-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      // Generate a mock SHA-256 checksum for forensic integrity
      const mockChecksum = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      
      // Generate some mock matching data for the chart
      const newLogData: Record<number, number> = {};
      MOCK_BASE_LOG.forEach(base => {
        // Create slightly different but correlated data
        newLogData[base.depth] = base.gr + (Math.random() - 0.5) * 35;
      });

      setRemoteLogs(prev => ({ ...prev, [newSigId]: newLogData }));
      setSignals(prev => [
        ...prev, 
        { 
          id: newSigId, 
          name: fileName.toUpperCase().replace('.LAS', '').replace('.CSV', ''), 
          color: `hsl(${Math.random() * 360}, 70%, 50%)`, 
          visible: true 
        }
      ]);

      logEvent('Remote_Fetch_Completed', 'INFO', { 
        url: remoteUrl, 
        signalId: newSigId,
        checksum: mockChecksum,
        status: 'NOTARIZED'
      });

      setIsFetching(false);
      setShowFetchInput(false);
      setRemoteUrl('');
    }, 2200); // Slightly longer for "forensic validation"
  };

  const ghostLabel = isAdjusting ? "OFFSET_LOG" : "GHOST_LOG"; // Dynamically set the ghost label
  const isWarning = Math.abs(offset) > OFFSET_SAFE_LIMIT;
  const isCritical = Math.abs(offset) >= OFFSET_HARD_LIMIT;

  const offsetIntensity = isCritical 
    ? 'text-[var(--alert-red)]' 
    : isWarning 
      ? 'text-orange-500' 
      : 'text-[var(--emerald-primary)]';

  return (
    <div className={`flex flex-col h-full p-4 space-y-4 font-terminal relative overflow-hidden transition-all duration-500 ${
      theme === 'CLEAN' ? 'bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-sm' :
      theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-2 border-black rounded-none' :
      'bg-[var(--card-bg)] border-[var(--panel-border)] scanline-effect glass-panel cyber-border'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded transition-all shadow-lg border ${
            theme === 'CLEAN' ? 'bg-slate-100 border-slate-200' :
            theme === 'HIGH_CONTRAST' ? 'bg-white border-black' :
            `bg-[var(--emerald-primary)]/10 border-[var(--emerald-primary)]/30 shadow-[var(--accent-glow)] glass-panel ${isWarning ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : ''} ${isCritical ? 'border-[var(--alert-red)] shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}`
          }`}>
            {isCritical ? <ShieldX size={24} className="text-[var(--alert-red)] animate-pulse" /> : <Ghost size={24} className={`${isWarning ? 'text-orange-500' : 'text-[var(--emerald-primary)]'} ${isWarning ? 'warning-glow' : 'text-glow-emerald'}`} />}
          </div>
          <div>
            <h2 className={`text-xl font-black uppercase tracking-tighter transition-all duration-300 ${
              theme === 'CLEAN' ? 'text-slate-900' :
              theme === 'HIGH_CONTRAST' ? 'text-black' :
              `${isWarning ? 'text-orange-500 warning-glow' : 'text-[var(--emerald-primary)] text-glow-emerald'}`
            }`}>Ghost_Sync_Engine</h2>
            <div className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest">
              <ScanLine size={10} className={`animate-pulse ${isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/50'}`} />
              <span className={`${isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/50'} ${isWarning ? 'warning-glow' : 'text-glow-emerald'}`}>Datum_Correlation_Array</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowFetchInput(!showFetchInput)}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${showFetchInput ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-900/60 border-cyan-900/40 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/5'}`}
          >
            <Globe2 size={14} />
            <span>Fetch_Remote_Data</span>
          </button>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isFetching}
              className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${isFetching ? 'bg-purple-500/20 border-purple-500 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-slate-900/60 border-purple-900/40 text-purple-400 hover:border-purple-400 hover:bg-purple-500/5'}`}
            >
              {isFetching ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              <span>{isFetching ? 'Analyzing_File...' : 'Upload_Local_File'}</span>
            </button>
            {fileError && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded bg-red-500/10 border border-red-500/50 text-red-400 text-[8px] font-black uppercase tracking-widest animate-in slide-in-from-left-2">
                <AlertOctagon size={12} className="animate-pulse" />
                <span>{fileError}</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".las,.csv,.txt"
          />

          <div className="flex items-center gap-3 bg-slate-900/60 border border-orange-900/40 rounded px-3 py-1.5 glass-panel cyber-border">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-orange-500/50 uppercase tracking-widest">Anomaly_Threshold</span>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  step="1"
                  value={anomalyThreshold}
                  onChange={(e) => setAnomalyThreshold(Number(e.target.value))}
                  className="w-24 h-1 bg-orange-900/30 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <span className="text-[10px] font-terminal font-black text-orange-400 min-w-[24px]">{anomalyThreshold}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={runAnomalyScan}
            disabled={isScanningAnomalies || isSyncing}
            className={`relative overflow-hidden flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${isScanningAnomalies ? 'bg-orange-500/20 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-slate-900/60 border-orange-900/40 text-orange-400 hover:border-orange-400 hover:bg-orange-500/5'}`}
          >
            {isScanningAnomalies && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-orange-500/30 transition-all duration-100"
                style={{ width: `${scanProgress}%` }}
              />
            )}
            <div className="relative z-10 flex items-center space-x-2">
              {isScanningAnomalies ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>{isScanningAnomalies ? `Scanning... ${scanProgress}%` : 'Forensic_Scan'}</span>
            </div>
          </button>

          <button 
            onClick={() => {
              setShowLogs(!showLogs);
              if (!showLogs) refreshLogs();
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${showLogs ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'}`}
          >
            <Database size={14} />
            <span>System_Logs</span>
          </button>

          <button 
            onClick={() => setViewMode(prev => prev === 'OVERLAY' ? 'DIFFERENTIAL' : 'OVERLAY')}
            className={`px-4 py-2 border rounded text-[10px] font-black uppercase transition-all glass-panel hover:scale-105 active:scale-95 ${viewMode === 'DIFFERENTIAL' ? 'bg-orange-500 border-orange-400 text-slate-950 shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-slate-900/60 border-[var(--emerald-primary)]/20 text-[var(--emerald-primary)] hover:border-[var(--emerald-primary)]/50 hover:bg-[var(--emerald-primary)]/5'}`}
          >
            {viewMode}
          </button>

          <div className="flex items-center bg-slate-900/80 border border-[var(--emerald-primary)]/20 rounded px-2 py-1 glass-panel cyber-border">
            <span className="text-[8px] font-black text-[var(--emerald-primary)]/40 uppercase mr-2">Source:</span>
            <select 
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value as any)}
              className="bg-transparent text-[var(--emerald-primary)] text-[10px] font-black uppercase outline-none cursor-pointer hover:text-white transition-colors"
            >
              <option value="ALL" className="bg-slate-900">ALL_SOURCES</option>
              <option value="BASE_LOG" className="bg-slate-900">BASE_LOG</option>
              <option value="GHOST_LOG" className="bg-slate-900">GHOST_LOG</option>
              <option value="REMOTE_LOGS" className="bg-slate-900">REMOTE_LOGS</option>
            </select>
          </div>
          
          <button 
            onClick={autoLineup}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-6 py-2 bg-[var(--emerald-primary)] text-slate-950 rounded font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50 glass-panel hover:scale-105 active:scale-95 transition-all"
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
            <span>Auto_Lineup</span>
          </button>
        </div>
      </div>

      {/* Remote Data Fetch Input Form */}
      {showFetchInput && (
        <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300 shadow-2xl glass-panel cyber-border">
          <form onSubmit={handleFetchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-cyan-900">
                <Link size={14} />
              </div>
              <input 
                type="text" 
                placeholder="Enter URL for .LAS or .CSV log file (e.g., https://archive.well/thistle.las)"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-cyan-900/40 rounded px-10 py-2 text-[10px] text-cyan-100 outline-none focus:border-cyan-500 transition-all font-terminal glass-panel"
              />
            </div>
            <button 
              type="submit" 
              disabled={isFetching || !remoteUrl}
              className="w-full md:w-auto px-6 py-2 bg-cyan-600 text-slate-950 rounded font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] glass-panel"
            >
              {isFetching ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{isFetching ? 'Injecting_Signal...' : 'Submit_Fetch'}</span>
            </button>
          </form>
          <div className="mt-2 flex items-center space-x-3 text-[7px] text-cyan-800 uppercase font-black tracking-widest px-1">
            <Info size={10} className="text-cyan-700" />
            <span>Format Support: LAS 2.0/3.0, Tally CSV // Metadata Integrity Check Active</span>
          </div>
        </div>
      )}

        {showLogs && (
        <div className={`relative z-20 border rounded-xl p-4 animate-in fade-in slide-in-from-top-4 duration-300 transition-all duration-500 ${
          theme === 'CLEAN' ? 'bg-white border-slate-200 shadow-lg' :
          theme === 'HIGH_CONTRAST' ? 'bg-white border-black shadow-none' :
          'bg-slate-950/90 border-slate-800 glass-panel cyber-border'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center space-x-2">
              <Database size={16} className="text-emerald-500" />
              <h3 className={`text-xs font-black uppercase tracking-widest ${theme === 'CLEAN' ? 'text-slate-900' : 'text-white'}`}>System_Forensic_Audit_Trail</h3>
              <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                {filteredLogs.length} Events
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded border border-slate-800">
                {(['ALL', 'INFO', 'WARNING', 'CRITICAL'] as const).map(sev => (
                  <button
                    key={sev}
                    onClick={() => setLogSeverityFilter(sev)}
                    className={`px-2 py-0.5 rounded text-[7px] font-black uppercase transition-all ${
                      logSeverityFilter === sev 
                        ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center space-x-2 bg-slate-900/80 p-1 rounded border border-slate-800">
                <div className="flex items-center space-x-1">
                  <Calendar size={10} className="text-slate-600" />
                  <input 
                    type="date" 
                    value={logStartDate}
                    onChange={e => setLogStartDate(e.target.value)}
                    className="bg-transparent text-[8px] text-emerald-400 font-mono focus:outline-none w-20"
                  />
                </div>
                <span className="text-slate-700 text-[8px]">→</span>
                <div className="flex items-center space-x-1">
                  <input 
                    type="date" 
                    value={logEndDate}
                    onChange={e => setLogEndDate(e.target.value)}
                    className="bg-transparent text-[8px] text-emerald-400 font-mono focus:outline-none w-20"
                  />
                </div>
                {(logStartDate || logEndDate || logSeverityFilter !== 'ALL') && (
                  <button 
                    onClick={() => {
                      setLogStartDate('');
                      setLogEndDate('');
                      setLogSeverityFilter('ALL');
                    }}
                    className="ml-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Clear Filters"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button 
                  onClick={refreshLogs}
                  className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors bg-slate-900/50 rounded border border-slate-800"
                  title="Refresh Logs"
                >
                  <RefreshCw size={14} />
                </button>
                <button 
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `brahan_system_logs_${new Date().toISOString()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors bg-slate-900/50 rounded border border-slate-800"
                  title="Export Logs"
                >
                  <Download size={14} />
                </button>
                <button onClick={() => setShowLogs(false)} className="p-1.5 text-slate-500 hover:text-white transition-colors bg-slate-900/50 rounded border border-slate-800">
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 custom-scrollbar pr-2 font-terminal">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-700 border border-dashed border-slate-800 rounded bg-slate-950/20">
                <Database size={32} className="opacity-10 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">
                  {logs.length === 0 ? 'No forensic events recorded' : 'No logs match current filters'}
                </span>
              </div>
            ) : (
              <>
                {filteredLogs.map((log) => (
                  <div key={log.id} className="group relative flex flex-col p-3 bg-slate-900/30 border-l-2 border-slate-800 rounded hover:bg-slate-900/50 transition-all hover:border-emerald-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          log.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' :
                          log.severity === 'WARNING' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                          'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                        }`}></div>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                          log.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                          log.severity === 'WARNING' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' :
                          'bg-blue-500/10 border-blue-500/30 text-blue-500'
                        }`}>
                          {log.severity}
                        </span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{log.layer}</span>
                        {log.depth > 0 && (
                          <span className="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest">@ {convertToDisplay(log.depth).toFixed(1)}{unitLabel}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[8px] font-mono text-slate-600">{new Date(log.timestamp).toLocaleDateString()}</span>
                        <span className="text-[8px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-200 leading-relaxed">
                      {log.description}
                    </p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[6px] font-mono text-slate-700 uppercase">ID: {log.id}</span>
                    </div>
                  </div>
                ))}
                <div ref={logEndRef} />
              </>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-900">
            <div className="flex items-center space-x-2 text-[7px] text-slate-600 font-black uppercase tracking-widest">
              <Info size={10} />
              <span>Forensic Audit Trail // Immutable Source Verification Active</span>
            </div>
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to clear the entire system audit trail? This action is irreversible.')) {
                  localStorage.removeItem('BRAHAN_BLACK_BOX_LOGS');
                  localStorage.removeItem('ghost_sync_logs');
                  refreshLogs();
                }
              }}
              className="flex items-center space-x-1.5 text-[8px] font-black uppercase text-slate-600 hover:text-red-500 transition-colors group"
            >
              <Trash2 size={10} className="group-hover:animate-bounce" />
              <span>Purge_Audit_Trail</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          <SyncMonitorChart 
            combinedData={combinedData} 
            signals={filteredSignals} 
            viewMode={viewMode} 
            ghostLabel={ghostLabel} 
            validationError={validationError}
            offset={offset}
            unit={unit}
            unitLabel={unitLabel}
            convertToDisplay={convertToDisplay}
            anomalies={filteredAnomalies}
            onToggleSignal={handleToggleSignal}
            onAnomalyClick={setSelectedAnomaly}
            selectedAnomalyId={selectedAnomaly?.id}
          />

      {selectedAnomaly && (
        <div 
          className={`glass-panel rounded-lg border transition-all duration-500 overflow-hidden flex flex-col shadow-2xl ${anomalyTheme?.border} ${anomalyTheme?.bg} ${anomalyTheme?.glow} ${anomalyTheme?.shadow}`}
          style={{ backgroundImage: anomalyTheme?.pattern }}
        >
          <div 
            onClick={() => setIsAnomalyPanelOpen(!isAnomalyPanelOpen)}
            className={`flex items-center justify-between p-4 border-b border-slate-800/50 group cursor-pointer transition-colors duration-500 ${anomalyTheme?.headerBg || 'bg-slate-900/90'}`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg shadow-inner transition-all duration-500 ${anomalyTheme?.iconBg} ${anomalyTheme?.iconText} ${anomalyTheme?.shadow}`}>
                {anomalyTheme?.severityIcon}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-[12px] font-black uppercase tracking-widest text-white">Forensic_Anomaly_Report</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all duration-300 border ${anomalyTheme?.priorityBadge}`}>
                    {selectedAnomaly.priority}_PRIORITY
                  </span>
                  <div className="group/tooltip relative">
                    <Info size={10} className="text-slate-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-slate-800 rounded text-[8px] text-slate-400 invisible group-hover/tooltip:visible z-50 shadow-2xl">
                      <div className="font-black text-emerald-400 mb-1 uppercase tracking-widest">Provenance_Trace</div>
                      <div>Source: {selectedAnomaly.provenance}</div>
                      <div className="mt-1">Validated: {selectedAnomaly.physicsValidation}</div>
                      <div className="mt-1">Date: {selectedAnomaly.detectedAt}</div>
                    </div>
                  </div>
                </div>
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Trace_ID: {selectedAnomaly.id} // Truth_Level: {anomalyTheme?.truthLabel}</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                <span className={`text-[9px] font-black uppercase ${anomalyTheme?.severityText}`}>
                  {selectedAnomaly.severity === 'CRITICAL' ? 'CRITICAL_TRAUMA' : 'FORENSIC_DRIFT'}
                </span>
              </div>
              <div className="flex items-center space-x-3 border-l border-slate-800/50 pl-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsAnomalyPanelOpen(!isAnomalyPanelOpen); }}
                  className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors bg-slate-800/30 rounded"
                  title={isAnomalyPanelOpen ? "Collapse" : "Expand"}
                >
                  <SlidersHorizontal size={16} className={`transition-transform duration-500 ${isAnomalyPanelOpen ? 'rotate-180' : ''}`} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedAnomaly(null); }}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors bg-slate-800/30 rounded"
                  title="Close Report"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {isAnomalyPanelOpen && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme?.cardHover}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Anomaly_ID</span>
                  <Fingerprint size={10} className="text-emerald-500/50" />
                </div>
                <ProvenanceTooltip source={selectedAnomaly.provenance} validator={selectedAnomaly.physicsValidation} timestamp={selectedAnomaly.detectedAt}>
                  <span className="text-[12px] font-terminal text-emerald-400 font-bold tracking-wider">{selectedAnomaly.id}</span>
                </ProvenanceTooltip>
              </div>

              <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme?.cardHover}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Severity_Level</span>
                  <ShieldAlert size={10} className={`${anomalyTheme?.severityText} opacity-50`} />
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${anomalyTheme?.severityAccent} ${selectedAnomaly.severity === 'CRITICAL' ? 'animate-pulse' : ''} ${anomalyTheme?.severityShadow}`}></div>
                  <span className={`text-[12px] font-black uppercase ${anomalyTheme?.severityText}`}>
                    {selectedAnomaly.severity}
                  </span>
                </div>
              </div>

              <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme?.cardHover}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Depth_Locus</span>
                  <Target size={10} className="text-slate-500/50" />
                </div>
                <span className="text-[12px] font-terminal text-slate-200 font-bold tracking-wider">
                  {convertToDisplay(selectedAnomaly.startDepth).toFixed(1)}{unitLabel} — {convertToDisplay(selectedAnomaly.endDepth).toFixed(1)}{unitLabel}
                </span>
              </div>

              <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme?.cardHover}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Forensic_Delta</span>
                  <Activity size={10} className="text-slate-500/50" />
                </div>
                <span className="text-[12px] font-terminal text-slate-200 font-bold tracking-wider">{selectedAnomaly.avgDiff.toFixed(2)} API</span>
              </div>

              <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme?.cardHover}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Truth_Level</span>
                  <Globe2 size={10} className="text-indigo-500/50" />
                </div>
                <div className="flex items-center space-x-2">
                  <Globe2 size={12} className={anomalyTheme?.truthIcon} />
                  <span className={`text-[12px] font-black uppercase ${anomalyTheme?.truthText}`}>
                    {selectedAnomaly.truthLevel}
                  </span>
                </div>
              </div>

              <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme?.cardHover}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Detection_Epoch</span>
                  <Clock size={10} className="text-slate-500/50" />
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={12} className="text-slate-600" />
                  <span className="text-[12px] font-terminal text-slate-200 font-bold">{selectedAnomaly.detectedAt}</span>
                </div>
              </div>

              <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme?.cardHover}`}>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Task_Priority</span>
                <div className="flex items-center space-x-2">
                  {(['HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => updateAnomalyPriority(selectedAnomaly.id, p)}
                      className={`px-2.5 py-1 rounded text-[8px] font-black uppercase transition-all border ${
                      selectedAnomaly.priority === p
                        ? p === 'HIGH' ? 'bg-red-500 border-red-400 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)] scale-105' :
                          p === 'MEDIUM' ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_12px_rgba(249,115,22,0.5)] scale-105' :
                          'bg-blue-500 border-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] scale-105'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                    }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-4 xl:col-span-6 pt-4 border-t border-slate-800/50">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText size={14} className={`${anomalyTheme?.truthIcon} opacity-50`} />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Forensic_Interpretation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Database size={10} className="text-slate-600" />
                      <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">Source: {selectedAnomaly.provenance}</span>
                    </div>
                  </div>
                  <p className={`text-[11px] text-slate-300 font-terminal leading-relaxed bg-slate-950/60 p-4 rounded border shadow-inner italic transition-all duration-500 ${anomalyTheme?.border}`}>
                    {selectedAnomaly.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Physics_Anchored: TRUE</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]"></div>
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Audit_Trail: VERIFIED</span>
                      </div>
                    </div>
                    <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">WellTegra Forensic Engine v1.2 // Forensic_Audit_Hash: {Math.random().toString(16).substr(2, 12).toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedCasingIssue && (
        <div 
          className={`glass-panel rounded-lg border transition-all duration-500 overflow-hidden flex flex-col shadow-2xl mt-4 ${
            selectedCasingIssue.severity === 'CRITICAL' ? 'border-red-500/50 bg-red-950/10 shadow-[0_0_30px_rgba(239,68,68,0.15)]' :
            selectedCasingIssue.severity === 'WARNING' ? 'border-orange-500/50 bg-orange-950/10 shadow-[0_0_30px_rgba(249,115,22,0.15)]' :
            'border-blue-500/50 bg-blue-950/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-slate-900/90">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg shadow-inner ${
                selectedCasingIssue.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                selectedCasingIssue.severity === 'WARNING' ? 'bg-orange-500/20 text-orange-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                <ShieldAlert size={18} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-[12px] font-black uppercase tracking-widest text-white">Casing_Integrity_Report</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                    selectedCasingIssue.severity === 'CRITICAL' ? 'bg-red-500/20 border-red-500/40 text-red-500' :
                    selectedCasingIssue.severity === 'WARNING' ? 'bg-orange-500/20 border-orange-500/40 text-orange-500' :
                    'bg-blue-500/20 border-blue-500/40 text-blue-500'
                  }`}>
                    {selectedCasingIssue.severity}_SEVERITY
                  </span>
                </div>
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Issue_ID: {selectedCasingIssue.id} // Forensic_Audit_Active</span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedCasingIssue(null)}
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors bg-slate-800/30 rounded"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Integrity_Type</span>
              <span className="text-[12px] font-terminal text-emerald-400 font-bold tracking-wider">{selectedCasingIssue.type.replace(/_/g, ' ')}</span>
            </div>

            <div className="flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Depth_Locus</span>
              <span className="text-[12px] font-terminal text-slate-200 font-bold tracking-wider">{convertToDisplay(selectedCasingIssue.depth).toFixed(1)}{unitLabel}</span>
            </div>

            <div className="flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Measured_Value</span>
              <span className="text-[12px] font-terminal text-slate-200 font-bold tracking-wider">{selectedCasingIssue.value} {selectedCasingIssue.unit}</span>
            </div>

            <div className="flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Provenance</span>
              <span className="text-[12px] font-terminal text-slate-200 font-bold tracking-wider">{selectedCasingIssue.provenance}</span>
            </div>

            <div className="md:col-span-2 lg:col-span-4 pt-4 border-t border-slate-800/50">
              <div className="flex flex-col space-y-3">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Forensic_Analysis</span>
                <p className="text-[11px] text-slate-300 font-terminal leading-relaxed bg-slate-950/60 p-4 rounded border border-slate-800/50 italic">
                  {selectedCasingIssue.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>

        <div className="w-full xl:w-80 flex flex-col space-y-4">
          {/* Main Control Panel with Strike Feedback */}
          <div className={`glass-panel p-5 rounded-lg border bg-slate-900/40 flex flex-col space-y-5 shadow-2xl transition-all duration-300 cyber-border ${isShaking ? 'animate-shake border-[var(--alert-red)] bg-[var(--alert-red)]/5' : 'border-[var(--emerald-primary)]/20'}`}>
            <div className="flex items-center justify-between border-b border-[var(--emerald-primary)]/10 pb-2">
              <div className="flex items-center space-x-4">
                <h3 className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest flex items-center text-glow-emerald">
                  <span>Engage_Controls</span>
                  <Target size={12} className="ml-2 text-[var(--emerald-primary)]/40 animate-pulse" />
                </h3>
                <div className="flex items-center bg-slate-950/60 rounded border border-[var(--emerald-primary)]/20 p-0.5">
                  <button 
                    onClick={() => setUnit('METERS')}
                    className={`px-2 py-0.5 rounded text-[7px] font-black transition-all ${unit === 'METERS' ? 'bg-[var(--emerald-primary)] text-slate-950' : 'text-[var(--emerald-primary)]/40 hover:text-[var(--emerald-primary)]'}`}
                  >M</button>
                  <button 
                    onClick={() => setUnit('FEET')}
                    className={`px-2 py-0.5 rounded text-[7px] font-black transition-all ${unit === 'FEET' ? 'bg-[var(--emerald-primary)] text-slate-950' : 'text-[var(--emerald-primary)]/40 hover:text-[var(--emerald-primary)]'}`}
                  >FT</button>
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all duration-300 ${
                Math.abs(offset) >= OFFSET_HARD_LIMIT 
                  ? 'bg-[var(--alert-red)] text-slate-950 shadow-[0_0_15px_var(--alert-red)]' 
                  : Math.abs(offset) > OFFSET_SAFE_LIMIT 
                    ? 'bg-orange-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.6)]' 
                    : 'bg-[var(--emerald-primary)]/20 text-[var(--emerald-primary)] border border-[var(--emerald-primary)]/30 text-glow-emerald'
              }`}>
                {Math.abs(offset) >= OFFSET_HARD_LIMIT 
                  ? 'VETO_STATE' 
                  : Math.abs(offset) > OFFSET_SAFE_LIMIT 
                    ? 'WARNING_ZONE' 
                    : 'NOMINAL'}
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded border bg-slate-950/60 transition-all duration-300 glass-panel ${validationError ? (Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'border-[var(--alert-red)] shadow-[0_0_25px_rgba(239,68,68,0.3)]' : 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]') : 'border-[var(--emerald-primary)]/20'}`}>
                <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center space-x-2">
                      <Lock size={12} className={isCritical ? 'text-[var(--alert-red)] animate-pulse' : isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/40'} />
                      <span className={`text-[8px] font-black uppercase tracking-widest ${isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/50'}`}>Shift_Veto_Input</span>
                   </div>
                   <span className={`text-[16px] font-black font-terminal transition-colors duration-300 drop-shadow-md ${offsetIntensity}`}>
                     {convertToDisplay(offset).toFixed(3)}{unitLabel}
                   </span>
                </div>
                
                <div className="flex space-x-2">
                  <input 
                    type="number"
                    step="0.001"
                    min={-convertToDisplay(OFFSET_HARD_LIMIT)}
                    max={convertToDisplay(OFFSET_HARD_LIMIT)}
                    value={offset === 0 && isAdjusting ? '' : convertToDisplay(offset).toFixed(3)}
                    onFocus={() => setIsAdjusting(true)}
                    onBlur={() => setIsAdjusting(false)}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      if (rawValue === '') {
                        setOffset(0);
                        setValidationError(null);
                        return;
                      }
                      const val = parseFloat(rawValue);
                      if (!isNaN(val)) {
                        handleOffsetChange(convertFromDisplay(val));
                      }
                    }}
                    className={`flex-1 bg-slate-900/80 border rounded px-3 py-2 text-[11px] font-terminal outline-none transition-all duration-300 glass-panel ${isCritical ? 'border-[var(--alert-red)] text-[var(--alert-red)] shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-shake' : isWarning ? 'border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'border-[var(--emerald-primary)]/30 text-emerald-100 focus:border-[var(--emerald-primary)] focus:shadow-[0_0_10px_rgba(34,197,94,0.25)]'}`}
                  />
                  <button 
                    onClick={detectDatumShift}
                    disabled={isDetectingShift}
                    title="Auto-Detect Best Shift"
                    className={`px-3 rounded transition-all duration-300 flex items-center justify-center glass-panel hover:scale-110 active:scale-90 ${bestShift ? 'bg-orange-500 text-slate-950 hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-slate-800 text-[var(--emerald-primary)] hover:bg-slate-700 hover:text-white'}`}
                  >
                    {isDetectingShift ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  </button>
                  <button 
                    onClick={animateSync}
                    disabled={isSyncing}
                    title="Animate Alignment"
                    className="px-3 bg-[var(--emerald-primary)] text-slate-950 hover:bg-emerald-400 rounded transition-all duration-300 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.4)] glass-panel hover:scale-110 active:scale-90"
                  >
                    {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                  </button>
                  <button 
                    onClick={() => {
                      handleOffsetChange(0);
                      setBestShift(null);
                    }}
                    title="Reset Offset"
                    className="px-3 bg-slate-800 text-[var(--emerald-primary)]/40 hover:text-[var(--emerald-primary)] rounded transition-all duration-300 glass-panel hover:bg-slate-700"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
              </div>
              
              {bestShift !== null && (
                <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/40 rounded flex items-center justify-between animate-in slide-in-from-top-2 glass-panel cyber-border">
                  <div className="flex items-center space-x-2">
                    <Target size={10} className="text-orange-400 animate-pulse" />
                    <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest text-glow-gold">Best_Fit_Detected: {convertToDisplay(bestShift).toFixed(3)}{unitLabel}</span>
                  </div>
                  <button 
                    onClick={() => {
                      handleOffsetChange(bestShift);
                      setBestShift(null);
                    }}
                    className="text-[8px] font-black text-orange-400 hover:text-white uppercase underline decoration-orange-500/50 hover:decoration-white transition-all"
                  >
                    Apply_Shift
                  </button>
                </div>
              )}

              {Math.abs(offset) >= OFFSET_SAFE_LIMIT && (
                <div className={`mt-2 p-2 rounded border flex items-center space-x-2 animate-pulse glass-panel ${Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'bg-red-500/10 border-red-500/60 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-orange-500/10 border-orange-500/60 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]'}`}>
                  <AlertOctagon size={12} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-glow-red">
                    {Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'CRITICAL_VETO: HARD_LIMIT_EXCEEDED' : 'WARNING: SAFE_LIMIT_EXCEEDED'}
                  </span>
                </div>
              )}

              <div className="space-y-2 px-1">
                <div className="flex justify-between text-[8px] font-black text-[var(--emerald-primary)]/50 uppercase tracking-widest">
                  <span className="text-glow-emerald">Manual_Override</span>
                  <span className={`${Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'text-[var(--alert-red)] text-glow-red' : ''} transition-colors duration-300`}>HARD_LIMIT: ±{convertToDisplay(OFFSET_HARD_LIMIT).toFixed(1)}{unitLabel}</span>
                </div>
                {/* Visual Danger Zone Slider */}
                <div className="relative h-6 flex items-center">
                  <div className="absolute inset-0 h-1.5 my-auto rounded-full bg-slate-800/50 overflow-hidden pointer-events-none border border-slate-700/30">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 via-emerald-400 to-emerald-400 via-orange-500 to-red-600 opacity-30"></div>
                  </div>
                  <input 
                    type="range" min={-OFFSET_HARD_LIMIT} max={OFFSET_HARD_LIMIT} step="0.01" 
                    value={offset} 
                    onMouseDown={() => setIsAdjusting(true)}
                    onMouseUp={() => setIsAdjusting(false)}
                    onTouchStart={() => setIsAdjusting(true)}
                    onTouchEnd={() => setIsAdjusting(false)}
                    onChange={e => handleOffsetChange(parseFloat(e.target.value))}
                    className={`w-full h-1.5 bg-transparent appearance-none rounded-full cursor-pointer z-10 accent-current transition-all duration-300 ${offsetIntensity}`} 
                  />
                </div>
              </div>

              {validationError && (
                <div className={`p-3 rounded border animate-in slide-in-from-top-1 flex items-start space-x-3 glass-panel ${Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'bg-red-500/10 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]'}`}>
                  <AlertOctagon size={16} className="flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase leading-tight tracking-wider">{validationError}</span>
                    <span className="text-[7px] opacity-60 uppercase font-mono mt-1 tracking-widest">Manual Veto Active // Adjust Input</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Casing Integrity Check Feature */}
          <div className="flex-none glass-panel p-5 rounded-lg border border-emerald-500/20 bg-slate-900/40 shadow-2xl cyber-border hover:bg-slate-900/60 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center text-glow-emerald">
                <ShieldCheck size={12} className="mr-2 animate-pulse" /> Casing_Integrity_Check
              </h3>
              <div className="flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full ${casingIssues.length > 0 ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`}></div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{casingIssues.length} Issues</span>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={runCasingIntegrityCheck}
                disabled={isCheckingCasing}
                className={`w-full py-2.5 rounded text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-2 border ${
                  isCheckingCasing 
                    ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-wait' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                }`}
              >
                {isCheckingCasing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Analyzing_Casing_Data_{casingCheckProgress}%</span>
                  </>
                ) : (
                  <>
                    <ScanLine size={12} />
                    <span>Run_Integrity_Scan</span>
                  </>
                )}
              </button>

              {isCheckingCasing && (
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ width: `${casingCheckProgress}%` }}
                  ></div>
                </div>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {casingIssues.length === 0 && !isCheckingCasing ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-600 border border-dashed border-slate-800 rounded bg-slate-950/20">
                    <CheckCircle2 size={24} className="opacity-20 mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-widest">No_Issues_Detected</span>
                  </div>
                ) : (
                  casingIssues.map(issue => (
                    <div 
                      key={issue.id}
                      onClick={() => setSelectedCasingIssue(issue)}
                      className={`p-2 rounded border transition-all duration-300 cursor-pointer group ${
                        selectedCasingIssue?.id === issue.id 
                          ? 'bg-slate-800 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[7px] font-black px-1 rounded ${
                            issue.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' :
                            issue.severity === 'WARNING' ? 'bg-orange-500/20 text-orange-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}>
                            {issue.severity}
                          </span>
                          <span className="text-[9px] font-bold text-slate-200 uppercase tracking-tight">{issue.type.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-[8px] font-mono text-slate-500">{convertToDisplay(issue.depth).toFixed(1)}{unitLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] font-mono text-slate-600 truncate max-w-[120px]">{issue.description}</span>
                        <span className="text-[8px] font-black text-emerald-500/70">{issue.value}{issue.unit}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex-none glass-panel p-5 rounded-lg border border-[var(--emerald-primary)]/20 bg-slate-900/40 shadow-2xl cyber-border hover:bg-slate-900/60 transition-colors duration-300">
            <h3 className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest mb-4 flex items-center text-glow-emerald">
               <ScanLine size={12} className="mr-2 animate-pulse" /> Signal_Stack
            </h3>
            <div className="space-y-2">
              {filteredSignals.map(sig => (
                <div key={sig.id} className="relative group/sig">
                  <div 
                    onClick={() => handleToggleSignal(sig.id)}
                    role="button"
                    aria-pressed={sig.visible}
                    className={`flex items-center justify-between p-2.5 bg-slate-950/60 border rounded hover:border-[var(--emerald-primary)]/40 transition-all duration-300 cursor-pointer group glass-panel ${sig.visible ? 'border-[var(--emerald-primary)]/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]' : 'border-red-950/20 opacity-30 grayscale'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] transition-all duration-300 group-hover:scale-125" style={{ backgroundColor: sig.color, color: sig.color }}></div>
                      <span className={`text-[9px] font-black uppercase truncate transition-colors duration-300 ${sig.visible ? 'text-emerald-100' : 'text-slate-600'}`}>{sig.id === 'SIG-002' ? ghostLabel : sig.name}</span>
                    </div>
                    {sig.visible ? <CheckCircle2 size={12} className="text-[var(--emerald-primary)] animate-in zoom-in duration-300" /> : <ShieldAlert size={12} className="text-red-900" />}
                  </div>

                  {/* Signal Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/sig:block z-50 p-2 bg-slate-900 border border-emerald-500/30 rounded shadow-2xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none min-w-[120px]">
                    <div className="flex flex-col space-y-1 text-[8px] font-mono">
                      <div className="flex justify-between space-x-4">
                        <span className="text-slate-500 uppercase">Signal_ID:</span>
                        <span className="text-emerald-400 font-bold">{sig.id}</span>
                      </div>
                      <div className="flex justify-between space-x-4">
                        <span className="text-slate-500 uppercase">Hex_Code:</span>
                        <span className="font-bold" style={{ color: sig.color.startsWith('var') ? 'inherit' : sig.color }}>{sig.color}</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-emerald-500/30 rotate-45"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 glass-panel p-5 rounded-lg border border-[var(--emerald-primary)]/20 bg-slate-900/40 flex flex-col overflow-hidden shadow-2xl cyber-border hover:bg-slate-900/60 transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest flex items-center text-glow-emerald">
                 <AlertTriangle size={12} className="mr-2 animate-pulse" /> Detected_Anomalies
              </h3>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center text-[8px] font-black text-[var(--emerald-primary)]/50 uppercase tracking-widest">
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal size={10} className="text-[var(--emerald-primary)]/60" />
                    <span className="text-glow-emerald">Detection_Threshold</span>
                  </div>
                  <span className="text-[var(--emerald-primary)] text-glow-emerald">{anomalyThreshold} API</span>
                </div>
                <div className="relative h-4 flex items-center">
                  <div className="absolute inset-0 h-1 my-auto rounded-full bg-slate-800/50 pointer-events-none border border-slate-700/30"></div>
                  <input 
                    type="range" min="5" max="100" step="1" 
                    value={anomalyThreshold} 
                    onChange={e => setAnomalyThreshold(parseInt(e.target.value))}
                    className="w-full h-1 bg-transparent appearance-none rounded-full cursor-pointer z-10 accent-[var(--emerald-primary)] transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[8px] font-black text-[var(--emerald-primary)]/50 uppercase tracking-widest block text-glow-emerald">Severity_Filter</span>
                <div className="flex p-1 bg-slate-950/80 rounded border border-[var(--emerald-primary)]/20 glass-panel">
                  {(['ALL', 'CRITICAL', 'WARNING'] as const).map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all duration-300 ${
                        severityFilter === sev 
                          ? 'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                          : 'text-[var(--emerald-primary)]/50 hover:text-[var(--emerald-primary)] hover:bg-[var(--emerald-primary)]/5'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[8px] font-black text-[var(--emerald-primary)]/50 uppercase tracking-widest block text-glow-emerald">Temporal_Filter</span>
                <div className="flex p-1 bg-slate-950/80 rounded border border-[var(--emerald-primary)]/20 glass-panel">
                  {(['ALL', 'LAST_7_DAYS', 'LAST_30_DAYS'] as const).map((date) => (
                    <button
                      key={date}
                      onClick={() => setDateFilter(date)}
                      className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all duration-300 ${
                        dateFilter === date 
                          ? 'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                          : 'text-[var(--emerald-primary)]/50 hover:text-[var(--emerald-primary)] hover:bg-[var(--emerald-primary)]/5'
                      }`}
                    >
                      {date.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {filteredAnomalies.length === 0 ? (
                <div className="text-[10px] text-slate-600 font-terminal text-center py-8 uppercase tracking-widest italic opacity-50">NO ANOMALIES FOUND</div>
              ) : (
                filteredAnomalies.map(anomaly => (
                  <div 
                    key={anomaly.id}
                    onClick={() => setSelectedAnomaly(anomaly)}
                    className={`p-3 rounded border-l-4 cursor-pointer transition-all duration-300 glass-panel hover:bg-slate-800/60 group ${
                      selectedAnomaly?.id === anomaly.id 
                        ? `bg-slate-800/90 shadow-2xl cyber-border ${anomaly.severity === 'CRITICAL' ? 'border-red-500' : 'border-orange-500'}` 
                        : `bg-slate-950/40 ${anomaly.severity === 'CRITICAL' ? 'border-red-500/30 hover:border-red-500/60' : 'border-orange-500/30 hover:border-orange-500/60'}`
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-black transition-colors duration-300 ${selectedAnomaly?.id === anomaly.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{anomaly.id}</span>
                        <span className={`text-[7px] font-black px-1 rounded ${
                          anomaly.priority === 'HIGH' ? 'bg-blue-500/20 text-blue-400' :
                          anomaly.priority === 'MEDIUM' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {anomaly.priority}
                        </span>
                      </div>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded transition-all duration-300 ${anomaly.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : 'bg-orange-500/20 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.2)]'}`}>
                        {anomaly.severity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-terminal text-slate-400">
                      <span>{convertToDisplay(anomaly.startDepth).toFixed(1)}{unitLabel} - {convertToDisplay(anomaly.endDepth).toFixed(1)}{unitLabel}</span>
                      <span className="flex items-center"><Calendar size={8} className="mr-1"/> {anomaly.detectedAt}</span>
                    </div>

                    {selectedAnomaly?.id === anomaly.id && (
                      <div className="mt-3 pt-3 border-t border-slate-800/50 space-y-3 animate-in slide-in-from-top-1 duration-300">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black">Start_Depth</span>
                            <span className="text-[10px] text-slate-200 font-mono">{convertToDisplay(anomaly.startDepth).toFixed(1)}{unitLabel}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black">End_Depth</span>
                            <span className="text-[10px] text-slate-200 font-mono">{convertToDisplay(anomaly.endDepth).toFixed(1)}{unitLabel}</span>
                          </div>
                          <div className="flex flex-col col-span-2">
                            <span className="text-[7px] text-slate-500 uppercase font-black">Avg_Deviation</span>
                            <span className="text-[10px] text-orange-400 font-mono">{anomaly.avgDiff.toFixed(2)} API</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/30">
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black">Truth_Level</span>
                            <span className={`text-[9px] font-black ${anomaly.truthLevel === 'FORENSIC' ? 'text-emerald-400' : 'text-blue-400'}`}>{anomaly.truthLevel}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black">Priority</span>
                            <div className="flex items-center space-x-1 mt-0.5">
                              {(['HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
                                <button
                                  key={p}
                                  onClick={(e) => { e.stopPropagation(); updateAnomalyPriority(anomaly.id, p); }}
                                  className={`px-1.5 py-0.5 rounded text-[6px] font-black uppercase transition-all ${
                                    anomaly.priority === p
                                      ? p === 'HIGH' ? 'bg-blue-500 text-white' :
                                        p === 'MEDIUM' ? 'bg-purple-500 text-white' :
                                        'bg-emerald-500 text-white'
                                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="text-[9px] text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-2">
                          {anomaly.description}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center space-x-2">
                            <Info size={10} className="text-slate-500" />
                            <span className="text-[7px] text-slate-500 uppercase font-black tracking-tighter">Provenance: {anomaly.provenance}</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsAnomalyPanelOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="text-[8px] font-black text-emerald-500 uppercase hover:underline"
                          >
                            View_Full_Report
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <button className="flex items-center justify-center space-x-3 w-full py-4 bg-slate-950/90 border border-emerald-500/20 rounded-lg text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-400 transition-all group shadow-xl">
             <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Notarize_Sync_Truth</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Remote Fetch */}
      {showConfirmFetch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[var(--slate-abyssal)] border border-cyan-500/50 rounded-xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.2)] cyber-border relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <Globe2 className="text-cyan-400 animate-pulse" size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-cyan-400 uppercase tracking-tighter">Remote_Fetch_Authorization</h3>
                <p className="text-[10px] text-cyan-500/70 font-mono uppercase tracking-widest">External_Data_Ingress_Protocol</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
                <p className="text-xs text-slate-300 leading-relaxed">
                  You are about to initiate a remote data synchronization from the following endpoint:
                </p>
                <div className="mt-2 p-2 bg-black/40 rounded border border-cyan-900/30 font-mono text-[10px] text-cyan-300 break-all">
                  {remoteUrl}
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] text-orange-400/80 uppercase font-black leading-tight">
                  Warning: Ingress of external forensic data may overwrite existing local correlation buffers.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => setShowConfirmFetch(false)}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all"
              >
                Abort_Protocol
              </button>
              <button 
                onClick={confirmFetch}
                className="flex-1 px-4 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500 text-cyan-400 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
              >
                Authorize_Sync
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
          animation-iteration-count: 2;
        }
        .warning-glow {
          text-shadow: 0 0 15px rgba(249, 115, 22, 0.8), 0 0 30px rgba(249, 115, 22, 0.4);
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          box-shadow: 0 0 10px currentColor;
        }
        input[type=range]::-moz-range-thumb {
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
          box-shadow: 0 0 10px currentColor;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default GhostSync;
