import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Globe,
  Users, 
  Dumbbell, 
  Clock, 
  Settings, 
  Activity, 
  PanelLeftClose, 
  PanelLeft, 
  Loader2,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Check
} from 'lucide-react';
import { UserButton, useUser, useAuth } from '@clerk/clerk-react';
import Logo from '../../../components/common/Logo';
import DoctorOnboarding from '../pages/DoctorOnboarding';
import '../pages/DoctorDashboard.css';

const REGIONS = [
  { code: 'IN', name: 'India', flag: '🇮🇳', active: true },
  { code: 'US', name: 'USA', flag: '🇺🇸', active: false },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', active: false },
  { code: 'UK', name: 'UK', flag: '🇬🇧', active: false },
];

const DoctorLayout = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isMobileRegionDropdownOpen, setIsMobileRegionDropdownOpen] = useState(false);
  const [todayCounts, setTodayCounts] = useState({ appointments: 0, patients: 0, alerts: 0 });

  const regionDropdownRef = useRef(null);
  const mobileRegionDropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target)) {
        setIsRegionDropdownOpen(false);
      }
      if (mobileRegionDropdownRef.current && !mobileRegionDropdownRef.current.contains(e.target)) {
        setIsMobileRegionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-collapse sidebar on tablet, expand on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    { name: 'Appointments', href: '/doctor-dashboard/appointments', icon: Calendar },
    { name: 'Region', href: '/doctor-dashboard/regions', icon: Globe },
    { name: 'Patients', href: '/doctor-dashboard/patients', icon: Users },
    { name: 'Exercise Library', href: '/doctor-dashboard/exercise-library', icon: Dumbbell },
    { name: 'Availability', href: '/doctor-dashboard/availability', icon: Clock },
  ];

  const isNavActive = (item) => {
    if (item.exact) {
      return location.pathname === '/doctor-dashboard';
    }
    return location.pathname.startsWith(item.href);
  };

  const activeNavItem = navItems.find(isNavActive) || navItems[0];

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
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] font-['Inter',system-ui,sans-serif] text-[#202223] relative">
      
      {/* ── 1. PRIMARY MONOCHROMATIC SIDEBAR (Desktop & Tablet) ──────────── */}
      <aside 
        className={`hidden lg:flex flex-col justify-between shrink-0 bg-[#0A0A0A] border-r border-[#1C1C1C] transition-all duration-200 z-30 select-none ${
          sidebarCollapsed ? 'w-[64px] px-2 py-3' : 'w-[210px] px-3 py-3.5'
        }`}
      >
        {/* Top: Brand Header */}
        <div className="flex flex-col gap-3">
          
          {/* Brand Row */}
          <div className="flex items-center justify-between px-1.5 h-8">
            <div 
              className="cursor-pointer"
              onClick={() => navigate('/doctor-dashboard')}
            >
              <Logo 
                size="sm" 
                theme="dark" 
                subtitle="Clinical Suite" 
                collapsed={sidebarCollapsed} 
              />
            </div>

            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#1C1C1C] p-1 rounded-md transition-colors cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

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

        {/* Bottom Section: Region, Settings & User Profile */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#1C1C1C]">
          {/* Current Region with Dropdown (India Active, others Disabled) - Placed Above Settings */}
          <div className="relative" ref={regionDropdownRef}>
            {/* Region Dropdown Menu */}
            {isRegionDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#181818] border border-[#2A2A2A] rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in text-[12px] min-w-[200px]">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider border-b border-[#262626] mb-1 flex items-center justify-between">
                  <span>Practice Region</span>
                  <span className="text-[9px] text-[#4ADE80] font-mono">1 Active</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {REGIONS.map((reg) => (
                    <div
                      key={reg.code}
                      onClick={() => {
                        if (reg.active) setIsRegionDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                        reg.active
                          ? 'bg-[#222222] text-[#FFFFFF] font-medium cursor-pointer'
                          : 'text-[#616161] opacity-40 cursor-not-allowed select-none'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">{reg.flag}</span>
                        <span className="text-[12px]">{reg.name}</span>
                      </div>
                      {reg.active ? (
                        <span className="text-[10px] bg-[#163622] text-[#4ADE80] px-1.5 py-0.5 rounded font-mono font-medium border border-[#225533]">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] bg-[#1C1C1C] text-[#616161] px-1.5 py-0.5 rounded font-mono border border-[#262626]">
                          Disabled
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Region Trigger */}
            {!sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-[10px] bg-[#141414] hover:bg-[#1A1A1A] border border-[#222222] hover:border-[#333333] text-[12px] transition-colors cursor-pointer"
                title="Select Practice Region"
              >
                <div className="flex items-center gap-2 text-[#D1D1D1]">
                  <span className="text-[14px]">🇮🇳</span>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider font-semibold">Region</span>
                    <span className="text-[12px] font-medium text-[#FFFFFF]">India</span>
                  </div>
                </div>
                <ChevronDown size={14} className={`text-[#8A8A8A] transition-transform duration-200 ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                className="w-full flex justify-center py-2 rounded-[10px] hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                title="Region: India (Active)"
              >
                <span className="text-[16px]">🇮🇳</span>
              </button>
            )}
          </div>

          {/* Settings NavLink (Swapped Below Region) */}
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

      {/* ── 2. MOBILE & TABLET SLIDE-OVER DRAWER (Shopify Admin Style) ────── */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 w-[260px] max-w-[80vw] h-full bg-[#0A0A0A] border-r border-[#1C1C1C] flex flex-col justify-between p-4 z-30 text-[#FFFFFF] lg:hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] select-none ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex flex-col gap-4">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1C1C1C]">
            <div 
              className="cursor-pointer"
              onClick={() => { setIsMobileMenuOpen(false); navigate('/doctor-dashboard'); }}
            >
              <Logo size="sm" theme="dark" subtitle="Clinical Suite" />
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => { setIsMobileMenuOpen(false); navigate('/doctor-dashboard/availability'); }}
                className="p-1.5 rounded-md text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                title="Settings"
              >
                <Settings size={16} />
              </button>
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                title="Close Menu"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Items (Search box removed as requested) */}
          <nav className="flex flex-col gap-1 mt-1">
            {navItems.map((item) => {
              const active = isNavActive(item);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-[#222222] text-[#FFFFFF] font-semibold'
                      : 'text-[#D1D1D1] hover:bg-[#1A1A1A] hover:text-[#FFFFFF]'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-[#FFFFFF]' : 'text-[#8A8A8A]'} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Drawer Bottom: Region Dropdown + Profile + Close Pill */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#1C1C1C]">
          {/* Mobile Region Dropdown */}
          <div className="relative" ref={mobileRegionDropdownRef}>
            {isMobileRegionDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#181818] border border-[#2A2A2A] rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in text-[12px]">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider border-b border-[#262626] mb-1 flex items-center justify-between">
                  <span>Practice Region</span>
                  <span className="text-[9px] text-[#4ADE80] font-mono">1 Active</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {REGIONS.map((reg) => (
                    <div
                      key={reg.code}
                      onClick={() => {
                        if (reg.active) setIsMobileRegionDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                        reg.active
                          ? 'bg-[#222222] text-[#FFFFFF] font-medium cursor-pointer'
                          : 'text-[#616161] opacity-40 cursor-not-allowed select-none'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[14px]">{reg.flag}</span>
                        <span className="text-[12px]">{reg.name}</span>
                      </div>
                      {reg.active ? (
                        <span className="text-[10px] bg-[#163622] text-[#4ADE80] px-1.5 py-0.5 rounded font-mono font-medium border border-[#225533]">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] bg-[#1C1C1C] text-[#616161] px-1.5 py-0.5 rounded font-mono border border-[#262626]">
                          Disabled
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsMobileRegionDropdownOpen(!isMobileRegionDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-[10px] bg-[#141414] hover:bg-[#1A1A1A] border border-[#222222] text-[12px] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-[#D1D1D1]">
                <span className="text-[14px]">🇮🇳</span>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider font-semibold">Region</span>
                  <span className="text-[12px] font-medium text-[#FFFFFF]">India</span>
                </div>
              </div>
              <ChevronDown size={14} className={`text-[#8A8A8A] transition-transform duration-200 ${isMobileRegionDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Profile Row */}
          <div className="flex items-center justify-between p-1.5 rounded-[10px] bg-[#121212] border border-[#1F1F1F]">
            <div className="flex items-center gap-2">
              <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-7 h-7 rounded-md" } }} />
              <div className="flex flex-col leading-tight">
                <span className="text-[12px] font-medium text-[#FFFFFF]">
                  Dr. {user?.firstName || 'Doctor'}
                </span>
                <span className="text-[10px] text-[#A3F56C] flex items-center gap-1 mt-0.5">
                  ● {profile?.specialization || 'Physiotherapy'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={() => { setIsMobileMenuOpen(false); navigate('/doctor-dashboard/availability'); }}
                className="p-1.5 rounded-full text-[#E0E0E0] bg-[#1C1C1C] hover:bg-[#252525] border border-[#2B2B2B] transition-colors cursor-pointer"
                title="Settings"
              >
                <Settings size={13} />
              </button>
              <button 
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-full text-[#E0E0E0] bg-[#1C1C1C] hover:bg-[#252525] border border-[#2B2B2B] transition-colors cursor-pointer"
                title="Close Menu"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Scrim Overlay on top of shifted white canvas (clicking outside closes menu) */}
      <div 
        className={`fixed top-0 bottom-0 left-[260px] right-0 z-40 bg-black/25 backdrop-blur-[0.5px] transition-opacity duration-300 lg:hidden cursor-pointer ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {/* Subtle grab handle indicator matching Shopify */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-black/40 rounded-full" />
      </div>

      {/* ── 3. PURE WHITE WORKSPACE WITH ROUNDED INNER CANVAS (#FFFFFF) ─── */}
      <div 
        className={`flex-1 flex flex-col min-w-0 bg-[#FFFFFF] overflow-hidden shadow-[-6px_0_20px_rgba(0,0,0,0.25)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] relative z-20 ${
          isMobileMenuOpen 
            ? 'translate-x-[260px] rounded-l-[20px] lg:translate-x-0 lg:rounded-l-[16px] shadow-2xl' 
            : 'translate-x-0 rounded-none lg:rounded-l-[16px]'
        } lg:border-l lg:border-t lg:border-b lg:border-[#2B2B2B]`}
      >
        
        {/* Top Header Bar matching Screenshot */}
        <header className="h-[46px] shrink-0 bg-[#FFFFFF] border-b border-[#EAEAEA] px-4 md:px-6 flex items-center justify-between text-[13px] select-none">
          
          {/* Left Context Selector */}
          <div className="flex items-center gap-2 text-[#616161]">
            {/* Mobile / Tablet Hamburger Menu Trigger */}
            <button 
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex lg:hidden p-1.5 -ml-1 text-[#202223] hover:bg-[#F4F4F4] rounded-md transition-colors cursor-pointer mr-1"
              title="Open Menu"
            >
              <Menu size={17} />
            </button>
            <span className="font-medium text-[#202223]">
              Today
            </span>
            <span className="text-[#E5E5E5] hidden sm:inline">·</span>
            <span className="text-[#616161] hover:text-[#202223] cursor-pointer transition-colors hidden sm:inline">
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

        {/* Main Scrollable Viewport (Full width without artificial max-w restriction) */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden min-w-0 bg-[#FFFFFF] pb-24 lg:pb-6 ${
          ['/doctor-dashboard', '/doctor-dashboard/appointments', '/doctor-dashboard/regions'].includes(location.pathname) ? 'p-0 pb-24 lg:pb-0' : 'px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 pb-24 lg:pb-6'
        }`}>
          <div className="w-full max-w-full min-w-0">
            <Outlet context={{ todayCounts }} />
          </div>
        </main>
      </div>

      {/* ── 4. MOBILE & TABLET FLOATING ACTION BAR ──────── */}
      <div className={`fixed bottom-3 left-0 right-0 px-4 z-40 block lg:hidden select-none transition-all duration-300 pointer-events-none ${
        isMobileMenuOpen ? 'opacity-0 translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        <div className="max-w-[360px] mx-auto bg-[#0A0A0A]/95 backdrop-blur-md text-[#FFFFFF] rounded-full px-3.5 py-1.5 border border-[#2B2B2B] shadow-2xl flex items-center justify-between pointer-events-auto">
          {/* Left: Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-[#FFFFFF] hover:bg-[#292929] transition-colors cursor-pointer shrink-0"
            title="Open Menu"
          >
            <Menu size={16} />
          </button>

          {/* Center: Active View Tag Pill */}
          <div 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#1A1A1A] rounded-full border border-[#262626] text-[11px] font-medium text-[#E0E0E0] cursor-pointer truncate max-w-[170px]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A3F56C] shrink-0" />
            <span className="truncate">{activeNavItem.name}</span>
          </div>

          {/* Right: Quick Action / Appointments Trigger */}
          <button
            type="button"
            onClick={() => navigate('/doctor-dashboard/appointments')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-[#A3F56C] hover:bg-[#292929] transition-colors cursor-pointer shrink-0"
            title="View Appointments"
          >
            <Calendar size={15} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default DoctorLayout;