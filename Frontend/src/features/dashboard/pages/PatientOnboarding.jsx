import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Activity, UserRound, Phone, MapPin, Calendar, HeartPulse, Loader2 } from 'lucide-react';

const PatientOnboarding = ({ onComplete }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const [formData, setFormData] = useState({
    phone: '',
    date_of_birth: '',
    gender: 'other',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_history: ''
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
    if (!formData.date_of_birth || !formData.gender) {
      setError('Date of birth and Gender are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = await getToken();
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/patients/profile`, {
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary p-3 rounded-2xl shadow-sm mb-6">
            <Activity className="h-10 w-10 text-light" />
          </div>
          <h1 className="text-4xl font-bold text-heading tracking-tight mb-3">
            Welcome to PhysioCare, {user?.firstName || 'Patient'}!
          </h1>
          <p className="text-body text-lg max-w-lg">
            Let's get your account set up. Please provide some basic information to complete your patient profile.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <UserRound className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-heading">Personal Details</h2>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 text-danger text-sm font-medium rounded-[8px] border border-red-100">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* DOB */}
              <div>
                <label className="block text-sm font-semibold text-heading mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-semibold text-heading mb-2 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-gray-400" />
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Phone */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-heading mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-heading mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Full Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Health Ave, Mumbai, India"
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark resize-none"
                />
              </div>
            </div>

            <hr className="border-gray-100 my-6" />

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-heading flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-danger" />
                Emergency Contact
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-body mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-body mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-dark"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-dark text-light font-bold py-3.5 px-4 rounded-[8px] transition-colors duration-300 shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientOnboarding;
