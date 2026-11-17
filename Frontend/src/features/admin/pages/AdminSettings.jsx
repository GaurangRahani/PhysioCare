import React, { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { 
  Building2, 
  Phone, 
  Mail, 
  User, 
  Edit, 
  Info, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink,
  Server,
  CheckCircle2
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminSettings = () => {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const [clinicInfo, setClinicInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/clinic/info`)
      .then((r) => r.json())
      .then((data) => setClinicInfo(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      
      {/* ── 1. PAGE HEADER ROW ────────────────────────────────────────── */}
      <div className="pb-1">
        <h1 className="text-[20px] font-bold text-[#202223] tracking-tight">
          System & Clinic Settings
        </h1>
        <p className="text-[12px] text-[#616161] mt-0.5">
          Manage administrator profile credentials, clinic identity, and server infrastructure configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* ── 2. ADMINISTRATOR PROFILE CARD ───────────────────────────── */}
        <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F0F0F0]">
              <div className="w-9 h-9 rounded-[8px] bg-[#202020] text-[#FFFFFF] flex items-center justify-center">
                <User size={18} />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-[#202223]">
                  Executive Profile
                </h2>
                <p className="text-[11px] text-[#8A8A8A]">
                  Primary administrator contact & identity
                </p>
              </div>
            </div>

            <div className="space-y-3 text-[13px]">
              {/* Full Name */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Full Name
                </span>
                <div className="font-medium text-[#202223]">
                  {user?.fullName || '—'}
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Email Address
                </span>
                <div className="text-[#202223] flex items-center gap-1.5 font-medium">
                  <Mail size={13} className="text-[#8A8A8A]" />
                  <span>{user?.primaryEmailAddress?.emailAddress || '—'}</span>
                </div>
              </div>

              {/* Public Clinic Contact Phone */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Clinic Public Helpline
                </span>
                <div className="text-[#202223] flex items-center gap-1.5 font-mono">
                  <Phone size={13} className="text-[#008060]" />
                  <span>{user?.primaryPhoneNumber?.phoneNumber || (
                    <span className="text-[#8A8A8A] font-sans text-[12px]">Not set — add via Update Profile</span>
                  )}</span>
                </div>
                <p className="text-[10px] text-[#8A8A8A] mt-0.5 leading-snug">
                  This phone number is displayed on patient dashboards and booking confirmation receipts.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#F0F0F0] flex items-center justify-between">
            <button
              onClick={() => openUserProfile()}
              className="px-3.5 py-2 text-[12px] font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#202020] rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <Edit size={14} />
              <span>Update Profile</span>
            </button>
            <span className="text-[11px] text-[#8A8A8A] flex items-center gap-1">
              <CheckCircle2 size={13} className="text-[#008060]" />
              <span>Clerk Live Sync</span>
            </span>
          </div>
        </div>

        {/* ── 3. CLINIC CONFIGURATION CARD ────────────────────────────── */}
        <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[14px] p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F0F0F0]">
              <div className="w-9 h-9 rounded-[8px] bg-[#F4F4F4] text-[#202223] border border-[#EAEAEA] flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-[#202223]">
                  Clinic Identity & Server
                </h2>
                <p className="text-[11px] text-[#8A8A8A]">
                  Infrastructure-managed environmental variables
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Clinic Name */}
              <div className="p-3 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Registered Clinic Name
                </div>
                <div className="text-[15px] font-bold text-[#202223] tracking-tight">
                  {clinicInfo?.clinic_name || 'AlignCare Physical Therapy'}
                </div>
                <p className="text-[11px] text-[#616161]">
                  Configured via server variable: <code className="bg-[#FFFFFF] border border-[#EAEAEA] px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-[#202223]">CLINIC_NAME</code>
                </p>
              </div>

              {/* Public Phone */}
              <div className="p-3 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Public Support Contact
                </div>
                <div className="text-[15px] font-bold text-[#008060] font-mono">
                  {clinicInfo?.contact_phone || '—'}
                </div>
                <p className="text-[11px] text-[#616161]">
                  Pulled directly from your admin profile phone number in real time.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#F0F0F0]">
            <div className="p-2.5 bg-[#F9FAFB] border border-[#EAEAEA] rounded-[8px] flex items-start gap-2 text-[11px] text-[#616161]">
              <Server size={14} className="shrink-0 text-[#8A8A8A] mt-0.5" />
              <span>
                To modify core clinical brand identity or payment credentials, update the backend environment configuration.
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminSettings;
