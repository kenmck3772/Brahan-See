import React, { useEffect } from 'react';
import { Clock, FastForward, Rewind, Play, Pause } from 'lucide-react';
import { useTemporal } from '../src/context/TemporalContext';

const TimeTravelSlider: React.FC = () => {
  const { year, setYear, quarter, setQuarter, isPlaying, setIsPlaying } = useTemporal();
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setQuarter((quarter % 4) + 1);
        if (quarter === 4) {
          setYear(year < 2024 ? year + 1 : 2015);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, quarter, year, setQuarter, setYear]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  return (
    <div className="w-full bg-slate-950 border-t border-slate-800 p-4 flex flex-col space-y-3 z-50 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Clock size={16} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Temporal State Manager</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs font-mono font-bold text-white bg-slate-900 px-3 py-1 rounded border border-slate-800 transition-all duration-500">
            Q{quarter} {year}
          </span>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest">KronoGraph Sync: Active</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => { setYear(Math.max(2015, year - 1)); setIsPlaying(false); }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Rewind size={14} />
          </button>
          <button 
            onClick={handlePlayPause}
            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 rounded-full border border-emerald-500/30 transition-all"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button 
            onClick={() => { setYear(Math.min(2024, year + 1)); setIsPlaying(false); }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <FastForward size={14} />
          </button>
        </div>
        
        <div className="flex-1 relative flex items-center">
          <input 
            type="range" 
            min="2015" 
            max="2024" 
            step="1"
            value={year}
            onChange={(e) => { setYear(parseInt(e.target.value)); setIsPlaying(false); }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          {/* Timeline markers */}
          <div className="absolute top-4 left-0 w-full flex justify-between px-1 pointer-events-none">
            {[2015, 2018, 2021, 2024].map(y => (
              <div key={y} className="flex flex-col items-center">
                <div className={`w-0.5 h-1.5 mb-1 transition-colors ${year === y ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                <span className={`text-[8px] font-mono transition-colors ${year === y ? 'text-emerald-500 font-bold' : 'text-slate-500'}`}>{y}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTravelSlider;
