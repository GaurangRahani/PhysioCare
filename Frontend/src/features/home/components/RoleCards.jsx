import React from 'react';
import { Link } from 'react-router-dom';
import { User, Stethoscope, Briefcase, Check, ArrowRight } from 'lucide-react';

const RoleCards = () => {
  return (
    <section id="roles" className="py-16 md:py-24 bg-[#FAFAFA] font-['Inter',system-ui,sans-serif] border-b border-[#EAEAEA]">
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 max-w-[1480px]">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-18">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7F2] text-[#008060] text-xs font-semibold uppercase tracking-wider mb-3">
            Ecosystem
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111111] tracking-tight mb-4">
            One Platform, Three Roles
          </h2>
          <p className="text-sm sm:text-base text-[#616161]">
            Every person in the clinic's ecosystem has a dedicated, purpose-built experience.
          </p>
        </div>

        {/* 3 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* ── CARD 1: PATIENT (Green Accent) ────────────────────────────── */}
          <div className="bg-[#FFFFFF] rounded-[20px] p-6 sm:p-8 border border-[#EAEAEA] hover:border-[#008060] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#EBF7F2] text-[#008060] border border-[#BDEBD3] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <User size={24} />
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl sm:text-2xl font-bold text-[#111111]">
                  Patient
                </h3>
                <span className="text-[11px] font-mono text-[#008060] bg-[#EBF7F2] px-2.5 py-0.5 rounded-full font-semibold">
                  Personal Care
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-[#616161] leading-relaxed mb-6">
                Log daily exercises, track your pain levels, view your appointment history, and download official invoices — all from one simple dashboard.
              </p>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 mb-8 text-xs sm:text-sm text-[#404040]">
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#D9F7C3] text-[#245B19] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Daily exercise program with video drills</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#D9F7C3] text-[#245B19] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Pain level (0–10) logging</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#D9F7C3] text-[#245B19] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Appointment booking & scheduling</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#D9F7C3] text-[#245B19] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Direct invoice & receipt history</span>
                </li>
              </ul>
            </div>

            <Link 
              to="/book" 
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold text-[#FFFFFF] bg-[#008060] hover:bg-[#006e52] rounded-[10px] transition-all shadow-xs"
            >
              <span>Book Appointment</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* ── CARD 2: DOCTOR (Blue Accent - Highlighted) ────────────────── */}
          <div className="bg-[#FFFFFF] rounded-[20px] p-6 sm:p-8 border-2 border-[#4088F8] shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative group lg:-translate-y-2">
            
            {/* Top Highlight Badge */}
            <div className="absolute -top-3 right-6 bg-[#4088F8] text-[#FFFFFF] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs font-mono">
              Clinical Core
            </div>

            <div>
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#4088F8] border border-[#BFDBFE] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Stethoscope size={24} />
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl sm:text-2xl font-bold text-[#111111]">
                  Physiotherapist
                </h3>
                <span className="text-[11px] font-mono text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full font-semibold">
                  Doctor Suite
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-[#616161] leading-relaxed mb-6">
                Prescribe exercises with custom videos, review real-time patient compliance, track pain trends, and conduct video consultations.
              </p>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 mb-8 text-xs sm:text-sm text-[#404040]">
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Treatment plan & protocol builder</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Live compliance charts & analytics</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Automated clinical red alerts</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Availability & schedule management</span>
                </li>
              </ul>
            </div>

            <Link 
              to="/doctor-dashboard" 
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold text-[#FFFFFF] bg-[#111111] hover:bg-[#202020] rounded-[10px] transition-all shadow-xs"
            >
              <span>Doctor Portal</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* ── CARD 3: RECEPTIONIST (Amber Accent) ───────────────────────── */}
          <div className="bg-[#FFFFFF] rounded-[20px] p-6 sm:p-8 border border-[#EAEAEA] hover:border-[#F5C451] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div>
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] text-[#B98900] border border-[#FDE68A] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Briefcase size={24} />
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl sm:text-2xl font-bold text-[#111111]">
                  Receptionist
                </h3>
                <span className="text-[11px] font-mono text-[#8A6116] bg-[#FFF2CC] px-2.5 py-0.5 rounded-full font-semibold">
                  Front Desk
                </span>
              </div>

              <p className="text-xs sm:text-[13px] text-[#616161] leading-relaxed mb-6">
                Manage front-desk bookings, handle walk-in patients, take offline payments, and track clinic revenue seamlessly.
              </p>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 mb-8 text-xs sm:text-sm text-[#404040]">
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#FFF2CC] text-[#8A6116] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Unified clinic appointment calendar</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#FFF2CC] text-[#8A6116] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Desk booking & offline cash collection</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#FFF2CC] text-[#8A6116] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>Patient intake & demographic registration</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-[#FFF2CC] text-[#8A6116] flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                  <span>SMS/Email payment link dispatch</span>
                </li>
              </ul>
            </div>

            <Link 
              to="/receptionist" 
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-semibold text-[#202223] bg-[#F4F4F4] hover:bg-[#EAEAEA] rounded-[10px] transition-all"
            >
              <span>Reception Desk</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};

export default RoleCards;
