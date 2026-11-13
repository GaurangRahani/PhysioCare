import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Globe,
  Users, 
  Dumbbell, 
  Clock, 
  Settings, 
  Search, 
  Activity, 
  PanelLeftClose, 
  PanelLeft, 
  Loader2 
} from 'lucide-react';
import { UserButton, useUser, useAuth } from '@clerk/clerk-react';
import DoctorOnboarding from '../pages/DoctorOnboarding';
import '../pages/DoctorDashboard.css';

const DoctorLayout = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [todayCounts, setTodayCounts] = useState({ appointments: 0, patients: 0, alerts: 0 });

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const token = await getToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const [profileRes, apptsRes, alertsRes] = await Promise.all([
          fetch(`${apiUrl}/api/doctors/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${apiUrl}/api/appointments?date=today`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${apiUrl}/api/alerts`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile(profileData.profile);
        }

        const apptsData = await apptsRes.json();
        let apptCount = 0;
        let ptCount = 0;
        if (apptsData.success && apptsData.appointments) {
          const active = apptsData.appointments.filter(a => 
            !['cancelled', 'no_show', 'pending_payment'].includes(a.status)
          );
          apptCount = active.length;
          ptCount = new Set(active.map(a => a.patient_id)).size;
        }

        const alertsData = await alertsRes.json();
        const alertCount = alertsData.success && alertsData.alerts ? alertsData.alerts.length : 0;

        setTodayCounts({
          appointments: apptCount,
          patients: ptCount,
          alerts: alertCount
        });

      } catch (error) {
        console.error('Failed to fetch doctor metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [getToken]);

  const navItems = [
    { name: 'Dashboard', href: '/doctor-dashboard', icon: Home, exact: true },
    { name: 'Appointments', href: '/doctor-dashboard?view=appointments', icon: Calendar },
    { name: 'Region', href: '/doctor-dashboard/regions', icon: Globe },
    { name: 'Patients', href: '/doctor-dashboard/patients', icon: Users },
    { name: 'Exercise Library', href: '/doctor-dashboard/exercise-library', icon: Dumbbell },
    { name: 'Availability', href: '/doctor-dashboard/availability', icon: Clock },
  ];

  const isNavActive = (item) => {
    if (item.exact) {
      return location.pathname === '/doctor-dashboard' && !location.search.includes('view=appointments');
    }
    if (item.href.includes('view=appointments')) {
      return location.pathname === '/doctor-dashboard' && location.search.includes('view=appointments');
    }
    return location.pathname.startsWith(item.href);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#FFFFFF]" />
          <span className="text-[#8A8A8A] text-xs font-mono">Initializing Clinical Workspace...</span>
        </div>
      </div>
    );
  }

  // Intercept if they don't have a medical specialization set yet
  if (!profile || !profile.specialization) {
    return <DoctorOnboarding onComplete={(updatedProfile) => setProfile(updatedProfile)} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] font-['Inter',system-ui,sans-serif] text-[#202223]">
      
      {/* ── 1. PRIMARY MONOCHROMATIC SIDEBAR (#0A0A0A) ───────────────────── */}
      <aside 
        className={`flex flex-col justify-between shrink-0 bg-[#0A0A0A] border-r border-[#1C1C1C] transition-all duration-200 z-30 select-none ${
          sidebarCollapsed ? 'w-[64px] px-2 py-3' : 'w-[210px] px-3 py-3.5'
        }`}
      >
        {/* Top: Brand Header & Search */}
        <div className="flex flex-col gap-3">
          
          {/* Brand Row */}
          <div className="flex items-center justify-between px-1.5 h-8">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/doctor-dashboard')}
            >
              <div className="w-7 h-7 rounded-lg bg-[#202020] border border-[#2D2D2D] flex items-center justify-center text-[#FFFFFF] shadow-sm">
                <Activity size={15} className="text-[#A3F56C]" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold tracking-tight text-[#FFFFFF] leading-none">
                    AlignCare
                  </span>
                  <span className="text-[10px] text-[#8A8A8A] leading-tight mt-0.5 font-medium">
                    Clinical Suite
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#1C1C1C] p-1 rounded-md transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          {/* Quick Search Bar */}
          {!sidebarCollapsed ? (
            <div 
              onClick={() => {
                const el = document.getElementById('clinical-quick-search');
                if (el) el.focus();
              }}
              className="flex items-center justify-between bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#333333] rounded-lg px-2.5 py-1.5 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2 text-[#8A8A8A]">
                <Search size={13} />
                <span className="text-[12px] text-[#8A8A8A]">Search</span>
              </div>
              <kbd className="text-[10px] font-mono font-medium text-[#7A7A7A] bg-[#202020] border border-[#2D2D2D] px-1.5 py-0.2 rounded">
                Ctrl K
              </kbd>
            </div>
          ) : (
            <button 
              onClick={() => setSidebarCollapsed(false)}
              className="flex items-center justify-center h-8 w-8 mx-auto rounded-lg bg-[#141414] text-[#8A8A8A] hover:text-[#FFFFFF] border border-[#242424]"
              title="Search (Ctrl + K)"
            >
              <Search size={14} />
            </button>
          )}

          {/* Primary Navigation List */}
          <nav className="flex flex-col gap-1 mt-1">
            {navItems.map((item) => {
              const active = isNavActive(item);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`flex items-center gap-2.5 px-2.5 h-[36px] rounded-[10px] text-[13px] font-normal transition-colors ${
                    active 
                      ? 'bg-[#292929] text-[#FFFFFF] font-medium' 
                      : 'text-[#D1D1D1] hover:bg-[#1A1A1A] hover:text-[#FFFFFF]'
                  } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon 
                    size={16} 
                    className={active ? 'text-[#FFFFFF]' : 'text-[#8A8A8A]'} 
                  />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Settings & User Profile */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#1C1C1C]">
          <NavLink
            to="/doctor-dashboard/availability"
            title={sidebarCollapsed ? "Settings" : undefined}
            className={({ isActive }) => `flex items-center gap-2.5 px-2.5 h-[36px] rounded-[10px] text-[13px] transition-colors ${
              isActive && location.pathname.includes('/availability')
                ? 'bg-[#292929] text-[#FFFFFF] font-medium'
                : 'text-[#D1D1D1] hover:bg-[#1A1A1A] hover:text-[#FFFFFF]'
            } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <Settings size={16} className="text-[#8A8A8A]" />
            {!sidebarCollapsed && <span>Settings</span>}
          </NavLink>

          {/* Doctor Profile Bar */}
          <div className={`flex items-center gap-2.5 p-1.5 rounded-[10px] bg-[#121212] border border-[#1F1F1F] ${
            sidebarCollapsed ? 'justify-center p-1' : ''
          }`}>
            <div className="shrink-0 flex items-center justify-center">
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{ 
                  elements: { 
                    userButtonAvatarBox: "w-7 h-7 rounded-md" 
                  } 
                }} 
              />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0 flex-1 leading-tight">
                <span className="text-[12px] font-medium text-[#FFFFFF] truncate">
                  Dr. {user?.firstName || 'Doctor'}
                </span>
                <span className="text-[10px] text-[#8A8A8A] truncate flex items-center gap-1 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A3F56C]" />
                  {profile?.specialization || 'Physiotherapy'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── 2. PURE WHITE WORKSPACE WITH ROUNDED INNER CANVAS (#FFFFFF) ─── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FFFFFF] rounded-tl-[16px] border-l border-t border-[#2B2B2B] overflow-hidden shadow-[-6px_0_20px_rgba(0,0,0,0.25)]">
        
        {/* Top Header Bar matching Screenshot */}
        <header className="h-[46px] shrink-0 bg-[#FFFFFF] border-b border-[#EAEAEA] px-6 flex items-center justify-between text-[13px] select-none">
          
          {/* Left Context Selector */}
          <div className="flex items-center gap-3 text-[#616161]">
            <span className="font-medium text-[#202223]">
              Today
            </span>
            <span className="text-[#E5E5E5]">·</span>
            <span className="text-[#616161] hover:text-[#202223] cursor-pointer transition-colors">
              All clinical schedules
            </span>
          </div>

          {/* Center Metrics (matching screenshot metric bar) */}
          <div className="hidden lg:flex items-center gap-8 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-[#8A8A8A]">Appointments</span>
              <span className="font-semibold text-[#202223]">{todayCounts.appointments}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8A8A8A]">Patients</span>
              <span className="font-semibold text-[#202223]">{todayCounts.patients}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8A8A8A]">Critical Alerts</span>
              <span className={`font-semibold ${todayCounts.alerts > 0 ? 'text-[#B42318]' : 'text-[#202223]'}`}>
                {todayCounts.alerts}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8A8A8A]">Clinic Status</span>
              <span className="font-semibold text-[#245B19] bg-[#D9F7C3] px-2 py-0.5 rounded-full text-[11px]">
                Accepting
              </span>
            </div>
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[12px] text-[#616161]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#A3F56C]" />
              <span>Live clinic</span>
            </div>
          </div>
        </header>

        {/* Main Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#FFFFFF] p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet context={{ todayCounts }} />
          </div>
        </main>
      </div>

    </div>
  );
};

export default DoctorLayout;