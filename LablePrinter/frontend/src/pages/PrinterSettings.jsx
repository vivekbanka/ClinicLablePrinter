import React, { useContext, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { RadioButton } from 'primereact/radiobutton';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { AppContext } from '../App';
import { testPrinter, discoverPrinters } from '../services/api';

export default function PrinterSettings() {
  const { printerSettings, savePrinterSettings, showToast } = useContext(AppContext);

  const [printerType, setPrinterType] = useState(printerSettings.printerType || 'browser');
  const [printerUrl, setPrinterUrl] = useState(printerSettings.printerUrl || '');
  const [copies, setCopies] = useState(printerSettings.copies || 1);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoveryInfo, setDiscoveryInfo] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    savePrinterSettings({ printerType, printerUrl, copies });
    setSaved(true);
    showToast('success', 'Settings Saved', 'Printer settings have been updated');
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    if (!printerUrl) {
      showToast('warn', 'Enter URL', 'Please enter a printer URL first');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testPrinter(printerUrl);
      setTestResult(result);
      if (result.connected) {
        showToast('success', 'Printer Online!', result.printer?.name || 'Printer is reachable');
      } else {
        showToast('error', 'Unreachable', result.error || 'Cannot connect to printer');
      }
    } catch (err) {
      setTestResult({ connected: false, error: err.message });
      showToast('error', 'Test Failed', err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const info = await discoverPrinters();
      setDiscoveryInfo(info);
    } catch (err) {
      showToast('error', 'Discovery Failed', err.message);
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div className="lab-page fade-in">
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--lab-primary)', marginBottom: '0.25rem' }}>
          Printer Settings
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--lab-text-muted)' }}>
          Configure your label printer connection
        </p>
      </div>

      {/* Print Method */}
      <div className="lab-card">
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--lab-primary)', marginBottom: '0.75rem' }}>
          Print Method
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { value: 'browser', icon: 'pi-desktop', label: 'Browser Print Dialog', desc: 'Uses OS printer picker — best for most WiFi printers', badge: 'Recommended' },
            { value: 'ipp', icon: 'pi-wifi', label: 'Direct IPP (WiFi/Network)', desc: 'Send directly via IP address — HP, Canon, Epson, etc.' },
            { value: 'zpl', icon: 'pi-tag', label: 'Zebra Thermal (ZPL)', desc: 'Direct socket on port 9100 — Zebra GK420d, ZD410, etc.' },
          ].map(opt => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `2px solid ${printerType === opt.value ? '#1a237e' : '#e2e8f0'}`,
                background: printerType === opt.value ? '#e8eaf6' : 'white',
                cursor: 'pointer',
              }}
            >
              <RadioButton value={opt.value} name="printerType" onChange={() => setPrinterType(opt.value)} checked={printerType === opt.value} />
              <i className={`pi ${opt.icon}`} style={{ color: printerType === opt.value ? '#1a237e' : '#666' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {opt.label}
                  {opt.badge && <Tag value={opt.badge} severity="info" style={{ fontSize: '0.65rem' }} />}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#666' }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Printer URL */}
      {(printerType === 'ipp' || printerType === 'zpl') && (
        <div className="lab-card">
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--lab-primary)', marginBottom: '0.75rem' }}>
            {printerType === 'ipp' ? 'Printer URL (IPP)' : 'Printer IP Address (ZPL)'}
          </div>

          <div className="field-group">
            <label>{printerType === 'ipp' ? 'Printer URL' : 'IP Address'}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <InputText
                value={printerUrl}
                onChange={e => { setPrinterUrl(e.target.value); setTestResult(null); }}
                placeholder={printerType === 'ipp' ? 'http://192.168.1.100:631/ipp/print' : '192.168.1.100'}
                style={{ flex: 1 }}
              />
              <Button
                icon="pi pi-check-circle"
                className="p-button-outlined"
                loading={testing}
                onClick={handleTest}
                tooltip="Test connection"
                aria-label="Test printer"
              />
            </div>

            {testResult && (
              <div style={{ marginTop: '0.5rem' }}>
                <Tag
                  severity={testResult.connected ? 'success' : 'danger'}
                  value={testResult.connected
                    ? `✓ ${testResult.printer?.name || 'Online'}`
                    : `✗ ${testResult.error || 'Unreachable'}`
                  }
                />
                {testResult.connected && testResult.printer?.model && (
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.3rem' }}>
                    Model: {testResult.printer.model}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Discovery help */}
          <div style={{ marginTop: '0.75rem' }}>
            <Button
              label={discovering ? 'Looking up paths…' : 'Show Common Printer Paths'}
              icon="pi pi-search"
              className="p-button-text p-button-sm"
              loading={discovering}
              onClick={handleDiscover}
              style={{ paddingLeft: 0 }}
            />
            {discoveryInfo && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{discoveryInfo.message}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {discoveryInfo.examples?.map(ex => (
                    <code
                      key={ex}
                      style={{ cursor: 'pointer', color: 'var(--lab-primary)', background: '#e8eaf6', padding: '2px 6px', borderRadius: '4px', display: 'block' }}
                      onClick={() => setPrinterUrl(ex)}
                    >
                      {ex}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copies */}
      <div className="lab-card">
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--lab-primary)', marginBottom: '0.75rem' }}>
          Default Copies
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button icon="pi pi-minus" className="p-button-outlined p-button-sm" onClick={() => setCopies(c => Math.max(1, c - 1))} disabled={copies <= 1} />
          <span style={{ fontWeight: 700, fontSize: '1.2rem', minWidth: '2rem', textAlign: 'center' }}>{copies}</span>
          <Button icon="pi pi-plus" className="p-button-outlined p-button-sm" onClick={() => setCopies(c => Math.min(10, c + 1))} disabled={copies >= 10} />
        </div>
      </div>

      {/* Label info */}
      <div className="lab-card" style={{ background: '#e8eaf6', border: 'none' }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--lab-primary)', marginBottom: '0.4rem' }}>
          Label Specifications
        </div>
        <div style={{ fontSize: '0.82rem', color: '#444', lineHeight: 1.7 }}>
          Size: <strong>2" × 1"</strong> (standard blood vial)<br />
          Format: PDF (browser/IPP) or ZPL (Zebra)<br />
          Barcode: Code 128 (Sample ID)<br />
          DPI: 203 (ZPL) / 72pt PDF
        </div>
      </div>

      {/* Save */}
      <Button
        label={saved ? '✓ Saved!' : 'Save Settings'}
        icon={saved ? 'pi pi-check' : 'pi pi-save'}
        style={{
          width: '100%',
          marginTop: '0.5rem',
          background: saved ? 'var(--lab-success)' : 'var(--lab-primary)',
          borderColor: saved ? 'var(--lab-success)' : 'var(--lab-primary)',
          padding: '0.85rem',
          fontSize: '1rem',
          fontWeight: 700,
        }}
        onClick={handleSave}
      />
    </div>
  );
}
