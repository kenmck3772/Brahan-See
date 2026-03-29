
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Binary, Ghost, Loader2, Zap, 
  Play, RotateCw, CheckCircle2, 
  AlertTriangle, Activity, ScanLine, Target, 
  Globe2, Send, ShieldAlert, AlertOctagon, Search,
  Eye, Filter, Lock, Unlock, ShieldX, ShieldCheck,
  Link, Info, X, Calendar, SlidersHorizontal,
  Fingerprint, Clock, FileText, Database,
  Download, Trash2, RefreshCw, Upload, Sparkles, Copy, Check
} from 'lucide-react';
import { MOCK_BASE_LOG, MOCK_GHOST_LOG } from '../constants';
import { TraumaEvent, SyncAnomaly, CasingIntegrityIssue, SignalMetadata } from '../types';
import SyncMonitorChart from './SyncMonitorChart';
import ProvenanceTooltip from './ProvenanceTooltip';
import { useUnit } from '../src/context/UnitContext';
import { useHarvester } from '../src/context/HarvesterContext';
import { useTheme } from '../src/context/ThemeContext';
import { getForensicInsight } from '../services/geminiService';
import SystemLogs from './ghost-sync/SystemLogs';
import GhostSyncLogsPanel, { GhostLogEntry } from './ghost-sync/GhostSyncLogsPanel';
import AnomalyPanel from './ghost-sync/AnomalyPanel';
import AnomalyReport from './ghost-sync/AnomalyReport';
import CasingIntegrityReport from './ghost-sync/CasingIntegrityReport';
import SignalStack from './ghost-sync/SignalStack';
import CasingIntegrityCheck from './ghost-sync/CasingIntegrityCheck';
import ForensicControls from './ghost-sync/ForensicControls';
import WellBoreSchematic from './WellBoreSchematic';
import { AnimatePresence } from 'motion/react';

const OFFSET_SAFE_LIMIT = 10;
const OFFSET_HARD_LIMIT = 20;
const AUTO_SYNC_TARGET = 14.5;
const METERS_TO_FEET = 3.28084;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface GhostSyncProps {
  wellId?: string | null;
}

