import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

const Features = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      
      {/* Decorative floating shapes */}
      <img className="absolute top-[10%] left-[5%] animate-up-down hidden lg:block" src="/images/shap/circle-dots.png" alt="" />
      <img className="absolute top-[20%] right-[10%] animate-rotation hidden lg:block opacity-30" src="/images/shap/square-rotate.png" alt="" />
      
      <div className="container mx-auto px-4 md:px-6">
        
        {/* ROW 1: Smart Exercise Tracking */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0 mb-32 relative">
          
          <div className="w-full lg:w-1/2 lg:pr-16 z-20">
            <h6 className="text-secondary font-bold text-sm italic mb-4">
              <span className="text-slate-300 mr-2">////</span> Features
            </h6>
            <h2 className="text-3xl lg:text-4xl font-bold text-dark-brand mb-6 leading-tight">
              Smart Exercise Tracking <br/> for Patients
            </h2>
            <p className="text-base text-slate-500 mb-8 leading-relaxed">
              Patients log every session directly from their phone. Sets completed, pain level on a 0-10 scale, personal comments, and photo attachments — all saved against each scheduled session.
            </p>
            
            <button className="px-6 py-3 bg-secondary text-white font-semibold rounded-md hover:bg-dark-brand transition-all duration-300 shadow-lg shadow-secondary/30">
              All Features
            </button>
          </div>
          
          <div className="w-full lg:w-1/2 relative min-h-[500px] flex items-center justify-center lg:justify-end">
            {/* The massive solid blue overlapping block (MediTro style) */}
            <div className="absolute top-0 right-[-50vw] bottom-0 left-[30%] bg-primary rounded-l-[60px] z-10"></div>
            
            {/* White card container overlapping the blue block */}
            <div className="relative z-20 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-8 lg:-ml-20 w-full max-w-md animate-up-down2">
              <div className="absolute inset-0 opacity-10 bg-[url('/images/main-banner/shape1.png')] bg-no-repeat bg-cover bg-center rounded-2xl pointer-events-none"></div>
              
              {/* Mobile Phone Mockup */}
              <div className="relative w-full max-w-[280px] mx-auto h-[500px] bg-slate-900 rounded-[35px] border-[8px] border-slate-900 shadow-inner overflow-hidden flex flex-col">
                <div className="absolute top-0 inset-x-0 h-5 bg-slate-900 z-20 flex justify-center">
                  <div className="w-24 h-4 bg-black rounded-b-xl"></div>
                </div>
                <div className="flex-1 bg-slate-50 pt-8 px-4 pb-4 flex flex-col">
                  <p className="text-slate-500 text-xs font-medium">Good morning,</p>
                  <h3 className="text-slate-800 text-lg font-bold mb-4">Gaurang 👋</h3>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex-1">
                    <h4 className="font-semibold text-slate-800 mb-1 text-sm">Neck Stretch</h4>
                    <p className="text-xs text-slate-500 mb-4">Session 2</p>
                    
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs font-medium text-slate-700">Sets</span>
                      <div className="flex gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">✓</div>
                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">✓</div>
                        <div className="w-5 h-5 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center text-[10px]">3</div>
                      </div>
                    </div>
                    
                    <button className="w-full bg-primary text-white py-2 rounded-lg text-xs font-semibold hover:bg-dark-brand transition-colors mt-auto">
                      Done ✓
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* ROW 2: Complete Compliance Dashboard */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-0 mb-32 relative">
          
          <div className="w-full lg:w-1/2 relative min-h-[400px] flex items-center justify-center lg:justify-start">
            {/* Solid Block overlapping from left */}
            <div className="absolute top-0 left-[-50vw] bottom-0 right-[30%] bg-primary rounded-r-[60px] z-10"></div>
            
            {/* Dashboard Mockup overlapping the block */}
            <div className="relative z-20 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-100 p-6 lg:-mr-20 w-full max-w-lg animate-up-down">
              <h4 className="font-bold text-dark-brand mb-4">Exercise Compliance Dashboard</h4>
              
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-slate-800">Shoulder Rotation</span>
                  <span className="text-xs font-bold text-amber-600">45%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div className="w-[45%] h-full bg-amber-500 rounded-full"></div>
                </div>
                <p className="text-xs text-slate-500">Avg sets: 1.4/2 — when done</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-3">Pain Trend</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="bg-green-100 text-green-700 rounded-md px-2 py-1 text-xs font-bold">W1</span>
                    <span className="text-slate-300">→</span>
                    <span className="bg-amber-100 text-amber-700 rounded-md px-2 py-1 text-xs font-bold">W2</span>
                    <span className="text-slate-300">→</span>
                    <span className="bg-red-100 text-red-700 rounded-md px-2 py-1 text-xs font-bold">W3</span>
                  </div>
                  <span className="text-red-500 text-xs font-bold">↑ Increasing</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 lg:pl-24 z-20">
            <h6 className="text-secondary font-bold text-sm italic mb-4">
              <span className="text-slate-300 mr-2">////</span> Analytics
            </h6>
            <h2 className="text-3xl lg:text-4xl font-bold text-dark-brand mb-6 leading-tight">
              Complete Compliance <br/> Dashboard for Doctors
            </h2>
            <p className="text-base text-slate-500 mb-8 leading-relaxed">
              Before the patient even walks in, the doctor sees their full exercise history — compliance per exercise, partial completions, weekly pain trends, and flagged moments.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-secondary font-bold" />
                </div>
                <span className="text-slate-600 text-sm">Compliance % per exercise</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-secondary font-bold" />
                </div>
                <span className="text-slate-600 text-sm">Weekly pain trend with direction indicator</span>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </section>
  );
};

export default Features;
