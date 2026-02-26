import React, { useState } from 'react';
import { Map as MapIcon, AlertTriangle } from 'lucide-react';
import ProvenanceTooltip from './ProvenanceTooltip';

// Mock data for wells
const MOCK_WELLS = [
  { id: 'STELLA-001', lat: 56.5, lon: 1.2, reported: 10000, audited: 8500, status: 'conflict' },
  { id: 'GANNET-A', lat: 57.1, lon: 0.8, reported: 15000, audited: 14800, status: 'nominal' },
  { id: 'VIKING-X', lat: 53.5, lon: 2.1, reported: 5000, audited: 3200, status: 'critical' },
];

const ForensicDeltaMap: React.FC = () => {
  const [selectedWell, setSelectedWell] = useState<string | null>(null);

  return (
    <div className="h-96 bg-[#0b1120] border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between z-10 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <MapIcon size={16} className="text-fuchsia-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Forensic Delta Map</span>
        </div>
        <div className="flex space-x-2">
          <span className="text-[8px] font-black px-2 py-1 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30 rounded flex items-center">
            <AlertTriangle size={10} className="mr-1" /> Conflict Overlay Active
          </span>
        </div>
      </div>
      
      {/* Map Background Simulation */}
      <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 relative overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(30, 41, 59, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 59, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Mock Map Features */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M 200 0 C 300 200, 100 400, 400 600 S 800 800, 1000 1000" fill="none" stroke="#334155" strokeWidth="2" />
          <path d="M 0 300 C 200 300, 400 100, 600 400 S 800 600, 1000 500" fill="none" stroke="#334155" strokeWidth="2" />
        </svg>

        {/* Well Markers */}
        <div className="absolute inset-0 p-8 relative">
          {MOCK_WELLS.map((well, idx) => {
            const top = `${20 + (idx * 25)}%`;
            const left = `${30 + (idx * 20)}%`;
            const isSelected = selectedWell === well.id;
            const isConflict = well.status !== 'nominal';
            
            return (
              <div 
                key={well.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ top, left }}
                onClick={() => setSelectedWell(well.id)}
              >
                {/* Heatmap Glow for Conflicts */}
                {isConflict && (
                  <div className={`absolute inset-0 rounded-full blur-xl -z-10 transition-all duration-1000 ${well.status === 'critical' ? 'bg-red-500/40 w-32 h-32 -left-16 -top-16' : 'bg-fuchsia-500/30 w-24 h-24 -left-12 -top-12 animate-pulse'}`}></div>
                )}
                
                {/* Marker Core */}
                <div className={`relative w-4 h-4 rounded-full border-2 z-10 transition-all ${isSelected ? 'scale-150' : 'group-hover:scale-125'} ${well.status === 'critical' ? 'bg-red-500 border-red-300' : well.status === 'conflict' ? 'bg-fuchsia-500 border-fuchsia-300' : 'bg-emerald-500 border-emerald-300'}`}>
                  {isSelected && <div className="absolute inset-0 rounded-full border border-white animate-ping"></div>}
                </div>
                
                {/* Label */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/80 border ${well.status === 'critical' ? 'text-red-400 border-red-500/30' : well.status === 'conflict' ? 'text-fuchsia-400 border-fuchsia-500/30' : 'text-emerald-400 border-emerald-500/30'}`}>
                    {well.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedWell && (
        <div className="absolute bottom-4 right-4 w-80 bg-slate-950/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-right-8 duration-300 z-20">
          {MOCK_WELLS.filter(w => w.id === selectedWell).map(well => {
            const delta = well.reported - well.audited;
            const deltaPercent = ((delta / well.reported) * 100).toFixed(1);
            
            return (
              <div key={well.id} className="p-4">
                <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-white font-mono">{well.id}</h4>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest">Forensic Delta Analysis</span>
                  </div>
                  <button onClick={() => setSelectedWell(null)} className="text-slate-500 hover:text-white">×</button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Reported (NSTA)</span>
                    <ProvenanceTooltip source="NSTA API" validator="Unverified" timestamp="2024-05-20T10:00:00Z">
                      <span className="text-xs font-mono text-slate-300">{well.reported.toLocaleString()} bbl/d</span>
                    </ProvenanceTooltip>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-emerald-500 uppercase tracking-wider font-bold">Audited (WellTegra)</span>
                    <ProvenanceTooltip source="Raw Sensor Telemetry" validator="WellTegra Physics Engine v1.2" timestamp="2024-05-20T14:30:00Z">
                      <span className="text-xs font-mono text-emerald-400 font-bold">{well.audited.toLocaleString()} bbl/d</span>
                    </ProvenanceTooltip>
                  </div>
                  
                  <div className={`mt-4 p-3 rounded-lg border ${well.status === 'nominal' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${well.status === 'nominal' ? 'text-emerald-500' : 'text-red-500'}`}>
                        Discrepancy Delta
                      </span>
                      <span className={`text-sm font-mono font-bold ${well.status === 'nominal' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {delta.toLocaleString()} bbl/d
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className={`h-full ${well.status === 'nominal' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(5, parseFloat(deltaPercent)))}%` }}></div>
                    </div>
                    <div className="text-right mt-1">
                      <span className={`text-[8px] font-mono ${well.status === 'nominal' ? 'text-emerald-500/70' : 'text-red-500/70'}`}>{deltaPercent}% Variance</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ForensicDeltaMap;
