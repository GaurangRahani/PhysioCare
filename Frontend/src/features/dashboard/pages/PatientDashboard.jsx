import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  Loader2, 
  XCircle, 
  Sparkles, 
  History, 
  Plus, 
  Mic, 
  Calendar, 
  Dumbbell, 
  Activity, 
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PatientOnboarding from './PatientOnboarding';
import BookAppointmentModal from '../components/BookAppointmentModal';
import TodayTab from '../components/TodayTab';

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
  const [sidekickQuery, setSidekickQuery] = useState('');

  // Dynamic Greeting based on time of day
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const patientName = clerkUser?.firstName || 'Patient';

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

      // If the profile is missing, intercept with onboarding
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
        throw new Error("Failed to fetch today's schedule");
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-[#111111] animate-spin" />
        <span className="text-[#8A8A8A] text-xs font-mono">Loading your recovery schedule...</span>
      </div>
    );
  }

  if (!profileComplete) {
    return <PatientOnboarding onComplete={handleOnboardingComplete} />;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
        <div className="bg-[#FFFFFF] border border-[#FCE4E4] p-6 rounded-2xl max-w-md w-full shadow-lg text-center flex flex-col items-center">
          <XCircle className="h-10 w-10 text-[#B42318] mb-3" />
          <h2 className="font-semibold text-lg text-[#202223] mb-1">Notice</h2>
          <p className="text-[13px] text-[#616161] mb-5">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary-saas text-[12px] py-2 px-5 cursor-pointer"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 font-['Inter',system-ui,sans-serif] text-[#202223] animate-fade-in">
      
      {/* ── Top Context Bar (Matching Screenshot 1 & 3) ────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-1 border-b border-[#EAEAEA] text-[12px] text-[#616161]">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#202223]">Last 30 days</span>
          <span className="text-[#CCCCCC]">·</span>
          <span>All recovery channels</span>
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#245B19] bg-[#D9F7C3] px-2.5 py-0.5 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span>Active Care</span>
        </div>
      </div>

      {/* ── Hero Greeting (Matching Shopify Admin Screenshots) ─────────── */}
      <div className="text-center py-4 sm:py-6 w-full max-w-3xl mx-auto">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-[#202223] m-0 leading-tight">
          {greeting}!
        </h1>
        <p className="text-[15px] sm:text-[18px] text-[#616161] font-normal mt-1 leading-snug">
          Let's continue your recovery journey, {patientName}.
        </p>

        {/* ── Sidekick Care Assistant Bar (Matching Screenshots 1 & 3) ──── */}
        <div className="mt-5 bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl p-3 shadow-xs hover:border-[#CCCCCC] transition-all">
          <div className="flex items-center gap-2.5 px-2">
            <span className="text-[16px]">✦</span>
            <input
              id="patient-search-input"
              type="text"
              placeholder="Ask Care Assistant about exercise form, symptoms, or schedule..."
              value={sidekickQuery}
              onChange={(e) => setSidekickQuery(e.target.value)}
              className="w-full text-[13px] text-[#202223] placeholder-[#8A8A8A] bg-transparent border-none outline-none focus:ring-0"
            />
          </div>

          <div className="mt-3 pt-2 border-t border-[#F0F0F0] flex items-center justify-between text-[11px] text-[#616161] px-1">
            <div className="flex items-center gap-1.5 text-[#8A8A8A]">
              <div className="w-5 h-5 rounded-md bg-[#F7F7F7] flex items-center justify-center text-[#202223]">
                ✦
              </div>
              <span>Physio AI Co-Pilot</span>
            </div>

            <div className="flex items-center gap-3">
              <button 
                type="button"
                className="flex items-center gap-1 text-[#616161] hover:text-[#202223] transition-colors cursor-pointer"
              >
                <History size={13} />
                <span>Recents</span>
              </button>
              <button 
                type="button"
                className="p-1 hover:text-[#202223] transition-colors cursor-pointer"
                title="Add note"
              >
                <Plus size={14} />
              </button>
              <button 
                type="button"
                className="p-1 hover:text-[#202223] transition-colors cursor-pointer"
                title="Voice query"
              >
                <Mic size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2 High-Density Feature Action Cards (Shopify Style) ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Card 1: Today's Exercise Protocol */}
        <div className="saas-card p-4 sm:p-5 bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                Prescribed Protocol
              </span>
              <span className="badge-semantic-success text-[11px] font-medium">
                Day 12 / Week 2
              </span>
            </div>
            <h3 className="text-[15px] sm:text-[16px] font-semibold text-[#202223] m-0">
              Today's Rehabilitation Routine
            </h3>
            <p className="text-[12px] sm:text-[13px] text-[#616161] line-clamp-2 leading-relaxed">
              Complete your guided home movements, log completed repetitions, and track mobility progress.
            </p>
          </div>

          <div className="pt-3 border-t border-[#F0F0F0] mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-[12px] font-mono text-[#8A8A8A] self-start sm:self-auto">
              ~25 mins total
            </span>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('today-schedule-anchor');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary-saas text-[12px] py-2 px-3.5 flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto shrink-0"
            >
              <Dumbbell size={13} />
              <span>Start Exercises</span>
            </button>
          </div>
        </div>

        {/* Card 2: Consultation & Booking */}
        <div className="saas-card p-4 sm:p-5 bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                Clinical Touchpoint
              </span>
              <span className="text-[11px] font-medium text-[#4088F8] bg-[#EBF3FE] px-2 py-0.5 rounded-full">
                Consultation
              </span>
            </div>
            <h3 className="text-[15px] sm:text-[16px] font-semibold text-[#202223] m-0">
              Doctor Consultation & Review
            </h3>
            <p className="text-[12px] sm:text-[13px] text-[#616161] line-clamp-2 leading-relaxed">
              Book your next clinical evaluation, report progress directly to your orthopedic physiotherapist.
            </p>
          </div>

          <div className="pt-3 border-t border-[#F0F0F0] mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/dashboard/appointments')}
              className="text-[12px] font-medium text-[#616161] hover:text-[#202223] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Past appointments</span>
              <ChevronRight size={13} />
            </button>
            
            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              className="btn-secondary-saas text-[12px] py-2 px-3.5 flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto shrink-0"
            >
              <Calendar size={13} />
              <span className="whitespace-nowrap">Book Appointment</span>
            </button>
          </div>
        </div>

      </div>

      {/* ── Today's Prescribed Sessions & Schedule ─────────────────────── */}
      <div id="today-schedule-anchor" className="mt-2">
        {internalUserId && (
          <TodayTab 
            patientId={internalUserId} 
            onBookAppointment={() => setIsBookingOpen(true)} 
          />
        )}
      </div>

      {/* ── Booking Modal ──────────────────────────────────────────────── */}
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
