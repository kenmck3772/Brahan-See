
import React, { useState, useMemo } from 'react';
import { 
  Book, ChevronRight, Zap, Target, Activity, 
  Database, ShieldCheck, Ghost, Box, Terminal,
  Compass, Beaker, FileText, Info, AlertTriangle,
  Fingerprint, Cpu, Search, HardDrive, Scroll,
  Eye, Layers, Map, Clock, Sparkles, Shield,
  ArrowRight, Bookmark, Share2, Printer, Download,
  Maximize2, Minimize2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const BrahanBible: React.FC = () => {
  const [activeChapter, setActiveChapter] = useState('GENESIS');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);

  const chapters: Chapter[] = [
    {
      id: 'GENESIS',
      title: 'The Book of Genesis',
      subtitle: 'Origins & Forensic Foundations',
      icon: <Fingerprint size={20} />,
      content: (
        <div className="space-y-8">
          <section className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
            <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter mb-4">The Forensic Mandate</h3>
            <p className="text-lg text-emerald-100/90 leading-relaxed font-serif italic">
              "In the beginning was the data, and the data was without form, and void; and darkness was upon the face of the legacy NDR. And the Seer said, Let there be Physics: and there was Truth."
            </p>
            <p className="mt-6 text-sm text-emerald-100/70 leading-relaxed">
              The Brahan Personal Terminal is not a mere dashboard; it is a sovereign diagnostic array. It was forged in the fires of North Sea decommissioning, where legacy interpretations failed to account for the physical reality of aging assets. Our foundation is **Forensic Physics**—the belief that mass and energy are the only immutable witnesses in an industry of shifting interpretations.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
              <div className="flex items-center space-x-3 text-emerald-400">
                <Shield size={18} />
                <h4 className="text-xs font-black uppercase tracking-widest">The Immutable Source Rule</h4>
              </div>
              <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                Every data point must carry its provenance. We do not accept "Operator Truth" without a physical audit. If a pressure reading cannot be reconciled with the mass-balance model, it is flagged as a **Data Ghost**.
              </p>
            </div>
            <div className="p-6 bg-slate-900/50 border border-emerald-900/40 rounded-2xl space-y-3">
              <div className="flex items-center space-x-3 text-emerald-400">
                <Cpu size={18} />
                <h4 className="text-xs font-black uppercase tracking-widest">The Forensic Engine</h4>
              </div>
              <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                Our core logic bypasses standard industry software. We use raw sensor telemetry to reconstruct the "Ground Truth" of an asset, identifying discrepancies that legacy systems are designed to ignore.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'REVELATIONS',
      title: 'The Book of Revelations',
      subtitle: 'Capabilities & Forensic Findings',
      icon: <Eye size={20} />,
      content: (
        <div className="space-y-8">
          <section>
            <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter mb-6">What the Seer Finds</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-4 hover:bg-emerald-500/5 rounded-xl transition-colors border border-transparent hover:border-emerald-500/20">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Target size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-100 uppercase mb-1">Bypassed Pay Zones</h4>
                  <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                    By re-correlating legacy Gamma Ray logs against modern spectral surveys, we identify hydrocarbon-bearing intervals that were missed during initial completion. These are the "Hidden Reservoirs" of the North Sea.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 hover:bg-orange-500/5 rounded-xl transition-colors border border-transparent hover:border-orange-500/20">
                <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-orange-100 uppercase mb-1">Structural Casing Trauma</h4>
                  <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                    Our 3D reconstruction engine identifies localized metal loss, deformation, and fluid ingress that standard integrity reports overlook. We find the "Silent Leaks" before they become environmental catastrophes.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 hover:bg-blue-500/5 rounded-xl transition-colors border border-transparent hover:border-blue-500/20">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                  <Database size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-blue-100 uppercase mb-1">Tax Reclamation Opportunities</h4>
                  <p className="text-[11px] text-emerald-100/60 leading-relaxed">
                    Forensic auditing of production data often reveals over-reporting of water-cut or under-reporting of gas-lift efficiency. These discrepancies represent millions in potential tax offsets and operational efficiency gains.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'ACTS',
      title: 'The Book of Acts',
      subtitle: 'Workflows & Protocols',
      icon: <Zap size={20} />,
      content: (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                name: 'Ghost_Sync', 
                desc: 'Datum Discordance Resolution. Aligning legacy logs to modern surveys using automated cross-correlation.',
                icon: <Ghost size={16} />
              },
              { 
                name: 'Trauma_Node', 
                desc: '3D Wellbore Autopsy. Visualizing casing integrity issues in a high-fidelity spatial environment.',
                icon: <Box size={16} />
              },
              { 
                name: 'Pulse_Analyzer', 
                desc: 'Pressure Signature Scavenging. Identifying sustained casing pressure through sawtooth pattern analysis.',
                icon: <Activity size={16} />
              },
              { 
                name: 'Chanonry_Protocol', 
                desc: 'Chemical Stability Logic. Preventing wellbore plugging through asphaltene instability calculations.',
                icon: <Beaker size={16} />
              }
            ].map(workflow => (
              <div key={workflow.name} className="p-5 bg-slate-950 border border-emerald-900/30 rounded-xl hover:border-emerald-500/40 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3 text-emerald-400">
                    {workflow.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{workflow.name}</span>
                  </div>
                  <ArrowRight size={12} className="text-emerald-900 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-[10px] text-emerald-100/50 leading-relaxed">{workflow.desc}</p>
              </div>
            ))}
          </div>

          <section className="p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center space-x-2">
              <Sparkles size={14} />
              <span>The Forensic Architect Integration</span>
            </h4>
            <p className="text-[11px] text-indigo-100/70 leading-relaxed mb-4">
              The terminal is integrated with the **Brahan Forensic Architect** (Gemini 3 Flash). This neural link allows for real-time synthesis of multi-module data.
            </p>
            <div className="bg-slate-950/50 p-4 rounded-lg border border-indigo-500/10">
              <p className="text-[9px] font-mono text-indigo-400/60 leading-tight italic">
                "Architect, analyze the Ghost_Sync offset in Stella Well 2 and cross-reference with the Pulse_Analyzer sawtooth slope. Is the casing breach confirmed by the mass-balance model?"
              </p>
            </div>
          </section>
        </div>
      )
    },
    {
      id: 'VISIONS',
      title: 'The Book of Visions',
      subtitle: 'Visual Intelligence & Mapping',
      icon: <Map size={20} />,
      content: (
        <div className="space-y-8">
          <section>
            <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter mb-6">Visualizing the Ground Truth</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-emerald-900/30 rounded-xl space-y-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg w-fit text-emerald-400">
                  <Layers size={20} />
                </div>
                <h4 className="text-[10px] font-black text-emerald-100 uppercase">WellArk Map</h4>
                <p className="text-[9px] text-emerald-100/40 leading-relaxed">Global asset visualization with "Truth Level" overlays. Forensic findings glow with physics-validated intensity.</p>
              </div>
              <div className="p-4 bg-slate-900 border border-emerald-900/30 rounded-xl space-y-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg w-fit text-emerald-400">
                  <Clock size={20} />
                </div>
                <h4 className="text-[10px] font-black text-emerald-100 uppercase">KronoGraph</h4>
                <p className="text-[9px] text-emerald-100/40 leading-relaxed">Timeline-based forensic evolution. Slide back in time to see how "Data Drift" corrupted the operator's reporting.</p>
              </div>
              <div className="p-4 bg-slate-900 border border-emerald-900/30 rounded-xl space-y-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg w-fit text-emerald-400">
                  <Box size={20} />
                </div>
                <h4 className="text-[10px] font-black text-emerald-100 uppercase">3D Schematic</h4>
                <p className="text-[9px] text-emerald-100/40 leading-relaxed">High-fidelity wellbore reconstruction. Zoom into specific voxels of metal loss or fluid ingress.</p>
              </div>
            </div>
          </section>

          <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center space-x-6">
            <div className="flex-shrink-0 p-4 bg-emerald-500/10 rounded-full">
              <Maximize2 size={32} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-emerald-100 uppercase mb-1">The "Forensic Delta" Overlay</h4>
              <p className="text-[10px] text-emerald-100/60 leading-relaxed">
                Our most powerful visual tool. It automatically compares Publicly Reported data (NSTA) against our Physics-Calculated data, highlighting discrepancies in real-time.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'LAWS',
      title: 'The Book of Laws',
      subtitle: 'Protocols & Technical Specs',
      icon: <ShieldCheck size={20} />,
      content: (
        <div className="space-y-8">
          <section>
            <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-tighter mb-6">The Forensic Code</h3>
            <div className="space-y-4">
              <div className="p-4 border-l-4 border-emerald-500 bg-emerald-500/5">
                <h4 className="text-xs font-black text-emerald-400 uppercase mb-2">Protocol 01: Mass-Energy Balance</h4>
                <p className="text-[10px] text-emerald-100/70 font-mono">Any reported production that violates the physical constraints of the reservoir pressure and fluid properties is automatically discarded as "Operator Fiction."</p>
              </div>
              <div className="p-4 border-l-4 border-orange-500 bg-orange-500/5">
                <h4 className="text-xs font-black text-orange-400 uppercase mb-2">Protocol 02: Sensor Drift Validation</h4>
                <p className="text-[10px] text-emerald-100/70 font-mono">Sensors are assumed to be drifting until proven otherwise. We use cross-sensor correlation to identify and correct for mechanical bias.</p>
              </div>
              <div className="p-4 border-l-4 border-blue-500 bg-blue-500/5">
                <h4 className="text-xs font-black text-blue-400 uppercase mb-2">Protocol 03: Sovereign Veto</h4>
                <p className="text-[10px] text-emerald-100/70 font-mono">The Terminal reserves the right to issue a "Sovereign Veto" on any operational plan that violates the forensic safety model.</p>
              </div>
            </div>
          </section>

          <div className="p-6 bg-slate-900 border border-emerald-900/30 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Technical_Specifications</span>
              <span className="text-[8px] text-emerald-900 font-mono">v2.5.0_STABLE</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[9px] font-mono text-emerald-100/40">
              <div className="flex justify-between border-b border-emerald-900/20 pb-1">
                <span>Encryption</span>
                <span className="text-emerald-500">RSA-4096 / AES-256</span>
              </div>
              <div className="flex justify-between border-b border-emerald-900/20 pb-1">
                <span>Neural Link</span>
                <span className="text-emerald-500">Gemini 3 Flash</span>
              </div>
              <div className="flex justify-between border-b border-emerald-900/20 pb-1">
                <span>Visual Engine</span>
                <span className="text-emerald-500">Cambridge Intelligence</span>
              </div>
              <div className="flex justify-between border-b border-emerald-900/20 pb-1">
                <span>Data Ingress</span>
                <span className="text-emerald-500">NSTA / NDR / OPRED</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredChapters = useMemo(() => {
    if (!searchQuery) return chapters;
    return chapters.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, chapters]);

  return (
    <div className={`flex flex-col h-full bg-slate-950 border border-emerald-900/20 rounded-2xl overflow-hidden relative font-terminal transition-all duration-500 ${isMaximized ? 'fixed inset-4 z-[1000]' : ''}`}>
      {/* HUD Background Decorations */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
         <Scroll size={800} className="text-emerald-500 rotate-12" />
      </div>

      {/* Header */}
      <header className="p-6 border-b border-emerald-900/30 flex items-center justify-between bg-slate-950/80 backdrop-blur-md relative z-10">
        <div className="flex items-center space-x-6">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-pulse">
            <Book size={32} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-emerald-400 uppercase tracking-tighter leading-none mb-1">The_Brahan_Bible</h1>
            <div className="flex items-center space-x-3">
               <span className="text-[10px] text-emerald-800 uppercase tracking-[0.5em] font-black">Forensic_Instructional_Manual // v2.5.0</span>
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shadow-[0_0_15px_#10b981]"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center bg-slate-900 border border-emerald-900/30 rounded-xl px-4 py-2 focus-within:border-emerald-500/50 transition-all">
            <Search size={16} className="text-emerald-900 mr-3" />
            <input 
              type="text" 
              placeholder="Search_Scriptures..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-emerald-100 placeholder:text-emerald-900 w-48 font-mono"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setIsMaximized(!isMaximized)} className="p-2 hover:bg-white/5 rounded-lg text-emerald-900 hover:text-emerald-400 transition-all">
              {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg text-emerald-900 hover:text-emerald-400 transition-all">
              <Printer size={20} />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg text-emerald-900 hover:text-emerald-400 transition-all">
              <Download size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative z-10">
        {/* Navigation Sidebar */}
        <aside className="w-80 border-r border-emerald-900/20 flex flex-col bg-slate-950/60 backdrop-blur-sm">
           <div className="p-6 border-b border-emerald-900/20">
              <div className="flex items-center justify-between text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-4">
                 <div className="flex items-center space-x-2">
                    <Scroll size={14} />
                    <span>Table_of_Contents</span>
                 </div>
                 <span className="text-[8px] font-mono opacity-50">CH: 05</span>
              </div>
              <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500/40 w-1/3" />
              </div>
           </div>

           <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {filteredChapters.map(chapter => (
                <button
                  key={chapter.id}
                  onClick={() => setActiveChapter(chapter.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden ${
                    activeChapter === chapter.id 
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_10px_30px_rgba(16,185,129,0.2)]' 
                      : 'text-emerald-800 hover:text-emerald-400 hover:bg-emerald-500/5'
                  }`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-1">
                       {chapter.icon}
                       <span className="text-[11px] font-black uppercase tracking-tighter">{chapter.title}</span>
                    </div>
                    <p className={`text-[9px] font-mono uppercase tracking-widest opacity-60 pl-8 ${activeChapter === chapter.id ? 'text-slate-900' : ''}`}>
                      {chapter.subtitle}
                    </p>
                  </div>
                  {activeChapter === chapter.id && (
                    <motion.div 
                      layoutId="active-chapter-bg"
                      className="absolute inset-0 bg-emerald-500"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
           </nav>

           <div className="p-6 bg-black/40 border-t border-emerald-900/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                   <Bookmark size={14} className="text-emerald-900" />
                   <span className="text-[9px] font-black text-emerald-950 uppercase">Saved_Scriptures</span>
                </div>
                <span className="text-[8px] font-mono text-emerald-900">03_ITEMS</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[8px] text-emerald-500 uppercase font-black cursor-pointer hover:bg-emerald-500/10 transition-all">
                  Ghost_Sync_Calibration_v2
                </div>
                <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[8px] text-emerald-500 uppercase font-black cursor-pointer hover:bg-emerald-500/10 transition-all">
                  Asphaltene_Stability_Logic
                </div>
              </div>
           </div>
        </aside>

        {/* Content Viewer */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-900/10 overflow-hidden relative">
           <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar relative z-10">
              <div className="max-w-4xl mx-auto">
                 <AnimatePresence mode="wait">
                   <motion.div 
                     key={activeChapter}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     transition={{ duration: 0.4, ease: 'easeOut' }}
                     className="space-y-12"
                   >
                     {/* Chapter Header */}
                     <div className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-6">
                           <div className="w-16 h-px bg-emerald-500/30" />
                           <span className="text-[14px] font-black text-emerald-500 uppercase tracking-[0.8em]">
                             {chapters.find(c => c.id === activeChapter)?.id}
                           </span>
                           <div className="w-16 h-px bg-emerald-500/30" />
                        </div>
                        <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">
                          {chapters.find(c => c.id === activeChapter)?.title}
                        </h2>
                        <p className="text-xl text-emerald-400 font-mono uppercase tracking-[0.2em] opacity-80">
                          {chapters.find(c => c.id === activeChapter)?.subtitle}
                        </p>
                     </div>

                     {/* Chapter Content */}
                     <div className="bg-slate-950/40 border border-emerald-900/20 rounded-[2rem] p-12 lg:p-16 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                        {/* Decorative Icons */}
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                           {chapters.find(t => t.id === activeChapter)?.icon}
                        </div>
                        <div className="absolute bottom-0 left-0 p-12 opacity-5 pointer-events-none rotate-180">
                           {chapters.find(t => t.id === activeChapter)?.icon}
                        </div>
                        
                        {/* The actual content */}
                        <div className="relative z-10">
                          {chapters.find(topic => topic.id === activeChapter)?.content}
                        </div>
                     </div>

                     {/* Footer Actions */}
                     <div className="pt-12 border-t border-emerald-900/20 flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                           <div className="flex items-center space-x-3 text-emerald-900 uppercase font-black text-[10px]">
                              <Cpu size={16} />
                              <span>Logic: Brahan_Core_v2.5</span>
                           </div>
                           <div className="flex items-center space-x-3 text-emerald-900 uppercase font-black text-[10px]">
                              <ShieldCheck size={16} />
                              <span>Security: Sovereign_Veto_Active</span>
                           </div>
                        </div>
                        <div className="flex items-center space-x-4">
                           <button className="flex items-center space-x-2 px-6 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500 hover:text-slate-950 transition-all">
                              <Share2 size={14} />
                              <span>Share_Scripture</span>
                           </button>
                        </div>
                     </div>
                   </motion.div>
                 </AnimatePresence>
              </div>
           </div>

           {/* Scroll Progress Indicator */}
           <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col space-y-2 opacity-20 hover:opacity-100 transition-opacity">
              {chapters.map(c => (
                <div 
                  key={c.id}
                  onClick={() => setActiveChapter(c.id)}
                  className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all ${activeChapter === c.id ? 'bg-emerald-400 h-8' : 'bg-emerald-900 hover:bg-emerald-700'}`}
                />
              ))}
           </div>
        </main>
      </div>
    </div>
  );
};

export default BrahanBible;
