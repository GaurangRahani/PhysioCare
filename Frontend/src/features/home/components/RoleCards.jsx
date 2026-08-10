import React from 'react';
import { Link } from 'react-router-dom';
import { UserCircle, Stethoscope, Briefcase } from 'lucide-react';

const RoleCards = () => {
  return (
    <section id="roles" className="py-20 bg-primary/5">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            One Platform, Three Roles
          </h2>
          <p className="text-lg text-slate-500">
            Every person in the clinic's ecosystem has a purpose-built experience.
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* PATIENT CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-6">
              <UserCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Patient</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed flex-1">
              Log daily exercises, track your pain levels, view your appointment history, and download invoices — all from one simple dashboard.
            </p>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Daily exercise program
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Pain level tracking
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Appointment booking
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Invoice history
              </li>
            </ul>
            <Link 
              to="/book" 
              className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-green-500 rounded-full hover:bg-green-600 transition-colors w-max"
            >
              Book Appointment →
            </Link>
          </div>

          {/* DOCTOR CARD */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group cursor-pointer lg:-translate-y-4 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
            <div className="absolute top-0 right-4 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-b-lg">
              Most Used
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
              <Stethoscope className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Doctor</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed flex-1">
              Run consultations, build treatment plans, prescribe exercises with specific frequency rules, and review patient compliance between visits.
            </p>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Consultation recording
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Exercise library management
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Treatment plan builder
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Compliance dashboard
              </li>
            </ul>
            <p className="text-sm text-slate-400 font-medium italic mt-auto">
              Access via your clinic's dashboard
            </p>
          </div>

          {/* RECEPTIONIST CARD */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col md:col-span-2 lg:col-span-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
              <Briefcase className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Receptionist</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed flex-1">
              Register new patients, manage the appointment calendar, collect payments, and generate invoices — all from one streamlined workflow.
            </p>
            <ul className="space-y-2 mb-8">
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> New patient registration
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Appointment calendar
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Payment collection
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Invoice generation
              </li>
            </ul>
            <p className="text-sm text-slate-400 font-medium italic mt-auto">
              Access via your clinic's dashboard
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default RoleCards;
