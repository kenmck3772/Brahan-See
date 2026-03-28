
import React, { useState, useMemo } from 'react';
import { Ruler, Target, ShieldAlert, ChevronRight, Hash, Info, Activity } from 'lucide-react';
import { useTheme } from '../src/context/ThemeContext';

import { SyncAnomaly, CasingIntegrityIssue, ForensicWell, CasingString } from '../types';
import { MOCK_WELLS } from '../constants';

interface WellBoreSchematicProps {
  wellId: string | null;
  anomalies?: SyncAnomaly[];
  casingIssues?: CasingIntegrityIssue[];
}

const WellBoreSchematic: React.FC<WellBoreSchematicProps> = ({ wellId, anomalies = [], casingIssues = [] }) => {
  const { theme } = useTheme();
  const [selectedDepth, setSelectedDepth] = useState<number>(1245.5);
  const [hoveredDepth, setHoveredDepth] = useState<number | null>(null);

  const wellData = useMemo(() => MOCK_WELLS.find(w => w.id === wellId), [wellId]);

  const casingStrings: CasingString[] = useMemo(() => {
    if (wellData?.casingStrings) return wellData.casingStrings;
    
    // Fallback if no casing strings in wellData
    return [
      { id: 'CS-01', name: 'Conductor', top: 0, bottom: 150, od: 30, weight: '310 lb/ft', grade: 'X-52' },
      { id: 'CS-02', name: 'Surface Casing', top: 0, bottom: 850, od: 20, weight: '133 lb/ft', grade: 'K-55' },
      { id: 'CS-03', name: 'Intermediate Casing', top: 0, bottom: 2200, od: 13.375, weight: '72 lb/ft', grade: 'L-80' },
      { id: 'CS-04', name: 'Production Casing', top: 0, bottom: 3500, od: 9.625, weight: '47 lb/ft', grade: 'P-110' },
    ];
  }, [wellData]);

  const combinedAnomalies = useMemo(() => {
    return [...anomalies, ...(wellData?.anomalies || [])];
  }, [anomalies, wellData]);

  const combinedCasingIssues = useMemo(() => {
    return [...casingIssues, ...(wellData?.casingIssues || [])];
  }, [casingIssues, wellData]);

  const totalDepth = 4500;
  const SCALE = 0.15; // px per meter
  const VIEWPORT_HEIGHT = 600;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursor = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const depth = (cursor.y - 20) / SCALE;
    if (depth >= 0 && depth <= totalDepth) {
      setHoveredDepth(depth);
    }
  };

  const handleMouseClick = () => {
    if (hoveredDepth !== null) {
      setSelectedDepth(hoveredDepth);
    }
  };

  return (
    <div className={`flex flex-col h-full space-y-4 p-6 rounded-2xl border transition-all duration-500 ${
      theme === 'CLEAN' ? 'bg-white border-slate-200 shadow-sm' :
      theme === 'HIGH_CONTRAST' ? 'bg-white border-black border-2 rounded-none' :
      'bg-[var(--slate-abyssal)] border-emerald-900/30 glass-panel cyber-border'
    }`}>
      <div className="flex items-center justify-between border-b border-emerald-900/20 pb-4">
        <div className="flex items-center space-x-3">
          <Target size={18} className="text-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Wellbore_Schematic_v2</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-emerald-800 uppercase tracking-widest font-black">Target: {wellId || 'GLOBAL_SCAN'}</span>
              {wellData && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Field: {wellData.field}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    wellData.status === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    wellData.status === 'conflict' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {wellData.status}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
           <div className="flex flex-col items-end">
             <span className="text-[8px] font-black text-emerald-900 uppercase">Selected_Depth</span>
             <span className="text-lg font-terminal text-emerald-100">{selectedDepth.toFixed(2)}m</span>
           </div>
           <div className="w-px h-8 bg-emerald-900/30"></div>
           <ShieldAlert size={20} className="text-emerald-700 opacity-50" />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-6 overflow-hidden">
        {/* Schematic Viewport */}
        <div className="flex-1 bg-slate-950/50 rounded-xl border border-emerald-900/10 relative overflow-hidden group">
          <div className="absolute top-4 left-4 z-20 flex flex-col space-y-1">
             <div className="bg-slate-900/90 border border-emerald-500/30 px-2 py-1 rounded flex items-center space-x-2">
               <Ruler size={10} className="text-emerald-500" />
               <span className="text-[8px] font-black text-emerald-400 uppercase">Scale: 1:{1/SCALE}m</span>
             </div>
          </div>

          <div className="h-full overflow-y-auto custom-scrollbar pr-2 scroll-smooth" style={{ scrollbarGutter: 'stable' }}>
            <svg 
              viewBox={`0 0 400 ${totalDepth * SCALE + 100}`}
              width="100%" 
              height={totalDepth * SCALE + 100} 
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredDepth(null)}
              onClick={handleMouseClick}
              className="cursor-crosshair"
            >
              <defs>
                <linearGradient id="wellboreGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#020617" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>
                <pattern id="casingPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="10" y2="10" stroke="#10b981" strokeOpacity="0.1" />
                </pattern>
              </defs>

              {/* Background */}
              <rect width="100%" height="100%" fill="transparent" />

              {/* Center Line */}
              <line 
                x1="200" 
                y1="20" 
                x2="200" 
                y2={totalDepth * SCALE + 20} 
                stroke="#10b981" 
                strokeWidth="1" 
                strokeDasharray="10 5" 
                strokeOpacity="0.2" 
              />

              {/* Casing Strings */}
              {casingStrings.map((casing, idx) => {
                const width = casing.od * 4; // Visual scaling for OD
                const xPos = 200 - width/2;
                const yPos = casing.top * SCALE + 20;
                const height = (casing.bottom - casing.top) * SCALE;
                
                return (
                  <g key={casing.id} className="group/casing">
                    <rect 
                      x={xPos} 
                      y={yPos} 
                      width={width} 
                      height={height} 
                      fill="url(#wellboreGrad)" 
                      stroke="#10b981" 
                      strokeWidth="1.5" 
                      strokeOpacity="0.4"
                      className="transition-all duration-300 group-hover/casing:stroke-opacity-100"
                    />
                    {/* Shoe */}
                    <path 
                      d={`M${xPos},${yPos + height} L${xPos - 10},${yPos + height + 10} M${xPos + width},${yPos + height} L${xPos + width + 10},${yPos + height + 10}`} 
                      stroke="#10b981" 
                      strokeWidth="2" 
                      strokeOpacity="0.6" 
                    />
                  </g>
                );
              })}

              {/* Anomalies & Casing Issues Visualization */}
              {wellData && wellData.deviationAudit && (
                <g transform={`translate(0, ${parseFloat(wellData.deviationAudit.split('@')[1] || '0') * SCALE + 20})`}>
                  <circle cx="200" cy="0" r="10" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="2 2" className="animate-spin-slow" />
                  <text x="215" y="4" fill="#ef4444" fontSize="8" fontWeight="black" className="uppercase">DEVIATION_AUDIT: {wellData.deviationAudit}</text>
                </g>
              )}

              {combinedAnomalies.map((anomaly) => (
                <g key={anomaly.id} transform={`translate(0, ${anomaly.startDepth * SCALE + 20})`}>
                  <rect 
                    x="0" 
                    y="0" 
                    width="100%" 
                    height={(anomaly.endDepth - anomaly.startDepth) * SCALE} 
                    fill={anomaly.severity === 'CRITICAL' ? '#ef4444' : '#f97316'} 
                    fillOpacity="0.2"
                    className="animate-pulse"
                  />
                  <line 
                    x1="0" 
                    y1="0" 
                    x2="100%" 
                    y2="0" 
                    stroke={anomaly.severity === 'CRITICAL' ? '#ef4444' : '#f97316'} 
                    strokeWidth="1" 
                    strokeDasharray="4 2" 
                  />
                  <circle cx="10" cy="0" r="3" fill={anomaly.severity === 'CRITICAL' ? '#ef4444' : '#f97316'} />
                </g>
              ))}

              {combinedCasingIssues.map((issue) => (
                <g key={issue.id} transform={`translate(0, ${issue.depth * SCALE + 20})`}>
                  <circle 
                    cx="200" 
                    cy="0" 
                    r="8" 
                    fill="none" 
                    stroke={issue.severity === 'CRITICAL' ? '#ef4444' : '#f97316'} 
                    strokeWidth="2" 
                    className="animate-ping" 
                  />
                  <circle 
                    cx="200" 
                    cy="0" 
                    r="4" 
                    fill={issue.severity === 'CRITICAL' ? '#ef4444' : '#f97316'} 
                  />
                  <text 
                    x="212" 
                    y="4" 
                    fill={issue.severity === 'CRITICAL' ? '#ef4444' : '#f97316'} 
                    fontSize="8" 
                    fontWeight="black" 
                    className="uppercase"
                  >
                    {issue.type}
                  </text>
                </g>
              ))}

              {/* Depth Markers */}
              {Array.from({ length: Math.ceil(totalDepth / 500) + 1 }).map((_, i) => (
                <g key={i} transform={`translate(0, ${i * 500 * SCALE + 20})`}>
                  <line x1="0" y1="0" x2="100%" y2="0" stroke="#10b981" strokeOpacity="0.1" strokeDasharray="2 2" />
                  <text x="10" y="-5" fill="#10b981" fontSize="8" fontWeight="black" opacity="0.4">{i * 500}m</text>
                </g>
              ))}

              {/* Selected Depth Indicator */}
              <g transform={`translate(0, ${selectedDepth * SCALE + 20})`}>
                <line x1="0" y1="0" x2="100%" y2="0" stroke="#eab308" strokeWidth="2" strokeDasharray="5 2" className="animate-pulse" />
                <rect x="calc(100% - 80px)" y="-10" width="70" height="20" fill="#eab308" rx="2" />
                <text x="calc(100% - 45px)" y="3" fill="#000" fontSize="9" fontWeight="black" textAnchor="middle">{selectedDepth.toFixed(1)}m</text>
              </g>

              {/* Hover Indicator */}
              {hoveredDepth !== null && (
                <g transform={`translate(0, ${hoveredDepth * SCALE + 20})`} className="pointer-events-none">
                  <line x1="0" y1="0" x2="100%" y2="0" stroke="#10b981" strokeWidth="1" opacity="0.5" />
                  <text x="100%" y="-5" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="end" transform="translate(-10, 0)">{hoveredDepth.toFixed(1)}m</text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-72 flex flex-col space-y-4">
           <div className="bg-slate-950/80 border border-emerald-900/20 rounded-xl p-4 flex flex-col space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-emerald-900/10 pb-2">
                <Info size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Casing_Inventory</span>
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar pr-1">
                {casingStrings.map(casing => (
                  <div key={casing.id} className="p-2 bg-slate-900/50 border border-emerald-900/10 rounded hover:border-emerald-500/30 transition-colors group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-black text-emerald-100 uppercase">{casing.name}</span>
                      <span className="text-[8px] font-mono text-emerald-900">{casing.id}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[7px] text-emerald-900 uppercase font-black">Interval</span>
                        <span className="text-[8px] text-emerald-500 font-terminal">{casing.top}-{casing.bottom}m</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[7px] text-emerald-900 uppercase font-black">OD/Grade</span>
                        <span className="text-[8px] text-emerald-500 font-terminal">{casing.od}" / {casing.grade}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="flex-1 bg-slate-950/80 border border-emerald-900/20 rounded-xl p-4 flex flex-col space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-emerald-900/10 pb-2">
                <Activity size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Forensic_Locus</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-40">
                <Hash size={40} className="text-emerald-900" />
                <span className="text-[8px] font-black text-emerald-900 uppercase tracking-[0.3em] text-center">Select Depth to Analyze Structural Integrity</span>
              </div>
              <button className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                Run_Integrity_Scan
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WellBoreSchematic;
