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
      <section className="relative bg-primary/5 py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              Accepting New Patients
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-heading mb-6 leading-tight">
              Your Journey to <span className="text-primary">Recovery</span> Starts Here.
            </h1>
            <p className="text-lg md:text-xl text-body mb-10 leading-relaxed max-w-2xl mx-auto">
              Experience a seamless blend of expert in-clinic physiotherapy and dynamic at-home recovery plans, tailored just for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/book" className="w-full sm:w-auto px-8 py-4 bg-primary text-light font-semibold rounded hover:bg-dark hover:shadow-lg transition-all duration-300 text-lg">
                Book an Appointment
              </Link>
              <SignedOut>
                <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-light text-primary font-semibold rounded border border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 text-lg">
                  Patient Portal
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-light text-primary font-semibold rounded border border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 text-lg">
                  Go to Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10 pointer-events-none">
          <svg width="404" height="404" fill="none" viewBox="0 0 404 404" aria-hidden="true">
            <defs>
              <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" fill="currentColor"></rect>
              </pattern>
            </defs>
            <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)"></rect>
          </svg>
        </div>
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
