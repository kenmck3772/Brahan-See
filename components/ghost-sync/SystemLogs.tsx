import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Database, Search, X, Calendar, RefreshCw, 
  Download, Info, Trash2, Fingerprint 
} from 'lucide-react';
import { TraumaEvent } from '../../types';
import { ThemeType } from '../../src/context/ThemeContext';

interface SystemLogsProps {
  logs: TraumaEvent[];
  refreshLogs: () => void;
  onClose: () => void;
  theme: ThemeType;
  convertToDisplay: (val: number) => number;
  unitLabel: string;
}

const SystemLogs: React.FC<SystemLogsProps> = ({ 
  logs, 
  refreshLogs, 
  onClose, 
  theme,
  convertToDisplay,
  unitLabel
}) => {
  const [logSeverityFilter, setLogSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');
  const [logStartDate, setLogStartDate] = useState<string>('');
  const [logEndDate, setLogEndDate] = useState<string>('');
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  const getLogContext = (log: TraumaEvent) => {
    const isCritical = log.severity === 'CRITICAL';
    const isWarning = log.severity === 'WARNING';
    
    let context = "Standard system operation trace.";
    let rootCause = "Nominal process execution.";
    
    if (log.description?.includes('File_Upload')) {
      context = "Ingress of external forensic data into the local correlation buffer.";
      rootCause = isCritical ? "File integrity check failed or size limit exceeded." : "Manual user intervention in data stack.";
    } else if (log.description?.includes('Harvester')) {
      context = "Real-time data stream from the WellTegra Harvester engine.";
      rootCause = "Automated synchronization of remote sensor data.";
    } else if (log.description?.includes('Shift')) {
      context = "Adjustment of the vertical datum to align legacy and modern datasets.";
      rootCause = "Correction of historical depth discrepancies detected by physics engine.";
    } else if (isCritical) {
      context = "High-priority system anomaly requiring immediate forensic audit.";
      rootCause = "Potential data corruption or physical constraint violation detected.";
    } else if (isWarning) {
      context = "System variance detected outside of nominal operating envelopes.";
      rootCause = "Sensor drift or minor dataset inconsistency.";
    }

    return { context, rootCause };
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSeverity = logSeverityFilter === 'ALL' || log.severity === logSeverityFilter;
      const logDate = new Date(log.timestamp);
      
      const matchesSearch = logSearchTerm === '' || 
        (log.description?.toLowerCase().includes(logSearchTerm.toLowerCase()) ?? false) ||
        (log.layer?.toLowerCase().includes(logSearchTerm.toLowerCase()) ?? false) ||
        (log.id?.toLowerCase().includes(logSearchTerm.toLowerCase()) ?? false);

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
      
      return matchesSeverity && matchesStartDate && matchesEndDate && matchesSearch;
    });
  }, [logs, logSeverityFilter, logStartDate, logEndDate, logSearchTerm]);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs]);

  return (
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
          <div className="flex items-center space-x-2 bg-slate-900/80 p-1 rounded border border-slate-800">
            <Search size={10} className="text-slate-500 ml-1" />
            <input 
              type="text"
              placeholder="Search logs..."
              value={logSearchTerm}
              onChange={e => setLogSearchTerm(e.target.value)}
              className="bg-transparent text-[8px] text-emerald-400 font-mono focus:outline-none w-24"
            />
            {logSearchTerm && (
              <button onClick={() => setLogSearchTerm('')} className="text-slate-500 hover:text-white">
                <X size={8} />
              </button>
            )}
          </div>

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
            {(logStartDate || logEndDate || logSeverityFilter !== 'ALL' || logSearchTerm) && (
              <button 
                onClick={() => {
                  setLogStartDate('');
                  setLogEndDate('');
                  setLogSeverityFilter('ALL');
                  setLogSearchTerm('');
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
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white transition-colors bg-slate-900/50 rounded border border-slate-800">
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
            {filteredLogs.map((log) => {
              const { context, rootCause } = getLogContext(log);
              return (
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

                  {/* Forensic Tooltip */}
                  <div className="absolute left-full ml-2 top-0 w-64 p-3 bg-slate-900 border border-emerald-500/30 rounded-lg shadow-2xl invisible group-hover:visible z-[100] animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-none">
                    <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-800">
                      <Fingerprint size={12} className="text-emerald-500" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest">Forensic_Audit_Detail</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[7px] font-black text-emerald-500/50 uppercase tracking-tighter mb-1">Context_Analysis</div>
                        <p className="text-[8px] text-slate-300 leading-tight italic">{context}</p>
                      </div>
                      <div>
                        <div className="text-[7px] font-black text-red-500/50 uppercase tracking-tighter mb-1">Potential_Root_Cause</div>
                        <p className="text-[8px] text-slate-300 leading-tight">{rootCause}</p>
                      </div>
                      <div className="pt-2 flex justify-between items-center border-t border-slate-800/50">
                        <span className="text-[6px] text-slate-600 uppercase font-mono">Trace_ID: {log.id}</span>
                        <span className={`text-[6px] font-black px-1 rounded ${
                          log.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'
                        }`}>{log.severity}</span>
                      </div>
                    </div>
                    <div className="absolute -left-1 top-4 w-2 h-2 bg-slate-900 border-l border-b border-emerald-500/30 rotate-45"></div>
                  </div>
                </div>
              );
            })}
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
  );
};

export default SystemLogs;
