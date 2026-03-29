
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Zap, 
  Search, 
  Filter, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Globe, 
  ShieldAlert,
  FileText,
  Link as LinkIcon,
  Activity,
  ChevronRight,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../src/context/ThemeContext';
import { useUnit } from '../src/context/UnitContext';
import { useHarvester } from '../src/context/HarvesterContext';
import { useTemporal } from '../src/context/TemporalContext';
import { MOCK_WELLS } from '../constants';
import ForensicDeltaMap from './ForensicDeltaMap';
import ForensicDeltaSummary from './ForensicDeltaSummary';
import PublicFileXRay from './PublicFileXRay';
import TimeTravelSlider from './TimeTravelSlider';
import ProvenanceTooltip from './ProvenanceTooltip';

import ForensicBlog from './ForensicBlog';
import KnowledgeGraph from './KnowledgeGraph';

interface PublicDataEvent {
  id: string;
  source: 'NSTA' | 'NDR' | 'OPRED' | 'GHOST_SYNC';
  type: 'REPORT_FILED' | 'PRODUCTION_UPDATE' | 'WELL_STATUS_CHANGE' | 'LICENSE_TRANSFER' | 'FORENSIC_INGRESS';
  wellId: string;
  timestamp: string;
  value: string;
  isConflict: boolean;
}

