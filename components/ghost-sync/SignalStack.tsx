import React from 'react';
import { ScanLine, CheckCircle2, ShieldAlert } from 'lucide-react';
import { SignalMetadata } from '../../types';

interface SignalStackProps {
  filteredSignals: SignalMetadata[];
  handleToggleSignal: (id: string) => void;
  ghostLabel: string;
}

const SignalStack: React.FC<SignalStackProps> = ({ 
  filteredSignals, 
  handleToggleSignal, 
  ghostLabel 
}) => {
  return (
    <div className="flex-none glass-panel p-5 rounded-lg border border-[var(--emerald-primary)]/20 bg-slate-900/40 shadow-2xl cyber-border hover:bg-slate-900/60 transition-colors duration-300">
      <h3 className="text-[10px] font-black text-[var(--emerald-primary)] uppercase tracking-widest mb-4 flex items-center text-glow-emerald">
         <ScanLine size={12} className="mr-2 animate-pulse" /> Signal_Stack
      </h3>
      <div className="space-y-2">
        {filteredSignals.map(sig => (
          <div key={sig.id} className="relative group/sig">
            <div 
              onClick={() => handleToggleSignal(sig.id)}
              role="button"
              aria-pressed={sig.visible}
              className={`flex items-center justify-between p-2.5 bg-slate-950/60 border rounded hover:border-[var(--emerald-primary)]/40 transition-all duration-300 cursor-pointer group glass-panel ${sig.visible ? 'border-[var(--emerald-primary)]/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]' : 'border-red-950/20 opacity-30 grayscale'}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] transition-all duration-300 group-hover:scale-125" style={{ backgroundColor: sig.color, color: sig.color }}></div>
                <span className={`text-[9px] font-black uppercase truncate transition-colors duration-300 ${sig.visible ? 'text-emerald-100' : 'text-slate-600'}`}>{sig.id === 'SIG-002' ? ghostLabel : sig.name}</span>
              </div>
              {sig.visible ? <CheckCircle2 size={12} className="text-[var(--emerald-primary)] animate-in zoom-in duration-300" /> : <ShieldAlert size={12} className="text-red-900" />}
            </div>

            {/* Signal Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/sig:block z-50 p-2 bg-slate-900 border border-emerald-500/30 rounded shadow-2xl animate-in fade-in zoom-in-95 duration-200 pointer-events-none min-w-[120px]">
              <div className="flex flex-col space-y-1 text-[8px] font-mono">
                <div className="flex justify-between space-x-4">
                  <span className="text-slate-500 uppercase">Signal_ID:</span>
                  <span className="text-emerald-400 font-bold">{sig.id}</span>
                </div>
                <div className="flex justify-between space-x-4">
                  <span className="text-slate-500 uppercase">Hex_Code:</span>
                  <span className="font-bold" style={{ color: sig.color.startsWith('var') ? 'inherit' : sig.color }}>{sig.color}</span>
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-emerald-500/30 rotate-45"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignalStack;
