import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import Plotly from 'plotly.js-dist-min';
import { MOCK_TRAUMA_DATA } from '../constants';
import { TraumaLayer, TraumaEvent, TraumaData } from '../types';
import { 
  Scan, Maximize2, Minimize2, Navigation, 
  Target, Info, AlertCircle, Crosshair,
  Search, Trash2, Clock, MapPin, Activity,
  ShieldAlert, ChevronRight, Zap, Loader2,
  Thermometer, Flame, Droplets, Gauge,
  CircleDot, Layers, BoxSelect, Cpu,
  Compass, Ruler, MinusSquare, Percent,
  SlidersHorizontal, Settings, Sun,
  Binary, Terminal, ShieldCheck,
  Lock, ArrowRight, CornerDownRight,
  Database, Share2, Activity as StressIcon,
  X // Added X icon
} from 'lucide-react';

const layerToKey: Record<TraumaLayer, keyof Omit<TraumaData, 'fingerId' | 'depth'>> = {
  [TraumaLayer.DEVIATION]: 'deviation',
  [TraumaLayer.CORROSION]: 'corrosion',
  [TraumaLayer.TEMPERATURE]: 'temperature',
  [TraumaLayer.WALL_LOSS]: 'wallLoss',
  [TraumaLayer.WATER_LEAKAGE]: 'waterLeakage',
  [TraumaLayer.STRESS]: 'stress',
  [TraumaLayer.ICI]: 'ici',
  [TraumaLayer.METAL_LOSS]: 'metalLoss',
  [TraumaLayer.OVALITY]: 'ovality',
  [TraumaLayer.UV_INDEX]: 'uvIndex'
};

const layerToUnit: Record<TraumaLayer, string> = {
  [TraumaLayer.DEVIATION]: 'deg',
  [TraumaLayer.CORROSION]: '%',
  [TraumaLayer.TEMPERATURE]: '°C',
  [TraumaLayer.WALL_LOSS]: 'mm',
  [TraumaLayer.WATER_LEAKAGE]: '%',
  [TraumaLayer.STRESS]: 'kpsi',
  [TraumaLayer.ICI]: 'idx',
  [TraumaLayer.METAL_LOSS]: 'mm',
  [TraumaLayer.OVALITY]: '%',
  [TraumaLayer.UV_INDEX]: 'uv'
};

const layerToIcon: Record<TraumaLayer, React.ReactNode> = {
  [TraumaLayer.DEVIATION]: React.createElement(Compass, { size: 14 }),
  [TraumaLayer.CORROSION]: React.createElement(Flame, { size: 14 }),
  [TraumaLayer.TEMPERATURE]: React.createElement(Thermometer, { size: 14 }),
  [TraumaLayer.WALL_LOSS]: React.createElement(MinusSquare, { size: 14 }),
  [TraumaLayer.WATER_LEAKAGE]: React.createElement(Droplets, { size: 14 }),
  [TraumaLayer.STRESS]: React.createElement(StressIcon, { size: 14 }),
  [TraumaLayer.ICI]: React.createElement(Ruler, { size: 14 }),
  [TraumaLayer.METAL_LOSS]: React.createElement(Zap, { size: 14 }),
  [TraumaLayer.OVALITY]: React.createElement(Percent, { size: 14 }),
  [TraumaLayer.UV_INDEX]: React.createElement(Sun, { size: 14 })
};

const getLayerColor = (layer: TraumaLayer) => {
  switch (layer) {
    case TraumaLayer.STRESS: return 'text-fuchsia-400';
    case TraumaLayer.UV_INDEX: return 'text-orange-400';
    case TraumaLayer.TEMPERATURE: return 'text-blue-400';
    default: return 'text-emerald-400';
  }
};

const getSliderAccent = (layer: TraumaLayer) => {
  switch (layer) {
    case TraumaLayer.STRESS: return 'accent-fuchsia-500';
    case TraumaLayer.UV_INDEX: return 'accent-orange-500';
    default: return 'accent-emerald-500';
  }
};

interface TraumaNodeProps {
  isFocused?: boolean;
  onToggleFocus?: () => void;
}

