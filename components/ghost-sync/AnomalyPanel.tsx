import React from 'react';
import { 
  AlertTriangle, 
  SlidersHorizontal, 
  Calendar, 
  Fingerprint, 
  ShieldAlert, 
  Target, 
  Activity, 
  Globe2, 
  Clock, 
  Info, 
  X,
  ShieldCheck
} from 'lucide-react';
import { SyncAnomaly } from '../../types';
import { ThemeType } from '../../src/context/ThemeContext';
import ProvenanceTooltip from '../ProvenanceTooltip';

interface AnomalyPanelProps {
  anomalies: SyncAnomaly[];
  selectedAnomaly: SyncAnomaly | null;
  setSelectedAnomaly: (anomaly: SyncAnomaly | null) => void;
  anomalyThreshold: number;
  setAnomalyThreshold: (val: number) => void;
  severityFilter: 'ALL' | 'CRITICAL' | 'WARNING';
  setSeverityFilter: (val: 'ALL' | 'CRITICAL' | 'WARNING') => void;
  dateFilter: 'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS';
  setDateFilter: (val: 'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS') => void;
  updateAnomalyPriority: (id: string, priority: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  isAnomalyPanelOpen: boolean;
  setIsAnomalyPanelOpen: (val: boolean) => void;
  convertToDisplay: (val: number) => number;
  unitLabel: string;
  theme: ThemeType;
}

const AnomalyPanel: React.FC<AnomalyPanelProps> = ({
  anomalies,
  selectedAnomaly,
  setSelectedAnomaly,
  anomalyThreshold,
  setAnomalyThreshold,
  severityFilter,
  setSeverityFilter,
  dateFilter,
  setDateFilter,
  updateAnomalyPriority,
  isAnomalyPanelOpen,
  setIsAnomalyPanelOpen,
  convertToDisplay,
  unitLabel,
  theme
}) => {
  return (
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
        {anomalies.length === 0 ? (
          <div className="text-[10px] text-slate-600 font-terminal text-center py-8 uppercase tracking-widest italic opacity-50">NO ANOMALIES FOUND</div>
        ) : (
          anomalies.map(anomaly => (
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
  );
};

export default AnomalyPanel;
