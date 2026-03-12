/**
 * LabelTemplate Component
 * Renders a visual blood vial label preview for blood test tubes
 * Dimensions: 13x75mm, 13x100mm, or 16x100mm
 * Shows only Name, Collection Date, and DOB
 */

import React from 'react';

export default function LabelTemplate({ labelData, scale = 1 }) {
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
