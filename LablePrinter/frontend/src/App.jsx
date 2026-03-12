import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

// Pages
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import ConfirmPatient from './pages/ConfirmPatient';
import LabelPreview from './pages/LabelPreview';
import PrinterSettings from './pages/PrinterSettings';

// Components
import Navbar from './components/Navbar';

// Context
export const AppContext = React.createContext(null);

function App() {
  const toast = useRef(null);
  const navigate = useNavigate();

  // Global app state
  const [patientData, setPatientData] = useState(null);
  const [labelData, setLabelData] = useState(null);
  const [printerSettings, setPrinterSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('printerSettings')) || {
        printerUrl: '',
        printerName: '',
        printerType: 'browser', // 'browser' | 'ipp' | 'zpl'
        copies: 1
      };
    } catch {
      return { printerUrl: '', printerName: '', printerType: 'browser', copies: 1 };
    }
  });

  const showToast = (severity, summary, detail, life = 3000) => {
    toast.current?.show({ severity, summary, detail, life });
  };

  const savePrinterSettings = (settings) => {
    setPrinterSettings(settings);
    localStorage.setItem('printerSettings', JSON.stringify(settings));
  };

  const handleScanComplete = (scanned) => {
    setPatientData(scanned);
    navigate('/confirm');
  };

  const handleConfirm = (confirmed) => {
    setPatientData(confirmed);
    navigate('/label');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const contextValue = {
    patientData, setPatientData,
    labelData, setLabelData,
    printerSettings, savePrinterSettings,
    showToast,
    handleScanComplete,
    handleConfirm,
    handleBack,
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-root">
        <Toast ref={toast} position="top-right" />
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/confirm" element={<ConfirmPatient />} />
            <Route path="/label" element={<LabelPreview />} />
            <Route path="/settings" element={<PrinterSettings />} />
          </Routes>
        </main>
      </div>
    </AppContext.Provider>
  );
}

export default App;
