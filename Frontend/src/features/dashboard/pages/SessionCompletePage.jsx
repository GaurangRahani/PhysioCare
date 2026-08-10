import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Check } from 'lucide-react';
import './ExerciseSessionPage.css';
import './SessionCompletePage.css';

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
    
    // Trigger checkmark animation after a short delay
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
      
      // Determine sessions per day from the current session object to show hint
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

  const getMessage = (percent) => {
    if (percent >= 90) return "Outstanding! 🔥";
    if (percent >= 80) return "Keep it up! 💪";
    if (percent >= 60) return "Good progress! 👍";
    return "Every session counts — keep going.";
  };

  const getProgressBarColor = (percent) => {
    if (percent >= 80) return 'excellent';
    if (percent >= 50) return 'good';
    return 'needs-work';
  };

  const percent = weeklyCompliance.percent || 0;

  return (
    <div className="session-page-wrapper">
      <svg className="theme-wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="rgba(86, 90, 207, 0.05)" fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,176C1248,149,1344,107,1392,85.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
      </svg>

      <div className="shape shape-circle"></div>
      <div className="shape shape-plus"></div>

      <div className="complete-page-content">
        <div className={`success-icon-container ${showCheck ? 'show' : ''}`}>
          <Check className="success-icon" strokeWidth={3} />
        </div>

        <h1 className="complete-title">
          Session {sessionNumber} Complete!
        </h1>
        
        <p className="complete-subtitle">
          {getMessage(percent)}
        </p>

        <div className="compliance-container">
          <div className="compliance-header">
            <span className="compliance-label">This week</span>
            <span className="compliance-value">{percent}%</span>
          </div>
          <div className="compliance-track">
            <div 
              className={`compliance-fill ${getProgressBarColor(percent)}`}
              style={{ width: `${loading ? 0 : percent}%` }}
            />
          </div>
          
          <p className="streak-message">
            {sessionsPerDay === 2 && parseInt(sessionNumber) === 1 
              ? "Session 2 (Evening) — come back this evening."
              : "See you tomorrow! Keep the streak going."}
          </p>
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="btn-submit"
          style={{ maxWidth: '400px' }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SessionCompletePage;
