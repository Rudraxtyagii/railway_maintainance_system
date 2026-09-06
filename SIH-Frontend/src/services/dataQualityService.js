import { apiClient, USE_MOCK } from './apiClient';
import { MOCK_DATA_QUALITY } from '../data/mockData';

export const dataQualityService = {
  async getDataQuality() {
    if (!USE_MOCK) {
      const res = await apiClient.get('/data-quality/metrics');
      if (res) return res;
    }
    await apiClient.simulateDelay(200);
    return MOCK_DATA_QUALITY;
  },

  async parseUnstructuredDefect(rawText) {
    if (!USE_MOCK) {
      const res = await apiClient.post('/data-quality/parse', { text: rawText });
      if (res) return res;
    }

    await apiClient.simulateDelay(400);
    const text = rawText.toLowerCase();

    let department = 'Engineering';
    let defectType = 'General Track Maintenance';
    let severity = 'Medium';
    let location = 'Station Yard Track Section';

    if (text.includes('mast') || text.includes('ohe') || text.includes('wire') || text.includes('cantilever') || text.includes('pantograph') || text.includes('power')) {
      department = 'Traction Distribution';
      defectType = 'OHE Wear & Contact Wire Droppers';
    } else if (text.includes('signal') || text.includes('point') || text.includes('interlocking') || text.includes('circuit') || text.includes('axle')) {
      department = 'Signal & Telecom';
      defectType = 'Point Machine / Signaling Disconnection';
    } else if (text.includes('rail') || text.includes('ballast') || text.includes('tamping') || text.includes('sleeper') || text.includes('track') || text.includes('weld')) {
      department = 'Engineering';
      defectType = 'Track Geometry / Ballast Deficiency';
    }

    if (text.includes('urgent') || text.includes('critical') || text.includes('flaw') || text.includes('sparking') || text.includes('failure')) {
      severity = 'Critical';
    } else if (text.includes('replace') || text.includes('gap') || text.includes('overhaul') || text.includes('high')) {
      severity = 'High';
    }

    // Attempt to extract Km marks
    const kmMatch = rawText.match(/km\s*\d+(\/\d+)?(-\d+(\/\d+)?)?/i);
    if (kmMatch) {
      location = kmMatch[0].toUpperCase();
    }

    return {
      defectType,
      location,
      severity,
      department,
      confidenceScore: '93%',
      parsingStatus: 'AI Parsed (Client Simulation)',
      duplicateStatus: 'Unique'
    };
  }
};
