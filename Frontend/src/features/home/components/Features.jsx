import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Smartphone, 
  Sliders, 
  ArrowRight,
  ShieldAlert,
  CalendarCheck
} from 'lucide-react';

const Features = () => {
  return (
    <section id="features" className="py-16 md:py-24 bg-[#FFFFFF] font-['Inter',system-ui,sans-serif] border-b border-[#EAEAEA] relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-[#4088F8]/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-[#008060]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 max-w-[1480px]">
        
        {/* ── ROW 1: Smart Exercise Tracking (Patient View) ────────────────── */}
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 mb-20 md:mb-28">
          
          {/* Left Text */}
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7F2] text-[#008060] text-xs font-semibold uppercase tracking-wider mb-4">
              Patient Experience
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111111] tracking-tight mb-4 leading-tight">
              Smart Exercise Tracking <br className="hidden sm:inline" />
              For Patients
            </h2>
            <p className="text-sm sm:text-base text-[#616161] mb-6 leading-relaxed">
              Patients log every session directly from their phone. Sets completed, pain level on a 0-10 scale, personal comments, and concerns — all synchronized in real-time against each prescribed treatment plan.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#D9F7C3] text-[#245B19] flex items-center justify-center shrink-0">
                  <CheckCircle2 size={13} />
                </div>
                <span className="text-xs sm:text-sm text-[#404040]">Touch-friendly set counter with reps logging</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FFF2CC] text-[#8A6116] flex items-center justify-center shrink-0">
                  <Sliders size={13} />
                </div>
                <span className="text-xs sm:text-sm text-[#404040]">Visual pain scale (0–10) with symptom triggers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center shrink-0">
                  <CalendarCheck size={13} />
                </div>
                <span className="text-xs sm:text-sm text-[#404040]">Automatic session completion feedback</span>
              </div>
            </div>
            
            <Link 
              to="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-[#202020] text-[#FFFFFF] font-semibold text-xs sm:text-sm rounded-[8px] transition-colors cursor-pointer shadow-xs"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </Link>
          </div>
          
          {/* Right Visual: Mobile Device Simulation */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-[340px] bg-[#111111] p-3 rounded-[36px] shadow-2xl border-4 border-[#222222]">
              {/* Dynamic Island Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#000000] rounded-full z-20" />

              {/* Screen Container */}
              <div className="bg-[#FFFFFF] rounded-[28px] overflow-hidden pt-8 pb-5 px-4 space-y-3.5 border border-[#EAEAEA]">
                
                {/* Screen Header */}
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-2.5">
                  <div>
                    <span className="text-[10px] text-[#8A8A8A] uppercase font-mono">Today's Session</span>
                    <h4 className="text-sm font-bold text-[#111111]">Neck & Shoulder Stretch</h4>
                  </div>
                  <span className="text-[10px] bg-[#EBF7F2] text-[#008060] font-mono px-2 py-0.5 rounded-full font-semibold">
                    Step 1 of 3
                  </span>
                </div>

                {/* Video Placeholder Box */}
                <div className="h-36 rounded-xl bg-[#0A0A0A] text-[#FFFFFF] flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-[#008060] flex items-center justify-center text-white shadow-md">
                    ▶
                  </div>
                  <span className="text-[10px] text-[#A0A0A0] mt-2 font-mono">Video Demonstration · 1:05</span>
                </div>

                {/* Sets Completed Widget */}
                <div className="p-3 bg-[#F9F9F9] rounded-xl border border-[#EEEEEE] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#111111]">Sets Completed (Goal: 3)</span>
                    <span className="text-[#008060] font-mono font-bold">2 / 3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 py-1 bg-[#008060] text-white rounded text-center text-xs font-bold">1 ✓</div>
                    <div className="flex-1 py-1 bg-[#008060] text-white rounded text-center text-xs font-bold">2 ✓</div>
                    <div className="flex-1 py-1 bg-[#FFFFFF] border border-[#CCCCCC] text-[#888888] rounded text-center text-xs font-bold">3</div>
                  </div>
                </div>

                {/* Pain Level Pill */}
                <div className="p-2.5 bg-[#FFFDF5] border border-[#FDE68A] rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#8A6116] font-medium">Pain Level:</span>
                  <span className="font-mono font-bold text-[#8A6116] bg-[#FFF2CC] px-2 py-0.5 rounded">2 / 10 · Mild</span>
                </div>

                {/* Complete Button */}
                <button className="w-full py-2 bg-[#008060] text-white text-xs font-bold rounded-lg shadow-sm">
                  Complete Exercise ✓
                </button>

              </div>
            </div>
          </div>
          
        </div>

        {/* ── ROW 2: Complete Compliance Dashboard (Doctor View) ────────────── */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-10 lg:gap-16">
          
          {/* Left Visual: Clinical Dashboard Mockup */}
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="w-full max-w-[460px] bg-[#FFFFFF] rounded-[20px] shadow-xl border border-[#EAEAEA] p-5 space-y-4">
              
              {/* Doctor Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#4088F8]/10 text-[#4088F8] border border-[#4088F8]/20 flex items-center justify-center font-bold text-xs">
                    DR
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#111111]">Clinical Compliance Overview</h4>
                    <span className="text-[10px] text-[#8A8A8A]">Active Patient Roster</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-[#F4F4F4] p-0.5 rounded-md text-[10px] font-mono">
                  <span className="px-2 py-0.5 bg-[#FFFFFF] rounded text-[#111111] font-semibold shadow-2xs">7 Days</span>
                  <span className="px-2 py-0.5 text-[#8A8A8A]">30 Days</span>
                </div>
              </div>

              {/* Patient Alert Box (Red Alert Theme) */}
              <div className="p-3 bg-[#FFF8F8] border border-[#F5C2C2] rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FCE4E4] text-[#B42318] flex items-center justify-center shrink-0">
                    <AlertTriangle size={14} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#B42318] block leading-tight">Pain Spike Alert</span>
                    <span className="text-[10px] text-[#8A8A8A]">Gaurang reported Pain 8/10 on Knee Extension</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#B42318] bg-[#FCE4E4] px-2 py-0.5 rounded-full shrink-0">
                  Review
                </span>
              </div>

              {/* Progress Breakdown Bars */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-[#404040]">Knee Extension Rehab</span>
                    <span className="text-[#008060] font-mono font-bold">95%</span>
                  </div>
                  <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#008060] rounded-full w-[95%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-[#404040]">Cervical Rotation</span>
                    <span className="text-[#4088F8] font-mono font-bold">82%</span>
                  </div>
                  <div className="w-full h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#4088F8] rounded-full w-[82%]" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Text */}
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#1D4ED8] text-xs font-semibold uppercase tracking-wider mb-4">
              Clinician Dashboard
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111111] tracking-tight mb-4 leading-tight">
              Complete Compliance <br className="hidden sm:inline" />
              Monitoring
            </h2>
            <p className="text-sm sm:text-base text-[#616161] mb-6 leading-relaxed">
              Clinicians get complete visibility into adherence rates and symptom flares before patients step into the clinic. No more relying on patient memory — access exact historical records with precise date logs.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center shrink-0">
                  <TrendingUp size={13} />
                </div>
                <span className="text-xs sm:text-sm text-[#404040]">Live 7-day, 14-day & all-time compliance graphs</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FCE4E4] text-[#B42318] flex items-center justify-center shrink-0">
                  <ShieldAlert size={13} />
                </div>
                <span className="text-xs sm:text-sm text-[#404040]">Instant Clinical Red Alerts for sudden pain spikes</span>
              </div>
            </div>

            <Link 
              to="/doctor-dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#008060] hover:bg-[#006e52] text-[#FFFFFF] font-semibold text-xs sm:text-sm rounded-[8px] transition-colors cursor-pointer shadow-xs"
            >
              <span>Explore Doctor Suite</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Features;
