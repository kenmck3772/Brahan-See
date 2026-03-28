import React from 'react';
import { RotateCw, Zap, AlertOctagon, Search, Play, RotateCw as ResetIcon, Lock, Target, Loader2 } from 'lucide-react';

interface ForensicControlsProps {
  offset: number;
  isSyncing: boolean;
  isAdjusting: boolean;
  setIsAdjusting: (val: boolean) => void;
  handleAutoSync: () => void;
  handleOffsetChange: (val: number) => void;
  bestShift: number | null;
  setBestShift: (val: number | null) => void;
  validationError: string | null;
  convertToDisplay: (val: number) => number;
  convertFromDisplay: (val: number) => number;
  unitLabel: string;
  OFFSET_SAFE_LIMIT: number;
  OFFSET_HARD_LIMIT: number;
  offsetIntensity: string;
  isCritical: boolean;
  isWarning: boolean;
  detectDatumShift: () => void;
  isDetectingShift: boolean;
  animateSync: () => void;
  setOffset: (val: number) => void;
  setValidationError: (val: string | null) => void;
  unit: string;
  setUnit: (unit: 'METERS' | 'FEET') => void;
  isShaking: boolean;
}

const ForensicControls: React.FC<ForensicControlsProps> = ({
  offset,
  isSyncing,
  isAdjusting,
  setIsAdjusting,
  handleAutoSync,
  handleOffsetChange,
  bestShift,
  setBestShift,
  validationError,
  convertToDisplay,
  convertFromDisplay,
  unitLabel,
  OFFSET_SAFE_LIMIT,
  OFFSET_HARD_LIMIT,
  offsetIntensity,
  isCritical,
  isWarning,
  detectDatumShift,
  isDetectingShift,
  animateSync,
  setOffset,
  setValidationError,
  unit,
  setUnit,
  isShaking
}) => {
  return (
    <div className={`glass-panel p-5 rounded-lg border bg-slate-900/40 flex flex-col space-y-5 shadow-2xl transition-all duration-300 cyber-border ${isShaking ? 'animate-shake border-[var(--alert-red)] bg-[var(--alert-red)]/5' : 'border-[var(--emerald-primary)]/20'}`}>
      <div className="flex items-center justify-between border-b border-[var(--emerald-primary)]/10 pb-2">
        <div className="flex items-center space-x-4">
          <h3 className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest flex items-center text-glow-emerald">
            <span>Engage_Controls</span>
            <Target size={12} className="ml-2 text-[var(--emerald-primary)]/40 animate-pulse" />
          </h3>
          <div className="flex items-center bg-slate-950/60 rounded border border-[var(--emerald-primary)]/20 p-0.5">
            <button 
              onClick={() => setUnit('METERS')}
              className={`px-2 py-0.5 rounded text-[7px] font-black transition-all ${unit === 'METERS' ? 'bg-[var(--emerald-primary)] text-slate-950' : 'text-[var(--emerald-primary)]/40 hover:text-[var(--emerald-primary)]'}`}
            >M</button>
            <button 
              onClick={() => setUnit('FEET')}
              className={`px-2 py-0.5 rounded text-[7px] font-black transition-all ${unit === 'FEET' ? 'bg-[var(--emerald-primary)] text-slate-950' : 'text-[var(--emerald-primary)]/40 hover:text-[var(--emerald-primary)]'}`}
            >FT</button>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all duration-300 ${
          Math.abs(offset) >= OFFSET_HARD_LIMIT 
            ? 'bg-[var(--alert-red)] text-slate-950 shadow-[0_0_15px_var(--alert-red)]' 
            : Math.abs(offset) > OFFSET_SAFE_LIMIT 
              ? 'bg-orange-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.6)]' 
              : 'bg-[var(--emerald-primary)]/20 text-[var(--emerald-primary)] border border-[var(--emerald-primary)]/30 text-glow-emerald'
        }`}>
          {Math.abs(offset) >= OFFSET_HARD_LIMIT 
            ? 'VETO_STATE' 
            : Math.abs(offset) > OFFSET_SAFE_LIMIT 
              ? 'WARNING_ZONE' 
              : 'NOMINAL'}
        </div>
      </div>

      <div className="space-y-4">
        <div className={`p-4 rounded border bg-slate-950/60 transition-all duration-300 glass-panel ${validationError ? (Math.abs(offset) >= OFFSET_HARD_LIMIT ? 'border-[var(--alert-red)] shadow-[0_0_25px_rgba(239,68,68,0.3)]' : 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]') : 'border-[var(--emerald-primary)]/20'}`}>
          <div className="flex justify-between items-center mb-3">
             <div className="flex items-center space-x-2">
                <Lock size={12} className={isCritical ? 'text-[var(--alert-red)] animate-pulse' : isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/40'} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${isWarning ? 'text-orange-400' : 'text-[var(--emerald-primary)]/50'}`}>Shift_Veto_Input</span>
             </div>
             <span className={`text-[16px] font-black font-terminal transition-colors duration-300 drop-shadow-md ${offsetIntensity}`}>
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
              <ResetIcon size={14} />
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
  );
};

export default ForensicControls;
