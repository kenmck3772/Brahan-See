
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Binary, Ghost, Loader2, Zap, 
  Play, RotateCw, CheckCircle2, 
  AlertTriangle, Activity, ScanLine, Target, 
  Globe2, Send, ShieldAlert, AlertOctagon, Search,
  Eye, Filter, Lock, Unlock, ShieldX, ShieldCheck,
  Link, Info
} from 'lucide-react';
import { MOCK_BASE_LOG, MOCK_GHOST_LOG } from '../constants';
import { TraumaEvent } from '../types';
import SyncMonitorChart from './SyncMonitorChart';

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
}

const OFFSET_SAFE_LIMIT = 20;
const OFFSET_HARD_LIMIT = 30;
const AUTO_SYNC_TARGET = 14.5;

const GhostSync: React.FC = () => {
  const [offset, setOffset] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [viewMode, setViewMode] = useState<'OVERLAY' | 'DIFFERENTIAL'>('OVERLAY');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  
  // Remote Data Fetching State
  const [showFetchInput, setShowFetchInput] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  // Anomaly Detection State
  const [anomalyThreshold, setAnomalyThreshold] = useState(25);
  const [isScanningAnomalies, setIsScanningAnomalies] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedAnomalies, setDetectedAnomalies] = useState<SyncAnomaly[]>([]);

  const [signals, setSignals] = useState<SignalMetadata[]>([
    { id: 'SIG-001', name: 'BASE_LOG', color: '#10b981', visible: true },
    { id: 'SIG-002', name: 'GHOST_LOG', color: '#FF5F1F', visible: true }
  ]);

  const [remoteLogs, setRemoteLogs] = useState<Record<string, Record<number, number>>>({});

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
    let newVal = val;
    let error: string | null = null;

    if (Math.abs(newVal) > OFFSET_HARD_LIMIT) {
      newVal = Math.sign(newVal) * OFFSET_HARD_LIMIT;
      error = `CRITICAL VETO: MAX LIMIT ±${OFFSET_HARD_LIMIT}M REACHED`;
      triggerShake();
    } else if (Math.abs(newVal) > OFFSET_SAFE_LIMIT) {
      error = `WARNING: EXTREME SHIFT ENVELOPE ACTIVATED`;
    }

    setOffset(newVal);
    setValidationError(error);
  };

  const handleToggleSignal = useCallback((keyOrId: string) => {
    // Map Recharts dataKey back to internal Signal ID
    let targetId = keyOrId;
    if (keyOrId === 'baseGR') targetId = 'SIG-001';
    if (keyOrId === 'ghostGR') targetId = 'SIG-002';

    setSignals(prev => prev.map(s => s.id === targetId ? { ...s, visible: !s.visible } : s));
  }, []);

  const animateSync = useCallback(() => {
    if (isSyncing) return;
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
      }
    };
    requestAnimationFrame(step);
  }, [offset, isSyncing]);

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
    setIsScanningAnomalies(true);
    setDetectedAnomalies([]);
    setScanProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        
        const anomalies: SyncAnomaly[] = [];
        let currentAnomaly: { start: number, sum: number, count: number } | null = null;

        combinedData.forEach((row, idx) => {
          if (row.ghostGR !== null && row.diff > anomalyThreshold) {
            if (!currentAnomaly) {
              currentAnomaly = { start: row.depth, sum: row.diff, count: 1 };
            } else {
              currentAnomaly.sum += row.diff;
              currentAnomaly.count += 1;
            }
          } else if (currentAnomaly) {
            const avgDiff = currentAnomaly.sum / currentAnomaly.count;
            anomalies.push({
              id: `ANOM-${Math.random().toString(36).substring(7).toUpperCase()}`,
              startDepth: currentAnomaly.start,
              endDepth: combinedData[idx - 1].depth,
              avgDiff,
              severity: avgDiff > anomalyThreshold * 1.5 ? 'CRITICAL' : 'WARNING'
            });
            currentAnomaly = null;
          }
        });
        setDetectedAnomalies(anomalies);
        setIsScanningAnomalies(false);
        setTimeout(() => setScanProgress(0), 500); // Clear progress after a short delay

        // Log detected anomalies to the black box
        if (anomalies.length > 0) {
          try {
            const existingLogsStr = localStorage.getItem('BRAHAN_BLACK_BOX_LOGS');
            const existingLogs: TraumaEvent[] = existingLogsStr ? JSON.parse(existingLogsStr) : [];
            
            const newEvents: TraumaEvent[] = anomalies.map(anomaly => ({
              timestamp: new Date().toISOString(),
              layer: 'GHOST_SYNC',
              depth: Math.round((anomaly.startDepth + anomaly.endDepth) / 2), // Center of anomaly
              value: Number(anomaly.avgDiff.toFixed(2)),
              unit: 'API',
              severity: anomaly.severity,
              description: `GhostSync discrepancy detected between ${anomaly.startDepth}m and ${anomaly.endDepth}m. Trace ID: ${anomaly.id}`
            }));

            const updatedLogs = [...newEvents, ...existingLogs].slice(0, 100);
            localStorage.setItem('BRAHAN_BLACK_BOX_LOGS', JSON.stringify(updatedLogs));
            
            // Dispatch a custom event so TraumaNode can update its logs if it's mounted
            window.dispatchEvent(new Event('storage'));
          } catch (e) {
            console.error("Failed to log GhostSync anomalies to black box", e);
          }
        }
      }
    }, 120);
  }, [combinedData, anomalyThreshold]);

  const handleFetchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteUrl) return;

    setIsFetching(true);
    // Simulated fetch logic
    setTimeout(() => {
      const fileName = remoteUrl.split('/').pop() || 'REMOTE_LOG';
      const newSigId = `SIG-REMOTE-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
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

      setIsFetching(false);
      setShowFetchInput(false);
      setRemoteUrl('');
    }, 1800);
  };

  const ghostLabel = isAdjusting ? "OFFSET_LOG" : "GHOST_LOG"; // Dynamically set the ghost label
  const offsetIntensity = Math.abs(offset) > OFFSET_SAFE_LIMIT ? 'text-red-500' : Math.abs(offset) > 10 ? 'text-orange-500' : 'text-emerald-400';

  return (
    <div className="flex flex-col h-full p-4 space-y-4 font-terminal bg-slate-950/20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className={`p-2 bg-emerald-500/10 border border-emerald-500/30 rounded transition-all ${Math.abs(offset) > OFFSET_SAFE_LIMIT ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}`}>
            {Math.abs(offset) > OFFSET_SAFE_LIMIT ? <ShieldX size={24} className="text-red-500 animate-pulse" /> : <Ghost size={24} className="text-emerald-400" />}
          </div>
          <div>
            <h2 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Ghost_Sync_Engine</h2>
            <div className="flex items-center space-x-2 text-[8px] text-emerald-800 font-black uppercase tracking-widest">
              <ScanLine size={10} />
              <span>Datum_Correlation_Array</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setShowFetchInput(!showFetchInput)}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border ${showFetchInput ? 'bg-cyan-500/20 border-cyan-500 text-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-900 border-cyan-900/40 text-cyan-400 hover:border-cyan-400'}`}
          >
            <Globe2 size={14} />
            <span>Fetch_Remote_Data</span>
          </button>

          <button 
            onClick={runAnomalyScan}
            disabled={isScanningAnomalies || isSyncing}
            className={`relative overflow-hidden flex items-center space-x-2 px-4 py-2 rounded text-[10px] font-black uppercase transition-all border ${isScanningAnomalies ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-slate-900 border-orange-900/40 text-orange-400 hover:border-orange-400'}`}
          >
            {isScanningAnomalies && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-orange-500/20 transition-all duration-100"
                style={{ width: `${scanProgress}%` }}
              />
            )}
            <div className="relative z-10 flex items-center space-x-2">
              {isScanningAnomalies ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>{isScanningAnomalies ? `Scanning... ${scanProgress}%` : 'Forensic_Scan'}</span>
            </div>
          </button>

          <button 
            onClick={() => setViewMode(prev => prev === 'OVERLAY' ? 'DIFFERENTIAL' : 'OVERLAY')}
            className={`px-4 py-2 border rounded text-[10px] font-black uppercase transition-all ${viewMode === 'DIFFERENTIAL' ? 'bg-orange-500 border-orange-400 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-slate-900 border-emerald-900/40 text-emerald-400'}`}
          >
            {viewMode}
          </button>
          
          <button 
            onClick={autoLineup}
            disabled={isSyncing}
            className="flex items-center space-x-2 px-6 py-2 bg-emerald-500 text-slate-950 rounded font-black text-[10px] uppercase tracking-widest hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50"
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />}
            <span>Auto_Lineup</span>
          </button>
        </div>
      </div>

      {/* Remote Data Fetch Input Form */}
      {showFetchInput && (
        <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300 shadow-2xl">
          <form onSubmit={handleFetchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-cyan-900">
                <Link size={14} />
              </div>
              <input 
                type="text" 
                placeholder="Enter URL for .LAS or .CSV log file (e.g., https://ndr.archive/well/thistle.las)"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                autoFocus
                className="w-full bg-slate-900 border border-cyan-900/40 rounded px-10 py-2 text-[10px] text-cyan-100 outline-none focus:border-cyan-500 transition-all font-terminal"
              />
            </div>
            <button 
              type="submit" 
              disabled={isFetching || !remoteUrl}
              className="w-full md:w-auto px-6 py-2 bg-cyan-600 text-slate-950 rounded font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
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

      <div className="flex-1 flex flex-col xl:flex-row gap-4 min-h-0">
        <SyncMonitorChart 
          combinedData={combinedData} 
          signals={signals} 
          viewMode={viewMode} 
          ghostLabel={ghostLabel} 
          validationError={validationError}
          offset={offset}
          anomalies={detectedAnomalies}
          onToggleSignal={handleToggleSignal}
        />

        <div className="w-full xl:w-80 flex flex-col space-y-4">
          {/* Main Control Panel with Strike Feedback */}
          <div className={`glass-panel p-5 rounded-lg border bg-slate-900/60 flex flex-col space-y-5 shadow-xl transition-all duration-300 ${isShaking ? 'animate-shake border-red-500 bg-red-500/5' : 'border-emerald-900/30'}`}>
            <div className="flex items-center justify-between border-b border-emerald-900/20 pb-2">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center">
                <span>Engage_Controls</span>
                <Target size={12} className="ml-2 text-emerald-900" />
              </h3>
              <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${Math.abs(offset) > OFFSET_SAFE_LIMIT ? 'bg-red-500 text-slate-950' : 'bg-emerald-900/30 text-emerald-500'}`}>
                {Math.abs(offset) > OFFSET_SAFE_LIMIT ? 'VETO_STATE' : 'NOMINAL'}
              </div>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded border bg-slate-950/90 transition-all ${validationError ? (Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-orange-500') : 'border-emerald-900/40'}`}>
                <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center space-x-2">
                      <Lock size={12} className={Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'text-red-500 animate-pulse' : 'text-emerald-900'} />
                      <span className="text-[8px] font-black text-emerald-900 uppercase">Shift_Veto_Input</span>
                   </div>
                   <span className={`text-[16px] font-black font-terminal transition-colors ${offsetIntensity}`}>
                     {offset.toFixed(3)}m
                   </span>
                </div>
                
                <div className="flex space-x-2">
                  <input 
                    type="number"
                    step="0.001"
                    min={-OFFSET_HARD_LIMIT}
                    max={OFFSET_HARD_LIMIT}
                    value={offset.toFixed(3)}
                    onFocus={() => setIsAdjusting(true)}
                    onBlur={() => setIsAdjusting(false)}
                    onChange={(e) => handleOffsetChange(parseFloat(e.target.value) || 0)}
                    className={`flex-1 bg-slate-900 border rounded px-3 py-2 text-[11px] font-terminal outline-none transition-all ${Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'border-red-500 text-red-500' : 'border-emerald-900/30 text-emerald-100 focus:border-emerald-500'}`}
                  />
                  <button 
                    onClick={animateSync}
                    disabled={isSyncing}
                    title="Animate Alignment"
                    className="px-3 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
                  </button>
                  <button 
                    onClick={() => handleOffsetChange(0)}
                    title="Reset Offset"
                    className="px-3 bg-slate-800 text-emerald-900 hover:text-emerald-400 rounded transition-colors"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 px-1">
                <div className="flex justify-between text-[8px] font-black text-emerald-900 uppercase tracking-widest">
                  <span>Manual_Override</span>
                  <span className={Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'text-red-500' : ''}>HARD_LIMIT: ±{OFFSET_HARD_LIMIT}m</span>
                </div>
                {/* Visual Danger Zone Slider */}
                <div className="relative h-6 flex items-center">
                  <div className="absolute inset-0 h-1.5 my-auto rounded-full bg-slate-800 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 via-emerald-400 to-emerald-400 via-orange-500 to-red-600 opacity-20"></div>
                  </div>
                  <input 
                    type="range" min={-OFFSET_HARD_LIMIT} max={OFFSET_HARD_LIMIT} step="0.01" 
                    value={offset} 
                    onMouseDown={() => setIsAdjusting(true)}
                    onMouseUp={() => setIsAdjusting(false)}
                    onTouchStart={() => setIsAdjusting(true)}
                    onTouchEnd={() => setIsAdjusting(false)}
                    onChange={e => handleOffsetChange(parseFloat(e.target.value))}
                    className={`w-full h-1.5 bg-transparent appearance-none rounded-full cursor-pointer z-10 accent-current transition-all ${offsetIntensity}`} 
                  />
                </div>
              </div>

              {validationError && (
                <div className={`p-3 rounded border animate-in slide-in-from-top-1 flex items-start space-x-3 ${Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-orange-500/10 border-orange-500/40 text-orange-400'}`}>
                  <AlertOctagon size={16} className="flex-shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase leading-tight">{validationError}</span>
                    <span className="text-[7px] opacity-60 uppercase font-mono mt-1">Manual Veto Active // Adjust Input</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 glass-panel p-5 rounded-lg border border-emerald-900/30 bg-slate-900/60 overflow-y-auto custom-scrollbar shadow-xl">
            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center">
               <ScanLine size={12} className="mr-2" /> Signal_Stack
            </h3>
            <div className="space-y-2">
              {signals.map(sig => (
                <div 
                  key={sig.id} 
                  onClick={() => handleToggleSignal(sig.id)}
                  role="button"
                  aria-pressed={sig.visible}
                  className={`flex items-center justify-between p-2.5 bg-slate-950/80 border rounded hover:border-emerald-500/30 transition-all cursor-pointer group ${sig.visible ? 'border-emerald-900/40 shadow-sm' : 'border-red-950/20 opacity-40 grayscale'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: sig.color, color: sig.color }}></div>
                    <span className="text-[9px] font-black text-emerald-100 uppercase truncate">{sig.id === 'SIG-002' ? ghostLabel : sig.name}</span>
                  </div>
                  {sig.visible ? <CheckCircle2 size={12} className="text-emerald-500" /> : <ShieldAlert size={12} className="text-red-900" />}
                </div>
              ))}
            </div>
          </div>

          <button className="flex items-center justify-center space-x-3 w-full py-4 bg-slate-950/90 border border-emerald-500/20 rounded-lg text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-400 transition-all group shadow-xl">
             <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Notarize_Sync_Truth</span>
          </button>
        </div>
      </div>

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
