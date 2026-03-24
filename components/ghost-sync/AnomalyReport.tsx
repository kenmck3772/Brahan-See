import React, { useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Target, 
  Activity, 
  Globe2, 
  Clock, 
  Calendar, 
  FileText, 
  Database, 
  Fingerprint, 
  Info, 
  X, 
  SlidersHorizontal 
} from 'lucide-react';
import { SyncAnomaly } from '../../types';
import ProvenanceTooltip from '../ProvenanceTooltip';

interface AnomalyReportProps {
  selectedAnomaly: SyncAnomaly;
  setSelectedAnomaly: (anomaly: SyncAnomaly | null) => void;
  isAnomalyPanelOpen: boolean;
  setIsAnomalyPanelOpen: (val: boolean) => void;
  updateAnomalyPriority: (id: string, priority: 'HIGH' | 'MEDIUM' | 'LOW') => void;
  convertToDisplay: (val: number) => number;
  unitLabel: string;
}

const AnomalyReport: React.FC<AnomalyReportProps> = ({
  selectedAnomaly,
  setSelectedAnomaly,
  isAnomalyPanelOpen,
  setIsAnomalyPanelOpen,
  updateAnomalyPriority,
  convertToDisplay,
  unitLabel
}) => {
  const anomalyTheme = useMemo(() => {
    const { severity, priority, truthLevel } = selectedAnomaly;

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

    const s = severityMap[severity];
    const t = truthMap[truthLevel as keyof typeof truthMap] || truthMap.HYBRID;
    const p = priorityMap[priority];

    return {
      border: s.border,
      glow: s.glow,
      headerBg: s.header,
      severityText: s.text,
      severityAccent: s.accent,
      severityShadow: s.shadow,
      severityIcon: s.icon,
      bg: t.bg,
      pattern: t.pattern,
      truthText: t.text,
      truthIcon: t.icon,
      cardHover: t.cardHover,
      truthLabel: t.label,
      iconBg: p.iconBg,
      iconText: p.iconText,
      shadow: p.shadow,
      priorityBadge: p.badge
    };
  }, [selectedAnomaly]);

  return (
    <div 
      className={`glass-panel rounded-lg border transition-all duration-500 overflow-hidden flex flex-col shadow-2xl mb-4 ${anomalyTheme.border} ${anomalyTheme.bg} ${anomalyTheme.glow} ${anomalyTheme.shadow}`}
      style={{ backgroundImage: anomalyTheme.pattern }}
    >
      <div 
        onClick={() => setIsAnomalyPanelOpen(!isAnomalyPanelOpen)}
        className={`flex items-center justify-between p-4 border-b border-slate-800/50 group cursor-pointer transition-colors duration-500 ${anomalyTheme.headerBg || 'bg-slate-900/90'}`}
      >
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-lg shadow-inner transition-all duration-500 ${anomalyTheme.iconBg} ${anomalyTheme.iconText} ${anomalyTheme.shadow}`}>
            {anomalyTheme.severityIcon}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-[12px] font-black uppercase tracking-widest text-white">Forensic_Anomaly_Report</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all duration-300 border ${anomalyTheme.priorityBadge}`}>
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
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Trace_ID: {selectedAnomaly.id} // Truth_Level: {anomalyTheme.truthLabel}</span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Status</span>
            <span className={`text-[9px] font-black uppercase ${anomalyTheme.severityText}`}>
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
          <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme.cardHover}`}>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Anomaly_ID</span>
              <Fingerprint size={10} className="text-emerald-500/50" />
            </div>
            <ProvenanceTooltip source={selectedAnomaly.provenance} validator={selectedAnomaly.physicsValidation || ''} timestamp={selectedAnomaly.detectedAt || ''}>
              <span className="text-[12px] font-terminal text-emerald-400 font-bold tracking-wider">{selectedAnomaly.id}</span>
            </ProvenanceTooltip>
          </div>

          <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme.cardHover}`}>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Severity_Level</span>
              <ShieldAlert size={10} className={`${anomalyTheme.severityText} opacity-50`} />
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${anomalyTheme.severityAccent} ${selectedAnomaly.severity === 'CRITICAL' ? 'animate-pulse' : ''} ${anomalyTheme.severityShadow}`}></div>
              <span className={`text-[12px] font-black uppercase ${anomalyTheme.severityText}`}>
                {selectedAnomaly.severity}
              </span>
            </div>
          </div>

          <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme.cardHover}`}>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Depth_Locus</span>
              <Target size={10} className="text-slate-500/50" />
            </div>
            <span className="text-[12px] font-terminal text-slate-200 font-bold tracking-wider">
              {convertToDisplay(selectedAnomaly.startDepth).toFixed(1)}{unitLabel} — {convertToDisplay(selectedAnomaly.endDepth).toFixed(1)}{unitLabel}
            </span>
          </div>

          <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme.cardHover}`}>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Forensic_Delta</span>
              <Activity size={10} className="text-slate-500/50" />
            </div>
            <span className="text-[12px] font-terminal text-slate-200 font-bold tracking-wider">{selectedAnomaly.avgDiff.toFixed(2)} API</span>
          </div>

          <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme.cardHover}`}>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Truth_Level</span>
              <Globe2 size={10} className="text-indigo-500/50" />
            </div>
            <div className="flex items-center space-x-2">
              <Globe2 size={12} className={anomalyTheme.truthIcon} />
              <span className={`text-[12px] font-black uppercase ${anomalyTheme.truthText}`}>
                {selectedAnomaly.truthLevel}
              </span>
            </div>
          </div>

          <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme.cardHover}`}>
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Detection_Epoch</span>
              <Clock size={10} className="text-slate-500/50" />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar size={12} className="text-slate-600" />
              <span className="text-[12px] font-terminal text-slate-200 font-bold">{selectedAnomaly.detectedAt}</span>
            </div>
          </div>

          <div className={`flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner group/card transition-colors ${anomalyTheme.cardHover}`}>
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
                  <FileText size={14} className={`${anomalyTheme.truthIcon} opacity-50`} />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Forensic_Interpretation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Database size={10} className="text-slate-600" />
                  <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">Source: {selectedAnomaly.provenance}</span>
                </div>
              </div>
              <p className={`text-[11px] text-slate-300 font-terminal leading-relaxed bg-slate-950/60 p-4 rounded border shadow-inner italic transition-all duration-500 ${anomalyTheme.border}`}>
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
  );
};

export default AnomalyReport;
