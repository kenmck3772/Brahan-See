
import React, { useState, useEffect } from 'react';
import { 
  Activity, Database, ShieldAlert, Cpu, Wifi, 
  Settings2, Power, Fingerprint, Menu, 
  Map as MapIcon, Layers, Zap, Flame, Compass, 
  Radar, Target, ShieldCheck, AlertCircle, Loader2,
  Search, BarChart3, X,
  Ghost, Box, FileSearch, Lock, Anchor, Globe, Beaker, BookOpen, Scale // NEW ICONS
} from 'lucide-react';
import SovereignStage from './components/SovereignStage';
import { UnitProvider, useUnit } from './src/context/UnitContext';
import { HarvesterProvider, useHarvester } from './src/context/HarvesterContext';
import { ThemeProvider, useTheme, ThemeType } from './src/context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  const themes: { id: ThemeType; icon: React.ReactNode; label: string }[] = [
    { id: 'FORENSIC', icon: <Ghost size={14} />, label: 'Forensic' },
    { id: 'CLEAN', icon: <Box size={14} />, label: 'Clean' },
    { id: 'TECHNICAL', icon: <Cpu size={14} />, label: 'Tech' },
    { id: 'HIGH_CONTRAST', icon: <Activity size={14} />, label: 'Contrast' }
  ];

  return (
    <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 shadow-inner">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest ${
            theme === t.id 
              ? 'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_10px_var(--emerald-primary)]' 
              : 'text-slate-500 hover:text-white hover:bg-slate-800'
          }`}
          title={`Switch to ${t.label} Theme`}
        >
          {t.icon}
          <span className="hidden xl:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
};

const UnitToggle: React.FC = () => {
  const { unit, toggleUnit } = useUnit();
  const { theme } = useTheme();
  return (
    <button 
      onClick={toggleUnit}
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all group ${
        theme === 'CLEAN' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' :
        theme === 'HIGH_CONTRAST' ? 'bg-white border-black hover:bg-slate-100' :
        'border-slate-800 bg-slate-900/50 hover:border-[var(--emerald-primary)]/30 hover:bg-[var(--emerald-primary)]/5'
      }`}
      title={`Switch to ${unit === 'METERS' ? 'FEET' : 'METERS'}`}
    >
      <Compass size={14} className={`${theme === 'CLEAN' ? 'text-slate-600' : theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-[var(--emerald-primary)]'} group-hover:rotate-90 transition-transform`} />
      <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'CLEAN' ? 'text-slate-500' : theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-slate-400'} group-hover:text-white`}>
        UNIT: <span className={theme === 'CLEAN' ? 'text-slate-900' : theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-[var(--emerald-primary)]'}>{unit}</span>
      </span>
    </button>
  );
};

