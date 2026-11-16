import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import Logo from '../common/Logo';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
      
      if (location.pathname !== '/') return;

      const scrollPosition = window.scrollY + 120;
      if (scrollPosition < 400) {
        setActiveSection('home');
        return;
      }

      const sections = ['how-it-works', 'features', 'roles', 'faq'];
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
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Features', href: '/#features' },
    { name: 'Roles', href: '/#roles' },
    { name: 'FAQ', href: '/#faq' }
  ];

  const handleNavClick = (e, href) => {
    if (location.pathname === '/' && href.startsWith('/#')) {
      e.preventDefault();
      const targetId = href.substring(2);
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', href);
      }
      setIsMobileMenuOpen(false);
    } else if (href === '/') {
      if (location.pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setIsMobileMenuOpen(false);
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 font-['Inter',system-ui,sans-serif] ${
        isScrolled 
          ? 'bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#EAEAEA] shadow-xs' 
          : 'bg-[#FFFFFF] border-b border-[#F0F0F0]'
      }`}
    >
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 max-w-[1480px]">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 select-none group no-underline"
          >
            <Logo size="md" subtitle="Clinical Physical Therapy" />
          </Link>
          
          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((item) => {
              const isHash = item.href.includes('#');
              const secId = isHash ? item.href.split('#')[1] : 'home';
              const isActive = location.pathname === '/' && activeSection === secId;

              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`text-[13px] font-medium transition-colors cursor-pointer relative py-1 ${
                    isActive 
                      ? 'text-[#008060] font-semibold' 
                      : 'text-[#616161] hover:text-[#111111]'
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#008060] rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <SignedIn>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-[#FFFFFF] bg-[#111111] hover:bg-[#202020] rounded-[8px] transition-colors shadow-xs"
              >
                <span>Patient Portal</span>
                <ArrowRight size={14} />
              </Link>
              <div className="pl-1">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>

            <SignedOut>
              <Link
                to="/login"
                className="px-3.5 py-2 text-[13px] font-medium text-[#616161] hover:text-[#111111] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/book"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-[#FFFFFF] bg-[#008060] hover:bg-[#006e52] rounded-[8px] transition-all shadow-xs hover:shadow-md hover:shadow-[#008060]/20 active:scale-[0.99]"
              >
                <span>Book Appointment</span>
              </Link>
            </SignedOut>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#202223] hover:bg-[#F4F4F4] rounded-md transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#FFFFFF] border-b border-[#EAEAEA] px-4 pt-3 pb-6 shadow-xl animate-fade-in text-[14px]">
          <nav className="flex flex-col gap-1 pb-4 border-b border-[#F0F0F0]">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="px-3 py-2.5 rounded-lg text-[#616161] hover:text-[#111111] hover:bg-[#F9F9F9] font-medium transition-colors cursor-pointer"
              >
                {item.name}
              </a>
            ))}
          </nav>

          <div className="pt-4 flex flex-col gap-2.5">
            <SignedIn>
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-[13px] font-semibold text-[#FFFFFF] bg-[#111111] rounded-[8px]"
              >
                Go to Patient Portal
              </Link>
              <Link
                to="/doctor-dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-[13px] font-medium text-[#202223] bg-[#F4F4F4] hover:bg-[#EAEAEA] rounded-[8px]"
              >
                Doctor Suite
              </Link>
            </SignedIn>

            <SignedOut>
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-[13px] font-medium text-[#202223] bg-[#F4F4F4] hover:bg-[#EAEAEA] rounded-[8px]"
              >
                Sign In
              </Link>
              <Link
                to="/book"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-[13px] font-semibold text-[#FFFFFF] bg-[#008060] rounded-[8px] shadow-sm"
              >
                Book Appointment
              </Link>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
