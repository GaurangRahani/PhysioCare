import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-dark text-light pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="bg-light/10 p-2 rounded-[8px]">
                <Activity className="h-6 w-6 text-light" />
              </div>
              <span className="text-2xl font-bold text-light tracking-tight">PhysioCare</span>
            </Link>
            <p className="text-light/70 text-sm leading-relaxed">
              Bridging the gap between in-clinic operations and at-home patient recovery. Your journey to wellness starts here.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-6 text-light">Quick Links</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-light/70 hover:text-secondary transition-colors text-sm">About Us</Link></li>
              <li><Link to="/services" className="text-light/70 hover:text-secondary transition-colors text-sm">Our Services</Link></li>
              <li><Link to="/doctors" className="text-light/70 hover:text-secondary transition-colors text-sm">Our Doctors</Link></li>
              <li><Link to="/book" className="text-light/70 hover:text-secondary transition-colors text-sm">Book Appointment</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6 text-light">Services</h4>
            <ul className="space-y-4">
              <li className="text-light/70 text-sm">Post-Op Rehab</li>
              <li className="text-light/70 text-sm">Sports Injuries</li>
              <li className="text-light/70 text-sm">Back & Neck Pain</li>
              <li className="text-light/70 text-sm">Neurological Rehab</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6 text-light">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-secondary shrink-0" />
                <span className="text-light/70 text-sm">123 Wellness Ave, Medical District, NY 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-secondary shrink-0" />
                <span className="text-light/70 text-sm">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-secondary shrink-0" />
                <span className="text-light/70 text-sm">hello@physiocare.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-light/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-light/50 text-sm">
            &copy; {new Date().getFullYear()} PhysioCare. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-light/50 hover:text-light transition-colors text-sm">Privacy Policy</Link>
            <Link to="/terms" className="text-light/50 hover:text-light transition-colors text-sm">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
