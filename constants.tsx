
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
export const MOCK_TRAUMA_DATA: TraumaData[] = [];

// Mock Pressure Data for Sawtooth Pulse
export const MOCK_PRESSURE_DATA: PressureData[] = [];

export const MOCK_WELLS: ForensicWell[] = [];
