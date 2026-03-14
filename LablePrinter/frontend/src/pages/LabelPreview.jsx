import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { AppContext } from '../App';
import LabelTemplate from '../components/LabelTemplate';
import PrinterSelectDialog from '../components/PrinterSelectDialog';
import { sendPrintJob, generateLabelPDF } from '../services/api';
import { useRecentScans } from '../hooks/useRecentScans';

// Date formatting function
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function LabelPreview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientData, printerSettings, showToast, handleConfirm } = useContext(AppContext);
  const { addScan } = useRecentScans();

  const [printDialogVisible, setPrintDialogVisible] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [reprintCount, setReprintCount] = useState(0);
  const printFrameRef = useRef(null);

  // Handle patient data from recent scans navigation
  useEffect(() => {
    if (location.state?.patientData && !patientData) {
      handleConfirm(location.state.patientData);
    }
  }, [location.state?.patientData, patientData, handleConfirm]);

  // Build label data from patient
  const labelData = patientData ? {
    patientName: patientData.fullName || `${patientData.firstName} ${patientData.lastName}`,
    dob: patientData.dateOfBirth || '',
    collectionTime: patientData.collectionTime || new Date().toISOString(),
  } : null;

  // Add to recent scans once
  useEffect(() => {
    if (patientData && labelData) {
      addScan(patientData);
    }
  }, []); // eslint-disable-line

  if (!patientData || !labelData) {
    return (
      <div className="lab-page" style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <i className="pi pi-inbox" style={{ fontSize: '3rem', opacity: 0.3 }} />
        <p style={{ marginTop: '1rem', color: 'var(--lab-text-muted)' }}>
          No patient data. Please scan a license first.
        </p>
        <Button label="Go to Dashboard" icon="pi pi-home" className="p-button-outlined" style={{ marginTop: '1rem' }} onClick={() => navigate('/')} />
      </div>
    );
  }

  // ── Print via Browser (window.print) ───────────────────────────────────────
  const printViaBrowser = async () => {
    setPrinting(true);
    try {
      // Create a print-friendly version of the small label
      const printContent = document.createElement('div');
      printContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif;">
          <div style="width: 245px; height: 48px; background: white; border: 1px solid #000; display: flex; flex-direction: column; page-break-after: always;">
            <div style="flex: 1; padding: 8px 3px; display: flex; flex-direction: column; justify-content: center; text-align: center;">
              <div style="font-size: 12px; font-weight: 900; letter-spacing: 0.01em; line-height: 1.1; color: #000; word-break: break-word; margin-bottom: 4px;">
                ${(labelData.patientName || 'PATIENT NAME').toUpperCase()}
              </div>
              <div style="font-size: 9px; color: #333; font-weight: 600;">
                DOB: ${formatDate(labelData.dob)}
              </div>
            </div>
          </div>
        </div>
      `;

      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Blood Label - ${labelData.patientName || 'Patient'}</title>
            <style>
              @page { margin: 0; size: auto; }
              body { margin: 0; padding: 20px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        
        // Wait for content to load, then show print dialog
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 300);
        });
      } else {
        // Fallback: print current window with just the label
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
      }

      setPrintSuccess(true);
      setReprintCount(c => c + 1);
      showToast('success', 'Print Dialog Opened', 'Select your printer and set paper to 0.66" × 3.4" (Brother DK-1203)');
    } catch (err) {
      showToast('error', 'Print Failed', err.message);
    } finally {
      setPrinting(false);
    }
  };

  // Inline iframe fallback
  const printLabelInline = (url) => {
    const iframe = printFrameRef.current;
    if (!iframe) return;
    iframe.src = url;
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => { URL.revokeObjectURL(url); }, 1000);
    };
  };

  // ── Print via IPP / ZPL ────────────────────────────────────────────────────
  const printViaIPP = async (settings) => {
    setPrinting(true);
    try {
      const result = await sendPrintJob(
        settings.printerUrl,
        labelData,
        { format: 'small', copies: settings.copies }
      );

      if (result.success) {
        setPrintSuccess(true);
        setReprintCount(c => c + 1);
        showToast('success', 'Label Sent!', `Print job sent to printer${result.jobId ? ` (Job #${result.jobId})` : ''}`);
      } else {
        showToast('warn', 'Print Warning', result.message || 'Printer returned a non-success status');
      }
    } catch (err) {
      showToast('error', 'Print Failed', err.message);
    } finally {
      setPrinting(false);
      setPrintDialogVisible(false);
    }
  };

  // ── Handle Print Dialog Submit ─────────────────────────────────────────────
  const handlePrintSubmit = async (settings) => {
    if (settings.method === 'browser') {
      setPrintDialogVisible(false);
      await printViaBrowser();
    } else {
      await printViaIPP(settings);
    }
  };

  return (
    <div className="lab-page fade-in">

      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--lab-primary)', marginBottom: '0.25rem' }}>
          Label Preview
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--lab-text-muted)' }}>
          Review the label before printing
        </p>
      </div>

      {/* Status badge */}
      {printSuccess && (
        <div style={{
          background: '#e8f5e9',
          border: '1px solid #a5d6a7',
          borderRadius: '8px',
          padding: '0.6rem 0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          color: 'var(--lab-success)'
        }}>
          <i className="pi pi-check-circle" />
          <span>
            <strong>Label printed</strong>
            {reprintCount > 1 ? ` (${reprintCount}× total)` : ''}
          </span>
        </div>
      )}

      {/* Label Preview */}
      <div className="label-preview-wrapper">
        <LabelTemplate labelData={labelData} scale={1} isSmall={true} />
      </div>

      {/* Patient summary */}
      <div className="lab-card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--lab-primary)', marginBottom: '0.6rem' }}>
          Patient Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 1rem' }}>
          <SummaryField label="Patient" value={labelData.patientName} />
          <SummaryField label="DOB" value={labelData.dob} />
        </div>
      </div>

      {/* Print Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <Button
          label="Print Label"
          icon="pi pi-print"
          style={{
            width: '100%',
            padding: '0.9rem',
            fontSize: '1rem',
            fontWeight: 700,
            background: 'var(--lab-primary)',
            borderColor: 'var(--lab-primary)',
          }}
          loading={printing}
          onClick={() => setPrintDialogVisible(true)}
        />

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button
            label="Edit Patient"
            icon="pi pi-pencil"
            className="p-button-outlined"
            style={{ flex: 1 }}
            onClick={() => navigate('/confirm')}
            disabled={printing}
          />
          <Button
            label="New Scan"
            icon="pi pi-qrcode"
            className="p-button-outlined p-button-success"
            style={{ flex: 1 }}
            onClick={() => navigate('/scan')}
            disabled={printing}
          />
        </div>
      </div>

      {/* Print dialog */}
      <PrinterSelectDialog
        visible={printDialogVisible}
        onHide={() => setPrintDialogVisible(false)}
        onPrint={handlePrintSubmit}
        labelData={labelData}
        loading={printing}
      />

      {/* Hidden iframe for fallback printing */}
      <iframe
        ref={printFrameRef}
        style={{ display: 'none', width: 0, height: 0, border: 'none' }}
        title="print-frame"
        aria-hidden="true"
      />
    </div>
  );
}

function SummaryField({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.87rem', fontWeight: 600, fontFamily: mono ? 'monospace' : undefined, color: 'var(--lab-text)', wordBreak: 'break-all' }}>
        {value || '—'}
      </div>
    </div>
  );
}
