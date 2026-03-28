
import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, Radar, Target, Flame, Database, 
  Map as MapIcon, ChevronRight, Activity, 
  ShieldAlert, Hash, Crosshair, AlertTriangle,
  Search, Loader2, Download, Terminal, BarChart3,
  Ghost, Box, FileSearch, Lock, Anchor, Globe, Beaker, BookOpen, Scale,
  Maximize2, Minimize2, ExternalLink, X
} from 'lucide-react';
import { MissionTarget, ForensicWell } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import MissionControl from './MissionControl';
import GhostSync from './GhostSync';
import TraumaNode from './TraumaNode';
import PulseAnalyzer from './PulseAnalyzer';
import ReportsScanner from './ReportsScanner';
import WellBoreSchematic from './WellBoreSchematic';
import Vault from './Vault';
import LegacyRecovery from './LegacyRecovery';
import NorwaySovereign from './NorwaySovereign';
import ChanonryProtocol from './ChanonryProtocol';
import ProtocolManual from './ProtocolManual';
import NDRModernization from './NDRModernization';
import CerberusSimulator from './CerberusSimulator';
import WETEForensicScanner from './WETEForensicScanner';
import ForensicDeltaMap from './ForensicDeltaMap';
import ForensicDeltaSummary from './ForensicDeltaSummary';
import TimeTravelSlider from './TimeTravelSlider';
import BrahanPersonalTerminal from './BrahanPersonalTerminal';
import { MOCK_WELLS } from '../constants';
import { useTheme } from '../src/context/ThemeContext';

// Import Gemini service for AI insight
import { getForensicInsight } from '../services/geminiService';
// Import PDF generation service
import { generateSovereignAudit, AuditData } from '../reporting/pdfEngine';


const mockPulseData = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  pressure: 2500 + Math.sin(i * 0.8) * 200 + Math.random() * 50,
  limit: 2800
}));

const mockSubsidenceData = Array.from({ length: 15 }, (_, i) => ({
  dist: i * 10,
  error: 4.26 + Math.random() * 0.2,
  nominal: 0
}));

interface StageProps {
  engagedModules: Record<string, boolean>;
  selectedTargetId: string | null;
  userLocation: { lat: number; lon: number; error?: string } | null;
  onSelectTarget: (target: MissionTarget) => void;
}

