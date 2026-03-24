
import React, { useState } from 'react';
import { 
  Globe, Shield, Target, AlertCircle, 
  Map as MapIcon, ChevronRight, Activity, 
  Cpu, Radar, Compass, CornerDownRight,
  Database, Zap, Loader2, Scan, X
} from 'lucide-react';
import { GHOST_HUNTER_MISSION } from '../constants';
import { MissionTarget } from '../types';
import { useTheme } from '../src/context/ThemeContext';

interface MissionControlProps {
  onSelectTarget: (target: MissionTarget) => void;
  isAnalyzing?: boolean;
}

const MissionControl: React.FC<MissionControlProps> = ({ onSelectTarget, isAnalyzing }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<MissionTarget | null>(null);
  const { theme } = useTheme();

  const handleTargetClick = (target: MissionTarget) => {
    setSelectedTarget(target);
    onSelectTarget(target);
  };

  const getPriorityStyles = (priority: MissionTarget['PRIORITY']) => {
    switch (priority) {
      case 'CRITICAL': return 'border-[var(--alert-red)]/20 text-[var(--alert-red)] bg-[var(--alert-red)]/5';
      case 'HIGH': return 'border-orange-500/20 text-orange-400 bg-orange-500/5';
      case 'MEDIUM': return 'border-slate-700 text-slate-400 bg-slate-800/10';
      case 'LOW': return 'border-[var(--emerald-primary)]/20 text-[var(--emerald-primary)] bg-[var(--emerald-primary)]/5';
      default: return 'border-slate-800 text-slate-500';
    }
  };

  const getProgress = (directive?: string) => {
    if (!directive) return 0;
    // Deterministic percentage based on the directive string
    let hash = 0;
    for (let i = 0; i < directive.length; i++) {
      hash = directive.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 101;
  };

  return (
    <div className={`flex flex-col h-full bg-transparent relative overflow-hidden py-4 transition-all duration-500 ${
      theme === 'CLEAN' ? 'bg-white' : 
      theme === 'HIGH_CONTRAST' ? 'bg-white' : 
      'scanline-effect glass-panel cyber-border'
    }`}>
      <div className={`absolute inset-0 opacity-10 mix-blend-luminosity pointer-events-none flex items-center justify-center z-0 ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'hidden' : ''}`}>
        <img src="/brahan-seer.jpg" alt="Brahan Seer Background" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
      </div>
      <div className={`relative z-10 flex flex-col md:flex-row md:items-center justify-between border-b pb-8 mb-8 gap-4 transition-all ${
        theme === 'CLEAN' ? 'border-slate-200' :
        theme === 'HIGH_CONTRAST' ? 'border-black border-b-2' :
        'border-slate-800'
      }`}>
        <div className="flex items-center space-x-5">
          <div className={`p-4 rounded-xl shadow-lg border transition-all ${
            theme === 'CLEAN' ? 'bg-slate-100 border-slate-200' :
            theme === 'HIGH_CONTRAST' ? 'bg-white border-black border-2' :
            'bg-[var(--emerald-primary)]/10 border-[var(--emerald-primary)]/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] glass-panel'
          }`}>
            <Radar size={32} className={theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'text-slate-900' : 'text-[var(--emerald-primary)] text-glow-emerald'} />
          </div>
          <div>
            <h2 className={`text-3xl font-bold tracking-tight transition-all ${
              theme === 'CLEAN' ? 'text-slate-900' :
              theme === 'HIGH_CONTRAST' ? 'text-black' :
              'text-white text-glow-emerald'
            }`}>
              {GHOST_HUNTER_MISSION.MISSION_ID}
            </h2>
            <div className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-widest mt-1">
              <span className={`flex items-center ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'text-slate-500' : 'text-[var(--emerald-primary)]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-2 animate-pulse ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'bg-slate-900' : 'bg-[var(--emerald-primary)] shadow-[0_0_8px_var(--emerald-primary)]'}`}></span>
                Active Scan
              </span>
              <span className={`h-2 w-px ${theme === 'CLEAN' ? 'bg-slate-200' : theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-slate-800'}`}></span>
              <span className={theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'text-slate-500' : 'text-slate-500'}>Operator: {GHOST_HUNTER_MISSION.OPERATOR}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
           <div className={`text-sm font-mono tracking-widest px-4 py-2 rounded-lg border transition-all ${
             theme === 'CLEAN' ? 'bg-slate-50 text-slate-500 border-slate-200' :
             theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-black border-2' :
             'bg-slate-800/50 text-slate-400 border-slate-700 glass-panel cyber-border'
           }`}>
             {new Date(GHOST_HUNTER_MISSION.TIMESTAMP).toLocaleDateString()} // {new Date(GHOST_HUNTER_MISSION.TIMESTAMP).toLocaleTimeString()}
           </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
        {GHOST_HUNTER_MISSION.TARGETS.map((target, idx) => (
          <div 
            key={`${target.ASSET}-${idx}`}
            onMouseEnter={() => setHoveredId(target.ASSET)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => handleTargetClick(target)}
            className={`group p-8 glass-panel rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between h-80 cyber-border
              ${hoveredId === target.ASSET ? 'scale-[1.01] border-[var(--emerald-primary)]/40 shadow-2xl ring-1 ring-[var(--emerald-primary)]/20' : 'border-slate-800'}
              ${selectedTarget?.ASSET === target.ASSET ? 'ring-2 ring-[var(--emerald-primary)] border-[var(--emerald-primary)]' : ''}
              ${getPriorityStyles(target.PRIORITY)}`}
          >
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">{target.REGION}</span>
                  <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-[var(--emerald-primary)] transition-colors uppercase group-hover:text-glow-emerald">{target.ASSET}</h3>
                </div>
                <div className="p-2 bg-white/5 border border-white/5 rounded-md glass-panel">
                  <Scan size={16} className="text-slate-400 group-hover:text-[var(--emerald-primary)] transition-colors" />
                </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center space-x-2">
                    <AlertCircle size={14} className="text-orange-500/80" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{target.ANOMALY_TYPE.replace(/_/g, ' ')}</span>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {target.BLOCKS.map(block => (
                      <span key={block} className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[9px] font-mono text-slate-400 glass-panel">{block}</span>
                    ))}
                 </div>
                 {target.DIRECTIVE && (
                   <div className="pt-2 space-y-1.5">
                     <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
                       <span className="truncate pr-2" title={target.DIRECTIVE}>{target.DIRECTIVE}</span>
                       <span className="text-[var(--emerald-primary)]">{getProgress(target.DIRECTIVE)}%</span>
                     </div>
                     <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-[var(--emerald-primary)] transition-all duration-1000 ease-out shadow-[0_0_10px_var(--emerald-primary)]"
                         style={{ width: `${getProgress(target.DIRECTIVE)}%` }}
                       />
                     </div>
                   </div>
                 )}
              </div>
            </div>

            <div className="mt-auto relative z-10 pt-8 border-t border-slate-800/50">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-2 text-[9px] font-bold uppercase text-slate-500">
                    <Database size={12} />
                    <span>Portal: {target.DATA_PORTAL}</span>
                 </div>
                 {target.WELLS && <span className="text-[var(--emerald-primary)] text-[9px] font-bold uppercase text-glow-emerald">{target.WELLS.length} Wells Detected</span>}
              </div>
              
              <div className="flex items-center justify-between">
                 <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold tracking-widest border border-current`}>
                    {target.PRIORITY}
                 </div>
                 <button className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-widest text-[var(--emerald-primary)] group-hover:text-white transition-all group-hover:text-glow-emerald">
                    <span>Infiltrate</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTarget && (
        <div className="relative z-10 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-panel p-8 rounded-2xl border border-[var(--emerald-primary)]/30 cyber-border">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[var(--emerald-primary)]/10 rounded-xl border border-[var(--emerald-primary)]/30">
                  <Target size={24} className="text-[var(--emerald-primary)] text-glow-emerald" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-widest text-glow-emerald">Associated Wells: {selectedTarget.ASSET}</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{selectedTarget.REGION} // {selectedTarget.ANOMALY_TYPE}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTarget(null)}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {selectedTarget.WELLS?.map((well, idx) => (
                <div 
                  key={well}
                  className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-[var(--emerald-primary)]/40 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Well_ID_{idx + 1}</span>
                    <Activity size={12} className="text-slate-600 group-hover:text-[var(--emerald-primary)] transition-colors" />
                  </div>
                  <div className="text-sm font-bold text-slate-200 group-hover:text-[var(--emerald-primary)] transition-colors uppercase tracking-widest">{well}</div>
                  <div className="mt-3 flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--emerald-primary)] animate-pulse"></div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Telemetry_Active</span>
                  </div>
                </div>
              )) || (
                <div className="col-span-full text-center py-8 text-slate-500 uppercase tracking-widest font-bold text-xs">
                  No specific wells identified for this asset
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 cyber-border">
         <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
               <div className="p-3 bg-[var(--emerald-primary)]/10 rounded-xl glass-panel">
                  <Cpu size={20} className="text-[var(--emerald-primary)]" />
               </div>
               <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Logic Hub</div>
                  <div className="text-sm font-bold text-slate-200 uppercase">Distributed Veto Array</div>
               </div>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden md:block"></div>
            <div className="flex items-center space-x-4">
               <div className="p-3 bg-[var(--emerald-primary)]/10 rounded-xl glass-panel">
                  <Compass size={20} className="text-[var(--emerald-primary)]" />
               </div>
               <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">GPS Uplink</div>
                  <div className="text-sm font-bold text-slate-200 uppercase">Geo-Coords Locked</div>
               </div>
            </div>
         </div>
         
         <div className="flex items-center space-x-6">
            {isAnalyzing && (
              <div className="flex items-center space-x-3 text-[10px] font-bold text-orange-400 animate-pulse uppercase tracking-widest bg-orange-400/5 px-4 py-2 rounded-lg border border-orange-400/20">
                <Loader2 size={14} className="animate-spin" />
                <span>Streaming Forensic Insight</span>
              </div>
            )}
            <div className="text-[10px] font-mono text-slate-600 text-right uppercase">
              Node: Terminal_Master_V2.5
            </div>
         </div>
      </div>
    </div>
  );
};

export default MissionControl;
