
import { LogEntry, TraumaData, PressureData, NDRProject, TubingItem, WellReport, BarrierEvent, MissionConfig, ForensicWell } from './types';

// Global Mission Hub Data (WETE Forensic Modernization)
export const GHOST_HUNTER_MISSION: MissionConfig = {
  "MISSION_ID": "WETE_FORENSIC_MODERNIZATION",
  "STATUS": "ACTIVE",
  "TIMESTAMP": new Date().toISOString(),
  "OPERATOR": "BRAHAN_CORE_v.92",
  "TARGETS": []
};

// Mock Log Data for Ghost-Sync
export const MOCK_BASE_LOG: LogEntry[] = [];
export const MOCK_GHOST_LOG: LogEntry[] = [];

// Mock Historical Barrier Records
export const MOCK_HISTORICAL_BARRIER_LOGS: BarrierEvent[] = [];
export const MOCK_SCAVENGED_PRESSURE_TESTS: PressureData[] = [];

// Mock Tubing Tally
export const MOCK_TUBING_TALLY: TubingItem[] = [];
export const MOCK_INTERVENTION_REPORTS: WellReport[] = [];

// Mock NDR Projects
export const MOCK_NDR_PROJECTS: NDRProject[] = [];

// Mock Trauma Data for 3D Node
export const MOCK_TRAUMA_DATA: TraumaData[] = Array.from({ length: 80 }).flatMap((_, dIdx) => {
  const depth = 2000 + dIdx * 0.5;
  return Array.from({ length: 24 }).map((_, fIdx) => {
    const fingerId = fIdx + 1;
    // Base values with some noise and specific anomalies
    const baseDev = 0.5 + Math.random() * 0.2;
    const baseCorr = 5 + Math.random() * 5;
    const baseStress = 15 + Math.random() * 10;
    
    // Add an anomaly at depth 2015
    const isAnomaly = Math.abs(depth - 2015) < 1.5;
    const anomalyFactor = isAnomaly ? 35 : 0;
    
    // Add another anomaly at depth 2030
    const isAnomaly2 = Math.abs(depth - 2030) < 1.0;
    const anomalyFactor2 = isAnomaly2 ? 55 : 0;
    
    return {
      fingerId,
      depth,
      deviation: baseDev + (isAnomaly ? Math.random() * 2 : 0),
      corrosion: baseCorr + anomalyFactor + anomalyFactor2 + Math.random() * 5,
      temperature: 65 + dIdx * 0.1 + (isAnomaly ? 10 : 0),
      wallLoss: 2 + (isAnomaly ? 5 : 0),
      waterLeakage: 1 + (isAnomaly ? 12 : 0),
      stress: baseStress + anomalyFactor * 1.5 + anomalyFactor2 * 2,
      ici: 10 + Math.random() * 5,
      metalLoss: 1 + (isAnomaly ? 4 : 0),
      ovality: 2 + (isAnomaly ? 3 : 0),
      uvIndex: 2 + Math.random()
    };
  });
});

// Mock Pressure Data for Sawtooth Pulse
export const MOCK_PRESSURE_DATA: PressureData[] = [];

export const MOCK_WELLS: ForensicWell[] = [
  {
    id: 'GB-ST-01',
    reportedLat: 57.1234,
    reportedLon: 1.2345,
    actualLat: 57.1236,
    actualLon: 1.2348,
    reportedProd: 12500,
    auditedProd: 11200,
    status: 'critical',
    field: 'Stella',
    deviationAudit: 'SHIFT_DETECTED @ 1245.5m',
    lastAudit: '2024-05-20',
    forensicNote: 'Significant pressure discrepancy in A-Annulus suggests possible casing breach.',
    casingStrings: [
      { id: 'CS-01', name: 'Conductor', top: 0, bottom: 150, od: 30, weight: '310 lb/ft', grade: 'X-52', status: 'NOMINAL' },
      { id: 'CS-02', name: 'Surface Casing', top: 0, bottom: 850, od: 20, weight: '133 lb/ft', grade: 'K-55', status: 'NOMINAL' },
      { id: 'CS-03', name: 'Intermediate Casing', top: 0, bottom: 2200, od: 13.375, weight: '72 lb/ft', grade: 'L-80', status: 'WARNING' },
      { id: 'CS-04', name: 'Production Casing', top: 0, bottom: 3500, od: 9.625, weight: '47 lb/ft', grade: 'P-110', status: 'CRITICAL' },
    ],
    casingIssues: [
      {
        id: 'CI-01',
        depth: 2150,
        type: 'CORROSION',
        severity: 'WARNING',
        description: 'Localized wall thinning detected in intermediate casing string.',
        value: 15,
        unit: '%',
        timestamp: '2024-05-15',
        provenance: 'WETE_SCANNER_v2',
        physicsValidation: 'MASS_BALANCE_VERIFIED',
        truthLevel: 'FORENSIC'
      },
      {
        id: 'CI-02',
        depth: 3200,
        type: 'ANNULUS_LEAK',
        severity: 'CRITICAL',
        description: 'Pressure buildup in B-Annulus indicates potential breach in production casing.',
        value: 450,
        unit: 'psi',
        timestamp: '2024-05-18',
        provenance: 'CERBERUS_SIM',
        physicsValidation: 'THERMODYNAMIC_MATCH',
        truthLevel: 'FORENSIC'
      }
    ]
  }
];
