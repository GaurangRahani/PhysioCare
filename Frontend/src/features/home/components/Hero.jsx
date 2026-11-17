import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Activity, Sparkles, TrendingUp, ShieldCheck, Stethoscope, Clock } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-[#FFFFFF] pt-12 md:pt-16 lg:pt-20 pb-16 md:pb-24 font-['Inter',system-ui,sans-serif] border-b border-[#EAEAEA]">
      {/* Background Soft Mesh Ambient Blurs using our palette colors */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#4088F8]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-20 left-10 w-80 h-80 bg-[#A3F56C]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#F5C451]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 max-w-[1480px] relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          
          {/* ── LEFT COLUMN: HERO COPY & CTAs ─────────────────────────────── */}
          <div className="w-full lg:w-[52%] text-left">
            
            {/* Pill Badge with palette accents */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EBF7F2] border border-[#BDEBD3] text-[#008060] text-xs md:text-sm font-semibold mb-6 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#008060] animate-pulse" />
              <span>We Provide All Health Care Solution</span>
            </div>
            
            {/* Headlines */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-[#111111] tracking-tight leading-[1.15] mb-6">
              Protect Your Health <br className="hidden sm:inline" />
              And Take Care Of <br className="hidden sm:inline" />
              <span className="text-[#008060]">Your Health</span>
            </h1>
            
            {/* Body */}
            <p className="text-base sm:text-lg text-[#616161] max-w-xl mb-8 leading-relaxed">
              AlignCare gives doctors a live window into patient recovery between visits — and gives patients a simple daily exercise program they can actually follow.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-8">
              <Link 
                to="/book" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#008060] hover:bg-[#006e52] text-[#FFFFFF] font-semibold text-[14px] rounded-[10px] shadow-md shadow-[#008060]/25 hover:shadow-lg hover:shadow-[#008060]/30 transition-all cursor-pointer active:scale-[0.99]"
              >
                <span>Book Appointment</span>
                <ArrowRight size={16} />
              </Link>

              <a 
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#FFFFFF] hover:bg-[#F9F9F9] text-[#202223] font-semibold text-[14px] rounded-[10px] border border-[#E5E5E5] hover:border-[#CCCCCC] transition-all cursor-pointer"
              >
                <span>How It Works</span>
              </a>
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#F0F0F0]">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#404040]">
                <div className="w-5 h-5 rounded-full bg-[#D9F7C3] text-[#245B19] flex items-center justify-center shrink-0 border border-[#b2e89b]">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span>Doctor-prescribed exercises</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#404040]">
                <div className="w-5 h-5 rounded-full bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center shrink-0 border border-[#BFDBFE]">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span>Daily progress tracking</span>
              </div>
            </div>

          </div>
          
          {/* ── RIGHT COLUMN: CLINICAL DASHBOARD PREVIEW ──────────────────── */}
          <div className="w-full lg:w-[48%] flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[480px]">
              
              {/* Decorative Subtle Palette Glow Behind Card */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#008060] via-[#4088F8] to-[#F5C451] rounded-[24px] opacity-20 blur-xl -z-10" />

              {/* Main Clinical Card */}
              <div className="bg-[#FFFFFF] rounded-[20px] shadow-2xl border border-[#EAEAEA] p-5 sm:p-6 space-y-4">
                
                {/* Card Top Window Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E5484D]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F5C451]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#A3F56C]" />
                    </div>
                    <span className="text-[11px] font-medium text-[#8A8A8A] ml-2 font-mono">
                      AlignCare — Doctor Dashboard
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#245B19] bg-[#D9F7C3] px-2 py-0.5 rounded-full font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#245B19] animate-pulse" /> Live Clinic
                  </span>
                </div>
                
                {/* Active Patient Consultation Row */}
                <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#FBFBFB] border border-[#F0F0F0]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4088F8]/10 text-[#4088F8] border border-[#4088F8]/20 flex items-center justify-center font-bold text-xs">
                      GP
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#111111] text-sm leading-tight">Gaurang Patel</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block bg-[#DBEAFE] text-[#1E40AF] text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider font-mono">
                          Follow-up
                        </span>
                        <span className="text-[11px] text-[#8A8A8A]">Cervical Rehab</span>
                      </div>
                    </div>
                  </div>

                  <Link 
                    to="/login"
                    className="bg-[#111111] hover:bg-[#202020] text-[#FFFFFF] text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                  >
                    Start
                  </Link>
                </div>

                {/* Progress Metric Widget (Blue & Green Accents) */}
                <div className="p-3.5 rounded-[12px] bg-[#F7FAFC] border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#4A5568] flex items-center gap-1.5">
                      <TrendingUp size={13} className="text-[#4088F8]" />
                      Adherence & Recovery Score
                    </span>
                    <span className="font-bold text-[#008060] font-mono text-[13px]">92%</span>
                  </div>

                  {/* Gradient Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#4088F8] to-[#008060] rounded-full w-[92%]" />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#718096] pt-0.5">
                    <span>14 Sessions Prescribed</span>
                    <span className="text-[#245B19] font-medium">13 Completed</span>
                  </div>
                </div>

                {/* Patient Session Item Sample */}
                <div className="p-3 rounded-[12px] bg-[#FFFFFF] border border-[#EAEAEA] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#D9F7C3] text-[#245B19] flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#111111]">Shoulder Flexion</h4>
                      <span className="text-[10px] text-[#8A8A8A]">3 Sets · 10 Reps · Pain: 2/10</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-[#008060] bg-[#E8F8F0] px-2 py-0.5 rounded-full">
                    Done Today
                  </span>
                </div>

              </div>

              {/* Floating Badge (Amber Alert Tag) */}
              <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-[#FFFFFF] border border-[#F5C451]/50 shadow-xl rounded-xl p-2.5 flex items-center gap-2.5 animate-bounce-subtle z-20">
                <div className="w-7 h-7 rounded-lg bg-[#FFF2CC] text-[#8A6116] flex items-center justify-center shrink-0">
                  <Clock size={14} />
                </div>
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-[#8A6116] block tracking-wide">Daily Check-In</span>
                  <span className="text-[11px] font-semibold text-[#111111]">Patient logged on time</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
