import React from 'react';
import { Check, Heart, Users, ActivitySquare } from 'lucide-react';

const AboutUs = () => {
  return (
    <section id="about" className="py-24 bg-slate-50 relative overflow-hidden z-10">
      {/* Decorative Shapes */}
      <img className="absolute top-[10%] left-[5%] animate-up-down hidden lg:block opacity-50 z-0" src="/images/shap/trangle-orange.png" alt="" />
      <img className="absolute bottom-[20%] right-[5%] animate-rotation hidden lg:block opacity-50 z-0" src="/images/shap/circle-dots.png" alt="" />
      <img className="absolute top-[30%] right-[45%] animate-vibrate hidden lg:block opacity-30 z-0" src="/images/shap/plus-orange.png" alt="" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* LEFT COLUMN - Images/Illustration */}
          <div className="w-full lg:w-1/2 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform rotate-[-2deg] transition-transform hover:rotate-0 duration-500 z-10">
              <img 
                src="/images/main-banner/bg1.jpg" 
                alt="PhysioCare About Us" 
                className="w-full h-auto object-cover md:min-h-[450px]"
                style={{ objectPosition: 'left center' }}
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/60 to-transparent"></div>
            </div>
            
            {/* Floating Info Box */}
            <div className="absolute -bottom-8 -right-4 lg:-right-8 bg-white p-6 rounded-2xl shadow-[0_10px_30px_rgba(86,90,207,0.15)] animate-up-down z-20 border border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                <Heart className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-dark-brand mb-1">10k+</h4>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Patients Healed</p>
              </div>
            </div>
          </div>
          
          {/* RIGHT COLUMN - Text Content */}
          <div className="w-full lg:w-1/2 mt-12 lg:mt-0">
            {/* Section Badge */}
            <h6 className="text-secondary font-bold text-sm md:text-base mb-4 inline-flex items-center gap-2 bg-secondary/10 py-1.5 px-4 rounded-full uppercase tracking-wider">
              <ActivitySquare className="w-4 h-4" /> About PhysioCare
            </h6>
            
            <h2 className="text-4xl md:text-5xl font-extrabold text-dark-brand mb-6 leading-tight">
              Bridging the Gap Between <span className="text-primary">Clinic</span> & <span className="text-secondary">Home</span>
            </h2>
            
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              PhysioCare was founded on a simple premise: physical therapy doesn't stop when you leave the clinic. We provide a state-of-the-art platform that empowers doctors to prescribe, track, and manage patient recovery remotely.
            </p>
            
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Our intuitive dashboards ensure that patients stay compliant with their daily exercises, while giving clinics real-time visibility into pain trends and recovery progress.
            </p>
            
            {/* Feature List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-primary/10 p-1.5 rounded-full text-primary">
                  <Check className="w-4 h-4 font-bold" strokeWidth={3} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">Expert Doctors</h5>
                  <p className="text-sm text-slate-500">Verified professionals</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-secondary/10 p-1.5 rounded-full text-secondary">
                  <Check className="w-4 h-4 font-bold" strokeWidth={3} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">Smart Tracking</h5>
                  <p className="text-sm text-slate-500">Live pain monitoring</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-green-500/10 p-1.5 rounded-full text-green-600">
                  <Check className="w-4 h-4 font-bold" strokeWidth={3} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">Custom Exercises</h5>
                  <p className="text-sm text-slate-500">Tailored to your needs</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 bg-blue-500/10 p-1.5 rounded-full text-blue-600">
                  <Users className="w-4 h-4 font-bold" strokeWidth={3} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">Unified Platform</h5>
                  <p className="text-sm text-slate-500">For all medical roles</p>
                </div>
              </div>
            </div>
            
            <button className="px-8 py-3.5 bg-primary text-white font-semibold rounded-md hover:bg-dark-brand transform hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-primary/30">
              Discover More
            </button>
            
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
