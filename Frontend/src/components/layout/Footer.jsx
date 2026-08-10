import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Phone } from 'lucide-react';

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
  </svg>
);

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Footer = () => {
  return (
    <footer 
      className="relative !pt-12 !pb-8 overflow-hidden w-full border-t border-slate-100 shadow-sm"
      style={{ 
        backgroundColor: "#fefefe",
        backgroundImage: "radial-gradient(rgba(86, 90, 207, 0.25) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px"
      }}
    >

      {/* We moved the background shapes INSIDE the max-w container so they stick to the text! */}
      <div className="w-full mx-auto !px-4 sm:!px-6 lg:!px-8 max-w-[1400px] relative z-10 !mt-2" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
        
        {/* Floating background shape elements (Anchored to the container now) */}
        <img className="absolute bottom-[20%] -left-8 lg:-left-16 animate-rotation hidden lg:block opacity-40 z-0" src="/images/shap/circle-dots.png" alt="" />
        <img className="absolute top-[40%] -left-4 lg:-left-8 animate-up-down hidden lg:block z-0 opacity-70" src="/images/shap/wave-blue.png" alt="" />
        <img className="absolute top-[30%] -right-8 lg:-right-12 animate-vibrate hidden lg:block z-0" src="/images/shap/plus-blue.png" alt="" />
        <img className="absolute bottom-[10%] -right-4 lg:-right-8 animate-up-down hidden lg:block z-0 opacity-70" src="/images/shap/wave-blue.png" alt="" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8 xl:gap-12 !mb-16">

          {/* COLUMN 1: Brand & Contact */}
          <div>
            <Link to="/" className="flex items-center gap-2 !mb-4">
              <div className="bg-primary !p-2 rounded-lg text-white">
                <Activity className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-dark-brand tracking-tight">PhysioCare</span>
            </Link>

            <p className="text-sm text-slate-500 max-w-xs leading-relaxed !mb-6">
              Physiotherapy management built for the modern clinic.
            </p>

            {/* Circular Contact Phone widget (MediTro style) */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white shrink-0 shadow-lg shadow-secondary/20">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs text-secondary font-extrabold uppercase tracking-wide">Contact Us</span>
                <span className="text-dark-brand font-extrabold text-base md:text-lg">+91 98765 43210</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-dark-brand !mb-1">Quick Links</h4>
            <div className="w-12 h-[3px] bg-primary/20 !mb-6 rounded-full overflow-hidden">
              <div className="w-6 h-full bg-secondary"></div>
            </div>
            <div className="flex flex-col gap-4">
              <a href="/#how-it-works" className="text-sm text-slate-600 hover:text-secondary font-medium transition-colors">How It Works</a>
              <Link to="/book" className="text-sm text-slate-600 hover:text-secondary font-medium transition-colors">Book Appointment</Link>
              <Link to="/dashboard" className="text-sm text-slate-600 hover:text-secondary font-medium transition-colors">Patient Portal</Link>
              <Link to="/doctor-dashboard" className="text-sm text-slate-600 hover:text-secondary font-medium transition-colors">Clinic Staff Login</Link>
            </div>
          </div>

          {/* COLUMN 3: Our Services */}
          <div>
            <h4 className="text-lg font-bold text-dark-brand !mb-1">Our Service</h4>
            <div className="w-12 h-[3px] bg-primary/20 !mb-6 rounded-full overflow-hidden">
              <div className="w-6 h-full bg-secondary"></div>
            </div>
            <div className="flex flex-col gap-4">
              <Link to="/" className="text-sm text-slate-600 hover:text-secondary font-medium transition-colors">Neck Pain Relief</Link>
              <Link to="/" className="text-sm text-slate-600 hover:text-secondary font-medium transition-colors">Post-Surgery Rehab</Link>
              <Link to="/" className="text-sm text-slate-600 hover:text-secondary font-medium transition-colors">Spinal Recovery</Link>
              <Link to="/" className="text-sm text-slate-600 hover:text-secondary font-medium transition-colors">Sports Injury Therapy</Link>
            </div>
          </div>

          {/* COLUMN 4: Opening Hours & Socials */}
          <div>
            <h4 className="text-lg font-bold text-dark-brand !mb-1">Opening Hours</h4>
            <div className="w-12 h-[3px] bg-primary/20 !mb-6 rounded-full overflow-hidden">
              <div className="w-6 h-full bg-secondary"></div>
            </div>
            
            <ul className="text-sm text-slate-600 flex flex-col gap-4 font-medium">
              <li className="flex justify-between border-b border-slate-200/60 !pb-3">
                <span>Mon - Fri</span> 
                <span className="text-primary font-bold">09:00 AM - 08:00 PM</span>
              </li>
              <li className="flex justify-between border-b border-slate-200/60 !pb-3">
                <span>Saturday</span> 
                <span className="text-primary font-bold">10:00 AM - 04:00 PM</span>
              </li>
              <li className="flex justify-between !pb-3">
                <span>Sunday</span> 
                <span className="text-secondary font-bold">Emergency Only</span>
              </li>
            </ul>
            
            {/* Social Icons */}
            <div className="flex items-center gap-2 !mt-4">
                <a href="#" className="w-9 h-9 rounded bg-primary flex items-center justify-center text-white hover:bg-secondary transition-all duration-300 shadow-md shadow-primary/20">
                  <FacebookIcon className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded bg-primary flex items-center justify-center text-white hover:bg-secondary transition-all duration-300 shadow-md shadow-primary/20">
                  <TwitterIcon className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded bg-primary flex items-center justify-center text-white hover:bg-secondary transition-all duration-300 shadow-md shadow-primary/20">
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded bg-primary flex items-center justify-center text-white hover:bg-secondary transition-all duration-300 shadow-md shadow-primary/20">
                  <LinkedinIcon className="w-4 h-4" />
                </a>
              </div>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="border-t border-slate-200 !pt-8 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Copyright © {new Date().getFullYear()} Design & Developed by <a href="#" className="text-secondary hover:underline">Physiocare</a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
