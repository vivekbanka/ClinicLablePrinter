/**
 * PrinterSelectDialog Component
 * Shows a dialog for selecting print method:
 * 1. Browser print dialog (uses OS WiFi printers)
 * 2. Direct IPP printing (enter printer IP)
 * 3. ZPL for Zebra thermal printers
 */

import React, { useState, useContext, useRef } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { RadioButton } from 'primereact/radiobutton';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { AppContext } from '../App';
import { testPrinter } from '../services/api';

export default function PrinterSelectDialog({ visible, onHide, onPrint, labelData, loading }) {
  const { printerSettings, savePrinterSettings, showToast } = useContext(AppContext);

  const [printMethod, setPrintMethod] = useState(printerSettings.printerType || 'browser');
  const [printerUrl, setPrinterUrl] = useState(printerSettings.printerUrl || '');
  const [copies, setCopies] = useState(printerSettings.copies || 1);
  const [testing, setTesting] = useState(false);
  const [printerStatus, setPrinterStatus] = useState(null); // null | 'ok' | 'error'

  const handlePrint = () => {
    // Save settings
    savePrinterSettings({
      printerUrl,
      printerType: printMethod,
      copies,
    });

    onPrint({ method: printMethod, printerUrl, copies });
  };

  const handleTestConnection = async () => {
    if (!printerUrl) {
      showToast('warn', 'Enter Printer URL', 'Please enter a printer URL first');
      return;
    }
    setTesting(true);
    setPrinterStatus(null);
    try {
      const result = await testPrinter(printerUrl);
      if (result.connected) {
        setPrinterStatus('ok');
        showToast('success', 'Printer Found!', result.printer?.name || 'Printer is reachable');
      } else {
        setPrinterStatus('error');
        showToast('error', 'Printer Unreachable', result.error || 'Cannot connect to printer');
      }
    } catch (err) {
      setPrinterStatus('error');
      showToast('error', 'Connection Failed', err.message);
    } finally {
      setTesting(false);
    }
  };

  const dialogFooter = (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={onHide} disabled={loading} />
      <Button
        label={loading ? 'Printing…' : `Print ${copies > 1 ? `(${copies} copies)` : ''}`}
        icon={loading ? undefined : 'pi pi-print'}
        iconPos="left"
        loading={loading}
        onClick={handlePrint}
        disabled={loading || (printMethod !== 'browser' && !printerUrl)}
        className="p-button-primary"
        style={{ minWidth: 120 }}
      />
    </div>
  );

  return (
    <Dialog
      header="🖨️ Print Label"
      visible={visible}
      onHide={onHide}
      footer={dialogFooter}
      style={{ width: '95vw', maxWidth: '440px' }}
      draggable={false}
      modal
      blockScroll
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.25rem' }}>

        {/* Label Summary */}
        {labelData && (
          <div style={{
            background: '#e8eaf6',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem'
          }}>
            <div style={{ fontWeight: 700 }}>{labelData.patientName}</div>
            <div style={{ color: '#555', marginTop: '2px' }}>
              Sample: <strong>{labelData.sampleId}</strong> &nbsp;•&nbsp; DOB: {labelData.dob}
            </div>
          </div>
        )}

        {/* Print Method Selection */}
        <div>
          <div className="section-header">Print Method</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>

            {/* Browser Print Dialog */}
            <PrintMethodOption
              value="browser"
              current={printMethod}
              onChange={setPrintMethod}
              icon="pi-desktop"
              label="Browser Print Dialog"
              desc="Opens your OS printer picker — shows all WiFi printers"
              recommended
            />

            {/* Direct IPP */}
            <PrintMethodOption
              value="ipp"
              current={printMethod}
              onChange={setPrintMethod}
              icon="pi-wifi"
              label="Direct WiFi / IPP Printer"
              desc="Send directly to printer via IP address"
            />

            {/* ZPL Zebra */}
            <PrintMethodOption
              value="zpl"
              current={printMethod}
              onChange={setPrintMethod}
              icon="pi-tag"
              label="Zebra Thermal (ZPL)"
              desc="Direct socket to Zebra label printer (port 9100)"
            />
          </div>
        </div>

        {/* Printer URL / IP (for IPP and ZPL) */}
        {(printMethod === 'ipp' || printMethod === 'zpl') && (
          <div>
            <div className="section-header">
              {printMethod === 'ipp' ? 'Printer URL' : 'Printer IP Address'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <InputText
                value={printerUrl}
                onChange={e => { setPrinterUrl(e.target.value); setPrinterStatus(null); }}
                placeholder={
                  printMethod === 'ipp'
                    ? 'http://192.168.1.100:631/ipp/print'
                    : '192.168.1.100'
                }
                style={{ flex: 1, fontSize: '0.85rem' }}
              />
              <Button
                icon={testing ? undefined : 'pi pi-check-circle'}
                loading={testing}
                onClick={handleTestConnection}
                className="p-button-outlined p-button-sm"
                tooltip="Test connection"
                disabled={!printerUrl || testing}
                aria-label="Test printer"
              />
            </div>

            {printerStatus && (
              <div style={{ marginTop: '0.4rem' }}>
                <Tag
                  severity={printerStatus === 'ok' ? 'success' : 'danger'}
                  value={printerStatus === 'ok' ? '✓ Printer reachable' : '✗ Cannot reach printer'}
                />
              </div>
            )}

            {printMethod === 'ipp' && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.76rem', color: '#666' }}>
                Common paths: <code>/ipp/print</code>, <code>/ipp</code>, <code>/IPP</code>
              </div>
            )}
          </div>
        )}

        {/* Copies */}
        <div>
          <div className="section-header">Copies</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button
              icon="pi pi-minus"
              className="p-button-outlined p-button-sm"
              onClick={() => setCopies(c => Math.max(1, c - 1))}
              disabled={copies <= 1}
              aria-label="Decrease copies"
            />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: '2rem', textAlign: 'center' }}>
              {copies}
            </span>
            <Button
              icon="pi pi-plus"
              className="p-button-outlined p-button-sm"
              onClick={() => setCopies(c => Math.min(10, c + 1))}
              disabled={copies >= 10}
              aria-label="Increase copies"
            />
          </div>
        </div>

        {/* Browser print note */}
        {printMethod === 'browser' && (
          <div style={{
            background: '#e3f2fd',
            borderRadius: '8px',
            padding: '0.75rem',
            fontSize: '0.8rem',
            color: '#1565c0',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-start'
          }}>
            <i className="pi pi-info-circle" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>
              Your OS print dialog will open. Set the paper size to <strong>2" × 1"</strong> (or "Custom") and select your WiFi printer from the list.
            </span>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function PrintMethodOption({ value, current, onChange, icon, label, desc, recommended }) {
  const selected = current === value;
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem',
        borderRadius: '8px',
        border: `2px solid ${selected ? '#1a237e' : '#e2e8f0'}`,
        background: selected ? '#e8eaf6' : 'white',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <RadioButton
        value={value}
        name="printMethod"
        onChange={() => onChange(value)}
        checked={selected}
      />
      <i className={`pi ${icon}`} style={{ color: selected ? '#1a237e' : '#666', fontSize: '1.1rem' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {label}
          {recommended && <Tag value="Recommended" severity="info" style={{ fontSize: '0.65rem', padding: '1px 6px' }} />}
        </div>
        <div style={{ fontSize: '0.76rem', color: '#666', marginTop: '1px' }}>{desc}</div>
      </div>
    </label>
  );
}
