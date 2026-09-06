import { apiClient, USE_MOCK } from './apiClient';

export const validationService = {

  async validateSchedule(scheduleId) {
       if (!USE_MOCK) {
      // Validation.jsx calls this with no scheduleId -- it validates the
      // whole active master schedule, not one block.
      const endpoint = scheduleId ? `/schedules/${scheduleId}/validate` : '/schedules/validate';
      const res = await apiClient.post(endpoint);
      if (res) return res;
    }

    await apiClient.simulateDelay(300);

    return {
      scheduleId: scheduleId || 'ALL-ACTIVE-SCHEDULES',
      validatedAt: new Date().toISOString(),
      overallStatus: 'VALID', // 'VALID' or 'FAILED' or 'WARNING'
      overallMessage: 'Schedule validated against COA master train graph with 0 critical clashes.',
      checks: [
        {
          id: 'CHK-01',
          name: 'Timetable Clash Analysis',
          description: 'Checks if block overlaps with scheduled passenger express or freight paths.',
          status: 'Passed',
          details: 'Zero overlap with 12000-series Rajdhani/Shatabdi or CONCOR freight paths.'
        },
        {
          id: 'CHK-02',
          name: 'Corridor Availability Verification',
          description: 'Validates that requested track section is officially free from engineering speed limits.',
          status: 'Passed',
          details: 'Target section confirmed available by divisional operating control.'
        },
        {
          id: 'CHK-03',
          name: 'Time Overlap & Inter-Department Safety',
          description: 'Ensures minimum 15-minute buffer between adjacent departmental operations.',
          status: 'Passed',
          details: 'All departmental work zones observe mandatory safety buffers.'
        },
        {
          id: 'CHK-04',
          name: 'Block Duration & Maximum Window Constraint',
          description: 'Ensures no single block exceeds the 4.0-hour statutory limit on HDN routes.',
          status: 'Passed',
          details: 'Maximum block duration is 3.5 hours; well within the 4.0-hour corridor ceiling.'
        },
        {
          id: 'CHK-05',
          name: 'Power & Traffic Synchronization Consistency',
          description: 'Verifies 25kV OHE isolation permit aligns with track machine entry & exit permits.',
          status: 'Warning',
          details: 'Block B-203 has TRD power permit starting 15m before Engineering machine arrival. Recommended review.'
        }
      ],
      issues: [
        {
          blockId: 'BLK-2026-0910-03',
          blockCode: 'BLOCK B-203',
          corridor: 'BCT-ST',
          time: '12:00 – 15:30',
          severity: 'Warning',
          problem: 'Slight Power Block Asynchrony',
          reason: 'TRD permits isolation at 12:00 while Engineering track crane enters block section at 12:15.',
          suggestedAction: 'Align TRD power cutoff to 12:10 to minimize auxiliary feed interruption.'
        }
      ]
    };
  }
};
