import { useState, useCallback } from 'react';

const STORAGE_KEY = 'lab_recent_scans';
const MAX_RECENT = 10;

/**
 * Hook for managing recent patient scans in localStorage
 * Stores only non-sensitive data for display
 */
export function useRecentScans() {
  const [recentScans, setRecentScans] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addScan = useCallback((patientData) => {
    const scan = {
      id: `scan-${Date.now()}`,
      // Store only non-PII display info
      displayName: `${patientData.firstName} ${patientData.lastName}`,
      initials: `${(patientData.firstName || '?')[0]}${(patientData.lastName || '?')[0]}`.toUpperCase(),
      dob: patientData.dateOfBirth || '',
      scannedAt: new Date().toISOString(),
      state: patientData.addressComponents?.state || '',
    };

    setRecentScans(prev => {
      const updated = [scan, ...prev.filter(s => s.id !== scan.id)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage full - clear old entries
        localStorage.removeItem(STORAGE_KEY);
      }
      return updated;
    });

    return scan;
  }, []);

  const clearScans = useCallback(() => {
    setRecentScans([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeScan = useCallback((id) => {
    setRecentScans(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { recentScans, addScan, clearScans, removeScan };
}
