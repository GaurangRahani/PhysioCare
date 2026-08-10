import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Loader2, CalendarX, Sparkles, CheckCircle2, Clock, XCircle, ChevronRight, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PatientOnboarding from './PatientOnboarding';
import BookAppointmentModal from '../components/BookAppointmentModal';
import TodayTab from '../components/TodayTab';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [internalUserId, setInternalUserId] = useState(null);

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
      const fetchedInternalUserId = profileData.user.id;
      setInternalUserId(fetchedInternalUserId);

      // 2. Fetch Today's Schedule
      const scheduleResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/${fetchedInternalUserId}/today`, {
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

  return (
    <div className="patient-dashboard-wrapper">
        <div className="bg-grid"></div>

        <div className="bg-wave-container">
            <svg viewBox="0 0 1440 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0,80 C320,160 520,30 840,100 C1160,170 1300,100 1440,140 L1440,250 C1300,200 1160,250 840,180 C520,110 320,240 0,160 Z" fill="rgba(86, 90, 207, 0.1)"></path>
                <path d="M0,120 C300,200 450,60 750,120 C1050,180 1250,120 1440,160 L1440,250 C1250,220 1050,250 750,190 C450,130 300,260 0,180 Z" fill="rgba(86, 90, 207, 0.15)"></path>
            </svg>
        </div>

        <svg className="theme-decor decor-triangle" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,10 90,90 10,90" fill="none" stroke="currentColor" strokeWidth="4"/>
        </svg>
        <svg className="theme-decor decor-zigzag-1" viewBox="0 0 80 30" xmlns="http://www.w3.org/2000/svg">
            <polyline points="0,15 10,5 20,25 30,5 40,25 50,5 60,25 70,5 80,15" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
        </svg>
        <svg className="theme-decor decor-square" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="8 8"/>
        </svg>
        <svg className="theme-decor decor-zigzag-2" viewBox="0 0 80 30" xmlns="http://www.w3.org/2000/svg">
            <polyline points="0,15 10,5 20,25 30,5 40,25 50,5 60,25 70,5 80,15" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round"/>
        </svg>
        <svg className="theme-decor decor-dotted-circle" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="6 8"/>
        </svg>
        <svg className="theme-decor decor-plus" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 10h-5V5a2 2 0 0 0-4 0v5H5a2 2 0 0 0 0 4h5v5a2 2 0 0 0 4 0v-5h5a2 2 0 0 0 0-4z"/>
        </svg>
        <svg className="theme-decor decor-solid-circle" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="currentColor"/>
        </svg>

        <main className="dashboard-container">


            <section>
                {internalUserId && (
                  <TodayTab patientId={internalUserId} onBookAppointment={() => setIsBookingOpen(true)} />
                )}
            </section>
        </main>

        <BookAppointmentModal 
          isOpen={isBookingOpen} 
          onClose={() => setIsBookingOpen(false)} 
          onSuccess={() => {
            setIsBookingOpen(false);
            fetchData();
          }} 
        />
    </div>
  );
};

export default PatientDashboard;
