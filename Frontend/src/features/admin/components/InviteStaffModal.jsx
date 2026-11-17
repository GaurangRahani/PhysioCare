import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { 
  X, 
  Stethoscope, 
  Headphones, 
  User, 
  Mail, 
  Phone, 
  Loader2, 
  Check, 
  AlertCircle 
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const validate = (form) => {
  const errs = {};
  if (!form.name.trim()) errs.name = 'Full name is required';
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

  const handleSubmit = async (e) => {
    e?.preventDefault();
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
        setErrors({ email: 'This email is already registered in the system' });
        return;
      }
      if (!res.ok) throw new Error();

      toast.success(`Invitation sent to ${form.name}! Access details emailed.`);
      onInvited?.();
      onClose();
      setForm({ name: '', email: '', phone: '', role: 'doctor' });
      setErrors({});
    } catch {
      toast.error('Failed to send invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="w-full max-w-[480px] bg-[#FFFFFF] rounded-[16px] border border-[#EAEAEA] shadow-2xl flex flex-col overflow-hidden animate-fade-in text-[#202223]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EAEAEA] flex items-center justify-between bg-[#FFFFFF]">
          <div>
            <h2 className="text-[15px] font-semibold text-[#202223]">
              Invite Clinic Staff Member
            </h2>
            <p className="text-[11px] text-[#8A8A8A] mt-0.5">
              Securely provision a doctor or receptionist account with email invite.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#8A8A8A] hover:text-[#202223] hover:bg-[#F4F4F4] transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Role Choice Cards */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#616161]">
              Select Staff Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Doctor Card */}
              <div
                onClick={() => set('role', 'doctor')}
                className={`p-3 rounded-[10px] border cursor-pointer transition-all flex flex-col items-center text-center ${
                  form.role === 'doctor'
                    ? 'border-[#202223] bg-[#FBFBFB] shadow-xs'
                    : 'border-[#EAEAEA] bg-[#FFFFFF] hover:border-[#CCCCCC]'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${
                  form.role === 'doctor' ? 'bg-[#202020] text-[#FFFFFF]' : 'bg-[#F4F4F4] text-[#616161]'
                }`}>
                  <Stethoscope size={18} />
                </div>
                <div className="text-[13px] font-semibold text-[#202223]">
                  Doctor
                </div>
                <div className="text-[11px] text-[#8A8A8A] mt-0.5">
                  Clinical consultations & care plans
                </div>
              </div>

              {/* Receptionist Card */}
              <div
                onClick={() => set('role', 'receptionist')}
                className={`p-3 rounded-[10px] border cursor-pointer transition-all flex flex-col items-center text-center ${
                  form.role === 'receptionist'
                    ? 'border-[#202223] bg-[#FBFBFB] shadow-xs'
                    : 'border-[#EAEAEA] bg-[#FFFFFF] hover:border-[#CCCCCC]'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${
                  form.role === 'receptionist' ? 'bg-[#202020] text-[#FFFFFF]' : 'bg-[#F4F4F4] text-[#616161]'
                }`}>
                  <Headphones size={18} />
                </div>
                <div className="text-[13px] font-semibold text-[#202223]">
                  Receptionist
                </div>
                <div className="text-[11px] text-[#8A8A8A] mt-0.5">
                  Front desk scheduling & billing
                </div>
              </div>
            </div>
          </div>

          {/* Full Name Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider flex items-center justify-between">
              <span>Full Name <span className="text-[#B81818]">*</span></span>
              {errors.name && <span className="text-[11px] text-[#B81818] normal-case">{errors.name}</span>}
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Dr. Sarah Jenkins or Priya Sharma"
                className={`w-full pl-9 pr-3 py-2 text-[13px] bg-[#FFFFFF] border rounded-[8px] text-[#202223] placeholder:text-[#A3A3A3] outline-none transition-colors ${
                  errors.name ? 'border-[#B81818] focus:border-[#B81818]' : 'border-[#EAEAEA] focus:border-[#202223]'
                }`}
              />
            </div>
          </div>

          {/* Email Address Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider flex items-center justify-between">
              <span>Email Address <span className="text-[#B81818]">*</span></span>
              {errors.email && <span className="text-[11px] text-[#B81818] normal-case">{errors.email}</span>}
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="staff.member@aligncare.clinic"
                className={`w-full pl-9 pr-3 py-2 text-[13px] bg-[#FFFFFF] border rounded-[8px] text-[#202223] placeholder:text-[#A3A3A3] outline-none transition-colors ${
                  errors.email ? 'border-[#B81818] focus:border-[#B81818]' : 'border-[#EAEAEA] focus:border-[#202223]'
                }`}
              />
            </div>
          </div>

          {/* Phone Number Field */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider">
              Phone Number <span className="text-[#8A8A8A] font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 text-[13px] bg-[#FFFFFF] border border-[#EAEAEA] focus:border-[#202223] rounded-[8px] text-[#202223] placeholder:text-[#A3A3A3] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-[12px] font-medium text-[#202223] bg-[#FFFFFF] border border-[#EAEAEA] hover:bg-[#F4F4F4] rounded-[8px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-[12px] font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#202020] disabled:bg-[#F4F4F4] disabled:text-[#A3A3A3] disabled:cursor-not-allowed rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sending Invitation...</span>
                </>
              ) : (
                <span>Send Invitation</span>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default InviteStaffModal;
