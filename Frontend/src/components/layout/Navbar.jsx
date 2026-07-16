import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const Navbar = () => {
  return (
    <header className="bg-light sticky top-0 z-50 w-full border-b border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-2 rounded-lg">
              <Activity className="h-6 w-6 text-light" />
            </div>
            <span className="text-2xl font-bold text-dark tracking-tight">PhysioCare</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-dark font-semibold hover:text-primary transition-colors">Home</Link>
            <Link to="/about" className="text-body font-medium hover:text-primary transition-colors">About Us</Link>
            <Link to="/services" className="text-body font-medium hover:text-primary transition-colors">Services</Link>
            <Link to="/contact" className="text-body font-medium hover:text-primary transition-colors">Contact</Link>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <Link to="/register" className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-sm font-bold text-primary hover:text-dark transition-all duration-300">
                Register
              </Link>
              <Link to="/login" className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-sm font-bold text-primary hover:text-dark transition-all duration-300">
                Login
              </Link>
            </SignedOut>
            
            <SignedIn>
              <Link to="/dashboard" className="hidden sm:inline-flex items-center justify-center px-5 py-2 text-sm font-bold text-primary hover:text-dark transition-all duration-300">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <Link to="/book" className="inline-flex items-center justify-center px-6 py-3 text-sm font-bold text-light bg-secondary rounded-[8px] hover:bg-dark hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ml-2">
              Book Appointment
              <span className="ml-2">›</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
