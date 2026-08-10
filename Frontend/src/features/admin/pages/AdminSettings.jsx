import React, { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminSettings = () => {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [clinicInfo, setClinicInfo] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/clinic/info`)
      .then((r) => r.json())
      .then(setClinicInfo)
      .catch(console.error);
  }, []);

  return (
    <>
      {/* Page heading */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Poppins',sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
          Settings
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Manage your profile and clinic configuration.
        </p>
      </div>

      {/* ── Your Profile Card ────────────────────────────────────────── */}
      <div className="settings-card" style={{ marginBottom: '2rem' }}>
        <span className="section-label">Your Profile</span>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.5rem', marginTop: '-0.25rem' }}>
          Your phone number is used as the clinic contact number shown to patients.
        </p>

        <div className="settings-field">
          <span className="settings-field-label">Name</span>
          <span className="settings-field-value">{user?.fullName || '—'}</span>
        </div>

        <div className="settings-field">
          <span className="settings-field-label">Email</span>
          <span className="settings-field-value">
            {user?.primaryEmailAddress?.emailAddress || '—'}
          </span>
        </div>

        <div className="settings-field">
          <span className="settings-field-label">Phone (Clinic Contact)</span>
          <span className="settings-field-value" style={{ color: user?.primaryPhoneNumber ? '#0F172A' : '#94A3B8' }}>
            {user?.primaryPhoneNumber?.phoneNumber || (
              <span style={{ fontWeight: 400, fontSize: '0.875rem' }}>Not set — add via Update Profile</span>
            )}
          </span>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <button
            className="btn-primary"
            onClick={() => openUserProfile()}
          >
            <i className="fa-solid fa-pen-to-square" />
            Update Profile
          </button>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.6rem' }}>
            Updates sync automatically via webhook. Changes to phone appear in the patient app within seconds.
          </p>
        </div>
      </div>

      {/* ── Clinic Configuration Card ─────────────────────────────────── */}
      <div className="settings-card">
        <span className="section-label">Clinic Configuration</span>
        <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginBottom: '1.5rem', marginTop: '-0.25rem' }}>
          These values are read from environment variables on the server.
        </p>

        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Clinic Name */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '0.35rem' }}>
              Clinic Name
            </div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>
              {clinicInfo?.clinic_name || '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.3rem' }}>
              To change: update the <code style={{ background: '#F1F5F9', padding: '0 4px', borderRadius: 4, fontSize: '0.72rem' }}>CLINIC_NAME</code> environment variable on your server.
            </div>
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0' }} />

          {/* Contact Phone */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '0.35rem' }}>
              Clinic Contact Phone
            </div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>
              {clinicInfo?.contact_phone || '—'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.3rem' }}>
              Pulled from your admin profile phone number above. Update your profile to change this.
            </div>
          </div>
        </div>

        {/* Explanation box */}
        <div className="info-box" style={{ marginTop: '1.25rem' }}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
          There is no "save" button here because these values are managed at the infrastructure level.
          Updating your phone via <strong>Update Profile</strong> is the only thing that updates automatically.
        </div>
      </div>
    </>
  );
};

export default AdminSettings;
