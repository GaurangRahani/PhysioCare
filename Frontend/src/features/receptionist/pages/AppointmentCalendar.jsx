import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Plus, 
  Calendar as CalendarIcon, 
  X, 
  User, 
  Stethoscope, 
  Clock, 
  Check
} from 'lucide-react';
import BookAppointmentModal from '../components/BookAppointmentModal';

const DOCTOR_COLORS = [
  { bg: 'bg-[#4088F8]/10', border: 'border-[#4088F8]/30', text: 'text-[#2F68D6]', bar: 'bg-[#4088F8]', dot: '#4088F8' },
  { bg: 'bg-[#202223]/10', border: 'border-[#202223]/30', text: 'text-[#202223]', bar: 'bg-[#202223]', dot: '#202223' },
  { bg: 'bg-[#F5C451]/15', border: 'border-[#F5C451]/40', text: 'text-[#B25E09]', bar: 'bg-[#F5C451]', dot: '#F5C451' },
  { bg: 'bg-[#7C3AED]/10', border: 'border-[#7C3AED]/30', text: 'text-[#6D28D9]', bar: 'bg-[#7C3AED]', dot: '#7C3AED' },
  { bg: 'bg-[#EC4899]/10', border: 'border-[#EC4899]/30', text: 'text-[#DB2777]', bar: 'bg-[#EC4899]', dot: '#EC4899' },
];

