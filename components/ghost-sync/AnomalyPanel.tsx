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
  physicsFilter: 'ALL' | 'VERIFIED';
  setPhysicsFilter: (val: 'ALL' | 'VERIFIED') => void;
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
  physicsFilter,
  setPhysicsFilter,
  updateAnomalyPriority,
  isAnomalyPanelOpen,
  setIsAnomalyPanelOpen,
  convertToDisplay,
  unitLabel,
  theme
}) => {
  const logFilterChange = (filterName: string, value: string) => {
    const logs = JSON.parse(localStorage.getItem('ghost_sync_logs') || '[]');
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      event: `Filter_Updated: ${filterName}`,
      level: 'INFO',
      details: { value }
    };
    localStorage.setItem('ghost_sync_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
    
    // Also log to black box
    const blackBox = JSON.parse(localStorage.getItem('BRAHAN_BLACK_BOX_LOGS') || '[]');
    localStorage.setItem('BRAHAN_BLACK_BOX_LOGS', JSON.stringify([{
      ...newLog,
      module: 'GHOST_SYNC',
      type: 'USER_ACTION'
    }, ...blackBox].slice(0, 500)));
  };

  return (
    <div className={`flex-1 p-5 rounded-lg border flex flex-col overflow-hidden shadow-2xl transition-colors duration-300 ${
      theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'glass-panel border-[var(--emerald-primary)]/20 bg-slate-900/40 cyber-border hover:bg-slate-900/60'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center ${
          theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)] text-glow-emerald'
        }`}>
           <AlertTriangle size={12} className={`mr-2 ${theme === 'HIGH_CONTRAST' ? '' : 'animate-pulse'}`} /> Detected_Anomalies
        </h3>
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex flex-col space-y-2">
          <div className={`flex justify-between items-center text-[8px] font-black uppercase tracking-widest ${
            theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)]/50 text-glow-emerald'
          }`}>
            <div className="flex items-center space-x-2">
              <SlidersHorizontal size={10} className={theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)]/60'} />
              <span>Detection_Threshold</span>
            </div>
            <span className={theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)] text-glow-emerald'}>{anomalyThreshold} API</span>
          </div>
          <div className="relative h-4 flex items-center">
            <div className={`absolute inset-0 h-1 my-auto rounded-full pointer-events-none border ${
              theme === 'HIGH_CONTRAST' ? 'bg-white/20 border-white/30' : 'bg-slate-800/50 border-slate-700/30'
            }`}></div>
            <input 
              type="range" min="5" max="100" step="1" 
              value={anomalyThreshold} 
              onChange={e => {
                const val = parseInt(e.target.value);
                setAnomalyThreshold(val);
                logFilterChange('Anomaly_Threshold', val.toString());
              }}
              className={`w-full h-1 bg-transparent appearance-none rounded-full cursor-pointer z-10 transition-all ${
                theme === 'HIGH_CONTRAST' ? 'accent-white' : 'accent-[var(--emerald-primary)]'
              }`} 
            />
          </div>
        </div>

        <div className="space-y-2">
          <span className={`text-[8px] font-black uppercase tracking-widest block ${
            theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)]/50 text-glow-emerald'
          }`}>Severity_Filter</span>
          <div className={`flex p-1 rounded border ${
            theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'bg-slate-950/80 border-[var(--emerald-primary)]/20 glass-panel'
          }`}>
            {(['ALL', 'CRITICAL', 'WARNING'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setSeverityFilter(sev);
                  logFilterChange('Severity_Filter', sev);
                }}
                className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all duration-300 ${
                  severityFilter === sev 
                    ? theme === 'HIGH_CONTRAST' ? 'bg-white text-black' : 'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                    : theme === 'HIGH_CONTRAST' ? 'text-white hover:bg-white/10' : 'text-[var(--emerald-primary)]/50 hover:text-[var(--emerald-primary)] hover:bg-[var(--emerald-primary)]/5'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className={`text-[8px] font-black uppercase tracking-widest block ${
            theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)]/50 text-glow-emerald'
          }`}>Temporal_Filter</span>
          <div className={`flex p-1 rounded border ${
            theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'bg-slate-950/80 border-[var(--emerald-primary)]/20 glass-panel'
          }`}>
            {(['ALL', 'LAST_7_DAYS', 'LAST_30_DAYS'] as const).map((date) => (
              <button
                key={date}
                onClick={() => {
                  setDateFilter(date);
                  logFilterChange('Temporal_Filter', date);
                }}
                className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all duration-300 ${
                  dateFilter === date 
                    ? theme === 'HIGH_CONTRAST' ? 'bg-white text-black' : 'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                    : theme === 'HIGH_CONTRAST' ? 'text-white hover:bg-white/10' : 'text-[var(--emerald-primary)]/50 hover:text-[var(--emerald-primary)] hover:bg-[var(--emerald-primary)]/5'
                }`}
              >
                {date.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className={`text-[8px] font-black uppercase tracking-widest block ${
            theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-[var(--emerald-primary)]/50 text-glow-emerald'
          }`}>Physics_Validation</span>
          <div className={`flex p-1 rounded border ${
            theme === 'HIGH_CONTRAST' ? 'bg-black border-white' : 'bg-slate-950/80 border-[var(--emerald-primary)]/20 glass-panel'
          }`}>
            {(['ALL', 'VERIFIED'] as const).map((phys) => (
              <button
                key={phys}
                onClick={() => {
                  setPhysicsFilter(phys);
                  logFilterChange('Physics_Filter', phys);
                }}
                className={`flex-1 py-1 text-[8px] font-black uppercase rounded transition-all duration-300 ${
                  physicsFilter === phys 
                    ? theme === 'HIGH_CONTRAST' ? 'bg-white text-black' : 'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                    : theme === 'HIGH_CONTRAST' ? 'text-white hover:bg-white/10' : 'text-[var(--emerald-primary)]/50 hover:text-[var(--emerald-primary)] hover:bg-[var(--emerald-primary)]/5'
                }`}
              >
                {phys}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
        {anomalies.length === 0 ? (
          <div className={`text-[10px] font-terminal text-center py-8 uppercase tracking-widest italic opacity-50 ${
            theme === 'HIGH_CONTRAST' ? 'text-white' : 'text-slate-600'
          }`}>NO ANOMALIES FOUND</div>
        ) : (
          anomalies.map(anomaly => (
            <div 
              key={anomaly.id}
              onClick={() => setSelectedAnomaly(anomaly)}
              className={`p-3 rounded border-l-4 cursor-pointer transition-all duration-300 group ${
                theme === 'HIGH_CONTRAST' 
                  ? selectedAnomaly?.id === anomaly.id ? 'bg-white text-black border-white' : 'bg-black text-white border-white/30 hover:bg-white/10'
                  : `glass-panel hover:bg-slate-800/60 ${selectedAnomaly?.id === anomaly.id 
                    ? `bg-slate-800/90 shadow-2xl cyber-border ${anomaly.severity === 'CRITICAL' ? 'border-red-500' : 'border-orange-500'}` 
                    : `bg-slate-950/40 ${anomaly.severity === 'CRITICAL' ? 'border-red-500/30 hover:border-red-500/60' : 'border-orange-500/30 hover:border-orange-500/60'}`}`
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-black transition-colors duration-300 ${
                    theme === 'HIGH_CONTRAST' 
                      ? selectedAnomaly?.id === anomaly.id ? 'text-black' : 'text-white'
                      : selectedAnomaly?.id === anomaly.id ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}>{anomaly.id}</span>
                  <span className={`text-[7px] font-black px-1 rounded ${
                    theme === 'HIGH_CONTRAST'
                      ? selectedAnomaly?.id === anomaly.id ? 'bg-black text-white' : 'bg-white text-black'
                      : anomaly.priority === 'HIGH' ? 'bg-blue-500/20 text-blue-400' :
                        anomaly.priority === 'MEDIUM' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {anomaly.priority}
                  </span>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded transition-all duration-300 ${
                  theme === 'HIGH_CONTRAST'
                    ? selectedAnomaly?.id === anomaly.id ? 'bg-black text-white' : 'bg-white text-black'
                    : anomaly.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : 'bg-orange-500/20 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.2)]'
                }`}>
                  {anomaly.severity}
                </span>
              </div>
              <div className={`flex justify-between items-center text-[9px] font-terminal ${
                theme === 'HIGH_CONTRAST' ? (selectedAnomaly?.id === anomaly.id ? 'text-black/70' : 'text-white/70') : 'text-slate-400'
              }`}>
                <span>{convertToDisplay(anomaly.startDepth).toFixed(1)}{unitLabel} - {convertToDisplay(anomaly.endDepth).toFixed(1)}{unitLabel}</span>
                <span className="flex items-center"><Calendar size={8} className="mr-1"/> {anomaly.detectedAt}</span>
              </div>

              {selectedAnomaly?.id === anomaly.id && (
                <div className={`mt-3 pt-3 border-t space-y-3 animate-in slide-in-from-top-1 duration-300 ${
                  theme === 'HIGH_CONTRAST' ? 'border-black/20' : 'border-slate-800/50'
                }`}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <span className={`text-[7px] uppercase font-black ${theme === 'HIGH_CONTRAST' ? 'text-black/50' : 'text-slate-500'}`}>Start_Depth</span>
                      <span className={`text-[10px] font-mono ${theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-slate-200'}`}>{convertToDisplay(anomaly.startDepth).toFixed(1)}{unitLabel}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[7px] uppercase font-black ${theme === 'HIGH_CONTRAST' ? 'text-black/50' : 'text-slate-500'}`}>End_Depth</span>
                      <span className={`text-[10px] font-mono ${theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-slate-200'}`}>{convertToDisplay(anomaly.endDepth).toFixed(1)}{unitLabel}</span>
                    </div>
                    <div className="flex flex-col col-span-2">
                      <span className={`text-[7px] uppercase font-black ${theme === 'HIGH_CONTRAST' ? 'text-black/50' : 'text-slate-500'}`}>Avg_Deviation</span>
                      <span className={`text-[10px] font-mono ${theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-orange-400'}`}>{anomaly.avgDiff.toFixed(2)} API</span>
                    </div>
                  </div>
                  
                  <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${theme === 'HIGH_CONTRAST' ? 'border-black/10' : 'border-slate-800/30'}`}>
                    <div className="flex flex-col">
                      <span className={`text-[7px] uppercase font-black ${theme === 'HIGH_CONTRAST' ? 'text-black/50' : 'text-slate-500'}`}>Truth_Level</span>
                      <span className={`text-[9px] font-black ${theme === 'HIGH_CONTRAST' ? 'text-black' : anomaly.truthLevel === 'FORENSIC' ? 'text-emerald-400' : 'text-blue-400'}`}>{anomaly.truthLevel}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[7px] uppercase font-black ${theme === 'HIGH_CONTRAST' ? 'text-black/50' : 'text-slate-500'}`}>Physics_Validation</span>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <ShieldCheck size={10} className={theme === 'HIGH_CONTRAST' ? 'text-black' : anomaly.physicsValidation === 'Verified' ? 'text-emerald-400' : 'text-slate-500'} />
                        <span className={`text-[8px] font-black ${theme === 'HIGH_CONTRAST' ? 'text-black' : anomaly.physicsValidation === 'Verified' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {anomaly.physicsValidation}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${theme === 'HIGH_CONTRAST' ? 'border-black/10' : 'border-slate-800/30'}`}>
                    <div className="flex flex-col">
                      <span className={`text-[7px] uppercase font-black ${theme === 'HIGH_CONTRAST' ? 'text-black/50' : 'text-slate-500'}`}>Priority</span>
                      <div className="flex items-center space-x-1 mt-0.5">
                        {(['HIGH', 'MEDIUM', 'LOW'] as const).map(p => (
                          <button
                            key={p}
                            onClick={(e) => { e.stopPropagation(); updateAnomalyPriority(anomaly.id, p); }}
                            className={`px-1.5 py-0.5 rounded text-[6px] font-black uppercase transition-all ${
                              anomaly.priority === p
                                ? theme === 'HIGH_CONTRAST' ? 'bg-black text-white' : p === 'HIGH' ? 'bg-blue-500 text-white' : p === 'MEDIUM' ? 'bg-purple-500 text-white' : 'bg-emerald-500 text-white'
                                : theme === 'HIGH_CONTRAST' ? 'bg-black/10 text-black/40 hover:bg-black/20' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className={`text-[9px] leading-relaxed italic border-l-2 pl-2 ${
                    theme === 'HIGH_CONTRAST' ? 'text-black/70 border-black/20' : 'text-slate-400 border-slate-800'
                  }`}>
                    {anomaly.description}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <Info size={10} className={theme === 'HIGH_CONTRAST' ? 'text-black/40' : 'text-slate-500'} />
                      <span className={`text-[7px] uppercase font-black tracking-tighter ${theme === 'HIGH_CONTRAST' ? 'text-black/40' : 'text-slate-500'}`}>Provenance: {anomaly.provenance}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsAnomalyPanelOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`text-[8px] font-black uppercase hover:underline ${theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-emerald-500'}`}
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
