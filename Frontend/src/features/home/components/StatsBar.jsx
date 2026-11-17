import React from 'react';
import { Users, Activity, Calendar, TrendingUp } from 'lucide-react';

const StatsBar = () => {
  return (
    <section className="w-full bg-[#F9FAFB] py-8 md:py-10 relative z-20 border-y border-[#EAEAEA] font-['Inter',system-ui,sans-serif]">
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 max-w-[1480px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-[#E5E7EB]">
          
          {/* Stat 1: 3 Roles (Blue Accent) */}
          <div className="flex flex-col items-center text-center px-3 sm:px-6 group">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-2xs">
              <Users size={18} />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] tracking-tight mb-1 font-mono">
              3 Roles
            </h3>
            <p className="text-xs sm:text-[13px] text-[#616161] leading-snug">
              Doctor, Patient, Receptionist
            </p>
            <div className="w-12 h-0.5 bg-[#2563EB] mt-2.5 rounded-full" />
          </div>
          
          {/* Stat 2: Daily Tracking (Green Accent) */}
          <div className="flex flex-col items-center text-center px-3 sm:px-6 group">
            <div className="w-10 h-10 rounded-xl bg-[#EBF7F2] text-[#008060] border border-[#BDEBD3] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-2xs">
              <Activity size={18} />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] tracking-tight mb-1 font-mono">
              Daily Tracking
            </h3>
            <p className="text-xs sm:text-[13px] text-[#616161] leading-snug">
              Exercise logs with pain levels
            </p>
            <div className="w-12 h-0.5 bg-[#008060] mt-2.5 rounded-full" />
          </div>
          
          {/* Stat 3: Smart Scheduling (Amber Accent) */}
          <div className="flex flex-col items-center text-center px-3 sm:px-6 group">
            <div className="w-10 h-10 rounded-xl bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-2xs">
              <Calendar size={18} />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] tracking-tight mb-1 font-mono">
              Smart Scheduling
            </h3>
            <p className="text-xs sm:text-[13px] text-[#616161] leading-snug">
              Availability-based booking
            </p>
            <div className="w-12 h-0.5 bg-[#D97706] mt-2.5 rounded-full" />
          </div>
          
          {/* Stat 4: Live Compliance (Teal/Emerald Accent) */}
          <div className="flex flex-col items-center text-center px-3 sm:px-6 group">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-2xs">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] tracking-tight mb-1 font-mono">
              Live Compliance
            </h3>
            <p className="text-xs sm:text-[13px] text-[#616161] leading-snug">
              Real-time progress monitoring
            </p>
            <div className="w-12 h-0.5 bg-[#16A34A] mt-2.5 rounded-full" />
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
