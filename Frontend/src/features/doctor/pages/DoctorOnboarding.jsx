import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Activity, UserRound, Phone, Stethoscope, Award, Loader2 } from 'lucide-react';

const DoctorOnboarding = ({ onComplete }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const [formData, setFormData] = useState({
    phone: '',
    specialization: '',
    qualification: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.specialization || !formData.qualification) {
      setError('Specialization and Qualification are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/doctors/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        onComplete(data.profile);
      } else {
        setError(data.message || 'Failed to save profile. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary p-3 rounded-2xl shadow-sm mb-6">
            <Activity className="h-10 w-10 text-light" />
          </div>
          <h1 className="text-4xl font-bold text-heading tracking-tight mb-3">
            Welcome to PhysioCare, Dr. {user?.lastName || user?.firstName || ''}!
          </h1>
          <p className="text-body text-lg max-w-lg">
            We're thrilled to have you on board. Please complete your medical profile before accessing your dashboard.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <UserRound className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-heading">Professional Details</h2>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 text-danger text-sm font-medium rounded-[8px] border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-heading mb-2 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-gray-400" />
                  Medical Specialization *
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  placeholder="e.g. Orthopedic Physiotherapy, Sports Injury Specialist"
                  className="w-full px-4 py-3 rounded-[8px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-heading mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4 text-gray-400" />
                  Qualifications *
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="e.g. BPT, MPT (Ortho), PhD"
                  className="w-full px-4 py-3 rounded-[8px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-heading mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  Contact Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-3 rounded-[8px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50 focus:bg-white"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Patients will use this number if they need to reach you urgently regarding appointments.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-light font-bold py-4 px-6 rounded-[8px] hover:bg-dark hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  'Save & Continue to Dashboard'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorOnboarding;