const SovereignStage: React.FC<StageProps> = ({ engagedModules, selectedTargetId, userLocation, onSelectTarget }) => {
  const activeCount = Object.values(engagedModules).filter(Boolean).length;
  const { theme } = useTheme();

  const [geminiInsight, setGeminiInsight] = useState<string>('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [isTraumaNodeFocused, setIsTraumaNodeFocused] = useState(false);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(MOCK_WELLS[0]?.id || null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'TAB' | 'GRID'>('TAB');
  const [fullscreenModule, setFullscreenModule] = useState<string | null>(null);

  const prevEngagedRef = useRef(engagedModules);

  const MODULE_METADATA = [
    { id: 'missionControl', label: 'Mission Control', icon: <Compass size={14} />, canPopout: false },
    { id: 'globalScavenger', label: 'Global Scavenger', icon: <Radar size={14} />, canPopout: true },
    { id: 'scaleAbyss', label: 'Scale Abyss', icon: <Compass size={14} />, canPopout: true },
    { id: 'phantomSteel', label: 'Phantom Steel', icon: <Target size={14} />, canPopout: true },
    { id: 'chemicalRot', label: 'Chemical Rot', icon: <Flame size={14} />, canPopout: true },
    { id: 'ghostReserve', label: 'Ghost Reserve', icon: <Database size={14} />, canPopout: true },
    { id: 'ghostSync', label: 'Ghost Sync', icon: <Activity size={14} />, canPopout: true },
    { id: 'traumaNode', label: 'Trauma Node', icon: <ShieldAlert size={14} />, canPopout: true },
    { id: 'pulseAnalyzer', label: 'Pulse Analyzer', icon: <Activity size={14} />, canPopout: true },
    { id: 'reportsScanner', label: 'Reports Scanner', icon: <Search size={14} />, canPopout: true },
    { id: 'wellBoreSchematic', label: 'Wellbore Schematic', icon: <Target size={14} />, canPopout: true },
    { id: 'vault', label: 'Sovereign Vault', icon: <Database size={14} />, canPopout: true },
    { id: 'legacyRecovery', label: 'Legacy Recovery', icon: <Activity size={14} />, canPopout: true },
    { id: 'norwaySovereign', label: 'Norway Sovereign', icon: <ShieldAlert size={14} />, canPopout: true },
    { id: 'chanonryProtocol', label: 'Chanonry Protocol', icon: <ShieldAlert size={14} />, canPopout: true },
    { id: 'protocolManual', label: 'Protocol Manual', icon: <ShieldAlert size={14} />, canPopout: true },
    { id: 'ndrModernization', label: 'NDR Modernization', icon: <Activity size={14} />, canPopout: true },
    { id: 'cerberusSimulator', label: 'Cerberus Simulator', icon: <ShieldAlert size={14} />, canPopout: true },
    { id: 'weteForensicScanner', label: 'WETE Forensic Scanner', icon: <Search size={14} />, canPopout: true },
    { id: 'forensicDeltaMap', label: 'Forensic Delta Map', icon: <MapIcon size={14} />, canPopout: true },
    { id: 'forensicDeltaSummary', label: 'Forensic Delta Summary', icon: <BarChart3 size={14} />, canPopout: true },
    { id: 'timeTravelSlider', label: 'Time-Travel Slider', icon: <Activity size={14} />, canPopout: true },
    { id: 'brahanPersonalTerminal', label: 'Personal Terminal', icon: <Terminal size={14} />, canPopout: true },
  ];

  // Sync activeTab with engagedModules
  useEffect(() => {
    const engagedKeys = Object.keys(engagedModules || {}).filter(k => engagedModules && engagedModules[k]);
    const prevEngagedKeys = Object.keys(prevEngagedRef.current || {}).filter(k => prevEngagedRef.current && prevEngagedRef.current[k]);
    
    // Find if a new module was just engaged
    const added = engagedKeys.find(k => prevEngagedKeys && !prevEngagedKeys.includes(k));
    
    if (added) {
      setActiveTab(added);
    } else if (engagedKeys.length === 0) {
      setActiveTab(null);
    } else if (activeTab && engagedModules && !engagedModules[activeTab]) {
      // If current tab was closed, switch to another one
      setActiveTab(engagedKeys[0] || null);
    } else if (!activeTab && engagedKeys.length > 0) {
      setActiveTab(engagedKeys[0]);
    }
    
    prevEngagedRef.current = engagedModules;
  }, [engagedModules, activeTab]);

  const renderModule = (moduleId: string) => {
    const isFullscreen = fullscreenModule === moduleId;
    const moduleMeta = MODULE_METADATA.find(m => m.id === moduleId);

    const wrapModule = (children: React.ReactNode) => (
      <div key={moduleId} className={`relative group ${isFullscreen ? 'fixed inset-4 z-[100] bg-slate-950 shadow-[0_0_100px_rgba(0,0,0,0.9)]' : ''}`}>
        {moduleMeta?.canPopout && (
          <div className="absolute top-4 right-4 z-[110] opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setFullscreenModule(isFullscreen ? null : moduleId)}
              className="p-2 bg-slate-900/90 border border-emerald-500/30 rounded hover:border-emerald-500 text-emerald-500 transition-all shadow-xl"
              title={isFullscreen ? "Minimize" : "Pop-out (Fullscreen)"}
            >
              {isFullscreen ? <X size={14} /> : <Box size={14} />}
            </button>
          </div>
        )}
        {children}
      </div>
    );

    switch (moduleId) {
      case 'missionControl': return wrapModule(<MissionControl onSelectTarget={onSelectTarget} isAnalyzing={false} />);
      case 'globalScavenger': return wrapModule(
        <div className="h-96 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 glass-panel cyber-border scanline-effect">
          <div className="p-4 bg-slate-900/50 border-b border-[var(--emerald-primary)]/20 flex items-center justify-between glass-panel">
            <div className="flex items-center space-x-3">
              <MapIcon size={16} className="text-[var(--emerald-primary)] text-glow-emerald" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Global Scavenger // OSINT</span>
            </div>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--emerald-primary)] animate-pulse shadow-[0_0_8px_var(--emerald-primary)]"></div>
            </div>
          </div>
          <div className="flex-1 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 relative">
            <div className="absolute inset-0 flex items-center justify-center border-4 border-[var(--emerald-primary)]/5">
                <Crosshair size={100} className="text-[var(--emerald-primary)]/20" />
            </div>
            <div className="absolute bottom-4 left-4 p-3 bg-slate-950/80 border border-[var(--emerald-primary)]/30 rounded-lg glass-panel">
                <span className="text-[8px] font-mono text-[var(--emerald-primary)] block">LAT: 58.12.44N</span>
                <span className="text-[8px] font-mono text-[var(--emerald-primary)] block">LON: 01.33.22E</span>
            </div>
          </div>
        </div>
      );
      case 'scaleAbyss': return wrapModule(
        <div className="h-96 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 glass-panel cyber-border scanline-effect">
          <div className="p-4 bg-slate-900/50 border-b border-[var(--emerald-primary)]/20 flex items-center justify-between glass-panel">
            <div className="flex items-center space-x-3">
              <Compass size={16} className="text-[var(--sovereign-gold)] text-glow-gold" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Scale Abyss // 4.26m Error</span>
            </div>
            <span className="text-[8px] font-black px-2 py-1 bg-[var(--sovereign-gold)]/10 text-[var(--sovereign-gold)] border border-[var(--sovereign-gold)]/30 rounded shadow-[0_0_10px_rgba(234,179,8,0.2)] glass-panel">Veto Active</span>
          </div>
          <div className="flex-1 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockSubsidenceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--emerald-primary)" opacity={0.1} />
                  <XAxis dataKey="dist" hide />
                  <YAxis stroke="var(--emerald-primary)" opacity={0.4} fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid var(--emerald-primary)', opacity: 0.8 }} />
                  <Line type="step" dataKey="error" stroke="var(--alert-red)" strokeWidth={3} dot={{ r: 4, fill: 'var(--alert-red)' }} />
                  <Line type="monotone" dataKey="nominal" stroke="var(--emerald-primary)" strokeDasharray="5 5" opacity={0.5} />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case 'phantomSteel': return wrapModule(
        <div className="h-96 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 glass-panel cyber-border scanline-effect">
          <div className="p-4 bg-slate-900/50 border-b border-[var(--emerald-primary)]/20 flex items-center justify-between glass-panel">
            <div className="flex items-center space-x-3">
              <Target size={16} className="text-[var(--alert-red)] text-glow-red" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Phantom Steel // Echo Pulse</span>
            </div>
            <Activity size={14} className="text-[var(--alert-red)] animate-bounce" />
          </div>
          <div className="flex-1 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPulseData}>
                  <defs>
                    <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--alert-red)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--alert-red)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 5" stroke="var(--emerald-primary)" opacity={0.1} />
                  <XAxis dataKey="time" hide />
                  <YAxis stroke="var(--emerald-primary)" opacity={0.4} fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid var(--emerald-primary)', opacity: 0.8 }} />
                  <Area type="monotone" dataKey="pressure" stroke="var(--alert-red)" fillOpacity={1} fill="url(#colorPulse)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
      case 'chemicalRot': return wrapModule(
        <div className="h-96 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 glass-panel cyber-border scanline-effect">
          <div className="p-4 bg-slate-900/50 border-b border-[var(--emerald-primary)]/20 flex items-center justify-between glass-panel">
            <div className="flex items-center space-x-3">
              <Flame size={16} className="text-orange-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Chemical Rot // Casing Pressure</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-8 grid-rows-8 gap-1 p-4">
            {Array.from({ length: 64 }).map((_, i) => (
              <div 
                key={i} 
                className="rounded-sm border border-slate-800 transition-colors duration-1000"
                style={{ backgroundColor: `rgba(249, 115, 22, ${Math.random() * 0.4})` }}
              ></div>
            ))}
          </div>
        </div>
      );
      case 'ghostReserve': return wrapModule(
        <div className="h-96 bg-[var(--slate-abyssal)]/40 border border-[var(--emerald-primary)]/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 glass-panel cyber-border scanline-effect">
          <div className="p-4 bg-slate-900/50 border-b border-[var(--emerald-primary)]/20 flex items-center justify-between glass-panel">
            <div className="flex items-center space-x-3">
              <Database size={16} className="text-[var(--emerald-primary)] text-glow-emerald" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Ghost Reserve // PVT Audit</span>
            </div>
          </div>
          <div className="flex-1 p-6 flex flex-col space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 bg-slate-900/80 border border-[var(--emerald-primary)]/20 rounded-lg flex items-center justify-between glass-panel">
                  <div className="flex items-center space-x-3">
                    <ShieldAlert size={14} className="text-[var(--alert-red)]" />
                    <span className="text-[9px] font-mono text-slate-400 uppercase">ANOMALY_TRX_{i}0042</span>
                  </div>
                  <span className="text-[10px] font-black text-[var(--emerald-primary)]">+14.2% Delta</span>
              </div>
            ))}
            <div className="mt-auto p-4 bg-[var(--alert-red)]/5 border border-[var(--alert-red)]/20 rounded-xl flex items-start space-x-3">
                <AlertTriangle size={16} className="text-[var(--alert-red)] mt-0.5" />
                <p className="text-[9px] text-[var(--alert-red)]/80 font-bold uppercase leading-tight">
                  Mass-balance discordance detected in Sector 4. Re-calculating PVT Reconstitution...
                </p>
            </div>
          </div>
        </div>
      );
      case 'ghostSync': return wrapModule(<GhostSync wellId={selectedWellId} />);
      case 'traumaNode': return wrapModule(
        <div className={isTraumaNodeFocused ? "h-[800px]" : "h-[600px]"}>
          <TraumaNode 
            isFocused={isTraumaNodeFocused} 
            onToggleFocus={() => setIsTraumaNodeFocused(!isTraumaNodeFocused)} 
            wellId={selectedWellId}
          />
        </div>
      );
      case 'pulseAnalyzer': return wrapModule(<PulseAnalyzer />);
      case 'reportsScanner': return wrapModule(<ReportsScanner />);
      case 'wellBoreSchematic': return wrapModule(<WellBoreSchematic wellId={selectedWellId} />);
      case 'vault': return wrapModule(<Vault />);
      case 'legacyRecovery': return wrapModule(<LegacyRecovery />);
      case 'norwaySovereign': return wrapModule(<NorwaySovereign />);
      case 'chanonryProtocol': return wrapModule(<ChanonryProtocol />);
      case 'protocolManual': return wrapModule(<ProtocolManual />);
      case 'ndrModernization': return wrapModule(<NDRModernization />);
      case 'cerberusSimulator': return wrapModule(<CerberusSimulator />);
      case 'weteForensicScanner': return wrapModule(<WETEForensicScanner />);
      case 'forensicDeltaMap': return wrapModule(
        <ForensicDeltaMap 
          highlightedField={selectedTargetId} 
          userLocation={userLocation} 
          selectedWellId={selectedWellId}
          onSelectWell={(wellId: string) => {
            setSelectedWellId(wellId);
            const well = MOCK_WELLS.find((w: ForensicWell) => w.id === wellId);
            if (well) {
              onSelectTarget({ 
                ASSET: well.field, 
                REGION: 'North Sea', 
                BLOCKS: [], 
                ANOMALY_TYPE: 'Forensic Discordance', 
                DATA_PORTAL: 'NSTA', 
                PRIORITY: well.status === 'critical' ? 'CRITICAL' : 'HIGH' 
              });
            }
          }}
        />
      );
      case 'forensicDeltaSummary': return wrapModule(<ForensicDeltaSummary selectedWellId={selectedWellId} />);
      case 'timeTravelSlider': return wrapModule(<TimeTravelSlider />);
      case 'brahanPersonalTerminal': return wrapModule(<BrahanPersonalTerminal />);
      default: return null;
    }
  };

  // Placeholder for collected audit data (this would ideally come from context or props)
  const mockAuditData: AuditData = {
      uwi: "211/18-A45",
      projectName: "Thistle A7 Legacy",
      projectId: "THISTLE1978well0001",
      sha512: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      offset: 14.5,
      pulseDiagnosis: {
          status: "CRITICAL: RAPID FLOW BREACH",
          slope: 16.2345,
          rSquared: 0.999,
          diagnosis: "Extreme linear recharge at 16.23 PSI/unit. Direct high-pressure conduit confirmed."
      },
      traumaLog: [{ timestamp: new Date().toISOString(), layer: 'METAL_LOSS', depth: 1245.5, value: 22, unit: 'mm', severity: 'CRITICAL', description: 'Simulated metal loss at casing' }], // Mock a critical log entry
      tallyAudit: {
          reportId: "DDR-2024-002",
          discordance: 0.051,
          totalTally: 1245.449,
          reportedDepth: 1245.5
      },
      timestamp: new Date().toISOString(),
      forensicInsight: "Initial placeholder insight for Gemini."
  };

  const handleGenerateInsight = async () => {
      setIsGeneratingInsight(true);
      const summary = `UWI: ${mockAuditData.uwi}, Project: ${mockAuditData.projectName}, Datum Offset: ${mockAuditData.offset}m, Pulse Status: ${mockAuditData.pulseDiagnosis.status}, Trauma Events: ${mockAuditData.traumaLog.length}, Tally Discordance: ${mockAuditData.tallyAudit.discordance}m.`;
      const insight = await getForensicInsight("Full Forensic Audit", summary);
      setGeminiInsight(insight || "ANALYSIS_FAILURE: NO_INSIGHT_GENERATED");
      setIsGeneratingInsight(false);
  };

  const handleGeneratePdfAudit = async () => {
      // Before generating PDF, ensure the insight is the latest
      const finalAuditData = { ...mockAuditData, forensicInsight: geminiInsight || mockAuditData.forensicInsight };
      await generateSovereignAudit(finalAuditData);
  };

  if (activeCount === 0) {
    return (
      <div className={`h-full flex flex-col items-center justify-center relative overflow-hidden rounded-2xl border transition-all duration-500 ${
        theme === 'CLEAN' ? 'bg-white border-slate-200 shadow-sm' :
        theme === 'HIGH_CONTRAST' ? 'bg-white border-black border-2 rounded-none' :
        'bg-[var(--slate-abyssal)] border-slate-800/50 glass-panel cyber-border scanline-effect'
      }`}>
        <div className={`absolute inset-0 flex items-center justify-center opacity-20 mix-blend-luminosity ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'hidden' : ''}`}>
          <img src="/brahan-seer.jpg" alt="Brahan Seer" className="object-cover w-full h-full" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
          <Radar size={400} className="text-slate-500 animate-[spin_10s_linear_infinite] hidden absolute" />
        </div>
        <div className={`absolute inset-0 bg-gradient-to-t from-[var(--slate-abyssal)] via-transparent to-[var(--slate-abyssal)]/80 ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'hidden' : ''}`}></div>
        <div className={`relative z-10 flex flex-col items-center backdrop-blur-md p-10 rounded-3xl border transition-all ${
          theme === 'CLEAN' ? 'bg-slate-50 border-slate-200' :
          theme === 'HIGH_CONTRAST' ? 'bg-white border-black border-2' :
          'bg-[var(--slate-abyssal)]/60 border-[var(--emerald-primary)]/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] glass-panel cyber-border'
        }`}>
          <div className={`w-24 h-24 border rounded-full flex items-center justify-center mb-6 relative transition-all ${
            theme === 'CLEAN' ? 'bg-white border-slate-200' :
            theme === 'HIGH_CONTRAST' ? 'bg-white border-black border-2' :
            'bg-[var(--slate-abyssal)]/80 border-slate-700 shadow-[0_0_30px_rgba(234,179,8,0.2)] glass-panel'
          }`}>
            <div className={`absolute inset-0 rounded-full border animate-ping ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'hidden' : 'border-[var(--sovereign-gold)]/40'}`}></div>
            <img src="/well-tegra-logo.jpg" alt="Well-Tegra Logo" className="w-16 h-16 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
            <div className="w-2 h-2 bg-[var(--sovereign-gold)] rounded-full animate-pulse hidden absolute"></div>
          </div>
          <h3 className={`text-3xl font-black uppercase tracking-[0.5em] mb-2 transition-all ${
            theme === 'CLEAN' ? 'text-slate-900' :
            theme === 'HIGH_CONTRAST' ? 'text-black' :
            'text-[var(--sovereign-gold)] drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] text-glow-gold'
          }`}>System Standby</h3>
          <p className={`text-[10px] font-terminal uppercase tracking-widest px-4 py-1.5 rounded border transition-all ${
            theme === 'CLEAN' ? 'bg-white text-slate-500 border-slate-200' :
            theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-black border-2' :
            'bg-[var(--slate-abyssal)]/80 text-slate-300 border-slate-700/50 glass-panel'
          }`}>Awaiting Module Engagement // Zero Active Feeds</p>
        </div>
      </div>
    );
  }

  const engagedKeys = Object.keys(engagedModules).filter(k => engagedModules[k as keyof typeof engagedModules]);

  const gridClass = activeCount === 1 
    ? 'grid-cols-1' 
    : activeCount === 2 
    ? 'grid-cols-1 lg:grid-cols-2' 
    : 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3'; // Adjusted for 3 columns on larger screens

  return (
    <div className={`flex flex-col transition-all duration-700 h-fit pb-12 ${
      theme === 'CLEAN' ? 'bg-slate-50' : 
      theme === 'HIGH_CONTRAST' ? 'bg-white' : 
      ''
    }`}>
      
      {/* Tab Navigation & Layout Toggle */}
      <div className="flex items-center justify-between border-b border-emerald-900/20 mb-6 px-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1">
          {MODULE_METADATA.filter(m => engagedModules[m.id]).map(module => (
            <button
              key={module.id}
              onClick={() => {
                setActiveTab(module.id);
                setLayoutMode('TAB');
              }}
              className={`flex items-center space-x-2 px-4 py-3 transition-all whitespace-nowrap border-b-2 ${
                activeTab === module.id && layoutMode === 'TAB'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                  : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <span className={activeTab === module.id && layoutMode === 'TAB' ? 'text-emerald-400' : 'text-slate-600'}>
                {module.icon}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest">{module.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 px-4">
           <button 
             onClick={() => setLayoutMode('TAB')}
             className={`p-2 rounded transition-all ${layoutMode === 'TAB' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
             title="Tab View"
           >
             <FileSearch size={14} />
           </button>
           <button 
             onClick={() => setLayoutMode('GRID')}
             className={`p-2 rounded transition-all ${layoutMode === 'GRID' ? 'bg-emerald-500 text-slate-950' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
             title="Grid View"
           >
             <BarChart3 size={14} />
           </button>
        </div>
      </div>

      <div className={layoutMode === 'GRID' ? `grid ${gridClass} gap-6` : "grid grid-cols-1 gap-6"}>
        {layoutMode === 'TAB' ? (
          activeTab && renderModule(activeTab)
        ) : (
          engagedKeys.map((key: string) => renderModule(key))
        )}
      </div>

      {activeCount > 0 && ( // Show this only if at least one module is engaged
          <div className="col-span-full glass-panel p-6 rounded-2xl border border-[var(--emerald-primary)]/30 bg-slate-900/60 shadow-2xl animate-in zoom-in-95 duration-700 cyber-border">
              <div className="flex items-center justify-between border-b border-emerald-900/30 pb-4 mb-4">
                  <div className="flex items-center space-x-4">
                      <ShieldAlert size={24} className="text-[var(--emerald-primary)] shadow-[0_0_10px_var(--emerald-primary)]" />
                      <div>
                          <h3 className="text-xl font-black text-[var(--emerald-primary)] uppercase tracking-tighter text-glow-emerald">Sovereign_Veto_Protocol</h3>
                          <span className="text-[10px] text-emerald-800 uppercase tracking-widest font-black">Final Forensic Insight & Audit Generation</span>
                      </div>
                  </div>
                  <button 
                      onClick={handleGenerateInsight}
                      disabled={isGeneratingInsight}
                      className="flex items-center space-x-2 px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-all bg-[var(--emerald-primary)] text-slate-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50"
                  >
                      {isGeneratingInsight ? <Loader2 size={14} className="animate-spin" /> : <Hash size={14} />}
                      <span>{isGeneratingInsight ? 'Generating Insight...' : 'Generate Gemini Insight'}</span>
                  </button>
              </div>

              <div className="p-4 bg-slate-950 rounded border border-emerald-900/40 font-terminal text-[11px] text-emerald-100/80 leading-relaxed mb-6 glass-panel">
                  <div className="text-[8px] font-black uppercase text-emerald-900 mb-2">Architect_Insight_Log</div>
                  <p data-testid="gemini-insight-text">
                      {geminiInsight || "Awaiting Gemini Forensic Architect analysis..."}
                  </p>
              </div>

              <button 
                  onClick={handleGeneratePdfAudit}
                  className="w-full py-4 bg-[var(--emerald-primary)] text-slate-950 rounded font-black text-[12px] uppercase tracking-[0.4em] hover:bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                  data-testid="sovereign-veto-btn"
              >
                  <Download size={18} className="mr-3" />
                  <span>EXECUTE SOVEREIGN VETO (Generate PDF Audit)</span>
              </button>
          </div>
      )}

    </div>
  );
};

export default SovereignStage;
