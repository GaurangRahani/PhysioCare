import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const validate = (form) => {
  const errs = {};
  if (!form.name.trim()) errs.name = 'Name is required';
  if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
  return Object.keys(errs).length ? errs : null;
};

const InviteStaffModal = ({ isOpen, onClose, onInvited }) => {
  const { getToken } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'doctor' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const handleSubmit = async () => {
    const errs = validate(form);
    if (errs) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/admin/users/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      if (res.status === 409) {
        setErrors({ email: 'Email is already registered' });
        return;
      }
      if (!res.ok) throw new Error();

      toast.success(`Invite sent to ${form.name}! They'll receive login details by email.`);
      onInvited?.();
      onClose();
      setForm({ name: '', email: '', phone: '', role: 'doctor' });
      setErrors({});
    } catch {
      toast.error('Failed to send invite. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.25rem', color: '#0F172A', margin: 0 }}>
            Invite Staff Member
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
            They'll receive login credentials by email.
          </p>
        </div>

        {/* Role Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            className={`role-select-card ${form.role === 'doctor' ? 'doctor-active' : ''}`}
            onClick={() => set('role', 'doctor')}
          >
            <i className="fa-solid fa-user-doctor" style={{ fontSize: '1.6rem', marginBottom: '0.5rem', display: 'block', color: form.role === 'doctor' ? '#565acf' : '#94A3B8' }} />
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>Doctor</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>Clinical access</div>
          </button>

          <button
            className={`role-select-card ${form.role === 'receptionist' ? 'receptionist-active' : ''}`}
            onClick={() => set('role', 'receptionist')}
          >
            <i className="fa-solid fa-headset" style={{ fontSize: '1.6rem', marginBottom: '0.5rem', display: 'block', color: form.role === 'receptionist' ? '#0D9488' : '#94A3B8' }} />
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>Receptionist</div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>Booking & billing</div>
          </button>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
              Full Name <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              className={`modal-input ${errors.name ? 'error' : ''}`}
              placeholder="e.g. Dr. Ankit Sharma"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && <span style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
              Email Address <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              className={`modal-input ${errors.email ? 'error' : ''}`}
              type="email"
              placeholder="staff@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && <span style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>
              Phone <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              className="modal-input"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </div>
        </div>

        {/* Info box */}
        <div className="info-box" style={{ marginBottom: '1.5rem' }}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
          A temporary password will be emailed to{' '}
          <strong>{form.email || 'the staff member'}</strong>.
          They must change it on first login.
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {submitting
              ? <><i className="fa-solid fa-spinner fa-spin" /> Sending…</>
              : <><i className="fa-solid fa-paper-plane" /> Send Invite</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteStaffModal;
