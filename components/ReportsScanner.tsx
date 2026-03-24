
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileSearch, Table, AlertTriangle, FileText, 
  CheckCircle2, SearchCode, Loader2, Play, Hash, 
  Target, ShieldAlert, Dna, Ruler, HardDriveDownload,
  History, X, Clock, Database, ChevronRight, Trash2,
  Binary, Fingerprint, ShieldCheck, Filter, RotateCcw
} from 'lucide-react';
import { MOCK_TUBING_TALLY, MOCK_INTERVENTION_REPORTS } from '../constants';
import { TubingItem, WellReport } from '../types';
import { useTheme } from '../src/context/ThemeContext';

interface ScanLogEntry {
  id: string;
  reportId: string;
  timestamp: string;
  outcome: 'MATCH' | 'DISCREPANCY';
  discordance: number;
  flaggedJoints: number[];
  summary: string;
}

const ReportsScanner: React.FC = () => {
  const { theme } = useTheme();
  const [reports, setReports] = useState<WellReport[]>(MOCK_INTERVENTION_REPORTS);
  const [selectedReport, setSelectedReport] = useState<WellReport>(MOCK_INTERVENTION_REPORTS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isValidationComplete, setIsValidationComplete] = useState(false);
  const [tally] = useState<TubingItem[]>(MOCK_TUBING_TALLY);
  const [hoveredJoint, setHoveredJoint] = useState<number | null>(null);
  const [showLogPanel, setShowLogPanel] = useState(true);
  const [highlightDiscrepancies, setHighlightDiscrepancies] = useState(true);
  
  // Filtering State
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanProgress(0);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      // Simulate forensic extraction from local report
      setTimeout(() => {
        const newReportId = `LOCAL-${Math.random().toString(36).substring(7).toUpperCase()}`;
        const newReport: WellReport = {
          reportId: newReportId,
          date: new Date().toISOString().split('T')[0],
          eodDepth_m: 2500 + Math.random() * 500,
          summary: `LOCAL_AUDIT: ${file.name}`,
          opType: 'LOCAL_UPLOAD'
        };

        setReports(prev => [newReport, ...prev]);
        setSelectedReport(newReport);
        setIsScanning(false);
        setScanProgress(100);
        setIsValidationComplete(false); // Reset validation for the new report
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 1500);
    };
    reader.readAsText(file);
  };

  // Refs for auto-scrolling the schematic
  const schematicContainerRef = useRef<HTMLDivElement>(null);
  const jointRefs = useRef<Record<number, SVGGElement | null>>({});

  const [scanHistory, setScanHistory] = useState<ScanLogEntry[]>(() => {
    const saved = localStorage.getItem('BRAHAN_REPORT_AUDIT_LOGS');
    return saved ? JSON.parse(saved) : [];
  });

  const totalLength = useMemo(() => tally.reduce((acc, curr) => acc + curr.length_m, 0), [tally]);
  const discordance = useMemo(() => Math.abs(totalLength - selectedReport.eodDepth_m), [totalLength, selectedReport]);

  // Derive unique filter values
  const uniqueTypes = useMemo(() => ['ALL', ...Array.from(new Set(tally.map(item => item.type)))], [tally]);
  const uniqueGrades = useMemo(() => ['ALL', ...Array.from(new Set(tally.map(item => item.grade)))], [tally]);

  const discrepantJoints = useMemo(() => tally.filter(j => j.status === 'DISCREPANT'), [tally]);

  // Filtered Tally
  const filteredTally = useMemo(() => {
    return tally.filter(item => {
      const typeMatch = filterType === 'ALL' || item.type === filterType;
      const gradeMatch = filterGrade === 'ALL' || item.grade === filterGrade;
      return typeMatch && gradeMatch;
    });
  }, [tally, filterType, filterGrade]);

  // Effect to scroll the schematic when a joint is hovered in the table
  useEffect(() => {
    if (hoveredJoint !== null && jointRefs.current[hoveredJoint] && schematicContainerRef.current) {
      const segment = jointRefs.current[hoveredJoint];
      const container = schematicContainerRef.current;
      
      const segmentTop = segment!.getBoundingClientRect().top;
      const containerTop = container.getBoundingClientRect().top;
      const relativeTop = segmentTop - containerTop + container.scrollTop;

      container.scrollTo({
        top: relativeTop - container.clientHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [hoveredJoint]);

  const triggerScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setIsValidationComplete(false);
    
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setIsValidationComplete(true);
          
          const outcome = discordance > 0.05 ? 'DISCREPANCY' : 'MATCH';
          const flagged = tally.filter(j => j.status === 'DISCREPANT').map(j => j.id);
          const newEntry: ScanLogEntry = {
            id: `AUDIT-${Math.random().toString(36).substring(7).toUpperCase()}`,
            reportId: selectedReport.reportId,
            timestamp: new Date().toISOString(),
            outcome,
            discordance,
            flaggedJoints: flagged,
            summary: selectedReport.summary
          };
          
          const updatedHistory = [newEntry, ...scanHistory].slice(0, 50);
          setScanHistory(updatedHistory);
          localStorage.setItem('BRAHAN_REPORT_AUDIT_LOGS', JSON.stringify(updatedHistory));
          
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const clearHistory = () => {
    if (window.confirm("CONFIRM: PURGE ALL REPORT AUDIT TRACES FROM VAULT?")) {
      setScanHistory([]);
      localStorage.removeItem('BRAHAN_REPORT_AUDIT_LOGS');
    }
  };

  const handleRecallEntry = (entry: ScanLogEntry) => {
    const report = MOCK_INTERVENTION_REPORTS.find(r => r.reportId === entry.reportId);
    if (report) {
      setSelectedReport(report);
      setIsValidationComplete(true);
    }
  };

  const resetFilters = () => {
    setFilterType('ALL');
    setFilterGrade('ALL');
  };

  const jumpToDiscrepancy = () => {
    if (discrepantJoints.length > 0) {
      const firstDiscrepant = discrepantJoints[0];
      setHoveredJoint(firstDiscrepant.id);
      
      // The useEffect for hoveredJoint will handle the scrolling
    }
  };

  const SCALE = 6;
  const schematicHeight = totalLength * SCALE + 100;

  return (
    <div className={`flex flex-col h-full space-y-3 p-4 border rounded-lg transition-all relative overflow-hidden font-terminal duration-500 ${
      theme === 'CLEAN' ? 'bg-white text-slate-900 border-slate-200 shadow-sm' :
      theme === 'HIGH_CONTRAST' ? 'bg-white text-black border-2 border-black rounded-none' :
      'bg-slate-900/40 border-emerald-900/30 glass-panel cyber-border scanline-effect'
    }`}>
      
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center space-x-4">
          <div className={`p-2 rounded shadow-lg border transition-all ${
            theme === 'CLEAN' ? 'bg-slate-100 border-slate-200' :
            theme === 'HIGH_CONTRAST' ? 'bg-white border-black' :
            'bg-emerald-950/80 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
          }`}>
            <FileSearch size={20} className={isScanning ? 'animate-pulse text-orange-500' : (theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'text-slate-900' : 'text-emerald-400')} />
          </div>
          <div>
            <h2 className={`text-xl font-black font-terminal uppercase tracking-tighter transition-all ${
              theme === 'CLEAN' ? 'text-slate-900' :
              theme === 'HIGH_CONTRAST' ? 'text-black' :
              'text-emerald-400'
            }`}>Report_Scanner_v1.2</h2>
            <div className="flex items-center space-x-2">
              <span className={`text-[8px] uppercase tracking-widest font-black ${theme === 'CLEAN' ? 'text-slate-400' : theme === 'HIGH_CONTRAST' ? 'text-black' : 'text-emerald-800'}`}>Discrepancy Engine Active</span>
              <div className={`w-1 h-1 rounded-full animate-pulse ${theme === 'CLEAN' || theme === 'HIGH_CONTRAST' ? 'bg-slate-900' : 'bg-emerald-500'}`}></div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowLogPanel(!showLogPanel)}
            className={`flex items-center space-x-2 px-4 py-2 bg-slate-900 border border-emerald-900/50 rounded font-black text-[10px] uppercase tracking-widest transition-all ${showLogPanel ? 'text-emerald-400 border-emerald-400' : 'text-emerald-800 hover:text-emerald-400'}`}
          >
            <History size={14} />
            <span className="hidden sm:inline">Vault_Panel</span>
          </button>

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 border border-purple-900/50 rounded font-black text-[10px] uppercase tracking-widest text-purple-400 hover:border-purple-400 hover:bg-purple-500/5 transition-all"
          >
            <HardDriveDownload size={14} />
            <span className="hidden sm:inline">Upload_Local</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".csv,.txt,.pdf"
          />
          
          <button 
            onClick={triggerScan}
            disabled={isScanning}
            className={`flex items-center space-x-2 px-6 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-all ${isScanning ? 'bg-orange-500/20 text-orange-500 cursor-wait' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'}`}
          >
            {isScanning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            <span>Audit_DDR</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col xl:flex-row gap-4 overflow-hidden">
        
        {/* Module A: Report Selector & Analysis Results */}
        <div className="w-full xl:w-80 flex flex-col space-y-3">
          <div className="bg-slate-950/90 border border-emerald-900/30 rounded-xl p-4 flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-emerald-900/20 pb-2">
               <div className="flex items-center space-x-2">
                  <FileText size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Available_Reports</span>
               </div>
            </div>
            
            <div className="space-y-2 overflow-y-auto max-h-48 xl:max-h-none custom-scrollbar pr-1">
              {reports.map(report => (
                <div 
                  key={report.reportId}
                  onClick={() => setSelectedReport(report)}
                  className={`p-3 rounded border transition-all cursor-pointer relative overflow-hidden ${selectedReport.reportId === report.reportId ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900/40 border-emerald-900/20 text-emerald-900 hover:border-emerald-700'}`}
                >
                  {report.opType === 'LOCAL_UPLOAD' && (
                    <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center bg-purple-500/10 border-l border-b border-purple-500/30 rounded-bl">
                      <HardDriveDownload size={10} className="text-purple-400" />
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black">{report.reportId}</span>
                    <span className="text-[8px] font-mono opacity-60">{report.date}</span>
                  </div>
                  <div className="text-[9px] uppercase tracking-tight opacity-80 truncate">{report.summary}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-slate-950/90 border border-emerald-900/30 rounded-xl p-4 flex flex-col space-y-4 shadow-2xl relative overflow-hidden">
             {isScanning && (
               <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                  <div className="text-[10px] font-black text-orange-400 mb-4 tracking-[0.5em] animate-pulse text-center px-4">SCANNING_TALLY_ARRAY</div>
                  <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-orange-500/20">
                    <div className="h-full bg-orange-500 shadow-[0_0_10px_#f97316]" style={{ width: `${scanProgress}%` }}></div>
                  </div>
               </div>
             )}

             <div className="flex items-center justify-between border-b border-emerald-900/20 pb-2">
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Forensic_Audit</span>
               <Dna size={14} className="text-emerald-700" />
             </div>

             <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
                <div className="p-3 bg-slate-900 rounded border border-emerald-900/20">
                  <div className="text-[8px] text-emerald-900 font-black uppercase mb-1">Reported_Datum_EOD</div>
                  <div className="text-xl xl:text-2xl font-black text-emerald-400 font-terminal">{selectedReport.eodDepth_m.toFixed(2)}m</div>
                </div>

                <div className={`p-3 bg-slate-900 rounded border transition-all duration-700 ${isValidationComplete ? (discordance > 0.05 ? 'border-red-500/40' : 'border-emerald-500/40') : 'border-emerald-900/20'}`}>
                  <div className="text-[8px] text-emerald-900 font-black uppercase mb-1">Tally_Sum_Calculated</div>
                  <div className={`text-xl xl:text-2xl font-black font-terminal ${isValidationComplete && discordance > 0.05 ? 'text-red-500 animate-pulse' : 'text-emerald-100'}`}>
                    {totalLength.toFixed(2)}m
                  </div>
                </div>
             </div>

             {isValidationComplete && (
               <div className={`flex items-center space-x-3 p-3 rounded border animate-in slide-in-from-left-2 ${discordance > 0.05 ? 'bg-red-500/5 border-red-500/30 text-red-500' : 'bg-emerald-500/5 border-emerald-500/30 text-emerald-500'}`}>
                 {discordance > 0.05 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                 <div className="flex flex-col">
                   <span className="text-[9px] font-black uppercase tracking-widest">{discordance > 0.05 ? 'Discordance_Detected' : 'Datum_Match_Verified'}</span>
                   <span className="text-[8px] font-mono opacity-80">DELTA: {discordance.toFixed(3)}m</span>
                 </div>
               </div>
             )}
             
             <div className="flex-1 bg-slate-900/40 rounded border border-emerald-900/10 p-3 flex flex-col justify-end">
                <div className="text-[8px] font-mono text-emerald-900 mb-1 flex items-center">
                  <Hash size={10} className="mr-1" /> ARCHIVE_HANDSHAKE: ACTIVE
                </div>
                <div className="text-[8px] font-mono text-emerald-900 truncate">
                  SHA-512: {Math.random().toString(36).substring(7).toUpperCase()}...
                </div>
             </div>
          </div>
        </div>

        {/* Module B: Tubing Tally Grid */}
        <div className="flex-1 bg-slate-950/80 rounded-xl border border-emerald-900/20 p-4 flex flex-col relative overflow-hidden shadow-inner">
           <div className="flex items-center justify-between mb-4 border-b border-emerald-900/20 pb-2 flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Table size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Interactive_Tubing_Tally</span>
              </div>
              
              {/* Dynamic Filtering UI */}
              <div className="flex items-center space-x-3 bg-slate-900/50 p-1.5 rounded-lg border border-emerald-900/30">
                 <div className="flex items-center space-x-2 px-2 border-r border-emerald-900/30">
                   <Filter size={10} className="text-emerald-700" />
                   <select 
                     value={filterType}
                     onChange={(e) => setFilterType(e.target.value)}
                     className="bg-transparent text-[8px] font-black text-emerald-400 uppercase outline-none cursor-pointer focus:text-white transition-colors"
                   >
                     {uniqueTypes.map(type => (
                       <option key={type} value={type} className="bg-slate-950">{type === 'ALL' ? 'ALL_TYPES' : type.toUpperCase()}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div className="flex items-center space-x-2 px-2 border-r border-emerald-900/30">
                   <Binary size={10} className="text-emerald-700" />
                   <select 
                     value={filterGrade}
                     onChange={(e) => setFilterGrade(e.target.value)}
                     className="bg-transparent text-[8px] font-black text-emerald-400 uppercase outline-none cursor-pointer focus:text-white transition-colors"
                   >
                     {uniqueGrades.map(grade => (
                       <option key={grade} value={grade} className="bg-slate-950">{grade === 'ALL' ? 'ALL_GRADES' : grade.toUpperCase()}</option>
                     ))}
                   </select>
                 </div>

                 <button 
                   onClick={resetFilters}
                   className="p-1 text-emerald-900 hover:text-emerald-400 transition-colors"
                   title="Reset Filters"
                 >
                    <RotateCcw size={10} />
                 </button>
              </div>

              <div className="flex items-center space-x-3">
                 <span className="text-[8px] text-emerald-900 uppercase font-black">Filtered: {filteredTally.length}/{tally.length}</span>
                 <button className="text-emerald-800 hover:text-emerald-400 transition-colors"><HardDriveDownload size={14} /></button>
              </div>
           </div>

           <div className="flex-1 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-[10px] font-terminal border-separate border-spacing-y-1 min-w-[600px]">
                <thead className="sticky top-0 bg-slate-950/90 z-20">
                  <tr className="text-emerald-800 uppercase text-[8px] font-black">
                    <th className="pb-2 pl-2">Jnt#</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">ID (in)</th>
                    <th className="pb-2">Grade</th>
                    <th className="pb-2">Len (m)</th>
                    <th className="pb-2">Cumul (m)</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTally.map((item) => {
                    const isHovered = hoveredJoint === item.id;
                    return (
                      <tr 
                        key={item.id}
                        onMouseEnter={() => setHoveredJoint(item.id)}
                        onMouseLeave={() => setHoveredJoint(null)}
                        className={`group transition-all relative ${
                          isHovered 
                            ? 'bg-emerald-500/20 scale-[0.995] origin-left' 
                            : item.status === 'DISCREPANT' 
                              ? 'bg-red-500/30 text-red-400 shadow-[inset_6px_0_0_0_#ef4444] animate-pulse' 
                              : 'bg-slate-900/40 hover:bg-emerald-500/5 text-emerald-600'
                        }`}
                      >
                        <td className={`py-2.5 pl-2 font-black border-l-2 transition-all ${item.status === 'DISCREPANT' ? 'border-red-500' : 'border-transparent group-hover:border-emerald-500'}`}>
                          <div className="flex items-center">
                            {item.status === 'DISCREPANT' && <ShieldAlert size={12} className="mr-1 text-red-500 animate-bounce" />}
                            {isHovered && item.status !== 'DISCREPANT' && <ChevronRight size={10} className="mr-1 text-emerald-400 animate-in fade-in slide-in-from-left-1" />}
                            {item.id}
                          </div>
                        </td>
                        <td className="py-2.5 font-bold">{item.type}</td>
                        <td className="py-2.5 opacity-60">{item.id_in.toFixed(3)}</td>
                        <td className="py-2.5 opacity-60">{item.grade}</td>
                        <td className="py-2.5 font-black">{item.length_m.toFixed(2)}</td>
                        <td className="py-2.5 font-black">{item.cumulative_m.toFixed(2)}</td>
                        <td className="py-2.5 pr-2">
                          <span className={`px-2 py-0.5 rounded-full text-[7px] font-black ${item.status === 'VALID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500 text-slate-950 animate-pulse'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTally.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-emerald-900 font-black uppercase italic text-[10px]">
                        No components match current filter criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Module C: Forensic Schematic Visualizer */}
        <div className="w-full xl:w-80 bg-slate-950/90 border border-emerald-900/30 rounded-xl p-4 flex flex-col relative shadow-2xl h-80 xl:h-auto">
           <div className="flex items-center justify-between mb-4 border-b border-emerald-900/20 pb-2">
              <div className="flex items-center space-x-2">
                <Target size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Well_Schematic</span>
              </div>
              {discrepantJoints.length > 0 && (
                <div 
                  onClick={jumpToDiscrepancy}
                  className="flex items-center space-x-1 px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded cursor-pointer hover:bg-red-500/40 transition-all group"
                >
                  <AlertTriangle size={10} className="text-red-500 animate-pulse" />
                  <span className="text-[8px] font-black text-red-400 uppercase">{discrepantJoints.length}_DISCREPANCIES</span>
                </div>
              )}
           </div>

           <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setHighlightDiscrepancies(!highlightDiscrepancies)}
                  className={`text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded border transition-all ${highlightDiscrepancies ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-emerald-900/30 text-emerald-900'}`}
                >
                  {highlightDiscrepancies ? 'Glow_Active' : 'Glow_Off'}
                </button>
              </div>
              <div className="text-[8px] font-mono text-emerald-900">SCALE: 1:{SCALE}m</div>
           </div>

            <div ref={schematicContainerRef} className="flex-1 bg-slate-900/40 rounded border border-emerald-900/10 flex flex-col items-center relative custom-scrollbar overflow-y-auto overflow-x-hidden">
               {/* Wellbore Background */}
               <div className="absolute inset-0 pointer-events-none opacity-10">
                 <div className="absolute left-1/2 -translate-x-1/2 w-40 h-full border-x-4 border-emerald-900/30" />
                 <div className="absolute left-1/2 -translate-x-1/2 w-32 h-full border-x-2 border-emerald-900/20" />
               </div>

               {/* Depth Ruler Background */}
               <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-emerald-900/10 pointer-events-none z-0">
                 {Array.from({ length: Math.ceil(totalLength / 10) + 1 }).map((_, i) => (
                   <div key={i} className="absolute w-full border-t border-emerald-900/20 flex items-start pl-1" style={{ top: `${i * 10 * SCALE + 20}px` }}>
                     <span className="text-[6px] font-mono text-emerald-900">{i * 10}m</span>
                   </div>
                 ))}
               </div>

               <svg width="280" height={schematicHeight} className="opacity-90 z-10">
                 {/* Center Line */}
                 <line x1="140" y1="0" x2="140" y2={schematicHeight} stroke="#064e3b" strokeWidth="1" strokeDasharray="4 2" />
                 
                 {tally.map((item) => {
                   const yStart = (item.cumulative_m - item.length_m) * SCALE + 20; 
                   const height = item.length_m * SCALE;
                   const isHovered = hoveredJoint === item.id;
                   const isDiscrepant = item.status === 'DISCREPANT';
                   
                   const matchesFilter = (filterType === 'ALL' || item.type === filterType) && 
                                        (filterGrade === 'ALL' || item.grade === filterGrade);
                   
                   return (
                     <g 
                       key={item.id} 
                       ref={el => { jointRefs.current[item.id] = el; }}
                       className={`cursor-pointer transition-all duration-300 ${!matchesFilter ? 'opacity-20' : 'opacity-100'}`}
                       onMouseEnter={() => setHoveredJoint(item.id)}
                       onMouseLeave={() => setHoveredJoint(null)}
                     >
                       {/* Discrepancy Pulse Effect */}
                       {isDiscrepant && highlightDiscrepancies && (
                         <g>
                           <rect 
                             x="125" 
                             y={yStart - 2} 
                             width="30" 
                             height={height + 4} 
                             fill="none"
                             stroke="#ef4444"
                             strokeWidth="2"
                             className="animate-pulse"
                           />
                           <rect 
                             x="120" 
                             y={yStart - 4} 
                             width="40" 
                             height={height + 8} 
                             fill="rgba(239, 68, 68, 0.1)"
                             className="animate-pulse"
                           />
                         </g>
                       )}

                       <rect 
                         x="128" 
                         y={yStart} 
                         width="24" 
                         height={height} 
                         fill={isHovered ? (isDiscrepant ? '#ef4444aa' : 'rgba(16, 185, 129, 0.6)') : (isDiscrepant ? '#ef444466' : 'rgba(16, 185, 129, 0.08)')}
                         stroke={isHovered ? '#ffffff' : (isDiscrepant ? '#ef4444' : '#10b98144')}
                         strokeWidth={isHovered ? 2 : 1}
                         className={`transition-all duration-300 ${isHovered ? (isDiscrepant ? 'filter drop-shadow-[0_0_15px_#ef4444]' : 'filter drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]') : ''}`}
                       />
                       
                       {/* Joint ID Label */}
                       {!isHovered && (
                         <g transform={`translate(120, ${yStart + height/2 + 2})`}>
                           {isDiscrepant && (
                              <text x="-12" y="-1" fill="#ef4444" fontSize="10" className="animate-bounce">⚠️</text>
                           )}
                           <text 
                             x="0" 
                             y="0" 
                             fill={isDiscrepant ? '#ef4444' : '#10b981'} 
                             fontSize="6" 
                             fontWeight="bold"
                             opacity={isDiscrepant ? "1" : "0.4"} 
                             textAnchor="end"
                             className="pointer-events-none"
                           >
                             {item.id}
                           </text>
                         </g>
                       )}

                       {/* Discrepancy Marker */}
                       {isDiscrepant && !isHovered && (
                         <g transform={`translate(158, ${yStart + height/2})`}>
                           <circle r="4" fill="#ef4444" className="animate-ping" />
                           <circle r="2.5" fill="#ef4444" />
                         </g>
                       )}

                       {isHovered && (
                         <g className="animate-in fade-in slide-in-from-left-2 duration-300">
                           <line x1="100" y1={yStart + height/2} x2="128" y2={yStart + height/2} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" />
                           <line x1="152" y1={yStart + height/2} x2="180" y2={yStart + height/2} stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" />
                           
                           {/* Floating Detail Badge */}
                           <rect x="185" y={yStart + height/2 - 25} width="95" height="50" rx="4" fill="rgba(2, 6, 23, 0.98)" stroke={isDiscrepant ? "#ef4444" : "#10b981"} strokeWidth="1.5" className="shadow-2xl" />
                           <text x="192" y={yStart + height/2 - 10} fill={isDiscrepant ? "#ef4444" : "#10b981"} fontSize="10" fontWeight="black" className="uppercase">JOINT_{item.id}</text>
                           <text x="192" y={yStart + height/2 + 4} fill="#ffffff" fontSize="8" fontWeight="bold" opacity="0.9">{item.type}</text>
                           <text x="192" y={yStart + height/2 + 14} fill={isDiscrepant ? "#ef4444" : "#10b981"} fontSize="8" fontWeight="black">{item.length_m.toFixed(2)}m</text>
                           <text x="192" y={yStart + height/2 + 22} fill="#ffffff" fontSize="7" opacity="0.5">CUMUL: {item.cumulative_m.toFixed(2)}m</text>
                           
                           {/* Depth Callout */}
                           <rect x="45" y={yStart + height/2 - 10} width="50" height="20" rx="2" fill="rgba(2, 6, 23, 0.8)" />
                           <text x="90" y={yStart + height/2 + 3} fill="#10b981" fontSize="8" fontWeight="black" textAnchor="end">{item.cumulative_m.toFixed(1)}m</text>
                         </g>
                       )}
                     </g>
                   );
                 })}
               </svg>
              <div className="absolute top-0 left-10 bottom-0 flex flex-col justify-between py-2 pointer-events-none opacity-20">
                 <span className="text-[7px] text-emerald-900 font-black">0.00m</span>
                 <span className="text-[7px] text-emerald-900 font-black">DATUM_LOCK</span>
              </div>
           </div>
        </div>
      </div>

      {/* Persistent Audit Trace Vault */}
      {showLogPanel && (
        <div className="h-48 bg-slate-950/95 border border-emerald-900/30 rounded flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4">
          <div className="bg-slate-900/90 border-b border-emerald-900/40 p-2.5 flex items-center justify-between">
             <div className="flex items-center space-x-3">
               <ShieldAlert size={14} className="text-emerald-500" />
               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Forensic_Report_Audit_Log</span>
             </div>
             <div className="flex items-center space-x-4">
                <span className="text-[7px] font-mono text-emerald-900 uppercase">Archive_Nodes: {scanHistory.length}</span>
                <button onClick={clearHistory} className="p-1 text-emerald-900 hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
            {scanHistory.map((log) => {
              const isMatch = log.outcome === 'MATCH';
              return (
                <div 
                  key={log.id} 
                  onClick={() => handleRecallEntry(log)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between border-l-4 rounded px-3 py-2 transition-all cursor-pointer group ${isMatch ? 'bg-emerald-500/5 border-emerald-500/40 hover:bg-emerald-500/10' : 'bg-red-500/5 border-red-500/40 hover:bg-red-500/10'}`}
                >
                  <div className="flex flex-wrap items-center gap-4 xl:gap-6">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-emerald-900 uppercase">Scan_ID</span>
                      <span className="text-[10px] font-black text-emerald-100">{log.id}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-emerald-900 uppercase">Target_Report</span>
                      <span className="text-[10px] font-black text-emerald-400">{log.reportId}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-emerald-900 uppercase">Datum_Delta</span>
                      <span className={`text-[10px] font-black ${isMatch ? 'text-emerald-500' : 'text-red-500'}`}>{log.discordance.toFixed(3)}m</span>
                    </div>
                    {!isMatch && (
                      <div className="flex flex-col hidden md:flex">
                        <span className="text-[8px] font-black text-emerald-900 uppercase">Flagged_Joints</span>
                        <div className="flex space-x-1">
                          {log.flaggedJoints.map(id => (
                            <span key={id} className="text-[9px] font-black text-red-400">J-{id}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                    <span className="text-[8px] font-mono text-emerald-900">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${isMatch ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-slate-950 animate-pulse'}`}>
                      {log.outcome}
                    </div>
                  </div>
                </div>
              );
            })}
            {scanHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20">
                <Binary size={32} className="text-emerald-500 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Audit_Vault_Empty</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Alert Bar */}
      <div className={`p-2.5 rounded border flex flex-col sm:flex-row items-center justify-between gap-3 transition-all ${isValidationComplete ? (discordance > 0.05 ? 'bg-red-500/10 border-red-500/40' : 'bg-emerald-500/10 border-emerald-500/40') : 'bg-slate-950/80 border-emerald-900/20'}`}>
         <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center space-x-2">
               {isValidationComplete ? (discordance > 0.05 ? <AlertTriangle size={14} className="text-red-500 animate-pulse" /> : <CheckCircle2 size={14} className="text-emerald-500" />) : <SearchCode size={14} className="text-emerald-900" />}
               <span className={`text-[10px] font-black uppercase tracking-widest ${isValidationComplete ? (discordance > 0.05 ? 'text-red-400' : 'text-emerald-400') : 'text-emerald-900'}`}>
                 {isScanning ? 'AUDIT_IN_PROGRESS' : isValidationComplete ? (discordance > 0.05 ? 'Report_Inconsistency_Flagged' : 'Tally_Schema_Verified') : 'System_Idle_Waiting_Injest'}
               </span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-emerald-900/30"></div>
            <div className="flex items-center space-x-2">
               <Ruler size={12} className="text-emerald-900" />
               <span className="text-[9px] text-emerald-900 uppercase font-black">Tolerance: +/- 0.050m</span>
            </div>
         </div>
         <div className="flex items-center space-x-4">
            <span className="text-[9px] text-emerald-900 font-mono tracking-tighter hidden md:inline">ENGINE: GEMINI_TALLY_SCAN_v1.2</span>
            <div className="flex items-center space-x-1">
               <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
               <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default ReportsScanner;
