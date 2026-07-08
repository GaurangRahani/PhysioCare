import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Calendar, ClipboardList, LogOut } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

const DashboardLayout = () => {
  const { user } = useUser();
  const location = useLocation();

  const navigation = [
    { name: 'My Schedule', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { name: 'Progress', href: '/dashboard/progress', icon: ClipboardList },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-light border-r border-gray-100 hidden md:flex md:flex-col shadow-[2px_0_15px_-3px_rgba(0,0,0,0.05)]">
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-[8px] group-hover:bg-primary transition-colors duration-300">
              <Activity className="h-5 w-5 text-primary group-hover:text-light transition-colors duration-300" />
            </div>
            <span className="text-xl font-bold text-dark tracking-tight">PhysioCare</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-[8px] font-medium transition-all duration-200 ${
                  active 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-body hover:bg-gray-50 hover:text-dark'
                }`}
              >
                <item.icon className={`h-5 w-5 ${active ? 'text-primary' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-[8px] border border-gray-100">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold text-heading truncate">{user?.fullName || 'Patient'}</span>
              <span className="text-xs text-body truncate">Patient Portal</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-light border-b border-gray-100 flex items-center justify-between px-4 shadow-sm">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-dark">PhysioCare</span>
          </Link>
          <UserButton afterSignOutUrl="/" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
