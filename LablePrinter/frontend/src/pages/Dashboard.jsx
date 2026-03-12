import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { AppContext } from '../App';
import { useRecentScans } from '../hooks/useRecentScans';

export default function Dashboard() {
  const navigate = useNavigate();
  const { printerSettings } = useContext(AppContext);
  const { recentScans, clearScans } = useRecentScans();

  const printerConfigured = !!printerSettings?.printerUrl || printerSettings?.printerType === 'browser';

  return (
    <div className="lab-page fade-in">

      {/* Welcome header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--lab-primary)', marginBottom: '0.25rem' }}>
          Lab Label Printer
        </h1>
        <p style={{ fontSize: '0.87rem', color: 'var(--lab-text-muted)' }}>
          Scan a driver's license to generate a blood vial label
        </p>
      </div>

      {/* Main Scan Button */}
      <button className="scan-hero-btn" onClick={() => navigate('/scan')}>
        <span className="scan-icon">📋</span>
        <span className="scan-label">Scan Driver's License</span>
        <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 400 }}>
          Point camera at back of license
        </span>
      </button>

      {/* Quick status pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <StatusPill
          icon={printerConfigured ? 'pi-check-circle' : 'pi-exclamation-circle'}
          label={printerConfigured ? 'Printer Ready' : 'No Printer Configured'}
          color={printerConfigured ? 'var(--lab-success)' : 'var(--lab-warning)'}
          onClick={() => navigate('/settings')}
        />
        <StatusPill
          icon="pi-history"
          label={`${recentScans.length} Recent Scan${recentScans.length !== 1 ? 's' : ''}`}
          color="var(--lab-primary)"
        />
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="lab-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div className="section-header" style={{ margin: 0 }}>Recent Scans</div>
            <Button
              label="Clear"
              icon="pi pi-trash"
              className="p-button-text p-button-plain p-button-sm"
              style={{ color: 'var(--lab-text-muted)', padding: '0.2rem 0.5rem', fontSize: '0.78rem' }}
              onClick={clearScans}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentScans.map(scan => (
              <RecentScanItem key={scan.id} scan={scan} />
            ))}
          </div>
        </div>
      )}

      {recentScans.length === 0 && (
        <div className="lab-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--lab-text-muted)' }}>
          <i className="pi pi-inbox" style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '0.75rem', display: 'block' }} />
          <div style={{ fontWeight: 600 }}>No scans yet</div>
          <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
            Scan a driver's license to get started
          </div>
        </div>
      )}

      {/* Help card */}
      <div className="lab-card" style={{ marginTop: '1rem', background: '#e8eaf6', border: 'none' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--lab-primary)' }}>
          How to use
        </div>
        <ol style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--lab-text-muted)', lineHeight: 1.7 }}>
          <li>Tap <strong>Scan Driver's License</strong></li>
          <li>Point the camera at the <strong>back</strong> of the license</li>
          <li>Confirm patient details</li>
          <li>Print the blood vial label</li>
        </ol>
      </div>
    </div>
  );
}

function RecentScanItem({ scan }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    // Navigate to label preview with the scan data
    // We need to reconstruct the patient data from the scan
    const patientData = {
      firstName: scan.displayName.split(' ')[0] || '',
      lastName: scan.displayName.split(' ')[1] || '',
      fullName: scan.displayName,
      dateOfBirth: scan.dob,
      // Add current collection time since we don't store it in recent scans
      collectionTime: new Date().toISOString(),
    };
    
    // Set the patient data in context and navigate to label
    navigate('/label', { state: { patientData } });
  };

  return (
    <div className="recent-scan-item" onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="recent-scan-avatar">{scan.initials}</div>
      <div className="recent-scan-info">
        <div className="recent-scan-name">{scan.displayName}</div>
        <div className="recent-scan-meta">
          DOB: {scan.dob} &nbsp;•&nbsp; {formatRelativeTime(scan.scannedAt)}
        </div>
      </div>
      <i className="pi pi-chevron-right" style={{ color: '#ccc', fontSize: '0.8rem' }} />
    </div>
  );
}

function StatusPill({ icon, label, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        background: 'white',
        border: `1.5px solid ${color}20`,
        borderRadius: '20px',
        padding: '0.3rem 0.7rem',
        fontSize: '0.78rem',
        fontWeight: 600,
        color,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <i className={`pi ${icon}`} style={{ fontSize: '0.75rem' }} />
      {label}
    </div>
  );
}

function formatRelativeTime(isoStr) {
  try {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(isoStr).toLocaleDateString();
  } catch {
    return '';
  }
}
