import React from 'react';
import { Calendar, FileCheck, Activity, LineChart, Clock, Stethoscope, Dumbbell, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const StepCard = ({ number, title, body, icon: Icon, accentColor, accentBg, borderTopColor }) => {
  return (
    <div className="bg-[#FFFFFF] rounded-[16px] p-6 sm:p-7 border border-[#EAEAEA] hover:border-[#D0D0D0] hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden group">
      {/* Top Accent Strip */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5 transition-all duration-300" 
        style={{ backgroundColor: borderTopColor }}
      />
      
      {/* Step Header: Icon + Number */}
      <div className="flex items-center justify-between mb-5">
        <div 
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ backgroundColor: accentBg, color: accentColor }}
        >
          <Icon size={22} />
        </div>

        <span className="text-3xl font-black text-[#EAEAEA] font-mono select-none group-hover:text-[#D0D0D0] transition-colors">
          0{number}
        </span>
      </div>
      
      <h3 className="text-base sm:text-lg font-bold text-[#111111] mb-2.5">
        {title}
      </h3>
      
      <p className="text-xs sm:text-[13px] text-[#616161] leading-relaxed flex-1">
        {body}
      </p>
    </div>
  );
};

const HowItWorks = () => {
  const patientSteps = [
    {
      number: "1",
      title: "Book Appointment",
      body: "Book online or through the clinic. Choose your preferred specialist, pick an open time slot, and confirm instantly.",
      icon: Calendar,
      accentColor: "#4088F8",
      accentBg: "#EFF6FF",
      borderTopColor: "#4088F8"
    },
    {
      number: "2",
      title: "Get Exercise Plan",
      body: "Your physiotherapist creates a customized rehabilitation program tailored specifically to your clinical condition.",
      icon: FileCheck,
      accentColor: "#008060",
      accentBg: "#EBF7F2",
      borderTopColor: "#008060"
    },
    {
      number: "3",
      title: "Track Daily",
      body: "Open your portal every day, log completed reps and sets, track your pain scale (0–10), and flag concerns.",
      icon: Activity,
      accentColor: "#B98900",
      accentBg: "#FFFBEB",
      borderTopColor: "#F5C451"
    },
    {
      number: "4",
      title: "Doctor Reviews",
      body: "Your doctor reviews compliance graphs, pain trends, and logged symptoms before your next visit for maximum recovery.",
      icon: LineChart,
      accentColor: "#E5484D",
      accentBg: "#FFF1F2",
      borderTopColor: "#E5484D"
    }
  ];

  const clinicSteps = [
    {
      number: "1",
      title: "Set Availability",
      body: "Configure weekly doctor shifts, session durations, slot intervals, and practice holidays effortlessly.",
      icon: Clock,
      accentColor: "#4088F8",
      accentBg: "#EFF6FF",
      borderTopColor: "#4088F8"
    },
    {
      number: "2",
      title: "Clinical Consultation",
      body: "Review patient history, assess range of motion, and document diagnostic findings in one unified dashboard.",
      icon: Stethoscope,
      accentColor: "#008060",
      accentBg: "#EBF7F2",
      borderTopColor: "#008060"
    },
    {
      number: "3",
      title: "Prescribe Protocol",
      body: "Assign exercises from the clinical exercise library with precise reps, sets, frequency, and custom video instructions.",
      icon: Dumbbell,
      accentColor: "#B98900",
      accentBg: "#FFFBEB",
      borderTopColor: "#F5C451"
    },
    {
      number: "4",
      title: "Automated Alerts",
      body: "Receive instant notifications when patient adherence drops or when sharp pain flares require clinical review.",
      icon: AlertTriangle,
      accentColor: "#E5484D",
      accentBg: "#FFF1F2",
      borderTopColor: "#E5484D"
    }
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-[#FAFAFA] font-['Inter',system-ui,sans-serif] border-b border-[#EAEAEA]">
      <div className="w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 max-w-[1480px]">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-18">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7F2] text-[#008060] text-xs font-semibold uppercase tracking-wider mb-3">
            Workflow Overview
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111111] tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-[#616161]">
            A seamless end-to-end rehabilitation workflow designed for both patients and healthcare providers.
          </p>
        </div>
        
        {/* PATIENTS SECTION */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-[#EAEAEA]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#008060]" />
            <h3 className="text-lg sm:text-xl font-bold text-[#111111]">
              For Patients
            </h3>
            <span className="text-xs text-[#8A8A8A] font-mono ml-auto">Step-by-step recovery</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {patientSteps.map((step) => (
              <StepCard key={step.number} {...step} />
            ))}
          </div>
        </div>
        
        {/* CLINICS SECTION */}
        <div>
          <div className="flex items-center gap-3 mb-6 pb-2 border-b border-[#EAEAEA]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4088F8]" />
            <h3 className="text-lg sm:text-xl font-bold text-[#111111]">
              For Clinics & Physiotherapists
            </h3>
            <span className="text-xs text-[#8A8A8A] font-mono ml-auto">Streamlined practice management</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {clinicSteps.map((step) => (
              <StepCard key={step.number} {...step} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
