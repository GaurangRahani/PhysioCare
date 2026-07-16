import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Calendar, Users, Loader2, Dumbbell, CalendarRange, Clock, ChevronRight, Stethoscope } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ViewAppointmentModal from '../../receptionist/components/ViewAppointmentModal';

const DoctorDashboard = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [getToken]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/appointments?date=today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const activeAppts = data.appointments.filter(a => !['cancelled', 'no_show'].includes(a.status));
        setAppointments(activeAppts);
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

  const handleCancelled = () => {
    fetchAppointments();
  };

  // Metrics
  const todayAppointments = appointments.length;
  
  // A simplistic way to count "Upcoming" for today is appointments whose start_time is in the future.
  // We'll just display a total for now as a static "Today's load".
  const uniquePatients = new Set(appointments.map(a => a.patient_id)).size;

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
        <div>
          <h1 className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </h1>
          <h2 className="text-2xl md:text-3xl font-extrabold text-heading">
            Welcome back, Dr. {user?.firstName || 'Doctor'}! 👋
          </h2>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-primary">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Today's Appointments</p>
            <p className="text-3xl font-extrabold text-dark">{todayAppointments}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Patients Today</p>
            <p className="text-3xl font-extrabold text-dark">{uniquePatients}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Link 
          to="/doctor/availability"
          className="flex items-center gap-2 bg-white text-dark border border-gray-200 font-semibold py-2.5 px-5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <CalendarRange className="w-4 h-4 text-primary" />
          My Availability
        </Link>
        <Link 
          to="/doctor/exercises"
          className="flex items-center gap-2 bg-white text-dark border border-gray-200 font-semibold py-2.5 px-5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Dumbbell className="w-4 h-4 text-secondary" />
          Exercise Library
        </Link>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50/80 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-heading text-lg flex items-center gap-2 uppercase tracking-wide">
            TODAY'S PATIENTS
          </h3>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-danger bg-red-50">{error}</div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">You have no appointments scheduled for today.</p>
              <p className="text-sm text-gray-400 mt-1">Enjoy your free time!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {appointments.map((appt) => {
                const isBlocked = appt.status === 'blocked';
                const isCompleted = appt.status === 'completed';
                const isFirstVisit = appt.past_consultations_count === 0;
                
                return (
                  <div key={appt.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 md:px-6 hover:bg-gray-50/80 transition-colors gap-4 ${isBlocked ? 'opacity-60 bg-gray-50' : ''}`}>
                    
                    {/* Time & Patient Name */}
                    <div className="flex items-start sm:items-center gap-4 sm:gap-6 w-full sm:w-2/3">
                      <div className="min-w-[90px] pt-1 sm:pt-0">
                        <span className="font-extrabold text-primary text-sm bg-primary/10 px-3 py-1.5 rounded-lg block text-center">
                          {formatTime(appt.start_time)}
                        </span>
                      </div>
                      <div>
                        <span className={`block text-lg font-bold ${isBlocked ? 'text-gray-400 line-through' : 'text-heading'}`}>
                          {isBlocked ? 'Blocked Slot' : (appt.patient_name || 'Unknown Patient')}
                        </span>
                        {!isBlocked && (
                           <div className="flex items-center gap-3 mt-1">
                             <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${isFirstVisit ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                               {isFirstVisit ? 'First Visit' : 'Follow-up'}
                             </span>
                             {appt.reason_for_visit && (
                               <span className="text-sm text-gray-500 font-medium">
                                 {appt.reason_for_visit}
                               </span>
                             )}
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-1/3 pl-[106px] sm:pl-0">
                      {!isBlocked && (
                        isCompleted ? (
                           <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600">
                             Completed
                           </span>
                        ) : (
                           <button 
                             onClick={() => navigate(`/doctor-dashboard/consultation/${appt.id}`, { state: { appointment: appt } })}
                             className="flex items-center gap-2 bg-primary text-white hover:bg-dark px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                           >
                             <Stethoscope className="w-4 h-4" />
                             Start
                           </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
