import React, { useState } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { 
  UserRound, 
  Phone, 
  MapPin, 
  Calendar, 
  HeartPulse, 
  Loader2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  LogOut,
  AlertCircle
} from 'lucide-react';
import Logo from '../../../components/common/Logo';

const PatientOnboarding = ({ onComplete }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  
  const [formData, setFormData] = useState({
    phone: '',
    date_of_birth: '',
    gender: 'other',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date_of_birth || !formData.gender) {
      setError('Date of birth and Gender are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        onComplete(data.profile);
      } else {
        setError(data.message || 'Failed to save patient profile. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const patientName = user?.firstName || 'Patient';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202223] font-['Inter',system-ui,sans-serif] flex flex-col justify-between">
      
      {/* ── 1. TOP BRAND HEADER ────────────────────────────────────────── */}
      <header className="h-[56px] bg-[#FFFFFF] border-b border-[#EAEAEA] px-4 sm:px-8 flex items-center justify-between">
        <Logo size="sm" subtitle="Patient Portal" />

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-[#616161]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#008060]" />
            <span className="font-medium text-[#202223]">{user?.fullName || patientName}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-[11px] font-medium text-[#8A8A8A] hover:text-[#202223] hover:bg-[#F4F4F4] px-2.5 py-1 rounded-[6px] transition-colors cursor-pointer inline-flex items-center gap-1"
            title="Sign out"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* ── 2. MAIN ONBOARDING FORM ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6">
        <div className="max-w-[620px] w-full space-y-6">
          
          {/* Welcome Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#E3F1DF] text-[#008060] border border-[#C3E6CD] mb-1">
              <Sparkles size={12} />
              <span>Patient Onboarding · Step 1</span>
            </div>
            
            <h1 className="text-[24px] sm:text-[28px] font-bold text-[#202223] tracking-tight">
              Welcome to AlignCare, {patientName}!
            </h1>
            
            <p className="text-[13px] text-[#616161] max-w-[480px] mx-auto leading-relaxed">
              Let's get your health profile set up. This information ensures your clinical physiotherapist can accurately prescribe and track your rehabilitation.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[16px] shadow-sm overflow-hidden">
            
            <div className="px-6 py-4 border-b border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#202020] text-[#FFFFFF] flex items-center justify-center">
                  <UserRound size={15} />
                </div>
                <div>
                  <h2 className="text-[13px] font-semibold text-[#202223]">
                    Personal & Medical Details
                  </h2>
                  <p className="text-[11px] text-[#8A8A8A]">
                    Kept strictly confidential and encrypted
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[6px] bg-[#E3F1DF] text-[#008060] border border-[#C3E6CD]">
                Confidential
              </span>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {error && (
                <div className="p-3 bg-[#FCE4E4] border border-[#F5C2C2] text-[#B81818] rounded-[10px] text-[12px] flex items-start gap-2 animate-fade-in">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* DOB */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#8A8A8A]" />
                    <span>Date of Birth <span className="text-[#B81818]">*</span></span>
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-[13px] bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] text-[#202223] focus:border-[#202223] focus:bg-[#FFFFFF] outline-none transition-colors"
                    required
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider flex items-center gap-1.5">
                    <UserRound size={13} className="text-[#8A8A8A]" />
                    <span>Gender <span className="text-[#B81818]">*</span></span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-[13px] bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] text-[#202223] focus:border-[#202223] focus:bg-[#FFFFFF] outline-none transition-colors cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={13} className="text-[#8A8A8A]" />
                  <span>Contact Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-[13px] font-mono bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] text-[#202223] placeholder:text-[#A3A3A3] focus:border-[#202223] focus:bg-[#FFFFFF] outline-none transition-colors"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#8A8A8A]" />
                  <span>Residential Address</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, City, Postal Code"
                  rows={2}
                  className="w-full px-3.5 py-2 text-[13px] bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] text-[#202223] placeholder:text-[#A3A3A3] focus:border-[#202223] focus:bg-[#FFFFFF] outline-none transition-colors resize-none"
                />
              </div>

              {/* Emergency Contact */}
              <div className="pt-2 border-t border-[#F0F0F0] space-y-3">
                <div className="flex items-center gap-2">
                  <HeartPulse size={15} className="text-[#008060]" />
                  <span className="text-[12px] font-semibold text-[#202223]">
                    Emergency Contact Information
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      placeholder="e.g. Spouse / Parent"
                      className="w-full px-3 py-2 text-[12px] bg-[#FBFBFB] border border-[#EAEAEA] rounded-[8px] text-[#202223] focus:border-[#202223] outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-[12px] font-mono bg-[#FBFBFB] border border-[#EAEAEA] rounded-[8px] text-[#202223] focus:border-[#202223] outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[46px] rounded-[10px] bg-[#000000] hover:bg-[#202020] text-[#FFFFFF] text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:bg-[#F4F4F4] disabled:text-[#A3A3A3] disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Completing Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Profile & Go to Dashboard</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-[#8A8A8A]">
            <ShieldCheck size={14} className="text-[#008060]" />
            <span>Encrypted clinical portal · HIPAA & DPDP compliant data protection</span>
          </div>

        </div>
      </main>

      {/* ── 3. FOOTER ─────────────────────────────────────────────────── */}
      <footer className="h-[44px] border-t border-[#EAEAEA] bg-[#FFFFFF] px-4 flex items-center justify-between text-[11px] text-[#8A8A8A]">
        <span>© {new Date().getFullYear()} AlignCare Physical Therapy Systems. All rights reserved.</span>
        <span className="hidden sm:inline">Patient Portal & Remote Rehabilitation</span>
      </footer>

    </div>
  );
};

export default PatientOnboarding;
