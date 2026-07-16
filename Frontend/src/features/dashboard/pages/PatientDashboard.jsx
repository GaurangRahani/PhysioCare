import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Loader2, CalendarX, Sparkles, CheckCircle2, Clock, XCircle, ChevronRight, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PatientOnboarding from './PatientOnboarding';
import PatientBookingModal from '../components/PatientBookingModal';

const PatientDashboard = () => {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [profileComplete, setProfileComplete] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [getToken]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      // 1. Fetch Profile to get internal user ID
      const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch patient profile');
      }
      
      const profileData = await profileResponse.json();
      
      // If the profile is missing, intercept!
      if (!profileData.profile) {
        setProfileComplete(false);
        setLoading(false);
        return;
      }
      
      setProfileComplete(true);
      const internalUserId = profileData.user.id;

      // 2. Fetch Today's Schedule
      const scheduleResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${internalUserId}/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!scheduleResponse.ok) {
        throw new Error('Failed to fetch today\'s schedule');
      }

      const scheduleData = await scheduleResponse.json();
      setData(scheduleData);

      // 3. Fetch Appointments
      const apptResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (apptResponse.ok) {
        const apptData = await apptResponse.json();
        // Filter out past/cancelled ones to only show upcoming
        const todayStr = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD' in local timezone
        const upcoming = apptData.appointments?.filter(a => 
          ['scheduled', 'pending_payment'].includes(a.status) && a.appointment_date >= todayStr
        ) || [];
        setAppointments(upcoming);
      }

      setError(null);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        fetchData(); // Refresh list
      } else {
        alert(`Failed to cancel appointment: ${data.message || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error cancelling appointment: " + err.message);
    }
  };

  const handleOnboardingComplete = () => {
    // Re-fetch data to load the dashboard now that profile exists
    fetchData();
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-body font-medium">Loading your schedule...</p>
      </div>
    );
  }

  if (!profileComplete) {
    return <PatientOnboarding onComplete={handleOnboardingComplete} />;
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <div className="bg-red-50 text-danger p-8 rounded-[12px] border border-red-100 flex flex-col items-center text-center max-w-md w-full shadow-sm">
          <XCircle className="h-12 w-12 text-danger mb-4" />
          <h2 className="font-bold text-xl mb-3">Almost there!</h2>
          <p className="text-body mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-danger text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // ── UI COMPONENTS ──

  const AppointmentsSection = () => (
    <div className="space-y-4 mt-8">
      <h2 className="text-xl font-bold text-heading">Upcoming Appointments</h2>
      {appointments.length === 0 ? (
        <div className="bg-light p-6 rounded-[12px] border border-gray-100 shadow-sm text-center">
          <p className="text-body">You have no upcoming appointments.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => (
            <div key={appt.id} className="bg-light p-5 rounded-[12px] border border-gray-100 shadow-sm relative">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-heading text-lg">Dr. {appt.doctor_name || 'Physiotherapist'}</h3>
                  <p className="text-sm text-primary font-medium">
                    {new Date(appt.appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {appt.start_time}
                  </p>
                </div>
                {appt.status === 'pending_payment' && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">Pending Payment</span>
                )}
              </div>
              {appt.visit_reason && (
                <p className="text-sm text-body mb-4 line-clamp-2">"{appt.visit_reason}"</p>
              )}
              <button 
                onClick={() => handleCancelAppointment(appt.id)}
                className="text-sm text-danger font-medium hover:underline flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" /> Cancel Appointment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExercises = () => {
    if (data?.state === 'no_active_plan') {
      return (
        <div className="bg-light rounded-[12px] p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-6">
            <CalendarX className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-heading mb-3">No Active Treatment Plan</h2>
          <p className="text-body leading-relaxed max-w-md">
            {data.message}
          </p>
        </div>
      );
    }

  if (data?.state === 'no_sessions_today') {
    return (
      <div className="bg-primary/5 rounded-[12px] p-8 border border-primary/10 flex flex-col items-center text-center">
        <div className="bg-light p-4 rounded-full mb-6 shadow-sm">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-heading mb-3">Rest Day!</h2>
        <p className="text-body leading-relaxed max-w-md">
          {data.message}
        </p>
      </div>
    );
  }

    // ACTIVE DAY
    const { pending, completed, missed } = data?.schedule || { pending: [], completed: [], missed: [] };

    // Group pending by session_number
    const groupedWorkouts = pending.reduce((acc, session) => {
        if (!acc[session.session_number]) acc[session.session_number] = [];
        acc[session.session_number].push(session);
        return acc;
    }, {});

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-light p-6 rounded-[12px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-[8px]">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-body">Pending</p>
              <p className="text-2xl font-bold text-heading">{pending.length}</p>
            </div>
          </div>
          <div className="bg-light p-6 rounded-[12px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-success/10 p-3 rounded-[8px]">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-body">Completed</p>
              <p className="text-2xl font-bold text-heading">{completed.length}</p>
            </div>
          </div>
          <div className="bg-light p-6 rounded-[12px] border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-danger/10 p-3 rounded-[8px]">
              <XCircle className="h-6 w-6 text-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-body">Missed</p>
              <p className="text-2xl font-bold text-heading">{missed.length}</p>
            </div>
          </div>
        </div>

        {/* Exercises List */}
        <div>
          <h2 className="text-xl font-bold text-heading mb-4">Your Tasks</h2>
          
          {pending.length > 0 && (
            <div className="space-y-6">
              {Object.keys(groupedWorkouts).map((sessionNumber) => {
                const exercises = groupedWorkouts[sessionNumber];
                return (
                  <div key={sessionNumber} className="bg-light p-6 rounded-[12px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-4">
                           <div className="bg-primary/10 h-14 w-14 rounded-[8px] flex items-center justify-center border border-primary/20">
                             <Activity className="h-7 w-7 text-primary" />
                           </div>
                           <div>
                             <h3 className="text-xl font-bold text-heading">Workout {sessionNumber}</h3>
                             <p className="text-sm text-body">{exercises.length} Exercises to complete</p>
                           </div>
                        </div>
                        <button 
                            onClick={() => navigate('/dashboard/session', { state: { exercises } })}
                            className="w-full md:w-auto px-6 py-3 bg-primary text-light font-medium rounded-[8px] hover:bg-dark transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            Start Workout {sessionNumber}
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="bg-gray-50 rounded-[8px] p-4 space-y-3 border border-gray-100">
                        {exercises.map((ex, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                <span className="font-semibold text-heading text-sm">{ex.exercise_name}</span>
                                <span className="text-body text-xs font-medium bg-white px-2 py-1 rounded border border-gray-200">{ex.sets} Sets × {ex.reps} Reps</span>
                            </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pending.length === 0 && completed.length > 0 && (
            <div className="bg-success/5 border border-success/20 p-8 rounded-[12px] text-center">
              <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
              <h3 className="text-xl font-bold text-heading mb-2">All done for today!</h3>
              <p className="text-body">You've completed all your scheduled exercises. Great job staying on track!</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading mb-2">Good morning, {clerkUser?.firstName || 'Patient'}!</h1>
          <p className="text-body text-lg">Here is your dashboard for {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
        </div>
        <button 
          onClick={() => setIsBookingOpen(true)}
          className="shrink-0 px-5 py-2.5 bg-primary text-white font-medium rounded-[8px] hover:bg-dark transition-colors shadow-sm self-start md:self-auto flex items-center gap-2"
        >
          <CalendarX className="h-4 w-4 hidden" /> {/* Ensures consistent height */}
          + Book Appointment
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Top Section: Appointments */}
        <AppointmentsSection />

        <hr className="border-gray-200" />

        {/* Bottom Section: Exercises */}
        {renderExercises()}
      </div>

      <PatientBookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        onBooked={() => fetchData()} 
      />
    </div>
  );
};

export default PatientDashboard;
