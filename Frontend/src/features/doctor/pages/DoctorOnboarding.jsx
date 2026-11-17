import React, { useState } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { 
  UserRound, 
  Phone, 
  Stethoscope, 
  Award, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  LogOut
} from 'lucide-react';
import Logo from '../../../components/common/Logo';

const SUGGESTED_SPECIALIZATIONS = [
  'Orthopedic Physiotherapy',
  'Sports Injury Rehabilitation',
  'Neurological Rehabilitation',
  'Post-Surgical Recovery',
  'Cardiopulmonary Therapy'
];

const DoctorOnboarding = ({ onComplete }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  
  const [formData, setFormData] = useState({
    phone: '',
    specialization: '',
    qualification: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectSpecialization = (spec) => {
    setFormData((prev) => ({ ...prev, specialization: spec }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.specialization.trim() || !formData.qualification.trim()) {
      setError('Please provide your Medical Specialization and Qualifications.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/doctors/profile`, {
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
        setError(data.message || 'Failed to save doctor profile. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const doctorLastName = user?.lastName || user?.firstName || 'Doctor';

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202223] font-['Inter',system-ui,sans-serif] flex flex-col justify-between">
      
      {/* ── 1. TOP BRAND HEADER ────────────────────────────────────────── */}
      <header className="h-[56px] bg-[#FFFFFF] border-b border-[#EAEAEA] px-4 sm:px-8 flex items-center justify-between">
        <Logo size="sm" subtitle="Clinical Suite" />

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-[#616161]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#008060]" />
            <span className="font-medium text-[#202223]">Dr. {doctorLastName}</span>
            <span className="text-[#A3A3A3]">({user?.primaryEmailAddress?.emailAddress})</span>
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

      {/* ── 2. MAIN ONBOARDING CARD CONTAINER ─────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6">
        <div className="max-w-[540px] w-full space-y-6">
          
          {/* Hero Welcome Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#E3F1DF] text-[#008060] border border-[#C3E6CD] mb-1">
              <Sparkles size={12} />
              <span>Physician Onboarding · Activation</span>
            </div>
            
            <h1 className="text-[24px] sm:text-[28px] font-bold text-[#202223] tracking-tight">
              Welcome to AlignCare, Dr. {doctorLastName}!
            </h1>
            
            <p className="text-[13px] text-[#616161] max-w-[460px] mx-auto leading-relaxed">
              We're thrilled to have you on the clinical team. Please complete your medical credentials before accessing the patient consultation dashboard.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[16px] shadow-sm overflow-hidden">
            
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-[#EAEAEA] bg-[#FAFAFA] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#202020] text-[#FFFFFF] flex items-center justify-center">
                  <UserRound size={15} />
                </div>
                <div>
                  <h2 className="text-[13px] font-semibold text-[#202223]">
                    Professional Details
                  </h2>
                  <p className="text-[11px] text-[#8A8A8A]">
                    Displayed on patient prescriptions and booking slots
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-[6px] bg-[#E3F1DF] text-[#008060] border border-[#C3E6CD]">
                Required
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-[#FCE4E4] border border-[#F5C2C2] text-[#B81818] rounded-[10px] text-[12px] flex items-start gap-2 animate-fade-in">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Specialization Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider flex items-center justify-between">
                  <span>Medical Specialization <span className="text-[#B81818]">*</span></span>
                  <span className="text-[10px] text-[#8A8A8A] font-normal normal-case">Primary clinical focus</span>
                </label>
                <div className="relative">
                  <Stethoscope size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Orthopedic Physiotherapy, Sports Injury Specialist"
                    className="w-full pl-10 pr-3.5 py-2.5 text-[13px] font-medium bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] text-[#202223] placeholder:text-[#A3A3A3] focus:border-[#202223] focus:bg-[#FFFFFF] outline-none shadow-2xs transition-colors"
                    required
                  />
                </div>

                {/* Quick suggestions pills */}
                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#8A8A8A]">Suggestions:</span>
                  {SUGGESTED_SPECIALIZATIONS.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => handleSelectSpecialization(spec)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                        formData.specialization === spec
                          ? 'bg-[#202223] text-[#FFFFFF] border-[#202223] font-medium'
                          : 'bg-[#FFFFFF] text-[#616161] border-[#EAEAEA] hover:border-[#202223] hover:text-[#202223]'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualifications Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider flex items-center justify-between">
                  <span>Medical Qualifications <span className="text-[#B81818]">*</span></span>
                  <span className="text-[10px] text-[#8A8A8A] font-normal normal-case">Degrees, certifications</span>
                </label>
                <div className="relative">
                  <Award size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    placeholder="e.g. BPT, MPT (Ortho), MIAP, PhD"
                    className="w-full pl-10 pr-3.5 py-2.5 text-[13px] font-medium bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] text-[#202223] placeholder:text-[#A3A3A3] focus:border-[#202223] focus:bg-[#FFFFFF] outline-none shadow-2xs transition-colors"
                    required
                  />
                </div>
                <p className="text-[11px] text-[#8A8A8A]">
                  Include relevant physical therapy degrees, master's certifications, or council registrations.
                </p>
              </div>

              {/* Contact Phone Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider flex items-center justify-between">
                  <span>Direct Contact Helpline <span className="text-[#8A8A8A] font-normal normal-case">(Optional)</span></span>
                  <span className="text-[10px] text-[#8A8A8A] font-normal normal-case">Emergency reach</span>
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 text-[13px] font-medium font-mono bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] text-[#202223] placeholder:text-[#A3A3A3] focus:border-[#202223] focus:bg-[#FFFFFF] outline-none shadow-2xs transition-colors"
                  />
                </div>
                <p className="text-[11px] text-[#8A8A8A]">
                  Patients can contact this number if urgent follow-up is needed regarding booked consultations.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[46px] rounded-[10px] bg-[#000000] hover:bg-[#202020] text-[#FFFFFF] text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:bg-[#F4F4F4] disabled:text-[#A3A3A3] disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Medical Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Continue to Clinical Suite</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Compliance & Security Assurance */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-[#8A8A8A]">
            <ShieldCheck size={14} className="text-[#008060]" />
            <span>Encrypted clinical portal · Verified healthcare specialist registration</span>
          </div>

        </div>
      </main>

      {/* ── 3. MINIMAL FOOTER ─────────────────────────────────────────── */}
      <footer className="h-[44px] border-t border-[#EAEAEA] bg-[#FFFFFF] px-4 flex items-center justify-between text-[11px] text-[#8A8A8A]">
        <span>© {new Date().getFullYear()} AlignCare Physical Therapy Systems. All rights reserved.</span>
        <span className="hidden sm:inline">Physiotherapy Clinical Management & Adherence Suite</span>
      </footer>

    </div>
  );
};

export default DoctorOnboarding;
