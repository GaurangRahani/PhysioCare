import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, UserPlus, Loader2, Calendar, UserRound, Phone, MapPin, Mail } from 'lucide-react';

const RegisterPatientModal = ({ isOpen, onClose, onRegistered }) => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'other',
    address: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = await getToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${apiUrl}/api/receptionists/patients/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        onRegistered(data.patient);
        onClose();
      } else {
        setError(data.message || 'Failed to register patient');
      }
    } catch (err) {
      console.error("Registration error", err);
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] border border-[#EAEAEA] z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAEAEA] bg-[#F9FAFB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F4F4F4] text-[#202223] flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#202223]">Register New Patient</h2>
              <span className="text-xs text-[#6D7175]">Create a permanent clinic record</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 rounded-md text-[#8A8A8A] hover:text-[#202223] hover:bg-[#EAEAEA] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] text-xs text-[#B42318] rounded-lg flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-[#EBF3FF] border border-[#D0E2FF] rounded-lg text-xs text-[#2F68D6] flex items-start gap-2">
            <Mail className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              A patient profile will be created. Login credentials and instructions will be sent automatically to their email.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#202223] mb-1">
                Full Name *
              </label>
              <div className="relative">
                <UserRound className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 9876543210"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="patient@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                  />
                </div>
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202223] mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223]"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-[#202223] mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-3 pointer-events-none" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Street, City, Postal Code..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#EAEAEA] rounded-lg focus:outline-none focus:border-[#202223] text-[#202223] resize-none"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary-saas text-xs py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-saas inline-flex items-center gap-1.5 text-xs py-2 px-4 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create & Register Patient</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default RegisterPatientModal;
