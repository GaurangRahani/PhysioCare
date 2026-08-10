import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ROLES = [
  { value: 'patient',       label: 'Patient',       desc: 'Can book & log exercises' },
  { value: 'doctor',        label: 'Doctor',         desc: 'Clinical dashboard access' },
  { value: 'receptionist',  label: 'Receptionist',   desc: 'Booking & billing access' },
];

const avatarColors = {
  doctor:       { bg: '#EDE9FE', color: '#6D28D9' },
  receptionist: { bg: '#CCFBF1', color: '#0F766E' },
  patient:      { bg: '#DBEAFE', color: '#1D4ED8' },
};

const initials = (name) =>
  (name || '')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const EditUserDrawer = ({ user, isOpen, onClose, onUserUpdated }) => {
  const { getToken } = useAuth();
  const [selectedRole, setSelectedRole] = useState('patient');
  const [patientStatus, setPatientStatus] = useState('active');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      setPatientStatus(user.patient_status || 'active');
      setIsActive(user.is_active ?? true);
    }
  }, [user]);

  if (!user) return null;

  const isDirty =
    selectedRole !== user.role ||
    (selectedRole === 'patient' && patientStatus !== user.patient_status) ||
    (selectedRole !== 'patient' && isActive !== user.is_active);

  const showRoleWarning =
    selectedRole !== user.role &&
    (user.role === 'doctor' || user.role === 'receptionist');

  const showDeactivateWarning = selectedRole !== 'patient' && !isActive && user.is_active;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      if (selectedRole !== user.role) {
        const res = await fetch(`${API}/api/admin/users/${user.id}/role`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ new_role: selectedRole }),
        });
        if (!res.ok) throw new Error();
      }

      if (selectedRole === 'patient' && patientStatus !== user.patient_status) {
        const res = await fetch(`${API}/api/admin/users/${user.id}/patient-status`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ status: patientStatus }),
        });
        if (!res.ok) throw new Error();
      }

      if (selectedRole !== 'patient' && isActive !== user.is_active) {
        const res = await fetch(`${API}/api/admin/users/${user.id}/active`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ is_active: isActive }),
        });
        if (!res.ok) throw new Error();
      }

      toast.success('User updated successfully');
      onUserUpdated({ ...user, role: selectedRole, is_active: isActive, patient_status: patientStatus });
      onClose();
    } catch {
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const avc = avatarColors[user.role] || avatarColors.patient;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="drawer-overlay" onClick={onClose} />
      )}

      {/* Drawer panel */}
      <div className={`drawer-panel ${isOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="drawer-header">
          <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>
            Edit User
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#94A3B8', fontSize: '1.1rem',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* User Info Card */}
          <div className="drawer-user-card">
            <div
              className="user-avatar-drawer"
              style={{ background: avc.bg, color: avc.color }}
            >
              {initials(user.name)}
            </div>
            <div>
              <div className="drawer-user-name">{user.name}</div>
              <div className="drawer-user-email">{user.email}</div>
              {user.phone && <div className="drawer-user-phone">{user.phone}</div>}
              <div className="drawer-user-joined">
                Joined {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Role section */}
          <span className="section-label">Role</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.75rem' }}>
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`radio-card ${selectedRole === r.value ? 'selected' : ''}`}
                onClick={() => setSelectedRole(r.value)}
              >
                <input type="radio" className="sr-only" checked={selectedRole === r.value} onChange={() => setSelectedRole(r.value)} />
                <div className={`radio-dot ${selectedRole === r.value ? 'selected' : ''}`}>
                  {selectedRole === r.value && <div className="radio-dot-inner" />}
                </div>
                <div>
                  <div className="radio-card-label">{r.label}</div>
                  <div className="radio-card-desc">{r.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {showRoleWarning && (
            <div className="warn-box" style={{ marginBottom: '1.25rem' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
              Changing role will remove <strong>{user.name}</strong>'s access to their current {user.role} dashboard.
              All past data is preserved.
            </div>
          )}

          {/* Status section */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
            <span className="section-label">Status</span>

            {selectedRole === 'patient' ? (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { v: 'active', label: 'Active', cls: 'active-sel' },
                  { v: 'inactive', label: 'Inactive', cls: 'inactive-sel' },
                  { v: 'discharged', label: 'Discharged', cls: 'discharged-sel' },
                ].map(({ v, label, cls }) => (
                  <button
                    key={v}
                    className={`status-btn ${patientStatus === v ? cls : ''}`}
                    onClick={() => setPatientStatus(v)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <button
                    className="toggle-track"
                    style={{ background: isActive ? '#565acf' : '#CBD5E1' }}
                    onClick={() => setIsActive(!isActive)}
                    aria-label="Toggle active status"
                  >
                    <span
                      className="toggle-thumb"
                      style={{ transform: isActive ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                    {isActive ? 'Active — can log in' : 'Inactive — cannot log in'}
                  </span>
                </div>

                {showDeactivateWarning && (
                  <div className="danger-box" style={{ marginTop: '0.75rem' }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 6 }} />
                    <strong>{user.name}</strong> will be immediately locked out.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {isSaving
              ? <><i className="fa-solid fa-spinner fa-spin" /> Saving…</>
              : 'Save Changes'
            }
          </button>
        </div>
      </div>
    </>
  );
};

export default EditUserDrawer;
