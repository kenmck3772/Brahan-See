import React from 'react';
import { ShieldCheck, Loader2, ScanLine, CheckCircle2 } from 'lucide-react';
import { CasingIntegrityIssue } from '../../types';

interface CasingIntegrityCheckProps {
  casingIssues: CasingIntegrityIssue[];
  isCheckingCasing: boolean;
  casingCheckProgress: number;
  runCasingIntegrityCheck: () => void;
  selectedCasingIssue: CasingIntegrityIssue | null;
  setSelectedCasingIssue: (issue: CasingIntegrityIssue | null) => void;
  convertToDisplay: (val: number) => number;
  unitLabel: string;
}

const CasingIntegrityCheck: React.FC<CasingIntegrityCheckProps> = ({
  casingIssues,
  isCheckingCasing,
  casingCheckProgress,
  runCasingIntegrityCheck,
  selectedCasingIssue,
  setSelectedCasingIssue,
  convertToDisplay,
  unitLabel
}) => {
  return (
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
  );
};

export default CasingIntegrityCheck;