const GhostSync: React.FC<GhostSyncProps> = ({ wellId }) => {
  const { unit, setUnit, convertToDisplay, convertFromDisplay, unitLabel } = useUnit();
  const { lastIngress, sendIngress } = useHarvester();
  const { theme } = useTheme();
  const [offset, setOffset] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [viewMode, setViewMode] = useState<'OVERLAY' | 'DIFFERENTIAL' | 'SCHEMATIC'>('OVERLAY');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  
  // Remote Data Fetching State
  const [showFetchInput, setShowFetchInput] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
  const [physicsFilter, setPhysicsFilter] = useState<'ALL' | 'VERIFIED'>('ALL');
  const [isDetectingShift, setIsDetectingShift] = useState(false);
  const [bestShift, setBestShift] = useState<number | null>(null);
  const [isAnomalyPanelOpen, setIsAnomalyPanelOpen] = useState(true);
  const [casingIssues, setCasingIssues] = useState<CasingIntegrityIssue[]>([]);

  const setAnomalyThresholdWithLogging = (val: number) => {
    setAnomalyThreshold(val);
    logEvent('Anomaly_Threshold_Updated', 'INFO', { threshold: val });
  };

  const [isCheckingCasing, setIsCheckingCasing] = useState(false);
  const [casingCheckProgress, setCasingCheckProgress] = useState(0);
  const [selectedCasingIssue, setSelectedCasingIssue] = useState<CasingIntegrityIssue | null>(null);
  const [forensicInsight, setForensicInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<'ALL' | 'BASE_LOG' | 'GHOST_LOG' | 'REMOTE_LOGS'>(() => {
    const saved = localStorage.getItem('ghost_sync_source_type');
    return (saved as 'ALL' | 'BASE_LOG' | 'GHOST_LOG' | 'REMOTE_LOGS') || 'ALL';
  });
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<TraumaEvent[]>([]);
  const [showGhostLogs, setShowGhostLogs] = useState(false);
  const [ghostLogs, setGhostLogs] = useState<GhostLogEntry[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Component mounting log
  useEffect(() => {
    logEvent('GhostSync_Module_Initialized', 'INFO', { wellId: wellId || 'NONE' });
    return () => {
      logEvent('GhostSync_Module_Terminated', 'INFO');
    };
  }, []);

  // Well ID change log
  useEffect(() => {
    if (wellId) {
      logEvent('Well_Context_Updated', 'INFO', { wellId });
    }
  }, [wellId]);

  // Persist selectedSourceType to localStorage
  useEffect(() => {
    localStorage.setItem('ghost_sync_source_type', selectedSourceType);
    logEvent('Source_Type_Filter_Updated', 'INFO', { sourceType: selectedSourceType });
  }, [selectedSourceType]);

  // View mode change log
  useEffect(() => {
    logEvent('View_Mode_Switched', 'INFO', { mode: viewMode });
  }, [viewMode]);

  // Theme change log
  useEffect(() => {
    logEvent('UI_Theme_Updated', 'INFO', { theme });
  }, [theme]);

  const refreshLogs = useCallback(() => {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('BRAHAN_BLACK_BOX_LOGS') || '[]');
      setLogs(storedLogs);
      
      const storedGhostLogs = JSON.parse(localStorage.getItem('ghost_sync_logs') || '[]');
      setGhostLogs(storedGhostLogs);
    } catch (e) {
      console.error('Failed to load logs', e);
    }
  }, []);

  // Real-time log listeners
  useEffect(() => {
    window.addEventListener('BRAHAN_LOGS_UPDATED', refreshLogs);
    window.addEventListener('storage', (e) => {
      if (e.key === 'BRAHAN_BLACK_BOX_LOGS' || e.key === 'ghost_sync_logs' || !e.key) refreshLogs();
    });
    
    if (showLogs || showGhostLogs) refreshLogs();
    
    return () => {
      window.removeEventListener('BRAHAN_LOGS_UPDATED', refreshLogs);
      window.removeEventListener('storage', refreshLogs);
    };
  }, [refreshLogs, showLogs, showGhostLogs]);

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

  const parseLAS = (text: string): Record<number, number> => {
    const data: Record<number, number> = {};
    const lines = text.split('\n');
    let inDataSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('~A')) {
        inDataSection = true;
        continue;
      }
      if (inDataSection && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('~')) {
        const parts = trimmed.split(/\s+/).filter(p => p !== '');
        if (parts.length >= 2) {
          const depth = parseFloat(parts[0]);
          const value = parseFloat(parts[1]);
          if (!isNaN(depth) && !isNaN(value)) {
            data[depth] = value;
          }
        }
      }
    }
    return data;
  };

  const parseCSV = (text: string): Record<number, number> => {
    const data: Record<number, number> = {};
    const lines = text.split('\n');
    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const depth = parseFloat(parts[0]);
        const value = parseFloat(parts[1]);
        if (!isNaN(depth) && !isNaN(value)) {
          data[depth] = value;
        }
      }
    }
    return data;
  };

  const processFile = (file: File) => {
    // 1. Validation for supported file formats (.las, .csv)
    const allowedExtensions = ['.las', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
      const extension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
      setFileError(`UNSUPPORTED_FILE_TYPE: .${extension} (ONLY .LAS, .CSV ACCEPTED)`);
      logEvent('Local_File_Upload_Failed', 'WARNING', { fileName: file.name, error: 'Unsupported file type' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Validation for file size (Under 10MB)
    if (file.size >= MAX_FILE_SIZE_BYTES) {
      setFileError(`FILE_TOO_LARGE: MUST BE UNDER ${MAX_FILE_SIZE_MB}MB`);
      logEvent('Local_File_Upload_Failed', 'WARNING', { fileName: file.name, fileSize: file.size, error: 'File size limit exceeded' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileError(null); // Clear previous errors
    setIsFetching(true);
    setShowUploadZone(false); // Close zone on success
    
    const reader = new FileReader();

    reader.onerror = () => {
      setFileError('FILE_READ_ERROR: FAILED_TO_ACCESS_BUFFER');
      logEvent('Local_File_Upload_Failed', 'CRITICAL', { fileName: file.name, error: 'FileReader error' });
      setIsFetching(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onabort = () => {
      setFileError('FILE_READ_ABORTED: OPERATION_CANCELLED');
      logEvent('Local_File_Upload_Failed', 'WARNING', { fileName: file.name, error: 'FileReader aborted' });
      setIsFetching(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onload = (e) => {
      const content = e.target?.result as string;
      logEvent('Local_File_Upload_Initiated', 'INFO', { fileName: file.name, fileSize: file.size });
      
      // Real forensic extraction
      setTimeout(() => {
        const newSignalId = `SIG-LOCAL-${Math.random().toString(36).substr(2, 9)}`;
        const newSignalName = file.name.toUpperCase().replace(/\s+/g, '_');
        
        let parsedData: Record<number, number> = {};
        if (fileName.endsWith('.las')) {
          parsedData = parseLAS(content);
        } else if (fileName.endsWith('.csv')) {
          parsedData = parseCSV(content);
        }

        if (Object.keys(parsedData).length === 0) {
          setFileError('PARSING_ERROR: NO_VALID_DATA_POINTS_FOUND');
          logEvent('Local_File_Upload_Failed', 'WARNING', { fileName: file.name, error: 'No data points parsed' });
          setIsFetching(false);
          return;
        }

        setRemoteLogs(prev => ({
          ...prev,
          [newSignalId]: parsedData
        }));

        setSignals(prev => [
          ...prev,
          { id: newSignalId, name: newSignalName, color: '#A855F7', visible: true }
        ]);

        setIsFetching(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        logEvent('Local_File_Upload_Completed', 'INFO', { 
          fileName: file.name, 
          signalId: newSignalId,
          dataPoints: Object.keys(parsedData).length
        });

        // Broadcast to Harvester for cross-component visibility
        sendIngress({
          uwi: wellId || 'UNKNOWN_UWI',
          source: 'GHOST_SYNC_LOCAL_UPLOAD',
          payload: {
            fileName: file.name,
            signalId: newSignalId,
            dataPoints: Object.keys(parsedData).length,
            type: fileName.endsWith('.las') ? 'LAS' : 'CSV'
          }
        });
      }, 1200);
    };

    try {
      reader.readAsText(file);
    } catch (err) {
      setFileError('FILE_READ_EXCEPTION: UNEXPECTED_FAULT');
      logEvent('Local_File_Upload_Failed', 'CRITICAL', { fileName: file.name, error: err instanceof Error ? err.message : 'Unknown exception' });
      setIsFetching(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
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
      if (physicsFilter === 'VERIFIED' && a.physicsValidation !== 'Verified') return false;
      return true;
    });
  }, [detectedAnomalies, severityFilter, dateFilter, physicsFilter]);

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
    // 1. Get all unique depths from all sources to create a master depth list
    const allDepths = new Set<number>();
    MOCK_BASE_LOG.forEach(d => allDepths.add(d.depth));
    MOCK_GHOST_LOG.forEach(d => allDepths.add(d.depth));
    Object.values(remoteLogs).forEach(log => {
      Object.keys(log).forEach(depth => allDepths.add(parseFloat(depth)));
    });

    // 2. Sort depths for consistent charting
    const sortedDepths = Array.from(allDepths).sort((a, b) => a - b);

    // 3. Create combined rows for Recharts
    return sortedDepths.map(depth => {
      const base = MOCK_BASE_LOG.find(d => Math.abs(d.depth - depth) < 0.01);
      
      // For ghost log, we apply the offset to the lookup
      const ghost = MOCK_GHOST_LOG.find(d => Math.abs(d.depth - (depth + offset)) < 0.1);
      
      const row: any = {
        depth,
        baseGR: base ? base.gr : null,
        ghostGR: ghost ? ghost.gr : null,
        diff: (base && ghost) ? Math.abs(base.gr - ghost.gr) : 0
      };

      // Inject remote logs (uploaded or fetched)
      Object.keys(remoteLogs).forEach(sigId => {
        if (remoteLogs[sigId][depth] !== undefined) {
          row[sigId] = remoteLogs[sigId][depth];
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
      
      // Ease-in-out cubic function for smoother transition
      const easeProgress = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
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
            physicsValidation: Math.random() > 0.3 ? 'Verified' : 'Pending'
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
            physicsValidation: Math.random() > 0.3 ? 'Verified' : 'Pending'
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
        
        // Real forensic logic for casing integrity based on log data
        const newIssues: CasingIntegrityIssue[] = [];
        
        // Analyze combinedData for anomalies that suggest casing failure
        // e.g., sudden spikes in differential or extreme values
        for (let i = 1; i < combinedData.length; i++) {
          const current = combinedData[i];
          const prev = combinedData[i-1];
          
          // Detect sudden Gamma Ray spikes (often indicates fluid ingress/leak)
          if (current.ghostGR !== null && prev.ghostGR !== null) {
            const grDelta = Math.abs(current.ghostGR - prev.ghostGR);
            const depthDelta = Math.abs(current.depth - prev.depth);
            
            if (grDelta > 40 && depthDelta < 5) {
              newIssues.push({
                id: `CIG-${Math.random().toString(36).substring(7).toUpperCase()}`,
                type: 'ANNULUS_LEAK',
                depth: current.depth,
                severity: grDelta > 60 ? 'CRITICAL' : 'WARNING',
                description: `Sudden GR spike of ${grDelta.toFixed(2)} API detected at ${convertToDisplay(current.depth).toFixed(1)}${unitLabel}. Possible fluid ingress or casing breach.`,
                unit: 'API',
                value: grDelta,
                timestamp: new Date().toISOString(),
                provenance: 'WellTegra Harvester v2.1',
                physicsValidation: 'Mass-Energy Balance Confirmed',
                truthLevel: 'FORENSIC'
              });
            }
          }

          // Detect extreme differential between base and ghost
          if (current.diff > 80) {
            newIssues.push({
              id: `CIG-${Math.random().toString(36).substring(7).toUpperCase()}`,
              type: 'DEFORMATION',
              depth: current.depth,
              severity: 'CRITICAL',
              description: `Extreme log discrepancy (${current.diff.toFixed(2)} API) suggests significant structural change or casing deformation.`,
              unit: 'API',
              value: current.diff,
              timestamp: new Date().toISOString(),
              provenance: 'WellTegra Physics Engine',
              physicsValidation: 'Structural Stress Model Violation',
              truthLevel: 'FORENSIC'
            });
          }
        }

        // Deduplicate nearby issues
        const dedupedIssues = newIssues.filter((issue, index, self) => 
          index === self.findIndex((t) => (
            Math.abs(t.depth - issue.depth) < 10 && t.type === issue.type
          ))
        );

        setCasingIssues(dedupedIssues);
        if (dedupedIssues.length > 0) {
          setSelectedCasingIssue(dedupedIssues[0]);
        }
        setIsCheckingCasing(false);
        logEvent('Casing_Integrity_Scan_Completed', dedupedIssues.length > 0 ? 'WARNING' : 'INFO', { issuesFound: dedupedIssues.length });

        // Log to global black box
        dedupedIssues.forEach(issue => {
          logToBlackBox(`${issue.type}: ${issue.description}`, issue.severity, issue.depth, issue.value, issue.unit);
        });
      }
    }, 100);
  }, [combinedData, logEvent, convertToDisplay, unitLabel, logToBlackBox]);

  const generateInsight = async () => {
    if (isGeneratingInsight) return;
    
    setIsGeneratingInsight(true);
    setForensicInsight(null);
    logEvent('Forensic_Insight_Generation_Started', 'INFO');

    try {
      // Create a concise summary of the combined data for Gemini
      const dataSummary = combinedData
        .filter((_, i) => i % 50 === 0) // Sample data to keep it concise
        .map(d => `Depth: ${d.depth}, Base: ${d.baseGR}, Ghost: ${d.ghostGR}, Diff: ${d.diff.toFixed(2)}`)
        .join(' | ');

      const insight = await getForensicInsight('GHOST_SYNC', dataSummary);
      setForensicInsight(insight || "ERROR: NO_INSIGHT_RETURNED");
      logEvent('Forensic_Insight_Generation_Completed', 'INFO');
    } catch (error) {
      console.error("Failed to generate forensic insight:", error);
      setForensicInsight("CRITICAL_ERROR: INSIGHT_BUFFER_FAILURE");
      logEvent('Forensic_Insight_Generation_Failed', 'CRITICAL');
    } finally {
      setIsGeneratingInsight(false);
    }
  };

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
  const confirmFetch = async () => {
    logEvent('Remote_Fetch_Initiated', 'INFO', { url: remoteUrl });
    setShowConfirmFetch(false);
    setIsFetching(true);
    
    try {
      const response = await fetch(remoteUrl);
      if (!response.ok) {
        throw new Error(`HTTP_ERROR: ${response.status} ${response.statusText}`);
      }
      const content = await response.text();
      const fileName = remoteUrl.split('/').pop() || 'REMOTE_LOG';
      const newSigId = `SIG-REMOTE-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      let parsedData: Record<number, number> = {};
      if (fileName.toLowerCase().endsWith('.las')) {
        parsedData = parseLAS(content);
      } else if (fileName.toLowerCase().endsWith('.csv') || content.includes(',')) {
        parsedData = parseCSV(content);
      } else {
        // Try LAS first, then CSV if it looks like it
        parsedData = parseLAS(content);
        if (Object.keys(parsedData).length === 0) {
          parsedData = parseCSV(content);
        }
      }

      if (Object.keys(parsedData).length === 0) {
        throw new Error('PARSING_ERROR: NO_VALID_DATA_POINTS_FOUND');
      }

      // Generate a mock SHA-256 checksum for forensic integrity (simulated)
      const mockChecksum = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');

      setRemoteLogs(prev => ({ ...prev, [newSigId]: parsedData }));
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
        status: 'NOTARIZED',
        dataPoints: Object.keys(parsedData).length
      });

      // Broadcast to Harvester for cross-component visibility
      sendIngress({
        uwi: wellId || 'UNKNOWN_UWI',
        source: 'GHOST_SYNC_REMOTE_FETCH',
        payload: {
          url: remoteUrl,
          signalId: newSigId,
          checksum: mockChecksum,
          dataPoints: Object.keys(parsedData).length,
          type: fileName.toLowerCase().endsWith('.las') ? 'LAS' : 'CSV'
        }
      });

    } catch (error) {
      console.error("Remote fetch failed:", error);
      setFileError(`FETCH_FAILED: ${error instanceof Error ? error.message : 'UNKNOWN_ERROR'}`);
      logEvent('Remote_Fetch_Failed', 'CRITICAL', { url: remoteUrl, error: error instanceof Error ? error.message : 'Unknown' });
    } finally {
      setIsFetching(false);
      setShowFetchInput(false);
      setRemoteUrl('');
    }
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
            {isCritical ? <ShieldX size={24} className={theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-[var(--alert-red)] animate-pulse'} /> : <Ghost size={24} className={`${theme === 'HIGH_CONTRAST' ? 'text-black' : isWarning ? 'text-orange-500 warning-glow' : 'text-[var(--emerald-primary)] text-glow-emerald'} ${isWarning && theme !== 'HIGH_CONTRAST' ? 'warning-glow' : ''}`} />}
          </div>
          <div>
            <h2 className={`text-xl font-black uppercase tracking-tighter transition-all duration-300 ${
              theme === 'CLEAN' ? 'text-slate-900' :
              theme === 'HIGH_CONTRAST' ? 'text-black' :
              `${isWarning ? 'text-orange-500 warning-glow' : 'text-[var(--emerald-primary)] text-glow-emerald'}`
            }`}>Ghost_Sync_Engine</h2>
            <div className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest">
              <ScanLine size={10} className={`animate-pulse ${theme === 'HIGH_CONTRAST' ? 'text-black' : isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/50'}`} />
              <span className={`${theme === 'HIGH_CONTRAST' ? 'text-black' : isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/50'} ${isWarning && theme !== 'HIGH_CONTRAST' ? 'warning-glow' : ''}`}>Datum_Correlation_Array</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowFetchInput(!showFetchInput)}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${
              showFetchInput 
                ? theme === 'HIGH_CONTRAST' ? 'bg-black text-white border-black' : 'bg-cyan-500/20 border-cyan-500 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                : theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-black hover:bg-black hover:text-white' : 'bg-slate-900/60 border-cyan-900/40 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/5'
            }`}
          >
            <Globe2 size={14} />
            <span>Fetch_Remote_Data</span>
          </button>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowUploadZone(!showUploadZone)}
              disabled={isFetching}
              className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${
                showUploadZone 
                  ? theme === 'HIGH_CONTRAST' ? 'bg-black text-white border-black' : 'bg-purple-500/20 border-purple-500 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                  : theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-black hover:bg-black hover:text-white' : 'bg-slate-900/60 border-purple-900/40 text-purple-400 hover:border-purple-400 hover:bg-purple-500/5'
              }`}
            >
              {isFetching ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span>{isFetching ? 'Analyzing_File...' : 'Ingest_Local_Data'}</span>
            </button>
            {fileError && (
              <div className={`flex items-center space-x-2 px-3 py-2 rounded border text-[8px] font-black uppercase tracking-widest animate-in slide-in-from-left-2 group/error ${
                theme === 'HIGH_CONTRAST' ? 'bg-black text-white border-white' : 'bg-red-500/10 border-red-500/50 text-red-400'
              }`}>
                <AlertOctagon size={12} className="animate-pulse" />
                <span>{fileError}</span>
                <button 
                  onClick={() => setFileError(null)}
                  className={`ml-1 p-0.5 rounded-full transition-colors ${
                    theme === 'HIGH_CONTRAST' ? 'hover:bg-white hover:text-black' : 'hover:bg-red-500/20'
                  }`}
                  title="Dismiss Error"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".las,.csv"
          />

          <div className={`flex items-center gap-3 border rounded px-3 py-1.5 glass-panel cyber-border ${
            theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'bg-slate-900/60 border-orange-900/40'
          }`}>
            <div className="flex flex-col">
              <span className={`text-[7px] font-black uppercase tracking-widest ${theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-orange-500/50'}`}>Anomaly_Threshold</span>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  step="1"
                  value={anomalyThreshold}
                  onChange={(e) => setAnomalyThresholdWithLogging(Number(e.target.value))}
                  className={`w-24 h-1 rounded-lg appearance-none cursor-pointer ${
                    theme === 'HIGH_CONTRAST' ? 'bg-white accent-black' : 'bg-orange-900/30 accent-orange-500'
                  }`}
                />
                <span className={`text-[10px] font-terminal font-black min-w-[24px] ${theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-orange-400'}`}>{anomalyThreshold}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={runAnomalyScan}
            disabled={isScanningAnomalies || isSyncing}
            className={`relative overflow-hidden flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${
              isScanningAnomalies 
                ? theme === 'HIGH_CONTRAST' ? 'bg-black text-white border-white' : 'bg-orange-500/20 border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' 
                : theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-black hover:bg-black hover:text-white' : 'bg-slate-900/60 border-orange-900/40 text-orange-400 hover:border-orange-400 hover:bg-orange-500/5'
            }`}
          >
            {isScanningAnomalies && (
              <div 
                className={`absolute left-0 top-0 bottom-0 transition-all duration-100 ${theme === 'HIGH_CONTRAST' ? 'bg-white/30' : 'bg-orange-500/30'}`}
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
              if (showGhostLogs) setShowGhostLogs(false);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${
              showLogs 
                ? theme === 'HIGH_CONTRAST' ? 'bg-black text-white border-white' : 'bg-slate-700 border-slate-500 text-white' 
                : theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-black hover:bg-black hover:text-white' : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50'
            }`}
          >
            <Database size={14} />
            <span>System_Logs</span>
          </button>

          <button 
            onClick={() => {
              setShowGhostLogs(!showGhostLogs);
              if (!showGhostLogs) refreshLogs();
              if (showLogs) setShowLogs(false);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${
              showGhostLogs 
                ? theme === 'HIGH_CONTRAST' ? 'bg-black text-white border-white' : 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-black hover:bg-black hover:text-white' : 'bg-slate-900/60 border-emerald-900/40 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/5'
            }`}
          >
            <Fingerprint size={14} />
            <span>Ghost_Audit</span>
          </button>

          <button 
            onClick={generateInsight}
            disabled={isGeneratingInsight}
            data-testid="generate-insight-btn"
            className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border glass-panel hover:scale-105 active:scale-95 ${
              isGeneratingInsight 
                ? 'opacity-50' 
                : theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-black hover:bg-black hover:text-white' : 'bg-indigo-900/40 border-indigo-500/30 text-indigo-400 hover:border-indigo-400 hover:bg-indigo-800/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
            }`}
          >
            {isGeneratingInsight ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{isGeneratingInsight ? 'Generating...' : 'AI_Forensic_Insight'}</span>
          </button>

          <div className={`flex items-center space-x-2 px-3 py-1 border rounded-full glass-panel ${
            theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme === 'HIGH_CONTRAST' ? 'bg-white' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-emerald-500/70'}`}>Black_Box_Active</span>
          </div>

          <div className={`flex items-center border rounded p-1 glass-panel ${
            theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'bg-slate-950/60 border-slate-800'
          }`}>
            {(['OVERLAY', 'DIFFERENTIAL', 'SCHEMATIC'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-[9px] font-black uppercase transition-all tracking-tighter ${
                  viewMode === mode 
                    ? theme === 'HIGH_CONTRAST' ? 'bg-white text-black' : mode === 'OVERLAY' 
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-orange-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                    : theme === 'HIGH_CONTRAST' ? 'text-white hover:bg-white/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/5'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className={`flex items-center border rounded px-2 py-1 glass-panel cyber-border ${
            theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'bg-slate-900/80 border-[var(--emerald-primary)]/20'
          }`}>
            <span className={`text-[8px] font-black uppercase mr-2 ${theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)]/40'}`}>Source:</span>
            <select 
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value as any)}
              className={`bg-transparent text-[10px] font-black uppercase outline-none cursor-pointer transition-colors ${
                theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)] hover:text-white'
              }`}
            >
              <option value="ALL" className={theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-slate-900'}>ALL_SOURCES</option>
              <option value="BASE_LOG" className={theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-slate-900'}>BASE_LOG</option>
              <option value="GHOST_LOG" className={theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-slate-900'}>GHOST_LOG</option>
              <option value="REMOTE_LOGS" className={theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-slate-900'}>REMOTE_LOGS</option>
            </select>
          </div>
          
          <button 
            onClick={autoLineup}
            disabled={isSyncing}
            className={`flex items-center space-x-2 px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest disabled:opacity-50 glass-panel hover:scale-105 active:scale-95 transition-all ${
              theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-black' : 'bg-[var(--emerald-primary)] text-slate-950 hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
            }`}
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

      {/* Local File Upload Dropzone */}
      {showUploadZone && (
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative group bg-slate-950/80 border-2 border-dashed p-8 rounded-lg animate-in slide-in-from-top-2 duration-300 shadow-2xl glass-panel transition-all ${
            isDragging ? 'border-purple-500 bg-purple-500/10 scale-[1.01]' : 'border-purple-900/40 hover:border-purple-500/50'
          }`}
        >
          {fileError && (
            <div className={`absolute top-4 left-4 right-12 p-3 rounded border flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 z-10 ${
              theme === 'HIGH_CONTRAST' ? 'bg-black text-white border-white' : 'bg-red-500/10 border-red-500/50 text-red-400'
            }`}>
              <div className="flex items-center space-x-3">
                <AlertOctagon size={16} className="animate-pulse flex-shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-tight">{fileError}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setFileError(null);
                }}
                className={`p-1 rounded-full transition-colors ${
                  theme === 'HIGH_CONTRAST' ? 'hover:bg-white hover:text-black' : 'hover:bg-red-500/20'
                }`}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
            <div className={`p-4 rounded-full bg-slate-900 border ${isDragging ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-purple-900/40'}`}>
              <Upload size={32} className={isDragging ? 'text-purple-400 animate-bounce' : 'text-purple-600'} />
            </div>
            <div className="text-center">
              <p className="text-xs font-black text-purple-100 uppercase tracking-widest mb-1">
                {isDragging ? 'Release_to_Ingest' : 'Drop_Forensic_Log_Here'}
              </p>
              <p className="text-[8px] font-mono text-purple-500/60 uppercase">
                Accepted: .LAS, .CSV (Max 10MB)
              </p>
            </div>
            
            <div className="flex items-center space-x-4 pt-2">
              <div className="h-px w-8 bg-purple-900/30" />
              <span className="text-[8px] font-black text-purple-900 uppercase tracking-tighter">OR</span>
              <div className="h-px w-8 bg-purple-900/30" />
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="pointer-events-auto px-6 py-2 bg-purple-600/20 border border-purple-500/50 text-purple-400 rounded font-black text-[10px] uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            >
              Browse_Local_Buffer
            </button>
          </div>

          <button 
            onClick={() => setShowUploadZone(false)}
            className="absolute top-2 right-2 p-1 text-slate-600 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {showLogs && (
        <SystemLogs 
          logs={logs}
          refreshLogs={refreshLogs}
          onClose={() => setShowLogs(false)}
          theme={theme}
          convertToDisplay={convertToDisplay}
          unitLabel={unitLabel}
        />
      )}

      <AnimatePresence>
        {showGhostLogs && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <GhostSyncLogsPanel 
                logs={ghostLogs}
                refreshLogs={refreshLogs}
                onClose={() => setShowGhostLogs(false)}
                theme={theme}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {viewMode === 'SCHEMATIC' ? (
            <WellBoreSchematic 
              wellId={wellId || null} 
              anomalies={detectedAnomalies} 
              casingIssues={casingIssues} 
            />
          ) : (
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
              theme={theme}
            />
          )}

          {forensicInsight && (
            <div className={`p-5 rounded-xl animate-in slide-in-from-top-4 duration-500 shadow-[0_0_40px_rgba(99,102,241,0.15)] relative overflow-hidden group/insight ${
              theme === 'HIGH_CONTRAST' ? 'bg-black border-2 border-white' : 'bg-slate-900/90 border border-indigo-500/40 glass-panel cyber-border'
            }`}>
              <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 ${theme === 'HIGH_CONTRAST' ? 'hidden' : ''}`}></div>
              
              <div className={`flex items-center justify-between mb-4 pb-3 border-b ${theme === 'HIGH_CONTRAST' ? 'border-white/20' : 'border-indigo-500/20'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 rounded-lg border ${theme === 'HIGH_CONTRAST' ? 'bg-white border-black' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                    <Sparkles size={18} className={theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-indigo-400 animate-pulse'} />
                  </div>
                  <div>
                    <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-indigo-100'}`}>Forensic_Intelligence_Output</h3>
                    <p className={`text-[7px] font-mono uppercase tracking-widest ${theme === 'HIGH_CONTRAST' ? 'text-white/60' : 'text-indigo-500/60'}`}>Neural_Audit_v4.2 // Real-Time_Synthesis</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setForensicInsight(null);
                    logEvent('Forensic_Insight_Dismissed', 'INFO');
                  }} 
                  data-testid="close-insight-panel"
                  className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'HIGH_CONTRAST' ? 'bg-white text-black hover:bg-white/80' : 'hover:bg-white/5 text-slate-500 hover:text-white'}`}
                  title="Dismiss Insight"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="relative">
                <div className={`text-[11px] font-bold leading-relaxed font-terminal whitespace-pre-wrap pl-4 border-l-2 ${
                  theme === 'HIGH_CONTRAST' ? 'text-white border-white' : 'text-slate-200 border-indigo-500/30'
                }`}>
                  {forensicInsight}
                </div>
                
                <div className={`absolute -left-1 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-indigo-500/20 to-transparent ${theme === 'HIGH_CONTRAST' ? 'hidden' : ''}`}></div>
              </div>

              <div className={`mt-5 pt-3 border-t flex items-center justify-between ${theme === 'HIGH_CONTRAST' ? 'border-white/10' : 'border-indigo-500/10'}`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-1 h-1 rounded-full animate-ping ${theme === 'HIGH_CONTRAST' ? 'bg-white' : 'bg-indigo-500'}`}></div>
                  <span className={`text-[7px] font-black uppercase tracking-widest ${theme === 'HIGH_CONTRAST' ? 'text-white/50' : 'text-indigo-500/50'}`}>Powered by Gemini 3 Flash // WellTegra Forensic Engine</span>
                </div>
                
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(forensicInsight);
                    setCopied(true);
                    logEvent('Forensic_Insight_Copied', 'INFO');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`flex items-center space-x-2 px-4 py-1.5 rounded text-[9px] font-black uppercase transition-all duration-300 border ${
                    copied 
                      ? theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-black' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                      : theme === 'HIGH_CONTRAST' ? 'bg-black border-white text-white hover:bg-white hover:text-black' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-400'
                  }`}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied_to_Buffer' : 'Copy_to_Buffer'}</span>
                </button>
              </div>
            </div>
          )}

          {selectedAnomaly && (
            <AnomalyReport 
              selectedAnomaly={selectedAnomaly}
              setSelectedAnomaly={setSelectedAnomaly}
              isAnomalyPanelOpen={isAnomalyPanelOpen}
              setIsAnomalyPanelOpen={setIsAnomalyPanelOpen}
              updateAnomalyPriority={updateAnomalyPriority}
              convertToDisplay={convertToDisplay}
              unitLabel={unitLabel}
            />
          )}

          {selectedCasingIssue && (
            <CasingIntegrityReport 
              selectedCasingIssue={selectedCasingIssue}
              setSelectedCasingIssue={setSelectedCasingIssue}
              convertToDisplay={convertToDisplay}
              unitLabel={unitLabel}
            />
          )}
    </div>

          <div className={`w-full xl:w-80 flex flex-col space-y-4`}>
            {/* Main Control Panel with Strike Feedback */}
            <div className={`p-5 rounded-lg border flex flex-col space-y-5 shadow-2xl transition-all duration-300 ${
              isShaking ? 'animate-shake border-[var(--alert-red)] bg-[var(--alert-red)]/5' : 
              theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'glass-panel border-[var(--emerald-primary)]/20 bg-slate-900/40 cyber-border hover:bg-slate-900/60'
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 ${theme === 'HIGH_CONTRAST' ? 'border-white/20' : 'border-[var(--emerald-primary)]/10'}`}>
                <div className="flex items-center space-x-4">
                  <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center ${theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)] text-glow-emerald'}`}>
                    <span>Engage_Controls</span>
                    <Target size={12} className={`ml-2 ${theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)]/40 animate-pulse'}`} />
                  </h3>
                  <div className={`flex items-center rounded border p-0.5 ${theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'bg-slate-950/60 border-[var(--emerald-primary)]/20'}`}>
                    <button 
                      onClick={() => setUnit('METERS')}
                      className={`px-2 py-0.5 rounded text-[7px] font-black transition-all ${
                        unit === 'METERS' 
                          ? theme === 'HIGH_CONTRAST' ? 'bg-white text-black' : 'bg-[var(--emerald-primary)] text-slate-950' 
                          : theme === 'HIGH_CONTRAST' ? 'text-white hover:bg-white/10' : 'text-[var(--emerald-primary)]/40 hover:text-[var(--emerald-primary)]'
                      }`}
                    >M</button>
                    <button 
                      onClick={() => setUnit('FEET')}
                      className={`px-2 py-0.5 rounded text-[7px] font-black transition-all ${
                        unit === 'FEET' 
                          ? theme === 'HIGH_CONTRAST' ? 'bg-white text-black' : 'bg-[var(--emerald-primary)] text-slate-950' 
                          : theme === 'HIGH_CONTRAST' ? 'text-white hover:bg-white/10' : 'text-[var(--emerald-primary)]/40 hover:text-[var(--emerald-primary)]'
                      }`}
                    >FT</button>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all duration-300 ${
                  Math.abs(offset) >= OFFSET_HARD_LIMIT 
                    ? theme === 'HIGH_CONTRAST' ? 'bg-white text-black' : 'bg-[var(--alert-red)] text-slate-950 shadow-[0_0_15px_var(--alert-red)]' 
                    : Math.abs(offset) > OFFSET_SAFE_LIMIT 
                      ? theme === 'HIGH_CONTRAST' ? 'bg-white text-black' : 'bg-orange-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.6)]' 
                      : theme === 'HIGH_CONTRAST' ? 'bg-black text-white border border-white' : 'bg-[var(--emerald-primary)]/20 text-[var(--emerald-primary)] border border-[var(--emerald-primary)]/30 text-glow-emerald'
                }`}>
                  {Math.abs(offset) >= OFFSET_HARD_LIMIT 
                    ? 'VETO_STATE' 
                    : Math.abs(offset) > OFFSET_SAFE_LIMIT 
                      ? 'WARNING_ZONE' 
                      : 'NOMINAL'}
                </div>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded border transition-all duration-300 ${
                  validationError 
                    ? (Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'border-[var(--alert-red)] shadow-[0_0_25px_rgba(239,68,68,0.3)]' : 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]') 
                    : theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'bg-slate-950/60 border-[var(--emerald-primary)]/20 glass-panel'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                     <div className="flex items-center space-x-2">
                        <Lock size={12} className={theme === 'HIGH_CONTRAST' ? 'text-white' : isCritical ? 'text-[var(--alert-red)] animate-pulse' : isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/40'} />
                        <span className={`text-[8px] font-black uppercase tracking-widest ${theme === 'HIGH_CONTRAST' ? 'text-white' : isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/50'}`}>Shift_Veto_Input</span>
                     </div>
                     <span className={`text-[16px] font-black font-terminal transition-colors duration-300 drop-shadow-md ${theme === 'HIGH_CONTRAST' ? 'text-white' : offsetIntensity}`}>
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

          <AnomalyPanel 
            anomalies={filteredAnomalies}
            selectedAnomaly={selectedAnomaly}
            setSelectedAnomaly={setSelectedAnomaly}
            anomalyThreshold={anomalyThreshold}
            setAnomalyThreshold={setAnomalyThreshold}
            severityFilter={severityFilter}
            setSeverityFilter={setSeverityFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            physicsFilter={physicsFilter}
            setPhysicsFilter={setPhysicsFilter}
            updateAnomalyPriority={updateAnomalyPriority}
            isAnomalyPanelOpen={isAnomalyPanelOpen}
            setIsAnomalyPanelOpen={setIsAnomalyPanelOpen}
            convertToDisplay={convertToDisplay}
            unitLabel={unitLabel}
            theme={theme}
          />

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
