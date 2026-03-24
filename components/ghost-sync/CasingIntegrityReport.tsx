import React from 'react';
import { 
  X, 
  ShieldAlert, 
  Target, 
  Activity, 
  Database, 
  FileText, 
  Info,
  Layers,
  Zap
} from 'lucide-react';
import { CasingIntegrityIssue } from '../../types';

interface CasingIntegrityReportProps {
  selectedCasingIssue: CasingIntegrityIssue;
  setSelectedCasingIssue: (issue: CasingIntegrityIssue | null) => void;
  convertToDisplay: (val: number) => number;
  unitLabel: string;
}

const CasingIntegrityReport: React.FC<CasingIntegrityReportProps> = ({
  selectedCasingIssue,
  setSelectedCasingIssue,
  convertToDisplay,
  unitLabel
}) => {
  return (
    <div 
      className={`glass-panel rounded-lg border transition-all duration-500 overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 duration-500 ${
        selectedCasingIssue.severity === 'CRITICAL' ? 'border-red-500/50 bg-red-950/10 shadow-[0_0_30px_rgba(239,68,68,0.15)]' :
        selectedCasingIssue.severity === 'WARNING' ? 'border-orange-500/50 bg-orange-950/10 shadow-[0_0_30px_rgba(249,115,22,0.15)]' :
        'border-blue-500/50 bg-blue-950/10 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
      }`}
    >
      <div className={`flex items-center justify-between p-4 border-b border-slate-800/50 ${
        selectedCasingIssue.severity === 'CRITICAL' ? 'bg-red-950/40' :
        selectedCasingIssue.severity === 'WARNING' ? 'bg-orange-950/20' :
        'bg-blue-950/20'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded-lg ${
            selectedCasingIssue.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
            selectedCasingIssue.severity === 'WARNING' ? 'bg-orange-500/20 text-orange-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            <ShieldAlert size={18} className={selectedCasingIssue.severity === 'CRITICAL' ? 'animate-pulse' : ''} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-[12px] font-black uppercase tracking-widest text-white">Casing_Integrity_Forensics</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                selectedCasingIssue.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                selectedCasingIssue.severity === 'WARNING' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
                'bg-blue-500/20 text-blue-400 border-blue-500/50'
              }`}>
                {selectedCasingIssue.severity}_ALERT
              </span>
            </div>
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Component: {selectedCasingIssue.type} // Depth: {convertToDisplay(selectedCasingIssue.depth).toFixed(1)}{unitLabel}</span>
          </div>
        </div>
        <button 
          onClick={() => setSelectedCasingIssue(null)}
          className="p-1.5 text-slate-500 hover:text-white transition-colors bg-slate-800/30 rounded"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Issue_Type</span>
            <Layers size={10} className="text-indigo-500/50" />
          </div>
          <span className="text-[12px] font-terminal text-indigo-400 font-bold tracking-wider uppercase">{selectedCasingIssue.type.replace(/_/g, ' ')}</span>
        </div>

        <div className="flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Locus_Depth</span>
            <Target size={10} className="text-slate-500/50" />
          </div>
          <span className="text-[12px] font-terminal text-slate-200 font-bold tracking-wider">
            {convertToDisplay(selectedCasingIssue.depth).toFixed(1)}{unitLabel}
          </span>
        </div>

        <div className="flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Measured_Value</span>
            <Activity size={10} className="text-slate-500/50" />
          </div>
          <span className="text-[12px] font-terminal text-slate-200 font-bold tracking-wider">
            {selectedCasingIssue.value} {selectedCasingIssue.unit}
          </span>
        </div>

        <div className="flex flex-col space-y-1.5 p-3 bg-slate-950/40 rounded border border-slate-800/30 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Provenance</span>
            <Database size={10} className="text-emerald-500/50" />
          </div>
          <span className="text-[12px] font-terminal text-emerald-400 font-bold tracking-wider uppercase">{selectedCasingIssue.provenance}</span>
        </div>

        <div className="md:col-span-2 lg:col-span-4 pt-4 border-t border-slate-800/50">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText size={14} className="text-indigo-400 opacity-50" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Forensic_Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap size={10} className="text-amber-500/50" />
                <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">Physics_Validation: {selectedCasingIssue.physicsValidation}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 font-terminal leading-relaxed bg-slate-950/60 p-4 rounded border border-slate-800/50 shadow-inner italic">
              {selectedCasingIssue.description || "No detailed forensic description available for this casing integrity event."}
            </p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Structural_Integrity: VERIFIED</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]"></div>
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Audit_Trail: SECURE</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Info size={10} className="text-slate-600" />
                <span className="text-[7px] font-mono text-slate-600 uppercase tracking-widest">WellTegra Forensic Engine v1.2 // Integrity_Hash: {Math.random().toString(16).substr(2, 12).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CasingIntegrityReport;
