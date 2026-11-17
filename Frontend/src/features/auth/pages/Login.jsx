import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../../../components/common/Logo';

const Login = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#202223] font-['Inter',system-ui,sans-serif] flex flex-col justify-between relative overflow-hidden">
      
      {/* ── 1. TOP HEADER ROW ────────────────────────────────────────── */}
      <header className="h-[56px] px-4 sm:px-8 flex items-center justify-between border-b border-[#EAEAEA] bg-[#FFFFFF] z-10">
        <Link to="/" className="cursor-pointer no-underline">
          <Logo size="sm" subtitle="Clinical Platform" />
        </Link>

        <Link
          to="/"
          className="text-[12px] font-medium text-[#616161] hover:text-[#202223] hover:bg-[#F4F4F4] px-2.5 py-1 rounded-[6px] transition-colors inline-flex items-center gap-1.5 no-underline"
        >
          <ArrowLeft size={13} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* ── 2. MAIN SIGN IN CONTAINER ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 relative z-10">
        <div className="w-full max-w-[440px] flex flex-col items-center space-y-4">
          
          {/* Clerk Drop-in SignIn Component */}
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/register"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'bg-[#FFFFFF] shadow-sm rounded-[16px] border border-[#EAEAEA] p-6 sm:p-8 w-full max-w-[440px]',
                headerTitle: 'text-[22px] font-bold text-[#202223] tracking-tight text-center',
                headerSubtitle: 'text-[13px] text-[#616161] text-center mb-5',
                socialButtonsBlockButton: 'border border-[#EAEAEA] hover:border-[#202223] hover:bg-[#F9FAFB] transition-colors rounded-[10px] text-[13px] font-medium text-[#202223] py-2.5 shadow-2xs',
                socialButtonsBlockButtonText: 'text-[13px] font-medium text-[#202223]',
                dividerLine: 'bg-[#EAEAEA]',
                dividerText: 'text-[11px] uppercase tracking-wider text-[#8A8A8A] font-medium',
                formButtonPrimary: 'bg-[#000000] hover:bg-[#202020] text-[#FFFFFF] font-semibold text-[13px] py-3 rounded-[10px] shadow-xs transition-colors mt-2',
                formFieldLabel: 'text-[11px] font-semibold text-[#616161] uppercase tracking-wider mb-1.5',
                formFieldInput: 'w-full px-3.5 py-2.5 bg-[#FBFBFB] border border-[#EAEAEA] rounded-[10px] focus:bg-[#FFFFFF] focus:border-[#202223] focus:ring-1 focus:ring-[#202223] text-[#202223] text-[13px] font-medium transition-colors shadow-2xs',
                footerActionLink: 'text-[#000000] hover:underline font-semibold transition-colors',
                footerActionText: 'text-[12px] text-[#616161]',
                identityPreviewText: 'text-[#202223] font-medium text-[13px]',
                identityPreviewEditButtonIcon: 'text-[#616161] hover:text-[#202223]',
                formResendCodeLink: 'text-[#008060] hover:underline font-medium text-[12px]',
                otpCodeFieldInput: 'border border-[#EAEAEA] focus:border-[#202223] text-[#202223] rounded-[8px]',
                footer: 'bg-transparent pt-3',
              },
              layout: {
                socialButtonsPlacement: "bottom",
                logoPlacement: "none",
              }
            }}
          />

          {/* Compliance & Security Assurance */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#8A8A8A] pt-2">
            <ShieldCheck size={14} className="text-[#008060]" />
            <span>256-bit encrypted healthcare portal · HIPAA & DPDP compliant</span>
          </div>

        </div>
      </main>

      {/* ── 3. BOTTOM FOOTER ─────────────────────────────────────────── */}
      <footer className="h-[44px] border-t border-[#EAEAEA] bg-[#FFFFFF] px-4 sm:px-8 flex items-center justify-between text-[11px] text-[#8A8A8A] z-10">
        <span>© {new Date().getFullYear()} AlignCare Physical Therapy Systems. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-[#202223] transition-colors no-underline">Home</Link>
          <span>·</span>
          <span className="hidden sm:inline">Secure Clinical Authentication</span>
        </div>
      </footer>

    </div>
  );
};

export default Login;
