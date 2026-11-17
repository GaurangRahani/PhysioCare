import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import Logo from '../../../components/common/Logo';
import {
  Home,
  Calendar,
  TrendingUp,
  User,
  Settings,
  Search,
  Menu,
  X,
  Bell,
  Sparkles,
  ChevronRight,
  Activity,
  CheckCircle2,
  Clock,
  Receipt
} from 'lucide-react';

const DashboardLayout = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Tablet & Desktop sidebar collapse state (auto-collapse on tablet < 1024px to match Screenshot 1)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  // Mobile slide-over drawer state (Screenshots 2 & 3)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Home', label: 'My Schedule', href: '/dashboard', icon: Home, exact: true },
    { name: 'Appointments', label: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Progress', label: 'Recovery Progress', href: '/dashboard/progress', icon: TrendingUp },
    { name: 'Billing', label: 'Billing & Invoices', href: '/dashboard/invoices', icon: Receipt },
    { name: 'Profile', label: 'Health Profile', href: '/dashboard/profile', icon: User },
  ];

  const isNavActive = (item) => {
    if (item.exact) {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(item.href);
  };

  // Get current active tab name for mobile bottom pill
  const activeNavItem = navItems.find(isNavActive) || navItems[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0A] font-['Inter',system-ui,sans-serif] text-[#202223]">
      
      {/* ── 1. DESKTOP & TABLET SIDEBAR (Hidden on mobile <768px) ────────── */}
      <aside 
        className={`hidden md:flex flex-col justify-between shrink-0 bg-[#0A0A0A] border-r border-[#1C1C1C] transition-all duration-200 z-30 select-none ${
          sidebarCollapsed ? 'w-[64px] px-2 py-3' : 'w-[210px] px-3 py-3.5'
        }`}
      >
        {/* Top: Brand Header & Search */}
        <div className="flex flex-col gap-3">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-1 h-[32px]">
            <div 
              className="cursor-pointer overflow-hidden"
              onClick={() => navigate('/dashboard')}
            >
              <Logo 
                size="sm" 
                theme="dark" 
                subtitle="Patient Portal" 
                collapsed={sidebarCollapsed} 
              />
            </div>

            {/* Collapse toggle (Desktop only) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1 rounded-md text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu size={14} />
            </button>
          </div>

          {/* Quick Search Trigger */}
          <div 
            onClick={() => {
              const el = document.getElementById('patient-search-input');
              if (el) el.focus();
            }}
            className={`flex items-center gap-2 h-[32px] rounded-[8px] bg-[#141414] border border-[#222222] text-[#8A8A8A] text-[12px] hover:border-[#333333] transition-colors cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : 'px-2.5 justify-between'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Search size={14} className="text-[#8A8A8A] shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Search portal...</span>}
            </div>
            {!sidebarCollapsed && (
              <kbd className="text-[9px] font-mono bg-[#1E1E1E] text-[#8A8A8A] px-1.5 py-0.5 rounded border border-[#2B2B2B]">
                Ctrl K
              </kbd>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 mt-1">
            {navItems.map((item) => {
              const active = isNavActive(item);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
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
            to="/dashboard/profile"
            title={sidebarCollapsed ? "Settings" : undefined}
            className={({ isActive }) => `flex items-center gap-2.5 px-2.5 h-[36px] rounded-[10px] text-[13px] transition-colors ${
              isActive && location.pathname.includes('/profile')
                ? 'bg-[#292929] text-[#FFFFFF] font-medium'
                : 'text-[#D1D1D1] hover:bg-[#1A1A1A] hover:text-[#FFFFFF]'
            } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <Settings size={16} className="text-[#8A8A8A]" />
            {!sidebarCollapsed && <span>Settings</span>}
          </NavLink>

          {/* Patient Profile Bar */}
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
                  {user?.firstName || 'Patient'}
                </span>
                <span className="text-[10px] text-[#8A8A8A] truncate flex items-center gap-1 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A3F56C]" />
                  Active Recovery
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── 2. MOBILE SLIDE-OVER DRAWER (Shopify Admin Style) ────────── */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 w-[260px] max-w-[80vw] h-full bg-[#0A0A0A] border-r border-[#1C1C1C] flex flex-col justify-between p-4 z-30 text-[#FFFFFF] md:hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] select-none ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex flex-col gap-4">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1C1C1C]">
            <div 
              className="cursor-pointer"
              onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard'); }}
            >
              <Logo size="sm" theme="dark" subtitle="Patient Portal" />
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard/profile'); }}
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

          {/* Drawer Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
            <input
              type="text"
              placeholder="Search care portal..."
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-[#1C1C1C] text-[#FFFFFF] placeholder-[#8A8A8A] rounded-lg border border-[#2B2B2B] outline-none focus:border-[#4088F8] transition-colors"
            />
          </div>

          {/* Navigation Items */}
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

        {/* Drawer Bottom matching screenshot: Profile + Action Pills */}
        <div className="pt-3 border-t border-[#1C1C1C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserButton afterSignOutUrl="/" />
            <div className="flex flex-col leading-tight">
              <span className="text-[12px] font-medium text-[#FFFFFF]">
                {user?.firstName || 'Patient'}
              </span>
              <span className="text-[10px] text-[#A3F56C] flex items-center gap-1 mt-0.5">
                ● Active Protocol
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); navigate('/dashboard/profile'); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-[#E0E0E0] bg-[#1C1C1C] hover:bg-[#252525] border border-[#2B2B2B] transition-colors cursor-pointer"
            >
              <Settings size={12} />
              <span>Settings</span>
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
      </aside>

      {/* Scrim Overlay on top of the shifted white canvas (clicking outside closes menu) */}
      <div 
        className={`fixed top-0 bottom-0 left-[260px] right-0 z-40 bg-black/25 backdrop-blur-[0.5px] transition-opacity duration-300 md:hidden cursor-pointer ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {/* Subtle grab handle indicator matching Shopify */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-black/40 rounded-full" />
      </div>

      {/* ── 3. PURE WHITE WORKSPACE CANVAS (#FFFFFF) ───────────────────── */}
      <div 
        className={`flex-1 flex flex-col min-w-0 bg-[#FFFFFF] md:border-l md:border-t md:border-[#2B2B2B] overflow-hidden shadow-[-6px_0_20px_rgba(0,0,0,0.25)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] relative z-20 ${
          isMobileMenuOpen 
            ? 'translate-x-[260px] rounded-l-[20px] md:translate-x-0 md:rounded-tl-[16px] md:rounded-bl-none shadow-2xl' 
            : 'translate-x-0 rounded-none md:rounded-tl-[16px]'
        }`}
      >
        
        {/* Top Header Bar matching Screenshot 1 & 3 */}
        <header className="h-[46px] shrink-0 bg-[#FFFFFF] border-b border-[#EAEAEA] px-4 md:px-6 flex items-center justify-between text-[13px] select-none">
          {/* Left: Context / Date */}
          <div className="flex items-center gap-2 text-[#616161]">
            <span className="font-semibold text-[#202223]">
              Today
            </span>
          </div>

          {/* Right: Status & Quick stats (Hidden on mobile) */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-6 text-[12px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[#8A8A8A]">Adherence</span>
                <span className="font-semibold text-[#202223] font-mono">92%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#8A8A8A]">Care Status</span>
                <span className="font-semibold text-[#245B19] bg-[#D9F7C3] px-2 py-0.5 rounded-full text-[11px]">
                  Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[12px] text-[#616161]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#A3F56C]" />
              <span>Live Care</span>
            </div>
          </div>
        </header>

        {/* Main Scrollable Viewport (Full width without artificial max-w restriction) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 bg-[#FFFFFF] px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 pb-24 md:pb-6">
          <div className="w-full max-w-full min-w-0">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── 4. MOBILE FLOATING ACTION BAR (Matching Screenshot 3) ──────── */}
      <div className={`fixed bottom-3 left-0 right-0 px-4 z-40 block md:hidden select-none transition-all duration-300 pointer-events-none ${
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
            <span className="truncate">{activeNavItem.label}</span>
          </div>

          {/* Right: Care Assistant Button */}
          <button
            type="button"
            onClick={() => {
              navigate('/dashboard');
              const el = document.getElementById('patient-search-input');
              if (el) el.focus();
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1A1A1A] text-[#A3F56C] hover:bg-[#292929] transition-colors cursor-pointer shrink-0"
            title="Sidekick Care Assistant"
          >
            <Sparkles size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default DashboardLayout;
