/**
 * LabelTemplate Component
 * Renders a visual blood vial label preview for blood test tubes
 * Small label: 0.66" x 3.4" (Brother DK-1203) - shows only Name and DOB
 * Regular label: 2" x 1" - shows Name, Collection Date, DOB, and footer
 */

import React from 'react';

export default function LabelTemplate({ labelData, scale = 1, isSmall = false }) {
  const {
    patientName = '',
    dob = '',
    collectionTime = '',
  } = labelData || {};

  const displayName = (patientName || 'PATIENT NAME').toUpperCase();
  const displayDate = formatCollectionDate(collectionTime);
  const displayDob = formatCollectionDate(dob);

  const style = {
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
  };

  if (isSmall) {
    // Small label format for 29mm × 90.3mm paper (Brother DK-1201)
    return (
      <div className="blood-label fade-in" style={style}>
        <div className="blood-label-body" style={{ 
          width: '256px', 
          height: '82px', 
          border: '1px solid #000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '6px 10px',
          backgroundColor: '#fff',
          fontSize: '10px'
        }}>
          {/* Patient Name */}
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '900', 
            letterSpacing: '0.01em', 
            lineHeight: '1.1', 
            color: '#000', 
            wordBreak: 'break-word',
            marginBottom: '3px',
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {displayName}
          </div>
          
          {/* Date of Birth */}
          <div style={{ 
            fontSize: '9px', 
            color: '#333', 
            fontWeight: '600',
            textAlign: 'center',
            width: '100%',
            lineHeight: '1.1'
          }}>
            DOB: {displayDob}
          </div>
        </div>
      </div>
    );
  }

  // Regular label format (2" x 1") - full information
  return (
    <div className="blood-label fade-in" style={style}>
      {/* Label Content */}
      <div className="blood-label-body">
        {/* Patient Name - Large and prominent */}
        <div className="blood-label-name" title={displayName}>
          {displayName}
        </div>
        
        {/* Collection Date */}
        <div className="blood-label-date">
          <strong>COLLECTED:</strong> {displayDate}
        </div>
        
        {/* Date of Birth */}
        <div className="blood-label-dob">
          <strong>DOB:</strong> {displayDob}
        </div>
      </div>

      {/* Footer */}
      <div className="blood-label-footer">
        ✚ BLOOD SAMPLE &nbsp;•&nbsp; HANDLE WITH CARE
      </div>
    </div>
  );
}

function formatCollectionDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch {
    return dateString;
  }
}
