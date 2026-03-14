import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import BarcodeScanner from '../components/BarcodeScanner';
import { AppContext } from '../App';
import { parseLicense } from '../services/api';

export default function ScanPage() {
  const navigate = useNavigate();
  const { showToast, handleScanComplete } = useContext(AppContext);

  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  const handleScan = async (barcodeRawText) => {
    setParsing(true);
    setParseError(null);

    try {
      const result = await parseLicense(barcodeRawText);

      if (!result.success || !result.data) {
        throw new Error('Could not parse license data');
      }

      // Complete scan and generate PDF automatically
      handleScanComplete(result.data);
      
      // Generate PDF immediately after successful scan
      await generatePDF(result.data);
      
      // Navigate to preview
      navigate('/preview');
    } catch (err) {
      console.error('Parse error:', err);
      const msg = err.message || 'Failed to parse barcode';
      setParseError(msg);
      showToast('error', 'Parse Failed', msg);
      setParsing(false);
    }
  };

  // Auto-generate PDF function
  const generatePDF = async (scanData) => {
    try {
      // Format DOB to DD-MMM-YYYY
      const formatDOB = (dob) => {
        if (!dob) return '';
        try {
          const date = new Date(dob);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const day = String(date.getDate()).padStart(2, '0');
          const month = months[date.getMonth()];
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        } catch {
          return dob; // Return original if parsing fails
        }
      };

      const response = await fetch('/api/print/pdf-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labelData: {
            patientName: `${scanData.firstName} ${scanData.lastName}`,
            dob: formatDOB(scanData.dateOfBirth || scanData.dob),
            sampleId: scanData.sampleId || `AUTO-${Date.now()}`,
            collectionTime: new Date().toISOString()
          },
          format: 'small'
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);
        
        // Open PDF in new tab for immediate printing
        window.open(pdfUrl, '_blank');
        
        showToast('success', 'PDF Ready', 'Label PDF opened for printing');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      // Don't show error to user, just continue to preview
    }
  };

  const handleError = (err) => {
    console.error('Scanner error:', err);
    showToast('warn', 'Camera Error', err.message);
  };

  const handleCancel = () => {
    navigate('/');
  };

  // Manual entry fallback
  const handleManualEntry = () => {
    navigate('/confirm', { state: { manual: true } });
  };

  if (parsing) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100dvh - 60px)',
        gap: '1rem',
        background: '#f5f7fa'
      }}>
        <ProgressSpinner style={{ width: '64px', height: '64px' }} />
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--lab-primary)' }}>
          Reading license data…
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--lab-text-muted)' }}>
          Parsing AAMVA barcode fields
        </div>
      </div>
    );
  }

  if (parseError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100dvh - 60px)',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <i className="pi pi-exclamation-circle" style={{ fontSize: '3rem', color: '#ef5350' }} />
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Scan Failed</div>
        <div style={{ fontSize: '0.87rem', color: 'var(--lab-text-muted)', maxWidth: 280 }}>
          {parseError}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            label="Try Again"
            icon="pi pi-refresh"
            onClick={() => { setParseError(null); }}
          />
          <Button
            label="Manual Entry"
            icon="pi pi-pencil"
            className="p-button-outlined"
            onClick={handleManualEntry}
          />
          <Button
            label="Cancel"
            icon="pi pi-times"
            className="p-button-text"
            onClick={handleCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="lab-page-full">
      <BarcodeScanner
        onScan={handleScan}
        onError={handleError}
        onCancel={handleCancel}
      />

      {/* Manual entry floating button */}
      <div style={{
        position: 'fixed',
        top: '70px',
        right: '12px',
        zIndex: 100,
      }}>
        <Button
          label="Manual Entry"
          icon="pi pi-pencil"
          className="p-button-sm p-button-outlined"
          style={{
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            borderColor: 'rgba(255,255,255,0.5)',
            fontSize: '0.78rem'
          }}
          onClick={handleManualEntry}
        />
      </div>
    </div>
  );
}
