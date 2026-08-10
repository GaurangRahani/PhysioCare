import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Menu, X } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      
      if (location.pathname !== '/') return;

      const scrollPosition = window.scrollY + 150; // Offset for navbar

      if (scrollPosition < 500) {
        setActiveSection('home');
        return;
      }

      const sections = ['how-it-works', 'roles', 'faq'];
      let current = 'home';
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && scrollPosition >= element.offsetTop) {
          current = section;
        }
      }
      
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    // Call once on mount to set initial state
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  return (
    <header style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(86, 90, 207, 0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
      }} 
      className={`sticky top-0 z-50 transition-shadow duration-300 ${
        isScrolled ? 'shadow-md border-b-transparent' : ''
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo - Left */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: 'var(--dark-brand-color)', textDecoration: 'none' }}>
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <Activity className="h-6 w-6" />
            </div>
            <span className="flex items-center gap-2">PhysioCare</span>
          </Link>
          
          {/* Desktop Nav - Center */}
          <nav className="hidden lg:flex items-center gap-8 h-full">
            {[
              { name: 'Home', href: '/' },
              { name: 'Roles', href: '/#roles' },
              { name: 'How It Works', href: '/#how-it-works' },
              { name: 'FAQ', href: '/#faq' }
            ].map((item) => {
              const isHashLink = item.href.includes('#');
              const sectionId = isHashLink ? item.href.substring(item.href.indexOf('#') + 1) : 'home';
              
              let isActive = false;
              if (location.pathname === '/') {
                isActive = activeSection === sectionId;
              } else {
                isActive = location.pathname === item.href;
              }
                
              const handleNavClick = (e) => {
                if (location.pathname === '/') {
                  if (isHashLink) {
                    e.preventDefault();
                    const targetId = item.href.substring(item.href.indexOf('#') + 1);
                    const element = document.getElementById(targetId);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                      window.history.pushState(null, '', item.href);
                    }
                  } else if (item.href === '/') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    window.history.pushState(null, '', '/');
                  }
                }
              };

              return (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  onClick={handleNavClick}
                  className={`relative transition-colors hover:text-secondary flex items-center h-full ${isActive ? 'text-primary' : 'text-slate-600'}`} 
                  style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.875rem' }}
                >
                  {item.name}
                  {isActive && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px', background: 'var(--secondary, #f17732)', borderRadius: '3px 3px 0 0' }} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Actions - Right */}
          <div className="hidden lg:flex items-center gap-4">
            <SignedOut>
              <Link to="/login" className="text-primary hover:text-secondary transition-colors" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.875rem' }}>
                Login
              </Link>
            </SignedOut>
            
            <SignedIn>
              <Link to="/dashboard" className="text-primary hover:text-secondary transition-colors" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.875rem' }}>
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <Link 
              to="/book" 
              className="inline-flex items-center justify-center px-6 py-2.5 text-white bg-secondary rounded-md hover:bg-dark-brand transform hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-secondary/30"
              style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.875rem' }}
            >
              Book Appointment
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-4">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-primary p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-lg py-4 px-6 flex flex-col gap-4 z-40">
          {[
            { name: 'Home', href: '/' },
            { name: 'Roles', href: '/#roles' },
            { name: 'How It Works', href: '/#how-it-works' },
            { name: 'FAQ', href: '/#faq' }
          ].map((item) => {
            const isHashLink = item.href.includes('#');
            const sectionId = isHashLink ? item.href.substring(item.href.indexOf('#') + 1) : 'home';
            
            let isActive = false;
            if (location.pathname === '/') {
              isActive = activeSection === sectionId;
            } else {
              isActive = location.pathname === item.href;
            }
              
            const handleMobileClick = (e) => {
              setIsMobileMenuOpen(false);
              if (location.pathname === '/') {
                if (isHashLink) {
                  e.preventDefault();
                  const targetId = item.href.substring(item.href.indexOf('#') + 1);
                  const element = document.getElementById(targetId);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    window.history.pushState(null, '', item.href);
                  }
                } else if (item.href === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  window.history.pushState(null, '', '/');
                }
              }
            };

            return (
              <Link 
                key={item.name}
                to={item.href} 
                onClick={handleMobileClick} 
                className={`hover:text-secondary font-semibold transition-colors ${isActive ? 'text-primary' : 'text-slate-600'}`}
              >
                {item.name}
              </Link>
            );
          })}
          
          <div className="h-px w-full bg-slate-100 my-2"></div>
          
          <SignedOut>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-primary hover:text-secondary font-bold transition-colors">Login</Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-primary hover:text-secondary font-bold transition-colors">Dashboard</Link>
          </SignedIn>
          
          <Link 
            to="/book" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-secondary rounded-md hover:bg-dark-brand transform hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-secondary/30 text-center mt-2"
          >
            Book Appointment
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
