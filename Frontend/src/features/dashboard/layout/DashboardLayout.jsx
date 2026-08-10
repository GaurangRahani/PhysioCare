import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import '../../../index.css';
import '../../admin/layout/AdminTheme.css'; // Import the global premium theme
import Footer from '../../../components/layout/Footer';
import UnifiedHeader from '../../../components/layout/UnifiedHeader';

const DashboardLayout = () => {
  const { user } = useUser();
  const location = useLocation();

  const navigation = [
    {
      name: 'My Schedule',
      href: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z" />
        </svg>
      ),
    },
    {
      name: 'Appointments',
      href: '/dashboard/appointments',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z" />
        </svg>
      ),
    },
    {
      name: 'Progress',
      href: '/dashboard/progress',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M1 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z" />
        </svg>
      ),
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
          <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
        </svg>
      ),
    },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="admin-theme" style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <UnifiedHeader 
        brandLink="/dashboard" 
        userName={user?.firstName || 'Patient'} 
        navigation={navigation} 
      />

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main style={{ width: '100%', margin: '0 auto', padding: '3rem 1.5rem', position: 'relative', zIndex: 20 }}>
        <Outlet />
      </main>
      
      <Footer />
      
      {/* Additional Keyframes specific to the refined theme shapes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
