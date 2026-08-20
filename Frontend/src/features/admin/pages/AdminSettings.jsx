import React, { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Edit, Info, Building2, Phone, Mail, User } from 'lucide-react';

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
    <div className="dashboard-container" style={{ padding: '0', maxWidth: '800px' }}>
      {/* Page heading */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-date">Manage your profile and clinic configuration.</p>
      </div>

      {/* ── Your Profile Card ────────────────────────────────────────── */}
      <div className="settings-card" style={{ marginBottom: '2rem', maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="stat-icon icon-purple" style={{ width: '48px', height: '48px' }}>
            <User size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--heading-text-color)', margin: 0 }}>
              Your Profile
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', margin: 0 }}>
              Your phone number is used as the clinic contact number shown to patients.
            </p>
          </div>
        </div>

        <div className="settings-field" style={{ paddingTop: '0' }}>
          <span className="settings-field-label">Name</span>
          <span className="settings-field-value">{user?.fullName || '—'}</span>
        </div>

        <div className="settings-field">
          <span className="settings-field-label">Email</span>
          <span className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={16} className="text-gray-400" />
            {user?.primaryEmailAddress?.emailAddress || '—'}
          </span>
        </div>

        <div className="settings-field">
          <span className="settings-field-label">Phone (Clinic Contact)</span>
          <span className="settings-field-value" style={{ color: user?.primaryPhoneNumber ? 'var(--heading-text-color)' : 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={16} className={user?.primaryPhoneNumber ? 'text-primary' : 'text-gray-400'} />
            {user?.primaryPhoneNumber?.phoneNumber || (
              <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Not set — add via Update Profile</span>
            )}
          </span>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button
            className="btn-primary"
            onClick={() => openUserProfile()}
            style={{ borderRadius: '2rem' }}
          >
            <Edit size={18} />
            Update Profile
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', margin: 0, maxWidth: '300px', lineHeight: 1.4 }}>
            Updates sync automatically via webhook. Changes to phone appear in the patient app within seconds.
          </p>
        </div>
      </div>

      {/* ── Clinic Configuration Card ─────────────────────────────────── */}
      <div className="settings-card" style={{ maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="stat-icon icon-blue" style={{ width: '48px', height: '48px' }}>
            <Building2 size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--heading-text-color)', margin: 0 }}>
              Clinic Configuration
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', margin: 0 }}>
              These values are securely read from environment variables on the server.
            </p>
          </div>
        </div>

        <div style={{ background: 'rgba(86,90,207,0.03)', border: '1px solid rgba(86,90,207,0.1)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Clinic Name */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
              Clinic Name
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary-color)' }}>
              {clinicInfo?.clinic_name || '—'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.4rem' }}>
              To change: update the <code style={{ background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', border: '1px solid var(--gray-200)', color: 'var(--danger)', fontWeight: 600 }}>CLINIC_NAME</code> environment variable on your server.
            </div>
          </div>

          <div style={{ borderTop: '1px dashed rgba(86,90,207,0.2)' }} />

          {/* Contact Phone */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
              Clinic Contact Phone
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={20} />
              {clinicInfo?.contact_phone || '—'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.4rem' }}>
              Pulled directly from your admin profile above. Update your profile to change this.
            </div>
          </div>
        </div>

        {/* Explanation box */}
        <div className="info-box" style={{ marginTop: '2rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Info size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Infrastructure Managed</strong>
            There is no "save" button here because these core configuration values are managed securely at the infrastructure level. 
            Updating your phone via <strong>Update Profile</strong> is the only thing that syncs automatically.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
