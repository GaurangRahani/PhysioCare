import React, { useState, useEffect } from 'react';
import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { Loader2, XCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PatientOnboarding from './PatientOnboarding';
import BookAppointmentModal from '../components/BookAppointmentModal';
import TodayTab from '../components/TodayTab';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
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
    fetchData();
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4" style={{ minHeight: '100vh' }}>
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="font-medium" style={{ color: 'var(--text-body)' }}>Loading your schedule...</p>
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
          <p className="mb-6">{error}</p>
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
        {/* Floating Background Shapes */}
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3">+</div>
        <div className="shape shape-4"></div>

        <div className="theme-bg">


            <main className="container">
                <section>
                    {internalUserId && (
                      <TodayTab patientId={internalUserId} onBookAppointment={() => setIsBookingOpen(true)} />
                    )}
                </section>
            </main>
        </div>

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
