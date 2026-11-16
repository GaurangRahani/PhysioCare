import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import Logo from '../common/Logo';

const Footer = () => {
  return (
    <footer className="w-full bg-[#0A0A0A] text-[#D1D1D1] font-['Inter',system-ui,sans-serif] border-t border-[#1C1C1C] pt-14 pb-8">
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 max-w-[1480px]">
        
        {/* Main 4-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-12 border-b border-[#1C1C1C]">
          
          {/* COLUMN 1: Brand & Contact Info */}
          <div className="space-y-4">
            <Link to="/" className="inline-block no-underline">
              <Logo size="md" theme="dark" showSubtitle={false} />
            </Link>

            <p className="text-xs sm:text-sm text-[#8A8A8A] leading-relaxed max-w-xs">
              Next-generation clinical physical therapy and tele-rehabilitation suite for modern clinics.
            </p>

            {/* Contact Phone Pill with Green Accent */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-xl bg-[#008060]/20 text-[#A3F56C] border border-[#008060]/30 flex items-center justify-center shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <span className="block text-[10px] text-[#A3F56C] font-mono uppercase tracking-wider font-semibold">Clinic Helpline</span>
                <span className="text-sm sm:text-base font-bold text-[#FFFFFF] font-mono">+91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold text-[#FFFFFF] uppercase tracking-wider font-mono">
              Platform Links
            </h4>
            <div className="w-8 h-0.5 bg-[#008060] rounded-full" />
            <ul className="space-y-2 pt-1 text-xs sm:text-[13px]">
              <li>
                <a href="/#how-it-works" className="text-[#8A8A8A] hover:text-[#FFFFFF] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/#features" className="text-[#8A8A8A] hover:text-[#FFFFFF] transition-colors">
                  Platform Features
                </a>
              </li>
              <li>
                <a href="/#roles" className="text-[#8A8A8A] hover:text-[#FFFFFF] transition-colors">
                  Ecosystem & Roles
                </a>
              </li>
              <li>
                <a href="/#faq" className="text-[#8A8A8A] hover:text-[#FFFFFF] transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <Link to="/book" className="text-[#8A8A8A] hover:text-[#FFFFFF] transition-colors">
                  Book Clinical Appointment
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: Clinical Services */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold text-[#FFFFFF] uppercase tracking-wider font-mono">
              Clinical Specializations
            </h4>
            <div className="w-8 h-0.5 bg-[#4088F8] rounded-full" />
            <ul className="space-y-2 pt-1 text-xs sm:text-[13px]">
              <li className="text-[#8A8A8A]">Orthopedic Rehabilitation</li>
              <li className="text-[#8A8A8A]">Post-Surgery Knee & Hip Protocol</li>
              <li className="text-[#8A8A8A]">Cervical & Spine Alignment</li>
              <li className="text-[#8A8A8A]">Sports Injury Recovery</li>
              <li className="text-[#8A8A8A]">Geriatric Mobility Training</li>
            </ul>
          </div>

          {/* COLUMN 4: Portal Sign-In */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-semibold text-[#FFFFFF] uppercase tracking-wider font-mono">
              Portals & Access
            </h4>
            <div className="w-8 h-0.5 bg-[#F5C451] rounded-full" />
            <div className="space-y-2 pt-1">
              <Link 
                to="/dashboard" 
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#333333] hover:bg-[#1A1A1A] transition-colors text-xs text-[#FFFFFF]"
              >
                <span>Patient Recovery Portal</span>
                <ArrowRight size={13} className="text-[#8A8A8A]" />
              </Link>
              <Link 
                to="/doctor-dashboard" 
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#333333] hover:bg-[#1A1A1A] transition-colors text-xs text-[#FFFFFF]"
              >
                <span>Doctor Consultation Suite</span>
                <ArrowRight size={13} className="text-[#8A8A8A]" />
              </Link>
              <Link 
                to="/receptionist" 
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#141414] border border-[#222222] hover:border-[#333333] hover:bg-[#1A1A1A] transition-colors text-xs text-[#FFFFFF]"
              >
                <span>Reception Front Desk</span>
                <ArrowRight size={13} className="text-[#8A8A8A]" />
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Sub-Footer Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#616161]">
          <div className="flex items-center gap-2">
            <span>© 2026 AlignCare Clinical Systems Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-[#FFFFFF] cursor-pointer transition-colors">Privacy Policy</span>
            <span>·</span>
            <span className="hover:text-[#FFFFFF] cursor-pointer transition-colors">Terms of Service</span>
            <span>·</span>
            <span className="hover:text-[#FFFFFF] cursor-pointer transition-colors">HIPAA Compliance</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