const PersonalForensicDashboard: React.FC = () => {
  const { theme } = useTheme();
  const { unit, convertToDisplay, unitLabel } = useUnit();
  const { ingressHistory, clearHistory } = useHarvester();
  const { year } = useTemporal();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MAP' | 'XRAY' | 'KNOWLEDGE' | 'FEED'>('OVERVIEW');
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [blogCount, setBlogCount] = useState(2); // Initial count from ForensicBlog

  useEffect(() => {
    const handleBlogPublished = () => {
      setBlogCount(prev => prev + 1);
    };
    window.addEventListener('FORENSIC_BLOG_PUBLISHED', handleBlogPublished);
    return () => window.removeEventListener('FORENSIC_BLOG_PUBLISHED', handleBlogPublished);
  }, []);

  // Derive feed from Harvester Ingress History
  const feed = useMemo<PublicDataEvent[]>(() => {
    return ingressHistory.map(item => ({
      id: `${item.uwi}-${item.timestamp}`,
      source: item.source.includes('GHOST_SYNC') ? 'GHOST_SYNC' as any : 'NSTA' as any,
      type: 'FORENSIC_INGRESS',
      wellId: item.uwi,
      timestamp: item.timestamp,
      value: `${item.payload?.dataPoints || 0} pts`,
      isConflict: item.payload?.conflicts?.length > 0 || false
    }));
  }, [ingressHistory]);

  const wellFiles = ingressHistory.length;

  const purgeWellFiles = () => {
    setIsPurging(true);
    setTimeout(() => {
      clearHistory();
      setIsPurging(false);
      window.dispatchEvent(new CustomEvent('WELL_FILES_PURGED'));
    }, 2000);
  };

  const conflictsCount = useMemo(() => feed.filter(e => e.isConflict).length, [feed]);
  const auditedAssetsCount = useMemo(() => new Set(ingressHistory.map(h => h.uwi)).size, [ingressHistory]);
  const truthLevel = useMemo(() => ingressHistory.length > 0 ? 100 : 0, [ingressHistory]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      {/* Dashboard Header */}
      <div className="p-6 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
            <LayoutDashboard className="text-emerald-500" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic">Forensic_Personal_Dash</h1>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Operator: BRAHAN_ARCHITECT</span>
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">System_Nominal</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Well Files Counter */}
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Legacy_Well_Files</span>
            <div className="flex items-center space-x-2">
              <span className={`text-lg font-mono font-black ${wellFiles > 0 ? 'text-orange-500' : 'text-slate-700'}`}>
                {wellFiles.toString().padStart(2, '0')}
              </span>
              {wellFiles > 0 && (
                <button 
                  onClick={purgeWellFiles}
                  disabled={isPurging}
                  className="p-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  title="Purge Well Files"
                >
                  <Trash2 size={12} className={isPurging ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800"></div>

          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active_Conflicts</span>
            <span className="text-lg font-mono font-black text-fuchsia-500">{conflictsCount.toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex px-6 bg-slate-900/30 border-b border-slate-800">
        {[
          { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
          { id: 'MAP', label: 'Conflict Map', icon: Globe },
          { id: 'XRAY', label: 'File X-Ray', icon: Search },
          { id: 'KNOWLEDGE', label: 'Knowledge Ark', icon: Share2 },
          { id: 'FEED', label: 'Public Firehose', icon: Zap },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.id ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'OVERVIEW' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Top Stats */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl glass-panel cyber-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">NSTA_Ingress_Rate</span>
                    <Activity size={12} className="text-emerald-500" />
                  </div>
                  <div className="text-2xl font-mono font-black text-white">{ingressHistory.length > 0 ? '1.2' : '0.0'} <span className="text-[10px] text-slate-500">req/s</span></div>
                  <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-emerald-500 transition-all duration-1000 ${ingressHistory.length > 0 ? 'w-1/2' : 'w-0'}`}></div>
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl glass-panel cyber-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Forensic_Truth_Level</span>
                    <ShieldAlert size={12} className="text-fuchsia-500" />
                  </div>
                  <div className="text-2xl font-mono font-black text-white">{truthLevel}%</div>
                  <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-fuchsia-500 transition-all duration-1000" style={{ width: `${truthLevel}%` }}></div>
                  </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl glass-panel cyber-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Audited_Assets</span>
                    <Database size={12} className="text-blue-500" />
                  </div>
                  <div className="text-2xl font-mono font-black text-white">{auditedAssetsCount}</div>
                  <div className="mt-2 text-[8px] text-slate-500 font-bold uppercase">Coverage: {auditedAssetsCount > 0 ? '0.01' : '0'}% of UKCS</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl glass-panel cyber-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Knowledge_Nodes</span>
                    <LinkIcon size={12} className="text-orange-500" />
                  </div>
                  <div className="text-2xl font-mono font-black text-white">{blogCount}</div>
                  <div className="mt-2 text-[8px] text-slate-500 font-bold uppercase">Linked from Forensic Blogs</div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-3 gap-6">
                {/* Conflict Summary */}
                <div className="col-span-2 space-y-6">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden cyber-border">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShieldAlert size={16} className="text-fuchsia-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Forensic_Delta_Summary</span>
                      </div>
                      <ProvenanceTooltip source="WellTegra Physics Engine v1.2" validator="Forensic Audit Engine v9.2.4" timestamp={new Date().toLocaleDateString()}>
                        <div className="text-[8px] text-slate-500 cursor-help">PROVENANCE_INFO</div>
                      </ProvenanceTooltip>
                    </div>
                    <div className="p-6">
                      <ForensicDeltaSummary />
                    </div>
                  </div>

                  {/* Time Travel Slider */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 cyber-border">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <Clock size={16} className="text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Forensic_Evolution_Timeline</span>
                      </div>
                      <span className="text-xl font-mono font-black text-blue-400">{year}</span>
                    </div>
                    <TimeTravelSlider />
                    <div className="mt-4 text-[9px] text-slate-500 italic text-center">
                      Slide to visualize historical data drift and forensic reconstructions.
                    </div>
                  </div>
                </div>

                {/* Public Firehose Feed */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col cyber-border">
                  <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap size={16} className="text-orange-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">NSTA_Public_Firehose</span>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/30 animate-pulse">LIVE</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {feed.map((event) => (
                      <div key={event.id} className={`p-3 rounded-xl border transition-all ${
                        event.isConflict ? 'bg-fuchsia-500/5 border-fuchsia-500/30' : 'bg-slate-800/50 border-slate-700'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[8px] font-black text-slate-500 uppercase">{event.source} // {event.type}</span>
                          <span className="text-[7px] font-mono text-slate-600">{new Date(event.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-white">{event.wellId}</span>
                          <span className="text-[10px] font-mono text-slate-400">{event.value}</span>
                        </div>
                        {event.isConflict && (
                          <div className="mt-2 flex items-center space-x-1 text-[8px] font-black text-fuchsia-500 uppercase">
                            <ShieldAlert size={10} />
                            <span>Conflict_Detected: Physics_Mismatch</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-[9px] font-black uppercase tracking-widest rounded transition-all flex items-center justify-center space-x-2">
                      <span>View Full Ingress Log</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'MAP' && (
            <motion.div 
              key="map"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full"
            >
              <ForensicDeltaMap 
                selectedWellId={selectedWellId} 
                onSelectWell={setSelectedWellId}
              />
            </motion.div>
          )}

          {activeTab === 'XRAY' && (
            <motion.div 
              key="xray"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <PublicFileXRay />
            </motion.div>
          )}

          {activeTab === 'KNOWLEDGE' && (
            <motion.div 
              key="knowledge"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full grid grid-cols-2 gap-6"
            >
              <KnowledgeGraph />
              <ForensicBlog />
            </motion.div>
          )}

          {activeTab === 'FEED' && (
            <motion.div 
              key="feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col space-y-6"
            >
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 cyber-border">
                <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center space-x-2">
                  <Zap size={16} className="text-orange-500" />
                  <span>Public_Data_Firehose_Config</span>
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold uppercase">NSTA ArcGIS</span>
                      <div className="w-8 h-4 bg-emerald-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500">Harvesting well headers, production, and license data via REST API.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold uppercase">NDR Portal</span>
                      <div className="w-8 h-4 bg-emerald-500 rounded-full relative">
                        <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500">Scraping completion reports, LAS files, and deviation logs.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold uppercase">OPRED</span>
                      <div className="w-8 h-4 bg-slate-700 rounded-full relative">
                        <div className="absolute left-1 top-1 w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500">Environmental filings and decommissioning status updates.</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col cyber-border">
                <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest">Live_Ingress_Stream</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter size={12} className="text-slate-500" />
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Filter: ALL_SOURCES</span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-500">
                      <CheckCircle2 size={12} />
                      <span className="text-[8px] font-bold uppercase">Connected</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-4 font-mono text-[10px] space-y-1 overflow-y-auto custom-scrollbar bg-black/40">
                  {ingressHistory.length > 0 ? ingressHistory.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 border-b border-slate-800/50 py-1 last:border-0">
                      <span className="text-emerald-500 shrink-0">[{new Date(item.timestamp).toLocaleTimeString()}]</span>
                      <span className="text-blue-400 shrink-0 uppercase">[{item.source}]</span>
                      <span className="text-slate-300">INGRESS_UWI: {item.uwi}</span>
                      <span className="text-slate-500 italic">// {JSON.stringify(item.payload)}</span>
                    </div>
                  )) : (
                    <div className="text-slate-600 italic">Awaiting forensic ingress...</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dashboard Footer */}
      <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Globe size={12} className="text-emerald-500" />
            <span>NSTA_API: CONNECTED</span>
          </div>
          <div className="flex items-center space-x-2">
            <Database size={12} className="text-blue-500" />
            <span>NDR_CRAWLER: IDLE</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap size={12} className="text-orange-500" />
            <span>FIREHOSE: 1.2 GB HARVESTED</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ShieldAlert size={12} className="text-fuchsia-500" />
          <span>Forensic_Audit_Engine: v9.2.4_STABLE</span>
        </div>
      </div>
    </div>
  );
};

export default PersonalForensicDashboard;
