
import { HarvesterData } from '../context/HarvesterContext';

/**
 * HarvesterService
 * 
 * Simulates the "Harvester" logic for pulling data from public portals (NSTA, NDR, OPRED)
 * and performing forensic physics validation.
 */

export interface PublicWellData {
  uwi: string;
  wellName: string;
  operator: string;
  field: string;
  status: string;
  reportedLat: number;
  reportedLon: number;
  reportedProd: number;
  lastUpdate: string;
}

export const HarvesterService = {
  /**
   * Simulates pulling a "Firehose" of data from NSTA ArcGIS
   */
  async harvestNSTAData(): Promise<PublicWellData[]> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    return [
      {
        uwi: '30/06a-S1',
        wellName: 'Stella-001',
        operator: 'Ithaca Energy',
        field: 'Stella',
        status: 'PRODUCING',
        reportedLat: 56.582,
        reportedLon: 2.145,
        reportedProd: 12450,
        lastUpdate: new Date().toISOString()
      },
      {
        uwi: '49/12a-V1',
        wellName: 'Viking-V1',
        operator: 'Harbour Energy',
        field: 'Viking',
        status: 'PRODUCING',
        reportedLat: 53.412,
        reportedLon: 2.345,
        reportedProd: 8900,
        lastUpdate: new Date().toISOString()
      },
      {
        uwi: '21/25-G1',
        wellName: 'Gannet-A',
        operator: 'Shell',
        field: 'Gannet',
        status: 'PRODUCING',
        reportedLat: 57.182,
        reportedLon: 0.945,
        reportedProd: 15600,
        lastUpdate: new Date().toISOString()
      }
    ];
  },

  /**
   * Performs forensic physics validation on public data
   * (Simulates the "Harvester" cleaning and interpretation)
   */
  validateForensically(publicData: PublicWellData): Partial<HarvesterData> {
    // Physics-anchored audit logic (simulated)
    // We introduce "Forensic Truth" which might differ from "Public Report"
    
    const driftLat = (Math.random() - 0.5) * 0.01;
    const driftLon = (Math.random() - 0.5) * 0.01;
    const prodVariance = 1 - (Math.random() * 0.15); // Usually over-reported by 0-15%
    
    const actualLat = publicData.reportedLat + driftLat;
    const actualLon = publicData.reportedLon + driftLon;
    const auditedProd = publicData.reportedProd * prodVariance;
    
    const isConflict = Math.abs(prodVariance - 1) > 0.05 || Math.abs(driftLat) > 0.005;

    return {
      uwi: publicData.uwi,
      source: 'NSTA_HARVESTER_V2.5',
      timestamp: new Date().toISOString(),
      payload: {
        wellName: publicData.wellName,
        field: publicData.field,
        reportedProd: publicData.reportedProd,
        auditedProd: auditedProd,
        reportedLat: publicData.reportedLat,
        reportedLon: publicData.reportedLon,
        actualLat: actualLat,
        actualLon: actualLon,
        conflicts: isConflict ? ['PRODUCTION_MISMATCH', 'GEOLOCATION_DRIFT'] : [],
        truthLevel: isConflict ? 'CRITICAL_DISCORDANCE' : 'NOMINAL_VARIANCE',
        provenance: 'Source: NSTA ArcGIS / Validated: WellTegra Physics Engine v1.2'
      }
    };
  }
};
