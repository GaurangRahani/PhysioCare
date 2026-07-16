import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, CalendarClock, Users, Loader2, Dumbbell } from 'lucide-react';
import { UserButton, useUser, useAuth } from '@clerk/clerk-react';
import DoctorOnboarding from '../pages/DoctorOnboarding';

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
    { name: 'Dashboard', href: '/doctor-dashboard', icon: LayoutDashboard },
    { name: 'My Availability', href: '/doctor-dashboard/availability', icon: CalendarClock },
    { name: 'Exercise Library', href: '/doctor-dashboard/exercise-library', icon: Dumbbell },
    { name: 'Patients', href: '/doctor-dashboard/patients', icon: Users },
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Horizontal Top Navbar */}
      <header className="bg-light sticky top-0 z-50 w-full border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <Link to="/doctor-dashboard" className="flex items-center gap-2 group">
              <div className="bg-primary p-2 rounded-lg">
                <Activity className="h-6 w-6 text-light" />
              </div>
              <span className="text-2xl font-bold text-dark tracking-tight">PhysioCare <span className="text-sm font-medium text-primary ml-1">Doctor</span></span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 text-sm font-semibold transition-colors duration-300 ${
                      active 
                        ? 'text-primary' 
                        : 'text-body hover:text-primary'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-sm font-semibold text-dark">
                Dr. {user?.fullName || 'Physio'}
              </span>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-10 h-10 shadow-sm" } }} />
            </div>

          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 overflow-x-auto">
          <nav className="flex items-center gap-6 min-w-max">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors duration-300 ${
                    active 
                      ? 'text-primary' 
                      : 'text-body hover:text-primary'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default DoctorLayout;
