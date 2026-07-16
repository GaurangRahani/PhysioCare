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
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/receptionists/patients/create`, {
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-dark/40 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-transparent px-8 py-6 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold text-dark tracking-tight">
              Register Patient
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-danger transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-danger text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2 shadow-sm">
              <X className="w-5 h-5"/> {error}
            </div>
          )}
          
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl text-blue-800 text-sm font-medium flex gap-3 items-start shadow-sm">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>An account will be created automatically. The patient will receive their login credentials via email.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="md:col-span-2 group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <UserRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Kishan Kumar"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">Phone Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 9876543210"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">Email Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="patient@example.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium transition-all shadow-sm appearance-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2 group">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">Address</label>
                <div className="relative">
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Enter full address..."
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-dark font-medium transition-all shadow-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-6 mt-4 border-t border-gray-100 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-4 rounded-xl font-bold text-gray-500 hover:text-dark hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-4 bg-gradient-to-r from-primary to-[#7074e8] text-white font-bold rounded-xl shadow-[0_8px_20px_rgba(86,90,207,0.25)] hover:shadow-[0_8px_25px_rgba(86,90,207,0.4)] hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Register & Send Setup Email
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
