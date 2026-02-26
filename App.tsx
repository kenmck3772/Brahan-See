
import React, { useState, useEffect } from 'react';
import { 
  Activity, Database, ShieldAlert, Cpu, Wifi, 
  Settings2, Power, Fingerprint, Menu, 
  Map as MapIcon, Layers, Zap, Flame, Compass, 
  Radar, Target, ShieldCheck, AlertCircle, Loader2,
  Search,
  Ghost, Box, FileSearch, Lock, Anchor, Globe, Beaker, BookOpen, Scale // NEW ICONS
} from 'lucide-react';
import SovereignStage from './components/SovereignStage';

const App: React.FC = () => {
  const [uptime, setUptime] = useState("00:00:00");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // New state for sidebar toggle
  const [engagedModules, setEngagedModules] = useState<Record<string, boolean>>({
    missionControl: false,
    ghostSync: false,
    traumaNode: false,
    pulseAnalyzer: false,
    reportsScanner: false,
    vault: false,
    legacyRecovery: false,
    norwaySovereign: false,
    chanonryProtocol: false,
    protocolManual: false,
    ndrModernization: false,
    cerberusSimulator: false,
    weteForensicScanner: false,
    ndrCrawler: true, // NDRCrawler enabled by default as per test flow
    forensicDeltaMap: false,
    timeTravelSlider: false,
  });

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleModule = (id: string) => {
    setEngagedModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const moduleDefinitions = [
    { id: 'missionControl', label: 'Mission Control', icon: <Radar size={16} />, desc: 'Global Mission Hub' },
    { id: 'ghostSync', label: 'Ghost Sync Engine', icon: <Ghost size={16} />, desc: 'Datum Correlation Array' },
    { id: 'traumaNode', label: 'Trauma Node', icon: <Activity size={16} />, desc: '3D Structural Autopsy' },
    { id: 'pulseAnalyzer', label: 'Pulse Analyzer', icon: <Zap size={16} />, desc: 'Sawtooth Pressure Scavenger' },
    { id: 'reportsScanner', label: 'Reports Scanner', icon: <FileSearch size={16} />, desc: 'DDR Tally Audit' },
    { id: 'vault', label: 'Sovereign Vault', icon: <Lock size={16} />, desc: 'Truth-Rights & Records' },
    { id: 'legacyRecovery', label: 'Legacy Recovery', icon: <Anchor size={16} />, desc: 'Offshore Pay Recovery' },
    { id: 'norwaySovereign', label: 'Norway Sovereign', icon: <Globe size={16} />, desc: 'NPD Factpages Uplink' },
    { id: 'chanonryProtocol', label: 'Chanonry Protocol', icon: <Beaker size={16} />, desc: 'Asphaltene Stability Logic' },
    { id: 'protocolManual', label: 'Protocol Manual', icon: <BookOpen size={16} />, desc: 'Authorized Instructions' },
    { id: 'ndrModernization', label: 'NDR Modernization', icon: <Database size={16} />, desc: 'Forensic Modernization' },
    { id: 'cerberusSimulator', label: 'Cerberus Simulator', icon: <ShieldCheck size={16} />, desc: 'Tri-Head Survival Engine' },
    { id: 'weteForensicScanner', label: 'WETE Scanner', icon: <Scale size={16} />, desc: 'Fact Science Reconciliation' },
    { id: 'ndrCrawler', label: 'NDR Crawler', icon: <Search size={16} />, desc: 'NDR Metadata Search' },
    { id: 'forensicDeltaMap', label: 'Forensic Delta Map', icon: <MapIcon size={16} />, desc: 'Public vs Forensic Truth' },
    { id: 'timeTravelSlider', label: 'Time-Travel Slider', icon: <Activity size={16} />, desc: 'Temporal State Manager' },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-slate-300 font-sans overflow-hidden select-none">
      
      {/* Sovereign Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#0f172a] z-[100] relative shadow-2xl">
        <div className="flex items-center space-x-6">
          {/* Sidebar toggle button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center space-x-3">
             <div className="p-1 bg-[#eab308]/10 rounded border border-[#eab308]/30 flex items-center justify-center w-10 h-10 overflow-hidden">
                <img src="/well-tegra-logo.jpg" alt="Well-Tegra Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                <Fingerprint size={20} className="text-[#eab308] hidden" />
             </div>
             <div className="flex flex-col">
               <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Well-Tegra [WETE]</span>
               <span className="text-[9px] font-bold text-[#eab308] uppercase tracking-widest">Sovereign Audit Terminal // NSTA NDR API</span>
             </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="hidden xl:flex items-center space-x-6 text-[10px] font-bold text-slate-500 uppercase">
            <span className="flex items-center"><Cpu size={14} className="mr-2 text-[#22c55e]" /> Uptime: {uptime}</span>
            <span className="flex items-center text-[#22c55e] animate-pulse"><Wifi size={14} className="mr-2" /> Connection: Verified</span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <button className="p-2 text-red-500/60 hover:text-red-500 transition-colors border border-red-500/20 rounded">
            <Power size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* Engagement Sidebar */}
        <aside className={`flex-shrink-0 ${isSidebarOpen ? 'w-72' : 'w-16'} border-r border-slate-800 bg-[#0b1120] flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out`}>
          <div className={`p-6 border-b border-slate-800/50 bg-[#0f172a]/50 ${!isSidebarOpen ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-3">
                <Layers size={18} className="text-[#eab308]" />
                <span className="font-black uppercase tracking-widest text-white text-[11px]">Active Modules</span>
              </div>
              <button 
                onClick={() => setEngagedModules(Object.keys(engagedModules).reduce((acc, key) => ({ ...acc, [key]: false }), {}))}
                className="text-[9px] font-bold text-slate-500 hover:text-red-400 uppercase tracking-widest transition-colors px-2 py-1 border border-slate-800 hover:border-red-500/30 rounded bg-slate-900/50"
              >
                Clear All
              </button>
            </div>
            <span className="text-[8px] text-slate-600 uppercase font-bold">Physical Engagement Switches</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {moduleDefinitions.map((mod) => (
              <div 
                key={mod.id} 
                onClick={() => toggleModule(mod.id)}
                className={`p-4 border rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                  engagedModules[mod.id] 
                    ? 'bg-[#22c55e]/5 border-[#22c55e]/40 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
                data-testid={`module-toggle-${mod.id}`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg transition-colors ${engagedModules[mod.id] ? 'bg-[#22c55e] text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
                      {mod.icon}
                    </div>
                    {isSidebarOpen && (
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-tight ${engagedModules[mod.id] ? 'text-white' : 'text-slate-500'}`}>
                          {mod.label}
                        </span>
                        <span className="text-[8px] font-bold text-slate-600 uppercase">{mod.desc}</span>
                      </div>
                    )}
                  </div>
                  
                  {isSidebarOpen ? (
                    <div className={`w-8 h-4 rounded-full relative transition-colors duration-500 ${engagedModules[mod.id] ? 'bg-[#22c55e]' : 'bg-slate-800'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 ${engagedModules[mod.id] ? 'left-4.5' : 'left-0.5'}`}></div>
                    </div>
                  ) : (
                    engagedModules[mod.id] && (
                      <div className="absolute top-1/2 right-1 -translate-y-1/2 w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]"></div>
                    )
                  )}
                </div>
                {engagedModules[mod.id] && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#22c55e]/10 to-transparent pointer-events-none"></div>
                )}
              </div>
            ))}
          </div>

          <div className={`p-6 bg-[#0f172a] border-t border-slate-800 ${!isSidebarOpen ? 'hidden' : ''}`}>
             <div className="flex items-center justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest mb-4">
                <span>System Health</span>
                <span className="text-[#22c55e]">98% Nominal</span>
             </div>
             <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#22c55e] w-[98%] shadow-[0_0_10px_#22c55e]"></div>
             </div>
          </div>
        </aside>

        {/* Main Stage Grid */}
        <div className="flex-1 relative bg-[#0f172a] overflow-hidden">
          <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar">
             <SovereignStage engagedModules={engagedModules} />
          </div>
          
          {/* Subtle Scanning Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-5 border-[20px] border-slate-800/20 mix-blend-overlay"></div>
        </div>
      </main>

      {/* Sovereign Footer */}
      <footer className="px-6 py-2 border-t border-slate-800 bg-[#0b1120] flex items-center justify-between text-[9px] font-black text-slate-600 uppercase z-[100]">
        <div className="flex items-center space-x-10">
          <span className="flex items-center"><Activity size={12} className="mr-2 text-[#22c55e]" /> Logic Engine: Brahan_Core_v.92</span>
          <span className="flex items-center text-[#eab308]"><ShieldCheck size={12} className="mr-2" /> System Status: WETE_ID Verified. Physics Invariant.</span>
        </div>
        <div className="flex items-center space-x-6">
          <span className="text-slate-500">Clause 18 Compliant</span>
          <span className="font-mono text-slate-700">{new Date().toLocaleTimeString()}</span>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #22c55e; }
      `}</style>
    </div>
  );
};

export default App;
