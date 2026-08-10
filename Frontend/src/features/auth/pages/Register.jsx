import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" 
      style={{ 
        backgroundColor: '#f8f9ff',
        backgroundImage: 'radial-gradient(rgba(86, 90, 207, 0.15) 2px, transparent 2px)',
        backgroundSize: '30px 30px'
      }}
    >
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Logo Header */}
        <Link to="/" className="flex justify-center items-center gap-3 group mb-8" style={{ textDecoration: 'none' }}>
          <div className="bg-primary/10 p-2 rounded-xl text-primary shadow-sm">
            <Activity className="h-8 w-8" />
          </div>
          <span className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'Poppins', sans-serif", color: 'var(--dark-brand-color)' }}>PhysioCare</span>
        </Link>

      {/* Clerk Drop-in SignUp UI */}
      <SignUp
        routing="path"
        path="/register"
        signInUrl="/login"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            card: 'bg-white shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] rounded-[12px] border border-gray-100 p-8 w-full max-w-md',
            headerTitle: 'text-2xl font-bold text-dark text-center',
            headerSubtitle: 'text-gray-500 text-center mb-6',
            formButtonPrimary: 'bg-gradient-to-r from-primary to-[#7074e8] hover:opacity-90 transition-all text-white font-bold py-3 rounded-lg shadow-md mt-2',
            formFieldLabel: 'text-sm font-bold text-gray-700 mb-1',
            formFieldInput: 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium transition-all',
            footerActionLink: 'text-primary hover:text-dark font-bold transition-colors',
            identityPreviewText: 'text-dark font-medium',
            identityPreviewEditButtonIcon: 'text-primary',
            formResendCodeLink: 'text-primary font-bold',
          },
          layout: {
            socialButtonsPlacement: "bottom",
            logoPlacement: "none", // We already show our logo above
          }
        }}
      />
      </div>
    </div>
  );
};

export default Register;
