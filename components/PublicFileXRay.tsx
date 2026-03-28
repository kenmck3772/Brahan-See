
import React, { useState, useEffect } from 'react';
import { FileSearch, ShieldAlert, CheckCircle2, Loader2, Search, FileText, Download, ExternalLink, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProvenanceTooltip from './ProvenanceTooltip';

interface XRayFinding {
  id: string;
  type: 'DISCREPANCY' | 'VERIFIED' | 'WARNING';
  field: string;
  publicValue: string;
  forensicValue: string;
  confidence: number;
  description: string;
}

const PublicFileXRay: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [findings, setFindings] = useState<XRayFinding[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const mockFiles = [
    { id: 'NSTA-2024-STELLA', name: 'Stella_A1_Completion_Report.pdf', size: '4.2 MB', date: '2024-02-10' },
    { id: 'OPRED-VIKING-22', name: 'Viking_X_Environmental_Audit.las', size: '12.8 MB', date: '2024-01-15' },
    { id: 'NDR-GANNET-99', name: 'Gannet_A_Production_Log.csv', size: '1.1 MB', date: '2024-03-01' },
  ];

  const startScan = (fileId: string) => {
    setSelectedFile(fileId);
    setIsScanning(true);
    setScanProgress(0);
    setFindings([]);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          generateFindings(fileId);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const generateFindings = (fileId: string) => {
    if (fileId.includes('STELLA')) {
      setFindings([
        { id: '1', type: 'DISCREPANCY', field: 'Total Depth', publicValue: '3500m', forensicValue: '3485.5m', confidence: 0.98, description: '14.5m datum shift detected in completion string tally.' },
        { id: '2', type: 'WARNING', field: 'A-Annulus Pressure', publicValue: '250 PSI', forensicValue: '285 PSI', confidence: 0.85, description: 'Sensor drift suspected. Mass-balance audit shows 12% variance.' },
        { id: '3', type: 'VERIFIED', field: 'Casing Grade', publicValue: 'P-110', forensicValue: 'P-110', confidence: 1.0, description: 'Material specs match forensic procurement records.' },
      ]);
    } else if (fileId.includes('VIKING')) {
      setFindings([
        { id: '4', type: 'DISCREPANCY', field: 'Wellhead Coordinates', publicValue: '53.500N / 2.100E', forensicValue: '53.515N / 2.125E', confidence: 0.99, description: 'Critical geolocation drift. Wellhead physically located 1.2km from reported position.' },
        { id: '5', type: 'DISCREPANCY', field: 'Production Rate', publicValue: '5000 bbl/d', forensicValue: '3200 bbl/d', confidence: 0.95, description: 'Over-reporting detected. Physics model suggests reservoir depletion exceeds reported extraction.' },
      ]);
    } else {
      setFindings([
        { id: '6', type: 'VERIFIED', field: 'All Metrics', publicValue: 'Nominal', forensicValue: 'Nominal', confidence: 0.99, description: 'Gannet-A data alignment within 2% threshold.' },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden glass-panel cyber-border">
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileSearch size={18} className="text-blue-500" />
          <span className="text-xs font-black uppercase tracking-widest text-white">Public File X-Ray // Scraper</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[8px] font-black px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded">
            NSTA_NDR_UPLINK: ACTIVE
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* File List */}
        <div className="w-1/3 border-r border-slate-800 p-4 space-y-3 overflow-y-auto custom-scrollbar bg-slate-950/50">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Available Documents</h4>
          {mockFiles.map(file => (
            <div 
              key={file.id}
              onClick={() => !isScanning && startScan(file.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                selectedFile === file.id 
                  ? 'bg-blue-500/10 border-blue-500/50' 
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <FileText size={16} className={selectedFile === file.id ? 'text-blue-400' : 'text-slate-500'} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{file.name}</span>
                    <span className="text-[8px] text-slate-500 font-mono">{file.size} // {file.date}</span>
                  </div>
                </div>
                <Download size={12} className="text-slate-600 group-hover:text-slate-400" />
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-slate-800">
            <button className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-[9px] font-black text-slate-500 uppercase hover:border-blue-500/50 hover:text-blue-400 transition-all flex items-center justify-center space-x-2">
              <Search size={12} />
              <span>Query NSTA Portal</span>
            </button>
          </div>
        </div>

        {/* Scan Area */}
        <div className="flex-1 p-6 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="p-6 rounded-full bg-slate-900 border border-slate-800 text-slate-700">
                  <FileSearch size={48} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Select Document for Forensic X-Ray</h3>
                  <p className="text-[10px] text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
                    Select a public operator file from the NSTA/NDR portal to initiate an automated physics-anchored audit.
                  </p>
                </div>
              </motion.div>
            ) : isScanning ? (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center space-y-8"
              >
                <div className="relative">
                  <Loader2 size={64} className="text-blue-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black text-white">{scanProgress}%</span>
                  </div>
                </div>
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-[8px] font-black text-blue-400 uppercase tracking-widest">
                    <span>Analyzing Metadata</span>
                    <span>{scanProgress > 30 ? 'OK' : '...'}</span>
                  </div>
                  <div className="flex justify-between text-[8px] font-black text-blue-400 uppercase tracking-widest">
                    <span>Physics Validation</span>
                    <span>{scanProgress > 60 ? 'OK' : '...'}</span>
                  </div>
                  <div className="flex justify-between text-[8px] font-black text-blue-400 uppercase tracking-widest">
                    <span>Conflict Detection</span>
                    <span>{scanProgress > 90 ? 'OK' : '...'}</span>
                  </div>
                  <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-4">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
                <div className="text-[10px] font-terminal text-blue-300 animate-pulse">
                  SCRAPING: {mockFiles.find(f => f.id === selectedFile)?.name}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
                      Scan Results: {mockFiles.find(f => f.id === selectedFile)?.name}
                      <ExternalLink size={14} className="ml-2 text-slate-500 cursor-pointer hover:text-white" />
                    </h3>
                    <span className="text-[9px] text-slate-500 font-mono uppercase">Audit ID: WETE-XRAY-{selectedFile}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-black px-2 py-1 rounded border ${
                      findings.some(f => f.type === 'DISCREPANCY') 
                        ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {findings.some(f => f.type === 'DISCREPANCY') ? 'CONFLICT DETECTED' : 'NOMINAL ALIGNMENT'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {findings.map(finding => (
                    <div 
                      key={finding.id}
                      className={`p-4 rounded-xl border bg-slate-900/40 transition-all hover:bg-slate-900/60 ${
                        finding.type === 'DISCREPANCY' ? 'border-red-500/30' : 
                        finding.type === 'WARNING' ? 'border-yellow-500/30' : 
                        'border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            finding.type === 'DISCREPANCY' ? 'bg-red-500/10 text-red-500' : 
                            finding.type === 'WARNING' ? 'bg-yellow-500/10 text-yellow-500' : 
                            'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {finding.type === 'DISCREPANCY' ? <AlertTriangle size={16} /> : 
                             finding.type === 'WARNING' ? <ShieldAlert size={16} /> : 
                             <CheckCircle2 size={16} />}
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{finding.field}</span>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[8px] font-black text-slate-500 uppercase">Confidence:</span>
                              <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${finding.confidence * 100}%` }}></div>
                              </div>
                              <span className="text-[8px] font-mono text-blue-400">{(finding.confidence * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                        <ProvenanceTooltip 
                          source="NSTA Public Portal" 
                          validator="WellTegra Harvester v2.5" 
                          timestamp={new Date().toISOString()}
                        >
                          <div className="p-1 text-slate-600 hover:text-white transition-colors">
                            <ShieldAlert size={14} />
                          </div>
                        </ProvenanceTooltip>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="p-2 bg-slate-950/50 rounded border border-slate-800">
                          <span className="text-[7px] font-black text-slate-500 uppercase block mb-1">Public_Value</span>
                          <span className="text-[11px] font-mono text-slate-300">{finding.publicValue}</span>
                        </div>
                        <div className={`p-2 rounded border ${
                          finding.type === 'DISCREPANCY' ? 'bg-red-500/5 border-red-500/20' : 
                          finding.type === 'WARNING' ? 'bg-yellow-500/5 border-yellow-500/20' : 
                          'bg-emerald-500/5 border-emerald-500/20'
                        }`}>
                          <span className={`text-[7px] font-black uppercase block mb-1 ${
                            finding.type === 'DISCREPANCY' ? 'text-red-500' : 
                            finding.type === 'WARNING' ? 'text-yellow-500' : 
                            'text-emerald-500'
                          }`}>Forensic_Truth</span>
                          <span className={`text-[11px] font-mono font-bold ${
                            finding.type === 'DISCREPANCY' ? 'text-red-400' : 
                            finding.type === 'WARNING' ? 'text-yellow-400' : 
                            'text-emerald-400'
                          }`}>{finding.forensicValue}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-relaxed italic border-l-2 border-slate-800 pl-3">
                        "{finding.description}"
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                   <button 
                    onClick={() => setSelectedFile(null)}
                    className="text-[9px] font-black text-slate-500 uppercase hover:text-white transition-colors"
                   >
                     Clear Results
                   </button>
                   <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all flex items-center space-x-2">
                     <Download size={14} />
                     <span>Export Forensic Audit</span>
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default PublicFileXRay;
