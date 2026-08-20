import React, { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Activity, UserRound, Phone, MapPin, Calendar, HeartPulse, Loader2 } from 'lucide-react';
import './PatientOnboarding.css';

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
    <div className="patient-onboarding-wrapper">
      {/* Floating Background Shapes */}
      <div className="shape shape-circle"></div>
      <div className="shape shape-plus"></div>

      <div className="main-container">
        {/* Header */}
        <div className="onboarding-header">
          <div className="header-icon">
            <Activity className="h-10 w-10" />
          </div>
          <h1>
            Welcome to PhysioCare, {user?.firstName || 'Patient'}!
          </h1>
          <p>
            Let's get your account set up. Please provide some basic information to complete your patient profile.
          </p>
        </div>

        {/* Form Card */}
        <div className="onboarding-card">
          <div className="card-header">
            <UserRound className="h-6 w-6" />
            <h2>Personal Details</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="onboarding-form">
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-grid">
              {/* DOB */}
              <div className="form-group">
                <label className="form-label">
                  <Calendar className="h-4 w-4" />
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              {/* Gender */}
              <div className="form-group">
                <label className="form-label">
                  <UserRound className="h-4 w-4" />
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Phone */}
              <div className="form-group full-width">
                <label className="form-label">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="form-input"
                />
              </div>

              {/* Address */}
              <div className="form-group full-width">
                <label className="form-label">
                  <MapPin className="h-4 w-4" />
                  Full Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Health Ave, Mumbai, India"
                  rows={2}
                  className="form-textarea"
                />
              </div>
            </div>

            <hr className="section-divider" />

            <div>
              <h3 className="section-title">
                <HeartPulse className="h-5 w-5" />
                Emergency Contact
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-submit"
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
