import React from 'react';

const StatsBar = () => {
  return (
    <section className="w-full bg-primary py-12 relative z-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0">
          
          {/* Stat 1 */}
          <div className="text-center lg:border-r border-white/20 last:border-0 px-4">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">3 Roles</h3>
            <p className="text-sm font-medium text-white/80">Doctor, Patient, Receptionist</p>
          </div>
          
          {/* Stat 2 */}
          <div className="text-center lg:border-r border-white/20 last:border-0 px-4">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">Daily Tracking</h3>
            <p className="text-sm font-medium text-white/80">Exercise logs with pain levels</p>
          </div>
          
          {/* Stat 3 */}
          <div className="text-center lg:border-r border-white/20 last:border-0 px-4">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">Smart Scheduling</h3>
            <p className="text-sm font-medium text-white/80">Availability-based booking</p>
          </div>
          
          {/* Stat 4 */}
          <div className="text-center px-4">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-1">Live Compliance</h3>
            <p className="text-sm font-medium text-white/80">Real-time progress monitoring</p>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
