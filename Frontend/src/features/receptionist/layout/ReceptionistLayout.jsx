import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import Footer from '../../../components/layout/Footer';
import UnifiedHeader from '../../../components/layout/UnifiedHeader';
import './ReceptionistTheme.css';

const ReceptionistLayout = () => {
  const { user } = useUser();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/receptionist-dashboard', icon: 'fa-solid fa-border-all' },
    { name: 'Calendar', href: '/receptionist-dashboard/calendar', icon: 'fa-regular fa-calendar' },
    { name: 'Patients', href: '/receptionist-dashboard/patients', icon: 'fa-solid fa-users' },
  ];

  const isActive = (path) => {
    if (path === '/receptionist-dashboard') {
      return location.pathname === '/receptionist-dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="receptionist-theme">
      
      {/* =========================================================
           1. FULL-WIDTH THEME BACKGROUND & ANIMATED MARGIN SHAPES
           ========================================================= */}
      <div className="theme-background">
          {/* Top Wave Overlay */}
          <div className="bg-wave-top">
              <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
                  <path fill="#f8f9fa" fillOpacity="1" d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,117.3C960,96,1056,128,1152,149.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
          </div>
          
          {/* Dot Matrix */}
          <div className="bg-dot-matrix"></div>

          {/* Animated Floating Elements */}
          <div className="shape-zigzag">
              <svg width="80" height="60" viewBox="0 0 80 60">
                  <polyline points="0,15 15,0 30,15 45,0 60,15 75,0" fill="none" stroke="rgba(86, 90, 207, 0.4)" strokeWidth="2"/>
                  <polyline points="0,30 15,15 30,30 45,15 60,30 75,15" fill="none" stroke="rgba(86, 90, 207, 0.4)" strokeWidth="2"/>
                  <polyline points="0,45 15,30 30,45 45,30 60,45 75,30" fill="none" stroke="rgba(86, 90, 207, 0.4)" strokeWidth="2"/>
              </svg>
          </div>
          <div className="shape-cross">
              <svg viewBox="0 0 50 50">
                  <path d="M20,0 h10 v20 h20 v10 h-20 v20 h-10 v-20 h-20 v-10 h20 z" fill="none" stroke="rgba(86, 90, 207, 0.4)" strokeWidth="3"/>
              </svg>
          </div>
          <div className="shape-circle"></div>
      </div>

      <UnifiedHeader 
        brandLink="/receptionist-dashboard" 
        roleName="Receptionist"
        userName={user?.fullName || 'Receptionist'} 
        navigation={navigation} 
      />

      {/* =========================================================
           3. MAIN DASHBOARD CONTENT
           ========================================================= */}
      <main>
          <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default ReceptionistLayout;
