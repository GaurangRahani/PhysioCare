import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Activity } from 'lucide-react';

const UnifiedHeader = ({ brandLink, roleName, navigation, userName }) => {
  const location = useLocation();

  const isActive = (href) => {
    if (href === brandLink) return location.pathname === brandLink || location.pathname === `${brandLink}/`;
    return location.pathname.startsWith(href);
  };

  return (
    <>
      <style>{`
        .unified-nav-link {
          color: #444444; /* body text color fallback */
          color: var(--gray-600, #444444);
        }
        .unified-nav-link:hover {
          color: var(--secondary, #f17732) !important;
        }
        .unified-nav-link.active {
          color: var(--primary, #565acf) !important;
        }
      `}</style>
      <header style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(86, 90, 207, 0.1)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      }}>
        {/* Brand */}
        <Link to={brandLink} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--dark-brand-color, #1f2278)', textDecoration: 'none' }}>
          <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
            <Activity className="h-6 w-6" />
          </div>
          <span className="flex items-center gap-2">
            PhysioCare
            {roleName && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mt-1">
                {roleName}
              </span>
            )}
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav style={{ display: 'flex', gap: '2.5rem' }} className="hidden md:flex">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`unified-nav-link ${active ? 'active' : ''}`}
                style={{
                  textDecoration: 'none',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'color 0.2s ease-in-out',
                  position: 'relative',
                }}
              >
                {typeof item.icon === 'string' ? <i className={item.icon}></i> : item.icon}
                {item.name}
                {active && (
                  <div style={{ position: 'absolute', bottom: '-1.5rem', left: 0, width: '100%', height: '3px', background: 'var(--secondary, #f17732)', borderRadius: '3px 3px 0 0' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="hidden md:block font-semibold text-slate-700" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {userName}
          </span>
          <div className="shadow-sm rounded-full border border-slate-100 flex overflow-hidden">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }} />
          </div>
        </div>
      </header>

      {/* Mobile nav bar */}
      <div className="md:hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(86, 90, 207, 0.1)', overflowX: 'auto', position: 'sticky', top: '76px', zIndex: 99, boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
        <nav style={{ display: 'flex', gap: '1.5rem', padding: '0.75rem 1.25rem', minWidth: 'max-content' }}>
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.name} to={item.href} className={`unified-nav-link ${active ? 'active' : ''}`} style={{ textDecoration: 'none', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', position: 'relative', transition: 'color 0.2s ease-in-out' }}>
                {typeof item.icon === 'string' ? <i className={item.icon}></i> : item.icon}
                {item.name}
                {active && (
                  <div style={{ position: 'absolute', bottom: '-0.75rem', left: 0, width: '100%', height: '3px', background: 'var(--secondary, #f17732)', borderRadius: '3px 3px 0 0' }} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default UnifiedHeader;
