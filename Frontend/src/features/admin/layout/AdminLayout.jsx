import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import Footer from '../../../components/layout/Footer';
import UnifiedHeader from '../../../components/layout/UnifiedHeader';
import './AdminTheme.css';

const AdminLayout = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // Route guard — only 'admin' role may access
  useEffect(() => {
    if (!isLoaded) return;
    const role = user?.publicMetadata?.role;
    if (role && role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [isLoaded, user, navigate]);

  const handleSignOut = () => signOut(() => navigate('/'));

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/><path fillRule="evenodd" d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/></svg>
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path fillRule="evenodd" d="M5.216 14A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216z"/><path d="M4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/></svg>
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/></svg>
    }
  ];

  return (
    <div className="admin-theme">
      {/* Background Layer with MediTro Theme Shapes */}
      <div className="bg-layer">
        {/* Soft Wave Background */}
        <svg className="decor wave-bg" viewBox="0 0 1440 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path fill="rgba(86, 90, 207, 0.03)" d="M0,150 C320,350 420,50 740,150 C1060,250 1280,50 1440,150 L1440,0 L0,0 Z"></path>
          <path fill="rgba(86, 90, 207, 0.02)" d="M0,250 C400,400 500,-50 900,150 C1200,300 1350,100 1440,200 L1440,0 L0,0 Z"></path>
        </svg>

        {/* Floating ZigZag */}
        <svg className="decor zigzag" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 20 L20 0 L40 20 L60 0 L80 20 L100 0" stroke="var(--primary-color)" strokeWidth="3" fill="none" opacity="0.6"/>
          <path d="M0 40 L20 20 L40 40 L60 20 L80 40 L100 20" stroke="var(--primary-color)" strokeWidth="3" fill="none" opacity="0.6"/>
          <path d="M0 60 L20 40 L40 60 L60 40 L80 60 L100 40" stroke="var(--primary-color)" strokeWidth="3" fill="none" opacity="0.6"/>
        </svg>

        {/* Dotted Square with Orange Border */}
        <svg className="decor dot-square" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="admin-dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle fill="var(--secondary-color)" cx="2" cy="2" r="1.5" opacity="0.4"></circle>
            </pattern>
          </defs>
          <rect x="0" y="10" width="45" height="45" fill="url(#admin-dots)" />
          <rect x="15" y="0" width="45" height="45" fill="none" stroke="var(--secondary-color)" strokeWidth="1.5" />
        </svg>

        {/* Hollow Orange Triangle */}
        <svg className="decor hollow-triangle" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <polygon points="50,10 90,90 10,90" fill="none" stroke="var(--secondary-color)" strokeWidth="3" opacity="0.8"/>
          <polygon points="50,30 75,80 25,80" fill="none" stroke="var(--secondary-color)" strokeWidth="1" opacity="0.5"/>
        </svg>

        {/* Hollow Purple Cross */}
        <svg className="decor cross-shape" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 0h14v18h18v14H32v18H18V32H0V18h18z" fill="none" stroke="var(--primary-color)" strokeWidth="2" opacity="0.5"/>
        </svg>

        {/* Dotted Circle */}
        <svg className="decor dotted-circle" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="38" fill="none" stroke="var(--primary-color)" strokeWidth="1" strokeDasharray="4 4" opacity="0.6"/>
          <circle cx="40" cy="40" r="30" fill="none" stroke="var(--primary-color)" strokeWidth="0.5" opacity="0.3"/>
        </svg>
      </div>

      <UnifiedHeader 
        brandLink="/admin/dashboard" 
        roleName="Admin"
        userName={`${user?.firstName || 'Admin'} ${user?.lastName || ''}`} 
        navigation={navigation} 
      />

      {/* Main Content */}
      <main className="dashboard-container">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminLayout;
