import React, { useState, useMemo, useEffect } from 'react';
import { 
  Database, Search, X, Calendar, RefreshCw, 
  Download, Info, Trash2, Fingerprint, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeType } from '../../src/context/ThemeContext';

export interface GhostLogEntry {
  id: string;
  timestamp: string;
  event: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metadata?: any;
}

interface GhostSyncLogsPanelProps {
  logs: GhostLogEntry[];
  refreshLogs: () => void;
  onClose: () => void;
  theme: ThemeType;
}

const GhostSyncLogsPanel: React.FC<GhostSyncLogsPanelProps> = ({ 
  logs, 
  refreshLogs, 
  onClose, 
  theme
}) => {
  const [logSeverityFilter, setLogSeverityFilter] = useState<'ALL' | 'INFO' | 'WARNING' | 'CRITICAL'>('ALL');
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLogs(newExpanded);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSeverity = logSeverityFilter === 'ALL' || log.severity === logSeverityFilter;
      const matchesSearch = logSearchTerm === '' || 
        (log.event?.toLowerCase().includes(logSearchTerm.toLowerCase()) ?? false) ||
        (log.id?.toLowerCase().includes(logSearchTerm.toLowerCase()) ?? false) ||
        (JSON.stringify(log.metadata)?.toLowerCase().includes(logSearchTerm.toLowerCase()) ?? false);
      
      return matchesSeverity && matchesSearch;
    });
  }, [logs, logSeverityFilter, logSearchTerm]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`relative z-50 border rounded-xl p-4 shadow-2xl transition-all duration-300 ${
        theme === 'CLEAN' ? 'bg-white border-slate-200' :
        theme === 'HIGH_CONTRAST' ? 'bg-white border-black' :
        'bg-slate-950/95 border-emerald-500/30 glass-panel cyber-border'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center space-x-2">
          <Database size={16} className="text-emerald-500" />
          <h3 className={`text-xs font-black uppercase tracking-widest ${theme === 'CLEAN' ? 'text-slate-900' : 'text-white'}`}>Ghost_Sync_Audit_Trail</h3>
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
              className="bg-transparent text-[8px] text-emerald-400 font-mono focus:outline-none w-32"
            />
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

          <div className="flex items-center space-x-2">
            <button 
              onClick={refreshLogs}
              className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors bg-slate-900/50 rounded border border-slate-800"
              title="Refresh Logs"
            >
              <RefreshCw size={14} />
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white transition-colors bg-slate-900/50 rounded border border-slate-800">
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar pr-2 font-terminal">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-700 border border-dashed border-slate-800 rounded bg-slate-950/20">
            <Database size={32} className="opacity-10 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">
              No forensic events recorded matching criteria
            </span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className={`group relative flex flex-col p-3 bg-slate-900/30 border-l-2 rounded hover:bg-slate-900/50 transition-all ${
                log.severity === 'CRITICAL' ? 'border-red-500/50' :
                log.severity === 'WARNING' ? 'border-orange-500/50' :
                'border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    log.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse' :
                    log.severity === 'WARNING' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                    'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  }`}></div>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                    log.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                    log.severity === 'WARNING' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' :
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  }`}>
                    {log.severity}
                  </span>
                  <span className={`text-[10px] font-bold ${theme === 'CLEAN' ? 'text-slate-900' : 'text-slate-200'}`}>
                    {log.event}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[8px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleDateString()}</span>
                  <span className="text-[8px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  {log.metadata && (
                    <button 
                      onClick={() => toggleExpand(log.id)}
                      className="p-1 text-slate-500 hover:text-emerald-400 transition-colors"
                    >
                      {expandedLogs.has(log.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedLogs.has(log.id) && log.metadata && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-2 bg-black/40 rounded border border-slate-800/50 font-mono text-[8px] text-emerald-300/80 break-all whitespace-pre-wrap">
                      {JSON.stringify(log.metadata, null, 2)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[6px] font-mono text-slate-700 uppercase">ID: {log.id}</span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-900/50">
        <div className="flex items-center space-x-2 text-[7px] text-slate-600 font-black uppercase tracking-widest">
          <Info size={10} />
          <span>Ghost Sync Forensic Audit Trail // Detailed Metadata Enabled</span>
        </div>
        <button 
          onClick={() => {
            if (window.confirm('Are you sure you want to clear the Ghost Sync audit trail?')) {
              localStorage.removeItem('ghost_sync_logs');
              refreshLogs();
            }
          }}
          className="flex items-center space-x-1.5 text-[8px] font-black uppercase text-slate-600 hover:text-red-500 transition-colors group"
        >
          <Trash2 size={10} className="group-hover:animate-bounce" />
          <span>Purge_Logs</span>
        </button>
      </div>
    </motion.div>
  );
};

export default GhostSyncLogsPanel;
