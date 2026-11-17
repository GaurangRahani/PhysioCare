import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  ChevronDown, 
  ArrowRight, 
  User, 
  Clock,
  Sparkles
} from 'lucide-react';

const AlertSection = ({ alerts = [], onReview, formatTime }) => {
  const [urgentOpen, setUrgentOpen] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(true);

  if (!alerts || alerts.length === 0) return null;

  const urgentAlerts = alerts.filter(a => a.alert_level === 'red');
  const reviewAlerts = alerts.filter(a => a.alert_level === 'yellow');

  const getInitials = (name) => {
    if (!name) return 'PT';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-3 w-full font-['Inter',system-ui,sans-serif]">
      
      {/* ── 1. URGENT RED ALERTS ACCORDION ───────────────────────────────── */}
      {urgentAlerts.length > 0 && (
        <div className="bg-[#FFF8F8] border border-[#F5C2C2] rounded-xl overflow-hidden shadow-xs transition-all">
          {/* Header */}
          <div 
            onClick={() => setUrgentOpen(!urgentOpen)}
            className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-[#FEECEC]/50 transition-colors select-none"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-lg bg-[#FCE4E4] text-[#B42318] flex items-center justify-center shrink-0 border border-[#F5C2C2]">
                <AlertTriangle size={16} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[14px] font-semibold text-[#B42318] m-0 tracking-tight">
                    Urgent Action Required
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FCE4E4] text-[#B42318] border border-[#F5C2C2] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] animate-ping" />
                    {urgentAlerts.length} {urgentAlerts.length === 1 ? 'Alert' : 'Alerts'}
                  </span>
                </div>
                <p className="text-[12px] text-[#8A8A8A] mt-0.5 m-0 truncate">
                  Patients reporting acute new symptoms or severe pain thresholds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] text-[#8A8A8A] font-medium hidden sm:inline">
                {urgentOpen ? 'Hide' : 'Show'}
              </span>
              <div className="p-1 rounded-md text-[#8A8A8A]">
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-200 ${urgentOpen ? 'rotate-180' : ''}`} 
                />
              </div>
            </div>
          </div>

          {/* Body */}
          {urgentOpen && (
            <div className="border-t border-[#F5C2C2] p-3 sm:p-4 space-y-2.5 bg-[#FFFFFF]/60">
              {urgentAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="p-3.5 bg-[#FFFFFF] border border-[#F5C2C2] hover:border-[#E5484D] rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  {/* Left: Patient info & concern message */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {getInitials(alert.patient_name)}
                      </div>
                      <span className="font-semibold text-[13px] text-[#202223] truncate">
                        {alert.patient_name}
                      </span>
                      <span className="text-[#E0E0E0]">·</span>
                      <span className="text-[11px] text-[#8A8A8A] font-mono shrink-0 flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime ? formatTime(alert.log_date) : 'Recently'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FCE4E4] text-[#B42318] border border-[#F5C2C2]">
                        {alert.message || 'Severe Clinical Concern'}
                      </span>
                      {alert.comments && (
                        <span className="text-[12px] text-[#616161] italic bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#EAEAEA] truncate max-w-[280px] sm:max-w-[420px]">
                          “{alert.comments}”
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Review Action Button */}
                  <button 
                    type="button"
                    onClick={() => onReview(alert)}
                    className="self-start sm:self-center px-3 py-1.5 bg-[#B42318] hover:bg-[#991B1B] text-[#FFFFFF] rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    <span>Review Alert</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 2. REVIEW YELLOW ALERTS ACCORDION ─────────────────────────────── */}
      {reviewAlerts.length > 0 && (
        <div className="bg-[#FFFDF5] border border-[#FDE68A] rounded-xl overflow-hidden shadow-xs transition-all">
          {/* Header */}
          <div 
            onClick={() => setReviewOpen(!reviewOpen)}
            className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-[#FEF3C7]/40 transition-colors select-none"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0 border border-[#FDE68A]">
                <AlertCircle size={16} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[14px] font-semibold text-[#92400E] m-0 tracking-tight">
                    Routine Follow-up Needed
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                    {reviewAlerts.length} {reviewAlerts.length === 1 ? 'Alert' : 'Alerts'}
                  </span>
                </div>
                <p className="text-[12px] text-[#8A8A8A] mt-0.5 m-0 truncate">
                  Patients reporting moderate exercise difficulty or adjustment inquiries.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] text-[#8A8A8A] font-medium hidden sm:inline">
                {reviewOpen ? 'Hide' : 'Show'}
              </span>
              <div className="p-1 rounded-md text-[#8A8A8A]">
                <ChevronDown 
                  size={16} 
                  className={`transition-transform duration-200 ${reviewOpen ? 'rotate-180' : ''}`} 
                />
              </div>
            </div>
          </div>

          {/* Body */}
          {reviewOpen && (
            <div className="border-t border-[#FDE68A] p-3 sm:p-4 space-y-2.5 bg-[#FFFFFF]/60">
              {reviewAlerts.map(alert => (
                <div 
                  key={alert.id}
                  className="p-3.5 bg-[#FFFFFF] border border-[#FDE68A] hover:border-[#F59E0B] rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {getInitials(alert.patient_name)}
                      </div>
                      <span className="font-semibold text-[13px] text-[#202223] truncate">
                        {alert.patient_name}
                      </span>
                      <span className="text-[#E0E0E0]">·</span>
                      <span className="text-[11px] text-[#8A8A8A] font-mono shrink-0 flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime ? formatTime(alert.log_date) : 'Recently'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                        {alert.message || 'Routine Concern'}
                      </span>
                      {alert.comments && (
                        <span className="text-[12px] text-[#616161] italic bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#EAEAEA] truncate max-w-[280px] sm:max-w-[420px]">
                          “{alert.comments}”
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => onReview(alert)}
                    className="self-start sm:self-center px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F7F7F7] border border-[#D5D5D5] text-[#202223] rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    <span>Review Alert</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AlertSection;