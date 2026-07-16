import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Activity, Users, ShieldCheck } from 'lucide-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-light p-8 rounded shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 border border-gray-50 group">
    <div className="bg-primary/5 w-16 h-16 rounded flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-light transition-colors duration-300">
      <Icon className="h-8 w-8 text-primary group-hover:text-light transition-colors duration-300" />
    </div>
    <h3 className="text-xl font-semibold mb-3 text-heading">{title}</h3>
    <p className="text-body leading-relaxed">{description}</p>
  </div>
);

const Home = () => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-cover bg-center overflow-hidden z-10 min-h-[700px] lg:min-h-[800px] xl:min-h-[1085px] flex items-center" style={{ backgroundImage: "url('/images/main-banner/bg1.jpg')" }}>
        {/* Bottom wave shape */}
        <div className="absolute bottom-0 left-0 w-full h-full bg-no-repeat bg-left-bottom bg-[length:100%] -z-10" style={{ backgroundImage: "url('/images/main-banner/shape1.png')" }}></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-7/12 text-left z-20">
              <h6 className="text-primary font-bold text-lg md:text-xl mb-5 inline-block py-1 px-4 relative">
                We Provide All Health Care Solution
                <span className="absolute inset-0 bg-[url('/images/shap/ext-blue.png')] bg-center bg-repeat opacity-50 -z-10"></span>
              </h6>
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-[55px] font-extrabold text-dark mb-[50px] leading-[1.3]">
                Protect Your Health And Take Care Of Your Health
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/book" className="px-10 py-4 bg-secondary text-light font-semibold rounded hover:bg-dark transition-all duration-300 text-lg shadow-lg">
                  Read More
                </Link>
                <SignedOut>
                  <Link to="/login" className="px-10 py-4 bg-primary text-light font-semibold rounded hover:shadow-lg transition-all duration-300 text-lg">
                    Patient Portal
                  </Link>
                </SignedOut>
                <SignedIn>
                  <Link to="/dashboard" className="px-10 py-4 bg-primary text-light font-semibold rounded hover:shadow-lg transition-all duration-300 text-lg">
                    Go to Dashboard
                  </Link>
                </SignedIn>
              </div>
            </div>
            <div className="md:w-5/12 mt-12 md:mt-0 relative z-20 flex justify-center lg:justify-end">
              <div className="relative animate-[up-down_2.5s_infinite_alternate] lg:-mr-[160px] lg:-ml-[50px]">
                <img src="/images/main-banner/doctor.png" alt="Doctor" className="w-full max-w-lg lg:max-w-none h-auto object-contain z-20 relative" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative shapes exactly mapped from CSS */}
        <img className="absolute bottom-[35%] left-[5%] animate-[pulse_3s_ease-in-out_infinite] hidden md:block" src="/images/shap/trangle-orange.png" alt="" />
        <img className="absolute top-[24%] left-[51%] animate-[bounce_4s_infinite] hidden md:block" src="/images/shap/square-blue.png" alt="" />
        <img className="absolute top-[23%] left-[17%] animate-[pulse_4s_ease-in-out_infinite] hidden md:block" src="/images/shap/chicle-blue-2.png" alt="" />
        <img className="absolute bottom-[15%] left-[41%] animate-[spin_10s_linear_infinite] hidden md:block z-10" src="/images/shap/plus-orange.png" alt="" />
        <img className="absolute bottom-[150px] right-[150px] animate-[pulse_5s_ease-in-out_infinite] hidden xl:block" src="/images/shap/wave-orange.png" alt="" />
      </section>

      {/* Features Section */}
      <section className="py-20 bg-light">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">Why Choose PhysioCare?</h2>
            <p className="text-body text-lg">We combine cutting-edge clinic management with digital patient recovery for optimal results.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={Users}
              title="Expert Therapists"
              description="Our doctors create tailored treatment plans specific to your post-op or injury needs."
            />
            <FeatureCard 
              icon={Activity}
              title="Digital Recovery"
              description="Follow structured, daily exercise routines at home with clear instructions and logging."
            />
            <FeatureCard 
              icon={CalendarCheck}
              title="Easy Scheduling"
              description="Self-book appointments instantly. Our system guarantees exclusivity and seamless updates."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Secure Payments"
              description="Hassle-free online payments via Razorpay or straightforward at-desk options."
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-light mb-6">Ready to get back to your best?</h2>
          <p className="text-light/80 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of patients who have successfully recovered with our comprehensive physiotherapy approach.
          </p>
          <Link to="/book" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-light bg-secondary rounded hover:bg-dark hover:shadow-xl transition-all duration-300">
            Start Your Recovery Today
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
