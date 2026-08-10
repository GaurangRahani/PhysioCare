import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, CalendarClock, Users, Loader2, Dumbbell } from 'lucide-react';
import { UserButton, useUser, useAuth } from '@clerk/clerk-react';
import DoctorOnboarding from '../pages/DoctorOnboarding';
import Footer from '../../../components/layout/Footer';
import UnifiedHeader from '../../../components/layout/UnifiedHeader';

import '../pages/DoctorDashboard.css';

const DoctorLayout = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/doctors/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
        }
      } catch (error) {
        console.error('Failed to fetch doctor profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [getToken]);

  const navigation = [
    { name: 'Dashboard', href: '/doctor-dashboard', icon: 'fa-solid fa-border-all' },
    { name: 'My Availability', href: '/doctor-dashboard/availability', icon: 'fa-regular fa-calendar-check' },
    { name: 'Exercise Library', href: '/doctor-dashboard/exercise-library', icon: 'fa-solid fa-person-walking' },
    { name: 'Patients', href: '/doctor-dashboard/patients', icon: 'fa-solid fa-users' },
  ];

  const isActive = (path) => {
    if (path === '/doctor-dashboard') {
      return location.pathname === '/doctor-dashboard';
    }
    return location.pathname.startsWith(path);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Intercept if they don't have a medical specialization set yet
  if (!profile || !profile.specialization) {
    return <DoctorOnboarding onComplete={(updatedProfile) => setProfile(updatedProfile)} />;
  }

  return (
    <div className="doctor-theme flex flex-col min-h-screen">
      <UnifiedHeader 
        brandLink="/doctor-dashboard" 
        roleName="Doctor"
        userName={`Dr. ${user?.firstName || 'Physio'}`} 
        navigation={navigation} 
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default DoctorLayout;
