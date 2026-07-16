import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Calendar, Users } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

const ReceptionistLayout = () => {
  const { user } = useUser();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/receptionist-dashboard', icon: LayoutDashboard },
    { name: 'Calendar', href: '/receptionist-dashboard/calendar', icon: Calendar },
    { name: 'Patients', href: '/receptionist-dashboard/patients', icon: Users },
  ];

  const isActive = (path) => {
    if (path === '/receptionist-dashboard') {
      return location.pathname === '/receptionist-dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Horizontal Top Navbar */}
      <header className="bg-light sticky top-0 z-50 w-full border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <Link to="/receptionist-dashboard" className="flex items-center gap-2 group">
              <div className="bg-primary p-2 rounded-lg">
                <Activity className="h-6 w-6 text-light" />
              </div>
              <span className="text-2xl font-bold text-dark tracking-tight">PhysioCare <span className="text-sm font-medium text-primary ml-1">Receptionist</span></span>
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
                {user?.fullName || 'Receptionist'}
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

export default ReceptionistLayout;
