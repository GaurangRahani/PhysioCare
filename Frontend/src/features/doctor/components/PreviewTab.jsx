import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2, ChevronLeft, ChevronRight, Info, Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';

const PreviewTab = ({ getToken }) => {
  const { user } = useUser();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    if (selectedDate && user?.id) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, user?.id]);

  const fetchSlots = async (dateStr) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/availability/slots?doctor_id=me&date=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSlots(data.slots || []);
      } else {
        setErrorMsg(data.message || 'Failed to fetch slots.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An error occurred while fetching slots.');
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Generate calendar grid
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const handleDateClick = (day) => {
    if (!day) return;
    const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const todayStr = new Date().toLocaleDateString('en-CA');

  return (
    <div className="flex flex-col gap-6 animate-fade-in font-['Inter',system-ui,sans-serif]">
      
      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive SaaS Calendar (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="saas-card p-5">
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#EAEAEA]">
              <div className="flex items-center gap-2">
                <CalendarIcon size={16} className="text-[#616161]" />
                <span className="text-[15px] font-semibold text-[#202223] tracking-tight">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Previous Month"
                  className="p-1.5 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] text-[#616161] hover:bg-[#F0F0F0] hover:text-[#202223] transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Next Month"
                  className="p-1.5 rounded-lg border border-[#E5E5E5] bg-[#FFFFFF] text-[#616161] hover:bg-[#F0F0F0] hover:text-[#202223] transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                <div key={d} className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days 7-Col Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="h-9 w-full" />;
                }

                const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                const isSelected = selectedDate === dateStr;
                const isToday = todayStr === dateStr;
                const isPast = dateStr < todayStr;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleDateClick(day)}
                    className={`h-9 w-full rounded-lg text-[13px] font-medium flex items-center justify-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#111111] text-[#FFFFFF] font-semibold shadow-sm'
                        : isPast
                        ? 'text-[#8A8A8A] hover:bg-[#F7F7F7] opacity-60'
                        : 'text-[#202223] hover:bg-[#F0F0F0]'
                    } ${isToday && !isSelected ? 'border border-[#202223] font-semibold' : ''}`}
                  >
                    {day}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 bg-[#202223] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick jump to Today button */}
            <div className="mt-4 pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-[12px]">
              <span className="text-[#8A8A8A]">Selected: <strong className="text-[#202223] font-mono">{selectedDate}</strong></span>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  setSelectedDate(now.toLocaleDateString('en-CA'));
                }}
                className="text-[12px] font-medium text-[#2C5E91] hover:underline cursor-pointer"
              >
                Go to Today
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="flex items-start gap-3 p-3.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl text-[12px] text-[#616161]">
            <Info size={16} className="text-[#8A8A8A] shrink-0 mt-0.5" />
            <p className="m-0 leading-relaxed">
              This preview queries the real-time scheduling engine, factoring in recurring weekly shifts, specific date overrides, and existing booked appointments.
            </p>
          </div>
        </div>

        {/* Right Column: Live Slots Visualizer (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="saas-card p-6 min-h-[420px]">
            
            {/* Header with Date & Slot Count Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#EAEAEA]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                  Consultation Slots
                </span>
                <h3 className="text-[16px] font-semibold text-[#202223] tracking-tight mt-0.5 m-0">
                  {formatDateDisplay(selectedDate)}
                </h3>
              </div>

              {!loading && !errorMsg && (
                <div className="flex items-center gap-2">
                  {slots.length > 0 ? (
                    <span className="badge-semantic-success flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium">
                      <CheckCircle2 size={12} /> {slots.length} available slots
                    </span>
                  ) : (
                    <span className="badge-semantic-neutral px-2.5 py-1 text-[12px]">
                      Clinic Closed / Off
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Slots Content Area */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#8A8A8A]">
                <Loader2 className="w-6 h-6 animate-spin text-[#202223]" />
                <span className="text-[13px]">Computing available slots...</span>
              </div>
            ) : errorMsg ? (
              <div className="p-4 bg-[#FCE4E4] border border-[#E5E5E5] rounded-xl text-[#B42318] text-[13px]">
                {errorMsg}
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-[#F0F0F0] border border-[#E5E5E5] flex items-center justify-center mb-3 text-[#8A8A8A]">
                  <Clock size={20} />
                </div>
                <h4 className="text-[15px] font-semibold text-[#202223] m-0">No Slots Available</h4>
                <p className="text-[13px] text-[#616161] mt-1.5 mb-4 leading-normal">
                  You are marked as off, on full-day leave, or all shifts are fully booked for this date.
                </p>
                <div className="text-[12px] text-[#8A8A8A] bg-[#F7F7F7] px-3 py-1.5 rounded-lg border border-[#E5E5E5]">
                  Tip: Check your <strong className="text-[#202223]">Weekly Routine</strong> or <strong className="text-[#202223]">Date Overrides</strong> tabs.
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[13px] text-[#616161] mb-4">
                  The following consultation time slots are currently open for booking:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {slots.map((time, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#FFFFFF] hover:bg-[#F7F7F7] border border-[#E5E5E5] hover:border-[#202223] rounded-lg text-[13px] font-mono text-[#202223] font-medium transition-all shadow-xs cursor-default"
                    >
                      <Clock size={13} className="text-[#8A8A8A]" />
                      <span>{time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default PreviewTab;
