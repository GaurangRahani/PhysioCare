import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { 
  X, 
  Check, 
  AlertTriangle, 
  AlertCircle, 
  Loader2, 
  Stethoscope, 
  Users, 
  Headphones, 
  Phone, 
  Mail, 
  Calendar 
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ROLES = [
  { value: 'patient', label: 'Patient', desc: 'Can book consultations & record daily exercise sessions', icon: Users },
  { value: 'doctor', label: 'Doctor', desc: 'Clinical dashboard, prescriptions, and patient consultation notes', icon: Stethoscope },
  { value: 'receptionist', label: 'Receptionist', desc: 'Front desk scheduling, billing records, and patient registry', icon: Headphones },
];

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

  if (!isOpen || !user) return null;

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
          method: 'PATCH',
          headers,
          body: JSON.stringify({ new_role: selectedRole }),
        });
        if (!res.ok) throw new Error();
      }

      if (selectedRole === 'patient' && patientStatus !== user.patient_status) {
        const res = await fetch(`${API}/api/admin/users/${user.id}/patient-status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: patientStatus }),
        });
        if (!res.ok) throw new Error();
      }

      if (selectedRole !== 'patient' && isActive !== user.is_active) {
        const res = await fetch(`${API}/api/admin/users/${user.id}/active`, {
          method: 'PATCH',
          headers,
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      {/* Click outside to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Container */}
      <div 
        className="w-full max-w-[440px] bg-[#FFFFFF] h-full shadow-2xl flex flex-col border-l border-[#EAEAEA] animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#EAEAEA] flex items-center justify-between bg-[#FFFFFF] shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-[#202223]">
              Edit User Account
            </h2>
            <p className="text-[11px] text-[#8A8A8A] mt-0.5">
              Modify clinical permissions, role access, and account status.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#8A8A8A] hover:text-[#202223] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
            title="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-[#202223]">
          
          {/* User Info Card */}
          <div className="p-4 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[12px] flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#202020] text-[#FFFFFF] flex items-center justify-center text-[14px] font-bold shrink-0">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-[#202223] truncate">
                {user.name}
              </div>
              <div className="text-[12px] text-[#616161] truncate flex items-center gap-1.5 mt-0.5">
                <Mail size={12} className="text-[#8A8A8A] shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="text-[11px] text-[#8A8A8A] flex items-center gap-1.5 mt-0.5 font-mono">
                  <Phone size={11} className="shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="text-[10px] text-[#8A8A8A] mt-1 font-mono">
                Member since {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
              Assigned Role
            </label>
            <div className="space-y-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.value;
                return (
                  <div
                    key={r.value}
                    onClick={() => setSelectedRole(r.value)}
                    className={`p-3 rounded-[10px] border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected 
                        ? 'border-[#202223] bg-[#FBFBFB] shadow-xs' 
                        : 'border-[#EAEAEA] bg-[#FFFFFF] hover:border-[#CCCCCC]'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-[#202020] text-[#FFFFFF]' : 'bg-[#F4F4F4] text-[#616161]'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-[#202223]">
                          {r.label}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#000000] text-[#FFFFFF] flex items-center justify-center">
                            <Check size={10} />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-[#616161] mt-0.5 leading-snug">
                        {r.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role Warning */}
          {showRoleWarning && (
            <div className="p-3 bg-[#FFF9E6] border border-[#FFE8A3] rounded-[10px] flex items-start gap-2.5 text-[#856404]">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div className="text-[12px] leading-snug">
                Changing role will revoke <strong>{user.name}</strong>'s current {user.role} portal access. Past appointments and records will remain safely linked.
              </div>
            </div>
          )}

          {/* Status Section */}
          <div className="pt-4 border-t border-[#EAEAEA] space-y-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
              Account Status
            </label>

            {selectedRole === 'patient' ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'active', label: 'Active', desc: 'Can book visits' },
                  { v: 'inactive', label: 'Inactive', desc: 'Paused' },
                  { v: 'discharged', label: 'Discharged', desc: 'Completed care' },
                ].map(({ v, label }) => {
                  const isSel = patientStatus === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPatientStatus(v)}
                      className={`py-2 px-3 rounded-[8px] text-[12px] font-medium border text-center transition-colors cursor-pointer ${
                        isSel
                          ? 'border-[#202223] bg-[#202223] text-[#FFFFFF] font-semibold shadow-xs'
                          : 'border-[#EAEAEA] bg-[#FFFFFF] text-[#616161] hover:border-[#202223]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-[10px] border border-[#EAEAEA] bg-[#FBFBFB]">
                  <div>
                    <div className="text-[13px] font-medium text-[#202223]">
                      Portal Login Access
                    </div>
                    <div className="text-[11px] text-[#616161]">
                      {isActive ? 'Staff member can sign in and operate' : 'Staff member is blocked from signing in'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isActive ? 'bg-[#000000]' : 'bg-[#D1D1D1]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#FFFFFF] shadow-md ring-0 transition duration-200 ease-in-out ${
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {showDeactivateWarning && (
                  <div className="p-3 bg-[#FCE4E4] border border-[#F5C2C2] text-[#B81818] rounded-[10px] flex items-start gap-2 text-[12px]">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span><strong>{user.name}</strong> will be immediately locked out of clinical workflows.</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#EAEAEA] bg-[#FFFFFF] flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 text-[12px] font-medium text-[#202223] bg-[#FFFFFF] border border-[#EAEAEA] hover:bg-[#F4F4F4] rounded-[8px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="flex-1 py-2 text-[12px] font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#202020] disabled:bg-[#F4F4F4] disabled:text-[#A3A3A3] disabled:cursor-not-allowed rounded-[8px] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditUserDrawer;