const HarvesterStatus: React.FC = () => {
  const { isConnected, lastIngress } = useHarvester();
  const { theme } = useTheme();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (lastIngress) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastIngress]);

  return (
    <div className="flex items-center space-x-6">
      {showNotification && lastIngress && (
        <div className="fixed bottom-20 right-6 bg-slate-950 border border-purple-500/50 p-4 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] animate-in slide-in-from-right-10 duration-500 z-[1000] flex items-center space-x-4 glass-panel cyber-border">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Activity size={20} className="text-purple-400 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Harvester_Ingress_Detected</span>
            <span className="text-[12px] font-bold text-white uppercase tracking-tighter">UWI: {lastIngress.uwi}</span>
            <span className="text-[8px] font-mono text-slate-500 uppercase">{lastIngress.forensicNotary}</span>
          </div>
          <button onClick={() => setShowNotification(false)} className="p-1 text-slate-600 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}
      <div className={`flex items-center space-x-3 px-4 py-1.5 border rounded-xl shadow-inner transition-all duration-500 ${
        theme === 'CLEAN' ? 'bg-slate-100 border-slate-200' :
        theme === 'HIGH_CONTRAST' ? 'bg-white border-black' :
        'bg-slate-900/80 border-purple-500/10 cyber-border'
      }`}>
        <div className="flex flex-col items-end">
          <span className={`text-[7px] font-black uppercase tracking-[0.2em] mb-0.5 ${theme === 'CLEAN' ? 'text-slate-400' : theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-slate-600'}`}>Harvester_Link</span>
          <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${
            isConnected 
              ? (theme === 'CLEAN' ? 'text-purple-600' : theme === 'HIGH_CONTRAST' ? 'text-black underline' : 'text-purple-400 text-glow-purple') 
              : (theme === 'CLEAN' ? 'text-slate-400' : theme === 'HIGH_CONTRAST' ? 'text-slate-300' : 'text-slate-600')
          }`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
          isConnected 
            ? (theme === 'CLEAN' ? 'bg-purple-600' : theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)]') 
            : (theme === 'CLEAN' ? 'bg-slate-300' : theme === 'HIGH_CONTRAST' ? 'bg-slate-100' : 'bg-slate-800')
        }`}></div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [uptime, setUptime] = useState("00:00:00");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // New state for sidebar toggle
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; error?: string } | null>(null);
  const { theme } = useTheme();
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
    forensicDeltaMap: false,
    forensicDeltaSummary: false,
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

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 0, lon: 0, error: "Geolocation not supported" });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        setUserLocation({ lat: 0, lon: 0, error: error.message });
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
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
    { id: 'forensicDeltaMap', label: 'Forensic Delta Map', icon: <MapIcon size={16} />, desc: 'Public vs Forensic Truth' },
    { id: 'forensicDeltaSummary', label: 'Forensic Delta Summary', icon: <BarChart3 size={16} />, desc: 'Report vs Real-Time Audit' },
    { id: 'timeTravelSlider', label: 'Time-Travel Slider', icon: <Activity size={16} />, desc: 'Temporal State Manager' },
  ];

  // Derived system health: Nominal if all active modules are healthy.
  // For demo purposes, we'll assume modules are healthy unless they are 'traumaNode' and 'pulseAnalyzer' simultaneously (conflict)
  const isSystemHealthy = !(engagedModules.traumaNode && engagedModules.pulseAnalyzer);

  return (
    <div className={`flex flex-col h-screen text-slate-300 font-sans overflow-hidden select-none transition-colors duration-500 ${
      theme === 'CLEAN' ? 'bg-slate-50 text-slate-900' : 
      theme === 'HIGH_CONTRAST' ? 'bg-white text-black' : 
      'bg-[var(--slate-abyssal)] text-slate-300'
    }`}>
      {/* Subtle Watermark Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0 grayscale contrast-[1.2]" 
        style={{ 
          backgroundImage: 'url("https://picsum.photos/seed/oilrig/1920/1080")', 
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      
      {/* Sovereign Header */}
      <header className={`flex items-center justify-between px-6 py-3 border-b z-[100] relative shadow-[0_4px_30px_rgba(0,0,0,0.7)] group/header transition-all duration-500 ${
        theme === 'CLEAN' ? 'bg-white border-slate-200 shadow-sm' : 
        theme === 'HIGH_CONTRAST' ? 'bg-white border-black shadow-none' : 
        'border-[var(--emerald-primary)]/20 glass-panel'
      }`}>
        <div className="flex items-center space-x-6">
          {/* Sidebar toggle button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 transition-all duration-300 border rounded group ${
              theme === 'CLEAN' ? 'text-slate-600 border-slate-200 hover:bg-slate-100' :
              theme === 'HIGH_CONTRAST' ? 'text-black border-black hover:bg-slate-200' :
              'text-slate-400 border-slate-800 hover:text-[var(--emerald-primary)] hover:border-[var(--emerald-primary)]/50 hover:bg-[var(--emerald-primary)]/5'
            }`}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} className="group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex items-center space-x-3 group-hover/header:translate-x-1 transition-transform">
             <div className={`p-1 rounded border flex items-center justify-center w-10 h-10 overflow-hidden transition-all ${
               theme === 'CLEAN' ? 'bg-slate-100 border-slate-200' :
               theme === 'HIGH_CONTRAST' ? 'bg-white border-black' :
               'bg-[var(--sovereign-gold)]/10 border-[var(--sovereign-gold)]/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] cyber-border group-hover/header:shadow-[0_0_25px_rgba(234,179,8,0.4)]'
             }`}>
                <img src="/well-tegra-logo.jpg" alt="Well-Tegra Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                <Fingerprint size={20} className={`${theme === 'CLEAN' ? 'text-slate-900' : theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-[var(--sovereign-gold)]'} hidden`} />
             </div>
             <div className="flex flex-col">
               <span className={`text-[11px] font-black uppercase tracking-[0.3em] transition-all ${
                 theme === 'CLEAN' ? 'text-slate-900' :
                 theme === 'HIGH_CONTRAST' ? 'text-black' :
                 'text-white text-glow-emerald group-hover/header:tracking-[0.35em]'
               }`}>Well-Tegra [WETE]</span>
               <span className={`text-[9px] font-bold uppercase tracking-widest transition-all ${
                 theme === 'CLEAN' ? 'text-slate-500' :
                 theme === 'HIGH_CONTRAST' ? 'text-black' :
                 'text-[var(--sovereign-gold)] text-glow-gold'
               }`}>Sovereign Audit Terminal // NSTA NDR API</span>
             </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className={`hidden xl:flex items-center space-x-6 text-[10px] font-bold uppercase font-terminal transition-colors ${
            theme === 'CLEAN' ? 'text-slate-600' :
            theme === 'HIGH_CONTRAST' ? 'text-black' :
            'text-slate-400'
          }`}>
            <ThemeToggle />
            <UnitToggle />
            <span className="flex items-center"><Cpu size={14} className={`mr-2 animate-pulse ${theme === 'CLEAN' ? 'text-slate-900' : theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-[var(--emerald-primary)]'}`} /> Uptime: {uptime}</span>
            <span className={`flex items-center ${theme === 'CLEAN' ? 'text-slate-900' : theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-[var(--emerald-primary)] text-glow-emerald'}`}><Wifi size={14} className="mr-2" /> Connection: Verified</span>
          </div>
          <div className={`h-8 w-px ${theme === 'CLEAN' ? 'bg-slate-200' : theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-slate-800/50'}`}></div>
          <button className={`p-2 transition-all duration-300 border rounded group relative overflow-hidden ${
            theme === 'CLEAN' ? 'text-slate-400 hover:text-red-600 border-slate-200 hover:bg-red-50' :
            theme === 'HIGH_CONTRAST' ? 'text-black border-black hover:bg-slate-100' :
            'text-[var(--alert-red)]/60 hover:text-[var(--alert-red)] border-[var(--alert-red)]/20 hover:bg-[var(--alert-red)]/10 hover:border-[var(--alert-red)]/50'
          }`}>
            <div className="absolute inset-0 bg-current opacity-0 group-hover:opacity-5 transition-opacity"></div>
            <Power size={18} className="group-hover:scale-110 group-hover:rotate-12 transition-transform relative z-10" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Global Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(var(--emerald-primary) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        {/* Engagement Sidebar */}
        <aside className={`flex-shrink-0 ${isSidebarOpen ? 'w-72' : 'w-16'} border-r transition-all duration-300 ease-in-out relative group/sidebar z-50 flex flex-col shadow-2xl ${
          theme === 'CLEAN' ? 'bg-white border-slate-200' :
          theme === 'HIGH_CONTRAST' ? 'bg-white border-black border-r-2' :
          'border-[var(--emerald-primary)]/10 glass-panel'
        }`}>
          <div className={`absolute inset-0 bg-gradient-to-b from-[var(--emerald-primary)]/5 to-transparent opacity-0 group-hover/sidebar:opacity-100 transition-opacity pointer-events-none ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'hidden' : ''}`}></div>
          <div className={`p-6 border-b relative z-10 transition-all ${!isSidebarOpen ? 'hidden' : ''} ${
            theme === 'CLEAN' ? 'bg-slate-50 border-slate-200' :
            theme === 'HIGH_CONTRAST' ? 'bg-white border-black border-b-2' :
            'border-[var(--emerald-primary)]/10 bg-[var(--slate-abyssal)]/30'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-3">
                <Layers size={18} className={theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'text-slate-900' : 'text-[var(--sovereign-gold)] animate-pulse'} />
                <span className={`font-black uppercase tracking-widest text-[11px] transition-all ${
                  theme === 'CLEAN' ? 'text-slate-900' :
                  theme === 'HIGH_CONTRAST' ? 'text-black' :
                  'text-white text-glow-gold'
                }`}>Active Modules</span>
              </div>
              <button 
                onClick={() => setEngagedModules(Object.keys(engagedModules).reduce((acc, key) => ({ ...acc, [key]: false }), {}))}
                className={`text-[9px] font-bold uppercase tracking-widest transition-all px-2 py-1 border rounded ${
                  theme === 'CLEAN' ? 'text-slate-400 border-slate-200 hover:text-red-500 hover:border-red-200 hover:bg-red-50' :
                  theme === 'HIGH_CONTRAST' ? 'text-black border-black hover:bg-black hover:text-white' :
                  'text-slate-400 border-slate-800 hover:text-[var(--alert-red)] hover:border-[var(--alert-red)]/30 bg-slate-900/50 hover:bg-[var(--alert-red)]/5'
                }`}
              >
                Clear All
              </button>
            </div>
            <span className={`text-[8px] uppercase font-bold tracking-tighter transition-all ${
              theme === 'CLEAN' ? 'text-slate-400' :
              theme === 'HIGH_CONTRAST' ? 'text-black' :
              'text-slate-500'
            }`}>Physical Engagement Switches</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-10">
            {moduleDefinitions.map((mod) => (
              <div 
                key={mod.id} 
                onClick={() => toggleModule(mod.id)}
                className={`p-4 border rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                  engagedModules[mod.id] 
                    ? (theme === 'CLEAN' ? 'bg-emerald-50 border-emerald-500 shadow-sm scale-[1.02]' : 
                       theme === 'HIGH_CONTRAST' ? 'bg-black text-white border-black scale-[1.02]' :
                       'bg-[var(--emerald-primary)]/10 border-[var(--emerald-primary)]/50 shadow-[0_0_20px_rgba(34,197,94,0.15)] cyber-border scale-[1.02]')
                    : (theme === 'CLEAN' ? 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50 hover:scale-[1.01]' :
                       theme === 'HIGH_CONTRAST' ? 'bg-white border-black text-black hover:bg-slate-100 hover:scale-[1.01]' :
                       'bg-slate-900/40 border-slate-800/50 hover:border-[var(--emerald-primary)]/30 hover:bg-slate-900/60 hover:scale-[1.01]')
                }`}
                data-testid={`module-toggle-${mod.id}`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                      engagedModules[mod.id] 
                        ? (theme === 'CLEAN' ? 'bg-emerald-500 text-white shadow-sm' :
                           theme === 'HIGH_CONTRAST' ? 'bg-white text-black' :
                           'bg-[var(--emerald-primary)] text-slate-950 shadow-[0_0_15px_var(--emerald-primary)]')
                        : (theme === 'CLEAN' ? 'bg-slate-100 text-slate-400 group-hover:text-slate-600' :
                           theme === 'HIGH_CONTRAST' ? 'bg-white border border-black text-black' :
                           'bg-slate-800 text-slate-500 group-hover:text-slate-300')
                    }`}>
                      {mod.icon}
                    </div>
                    {isSidebarOpen && (
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-tight transition-colors ${
                          engagedModules[mod.id] 
                            ? (theme === 'CLEAN' ? 'text-emerald-900' :
                               theme === 'HIGH_CONTRAST' ? 'text-white' :
                               'text-white text-glow-emerald')
                            : (theme === 'CLEAN' ? 'text-slate-500 group-hover:text-slate-700' :
                               theme === 'HIGH_CONTRAST' ? 'text-black' :
                               'text-slate-500 group-hover:text-slate-400')
                        }`}>
                          {mod.label}
                        </span>
                        <span className={`text-[8px] font-bold uppercase font-terminal transition-all ${
                          theme === 'CLEAN' ? 'text-slate-400' :
                          theme === 'HIGH_CONTRAST' ? 'text-white/70' :
                          'text-slate-600'
                        }`}>{mod.desc}</span>
                      </div>
                    )}
                  </div>
                  
                  {isSidebarOpen ? (
                    <div className={`w-8 h-4 rounded-full relative transition-colors duration-500 ${
                      engagedModules[mod.id] 
                        ? (theme === 'CLEAN' ? 'bg-emerald-500' : theme === 'HIGH_CONTRAST' ? 'bg-white' : 'bg-[var(--emerald-primary)]') 
                        : (theme === 'CLEAN' ? 'bg-slate-200' : theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-slate-800')
                    }`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ${
                        engagedModules[mod.id] ? 'left-4.5' : 'left-0.5'
                      } ${
                        theme === 'CLEAN' ? 'bg-white' :
                        theme === 'HIGH_CONTRAST' ? (engagedModules[mod.id] ? 'bg-black' : 'bg-white') :
                        'bg-white'
                      }`}></div>
                    </div>
                  ) : (
                    engagedModules[mod.id] && (
                      <div className={`absolute top-1/2 right-1 -translate-y-1/2 w-2 h-2 rounded-full shadow-[0_0_8px_var(--emerald-primary)] ${
                        theme === 'CLEAN' ? 'bg-emerald-500' :
                        theme === 'HIGH_CONTRAST' ? 'bg-black' :
                        'bg-[var(--emerald-primary)]'
                      }`}></div>
                    )
                  )}
                </div>
                {engagedModules[mod.id] && theme !== 'CLEAN' && theme !== 'HIGH_CONTRAST' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--emerald-primary)]/10 to-transparent pointer-events-none scanline-effect"></div>
                )}
              </div>
            ))}
          </div>

          <div className={`p-6 glass-panel border-t border-[var(--emerald-primary)]/10 relative z-10 ${!isSidebarOpen ? 'hidden' : ''}`}>
             <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4">
                <span>System Health</span>
                <span className={isSystemHealthy ? "text-[var(--emerald-primary)] text-glow-emerald" : "text-[var(--alert-red)] text-glow-red animate-pulse"}>
                  {isSystemHealthy ? "98% Nominal" : "Critical Alert"}
                </span>
             </div>
             <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full transition-all duration-500 ${isSystemHealthy ? 'bg-[var(--emerald-primary)] w-[98%] shadow-[0_0_10px_var(--emerald-primary)]' : 'bg-[var(--alert-red)] w-[40%] shadow-[0_0_15px_var(--alert-red)]'}`}></div>
             </div>
          </div>
        </aside>

        {/* Main Stage Grid */}
        <div className="flex-1 relative bg-[var(--slate-abyssal)] overflow-hidden scanline-effect">
          <div className="absolute inset-0 p-6 overflow-y-auto custom-scrollbar z-10">
             <SovereignStage 
               engagedModules={engagedModules} 
               selectedTargetId={selectedTargetId}
               userLocation={userLocation}
               onSelectTarget={(target) => setSelectedTargetId(target.ASSET)}
             />
          </div>
          
          {/* Subtle Scanning Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-10 border-[20px] border-[var(--emerald-primary)]/5 mix-blend-overlay z-20"></div>
          
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[var(--emerald-primary)]/40 pointer-events-none z-30"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[var(--emerald-primary)]/40 pointer-events-none z-30"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[var(--emerald-primary)]/40 pointer-events-none z-30"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[var(--emerald-primary)]/40 pointer-events-none z-30"></div>
        </div>
      </main>

      {/* Persistent Taskbar */}
      <footer className={`h-14 border-t z-[100] relative flex items-center justify-between px-6 transition-all duration-500 ${
        theme === 'CLEAN' ? 'bg-white border-slate-200 shadow-sm' :
        theme === 'HIGH_CONTRAST' ? 'bg-white border-black border-t-2 shadow-none' :
        'border-[var(--emerald-primary)]/20 glass-panel shadow-[0_-10px_40px_rgba(0,0,0,0.7)]'
      }`}>
        <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar max-w-[70%] py-2">
          <div className={`flex items-center space-x-2 border-r pr-4 mr-2 flex-shrink-0 transition-all ${
            theme === 'CLEAN' ? 'border-slate-200' :
            theme === 'HIGH_CONTRAST' ? 'border-black' :
            'border-slate-800/50'
          }`}>
            <Layers size={14} className={theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'text-slate-400' : 'text-slate-600'} />
            <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${
              theme === 'CLEAN' ? 'text-slate-400' :
              theme === 'HIGH_CONTRAST' ? 'text-black' :
              'text-slate-600'
            }`}>Active_Array</span>
          </div>
          
          {moduleDefinitions.filter(m => engagedModules[m.id]).map(m => (
            <div key={m.id} className={`flex items-center space-x-3 px-3 py-1.5 border rounded-lg animate-in fade-in slide-in-from-bottom-2 duration-300 flex-shrink-0 transition-all group ${
              theme === 'CLEAN' ? 'bg-white border-slate-200 hover:border-emerald-300' :
              theme === 'HIGH_CONTRAST' ? 'bg-black text-white border-black' :
              'bg-slate-900/60 border-[var(--emerald-primary)]/20 hover:border-[var(--emerald-primary)]/50 hover:bg-slate-900/80'
            }`}>
              <div className={`transition-transform group-hover:scale-110 ${
                theme === 'CLEAN' ? 'text-emerald-500' :
                theme === 'HIGH_CONTRAST' ? 'text-white' :
                'text-[var(--emerald-primary)]'
              }`}>{m.icon}</div>
              <div className="flex flex-col">
                <span className={`text-[9px] font-black uppercase tracking-tighter leading-none mb-0.5 transition-all ${
                  theme === 'CLEAN' ? 'text-slate-900' :
                  theme === 'HIGH_CONTRAST' ? 'text-white' :
                  'text-white text-glow-emerald'
                }`}>{m.label}</span>
                <span className={`text-[7px] font-bold uppercase truncate max-w-[100px] leading-none font-terminal transition-all ${
                  theme === 'CLEAN' ? 'text-slate-400' :
                  theme === 'HIGH_CONTRAST' ? 'text-white/70' :
                  'text-slate-500'
                }`}>{m.desc}</span>
              </div>
            </div>
          ))}
          
          {Object.values(engagedModules).every(v => !v) && (
            <span className={`text-[9px] font-bold uppercase italic tracking-widest transition-all ${
              theme === 'CLEAN' ? 'text-slate-400' :
              theme === 'HIGH_CONTRAST' ? 'text-black' :
              'text-slate-700'
            }`}>No Active Modules Engaged</span>
          )}
        </div>

        <div className="flex items-center space-x-6">
          <HarvesterStatus />
          <div className={`flex items-center space-x-4 px-4 py-1.5 border rounded-xl shadow-inner transition-all ${
            theme === 'CLEAN' ? 'bg-slate-50 border-slate-200' :
            theme === 'HIGH_CONTRAST' ? 'bg-white border-black' :
            'bg-slate-900/80 border-[var(--emerald-primary)]/10 cyber-border'
          }`}>
            <div className="flex flex-col items-end">
              <span className={`text-[7px] font-black uppercase tracking-[0.2em] mb-0.5 transition-all ${
                theme === 'CLEAN' ? 'text-slate-400' :
                theme === 'HIGH_CONTRAST' ? 'text-black' :
                'text-slate-600'
              }`}>System_Health</span>
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                isSystemHealthy 
                  ? (theme === 'CLEAN' ? 'text-emerald-600' : theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-[var(--emerald-primary)] text-glow-emerald') 
                  : (theme === 'CLEAN' ? 'text-red-600 animate-pulse' : theme === 'HIGH_CONTRAST' ? 'text-black animate-pulse' : 'text-[var(--alert-red)] text-glow-red animate-pulse')
              }`}>
                {isSystemHealthy ? 'Nominal' : 'Alert_Detected'}
              </span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full transition-all ${
              isSystemHealthy 
                ? (theme === 'CLEAN' ? 'bg-emerald-500' : theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-[var(--emerald-primary)] shadow-[0_0_12px_var(--emerald-primary)]') 
                : (theme === 'CLEAN' ? 'bg-red-500 animate-pulse' : theme === 'HIGH_CONTRAST' ? 'bg-black animate-pulse' : 'bg-[var(--alert-red)] shadow-[0_0_12px_var(--alert-red)] animate-pulse')
            }`}></div>
          </div>
          
          <div className={`hidden md:flex items-center space-x-6 border-l pl-6 transition-all ${
            theme === 'CLEAN' ? 'border-slate-200' :
            theme === 'HIGH_CONTRAST' ? 'border-black' :
            'border-slate-800/50'
          }`}>
             <div className="flex flex-col items-end">
               <span className={`text-[7px] font-black uppercase tracking-widest transition-all ${
                 theme === 'CLEAN' ? 'text-slate-400' :
                 theme === 'HIGH_CONTRAST' ? 'text-black' :
                 'text-slate-700'
               }`}>Temporal_Sync</span>
               <span className={`text-[10px] font-mono transition-all ${
                 theme === 'CLEAN' ? 'text-slate-500' :
                 theme === 'HIGH_CONTRAST' ? 'text-black' :
                 'text-slate-500'
               }`}>{new Date().toLocaleTimeString()}</span>
             </div>
             <div className="flex items-center space-x-1.5">
                <div className={`w-1 h-4 rounded-full transition-all duration-300 ${isSystemHealthy ? (theme === 'CLEAN' ? 'bg-emerald-100' : theme === 'HIGH_CONTRAST' ? 'bg-slate-200' : 'bg-[var(--emerald-primary)]/20') : (theme === 'CLEAN' ? 'bg-red-100' : theme === 'HIGH_CONTRAST' ? 'bg-slate-200' : 'bg-[var(--alert-red)]/20')}`}></div>
                <div className={`w-1 h-4 rounded-full transition-all duration-300 ${isSystemHealthy ? (theme === 'CLEAN' ? 'bg-emerald-200' : theme === 'HIGH_CONTRAST' ? 'bg-slate-300' : 'bg-[var(--emerald-primary)]/40') : (theme === 'CLEAN' ? 'bg-red-200' : theme === 'HIGH_CONTRAST' ? 'bg-slate-300' : 'bg-[var(--alert-red)]/40')}`}></div>
                <div className={`w-1 h-4 rounded-full transition-all duration-300 ${isSystemHealthy ? (theme === 'CLEAN' ? 'bg-emerald-300' : theme === 'HIGH_CONTRAST' ? 'bg-slate-400' : 'bg-[var(--emerald-primary)]/60') : (theme === 'CLEAN' ? 'bg-red-300' : theme === 'HIGH_CONTRAST' ? 'bg-slate-400' : 'bg-[var(--alert-red)]/60')}`}></div>
                <div className={`w-1 h-4 rounded-full transition-all duration-300 ${isSystemHealthy ? (theme === 'CLEAN' ? 'bg-emerald-500 shadow-sm' : theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-[var(--emerald-primary)] shadow-[0_0_8px_var(--emerald-primary)]') : (theme === 'CLEAN' ? 'bg-red-500 shadow-sm' : theme === 'HIGH_CONTRAST' ? 'bg-black' : 'bg-[var(--alert-red)] shadow-[0_0_8px_var(--alert-red)]')}`}></div>
             </div>
          </div>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--emerald-primary); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .font-terminal { font-family: 'Fira Code', monospace; }
        
        /* Global Cyber-Forensic Theme Overrides */
        .glass-panel {
          background: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'white' : 'rgba(15, 23, 42, 0.85)'};
          backdrop-filter: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'none' : 'blur(16px) saturate(180%)'};
          border: 1px solid ${theme === 'CLEAN' ? '#e2e8f0' : theme === 'HIGH_CONTRAST' ? '#000000' : 'rgba(34, 197, 94, 0.15)'};
          box-shadow: ${theme === 'CLEAN' ? '0 1px 3px rgba(0,0,0,0.1)' : theme === 'HIGH_CONTRAST' ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.6)'};
        }

        .cyber-border {
          border: 1px solid ${theme === 'CLEAN' ? '#e2e8f0' : theme === 'HIGH_CONTRAST' ? '#000000' : 'rgba(34, 197, 94, 0.3)'};
          position: relative;
        }

        .cyber-border::before {
          content: "";
          position: absolute;
          top: -2px;
          left: -2px;
          width: 12px;
          height: 12px;
          border-top: 3px solid ${theme === 'CLEAN' ? '#10b981' : theme === 'HIGH_CONTRAST' ? '#000000' : 'var(--emerald-primary)'};
          border-left: 3px solid ${theme === 'CLEAN' ? '#10b981' : theme === 'HIGH_CONTRAST' ? '#000000' : 'var(--emerald-primary)'};
          pointer-events: none;
          z-index: 10;
          display: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'none' : 'block'};
        }

        .cyber-border::after {
          content: "";
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          border-bottom: 3px solid ${theme === 'CLEAN' ? '#10b981' : theme === 'HIGH_CONTRAST' ? '#000000' : 'var(--emerald-primary)'};
          border-right: 3px solid ${theme === 'CLEAN' ? '#10b981' : theme === 'HIGH_CONTRAST' ? '#000000' : 'var(--emerald-primary)'};
          pointer-events: none;
          z-index: 10;
          display: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'none' : 'block'};
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        .scanline-effect {
          position: relative;
          overflow: hidden;
        }

        .scanline-effect::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, transparent 0%, rgba(34, 197, 94, 0.1) 50%, transparent 100%);
          opacity: 0.05;
          pointer-events: none;
          animation: scanline 10s linear infinite;
          z-index: 5;
          display: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'none' : 'block'};
        }

        /* High contrast text utilities */
        .text-glow-emerald { text-shadow: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'none' : '0 0 10px rgba(34, 197, 94, 0.6)'}; }
        .text-glow-gold { text-shadow: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'none' : '0 0 10px rgba(234, 179, 8, 0.6)'}; }
        .text-glow-red { text-shadow: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'none' : '0 0 10px rgba(239, 68, 68, 0.6)'}; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? '#f1f5f9' : 'rgba(15, 23, 42, 0.5)'}; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? '#cbd5e1' : '#1e293b'}; border-radius: 10px; border: 1px solid ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? '#e2e8f0' : 'rgba(34, 197, 94, 0.1)'}; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--emerald-primary); box-shadow: ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'none' : '0 0 10px var(--emerald-primary)'}; }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <UnitProvider>
      <HarvesterProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </HarvesterProvider>
    </UnitProvider>
  );
};

export default App;
