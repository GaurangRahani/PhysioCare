import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const Navbar = () => {
  return (
    <nav className="bg-light sticky top-0 z-50 w-full border-b border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-[8px] group-hover:bg-primary transition-colors duration-300">
              <Activity className="h-6 w-6 text-primary group-hover:text-light transition-colors duration-300" />
            </div>
            <span className="text-2xl font-bold text-dark tracking-tight">PhysioCare</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-body hover:text-primary transition-colors font-medium">Home</Link>
            <Link to="/about" className="text-body hover:text-primary transition-colors font-medium">About Us</Link>
            <Link to="/services" className="text-body hover:text-primary transition-colors font-medium">Services</Link>
            <Link to="/contact" className="text-body hover:text-primary transition-colors font-medium">Contact</Link>
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <Link to="/register" className="hidden md:inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-primary bg-primary/10 rounded-[8px] hover:bg-primary hover:text-light transition-all duration-300">
                Register
              </Link>
              <Link to="/login" className="hidden md:inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-primary bg-primary/10 rounded-[8px] hover:bg-primary hover:text-light transition-all duration-300">
                Login
              </Link>
            </SignedOut>
            
            <SignedIn>
              <Link to="/dashboard" className="hidden md:inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-primary bg-primary/10 rounded-[8px] hover:bg-primary hover:text-light transition-all duration-300">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <Link to="/book" className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-light bg-primary rounded-[8px] hover:bg-dark hover:shadow-lg transition-all duration-300">
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
