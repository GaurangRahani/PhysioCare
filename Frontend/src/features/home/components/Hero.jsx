import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const Hero = () => {
  return (
    <section 
      className="relative flex items-center min-h-[700px] lg:min-h-[900px] overflow-hidden z-10 pt-20 lg:pt-0" 
      style={{ backgroundImage: "url('/images/main-banner/bg1.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Bottom wave shape */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[150px] lg:h-[250px] bg-no-repeat bg-left-bottom bg-[length:100%] -z-10" 
        style={{ backgroundImage: "url('/images/main-banner/shape1.png')" }}
      ></div>
      
      {/* Floating Shapes */}
      <img className="absolute bottom-[20%] left-[5%] animate-up-down hidden md:block z-0" src="/images/shap/trangle-orange.png" alt="" />
      <img className="absolute top-[10%] left-[45%] animate-up-down2 hidden md:block z-0 opacity-50" src="/images/shap/square-blue.png" alt="" />
      <img className="absolute top-[10%] left-[15%] animate-left-right hidden md:block z-0" src="/images/shap/chicle-blue-2.png" alt="" />
      <img className="absolute bottom-[20%] left-[45%] animate-vibrate hidden md:block z-0" src="/images/shap/plus-orange.png" alt="" />
      <img className="absolute bottom-[10%] right-[5%] animate-rotation hidden lg:block z-0" src="/images/shap/wave-orange.png" alt="" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 pb-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          {/* LEFT COLUMN */}
          <div className="w-full lg:w-[55%] text-left z-20">
            {/* Pill Badge */}
            <h6 className="text-primary font-bold text-sm md:text-base mb-6 inline-block py-2 px-6 relative z-10 bg-transparent">
              We Provide All Health Care Solution
              <div className="absolute inset-0 bg-[url('/images/shap/ext-blue.png')] bg-cover bg-center bg-no-repeat opacity-40 -z-10 rounded-sm"></div>
            </h6>
            
            {/* Headlines */}
            <h1 className="text-4xl md:text-5xl lg:text-[55px] font-extrabold text-dark-brand mb-6 leading-[1.2]">
              Protect Your Health <br/>And Take Care Of <br/>Your Health
            </h1>
            
            {/* Body */}
            <p className="text-lg text-slate-600 max-w-lg mb-8 leading-relaxed">
              PhysioCare gives doctors a live window into patient recovery between visits — and gives patients a simple daily exercise program they can actually follow.
            </p>
            
            {/* CTA Button */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <Link 
                to="/book" 
                className="px-8 py-3.5 bg-secondary text-white font-semibold rounded-md hover:bg-dark-brand transform hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-secondary/30"
              >
                Read More
              </Link>
            </div>
            
            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mt-6">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Check className="w-4 h-4 text-primary font-bold" strokeWidth={3} /> Doctor-prescribed exercises
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Check className="w-4 h-4 text-primary font-bold" strokeWidth={3} /> Daily progress tracking
              </div>
            </div>
          </div>
          
          {/* RIGHT COLUMN - Dashboard Mockup inside Solid Shape */}
          <div className="w-full lg:w-[45%] mt-12 lg:mt-0 relative z-20 flex justify-center lg:justify-end min-h-[500px]">
            {/* Massive solid blue background block (Rotated to match template exactly) */}
            <div className="absolute top-1/2 -translate-y-1/2 right-[-150px] w-[650px] h-[750px] bg-primary rounded-[60px] transform -rotate-[10deg] -z-10 shadow-[0_20px_50px_rgba(86,90,207,0.3)]"></div>
            
            {/* The Floating Card */}
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-full max-w-[420px] animate-up-down relative z-10 mt-10 lg:mt-0 lg:-ml-12 lg:mr-8">
              
              {/* TOP BAR */}
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span className="text-xs text-slate-400 font-medium ml-2">PhysioCare — Doctor Dashboard</span>
              </div>
              
              {/* PATIENT ROW */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                    GP
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Gaurang Patel</h3>
                    <span className="inline-block bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
                      Follow-up
                    </span>
                  </div>
                </div>
                <button className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-dark-brand transition-colors">
                  Start
                </button>
              </div>
              
              {/* COMPLIANCE BLOCK */}
              <div className="mb-6">
                <div className="mb-3">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-sm font-medium text-slate-700">Neck Stretch</span>
                    <span className="text-xs font-semibold text-green-600">85%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-sm font-medium text-slate-700">Shoulder Rotation</span>
                    <span className="text-xs font-semibold text-amber-600">45%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[45%] h-full bg-amber-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* PAIN TREND ROW */}
              <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">Pain Trend</span>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="bg-green-50 text-green-700 rounded-full px-2 py-1 text-xs font-semibold">Wk1: 2.8</span>
                  <span className="bg-amber-50 text-amber-700 rounded-full px-2 py-1 text-xs font-semibold">Wk2: 4.1</span>
                  <span className="bg-red-50 text-red-700 rounded-full px-2 py-1 text-xs font-semibold">Wk3: 5.8</span>
                  <span className="text-red-500 text-xs font-bold ml-1">↑ Increasing</span>
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default Hero;
