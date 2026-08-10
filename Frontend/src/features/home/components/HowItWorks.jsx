import React, { useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

const StepCard = ({ number, title, body }) => {
  return (
    <div 
      className="group bg-white rounded-2xl p-8 relative overflow-hidden flex flex-col hover:-translate-y-2 shadow-lg border border-slate-100 hover:border-secondary hover:shadow-secondary/30 transition-all duration-300"
    >
      {/* Fill Animation Background */}
      <div className="absolute bottom-0 left-0 w-full h-0 bg-secondary transition-all duration-500 ease-in-out group-hover:h-full z-0"></div>
      
      {/* Huge Hollow Number */}
      <div 
        className="text-[80px] font-extrabold leading-none mb-6 relative z-10 text-transparent [-webkit-text-stroke:2px_rgba(241,119,50,0.5)] group-hover:[-webkit-text-stroke:2px_rgba(255,255,255,0.7)] transition-all duration-300"
      >
        0{number}
      </div>
      
      <h3 className="text-xl font-bold mb-4 relative z-10 text-slate-800 group-hover:text-white transition-colors duration-300">
        {title}
      </h3>
      
      <p className="text-sm leading-relaxed mb-8 flex-1 relative z-10 text-slate-500 group-hover:text-white/90 transition-colors duration-300">
        {body}
      </p>
      
      {/* View More Button */}
      <button 
        className="relative z-10 mt-auto inline-flex items-center gap-4 py-2 px-6 rounded-full w-max text-sm font-bold transition-all duration-300 bg-primary/10 text-primary group-hover:bg-white group-hover:text-secondary"
      >
        View More
        <span className="w-8 h-8 rounded flex items-center justify-center -mr-3 shadow-sm transition-all duration-300 bg-white text-primary group-hover:bg-secondary group-hover:text-white">
          <ChevronRight className="w-4 h-4" />
        </span>
      </button>
    </div>
  );
};

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      
      {/* Decorative Shapes based on Image 3 */}
      <div className="absolute top-[20%] left-[5%] w-16 h-16 rounded-full border border-secondary bg-secondary/10 opacity-50"></div>
      <img className="absolute top-[30%] right-[10%] animate-rotation hidden lg:block" src="/images/shap/plus-orange.png" alt="" />
      <img className="absolute bottom-[10%] right-[20%] animate-up-down hidden lg:block" src="/images/shap/circle-dots.png" alt="" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-dark-brand mb-4">
            How we works?
          </h2>
        </div>
        
        {/* PATIENTS ROW */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-slate-800 mb-8 border-b-2 border-slate-100 pb-4 inline-block">For Patients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StepCard 
              number="1"
              variant="orange"
              delay={100}
              title="Book Appointment"
              body="Book online or call the clinic. Choose a time slot and pay securely via Razorpay."
            />
            <StepCard 
              number="2"
              variant="orange"
              delay={200}
              title="Get Exercise Plan"
              body="Your doctor prescribes a personalized exercise program specifically for your recovery."
            />
            <StepCard 
              number="3"
              variant="white"
              delay={300}
              title="Track Daily"
              body="Open the app every day, log completed sets, report pain levels, and attach photos."
            />
            <StepCard 
              number="4"
              variant="white"
              delay={400}
              title="Doctor Reviews"
              body="Your doctor sees your compliance and pain trends before your next visit."
            />
          </div>
        </div>
        
        {/* CLINICS ROW */}
        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-8 border-b-2 border-slate-100 pb-4 inline-block">For Clinics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StepCard 
              number="1"
              variant="white"
              delay={150}
              title="Manage Schedule"
              body="Set availability once. The system blocks double bookings automatically."
            />
            <StepCard 
              number="2"
              variant="white"
              delay={250}
              title="Digital Consult"
              body="Record diagnosis and treatment notes in a structured consultation form."
            />
            <StepCard 
              number="3"
              variant="orange"
              delay={350}
              title="Build Plans"
              body="Assign exercises from your library with sets, reps, and frequency."
            />
            <StepCard 
              number="4"
              variant="orange"
              delay={450}
              title="Live Monitoring"
              body="See compliance percentages and flagged concerns before the patient arrives."
            />
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default HowItWorks;
