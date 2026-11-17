import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Settings, 
  LayoutDashboard, 
  PanelLeftClose, 
  PanelLeft, 
  Menu, 
  X, 
  ChevronDown, 
  Check,
  LogOut,
  Activity
} from 'lucide-react';
import { UserButton, useUser, useClerk } from '@clerk/clerk-react';
import Logo from '../../../components/common/Logo';

const REGIONS = [
  { code: 'IN', name: 'India', flag: '🇮🇳', active: true },
  { code: 'US', name: 'USA', flag: '🇺🇸', active: false },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', active: false },
  { code: 'UK', name: 'UK', flag: '🇬🇧', active: false },
];

const AdminLayout = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
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
  const regionDropdownRef = useRef(null);

  // Route guard — only 'admin' role may access
  useEffect(() => {
    if (!isLoaded) return;
    const role = user?.publicMetadata?.role;
    if (role && role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [isLoaded, user, navigate]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target)) {
        setIsRegionDropdownOpen(false);
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

  const handleSignOut = () => signOut(() => navigate('/'));

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isNavActive = (item) => {
    return location.pathname.startsWith(item.href);
  };

  const getPageTitle = () => {
    if (location.pathname.includes('/admin/users')) return 'User Directory & Roles';
    if (location.pathname.includes('/admin/settings')) return 'System & Clinic Settings';
    return 'Executive Overview';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] font-['Inter',system-ui,sans-serif] text-[#202223] relative">
      
      {/* ── 1. PRIMARY MONOCHROMATIC SIDEBAR (Desktop & Tablet) ──────────── */}
      <aside 
        className={`hidden md:flex flex-col justify-between shrink-0 bg-[#0A0A0A] border-r border-[#1C1C1C] transition-all duration-200 z-30 select-none ${
          sidebarCollapsed ? 'w-[64px] px-2 py-3' : 'w-[210px] px-3 py-3.5'
        }`}
      >
        {/* Top: Brand Header */}
        <div className="flex flex-col gap-3">
          
          {/* Brand Row */}
          <div className="flex items-center justify-between px-1.5 h-8">
            <div 
              className="cursor-pointer"
              onClick={() => navigate('/admin/dashboard')}
            >
              <Logo 
                size="sm" 
                theme="dark" 
                subtitle="Admin Suite" 
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
                  <Icon size={16} className={active ? 'text-[#FFFFFF]' : 'text-[#8A8A8A]'} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Controls & Profile */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#1C1C1C]">
          
          {/* Region Selector (India locked) */}
          <div className="relative" ref={regionDropdownRef}>
            <button
              onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
              className={`w-full flex items-center justify-between h-[32px] px-2 rounded-lg text-[12px] bg-[#141414] hover:bg-[#1F1F1F] text-[#CCCCCC] transition-colors cursor-pointer border border-[#222222] ${
                sidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Operational Region"
            >
              <div className="flex items-center gap-2">
                <span className="text-[14px]">🇮🇳</span>
                {!sidebarCollapsed && (
                  <span className="font-medium text-[#E5E5E5] text-[11px]">Region: India</span>
                )}
              </div>
              {!sidebarCollapsed && <ChevronDown size={13} className="text-[#888888]" />}
            </button>

            {isRegionDropdownOpen && !sidebarCollapsed && (
              <div className="absolute bottom-full left-0 mb-1 w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg shadow-xl py-1 z-50">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-[#888888] uppercase tracking-wider">
                  Select Clinic Region
                </div>
                {REGIONS.map((region) => (
                  <button
                    key={region.code}
                    disabled={!region.active}
                    onClick={() => setIsRegionDropdownOpen(false)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] text-left transition-colors ${
                      region.active 
                        ? 'text-[#FFFFFF] hover:bg-[#252525] cursor-pointer' 
                        : 'text-[#666666] cursor-not-allowed opacity-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{region.flag}</span>
                      <span>{region.name}</span>
                    </span>
                    {region.active ? (
                      <Check size={12} className="text-[#A3F56C]" />
                    ) : (
                      <span className="text-[9px] bg-[#222222] text-[#888888] px-1 rounded">Soon</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Footer */}
          <div className={`flex items-center gap-2 px-1 py-1 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2 min-w-0">
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-7 h-7 rounded-full border border-[#333333]"
                  }
                }}
              />
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[12px] font-medium text-[#FFFFFF] truncate leading-tight">
                    {user?.fullName || 'Administrator'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A3F56C]" />
                    <span className="text-[10px] text-[#A3F56C] font-mono leading-none">
                      ADMIN
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button
                onClick={handleSignOut}
                className="p-1 rounded-md text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── 2. MOBILE TOP BAR & NAVIGATION ─────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[52px] bg-[#0A0A0A] border-b border-[#1C1C1C] flex items-center justify-between px-3.5 z-40">
        <div 
          className="cursor-pointer"
          onClick={() => navigate('/admin/dashboard')}
        >
          <Logo size="sm" theme="dark" subtitle="Admin Suite" />
        </div>

        <div className="flex items-center gap-2">
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "w-7 h-7 rounded-full border border-[#333333]"
              }
            }}
          />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-[#CCCCCC] hover:text-[#FFFFFF] hover:bg-[#1C1C1C] rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div 
            className="fixed inset-0"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative bg-[#0F0F0F] border-t border-[#222222] rounded-t-2xl p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#FFFFFF]">AlignCare Admin</span>
                <span className="text-[10px] bg-[#1C1C1C] text-[#A3F56C] font-mono px-2 py-0.5 rounded-full border border-[#2D2D2D]">
                  LIVE SUITE
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-[#888888] hover:text-[#FFFFFF]"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const active = isNavActive(item);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                      active 
                        ? 'bg-[#292929] text-[#FFFFFF]' 
                        : 'text-[#D1D1D1] hover:bg-[#1C1C1C] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-[#FFFFFF]' : 'text-[#888888]'} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-[12px] text-[#888888]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#A3F56C]" /> Region: India (IN)
              </span>
              <button
                onClick={handleSignOut}
                className="text-[#FF6B6B] hover:underline flex items-center gap-1"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. MAIN CONTENT CANVAS ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FFFFFF] overflow-hidden shadow-[-6px_0_20px_rgba(0,0,0,0.25)] md:rounded-l-[16px] md:border-l md:border-t md:border-b md:border-[#2B2B2B] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] relative z-20 pt-[52px] md:pt-0">
        
        {/* Top Header Bar for Desktop */}
        <header className="h-[48px] shrink-0 bg-[#FFFFFF] border-b border-[#EAEAEA] px-4 md:px-6 flex items-center justify-between select-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-[#202223] truncate">
              {getPageTitle()}
            </span>
            <span className="hidden sm:inline-block text-[#CCCCCC]">/</span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E3F1DF] text-[#008060] border border-[#C3E6CD]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#008060] animate-pulse" />
              Operational
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-[#616161]">
              <span className="w-2 h-2 rounded-full bg-[#008060]" />
              <span>
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-[#EAEAEA] hidden sm:block" />
            <span className="text-[11px] font-mono text-[#8A8A8A] hidden sm:inline-block">
              HQ · India (IST)
            </span>
          </div>
        </header>

        {/* Dynamic Outlet Body */}
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6 bg-[#FAFAFA]">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default AdminLayout;
