
import React, { useState } from 'react';
import { 
  ResponsiveContainer, ComposedChart, CartesianGrid, 
  XAxis, YAxis, Tooltip, Area, Line, ReferenceLine, ReferenceArea, Legend 
} from 'recharts';
import { Target, Crosshair } from 'lucide-react';
import { SignalMetadata, SyncAnomaly } from './GhostSync';

interface SyncMonitorChartProps {
  combinedData: any[];
  signals: SignalMetadata[];
  viewMode: 'OVERLAY' | 'DIFFERENTIAL';
  ghostLabel: string;
  validationError: string | null;
  offset: number;
  anomalies?: SyncAnomaly[];
  onToggleSignal: (dataKey: string) => void;
}

const SyncMonitorChart: React.FC<SyncMonitorChartProps> = ({ 
  combinedData, 
  signals, 
  viewMode, 
  ghostLabel, 
  validationError,
  offset,
  anomalies = [],
  onToggleSignal
}) => {
  const [activeDepth, setActiveDepth] = useState<number | null>(null);
  const [activePayload, setActivePayload] = useState<any>(null);

  const handleLegendClick = (e: any) => {
    if (e && e.dataKey) {
      onToggleSignal(e.dataKey);
    }
  };

  return (
    <div className="flex-1 min-h-0 bg-slate-950/80 rounded-xl border border-emerald-500/10 p-4 relative group overflow-hidden flex flex-col shadow-inner">
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2">
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-emerald-500/20 px-3 py-1 rounded shadow-lg">
          <Target size={12} className="text-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Trace_Lock_Active</span>
        </div>
        {validationError && (
          <div className="text-[9px] font-black text-orange-500 bg-orange-500/10 border border-orange-500/30 px-3 py-1 uppercase animate-in fade-in slide-in-from-left-4 backdrop-blur-md">
            {validationError}
          </div>
        )}
        {anomalies.length > 0 && (
          <div className="text-[9px] font-black text-red-400 bg-red-400/10 border border-red-400/30 px-3 py-1 uppercase animate-in fade-in slide-in-from-left-4 duration-500 backdrop-blur-md">
            {anomalies.length} Forensic Anomalies Identified
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-1">
        {activeDepth && (
          <div className="bg-emerald-500/90 border border-emerald-400 px-3 py-1 rounded shadow-2xl animate-in fade-in slide-in-from-right-4">
            <span className="text-[10px] font-terminal font-black text-slate-950 tracking-widest uppercase flex items-center">
              <Crosshair size={10} className="mr-1.5" /> DEPTH: {activeDepth.toFixed(2)}m
            </span>
          </div>
        )}
        {activeDepth && Math.abs(offset) > 0.01 && (
          <div className="bg-orange-500/90 border border-orange-400 px-3 py-1 rounded shadow-2xl animate-in fade-in slide-in-from-right-4 delay-75">
            <span className="text-[10px] font-terminal font-black text-slate-950 tracking-widest uppercase">GHOST_REF: {(activeDepth + offset).toFixed(2)}m</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 relative min-h-[200px]"> {/* Added min-h-[200px] here */}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={combinedData} 
            onMouseMove={(state) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                setActiveDepth(state.activePayload[0].payload.depth);
                setActivePayload(state.activePayload[0].payload);
              }
            }}
            onMouseLeave={() => {
              setActiveDepth(null);
              setActivePayload(null);
            }}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="1 5" stroke="#10b981" opacity={0.05} />
            <XAxis 
              dataKey="depth" 
              stroke="#10b981" 
              fontSize={10} 
              axisLine={{stroke: '#10b981', strokeOpacity: 0.2}} 
              tickLine={{stroke: '#10b981', strokeOpacity: 0.2}} 
              tick={{fill: '#064e3b', fontWeight: 'bold'}}
              label={{ value: 'DEPTH (m)', position: 'bottom', offset: 0, fill: '#064e3b', fontSize: 9, fontWeight: 'black' }}
            />
            <YAxis 
              stroke="#10b981" 
              fontSize={10} 
              axisLine={{stroke: '#10b981', strokeOpacity: 0.2}} 
              tickLine={{stroke: '#10b981', strokeOpacity: 0.2}} 
              tick={{fill: '#064e3b', fontWeight: 'bold'}}
              label={{ value: 'GAMMA RAY (API)', angle: -90, position: 'insideLeft', fill: '#064e3b', fontSize: 9, fontWeight: 'black' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.9)', border: '1px solid rgba(16, 185, 129, 0.4)', fontSize: '10px', fontFamily: 'Fira Code', backdropFilter: 'blur(4px)' }}
              itemStyle={{ textTransform: 'uppercase', padding: '2px 0' }}
              cursor={false} 
              labelStyle={{ color: '#10b981', marginBottom: '4px', fontWeight: 'bold', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '4px' }}
            />
            <Legend 
              onClick={handleLegendClick}
              verticalAlign="bottom" 
              align="center" 
              iconType="plainline"
              wrapperStyle={{ paddingTop: '20px', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'Fira Code', cursor: 'pointer' }}
            />
            
            {Math.abs(offset) > 0.05 && combinedData.length > 0 && (
              <ReferenceArea 
                x1={combinedData[0].depth} 
                x2={combinedData[0].depth + offset} 
                fill="#FF5F1F" 
                fillOpacity={0.05}
                stroke="#FF5F1F"
                strokeOpacity={0.1}
                strokeDasharray="4 2"
              />
            )}

            {/* Anomaly Highlight Areas */}
            {anomalies.map(anomaly => (
              <ReferenceArea
                key={anomaly.id}
                x1={anomaly.startDepth}
                x2={anomaly.endDepth}
                fill={anomaly.severity === 'CRITICAL' ? '#ef4444' : '#f97316'}
                fillOpacity={0.15}
                stroke={anomaly.severity === 'CRITICAL' ? '#ef4444' : '#f97316'}
                strokeOpacity={0.3}
                strokeWidth={1}
              />
            ))}

            {/* Forensic Crosshair - Vertical (Current Depth) */}
            {activeDepth !== null && (
              <ReferenceLine 
                x={activeDepth} 
                stroke="#10b981" 
                strokeWidth={1}
                strokeOpacity={0.6}
                label={{ value: 'LOCUS', position: 'top', fill: '#10b981', fontSize: 8, fontWeight: 'bold' }}
              />
            )}

            {viewMode === 'DIFFERENTIAL' && (
              <Area type="monotone" dataKey="diff" stroke="none" fill="#ef4444" fillOpacity={0.1} isAnimationActive={false} />
            )}

            {signals.find(s => s.id === 'SIG-001')?.visible && (
              <Line 
                type="monotone" 
                dataKey="baseGR" 
                name="BASE_LOG" 
                stroke="#10b981" 
                dot={false} 
                strokeWidth={2} 
                isAnimationActive={false}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
            {signals.find(s => s.id === 'SIG-002')?.visible && (
              <Line 
                key={ghostLabel}
                type="monotone" 
                dataKey="ghostGR" 
                name={ghostLabel} 
                stroke="#FF5F1F" 
                dot={false} 
                strokeWidth={2} 
                strokeDasharray="5 3" 
                isAnimationActive={false}
                activeDot={{ r: 6, fill: '#FF5F1F', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
            {signals.map(sig => {
              if (sig.id !== 'SIG-001' && sig.id !== 'SIG-002' && sig.visible) {
                return (
                  <Line 
                    key={sig.id} 
                    type="monotone" 
                    dataKey={sig.id} 
                    name={sig.name}
                    stroke={sig.color} 
                    dot={false} 
                    strokeWidth={1.5} 
                    isAnimationActive={false}
                    activeDot={{ r: 5, fill: sig.color, stroke: '#ffffff', strokeWidth: 1.5 }}
                  />
                );
              }
              return null;
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center space-x-4 pointer-events-none opacity-40">
        <div className="flex items-center space-x-2">
           <div className="w-3 h-0.5 bg-emerald-500"></div>
           <span className="text-[8px] font-black uppercase text-emerald-900">BASE_TRACE</span>
        </div>
        <div className="flex items-center space-x-2">
           <div className="w-3 h-0.5 bg-orange-500 border-t border-dashed border-orange-500"></div>
           <span className="text-[8px] font-black uppercase text-emerald-900">SHIFTED_ARTIFACT</span>
        </div>
      </div>
    </div>
  );
};

export default SyncMonitorChart;