const AppointmentCalendar = () => {
  const { getToken } = useAuth();
  
  // Current week start (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeView, setActiveView] = useState('week');
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [doctorFilter, setDoctorFilter] = useState('all');
  
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Overflow Modal
  const [overflowData, setOverflowData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [currentWeekStart, getToken]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endDateObj = new Date(currentWeekStart);
      endDateObj.setDate(endDateObj.getDate() + 6);

      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const [apptsRes, docsRes] = await Promise.all([
        fetch(`${apiUrl}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/doctors`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const apptsData = await apptsRes.json();
      const docsData = await docsRes.json();
      
      if (apptsData.success && docsData.success) {
        const weekAppts = (apptsData.appointments || []).filter(a => {
          const aDate = new Date(a.appointment_date);
          const isThisWeek = aDate >= currentWeekStart && aDate <= endDateObj;
          const isActive = !['cancelled', 'no_show'].includes(a.status);
          return isThisWeek && isActive;
        });
        setAppointments(weekAppts);
        setDoctors(docsData.doctors || []);
      } else {
        setError(apptsData.message || docsData.message || 'Failed to fetch calendar data.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getDoctorTheme = (doctorId) => {
    const index = doctors.findIndex(d => d.id === doctorId);
    if (index === -1) return DOCTOR_COLORS[0];
    return DOCTOR_COLORS[index % DOCTOR_COLORS.length];
  };

  const nextTime = () => {
    if (activeView === 'week') {
      const next = new Date(currentWeekStart);
      next.setDate(next.getDate() + 7);
      setCurrentWeekStart(next);
    } else {
      const next = new Date(selectedDay);
      next.setDate(next.getDate() + 1);
      setSelectedDay(next);
      const day = next.getDay();
      const diff = next.getDate() - day + (day === 0 ? -6 : 1);
      setCurrentWeekStart(new Date(new Date(next).setDate(diff)));
    }
  };

  const prevTime = () => {
    if (activeView === 'week') {
      const prev = new Date(currentWeekStart);
      prev.setDate(prev.getDate() - 7);
      setCurrentWeekStart(prev);
    } else {
      const prev = new Date(selectedDay);
      prev.setDate(prev.getDate() - 1);
      setSelectedDay(prev);
      const day = prev.getDay();
      const diff = prev.getDate() - day + (day === 0 ? -6 : 1);
      setCurrentWeekStart(new Date(new Date(prev).setDate(diff)));
    }
  };

  const goToToday = () => {
    const d = new Date();
    setSelectedDay(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(new Date(d).setDate(diff)));
  };

  // Generate 7 days for current week
  const weekDays = [];
  const tempDate = new Date(currentWeekStart);
  for (let i = 0; i < 7; i++) {
    weekDays.push(new Date(tempDate));
    tempDate.setDate(tempDate.getDate() + 1);
  }

  // Pre-defined time slots: 09:00 to 17:00
  const timeSlots = [];
  for (let h = 9; h <= 17; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00:00`);
    if (h < 17) {
      timeSlots.push(`${String(h).padStart(2, '0')}:30:00`);
    }
  }

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getDayShortName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const handleCellClick = () => {
    setIsBookModalOpen(true);
  };

  const handleAppointmentClick = (e, appt) => {
    e.stopPropagation();
    setSelectedAppointment(appt);
  };

  const handleOverflowClick = (e, dayAppts, timeString, dayName) => {
    e.stopPropagation();
    setOverflowData({ appointments: dayAppts, time: formatTime(timeString), day: dayName });
  };

  const closeDrawer = () => setSelectedAppointment(null);
  const closeOverflowModal = () => setOverflowData(null);

  const filteredAppointments = appointments.filter(a => {
    if (doctorFilter === 'all') return true;
    return a.doctor_id === doctorFilter;
  });

  return (
    <div className="space-y-4">
      
      {/* ── 1. HEADER SECTION ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6D7175] bg-[#F4F4F4] px-2.5 py-0.5 rounded-full">
              <CalendarIcon className="w-3 h-3 text-[#8A8A8A]" />
              {activeView === 'week' ? (
                <span>
                  {currentWeekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {weekDays[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              ) : (
                <span>
                  {selectedDay.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202223]">
            Clinical Schedule
          </h1>
        </div>

        {/* Calendar Nav & CTAs */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Prev / Today / Next */}
          <div className="inline-flex items-center rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] shadow-sm overflow-hidden text-xs font-medium">
            <button
              type="button"
              onClick={prevTime}
              className="p-2 hover:bg-[#F9FAFB] text-[#202223] transition-colors border-r border-[#EAEAEA]"
              title="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 hover:bg-[#F9FAFB] text-[#202223] transition-colors font-semibold"
            >
              Today
            </button>
            <button
              type="button"
              onClick={nextTime}
              className="p-2 hover:bg-[#F9FAFB] text-[#202223] transition-colors border-l border-[#EAEAEA]"
              title="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Week / Day View Toggle */}
          <div className="inline-flex p-0.5 rounded-lg bg-[#F4F4F4] text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveView('week')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeView === 'week' ? 'bg-[#FFFFFF] text-[#202223] shadow-sm font-semibold' : 'text-[#6D7175] hover:text-[#202223]'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setActiveView('day')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeView === 'day' ? 'bg-[#FFFFFF] text-[#202223] shadow-sm font-semibold' : 'text-[#6D7175] hover:text-[#202223]'
              }`}
            >
              Day
            </button>
          </div>

          {/* Book Appointment CTA (Using near-black primary saas button) */}
          <button
            type="button"
            onClick={() => setIsBookModalOpen(true)}
            className="btn-primary-saas flex items-center gap-1.5 text-[12px] sm:text-[13px] py-1.5 px-3.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* ── 2. DOCTOR FILTER CHIPS ───────────────────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#EAEAEA] p-3 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-semibold text-[#8A8A8A] shrink-0 mr-1">Doctors:</span>
        
        <button
          type="button"
          onClick={() => setDoctorFilter('all')}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            doctorFilter === 'all'
              ? 'bg-[#0A0A0A] text-white font-semibold shadow-sm'
              : 'bg-[#F4F4F4] text-[#6D7175] hover:text-[#202223] hover:bg-[#EAEAEA]'
          }`}
        >
          {doctorFilter === 'all' && <Check className="w-3 h-3 text-white" />}
          <span>All Doctors ({doctors.length})</span>
        </button>

        {doctors.map((doc, idx) => {
          const theme = DOCTOR_COLORS[idx % DOCTOR_COLORS.length];
          const isActive = doctorFilter === doc.id;
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => setDoctorFilter(doc.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#202223] text-white border-[#202223] font-semibold shadow-sm'
                  : 'bg-white border-[#EAEAEA] text-[#6D7175] hover:text-[#202223] hover:border-[#D1D1D1]'
              }`}
            >
              <span 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ backgroundColor: theme.dot }}
              />
              <span>Dr. {doc.name?.split(' ')[0] || 'Doctor'}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. CALENDAR GRID ────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#EAEAEA] shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-[#202223] animate-spin" />
            <span className="text-xs text-[#8A8A8A]">Loading schedule...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-[#B42318] bg-[#FEF3F2]">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              
              {/* Header Row */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-[#EAEAEA] bg-[#F9FAFB] sticky top-0 z-10">
                <div className="p-2.5 text-center text-[11px] font-semibold text-[#8A8A8A] border-r border-[#EAEAEA]">
                  Time
                </div>

                {activeView === 'week' ? (
                  weekDays.map((date, idx) => {
                    const todayFlag = isToday(date);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => {
                          setSelectedDay(date);
                          setActiveView('day');
                        }}
                        className={`p-2.5 text-center border-r border-[#EAEAEA] last:border-r-0 cursor-pointer hover:bg-[#F4F4F4] transition-colors ${
                          todayFlag ? 'bg-[#F4F4F4]' : ''
                        }`}
                      >
                        <div className="text-[11px] font-medium text-[#6D7175] uppercase tracking-wider">
                          {getDayShortName(date)}
                        </div>
                        <div className={`mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          todayFlag ? 'bg-[#0A0A0A] text-white shadow-sm' : 'text-[#202223]'
                        }`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  doctors.map((doc, idx) => {
                    const theme = DOCTOR_COLORS[idx % DOCTOR_COLORS.length];
                    return (
                      <div key={doc.id} className="p-2.5 text-center border-r border-[#EAEAEA] last:border-r-0">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${theme.bg} ${theme.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${theme.bar}`} />
                          Dr. {doc.name?.split(' ')[0] || 'Doctor'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Grid Body */}
              <div className="divide-y divide-[#EAEAEA]">
                {timeSlots.map((time) => {
                  const timeLabel = time.substring(0, 5);
                  return (
                    <div 
                      key={time} 
                      className={`grid ${activeView === 'week' ? 'grid-cols-[80px_repeat(7,1fr)]' : `grid-cols-[80px_repeat(${doctors.length || 1},1fr)]`} min-h-[52px]`}
                    >
                      <div className="p-2 text-center text-[11px] font-mono font-medium text-[#8A8A8A] border-r border-[#EAEAEA] bg-[#F9FAFB]/50 flex items-center justify-center">
                        {timeLabel}
                      </div>

                      {activeView === 'week' ? (
                        weekDays.map((date, idx) => {
                          const dateStr = date.toISOString().split('T')[0];
                          const dayAppts = filteredAppointments.filter(
                            a => a.appointment_date?.split('T')[0] === dateStr && a.start_time === time
                          );

                          return (
                            <div 
                              key={idx}
                              onClick={handleCellClick}
                              className="relative p-1 border-r border-[#EAEAEA] last:border-r-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer group flex flex-col gap-1 min-h-[52px]"
                            >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-[10px] font-bold text-[#202223] bg-white px-2 py-0.5 rounded shadow-sm border border-[#EAEAEA]">
                                  + Book
                                </span>
                              </div>

                              {dayAppts.length <= 2 ? (
                                dayAppts.map((appt) => {
                                  const theme = getDoctorTheme(appt.doctor_id);
                                  return (
                                    <div
                                      key={appt.id}
                                      onClick={(e) => handleAppointmentClick(e, appt)}
                                      className={`relative z-10 p-1.5 rounded-md border text-left cursor-pointer transition-all hover:shadow-sm ${theme.bg} ${theme.border}`}
                                    >
                                      <div className={`text-[11px] font-bold leading-tight truncate ${theme.text}`}>
                                        {appt.patient_name || 'Patient'}
                                      </div>
                                      <div className="text-[9px] text-[#6D7175] truncate mt-0.5">
                                        Dr. {appt.doctor_name?.split(' ')[0]}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <>
                                  <div
                                    onClick={(e) => handleAppointmentClick(e, dayAppts[0])}
                                    className={`relative z-10 p-1.5 rounded-md border text-left cursor-pointer ${getDoctorTheme(dayAppts[0].doctor_id).bg} ${getDoctorTheme(dayAppts[0].doctor_id).border}`}
                                  >
                                    <div className="text-[11px] font-bold leading-tight truncate text-[#202223]">
                                      {dayAppts[0].patient_name || 'Patient'}
                                    </div>
                                    <div className="text-[9px] text-[#6D7175] truncate">
                                      Dr. {dayAppts[0].doctor_name?.split(' ')[0]}
                                    </div>
                                  </div>
                                  <div
                                    onClick={(e) => handleOverflowClick(e, dayAppts, time, getDayShortName(date))}
                                    className="relative z-10 text-[10px] font-semibold text-[#4088F8] bg-[#4088F8]/10 hover:bg-[#4088F8]/20 px-1.5 py-0.5 rounded text-center cursor-pointer transition-colors"
                                  >
                                    +{dayAppts.length - 1} More
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        doctors.map((doc) => {
                          const selectedDayStr = selectedDay.toISOString().split('T')[0];
                          const docAppts = filteredAppointments.filter(
                            a => a.appointment_date?.split('T')[0] === selectedDayStr && 
                                 a.start_time === time && 
                                 a.doctor_id === doc.id
                          );

                          const theme = getDoctorTheme(doc.id);

                          return (
                            <div 
                              key={doc.id}
                              onClick={handleCellClick}
                              className="relative p-1 border-r border-[#EAEAEA] last:border-r-0 hover:bg-[#F9FAFB] transition-colors cursor-pointer group flex flex-col gap-1 min-h-[52px]"
                            >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <span className="text-[10px] font-bold text-[#202223] bg-white px-2 py-0.5 rounded shadow-sm border border-[#EAEAEA]">
                                  + Book
                                </span>
                              </div>

                              {docAppts.map((appt) => (
                                <div
                                  key={appt.id}
                                  onClick={(e) => handleAppointmentClick(e, appt)}
                                  className={`relative z-10 p-1.5 rounded-md border text-left cursor-pointer transition-all hover:shadow-sm ${theme.bg} ${theme.border}`}
                                >
                                  <div className={`text-[11px] font-bold leading-tight truncate ${theme.text}`}>
                                    {appt.patient_name || 'Patient'}
                                  </div>
                                  <div className="text-[9px] text-[#6D7175] truncate mt-0.5">
                                    {appt.reason || 'General Checkup'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── 4. APPOINTMENT DETAIL SLIDE-OVER DRAWER ─────────────────── */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={closeDrawer} 
          />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#EAEAEA] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between bg-[#F9FAFB]">
              <div>
                <h3 className="text-base font-bold text-[#202223]">Appointment Details</h3>
                <span className="text-xs text-[#6D7175]">Ref ID: #{selectedAppointment.id?.slice(0, 8)}</span>
              </div>
              <button 
                type="button"
                onClick={closeDrawer}
                className="p-1 rounded-md text-[#8A8A8A] hover:text-[#202223] hover:bg-[#EAEAEA] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#EAEAEA] space-y-3">
                <div>
                  <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider block mb-0.5">Patient</span>
                  <span className="text-base font-bold text-[#202223]">{selectedAppointment.patient_name || 'Patient'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EAEAEA]">
                  <div>
                    <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider block mb-0.5">Date</span>
                    <span className="text-xs font-medium text-[#202223]">
                      {new Date(selectedAppointment.appointment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider block mb-0.5">Time</span>
                    <span className="text-xs font-bold text-[#202223] font-mono">
                      {formatTime(selectedAppointment.start_time)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#EAEAEA]">
                  <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider block mb-0.5">Assigned Practitioner</span>
                  <span className="text-xs font-semibold text-[#2F68D6] flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" />
                    Dr. {selectedAppointment.doctor_name || 'Doctor'}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">Status</span>
                  <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#2F68D6]">
                    {selectedAppointment.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {selectedAppointment.reason && (
                <div className="p-3 rounded-lg border border-[#EAEAEA] bg-white">
                  <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider block mb-1">Visit Reason</span>
                  <p className="text-xs text-[#202223]">{selectedAppointment.reason}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#F9FAFB] border-t border-[#EAEAEA] flex flex-col gap-2">
              <button 
                type="button"
                onClick={closeDrawer}
                className="btn-primary-saas w-full justify-center text-[12px] py-2"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. OVERFLOW MODAL ────────────────────────────────────────── */}
      {overflowData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeOverflowModal} />
          <div className="relative bg-white rounded-2xl max-w-sm w-full shadow-2xl p-5 border border-[#EAEAEA] z-10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
              <h3 className="text-sm font-bold text-[#202223]">
                Appointments ({overflowData.day} {overflowData.time})
              </h3>
              <button type="button" onClick={closeOverflowModal} className="text-[#8A8A8A] hover:text-[#202223]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {overflowData.appointments.map((appt) => {
                const theme = getDoctorTheme(appt.doctor_id);
                return (
                  <div
                    key={appt.id}
                    onClick={(e) => {
                      closeOverflowModal();
                      handleAppointmentClick(e, appt);
                    }}
                    className={`p-2.5 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${theme.bg} ${theme.border}`}
                  >
                    <div className="text-xs font-bold text-[#202223]">{appt.patient_name || 'Patient'}</div>
                    <div className="text-[11px] text-[#6D7175]">Dr. {appt.doctor_name?.split(' ')[0]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      <BookAppointmentModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
        onBooked={() => fetchData()} 
      />

    </div>
  );
};

export default AppointmentCalendar;
