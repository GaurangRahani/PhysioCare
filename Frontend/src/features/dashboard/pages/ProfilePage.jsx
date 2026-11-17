import React, { useState, useEffect } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  Edit3, 
  Save, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const calculateAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const ProfilePage = () => {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', address: '', medical_history: '' });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const pRes = await fetch(`${API}/api/patients/profile`, { headers });
      const pData = await pRes.json();
      if (!pRes.ok) throw new Error(pData.message);

      const merged = {
        name: pData.user.name,
        email: pData.user.email,
        phone: pData.user.phone || '',
        date_of_birth: pData.profile?.date_of_birth || null,
        gender: pData.profile?.gender || null,
        address: pData.profile?.address || '',
        medical_history: pData.profile?.medical_history || '',
        status: pData.profile?.status || 'active',
        created_at: pData.profile?.created_at || null,
      };
      setProfile(merged);
      setEditForm({
        phone: merged.phone,
        address: merged.address,
        medical_history: merged.medical_history,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = await getToken();
      const res = await fetch(`${API}/api/patients/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save');

      setProfile(prev => ({ ...prev, ...editForm }));
      setIsEditingPersonal(false);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to save changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      phone: profile?.phone || '',
      address: profile?.address || '',
      medical_history: profile?.medical_history || '',
    });
    setIsEditingPersonal(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <div className="w-8 h-8 border-2 border-[#202223] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-[13px] text-[#616161]">Loading health profile…</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-5 animate-fade-in font-['Inter',system-ui,sans-serif] pb-10">
      
      {/* ── 1. PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2.5 border-b border-[#EAEAEA]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202223]">
            My Health Profile
          </h1>
          <p className="text-[12px] sm:text-[13px] text-[#616161] mt-0.5">
            Manage your personal clinical record, demographics, and contact information.
          </p>
        </div>

        <button 
          onClick={() => signOut(() => navigate('/'))}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-[12px] font-medium text-[#B81818] bg-[#FFFFFF] border border-[#EAEAEA] hover:bg-[#FCE4E4] rounded-[8px] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* ── 2. PERSONAL INFORMATION CARD ────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
          <div>
            <h2 className="text-sm font-semibold text-[#202223]">Personal Record</h2>
            <p className="text-[12px] text-[#616161]">Demographics and contact details for your therapy care team.</p>
          </div>

          {!isEditingPersonal ? (
            <button 
              onClick={() => setIsEditingPersonal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-[#202223] bg-[#F4F4F4] hover:bg-[#EAEAEA] transition-colors cursor-pointer"
            >
              <Edit3 size={13} />
              <span>Edit Details</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-[#616161] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold text-[#FFFFFF] bg-[#008060] hover:bg-[#006e52] transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {!isEditingPersonal ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-[13px]">
            <div className="p-3 bg-[#FBFBFB] border border-[#F0F0F0] rounded-[8px] space-y-1">
              <span className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                <User size={12} /> Full Name
              </span>
              <p className="font-semibold text-[#202223] truncate">{profile?.name || '—'}</p>
            </div>

            <div className="p-3 bg-[#FBFBFB] border border-[#F0F0F0] rounded-[8px] space-y-1">
              <span className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                <Mail size={12} /> Registered Email
              </span>
              <p className="font-semibold text-[#202223] truncate">{profile?.email || '—'}</p>
            </div>

            <div className="p-3 bg-[#FBFBFB] border border-[#F0F0F0] rounded-[8px] space-y-1">
              <span className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                <Phone size={12} /> Contact Number
              </span>
              <p className="font-semibold text-[#202223] truncate">{profile?.phone || 'Not provided'}</p>
            </div>

            <div className="p-3 bg-[#FBFBFB] border border-[#F0F0F0] rounded-[8px] space-y-1">
              <span className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                <Calendar size={12} /> Date of Birth
              </span>
              <p className="font-semibold text-[#202223]">
                {profile?.date_of_birth
                  ? `${formatDate(profile.date_of_birth)} (${calculateAge(profile.date_of_birth)} yrs)`
                  : '—'}
              </p>
            </div>

            <div className="p-3 bg-[#FBFBFB] border border-[#F0F0F0] rounded-[8px] space-y-1">
              <span className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                <Shield size={12} /> Gender
              </span>
              <p className="font-semibold text-[#202223] capitalize">{profile?.gender || '—'}</p>
            </div>

            <div className="p-3 bg-[#FBFBFB] border border-[#F0F0F0] rounded-[8px] space-y-1">
              <span className="text-[11px] font-medium text-[#8A8A8A] flex items-center gap-1.5">
                <MapPin size={12} /> Home Address
              </span>
              <p className="font-semibold text-[#202223] truncate">{profile?.address || 'Not provided'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 max-w-xl text-[13px]">
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-[#616161]">Phone Number</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[8px] text-[#202223] outline-none focus:border-[#202223]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-medium text-[#616161]">Residential Address</label>
              <textarea
                rows={3}
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter street, city, postal code"
                className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#EAEAEA] rounded-[8px] text-[#202223] outline-none focus:border-[#202223]"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 3. CLINICAL NOTES & MEDICAL HISTORY ─────────────────────────────── */}
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[12px] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-[#F0F0F0]">
          <div>
            <h2 className="text-sm font-semibold text-[#202223]">Medical History & Notes</h2>
            <p className="text-[12px] text-[#616161]">Pre-existing conditions, surgeries, or injuries shared with doctors.</p>
          </div>
          <FileText size={16} className="text-[#8A8A8A]" />
        </div>

        {!isEditingPersonal ? (
          <div className="p-3.5 bg-[#FBFBFB] border border-[#F0F0F0] rounded-[8px] text-[13px]">
            {profile?.medical_history ? (
              <p className="text-[#202223] leading-relaxed whitespace-pre-wrap">{profile.medical_history}</p>
            ) : (
              <p className="text-[#8A8A8A] italic">No medical history or pre-existing conditions recorded.</p>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <textarea
              rows={4}
              value={editForm.medical_history}
              onChange={(e) => setEditForm(prev => ({ ...prev, medical_history: e.target.value }))}
              placeholder="e.g. Previous knee arthroscopy (2023), Chronic lower back stiffness"
              className="w-full px-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#EAEAEA] rounded-[8px] text-[#202223] outline-none focus:border-[#202223]"
            />
          </div>
        )}
      </div>

      {/* ── TOAST NOTIFICATION ────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] text-[13px] font-medium shadow-xl border animate-fade-in ${
          toast.type === 'success' 
            ? 'bg-[#FFFFFF] border-[#D9F7C3] text-[#245B19]' 
            : 'bg-[#FFFFFF] border-[#FCE4E4] text-[#B81818]'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
};

export default ProfilePage;