const TraumaNode: React.FC<TraumaNodeProps> = ({ isFocused = false, onToggleFocus }) => {
  const plotContainerRef = useRef<HTMLDivElement>(null);
  const [highlightedDepth, setHighlightedDepth] = useState<number | null>(null);
  const [selectedLog, setSelectedLog] = useState<TraumaEvent | null>(null);
  const [flashDepth, setFlashDepth] = useState<number | null>(null);
  const [isTargeting, setIsTargeting] = useState(false);
  const [activeLayer, setActiveLayer] = useState<TraumaLayer>(TraumaLayer.STRESS);
  const [isScanning, setIsScanning] = useState(false);
  const [isCrossSectionView, setIsCrossSectionView] = useState(false);
  const [pingCoord, setPingCoord] = useState<{ x: number, y: number, id: string } | null>(null);
  const [scanSweepDepth, setScanSweepDepth] = useState<number | null>(null);
  const [pulseScale, setPulseScale] = useState(1);
  const [uiRevision, setUiRevision] = useState<string>('initial');
  const [isGlitching, setIsGlitching] = useState(false);

  const [layerOpacities, setLayerOpacities] = useState<Record<TraumaLayer, number>>(
    Object.values(TraumaLayer).reduce((acc, layer) => ({ ...acc, [layer]: 90 }), {} as Record<TraumaLayer, number>)
  );

  const allDepths = useMemo(() => Array.from(new Set(MOCK_TRAUMA_DATA.map(d => d.depth))).sort((a, b) => a - b), []);
  const fingerIds = useMemo(() => Array.from(new Set(MOCK_TRAUMA_DATA.map(d => d.fingerId))).sort((a, b) => a - b), []);

  const [blackBoxLogs, setBlackBoxLogs] = useState<TraumaEvent[]>(() => {
    const saved = localStorage.getItem('BRAHAN_BLACK_BOX_LOGS');
    return saved ? JSON.parse(saved) : [];
  });

  const currentStressValue = useMemo(() => {
     if (!highlightedDepth) return 0;
     const entry = MOCK_TRAUMA_DATA.find(d => d.depth === highlightedDepth);
     return entry ? entry.stress : 0;
  }, [highlightedDepth]);

  // Fix: The `clearLogs` function was referenced before it was defined in the `React.createElement` scope.
  // Ensured it's properly defined within the component scope.
  const clearLogs = () => {
    if (window.confirm("CONFIRM: WIPE FORENSIC TRACE HISTORY?")) {
      setBlackBoxLogs([]);
      setSelectedLog(null);
      setHighlightedDepth(null);
      setIsTargeting(false); // Clear targeting HUD
      setFlashDepth(null);
      setScanSweepDepth(null);
      setPulseScale(1);
      setUiRevision(Date.now().toString()); // Force Plotly update
      localStorage.removeItem('BRAHAN_BLACK_BOX_LOGS');
    }
  };

  const handleOpacityChange = (layer: TraumaLayer, value: number) => {
    setLayerOpacities(prev => ({ ...prev, [layer]: value }));
  };

  const handleLayerChange = (layer: TraumaLayer) => {
    if (activeLayer === layer) return;
    setIsGlitching(true);
    setActiveLayer(layer);
    setUiRevision(Date.now().toString());
    setTimeout(() => setIsGlitching(false), 300);
  };

  const triggerFlashAtDepth = useCallback((depth: number, log?: TraumaEvent) => {
    // Reset previous targeting state before new one
    setIsTargeting(false); 
    setFlashDepth(null);
    setScanSweepDepth(null);

    setHighlightedDepth(depth);
    if (log) {
      setSelectedLog(log);
    } else {
      // If clicked on 3D model, try to find a relevant log, or just set a mock one
      const foundLog = blackBoxLogs.find(l => l.depth === depth);
      if (foundLog) {
        setSelectedLog(foundLog);
      } else {
        // Create a temporary log for the HUD
        setSelectedLog({
          timestamp: new Date().toISOString(),
          layer: activeLayer,
          depth: depth,
          value: 0, // We don't have the exact value easily here without looking it up
          unit: layerToUnit[activeLayer],
          severity: 'INFO',
          description: `Manual inspection at ${depth}m.`
        });
      }
    }
    
    setFlashDepth(depth); // Trigger the pulse
    setIsTargeting(true); // Show HUD
    setIsGlitching(true); // Small glitch effect on chart
    setUiRevision(Date.now().toString()); // Force Plotly to update camera if needed

    // Localized Cylinder Pulse animation
    setPulseScale(2.8);
    setTimeout(() => setPulseScale(1.0), 300);
    setTimeout(() => setPulseScale(1.5), 600);
    setTimeout(() => setPulseScale(1.0), 900);
    setTimeout(() => setIsGlitching(false), 500); // Clear glitch

    // Dynamic Sweep Animation
    const startDepth = scanSweepDepth || allDepths[0]; // Start from current sweep or top
    const duration = 1400;
    const startTime = performance.now();
    
    const animateSweep = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const currentSweep = startDepth + (depth - startDepth) * easedProgress;
      setScanSweepDepth(currentSweep);
      
      if (progress < 1) requestAnimationFrame(animateSweep);
      else setTimeout(() => setScanSweepDepth(null), 1200); // Clear sweep line
    };
    requestAnimationFrame(animateSweep);

    // Camera Autopilot zoom to Target
    if (plotContainerRef.current && !isCrossSectionView) {
      const zRange = allDepths[allDepths.length-1] - allDepths[0];
      const normalizedZ = (depth - allDepths[0]) / zRange;
      const cameraCenterZ = normalizedZ * 2 - 1; // Normalize depth to Plotly's -1 to 1 range for camera.center.z

      Plotly.relayout(plotContainerRef.current, {
        'scene.camera.center': { x: 0, y: 0, z: cameraCenterZ },
        'scene.camera.eye': { x: 1.5, y: 1.5, z: cameraCenterZ + 0.7 } // Move eye to look at center + slightly above
      });
    }

    // Clear flash after a certain period
    setTimeout(() => setFlashDepth(null), 2500);
  }, [blackBoxLogs, activeLayer, scanSweepDepth, allDepths, isCrossSectionView]);

  const runForensicScan = () => {
    setIsScanning(true);
    setBlackBoxLogs([]); // Clear logs before a new scan
    setTimeout(() => {
      const key = layerToKey[activeLayer];
      const unit = layerToUnit[activeLayer];
      
      const depthGroups = MOCK_TRAUMA_DATA.reduce((acc, curr) => {
        const val = curr[key] as number;
        if (val > 15 || (activeLayer === TraumaLayer.UV_INDEX && val > 8) || (activeLayer === TraumaLayer.STRESS && val > 60)) {
          if (!acc[curr.depth] || (acc[curr.depth][key] as number) < val) {
            acc[curr.depth] = curr;
          }
        }
        return acc;
      }, {} as Record<number, TraumaData>);

      const newEvents: TraumaEvent[] = Object.values(depthGroups).map(a => {
        const val = a[key] as number;
        let severity: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO';
        if (val > 40 || (activeLayer === TraumaLayer.UV_INDEX && val > 10) || (activeLayer === TraumaLayer.STRESS && val > 80)) severity = 'CRITICAL';
        else if (val > 20 || (activeLayer === TraumaLayer.UV_INDEX && val > 5) || (activeLayer === TraumaLayer.STRESS && val > 40)) severity = 'WARNING';

        return {
          timestamp: new Date().toISOString(),
          layer: activeLayer,
          depth: a.depth,
          value: val,
          unit: unit,
          severity,
          description: `Anomalous ${activeLayer.toLowerCase()} detected at ${a.depth}m. Trace ID: ${Math.random().toString(36).substring(7).toUpperCase()}`
        };
      });

      const updated = [...newEvents, ...blackBoxLogs].slice(0, 100);
      setBlackBoxLogs(updated);
      localStorage.setItem('BRAHAN_BLACK_BOX_LOGS', JSON.stringify(updated));
      setIsScanning(false);
      
      if (newEvents.length > 0) {
        // Sort to find the most critical or just take the first one
        const topEvent = newEvents.sort((a, b) => b.value - a.value)[0];
        setTimeout(() => {
          triggerFlashAtDepth(topEvent.depth, topEvent);
        }, 300);
      }
    }, 1200);
  };

  useEffect(() => {
    if (!plotContainerRef.current) return;

    const baseRadius = 50; 
    let traces: any[] = [];
    let layout: any = {};

    const getColorScale = (layer: TraumaLayer) => {
      switch(layer) {
        case TraumaLayer.STRESS:
          return [
            [0, '#020617'], [0.1, '#4338ca'], [0.5, '#a855f7'], [0.8, '#d946ef'], 
            [0.9, '#ffffff'], [1.0, '#ffffff']
          ];
        case TraumaLayer.TEMPERATURE:
          return [
            [0, '#082f49'], [0.3, '#0ea5e9'], [0.7, '#fde047'], [0.9, '#ffffff'], [1.0, '#fbbf24']
          ];
        case TraumaLayer.UV_INDEX:
          return [
            [0, '#2e1065'], [0.2, '#5b21b6'], [0.5, '#f59e0b'], [0.8, '#fffbeb'], [1.0, '#ffffff']
          ];
        default:
          return [
            [0, '#010409'], [0.3, '#064e3b'], [0.6, '#10b981'], [0.9, '#34d399'], [1.0, '#ffffff']
          ];
      }
    };

    if (isCrossSectionView) {
      const targetDepth = highlightedDepth || allDepths[0];
      const dataAtDepth = MOCK_TRAUMA_DATA.filter(d => d.depth === targetDepth);
      const key = layerToKey[activeLayer];
      
      const rValues: number[] = [];
      const thetaValues: number[] = [];
      const colorValues: number[] = [];

      fingerIds.forEach((fId, idx) => {
        const entry = dataAtDepth.find(d => d.fingerId === fId);
        const val = entry ? (entry[key] as number) : 0;
        const isFlashed = flashDepth === targetDepth;
        const r = baseRadius + (isFlashed ? (val + 20) * pulseScale : val);
        
        rValues.push(r);
        thetaValues.push((idx / fingerIds.length) * 360);
        colorValues.push(isFlashed ? 100 : val);
      });

      rValues.push(rValues[0]);
      thetaValues.push(thetaValues[0]);
      colorValues.push(colorValues[0]);

      traces.push({
        type: 'scatterpolar',
        r: rValues,
        theta: thetaValues,
        mode: 'lines+markers',
        fill: 'toself',
        fillcolor: activeLayer === TraumaLayer.STRESS ? 'rgba(217, 70, 239, 0.15)' : activeLayer === TraumaLayer.UV_INDEX ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
        line: { color: activeLayer === TraumaLayer.STRESS ? '#d946ef' : activeLayer === TraumaLayer.UV_INDEX ? '#f59e0b' : '#10b981', width: 3 },
        marker: {
          color: colorValues,
          colorscale: getColorScale(activeLayer),
          cmin: 0,
          cmax: 100,
          size: 6,
          line: { color: '#010409', width: 1.5 }
        },
        name: `DEPTH_${targetDepth}m`,
        opacity: layerOpacities[activeLayer] / 100
      });

      traces.push({
        type: 'scatterpolar',
        r: Array(thetaValues.length).fill(baseRadius),
        theta: thetaValues,
        mode: 'lines',
        line: { color: 'rgba(16, 185, 129, 0.3)', width: 1, dash: 'dot' },
        name: 'NOMINAL_ID'
      });

      layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 20, r: 20, b: 20, t: 40 },
        polar: {
          bgcolor: 'rgba(2, 6, 23, 0.8)',
          angularaxis: {
            tickfont: { size: 8, color: '#10b981', family: 'Fira Code' },
            gridcolor: 'rgba(16, 185, 129, 0.15)',
            linecolor: 'rgba(16, 185, 129, 0.4)'
          },
          radialaxis: {
            tickfont: { size: 8, color: '#10b981', family: 'Fira Code' },
            gridcolor: 'rgba(16, 185, 129, 0.15)',
            linecolor: 'rgba(16, 185, 129, 0.4)',
            range: [0, 150]
          }
        },
        showlegend: false,
        title: {
          text: `RADIAL_INSPECTOR // MODALITY: ${activeLayer}`,
          font: { color: '#10b981', size: 12, family: 'Fira Code' },
          y: 0.95
        }
      };
    } else {
      const xData: number[][] = [];
      const yData: number[][] = [];
      const zData: number[][] = [];
      const colorData: number[][] = [];

      allDepths.forEach((depth) => {
        const xRow: number[] = [];
        const yRow: number[] = [];
        const zRow: number[] = [];
        const cRow: number[] = [];
        const dataAtDepth = MOCK_TRAUMA_DATA.filter(d => d.depth === depth);

        fingerIds.forEach((fId, fIdx) => {
          const theta = (fIdx / fingerIds.length) * 2 * Math.PI;
          const entry = dataAtDepth.find(d => d.fingerId === fId);
          let val = entry ? (entry[layerToKey[activeLayer]] as number) : 0;
          const isFlashed = flashDepth === depth;
          const isNearSweep = scanSweepDepth !== null && Math.abs(depth - scanSweepDepth) < 0.2;
          
          const r = baseRadius + (isFlashed ? (val + 30) * pulseScale : val);
          
          xRow.push(r * Math.cos(theta));
          yRow.push(r * Math.sin(theta));
          zRow.push(depth);
          
          if (isFlashed) cRow.push(100); 
          else if (isNearSweep) cRow.push(80); 
          else cRow.push(val);
        });

        xRow.push(xRow[0]);
        yRow.push(yRow[0]);
        zRow.push(zRow[0]);
        cRow.push(cRow[0]);

        xData.push(xRow);
        yData.push(yRow);
        zData.push(zRow);
        colorData.push(cRow);
      });

      const surfaceTrace = {
        type: 'surface',
        x: xData,
        y: yData,
        z: zData,
        surfacecolor: colorData,
        colorscale: getColorScale(activeLayer),
        cmin: 0,
        cmax: 100,
        showscale: false,
        lighting: { 
          ambient: 0.35,
          diffuse: 0.45,
          specular: 2.8,
          roughness: 0.04,
          fresnel: 1.2
        },
        lightposition: { x: 1000, y: 1000, z: 1300 },
        opacity: layerOpacities[activeLayer] / 100,
        name: activeLayer
      };

      traces = [surfaceTrace];

      // Vertical Axis Center Line
      traces.push({
        type: 'scatter3d',
        mode: 'lines',
        x: [0, 0], y: [0, 0], z: [allDepths[0], allDepths[allDepths.length-1]],
        line: { color: 'rgba(16, 185, 129, 0.4)', width: 3, dash: 'dot' },
        name: 'AXIS'
      });

      if (highlightedDepth !== null) {
        const ringColor = activeLayer === TraumaLayer.STRESS ? '#d946ef' : activeLayer === TraumaLayer.UV_INDEX ? '#f59e0b' : '#10b981';
        
        // Targeting Rings
        [1.2, 1.5, 2.0].forEach(scale => {
          const ringX: number[] = [];
          const ringY: number[] = [];
          const ringZ: number[] = [];
          for (let i = 0; i <= 64; i++) {
            const theta = (i / 64) * 2 * Math.PI;
            ringX.push(baseRadius * scale * Math.cos(theta));
            ringY.push(baseRadius * scale * Math.sin(theta));
            ringZ.push(highlightedDepth);
          }
          traces.push({
            type: 'scatter3d',
            mode: 'lines',
            x: ringX, y: ringY, z: ringZ,
            line: { 
              color: ringColor, 
              width: scale === 1.2 ? 6 : scale === 1.5 ? 3 : 1, 
              dash: scale === 2.0 ? 'dash' : 'solid', 
              opacity: 0.8
            },
            name: `TARGET_LOCK_${scale}`
          });
        });

        // 3D Targeting Vanes (Crosshair)
        const vaneLen = 250;
        traces.push({
          type: 'scatter3d',
          mode: 'lines',
          x: [-vaneLen, vaneLen, null, 0, 0],
          y: [0, 0, null, -vaneLen, vaneLen],
          z: [highlightedDepth, highlightedDepth, null, highlightedDepth, highlightedDepth],
          line: { color: ringColor, width: 2, opacity: 0.4 },
          name: 'TARGET_VANES'
        });

        // 3D POI Label
        traces.push({
          type: 'scatter3d',
          mode: 'text',
          x: [0], y: [0], z: [highlightedDepth + 1.5],
          text: [`[ ! ] ANOMALY_LOCK @ ${highlightedDepth.toFixed(3)}M`],
          textfont: { family: 'Fira Code', size: 10, color: '#ffffff' },
          name: 'POI_LABEL'
        });
      }

      if (scanSweepDepth !== null) {
        const sweepX: number[] = [];
        const sweepY: number[] = [];
        const sweepZ: number[] = [];
        for (let i = 0; i <= 60; i++) {
          const theta = (i / 60) * 2 * Math.PI;
          sweepX.push(180 * Math.cos(theta));
          sweepY.push(180 * Math.sin(theta));
          sweepZ.push(scanSweepDepth);
        }
        traces.push({
          type: 'scatter3d',
          mode: 'lines',
          x: sweepX, y: sweepY, z: sweepZ,
          line: { color: '#10b981', width: 10, opacity: 0.6 },
          name: 'SCAN_SWEEP'
        });
      }

      layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { l: 0, r: 0, b: 0, t: 0 },
        uirevision: uiRevision,
        scene: {
          xaxis: { visible: false },
          yaxis: { visible: false },
          zaxis: { 
            title: 'DEPTH (m)', 
            backgroundcolor: '#010409', gridcolor: '#064e3b', zerolinecolor: '#10b981',
            tickfont: { color: '#10b981', size: 10, family: 'Fira Code' }
          },
          dragmode: 'orbit',
          aspectmode: 'manual',
          aspectratio: { x: 1, y: 1, z: 2.2 },
          camera: uiRevision === 'initial' ? {
            eye: { x: 2.2, y: 2.2, z: 1.5 },
            center: { x: 0, y: 0, z: 0 },
            projection: { type: 'perspective' }
          } : undefined
        },
        autosize: true
      };
    }

    Plotly.react(plotContainerRef.current, traces, layout, { 
      responsive: true, 
      displayModeBar: false,
      displaylogo: false
    }).then(() => {
      const plotEl = plotContainerRef.current as any;
      if (plotEl) {
        plotEl.removeAllListeners('plotly_click');
        plotEl.on('plotly_click', (data: any) => {
          if (data && data.points && data.points.length > 0) {
            const point = data.points[0];
            const depth = isCrossSectionView ? highlightedDepth : point.z;
            if (depth !== undefined && depth !== null) {
               triggerFlashAtDepth(depth);
            }
          }
        });
      }
    });

    return () => {
      if (plotContainerRef.current) Plotly.purge(plotContainerRef.current);
    };
  }, [allDepths, fingerIds, activeLayer, highlightedDepth, flashDepth, scanSweepDepth, pulseScale, uiRevision, isCrossSectionView, layerOpacities, triggerFlashAtDepth]);

  // Fix: The `handleLogClick` function was referenced before it was defined in the `React.createElement` scope.
  // Ensured it's properly defined within the component scope.
  const handleLogClick = (e: React.MouseEvent, log: TraumaEvent) => {
    // Click pulse effect on the log entry itself
    const rect = e.currentTarget.getBoundingClientRect();
    setPingCoord({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top, 
      id: Math.random().toString(36).substring(7) 
    });
    
    // Clear the ping effect after a short duration
    setTimeout(() => setPingCoord(null), 1000);

    triggerFlashAtDepth(log.depth, log);
  };

  return (
    // Converted JSX to React.createElement for the TraumaNode component
    React.createElement("div", { className: "flex flex-col h-full space-y-3 p-4 bg-slate-900/40 border border-emerald-900/30 rounded-lg transition-all relative overflow-hidden font-terminal" },
      // Fix: Conditional rendering block for `isTargeting` and `highlightedDepth`.
      // Changed from `&& (...)` to `? React.createElement(...) : null` to fix syntax.
      // Removed pre-calculated `pulsatingBgClass`, `iconDivBorderShadowClass`, `crosshairClass` to ensure direct scope.
      isTargeting && highlightedDepth
        ? React.createElement("div", { className: "absolute inset-0 pointer-events-none z-[100] flex items-center justify-center animate-in fade-in duration-700" },
            // Removed trailing comma from `pulsatingBgClass` element, and embedded logic directly.
            React.createElement("div", { className: "absolute inset-0 animate-pulse " + 
              (activeLayer === TraumaLayer.STRESS ? 'bg-fuchsia-500/10' : 
               activeLayer === TraumaLayer.UV_INDEX ? 'bg-orange-500/10' : 
               'bg-emerald-500/5') 
            }),
            React.createElement("div", { className: "absolute top-10 right-10 p-6 border border-emerald-500/50 bg-slate-950/95 backdrop-blur-3xl rounded-xl animate-in slide-in-from-right-8 shadow-[0_0_80px_rgba(0,0,0,0.8)] border-l-4" },
              React.createElement("div", { className: "flex items-center justify-between mb-4 border-b border-emerald-900/40 pb-3" },
                React.createElement("div", { className: "flex items-center space-x-4" },
                  React.createElement(Target, { size: 20, className: "text-emerald-400 animate-spin-slow" }),
                  React.createElement("span", { className: "text-[12px] font-black text-emerald-400 tracking-[0.4em] uppercase" }, "Voxel_Lock_Engaged")
                ),
                React.createElement("button", { onClick: (e) => { e.stopPropagation(); setIsTargeting(false); }, className: "pointer-events-auto p-1 text-emerald-900 hover:text-emerald-400" },
                  React.createElement(X, { size: 14 })
                )
              ),
              React.createElement("div", { className: "space-y-4" },
                React.createElement("div", { className: "flex justify-between items-center space-x-16" },
                  React.createElement("span", { className: "text-[9px] text-emerald-900 font-black uppercase" }, "Depth_Artifact"),
                  React.createElement("span", { className: "text-[18px] font-terminal font-black text-emerald-100" }, highlightedDepth.toFixed(3) + "M")
                ),
                React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                  React.createElement("div", { className: "p-3 bg-slate-900/80 rounded border border-emerald-900/30" },
                    React.createElement("span", { className: "text-[7px] text-emerald-900 font-black uppercase block mb-1" }, "Observation"),
                    React.createElement("span", { className: `text-[11px] font-black uppercase ${selectedLog?.severity === 'CRITICAL' ? 'text-red-400' : 'text-emerald-400'}` },
                      selectedLog?.severity
                    )
                  ),
                  React.createElement("div", { className: "p-3 bg-slate-900/80 rounded border border-emerald-900/30" },
                    React.createElement("span", { className: "text-[7px] text-emerald-900 font-black uppercase block mb-1" }, "Value_Delta"),
                    React.createElement("span", { className: "text-[11px] font-black text-emerald-100" },
                      `${selectedLog?.value.toFixed(2)} ${selectedLog?.unit}`
                    )
                  )
                ),
                activeLayer === TraumaLayer.STRESS && (
                  React.createElement("div", { className: "p-3 bg-fuchsia-500/10 rounded border border-fuchsia-500/30 animate-in zoom-in-95" },
                    React.createElement("span", { className: "text-[7px] text-fuchsia-400 font-black uppercase block mb-1" }, "Structural_Fatigue_Status"),
                    React.createElement("div", { className: "flex items-center justify-between" },
                      React.createElement("span", { className: `text-[12px] font-black ${currentStressValue > 80 ? 'text-red-500' : 'text-fuchsia-300'}` },
                        currentStressValue > 80 ? 'YIELD_BREACHED' : 'NOMINAL_STRESS'
                      ),
                      React.createElement("span", { className: "text-[9px] font-mono text-fuchsia-500" }, `${((currentStressValue / 90) * 100).toFixed(1)}% YIELD`)
                    )
                  )
                ),
                React.createElement("div", { className: "p-3 bg-slate-900/80 rounded border border-emerald-900/30" },
                  React.createElement("span", { className: "text-[7px] text-emerald-900 font-black uppercase block mb-1" }, "Forensic_Trace_ID"),
                  React.createElement("span", { className: "text-[10px] font-mono text-emerald-500 truncate block" },
                    `TRX_${Math.random().toString(36).substring(7).toUpperCase()}_LOCK`
                  )
                )
              )
            ),
            React.createElement("div", { className: `p-12 border-2 border-dashed rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] ${activeLayer === TraumaLayer.STRESS ? 'border-fuchsia-500/30' : 'border-emerald-500/30'}` },
              React.createElement("div", { className: "bg-slate-950/90 p-8 rounded-2xl border border-emerald-500/40 flex flex-col items-center space-y-4 shadow-2xl backdrop-blur-md" },
                // Embedded crosshairClass logic directly
                React.createElement(Crosshair, { size: 40, className: activeLayer === TraumaLayer.STRESS ? "text-fuchsia-500 animate-pulse" : 
                  activeLayer === TraumaLayer.UV_INDEX ? "text-orange-500 animate-pulse" : 
                  "text-emerald-500 animate-pulse" }),
                React.createElement("span", { className: "text-[14px] font-black tracking-[0.6em] text-white uppercase drop-shadow-lg" }, `Locked: ${highlightedDepth.toFixed(3)}M`)
              )
            )
          )
        : null,

      React.createElement("div", { className: "flex flex-col space-y-4 mb-2" },
        React.createElement("div", { className: "flex items-center justify-between" },
          React.createElement("div", { className: "flex items-center space-x-4" },
            // Embedded iconDivBorderShadowClass logic directly
            React.createElement("div", { className: "p-3 bg-emerald-950/80 border rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all " + 
              (activeLayer === TraumaLayer.STRESS ? 'border-fuchsia-500/60 shadow-fuchsia-500/30' : 
               activeLayer === TraumaLayer.UV_INDEX ? 'border-orange-500/60 shadow-orange-500/30' : 
               'border-emerald-500/60') },
              layerToIcon[activeLayer]
            ),
            React.createElement("div", null,
              React.createElement("h2", { className: "text-3xl font-black text-emerald-400 font-terminal uppercase tracking-tighter" }, "Trauma_Node_Forensics"),
              React.createElement("div", { className: "flex items-center space-x-3" },
                React.createElement(Binary, { size: 14, className: "text-emerald-800" }),
                React.createElement("span", { className: "text-[10px] text-emerald-800 uppercase tracking-widest font-black" }, "Cylindrical Voxel Autopsy Array"),
                React.createElement("div", { className: "w-1 h-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" })
              )
            )
          ),
          React.createElement("div", { className: "flex items-center space-x-3" },
            React.createElement("button", { 
              onClick: () => setIsCrossSectionView(!isCrossSectionView),
              className: `flex items-center space-x-2 px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${isCrossSectionView ? 'bg-orange-500 text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.5)]' : 'bg-slate-900 border border-emerald-900/50 text-emerald-400 hover:border-emerald-400'}`
            },
              React.createElement(Layers, { size: 16 }),
              React.createElement("span", null, isCrossSectionView ? '3D Cylinder' : 'Radial_Map')
            ),
            React.createElement("button", { 
              onClick: runForensicScan,
              disabled: isScanning,
              className: `flex items-center space-x-2 px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${isScanning ? 'bg-orange-500/20 text-orange-500 border border-orange-500/40' : 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`
            },
              isScanning ? React.createElement(Loader2, { size: 16, className: "animate-spin" }) : React.createElement(Scan, { size: 16 }),
              React.createElement("span", null, "Scan_Sector")
            ),
            React.createElement("button", { onClick: onToggleFocus, className: "p-2.5 text-emerald-800 hover:text-emerald-400 transition-colors" },
              isFocused ? React.createElement(Minimize2, { size: 28 }) : React.createElement(Maximize2, { size: 28 })
            )
          )
        ),
      ),
      React.createElement("div", { className: "flex-1 min-h-0 flex space-x-4" },
        React.createElement("div", { ref: plotContainerRef, className: `flex-1 bg-slate-950 rounded-2xl border border-emerald-900/40 overflow-hidden relative transition-all duration-500 shadow-inner ${isGlitching ? 'blur-[6px] brightness-150' : ''}` },
           isScanning && (
              React.createElement("div", { className: "absolute inset-0 pointer-events-none z-20 bg-emerald-500/5 overflow-hidden" },
                 React.createElement("div", { className: "h-2 w-full absolute top-0 animate-[scanline_2s_linear_infinite] bg-emerald-400/60 shadow-[0_0_40px_rgba(52,211,153,0.6)]" })
              )
           ),
           React.createElement("div", { className: "absolute inset-0 pointer-events-none bg-gradient-to-t from-emerald-500/5 to-transparent mix-blend-overlay" })
        ),
        !isFocused && (
          React.createElement("div", { className: "w-80 bg-slate-950/90 border border-emerald-900/30 rounded-2xl p-5 flex flex-col space-y-4 shadow-2xl animate-in slide-in-from-right-6 duration-700 backdrop-blur-md" },
             React.createElement("div", { className: "flex items-center space-x-3 border-b border-emerald-900/40 pb-4 mb-1" },
                React.createElement(SlidersHorizontal, { size: 18, className: "text-emerald-500" }),
                React.createElement("span", { className: "text-[12px] font-black text-emerald-400 uppercase tracking-widest" }, "Calibration_Array")
             ),
             React.createElement("div", { className: "flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2" },
                Object.values(TraumaLayer).map((layer) => {
                  const isActive = activeLayer === layer;
                  const opacity = layerOpacities[layer];
                  const layerColor = getLayerColor(layer);
                  const accent = getSliderAccent(layer);
                  
                  return (
                    React.createElement("div", { 
                      key: layer, 
                      onClick: () => handleLayerChange(layer),
                      className: `group flex flex-col space-y-2 p-3.5 rounded-xl transition-all duration-300 border cursor-pointer ${isActive ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] scale-[1.02]' : 'bg-slate-900/40 border-transparent hover:border-emerald-900/50 hover:bg-slate-900/60 opacity-60 hover:opacity-100'}`
                    },
                      React.createElement("div", { className: "flex items-center justify-between" },
                         React.createElement("div", { className: "flex items-center space-x-3" },
                            React.createElement("span", { className: isActive ? layerColor : 'text-emerald-900' }, layerToIcon[layer]),
                            React.createElement("span", { className: `text-[9px] font-black uppercase tracking-tight ${isActive ? 'text-emerald-100' : 'text-emerald-900'}` }, layer)
                         ),
                         React.createElement("div", { className: "flex items-center space-x-2" },
                            React.createElement("span", { className: "text-[7px] text-emerald-900 font-black uppercase" }, "OPACITY:"),
                            React.createElement("span", { className: `text-[10px] font-terminal font-black ${isActive ? layerColor : 'text-emerald-950'}` }, `${opacity}%`)
                         )
                      ),
                      React.createElement("input", { 
                        type: "range", 
                        min: "0", 
                        max: "100", 
                        value: opacity, 
                        onClick: (e) => e.stopPropagation(),
                        onChange: (e) => handleOpacityChange(layer, parseInt(e.target.value)),
                        className: `w-full h-1 bg-slate-800 appearance-none rounded-full cursor-pointer transition-all ${isActive ? accent : 'accent-emerald-950 opacity-30'}` 
                      })
                    )
                  );
                })
             ),
             activeLayer === TraumaLayer.STRESS && (
               React.createElement("div", { className: "p-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-xl animate-in fade-in zoom-in-95" },
                  React.createElement("div", { className: "flex items-center justify-between mb-2" },
                     React.createElement("span", { className: "text-[8px] font-black text-fuchsia-900 uppercase" }, "Yield_Threshold"),
                     React.createElement("span", { className: "text-[8px] font-black text-fuchsia-400" }, "90 kpsi")
                  ),
                  React.createElement("div", { className: "h-1 bg-slate-800 rounded-full overflow-hidden" },
                     React.createElement("div", { className: "h-full bg-fuchsia-500", style: { width: '90%' } })
                  )
               )
             ),
             React.createElement("div", { className: "pt-4 border-t border-emerald-900/20 text-[9px] text-emerald-900 font-black uppercase flex items-center justify-between" },
                React.createElement("span", { className: "flex items-center space-x-2" }, React.createElement(ShieldCheck, { size: 12 }), " ", React.createElement("span", null, "Veto_Control: Sector_Alpha")),
                React.createElement(Settings, { size: 14, className: "animate-spin-slow" })
             )
          )
        )
      ),
      React.createElement("div", { className: "h-80 bg-slate-950/95 border border-emerald-900/40 rounded-2xl flex flex-col overflow-hidden shadow-2xl" },
        React.createElement("div", { className: "bg-slate-900/95 border-b border-emerald-900/60 p-4 flex items-center justify-between" },
          React.createElement("div", { className: "flex items-center space-x-4" },
            React.createElement(ShieldAlert, { size: 22, className: "text-emerald-500" }),
            React.createElement("span", { className: "text-[12px] font-black text-emerald-400 uppercase tracking-[0.3em]" }, "Forensic_Black_Box_Logs")
          ),
          React.createElement("div", { className: "flex items-center space-x-8" },
             React.createElement("span", { className: "text-[9px] font-mono tracking-[0.2em] uppercase text-emerald-900" }, "Archive_Nodes: " + blackBoxLogs.length),
             React.createElement("button", { onClick: clearLogs, className: "p-2 text-emerald-900 hover:text-red-500 transition-colors bg-black/40 rounded-lg" },
               React.createElement(Trash2, { size: 16 })
             )
          )
        ),
        // Fix: Use an array for children to correctly handle `map` and conditional rendering.
        // Fix: Ensure `blackBoxLogs` and `highlightedDepth` are correctly accessed in scope.
        React.createElement("div", { className: "flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-950/20" },
          // Fix: Spread operator to correctly include elements returned by map as children.
          ...blackBoxLogs.map((log, idx) => {
            const isSelected = highlightedDepth === log.depth;
            const severityBg = log.severity === 'CRITICAL' ? 'bg-red-500/20 border-red-500 text-red-400' : 
                               log.severity === 'WARNING' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 
                               'bg-emerald-500/20 border-emerald-500 text-emerald-400';

            return (
              React.createElement("div", { 
                key: `${log.timestamp}-${idx}`, 
                onClick: (e) => handleLogClick(e, log),
                className: `flex flex-col border-l-4 rounded-xl p-5 transition-all cursor-pointer relative group overflow-hidden ${isSelected ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'bg-slate-900/40 border-emerald-900/30 hover:bg-slate-900/80 hover:border-emerald-700'}`
              },
                // Fix: Conditional rendering for `pingCoord`
                isSelected && pingCoord
                   ? React.createElement("div", { 
                    className: "absolute rounded-full bg-emerald-500/40 animate-[ping_0.8s_ease-out_infinite] pointer-events-none",
                    style: { left: pingCoord.x - 20, top: pingCoord.y - 20, width: 40, height: 40 }
                   })
                   : null,
                React.createElement("div", { className: "flex items-center justify-between mb-3" },
                  React.createElement("div", { className: "flex items-center space-x-5" },
                    React.createElement("span", { className: `px-3 py-1 rounded-md text-[9px] font-black tracking-widest border ${severityBg}` },
                      log.severity
                    ),
                    React.createElement("span", { className: "text-[13px] font-black text-emerald-100 uppercase tracking-tight" }, `${log.layer} @ `, React.createElement("span", { className: "text-emerald-400 underline decoration-emerald-500/40 underline-offset-4" }, `${log.depth.toFixed(3)}m`))
                  ),
                  React.createElement("div", { className: "flex items-center space-x-3 text-[10px] font-mono text-emerald-900" },
                    React.createElement(Clock, { size: 12 }),
                    React.createElement("span", null, new Date(log.timestamp).toLocaleTimeString())
                  )
                ),
                React.createElement("p", { className: "text-[11px] text-emerald-100/80 font-mono italic leading-relaxed pr-12" }, log.description),
                React.createElement("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-emerald-900/30" },
                   React.createElement("div", { className: "flex items-center space-x-6" },
                      React.createElement("div", { className: "flex items-center space-x-2" },
                         React.createElement(Zap, { size: 14, className: "text-emerald-500" }),
                         React.createElement("span", { className: "text-[13px] font-black text-emerald-400" }, `${log.value.toFixed(2)}`, React.createElement("span", { className: "text-[9px] opacity-60 ml-1.5 uppercase font-mono" }, log.unit))
                      ),
                      React.createElement("div", { className: "h-5 w-px bg-emerald-900/50" }),
                      React.createElement("div", { className: "flex items-center space-x-2" },
                         React.createElement(MapPin, { size: 12, className: isSelected ? 'text-emerald-400' : 'text-emerald-900' }),
                         React.createElement("span", { className: `text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-emerald-400' : 'text-emerald-900'}` }, isSelected ? 'LOCATED_ON_RECONSTRUCTION' : 'AWAITING_RELOCATION')
                      )
                   ),
                   React.createElement("div", { className: "flex items-center space-x-3" },
                      React.createElement(ChevronRight, { size: 22, className: `transition-all duration-500 ${isSelected ? 'translate-x-3 text-emerald-400' : 'text-emerald-900 group-hover:text-emerald-600'}` })
                   )
                )
              )
            );
          }),
          // Fix: Conditional rendering for empty logs state.
          // Changed from `&& (...)` to `? React.createElement(...) : null` to fix syntax.
          blackBoxLogs.length === 0
            ? React.createElement("div", { className: "h-full flex flex-col items-center justify-center opacity-10" },
                React.createElement(Terminal, { size: 64, className: "mb-6" }),
                React.createElement("span", { className: "text-[14px] font-black uppercase tracking-[0.5em]" }, "Audit_Vault_Empty")
              )
            : null
        )
      ),
      React.createElement("style", null, `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1100%); }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        /* Custom Ping animation for log click feedback */
        @keyframes ping {
          0% {
            transform: scale(0.2);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `)
    )
  );
};

export default TraumaNode;