import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Loader2, CalendarX, Sparkles, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientDashboard = () => {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // We do not actually use getToken() for authentication in this local test 
        // since our backend currently doesn't enforce strict Clerk JWT verification on the GET /api/patients/profile route.
        // Wait, yes it does, we need to pass the JWT token in the Authorization header.
        const token = await getToken();

        // 1. Fetch Profile to get internal user ID
        const profileResponse = await fetch('http://localhost:5000/api/patients/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch patient profile');
        }
        
        const profileData = await profileResponse.json();
        const internalUserId = profileData.user.id;

        // 2. Fetch Today's Schedule
        const scheduleResponse = await fetch(`http://localhost:5000/api/patients/${internalUserId}/today`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!scheduleResponse.ok) {
          throw new Error('Failed to fetch today\'s schedule');
        }

        const scheduleData = await scheduleResponse.json();
        setData(scheduleData);
        setError(null);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-body font-medium">Loading your schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-danger p-6 rounded-[8px] border border-red-100 flex flex-col items-center text-center">
        <p className="font-semibold text-lg mb-2">Oops, something went wrong.</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // --- UI STATES ---
  
  if (data?.state === 'no_active_plan') {
    return (
      <div className="bg-light rounded-[12px] p-8 md:p-12 border border-gray-100 shadow-sm flex flex-col items-center text-center max-w-2xl mx-auto mt-10">
        <div className="bg-gray-50 p-4 rounded-full mb-6">
          <CalendarX className="h-12 w-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-heading mb-4">No Active Treatment Plan</h2>
        <p className="text-body mb-8 leading-relaxed">
          {data.message}
        </p>
        <Link to="/book" className="px-6 py-3 bg-primary text-light font-medium rounded-[8px] hover:bg-dark transition-colors shadow-sm">
          Book a Consultation
        </Link>
      </div>
    );
  }

  if (data?.state === 'no_sessions_today') {
    return (
      <div className="bg-primary/5 rounded-[12px] p-8 md:p-12 border border-primary/10 flex flex-col items-center text-center max-w-2xl mx-auto mt-10">
        <div className="bg-light p-4 rounded-full mb-6 shadow-sm">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-heading mb-4">Rest Day!</h2>
        <p className="text-body leading-relaxed">
          {data.message}
        </p>
      </div>
    );
  }

  // ACTIVE DAY
  const { pending, completed, missed } = data?.schedule || { pending: [], completed: [], missed: [] };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-heading mb-2">Good morning, {clerkUser?.firstName || 'Patient'}!</h1>
        <p className="text-body text-lg">Here is your exercise schedule for today, {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
      </div>

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
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-heading">Your Tasks</h2>
        
        {pending.length > 0 && (
          <div className="space-y-4">
            {pending.map((session, idx) => (
              <div key={idx} className="bg-light p-5 rounded-[12px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 h-16 w-16 rounded-[8px] flex items-center justify-center border border-gray-100 overflow-hidden">
                    {/* Placeholder for Video Thumbnail */}
                    <Activity className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-heading">{session.exercise_name}</h3>
                    <p className="text-sm text-body">{session.sets} Sets × {session.reps} Reps • Session {session.session_number}</p>
                  </div>
                </div>
                <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary font-medium rounded-[8px] group-hover:bg-primary group-hover:text-light transition-colors">
                  Start Session
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
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

export default PatientDashboard;
