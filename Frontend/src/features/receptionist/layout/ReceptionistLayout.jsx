import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Calendar, 
  Users, 
  LayoutDashboard, 
  PanelLeftClose, 
  PanelLeft, 
  Menu, 
  X, 
  ChevronDown, 
  Check
} from 'lucide-react';
import { UserButton, useUser, useAuth } from '@clerk/clerk-react';
import Logo from '../../../components/common/Logo';

const REGIONS = [
  { code: 'IN', name: 'India', flag: '🇮🇳', active: true },
  { code: 'US', name: 'USA', flag: '🇺🇸', active: false },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', active: false },
  { code: 'UK', name: 'UK', flag: '🇬🇧', active: false },
];

const ReceptionistLayout = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isMobileRegionDropdownOpen, setIsMobileRegionDropdownOpen] = useState(false);
  
  const [stats, setStats] = useState({
    appointmentsToday: 0,
    pendingPayments: 0,
    patientsCount: 0
  });

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

  // Fetch summary stats for top header
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        const [apptsRes, patientsRes] = await Promise.all([
          fetch(`${apiUrl}/api/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${apiUrl}/api/receptionists/patients`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const apptsData = await apptsRes.json();
        const patientsData = await patientsRes.json();

        let todayCount = 0;
        let pendingCount = 0;
        const todayDateStr = new Date().toLocaleDateString('en-CA');
        const now = Date.now();

        if (apptsData.success && apptsData.appointments) {
          const appts = apptsData.appointments;
          todayCount = appts.filter(a => 
            a.appointment_date === todayDateStr && 
            !['cancelled', 'no_show'].includes(a.status)
          ).length;

          pendingCount = appts.filter(a => {
            const isPending = a.payment_status === 'pending' || a.status === 'pending_payment';
            if (!isPending) return false;
            if (!a.payment_expires_at) return false;
            return new Date(a.payment_expires_at).getTime() > now;
          }).length;
        }

        const patientsTotal = patientsData.success && patientsData.patients ? patientsData.patients.length : 0;

        setStats({
          appointmentsToday: todayCount,
          pendingPayments: pendingCount,
          patientsCount: patientsTotal
        });
      } catch (err) {
        console.error('Failed to fetch receptionist stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [getToken]);

  const navItems = [
    { name: 'Dashboard', href: '/receptionist-dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Calendar', href: '/receptionist-dashboard/calendar', icon: Calendar },
    { name: 'Patients', href: '/receptionist-dashboard/patients', icon: Users },
  ];

  const isNavActive = (item) => {
    if (item.exact) {
      return location.pathname === '/receptionist-dashboard';
    }
    return location.pathname.startsWith(item.href);
  };

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
              onClick={() => navigate('/receptionist-dashboard')}
            >
              <Logo 
                size="sm" 
                theme="dark" 
                subtitle="Front Desk Suite" 
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

        {/* Bottom Section: Region Dropdown & User Profile */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#1C1C1C]">
          
          {/* Current Region with Dropdown */}
          <div className="relative" ref={regionDropdownRef}>
            {isRegionDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#181818] border border-[#2A2A2A] rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in text-[12px] min-w-[200px]">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider border-b border-[#262626] mb-1 flex items-center justify-between">
                  <span>Desk Region</span>
                  <span className="text-[9px] text-[#4ADE80] font-mono">1 Active</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {REGIONS.map((reg) => (
                    <div
                      key={reg.code}
                      onClick={() => {
                        if (reg.active) {
                          setIsRegionDropdownOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
                        reg.active
                          ? 'bg-[#222222] text-[#FFFFFF] cursor-pointer'
                          : 'text-[#555555] cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{reg.flag}</span>
                        <span className="font-medium">{reg.name}</span>
                      </div>
                      {reg.active ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#4ADE80] font-medium bg-[#4ADE80]/15 px-1.5 py-0.5 rounded">Active</span>
                          <Check size={13} className="text-[#4ADE80]" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#666666] font-normal">Coming Soon</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[10px] bg-[#121212] border border-[#1F1F1F] hover:bg-[#181818] hover:border-[#2C2C2C] transition-all cursor-pointer ${
                sidebarCollapsed ? 'justify-center px-1' : ''
              }`}
              title="Practice Region: India"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">🇮🇳</span>
                {!sidebarCollapsed && (
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider font-semibold">Region</span>
                    <span className="text-[12px] font-medium text-[#FFFFFF]">India</span>
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <ChevronDown size={14} className={`text-[#8A8A8A] transition-transform duration-200 ${isRegionDropdownOpen ? 'rotate-180 text-[#FFFFFF]' : ''}`} />
              )}
            </button>
          </div>

          {/* User Profile Bar */}
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
                  {user?.fullName || user?.firstName || 'Receptionist'}
                </span>
                <span className="text-[10px] text-[#8A8A8A] truncate flex items-center gap-1 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A3F56C]" />
                  Front Desk Active
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
          <div className="flex items-center justify-between pb-3 border-b border-[#1C1C1C]">
            <div 
              className="cursor-pointer"
              onClick={() => { setIsMobileMenuOpen(false); navigate('/receptionist-dashboard'); }}
            >
              <Logo size="sm" theme="dark" subtitle="Front Desk Suite" />
            </div>

            <button 
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-md text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors cursor-pointer"
              title="Close Menu"
            >
              <X size={18} />
            </button>
          </div>

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

        {/* Drawer Bottom */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#1C1C1C]">
          <div className="relative" ref={mobileRegionDropdownRef}>
            {isMobileRegionDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#181818] border border-[#2A2A2A] rounded-xl shadow-2xl p-1.5 z-50 animate-fade-in text-[12px]">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8A8A8A] uppercase tracking-wider border-b border-[#262626] mb-1 flex items-center justify-between">
                  <span>Desk Region</span>
                  <span className="text-[9px] text-[#4ADE80] font-mono">1 Active</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {REGIONS.map((reg) => (
                    <div
                      key={reg.code}
                      onClick={() => {
                        if (reg.active) setIsMobileRegionDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors ${
                        reg.active
                          ? 'bg-[#222222] text-[#FFFFFF] cursor-pointer'
                          : 'text-[#555555] cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{reg.flag}</span>
                        <span className="font-medium">{reg.name}</span>
                      </div>
                      {reg.active ? (
                        <Check size={13} className="text-[#4ADE80]" />
                      ) : (
                        <span className="text-[10px] text-[#666666]">Soon</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsMobileRegionDropdownOpen(!isMobileRegionDropdownOpen)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-[10px] bg-[#121212] border border-[#1F1F1F] hover:bg-[#181818] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm leading-none">🇮🇳</span>
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[10px] text-[#8A8A8A] uppercase tracking-wider font-semibold">Region</span>
                  <span className="text-[12px] font-medium text-[#FFFFFF]">India</span>
                </div>
              </div>
              <ChevronDown size={14} className="text-[#8A8A8A]" />
            </button>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded-[10px] bg-[#121212] border border-[#1F1F1F]">
            <div className="flex items-center gap-2">
              <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-7 h-7 rounded-md" } }} />
              <div className="flex flex-col leading-tight">
                <span className="text-[12px] font-medium text-[#FFFFFF]">
                  {user?.fullName || user?.firstName || 'Receptionist'}
                </span>
                <span className="text-[10px] text-[#A3F56C] flex items-center gap-1 mt-0.5">
                  ● Front Desk
                </span>
              </div>
            </div>
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
      </aside>

      {/* Scrim Overlay */}
      <div 
        className={`fixed top-0 bottom-0 left-[260px] right-0 z-40 bg-black/25 backdrop-blur-[0.5px] transition-opacity duration-300 lg:hidden cursor-pointer ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
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
        
        {/* Top Header Bar matching Doctor Suite */}
        <header className="h-[46px] shrink-0 bg-[#FFFFFF] border-b border-[#EAEAEA] px-4 md:px-6 flex items-center justify-between text-[13px] select-none">
          
          {/* Left Context Selector */}
          <div className="flex items-center gap-2 text-[#616161]">
            <button 
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex lg:hidden p-1.5 -ml-1 text-[#202223] hover:bg-[#F4F4F4] rounded-md transition-colors cursor-pointer mr-1"
              title="Open Menu"
            >
              <Menu size={17} />
            </button>
            <span className="font-semibold text-[#202223]">
              Today
            </span>
            <span className="text-[#E5E5E5] hidden sm:inline">·</span>
            <span className="text-[#616161] hover:text-[#202223] cursor-pointer transition-colors hidden sm:inline font-medium">
              Front Desk Reception
            </span>
          </div>

          {/* Center Metrics */}
          <div className="hidden lg:flex items-center gap-8 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="text-[#8A8A8A]">Today's Visits</span>
              <span className="font-semibold text-[#202223]">{stats.appointmentsToday}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8A8A8A]">Pending Holds</span>
              <span className={`font-semibold ${stats.pendingPayments > 0 ? 'text-[#B42318]' : 'text-[#202223]'}`}>
                {stats.pendingPayments}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8A8A8A]">Patient Roster</span>
              <span className="font-semibold text-[#202223]">{stats.patientsCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8A8A8A]">Desk Status</span>
              <span className="font-semibold text-[#245B19] bg-[#D9F7C3] px-2 py-0.5 rounded-full text-[11px]">
                Accepting
              </span>
            </div>
          </div>

          {/* Right Status (Matching Doctor live indicator) */}
          <div className="flex items-center gap-2 text-[12px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A3F56C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A3F56C]"></span>
            </span>
            <span className="text-[#A3F56C] font-mono text-[11px] hidden sm:inline">● live desk</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 bg-[#FFFFFF] px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* ── 4. MOBILE BOTTOM FLOATING ACTION DOCK (Shopify Style) ─────── */}
        <div className="fixed bottom-3 left-0 right-0 px-4 z-40 block md:hidden pointer-events-none transition-all duration-300">
          <div className="mx-auto max-w-[340px] bg-[#0A0A0A]/95 backdrop-blur-md border border-[#2B2B2B] shadow-[0_8px_30px_rgb(0,0,0,0.35)] rounded-full px-3 py-1.5 flex items-center justify-around pointer-events-auto text-[#FFFFFF]">
            {navItems.map((item) => {
              const active = isNavActive(item);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center gap-1 py-1 px-3 rounded-full text-[11px] transition-colors ${
                    active ? 'text-[#FFFFFF] font-semibold bg-[#222222]' : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReceptionistLayout;
