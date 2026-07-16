import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import BookAppointmentModal from '../components/BookAppointmentModal';
import ViewAppointmentModal from '../components/ViewAppointmentModal';

const AppointmentCalendar = () => {
  const { getToken } = useAuth();
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(); // 0 is Sunday, 1 is Monday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to get Monday
    return new Date(d.setDate(diff));
  });

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [viewAppointment, setViewAppointment] = useState(null);

  useEffect(() => {
    fetchWeekAppointments();
  }, [currentWeekStart, getToken]);

  const fetchWeekAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const startDateStr = currentWeekStart.toISOString().split('T')[0];
      const endDateObj = new Date(currentWeekStart);
      endDateObj.setDate(endDateObj.getDate() + 6);
      const endDateStr = endDateObj.toISOString().split('T')[0];

      const token = await getToken();
      
      // Ideally we'd pass a range to /api/appointments?start=...&end=...
      // but right now it seems to only support ?date=today or all. 
      // Let's assume the controller returns all if no date is passed, or we can filter client-side for MVP.
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Filter client-side to only include active appointments in this week
        const weekAppts = data.appointments.filter(a => {
          const aDate = new Date(a.appointment_date);
          const isThisWeek = aDate >= currentWeekStart && aDate <= endDateObj;
          const isActive = !['cancelled', 'no_show'].includes(a.status);
          return isThisWeek && isActive;
        });
        setAppointments(weekAppts);
      } else {
        setError(data.message || 'Failed to fetch appointments.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const nextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  // Generate the 7 days of the current week
  const weekDays = [];
  let tempDate = new Date(currentWeekStart);
  for (let i = 0; i < 7; i++) {
    weekDays.push(new Date(tempDate));
    tempDate.setDate(tempDate.getDate() + 1);
  }

  // Pre-defined time slots for the grid (e.g. 09:00 to 17:00)
  const timeSlots = [];
  for (let h = 9; h <= 17; h++) {
    timeSlots.push(`${String(h).padStart(2, '0')}:00:00`);
    timeSlots.push(`${String(h).padStart(2, '0')}:30:00`);
  }

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <BookAppointmentModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
        onBooked={() => fetchWeekAppointments()} 
      />

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-heading">Calendar</h2>
            <p className="text-sm font-semibold text-gray-400">
              {currentWeekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - 
              {weekDays[6].toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
            <button onClick={prevWeek} className="p-2 hover:bg-white rounded-md transition-colors"><ChevronLeft className="w-5 h-5"/></button>
            <button onClick={() => setCurrentWeekStart(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)))} className="px-4 font-bold text-sm hover:bg-white rounded-md transition-colors">Today</button>
            <button onClick={nextWeek} className="p-2 hover:bg-white rounded-md transition-colors"><ChevronRight className="w-5 h-5"/></button>
          </div>
          <button onClick={() => setIsBookModalOpen(true)} className="flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-4 rounded-lg shadow-sm hover:bg-dark transition-all">
            <Plus className="w-4 h-4"/> New Appointment
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[600px]">
        {loading ? (
           <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 text-primary animate-spin"/></div>
        ) : error ? (
           <div className="p-8 text-center text-danger">{error}</div>
        ) : (
          <div className="flex-1 flex flex-col">
            
            {/* Days Header Row */}
            <div className="flex border-b border-gray-100 bg-gray-50">
              <div className="w-20 flex-shrink-0 border-r border-gray-100"></div> {/* Time column spacer */}
              {weekDays.map((day, i) => {
                const isToday = new Date().toDateString() === day.toDateString();
                return (
                  <div key={i} className="flex-1 py-3 text-center border-r border-gray-100 last:border-0">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isToday ? 'text-primary' : 'text-gray-500'}`}>{day.toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                    <p className={`text-xl font-black ${isToday ? 'text-primary' : 'text-heading'}`}>{day.getDate()}</p>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {timeSlots.map((time, i) => (
                <div key={i} className="flex border-b border-gray-50">
                  <div className="w-20 flex-shrink-0 border-r border-gray-100 py-3 text-center text-xs font-bold text-gray-400 bg-gray-50/50">
                    {time.substring(0,5)}
                  </div>
                  {weekDays.map((day, dIdx) => {
                    const dayStr = day.toISOString().split('T')[0];
                    const apptsForSlot = appointments.filter(a => a.appointment_date === dayStr && a.start_time === time);
                    
                    return (
                      <div key={dIdx} className="flex-1 border-r border-gray-100 last:border-0 p-1 relative min-h-[60px] hover:bg-primary/5 transition-colors group flex flex-col gap-1">
                        {apptsForSlot.length > 0 ? (
                          apptsForSlot.map((appt, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => setViewAppointment(appt)}
                              className={`rounded p-1 text-[10px] shadow-sm border overflow-hidden leading-tight cursor-pointer hover:shadow-md transition-shadow ${
                              appt.status === 'blocked' ? 'bg-gray-100 border-gray-200 text-gray-500' :
                              (appt.payment_status === 'pending' || appt.status === 'pending_payment') ? 'bg-orange-50 border-orange-200 text-orange-800' :
                              'bg-primary/10 border-primary/20 text-primary'
                            }`}>
                              <p className="font-bold truncate">{appt.status === 'blocked' ? 'BLOCKED' : appt.patient_name}</p>
                              {appt.status !== 'blocked' && <p className="opacity-80 truncate" style={{ fontSize: '9px' }}>Dr. {appt.doctor_name?.split(' ')[0]}</p>}
                            </div>
                          ))
                        ) : (
                           <button onClick={() => setIsBookModalOpen(true)} className="absolute inset-2 flex items-center justify-center opacity-0 group-hover:opacity-100 text-primary font-bold text-xs bg-white/80 rounded border-dashed border border-primary/30 z-10">
                             + Book
                           </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>

      <ViewAppointmentModal
        isOpen={!!viewAppointment}
        onClose={() => setViewAppointment(null)}
        appointment={viewAppointment}
        onCancelled={() => {
           setViewAppointment(null);
           fetchWeekAppointments();
        }}
      />

    </div>
  );
};

export default AppointmentCalendar;
