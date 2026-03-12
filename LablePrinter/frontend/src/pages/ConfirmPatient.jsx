import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { AppContext } from '../App';
import { generateSampleId } from '../services/api';
import dayjs from 'dayjs';

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

export default function ConfirmPatient() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientData, showToast, handleConfirm } = useContext(AppContext);

  const isManual = location.state?.manual;

  // Editable patient fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [collectionTime] = useState(new Date().toISOString());
  const [loadingId, setLoadingId] = useState(false);
  const [errors, setErrors] = useState({});

  // Populate from scan
  useEffect(() => {
    if (patientData && !isManual) {
      setFirstName(patientData.firstName || '');
      setLastName(patientData.lastName || '');
      setDob(patientData.dateOfBirth || '');
      setAddress(patientData.address || '');
      setExpirationDate(patientData.expirationDate || '');
    }
  }, [patientData, isManual]);

  const validate = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = 'Required';
    if (!lastName.trim()) e.lastName = 'Required';
    if (!dob.trim()) e.dob = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const confirmedData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      dateOfBirth: dob.trim(),
      address: address.trim(),
      expirationDate: expirationDate.trim(),
      collectionTime,
    };

    handleConfirm(confirmedData);
    navigate('/label');
  };

  const aamvaVersion = patientData?.aamvaVersion;

  return (
    <div className="lab-page fade-in">
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--lab-primary)', marginBottom: '0.25rem' }}>
          {isManual ? 'Enter Patient Details' : 'Confirm Patient'}
        </h2>
        {!isManual && patientData && (
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Tag value="License Scanned" severity="success" style={{ fontSize: '0.72rem' }} />
            {aamvaVersion > 0 && (
              <Tag value={`AAMVA v${aamvaVersion}`} severity="info" style={{ fontSize: '0.72rem' }} />
            )}
            {patientData.addressComponents?.state && (
              <Tag value={patientData.addressComponents.state} style={{ fontSize: '0.72rem', background: '#e8eaf6', color: '#1a237e' }} />
            )}
          </div>
        )}
        {isManual && (
          <p style={{ fontSize: '0.85rem', color: 'var(--lab-text-muted)' }}>
            Scan unavailable — enter patient information manually
          </p>
        )}
      </div>

      {/* Patient Name */}
      <div className="lab-card">
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--lab-primary)', marginBottom: '0.75rem' }}>
          Patient Name *
        </div>
        <div className="field-row">
          <div className="field-group">
            <label>First Name *</label>
            <InputText
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="First"
              className={errors.firstName ? 'p-invalid' : ''}
              style={{ width: '100%' }}
            />
            {errors.firstName && <small style={{ color: 'var(--lab-accent)', fontSize: '0.75rem' }}>{errors.firstName}</small>}
          </div>
          <div className="field-group">
            <label>Last Name *</label>
            <InputText
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Last"
              className={errors.lastName ? 'p-invalid' : ''}
              style={{ width: '100%' }}
            />
            {errors.lastName && <small style={{ color: 'var(--lab-accent)', fontSize: '0.75rem' }}>{errors.lastName}</small>}
          </div>
        </div>
      </div>

      {/* DOB & License */}
      <div className="lab-card">
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--lab-primary)', marginBottom: '0.75rem' }}>
          Identity
        </div>
        <div className="field-group">
          <label>Date of Birth *</label>
          <InputText
            value={formatDate(dob)}
            onChange={e => setDob(e.target.value)}
            placeholder="MM/DD/YYYY"
            className={errors.dob ? 'p-invalid' : ''}
            style={{ width: '100%' }}
          />
          {errors.dob && <small style={{ color: 'var(--lab-accent)', fontSize: '0.75rem' }}>{errors.dob}</small>}
        </div>
        <div className="field-group" style={{ marginBottom: 0 }}>
          <label>Address</label>
          <InputText
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Street, City, State"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Collection Time */}
      <div className="lab-card">
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--lab-primary)', marginBottom: '0.75rem' }}>
          Collection Details
        </div>
        <div className="field-group" style={{ marginBottom: 0 }}>
          <label>Collection Time</label>
          <InputText
            value={formatDate(collectionTime)}
            readOnly
            style={{ width: '100%', background: '#f8fafc', color: 'var(--lab-text-muted)' }}
          />
        </div>
      </div>

      {/* Expiration warning */}
      {expirationDate && isExpired(expirationDate) && (
        <div style={{
          background: '#fff3e0',
          borderRadius: '8px',
          padding: '0.75rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start',
          fontSize: '0.82rem',
          color: 'var(--lab-warning)',
          border: '1px solid #ffcc02'
        }}>
          <i className="pi pi-exclamation-triangle" style={{ marginTop: '2px' }} />
          <span>
            <strong>License may be expired</strong> (Exp: {expirationDate}). Verify with patient.
          </span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
        <Button
          label="Back"
          icon="pi pi-arrow-left"
          className="p-button-outlined"
          style={{ flex: 1 }}
          onClick={() => navigate(-1)}
        />
        <Button
          label="Generate Label"
          icon="pi pi-tag"
          style={{ flex: 2, background: 'var(--lab-primary)', borderColor: 'var(--lab-primary)' }}
          onClick={handleSubmit}
          disabled={loadingId}
        />
      </div>
    </div>
  );
}

function isExpired(dateStr) {
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [m, d, y] = parts;
      const expDate = new Date(`${y}-${m}-${d}`);
      return expDate < new Date();
    }
    return false;
  } catch {
    return false;
  }
}
