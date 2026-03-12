import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { AppContext } from '../App';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientData } = useContext(AppContext);

  const isHome = location.pathname === '/';
  const isScan = location.pathname === '/scan';

  const handleBack = () => navigate(-1);

  return (
    <nav className="lab-navbar">
      {!isHome && !isScan && (
        <Button
          icon="pi pi-arrow-left"
          className="p-button-text p-button-plain"
          style={{ color: 'white', marginRight: '0.5rem' }}
          onClick={handleBack}
          aria-label="Go back"
        />
      )}

      <Link to="/" className="lab-navbar-logo">
        <span className="lab-cross">✚</span>
        <span>LabPrint</span>
      </Link>

      <div className="lab-navbar-actions">
        {location.pathname !== '/settings' && (
          <Button
            icon="pi pi-cog"
            className="p-button-text p-button-plain p-button-rounded"
            style={{ color: 'white' }}
            onClick={() => navigate('/settings')}
            tooltip="Printer Settings"
            tooltipOptions={{ position: 'bottom' }}
            aria-label="Settings"
          />
        )}
      </div>
    </nav>
  );
}
