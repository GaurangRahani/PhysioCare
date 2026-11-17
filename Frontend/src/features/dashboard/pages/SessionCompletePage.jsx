import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Check, CheckCircle2, Trophy, ArrowRight, Loader2 } from 'lucide-react';

const SessionCompletePage = () => {
  const { planId, sessionNumber } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [weeklyCompliance, setWeeklyCompliance] = useState({ percent: 0 });
  const [sessionsPerDay, setSessionsPerDay] = useState(1);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    fetchCompliance();
    const timer = setTimeout(() => setShowCheck(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const profileRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!profileRes.ok) throw new Error("Failed to get profile");
      const profileData = await profileRes.json();
      const patientId = profileData.user.id;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${patientId}/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to get schedule");
      const data = await res.json();
      
      if (data.weeklyCompliance) {
        setWeeklyCompliance(data.weeklyCompliance);
      }
      
      if (data.sessions && data.sessions.length > 0) {
        const currentSession = data.sessions.find(s => s.session_number === parseInt(sessionNumber));
        if (currentSession && currentSession.exercises.length > 0) {
          setSessionsPerDay(currentSession.exercises[0].sessions_per_day || 1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const percent = weeklyCompliance.percent || 0;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 font-['Inter',system-ui,sans-serif] animate-fade-in text-[#202223] pb-24 md:pb-8">
      <div className="bg-[#FFFFFF] border border-[#EAEAEA] rounded-[16px] shadow-sm max-w-md w-full p-6 sm:p-8 text-center space-y-5">
        
        {/* Animated Trophy / Checkmark Icon */}
        <div className="w-16 h-16 rounded-full bg-[#D9F7C3] text-[#245B19] flex items-center justify-center mx-auto shadow-xs">
          <Check size={32} strokeWidth={3} className="animate-scale-in" />
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202223]">
            Session {sessionNumber} Complete!
          </h1>
          <p className="text-[13px] text-[#616161] mt-1">
            {percent >= 80 ? 'Outstanding adherence! Keep up the momentum.' : 'Every exercise session brings you closer to recovery.'}
          </p>
        </div>

        {/* Weekly Compliance Progress Card */}
        <div className="p-4 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[12px] space-y-2.5 text-left">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-medium text-[#616161]">Weekly Compliance</span>
            <span className="font-mono font-bold text-[#202223]">{percent}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#EAEAEA] overflow-hidden">
            <div 
              className="h-full bg-[#008060] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${loading ? 0 : percent}%` }}
            />
          </div>

          <p className="text-[11px] text-[#8A8A8A] pt-1">
            {sessionsPerDay === 2 && parseInt(sessionNumber) === 1 
              ? 'Session 2 (Evening) scheduled for later today.'
              : 'Protocol logged successfully. See you for tomorrow’s session.'}
          </p>
        </div>

        {/* CTA Button */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full py-3 px-4 rounded-[8px] text-[13px] font-semibold text-[#FFFFFF] bg-[#000000] hover:bg-[#202020] shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
        >
          <span>Return to Dashboard</span>
          <ArrowRight size={14} />
        </button>

      </div>
    </div>
  );
};

export default SessionCompletePage;
